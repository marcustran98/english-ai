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
2. Configure **one** LLM provider (precedence is automatic):
   1. **OpenAI** — set `OPENAI_API_KEY` (optional `OPENAI_MODEL`, default `gpt-4.1-mini`).
   2. Else **Azure OpenAI** — set `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, and either `AZURE_OPENAI_DEPLOYMENT_NAME` or `AZURE_OPENAI_MODEL`.
   3. Else **Groq** — set `GROQ_API_KEY` (optional `GROQ_BASE_URL`, default `https://api.groq.com/openai/v1`; optional `GROQ_MODEL`, default `llama-3.3-70b-versatile`). Speaking evaluation uses **chat completions** on Groq’s OpenAI-compatible API.
   4. Else **Grok (xAI)** — set `GROK_API_KEY` (optional `GROK_BASE_URL` / `GROK_MODEL`). Also uses **chat completions**.

   Resolution is implemented in `apps/api/app/ai_provider_factory.py`.

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
  "answer": "Last weekend I go to the coffee with my friend...",
  "part": "part1"
}
```

`part` is optional (`part1` | `part2` | `part3` | `extra`, default `part1`). The question or cue card text lives in `topic` (up to 500 characters). `answer` is usually a speech-to-text transcript (up to 4000 characters).

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
  },
  "scores": {
    "fluency": 6.5,
    "pronunciation": 6.0,
    "grammar": 6.5,
    "vocabulary": 6.5,
    "overall": 6.5
  },
  "sample_answer": "...",
  "key_vocabulary": ["...", "..."]
}
```

## Placeholder modules
- `GET /v1/grammar/health`
- `GET /v1/flashcards/health`

