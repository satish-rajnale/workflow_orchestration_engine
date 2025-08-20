# Workflow Orchestration Engine

A production-ready but simple orchestration engine with FastAPI + PostgreSQL + Redis + WebSockets and React + Tailwind + React Flow.

## Features
- JWT auth (signup/login)
- Workflow CRUD with visual builder
- Async execution engine supporting delay, notify, http request (mock), and branching
- Real-time execution updates via WebSockets
- Caching via Redis
- Dockerized with docker-compose
- Ready for Railway (backend) and Vercel (frontend)

## Quickstart (Docker)
```bash
docker compose up --build
```
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`

## Local Dev (Backend)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Environment:
- `DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/workflows`
- `REDIS_URL=redis://localhost:6379/0`
- `JWT_SECRET_KEY=changeme`

## Local Dev (Frontend)
```bash
cd frontend
npm i
npm run dev
```
Set `VITE_API_BASE_URL=http://localhost:8000`.

## API (selected)
- POST `/auth/signup`
- POST `/auth/login`
- GET `/auth/me`
- CRUD `/workflows`
- GET `/workflows/{id}/history`
- POST `/workflows/{id}/run`
- WS `/ws/executions/{workflow_id}`

## Testing
- Backend: `pytest` (samples to be added in `backend/tests`)
- Frontend: `npm run test`

## Deployment
- Backend (Railway): build `./backend`, run `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Frontend (Vercel): build with `npm run build`, output `dist/`

## Sample Workflows
- Lead Nurture: start -> delay(5s) -> notify("Thanks for signing up")
- Temperature Control: start -> http_request(mock sensor) -> branch(threshold) -> notify

## Credits
- Built with help from open-source: FastAPI, SQLAlchemy, Redis, React, React Flow, Tailwind, Zustand.
- AI assistant was used to scaffold structure, write boilerplate, and ensure consistency across services.
