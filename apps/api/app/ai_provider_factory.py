from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Literal, Union

from openai import AzureOpenAI, OpenAI

from app.settings import Settings

logger = logging.getLogger(__name__)

AIProviderKind = Literal["openai", "azure_openai", "groq", "grok"]
AIHttpClient = Union[OpenAI, AzureOpenAI]


@dataclass(frozen=True)
class AIProviderConfig:
    """Resolved LLM client + model for speaking (and future) AI calls."""

    provider: AIProviderKind
    client: AIHttpClient
    model: str


def _azure_ready(s: Settings) -> bool:
    return bool(
        s.azure_openai_endpoint
        and s.azure_openai_api_key
        and (s.azure_openai_deployment_name or s.azure_openai_model)
    )


def _openai_ready(s: Settings) -> bool:
    return bool(s.openai_api_key and s.openai_api_key.strip())


def _groq_ready(s: Settings) -> bool:
    return bool(s.groq_api_key and s.groq_api_key.strip())


def _grok_ready(s: Settings) -> bool:
    return bool(s.grok_api_key and s.grok_api_key.strip())


def provider_label(kind: AIProviderKind) -> str:
    if kind == "openai":
        return "OpenAI"
    if kind == "azure_openai":
        return "Azure OpenAI"
    if kind == "groq":
        return "Groq"
    return "xAI Grok"


def create_ai_provider_config(settings: Settings | None = None) -> AIProviderConfig:
    """
    Provider priority (first match wins):
    1. OpenAI — OPENAI_API_KEY set
    2. Azure OpenAI — endpoint, API key, and deployment or model set
    3. Groq — GROQ_API_KEY set (OpenAI-compatible chat completions)
    4. Grok (xAI) — GROK_API_KEY set
    """
    from app.settings import settings as app_settings

    s = settings if settings is not None else app_settings

    if _openai_ready(s):
        logger.info(
            "LLM client selected: provider=openai priority=1 model=%s (OpenAI API)",
            s.openai_model,
        )
        return AIProviderConfig(
            provider="openai",
            client=OpenAI(api_key=s.openai_api_key),
            model=s.openai_model,
        )

    if _azure_ready(s):
        model = s.azure_openai_deployment_name or s.azure_openai_model or s.openai_model
        logger.info(
            "LLM client selected: provider=azure_openai priority=2 model=%s endpoint=%s",
            model,
            s.azure_openai_endpoint,
        )
        client = AzureOpenAI(
            api_key=s.azure_openai_api_key,
            api_version=s.azure_openai_api_version,
            azure_endpoint=s.azure_openai_endpoint or "",
        )
        return AIProviderConfig(provider="azure_openai", client=client, model=model)

    if _groq_ready(s):
        base = (s.groq_base_url or "https://api.groq.com/openai/v1").rstrip("/")
        logger.info(
            "LLM client selected: provider=groq priority=3 model=%s base_url=%s",
            s.groq_model,
            base,
        )
        return AIProviderConfig(
            provider="groq",
            client=OpenAI(
                api_key=s.groq_api_key,
                base_url=base,
            ),
            model=s.groq_model,
        )

    if _grok_ready(s):
        base = (s.grok_base_url or "https://api.x.ai/v1").rstrip("/")
        logger.info(
            "LLM client selected: provider=grok priority=4 model=%s base_url=%s",
            s.grok_model,
            base,
        )
        return AIProviderConfig(
            provider="grok",
            client=OpenAI(
                api_key=s.grok_api_key,
                base_url=base,
            ),
            model=s.grok_model,
        )

    raise RuntimeError(
        "No AI provider configured. Set one of: OPENAI_API_KEY; or Azure OpenAI "
        "(AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT_NAME or "
        "AZURE_OPENAI_MODEL); or GROQ_API_KEY; or GROK_API_KEY."
    )
