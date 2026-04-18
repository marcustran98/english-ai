from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


SpeakingPart = Literal["part1", "part2", "part3", "extra"]


class SpeakingEvaluateRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=500)
    answer: str = Field(min_length=1, max_length=4000)
    part: SpeakingPart = Field(
        default="part1",
        description="IELTS-style section; shapes feedback and timing expectations.",
    )


class FeedbackItem(BaseModel):
    issue: str = Field(min_length=1, max_length=400)
    explanation_simple: str = Field(min_length=1, max_length=800)
    suggestion: str = Field(min_length=1, max_length=400)
    original_snippet: Optional[str] = Field(default=None, max_length=200)


class SpeakingFeedback(BaseModel):
    grammar_mistakes: List[FeedbackItem] = Field(default_factory=list)
    vocabulary_improvements: List[FeedbackItem] = Field(default_factory=list)
    clarity_comments: List[FeedbackItem] = Field(default_factory=list)


class SpeakingScores(BaseModel):
    """Approximate IELTS-style bands (0.5 steps) inferred mainly from the transcript."""

    fluency: float = Field(ge=1, le=9)
    pronunciation: float = Field(ge=1, le=9)
    grammar: float = Field(ge=1, le=9)
    vocabulary: float = Field(ge=1, le=9)
    overall: float = Field(ge=1, le=9)


class SpeakingEvaluateResponse(BaseModel):
    corrected_version: str = Field(min_length=1, max_length=8000)
    natural_version: str = Field(min_length=1, max_length=8000)
    feedback: SpeakingFeedback
    scores: SpeakingScores
    sample_answer: str = Field(
        min_length=1,
        max_length=8000,
        description="High-band model answer the learner can compare against.",
    )
    key_vocabulary: List[str] = Field(
        default_factory=list,
        max_length=16,
        description="Useful words or chunks for this question.",
    )

