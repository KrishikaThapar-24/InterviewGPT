from typing import Literal

from pydantic import BaseModel, Field

from app.models.resume import ResumeAnalysis


class ResumeInterviewQuestion(BaseModel):
    question: str = Field(min_length=1)
    category: Literal["Project", "Technical", "Conceptual", "Experience", "Behavioral"]
    difficulty: Literal["Easy", "Medium", "Hard"]
    related_project: str = ""
    topic: str = ""
    expected_concepts: list[str] = Field(default_factory=list)


class ResumeQuestionSet(BaseModel):
    questions: list[ResumeInterviewQuestion]


class ResumeQuestionRequest(BaseModel):
    analysis: ResumeAnalysis
    role: str = Field(min_length=2, max_length=120)
    experience_level: Literal["Fresher", "Junior", "Mid-level", "Senior"]
    interview_type: Literal["Technical", "Behavioral", "Mixed"] = "Technical"
    difficulty: Literal["Easy", "Medium", "Hard"] = "Medium"
    number_of_questions: int = Field(default=8, ge=3, le=15)
