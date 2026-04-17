# AI English Learning MVP

Monorepo MVP for an AI English learning app.

## Apps
- **Frontend**: Next.js (TypeScript, App Router) in `apps/web`
- **Backend**: FastAPI (Python) in `apps/api`

## Prerequisites
- Node.js + npm
- Python 3

## Environment variables

### Backend (`apps/api`)
1. Copy env example:
   - `cp apps/api/.env.example apps/api/.env`
2. Set:
   - `OPENAI_API_KEY`
   - optional: `OPENAI_MODEL` (default `gpt-4.1-mini`)

### Frontend (`apps/web`)
1. Copy env example:
   - `cp apps/web/.env.example apps/web/.env.local`
2. Optional:
   - `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000`)

## Run locally

### Backend
From repo root:

```bash
python3 -m venv apps/api/.venv
source apps/api/.venv/bin/activate
pip install -r apps/api/requirements.txt

uvicorn app.main:app --reload --port 8000 --app-dir apps/api
```

Backend should be available at `http://localhost:8000`.\n
OpenAPI docs: `http://localhost:8000/docs`

### Frontend
From repo root:

```bash
cd apps/web
npm install
npm run dev
```

Frontend should be available at `http://localhost:3000`.

## Speaking Trainer API

### `POST /v1/speaking/evaluate`
Request:
```json
{
  "topic": "Describe your last weekend",
  "answer": "Last weekend I go to the coffee with my friend..."
}
```

Response shape:
```json
{
  "corrected_version": "...",
  "natural_version": "...",
  "feedback": {
    "grammar_mistakes": [
      {
        "issue": "...",
        "explanation_simple": "...",
        "suggestion": "...",
        "original_snippet": "..."
      }
    ],
    "vocabulary_improvements": [],
    "clarity_comments": []
  }
}
```

## Placeholder modules
- `GET /v1/grammar/health`
- `GET /v1/flashcards/health`

