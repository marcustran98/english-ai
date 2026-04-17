from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/v1/grammar", tags=["grammar"])


@router.get("/health")
def grammar_health() -> dict:
    return {"status": "ok", "module": "grammar", "message": "coming soon"}

