from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/v1/flashcards", tags=["flashcards"])


@router.get("/health")
def flashcards_health() -> dict:
    return {"status": "ok", "module": "flashcards", "message": "coming soon"}

