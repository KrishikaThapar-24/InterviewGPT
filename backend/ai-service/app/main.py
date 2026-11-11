
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.services.gemini_service import generate_response

from app.models.evaluation import AnswerEvaluation
from app.services.evaluation_service import evaluate_answer

from app.models.report import ReportRequest, InterviewReportAnalysis
from app.services.report_service import generate_interview_report

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