from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.ai import evaluate_speaking
from app.models import SpeakingEvaluateRequest, SpeakingEvaluateResponse

router = APIRouter(prefix="/v1/speaking", tags=["speaking"])


@router.post("/evaluate", response_model=SpeakingEvaluateResponse)
def speaking_evaluate(payload: SpeakingEvaluateRequest) -> SpeakingEvaluateResponse:
    try:
        return evaluate_speaking(payload)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Evaluation failed")

