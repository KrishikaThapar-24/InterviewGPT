from pydantic import BaseModel, Field


class AnswerEvaluation(BaseModel):
    is_correct: bool = Field(
        description="Whether the candidate's answer is technically correct."
    )

    follow_up_question: str = Field(
        description="A relevant follow-up interview question."
    )