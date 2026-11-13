# InterviewGPT AI Service

## Setup

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.

Run the service from this directory:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Resume processing accepts PDF and DOCX files up to 5 MB. The uploaded file and extracted text are processed in memory and are not written to disk or returned by the API. The Node API stores interview settings and generated questions only.
