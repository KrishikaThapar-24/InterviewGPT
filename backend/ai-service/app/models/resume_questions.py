
from pydantic import BaseModel, Field

from app.models.resume import ResumeAnalysis
class ResumeInterviewQuestion(BaseModel):
    question: str

    category: str

    difficulty: str

    related_project: str = ""

    topic: str

    expected_concepts: list[str] = Field(default_factory=list)


class ResumeQuestionSet(BaseModel):
    questions: list[ResumeInterviewQuestion]
class ResumeQuestionRequest(BaseModel):
    analysis: ResumeAnalysis

    role: str
    experience_level: str

    interview_type: str = "Technical"
    difficulty: str = "Medium"

    number_of_questions: int = 8