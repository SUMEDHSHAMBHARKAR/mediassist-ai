# MediAssist

Hospital operations dashboard with a React frontend and FastAPI backend. The
current build uses the included SQLite sample database; AI pages are left as
mock/sample features.

## Run locally

Open two terminals.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirments.txt
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

```powershell
cd frontend
npm install
npm run dev
```

Vite serves the frontend at `http://localhost:5173` and proxies `/api/*` to
the FastAPI service at `http://127.0.0.1:8000`. Register an account in the UI,
then sign in with the same email and password. The backend API documentation is
available at `http://127.0.0.1:8000/docs`.

To restore the built-in demo accounts, profiles, and appointments at any time:

```powershell
cd backend
.\.venv\Scripts\python.exe scripts\seed_demo_data.py
```

## Enable the AI assistant

The first AI feature is the in-app clinical documentation assistant. It sends
requests from the frontend to the FastAPI backend, and only the backend talks
to OpenAI. The API key must never be placed in the frontend or committed to a
repository.

1. Create an API key in the OpenAI platform dashboard.
2. In `backend/.env`, set `AI_ENABLED=true` and paste the key after
   `OPENAI_API_KEY=`.
3. Install the updated backend dependencies, then start the backend and
   frontend as above.

The assistant supports summarisation and documentation help. It is designed to
support clinicians, not to diagnose patients, prescribe treatment, or replace
urgent care. Grounded search and report analysis will be added after the
document-indexing step.

## Checks

```powershell
cd backend; .\.venv\Scripts\python.exe -m pytest
cd frontend; npm run build; npm run lint
```
