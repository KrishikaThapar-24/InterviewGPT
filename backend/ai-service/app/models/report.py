
from pydantic import BaseModel, Field


class QuestionFeedback(BaseModel):
    question_id: str
    explanation: str


class InterviewReportAnalysis(BaseModel):
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    question_feedback: list[QuestionFeedback] = Field(default_factory=list)


class ReportRequest(BaseModel):
    role: str
    experience_level: str
    interview_type: str
    questions: list[dict] = Field(default_factory=list)
