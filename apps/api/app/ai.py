from __future__ import annotations

import json
import logging
from json import JSONDecodeError
from pathlib import Path
from typing import Any, Optional, cast

from openai import APIConnectionError, APIStatusError, APITimeoutError
from pydantic import ValidationError

from app.ai_provider_factory import AIProviderConfig, create_ai_provider_config, provider_label
from app.models import SpeakingEvaluateRequest, SpeakingEvaluateResponse
from app.speaking_eval_coerce import coerce_speaking_evaluate_dict

logger = logging.getLogger(__name__)


def _load_speaking_system_prompt() -> str:
    """Full contents of `prompts/speaking_system.md` are sent as the LLM system message."""
    path = Path(__file__).resolve().parent / "prompts" / "speaking_system.md"
    try:
        return path.read_text(encoding="utf-8").strip()
    except OSError as e:
        raise RuntimeError(f"Cannot read speaking system prompt from {path}: {e}") from e


_SYSTEM_PROMPT = _load_speaking_system_prompt()


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
            "scores": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "fluency": {"type": "number", "minimum": 1, "maximum": 9},
                    "pronunciation": {"type": "number", "minimum": 1, "maximum": 9},
                    "grammar": {"type": "number", "minimum": 1, "maximum": 9},
                    "vocabulary": {"type": "number", "minimum": 1, "maximum": 9},
                    "overall": {"type": "number", "minimum": 1, "maximum": 9},
                },
                "required": ["fluency", "pronunciation", "grammar", "vocabulary", "overall"],
            },
            "sample_answer": {"type": "string"},
            "key_vocabulary": {"type": "array", "items": {"type": "string"}, "maxItems": 16},
        },
        "required": [
            "corrected_version",
            "natural_version",
            "feedback",
            "scores",
            "sample_answer",
            "key_vocabulary",
        ],
    },
}


def _normalize_model_json_text(raw: str) -> str:
    """Strip optional ```json fences some models add around JSON."""
    t = raw.strip()
    if not t.startswith("```"):
        return t
    lines = t.split("\n")
    if not lines:
        return t
    if lines[0].strip().startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    return "\n".join(lines).strip()


def _extract_chat_message_text(completion: Any) -> str:
    choices = getattr(completion, "choices", None)
    if not choices:
        raise RuntimeError("Model returned no choices")
    msg = getattr(choices[0], "message", None)
    content = getattr(msg, "content", None) if msg is not None else None
    if isinstance(content, str) and content.strip():
        return content.strip()
    raise RuntimeError("Model returned no text content")


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


def _api_status_user_message(e: APIStatusError) -> str:
    status = getattr(e, "status_code", "unknown")
    base = f"AI provider returned HTTP {status}"
    msg = getattr(e, "message", None)
    if isinstance(msg, str) and msg.strip():
        base = f"{base}: {msg.strip()}"
    resp = getattr(e, "response", None)
    if resp is not None:
        try:
            snippet = resp.text.strip()[:600]
            if snippet:
                base = f"{base}. Response: {snippet}"
        except Exception:
            pass
    return base


def _eval_via_chat_completions(
    config: AIProviderConfig, user_prompt: str, *, transport: str = "chat.completions"
) -> str:
    """Works with xAI Grok and as a fallback when the Responses API is unavailable."""
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]
    kwargs: dict[str, Any] = {
        "model": config.model,
        "temperature": 0.2,
        "messages": cast(Any, messages),
    }
    if config.provider in ("groq", "grok"):
        kwargs["response_format"] = {"type": "json_object"}
    try:
        completion = config.client.chat.completions.create(**kwargs)
    except APIStatusError as e:
        if config.provider in ("groq", "grok") and getattr(e, "status_code", None) == 400:
            logger.warning("Retrying chat without response_format=json_object (%s)", e)
            completion = config.client.chat.completions.create(
                model=config.model,
                temperature=0.2,
                messages=cast(Any, messages),
            )
        else:
            raise
    text = _extract_chat_message_text(completion)
    logger.info(
        "LLM request succeeded: transport=%s provider=%s model=%s response_chars=%d",
        transport,
        config.provider,
        config.model,
        len(text),
    )
    return text


def _build_user_prompt(req: SpeakingEvaluateRequest) -> str:
    return (
        "Evaluate this speaking answer.\n\n"
        f"Part: {req.part}\n"
        f"Question / cue: {req.topic}\n\n"
        f"Transcript (what the student said): {req.answer}\n\n"
        "Return ONLY one JSON object (no markdown, no code fences, no commentary).\n"
        "Required top-level keys (exact spelling): "
        "corrected_version, natural_version, feedback, scores, sample_answer, key_vocabulary.\n"
        "Inside scores: fluency, pronunciation, grammar, vocabulary, overall (numbers).\n"
        "Inside feedback: grammar_mistakes, vocabulary_improvements, clarity_comments (arrays of objects); "
        "each object needs issue, explanation_simple, suggestion, original_snippet (string or null)."
    )


def _raw_eval_text_from_provider(config: AIProviderConfig, user_prompt: str) -> str:
    """
    Groq and xAI Grok use chat.completions only (OpenAI-compatible hosts).
    OpenAI / Azure try Responses first, then fall back to chat on 403/404/405.
    """
    if config.provider in ("groq", "grok"):
        try:
            return _eval_via_chat_completions(
                config, user_prompt, transport=f"chat.completions({config.provider})"
            )
        except APITimeoutError as e:
            logger.exception("AI request timed out")
            raise RuntimeError("AI request timed out. Please retry in a few seconds.") from e
        except APIConnectionError as e:
            target = provider_label(config.provider)
            logger.exception("Cannot connect to %s", target)
            raise RuntimeError(
                f"Cannot connect to {target}. Check endpoint/network and API configuration."
            ) from e
        except APIStatusError as e:
            logger.exception("%s chat completion failed", provider_label(config.provider))
            raise RuntimeError(_api_status_user_message(e)) from e

    try:
        result = config.client.responses.create(
            model=config.model,
            input=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
        text = _extract_output_text(result)
        logger.info(
            "LLM request succeeded: transport=responses.create provider=%s model=%s response_chars=%d",
            config.provider,
            config.model,
            len(text),
        )
        return text
    except APITimeoutError as e:
        logger.exception("AI request timed out")
        raise RuntimeError("AI request timed out. Please retry in a few seconds.") from e
    except APIConnectionError as e:
        target = provider_label(config.provider)
        logger.exception("Cannot connect to %s", target)
        raise RuntimeError(
            f"Cannot connect to {target}. Check endpoint/network and API configuration."
        ) from e
    except APIStatusError as e:
        code = getattr(e, "status_code", None)
        if code in (403, 404, 405):
            logger.warning(
                "Responses API returned %s for %s; retrying with chat.completions",
                code,
                provider_label(config.provider),
            )
            try:
                return _eval_via_chat_completions(
                    config, user_prompt, transport="chat.completions(fallback)"
                )
            except APITimeoutError:
                logger.exception("Chat completion fallback timed out")
                raise RuntimeError("AI request timed out. Please retry in a few seconds.") from None
            except APIConnectionError as e2:
                logger.exception("Chat completion fallback connection error")
                raise RuntimeError(
                    f"Cannot connect to {provider_label(config.provider)} (chat fallback). "
                    "Check endpoint/network and API configuration."
                ) from e2
            except APIStatusError as e2:
                logger.exception("Chat completion fallback failed")
                raise RuntimeError(_api_status_user_message(e2)) from e2
        logger.exception("AI provider returned status error: %s", code)
        raise RuntimeError(_api_status_user_message(e)) from e


def evaluate_speaking(req: SpeakingEvaluateRequest) -> SpeakingEvaluateResponse:
    config = create_ai_provider_config()
    user_prompt = _build_user_prompt(req)
    text = _raw_eval_text_from_provider(config, user_prompt)
    text = _normalize_model_json_text(text)
    try:
        data = json.loads(text)
    except (TypeError, JSONDecodeError) as e:
        preview = text if isinstance(text, str) else repr(text)
        preview = preview[:300]
        raise RuntimeError(f"Model returned invalid JSON ({type(e).__name__}): {preview}") from e
    data = coerce_speaking_evaluate_dict(data)
    try:
        parsed = SpeakingEvaluateResponse.model_validate(data)
    except ValidationError as e:
        logger.exception("Model JSON failed schema after normalization")
        raise RuntimeError(
            "Model returned JSON in an unexpected shape even after normalization. "
            f"Details: {e.errors()[:5]}"
        ) from e
    logger.info(
        "Speaking evaluation completed: provider=%s model=%s validated_ok=true",
        config.provider,
        config.model,
    )
    return parsed

