from __future__ import annotations

import json

from openai import OpenAI

from app.models import SpeakingEvaluateRequest, SpeakingEvaluateResponse
from app.settings import settings


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


def evaluate_speaking(req: SpeakingEvaluateRequest) -> SpeakingEvaluateResponse:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    client = OpenAI(api_key=settings.openai_api_key)
    user_prompt = (
        "Evaluate this speaking answer.\n\n"
        f"Topic: {req.topic}\n\n"
        f"Student answer: {req.answer}\n\n"
        "Return JSON that matches the schema."
    )

    result = client.responses.create(
        model=settings.openai_model,
        input=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": _JSON_SCHEMA,
            "strict": True,
        },
        temperature=0.2,
    )

    text = result.output_text
    data = json.loads(text)
    return SpeakingEvaluateResponse.model_validate(data)

