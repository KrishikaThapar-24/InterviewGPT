from fastapi import FastAPI, HTTPException, UploadFile, File

from app.services.resume_service import extract_resume_text
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.services.gemini_service import generate_response

from app.models.evaluation import AnswerEvaluation
from app.services.evaluation_service import evaluate_answer

from app.models.report import ReportRequest, InterviewReportAnalysis
from app.services.report_service import generate_interview_report

from app.services.resume_analysis_service import analyze_resume

from app.models.resume_questions import ResumeQuestionRequest

from app.services.resume_question_service import generate_resume_questions

app = FastAPI(
    title="InterviewGPT API",
    version="1.0.0"
)

class EvaluationRequest(BaseModel):
    question: str
    answer: str
    role: str
    experience_level: str

class QuestionRequest(BaseModel):
    role: str
    experience_level: str
    topic: str


@app.get("/")
def home():
    return {"message": "Welcome to InterviewGPT API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/generate-question")
def generate_question(request: QuestionRequest):

    prompt = f"""
    You are an experienced technical interviewer.

    Generate one challenging but appropriate interview question.

    Candidate role: {request.role}
    Experience: {request.experience_level}
    Topic: {request.topic}

    Return only the interview question.
    """

    try:
        question = generate_response(prompt)

        return {"question": question}

    except Exception as e:
        print("GEMINI ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Question generation failed. Check backend logs."
        )
@app.post(
    "/evaluate-answer",
    response_model=AnswerEvaluation
)
def evaluate_candidate_answer(request: EvaluationRequest):

    try:
        evaluation = evaluate_answer(
            question=request.question,
            answer=request.answer,
            role=request.role,
            experience_level=request.experience_level
        )

        return evaluation

    except Exception as e:
        print("EVALUATION ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Answer evaluation failed."
        )
@app.post(
    "/generate-report",
    response_model=InterviewReportAnalysis,
)
def generate_report_endpoint(request: ReportRequest):
    try:
        return generate_interview_report(
            role=request.role,
            experience_level=request.experience_level,
            interview_type=request.interview_type,
            questions=request.questions,
        )
    except Exception as error:
        print("REPORT GENERATION ERROR:", repr(error))
        raise HTTPException(
            status_code=500,
            detail="Interview report generation failed.",
        ) from error


@app.post("/resume/analyze")
async def analyze_resume_endpoint(
    resume: UploadFile = File(...)
):
    try:
        file_bytes = await resume.read(5 * 1024 * 1024 + 1)

        # Extract resume text.
        extraction = extract_resume_text(
            file_bytes=file_bytes,
            filename=resume.filename or "",
        )

        # Analyze the extracted text using Gemini.
        analysis = analyze_resume(
            extraction["extracted_text"]
        )

        return {
            "message": "Resume analyzed successfully.",
            "file_type": extraction["file_type"],
            "character_count": extraction["character_count"],
            "analysis": analysis.model_dump(),
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except RuntimeError as error:
        print("RESUME ANALYSIS ERROR:", repr(error))

        raise HTTPException(
            status_code=502,
            detail="AI resume analysis failed. Please try again.",
        ) from error

    except Exception as error:
        print("RESUME PROCESSING ERROR:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Resume processing failed.",
        ) from error

    finally:
        await resume.close()

@app.post("/resume/generate-questions")
def generate_resume_questions_endpoint(
    request: ResumeQuestionRequest
):
    try:
        question_set = generate_resume_questions(
            analysis=request.analysis,
            role=request.role,
            experience_level=request.experience_level,
            interview_type=request.interview_type,
            difficulty=request.difficulty,
            number_of_questions=request.number_of_questions,
        )

        return {
            "message": "Resume-based questions generated successfully.",
            "questions": [
                question.model_dump()
                for question in question_set.questions
            ],
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except RuntimeError as error:
        print("RESUME QUESTION GENERATION ERROR:", repr(error))

        raise HTTPException(
            status_code=502,
            detail="Resume-based question generation failed.",
        ) from error

    except Exception as error:
        print("RESUME QUESTION GENERATION ERROR:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Unable to generate resume-based questions.",
        ) from error
