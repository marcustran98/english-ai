from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.settings import settings
from app.routers.flashcards import router as flashcards_router
from app.routers.grammar import router as grammar_router
from app.routers.speaking import router as speaking_router


def create_app() -> FastAPI:
    app = FastAPI(title="AI English MVP API", version="0.1.0")

    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(speaking_router)
    app.include_router(grammar_router)
    app.include_router(flashcards_router)

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    return app


app = create_app()

