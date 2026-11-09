
from pydantic import BaseModel, Field


class AnswerEvaluation(BaseModel):
    technical_accuracy: int = Field(ge=0, le=10)
    conceptual_understanding: int = Field(ge=0, le=10)
    answer_relevance: int = Field(ge=0, le=10)

    strengths: list[str]
    weaknesses: list[str]

    feedback: str
    follow_up_question: str
