
import json

from app.services.gemini_service import generate_response
from app.models.evaluation import AnswerEvaluation


def evaluate_answer(
    question: str,
    answer: str,
    role: str,
    experience_level: str
) -> AnswerEvaluation:

    prompt = f"""
    You are a strict but fair technical interviewer.

    Evaluate the candidate's answer.

    Candidate Role: {role}
    Experience Level: {experience_level}

    Interview Question:
    {question}

    Candidate Answer:
    {answer}

    Evaluate the response on:

    1. Technical accuracy (0-10)
    2. Conceptual understanding (0-10)
    3. Answer relevance (0-10)

    Identify strengths and weaknesses.

    Provide constructive feedback.

    Generate one relevant follow-up question.

    Return ONLY valid JSON in this format:

    {{
        "technical_accuracy": 8,
        "conceptual_understanding": 7,
        "answer_relevance": 9,
        "strengths": ["Correct explanation"],
        "weaknesses": ["Missing practical example"],
        "feedback": "Good explanation...",
        "follow_up_question": "Can you explain..."
    }}
    """

    response = generate_response(prompt)

    result = json.loads(response)

    return AnswerEvaluation.model_validate(result)
