from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from json import JSONDecodeError
from typing import Any, Literal, Optional, Union

from openai import APIConnectionError, APIStatusError, APITimeoutError, AzureOpenAI, OpenAI

from app.models import SpeakingEvaluateRequest, SpeakingEvaluateResponse
from app.settings import settings

logger = logging.getLogger(__name__)
AIProvider = Literal["openai", "azure_openai"]
AIClient = Union[OpenAI, AzureOpenAI]


@dataclass(frozen=True)
class AIProviderConfig:
    provider: AIProvider
    client: AIClient
    model: str


_SYSTEM_PROMPT = """You are an English speaking coach.

Your job:
- Correct the student's answer (grammar and phrasing).
- Rewrite it to sound natural and native (still same meaning).
- Give simple, actionable feedback.

Guidelines:
- Keep explanations short and easy.
- Avoid complex grammar terms.
- Be kind and encouraging.
- Do NOT add new facts. Keep the meaning.
"""


_JSON_SCHEMA = {
    "name": "speaking_evaluation",
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "corrected_version": {"type": "string"},
            "natural_version": {"type": "string"},
            "feedback": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "grammar_mistakes": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "issue": {"type": "string"},
                                "explanation_simple": {"type": "string"},
                                "suggestion": {"type": "string"},
                                "original_snippet": {"type": ["string", "null"]},
                            },
                            "required": ["issue", "explanation_simple", "suggestion", "original_snippet"],
                        },
                    },
                    "vocabulary_improvements": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "issue": {"type": "string"},
                                "explanation_simple": {"type": "string"},
                                "suggestion": {"type": "string"},
                                "original_snippet": {"type": ["string", "null"]},
                            },
                            "required": ["issue", "explanation_simple", "suggestion", "original_snippet"],
                        },
                    },
                    "clarity_comments": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "issue": {"type": "string"},
                                "explanation_simple": {"type": "string"},
                                "suggestion": {"type": "string"},
                                "original_snippet": {"type": ["string", "null"]},
                            },
                            "required": ["issue", "explanation_simple", "suggestion", "original_snippet"],
                        },
                    },
                },
                "required": ["grammar_mistakes", "vocabulary_improvements", "clarity_comments"],
            },
        },
        "required": ["corrected_version", "natural_version", "feedback"],
    },
}


def _extract_output_text(result: Any) -> str:
    """
    The OpenAI SDK's Response object shape can vary by version/features.
    Try the common `output_text` convenience first, then fall back to reading
    text chunks from `output`.
    """
    text = getattr(result, "output_text", None)
    if isinstance(text, str) and text.strip():
        return text

    output = getattr(result, "output", None)
    if not isinstance(output, list):
        raise RuntimeError("Model returned no text output")

    parts: list[str] = []
    for item in output:
        contents = getattr(item, "content", None)
        if not isinstance(contents, list):
            continue
        for c in contents:
            chunk_text: Optional[str] = getattr(c, "text", None)
            if isinstance(chunk_text, str) and chunk_text:
                parts.append(chunk_text)

    combined = "".join(parts).strip()
    if not combined:
        raise RuntimeError("Model returned no text output")
    return combined


def _build_provider_config() -> AIProviderConfig:
    if settings.azure_openai_endpoint:
        if not settings.azure_openai_api_key:
            raise RuntimeError("AZURE_OPENAI_API_KEY is not set")
        if not settings.azure_openai_deployment_name and not settings.azure_openai_model:
            raise RuntimeError("AZURE_OPENAI_DEPLOYMENT_NAME or AZURE_OPENAI_MODEL is not set")

        client = AzureOpenAI(
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            azure_endpoint=settings.azure_openai_endpoint,
        )
        model = settings.azure_openai_deployment_name or settings.azure_openai_model or settings.openai_model
        return AIProviderConfig(provider="azure_openai", client=client, model=model)

    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    return AIProviderConfig(
        provider="openai",
        client=OpenAI(api_key=settings.openai_api_key),
        model=settings.openai_model,
    )


def _build_user_prompt(req: SpeakingEvaluateRequest) -> str:
    return (
        "Evaluate this speaking answer.\n\n"
        f"Topic: {req.topic}\n\n"
        f"Student answer: {req.answer}\n\n"
        "Return ONLY valid JSON that matches the schema. Do not include markdown, code fences, or extra text."
    )


def _create_ai_response(config: AIProviderConfig, user_prompt: str) -> Any:
    try:
        return config.client.responses.create(
            model=config.model,
            input=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
    except APITimeoutError as e:
        logger.exception("AI request timed out")
        raise RuntimeError("AI request timed out. Please retry in a few seconds.") from e
    except APIConnectionError as e:
        target = "Azure OpenAI" if config.provider == "azure_openai" else "OpenAI"
        logger.exception("Cannot connect to %s", target)
        raise RuntimeError(
            f"Cannot connect to {target}. Check endpoint/network and API configuration."
        ) from e
    except APIStatusError as e:
        status = getattr(e, "status_code", "unknown")
        logger.exception("AI provider returned status error: %s", status)
        raise RuntimeError(f"AI provider returned an error (status {status}).") from e


def evaluate_speaking(req: SpeakingEvaluateRequest) -> SpeakingEvaluateResponse:
    config = _build_provider_config()
    user_prompt = _build_user_prompt(req)
    result = _create_ai_response(config, user_prompt)

    text = _extract_output_text(result)
    try:
        data = json.loads(text)
    except (TypeError, JSONDecodeError) as e:
        preview = text if isinstance(text, str) else repr(text)
        preview = preview[:300]
        raise RuntimeError(f"Model returned invalid JSON ({type(e).__name__}): {preview}") from e
    return SpeakingEvaluateResponse.model_validate(data)

