
import json
import re

from app.models.evaluation import AnswerEvaluation
from app.services.gemini_service import generate_response


def evaluate_answer(
    question: str,
    answer: str,
    role: str,
    experience_level: str,
) -> AnswerEvaluation:

    prompt = f"""
You are an experienced and fair technical interviewer.

Evaluate the candidate's answer.

Candidate role: {role}
Experience level: {experience_level}

Interview question:
{question}

Candidate answer:
{answer}

Instructions:
1. Decide whether the answer is technically correct.
2. Set is_correct to true if the answer is substantially correct.
3. Set is_correct to false if the answer is incorrect, misleading,
   or does not answer the question.
4. Do not require exact wording.
5. Accept different explanations that communicate the correct concept.
6. Generate exactly one relevant follow-up interview question.
7. If the answer is correct, ask a deeper question about the same concept.
8. If the answer is incorrect, ask a simpler clarifying question.
9. Do not provide scores, feedback, strengths, or weaknesses.

Return exactly this JSON structure:

{{
    "is_correct": true,
    "follow_up_question": "Your follow-up question here"
}}
"""

    response = generate_response(
        prompt,
        response_mime_type="application/json",
    )

    # Remove Markdown code fences if the model includes them.
    cleaned_response = re.sub(
        r"^```(?:json)?\s*|\s*```$",
        "",
        response.strip(),
        flags=re.IGNORECASE,
    ).strip()

    # Extract the JSON object if extra text is present.
    start = cleaned_response.find("{")
    end = cleaned_response.rfind("}")

    if start == -1 or end == -1 or end < start:
        raise ValueError(
            "Gemini did not return a valid JSON object. "
            f"Response received: {cleaned_response[:300]!r}"
        )

    json_text = cleaned_response[start:end + 1]

    try:
        result = json.loads(json_text)
    except json.JSONDecodeError as error:
        raise ValueError(
            f"Gemini returned malformed JSON: {error}"
        ) from error

    return AnswerEvaluation.model_validate(result)
