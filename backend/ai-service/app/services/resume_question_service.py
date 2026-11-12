
import json
from app.models.resume import ResumeAnalysis
from app.models.resume_questions import ResumeQuestionSet
from app.services.gemini_service import generate_response


def generate_resume_questions(
    analysis: ResumeAnalysis,
    role: str,
    experience_level: str,
    interview_type: str,
    difficulty: str,
    number_of_questions: int = 8,
) -> ResumeQuestionSet:

    if number_of_questions < 3 or number_of_questions > 15:
        raise ValueError(
            "Number of questions must be between 3 and 15."
        )

    if interview_type not in ["Technical", "Behavioral", "Mixed"]:
        raise ValueError("Invalid interview type.")

    if difficulty not in ["Easy", "Medium", "Hard"]:
        raise ValueError("Invalid difficulty.")

    resume_data = analysis.model_dump()

    prompt = f"""
You are a senior technical interviewer.

Generate personalized interview questions based on the
candidate's resume analysis.

INTERVIEW CONFIGURATION:

Job Role: {role}
Experience Level: {experience_level}
Interview Type: {interview_type}
Difficulty: {difficulty}
Number of Questions: {number_of_questions}

CANDIDATE RESUME ANALYSIS:

{json.dumps(resume_data, indent=2)}

QUESTION GENERATION RULES:

1. Every question must be relevant to the candidate's actual
   skills, projects, education or experience.

2. Prioritize project-based questions. Ask about:
   - Architecture and design decisions.
   - Technology choices.
   - Implementation details.
   - Challenges and solutions.
   - Performance and scalability.
   - Testing and deployment.

3. Ask questions that test whether the candidate genuinely
   understands the projects mentioned in the resume.

4. Do not invent project details or assume technologies
   were used unless the resume supports that assumption.

5. Do not ask generic questions unrelated to the candidate's
   profile.

6. Match the difficulty to the requested level.

7. For Behavioral interviews, ask questions about experiences
   explicitly mentioned in the resume. Do not invent situations.

8. For Mixed interviews, include both technical and
   experience-based questions.

9. Avoid duplicate or repetitive questions.

10. Questions should sound natural when spoken aloud.

11. Expected concepts should describe what a strong answer
    should cover. They are not necessarily facts about
    what the candidate actually implemented.

12. Return exactly {number_of_questions} questions.

CATEGORY OPTIONS:
- Project
- Technical
- Conceptual
- Experience
- Behavioral

DIFFICULTY OPTIONS:
- Easy
- Medium
- Hard

Return valid JSON only, using this exact structure:

{{
  "questions": [
    {{
      "question": "Question text",
      "category": "Project",
      "difficulty": "Medium",
      "related_project": "Project name or empty string",
      "topic": "Python",
      "expected_concepts": [
        "Concept one",
        "Concept two"
      ]
    }}
  ]
}}
"""

    try:
        response = generate_response(
            prompt,
            response_mime_type="application/json",
        )

        parsed = json.loads(response)

        question_set = ResumeQuestionSet.model_validate(parsed)

        if len(question_set.questions) != number_of_questions:
            raise RuntimeError(
                "Gemini returned an incorrect number of questions."
            )

        for question in question_set.questions:
            if question.difficulty not in ["Easy", "Medium", "Hard"]:
                raise RuntimeError(
                    "Gemini returned an invalid question difficulty."
                )

            if question.category not in [
                "Project",
                "Technical",
                "Conceptual",
                "Experience",
                "Behavioral",
            ]:
                raise RuntimeError(
                    "Gemini returned an invalid question category."
                )

            if not question.question.strip():
                raise RuntimeError(
                    "Gemini returned an empty question."
                )

        return question_set

    except json.JSONDecodeError as error:
        raise RuntimeError(
            "Gemini returned invalid question JSON."
        ) from error
