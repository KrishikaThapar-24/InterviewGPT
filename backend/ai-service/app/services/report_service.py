
import json
import re

from app.models.report import InterviewReportAnalysis
from app.services.gemini_service import generate_response


def generate_interview_report(
    role: str,
    experience_level: str,
    interview_type: str,
    questions: list[dict],
) -> InterviewReportAnalysis:

    evaluated_questions = []

    for question in questions:
        answer = (question.get("answer") or "").strip()
        evaluation = question.get("evaluation")

        if not answer or not evaluation:
            continue

        evaluated_questions.append({
            "question_id": str(question["question_id"]),
            "question": question["question_text"],
            "candidate_answer": answer,
            "is_correct": evaluation["is_correct"],
        })

    if not evaluated_questions:
        return InterviewReportAnalysis()

    prompt = f"""
You are an expert technical interview evaluator.

Generate a qualitative report based ONLY on the candidate's
actual interview responses.

INTERVIEW DETAILS:
Role: {role}
Experience level: {experience_level}
Interview type: {interview_type}

EVALUATED QUESTIONS AND ANSWERS:
{json.dumps(evaluated_questions, indent=2)}

INSTRUCTIONS:

1. Identify the candidate's demonstrated strengths.
2. Identify technical weaknesses and areas requiring improvement.
3. Generate exactly one concise explanation for every evaluated question.
4. Use the corresponding question_id for each explanation.
5. For correct answers, explain what the candidate demonstrated correctly.
6. For incorrect answers, explain what was missing or misunderstood.
7. Be constructive, professional and specific.
8. Consider the candidate's experience level.
9. Do not invent knowledge, skills or mistakes.
10. Do not generate numerical scores or percentages.
11. Do not include unanswered questions.

Return ONLY valid JSON in this structure:

{{
    "strengths": ["Strength 1"],
    "weaknesses": ["Weakness 1"],
    "question_feedback": [
        {{
            "question_id": "question_id_here",
            "explanation": "Explanation here"
        }}
    ]
}}
"""

    response = generate_response(
        prompt,
        response_mime_type="application/json",
    )

    cleaned = re.sub(
        r"^```(?:json)?\s*|\s*```$",
        "",
        response.strip(),
        flags=re.IGNORECASE,
    ).strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}")

    if start == -1 or end == -1 or end < start:
        raise ValueError("Gemini returned an invalid report response.")

    result = json.loads(cleaned[start:end + 1])

    report = InterviewReportAnalysis.model_validate(result)

    expected_ids = {
        item["question_id"] for item in evaluated_questions
    }

    actual_ids = {
        item.question_id for item in report.question_feedback
    }

    if expected_ids != actual_ids:
        raise ValueError(
            "Gemini did not return feedback for every evaluated question."
        )

    return report
