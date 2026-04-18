from __future__ import annotations

from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4.1-mini"
    azure_openai_endpoint: Optional[str] = None
    azure_openai_deployment_name: Optional[str] = None
    azure_openai_model: Optional[str] = None
    azure_openai_api_version: str = "2024-12-01-preview"
    azure_openai_api_key: Optional[str] = None

    cors_origins: str = "http://localhost:3000"


settings = Settings()

