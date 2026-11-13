# InterviewGPT Node API

## Setup

```bash
npm ci
```

Copy `.env.example` to `.env` and configure MongoDB, JWT, and the Python AI service URL.

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

## Resume-based interview endpoint

`POST /api/resumes/create-interview`

Authentication: `Authorization: Bearer <JWT>`

Content type: `multipart/form-data`

Fields:
- `resume`: one PDF or DOCX file (maximum 5 MB)
- `role`: string, at least 2 characters
- `experienceLevel`: `Fresher`, `Junior`, `Mid-level`, or `Senior`
- `interviewType`: `Technical`, `Behavioral`, or `Mixed`
- `difficulty`: `Easy`, `Medium`, or `Hard`
- `numberOfQuestions`: integer from 3 to 15 (default 8)

Successful response (201): `{ message, interview, resumeAnalysis }`.

The original resume and extracted text are never stored in MongoDB. The Node API uses Multer memory storage; the Python service extracts and analyzes the file in memory. MongoDB stores the interview configuration and generated questions. Resume analysis is returned to the caller for display and is not persisted.
