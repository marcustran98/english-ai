from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class SpeakingEvaluateRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=300)
    answer: str = Field(min_length=1, max_length=4000)


class FeedbackItem(BaseModel):
    issue: str = Field(min_length=1, max_length=400)
    explanation_simple: str = Field(min_length=1, max_length=800)
    suggestion: str = Field(min_length=1, max_length=400)
    original_snippet: Optional[str] = Field(default=None, max_length=200)


class SpeakingFeedback(BaseModel):
    grammar_mistakes: List[FeedbackItem] = Field(default_factory=list)
    vocabulary_improvements: List[FeedbackItem] = Field(default_factory=list)
    clarity_comments: List[FeedbackItem] = Field(default_factory=list)


class SpeakingEvaluateResponse(BaseModel):
    corrected_version: str = Field(min_length=1, max_length=8000)
    natural_version: str = Field(min_length=1, max_length=8000)
    feedback: SpeakingFeedback

