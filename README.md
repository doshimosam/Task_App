# TaskFlow — Mini Project Management Tool

A full-stack task management application built with FastAPI, Next.js, and SQLite. Clean, fast, and ready to extend.

---

## Tech Stack

| Layer     | Technology               | Why                                                                          |
|-----------|--------------------------|------------------------------------------------------------------------------|
| Backend   | Python + FastAPI         | Fast to write, auto-generates docs, async-ready, great DX with Pydantic      |
| Database  | SQLite (via SQLAlchemy)  | Zero-config for local dev; swap to PostgreSQL with one env var change        |
| Frontend  | Next.js 15 (App Router)  | React Server Components, great perf, easy deployment on Vercel               |
| Auth      | JWT (PyJWT + bcrypt)     | Stateless, simple, works well for SPAs                                       |
| Docker    | Docker Compose           | One command to run the whole stack                                           |

---

## Project Structure

```
taskflow/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, router registration
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── models/
│   │   │   └── task.py          # Task + User ORM models, enums
│   │   ├── schemas/
│   │   │   └── task.py          # Pydantic request/response schemas
│   │   └── routers/
│   │       ├── tasks.py         # CRUD endpoints for tasks
│   │       └── auth.py          # Register, login, /me endpoints
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── layout.tsx           # Root layout + fonts
│   │   ├── page.tsx             # Main dashboard page
│   │   ├── globals.css          # Design system CSS variables
│   │   ├── lib/
│   │   │   └── api.ts           # Type-safe API client
│   │   └── components/
│   │       ├── SummaryCards.tsx # Pending/Completed/Total counters
│   │       ├── FilterBar.tsx    # Status + priority filters
│   │       ├── TaskTable.tsx    # Sortable task list + inline status update
│   │       ├── TaskForm.tsx     # Create/edit modal
│   │       └── AuthModal.tsx    # Login/register modal
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── TaskFlow_API.postman_collection.json
└── .env.example
```

---

## Getting Started

### Option A — Docker (recommended, one command)

```bash
git clone https://github.com/yourusername/taskflow.git
cd taskflow
docker compose up --build
```

- Frontend: http://localhost:3000  
- Backend API: http://localhost:8000  
- Swagger docs: http://localhost:8000/docs

---

### Option B — Manual Setup

**Backend**

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be live at http://localhost:8000.  
Interactive docs: http://localhost:8000/docs

**Frontend**

```bash
cd frontend

# Install dependencies
npm install

# Set the API URL (optional — defaults to localhost:8000)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start the dev server
npm run dev
```

The dashboard will be live at http://localhost:3000.

---

## API Reference

| Method   | Endpoint                | Description                          | Auth     |
|----------|-------------------------|--------------------------------------|----------|
| `POST`   | `/api/auth/register`    | Register a new user                  | —        |
| `POST`   | `/api/auth/login`       | Login, receive JWT token             | —        |
| `GET`    | `/api/auth/me`          | Get current user profile             | Required |
| `GET`    | `/api/tasks/`           | List all tasks (filterable)          | Optional |
| `GET`    | `/api/tasks/summary`    | Get task count breakdown             | Optional |
| `GET`    | `/api/tasks/{id}`       | Get a single task                    | —        |
| `POST`   | `/api/tasks/`           | Create a new task                    | Optional |
| `PATCH`  | `/api/tasks/{id}`       | Partially update a task              | —        |
| `DELETE` | `/api/tasks/{id}`       | Delete a task                        | —        |
| `GET`    | `/health`               | Health check                         | —        |

**Filter parameters for `GET /api/tasks/`:**
- `status`: `pending` | `in_progress` | `completed`
- `priority`: `low` | `medium` | `high`
- `skip` / `limit`: pagination (default: 0 / 100)

---

## Postman

Import `TaskFlow_API.postman_collection.json` into Postman.

The collection includes:
- Pre-configured requests for all endpoints
- A test script on Login/Register that auto-saves the JWT token to `{{token}}`
- Example request bodies and documented parameters
- Inline example responses

---

## Database

The app uses **SQLite by default** — no setup needed. The database file (`taskflow.db`) is created automatically on first run.

**To switch to PostgreSQL**, just change the environment variable:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/taskflow
```

No code changes required — SQLAlchemy handles the rest.

---

## Authentication

JWT-based authentication with bcrypt password hashing.

- Tokens expire after 24 hours
- Auth is **optional** — tasks can be created as a guest (no `owner_id`)
- Authenticated users see only their own tasks; guests see only unowned tasks
- Change `SECRET_KEY` in production (see `.env.example`)

---

## Deployment

**Backend → Render**

1. Push to GitHub
2. New Web Service → connect repo → set root to `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add env vars: `SECRET_KEY`, `DATABASE_URL`

**Frontend → Vercel**

1. Import the GitHub repo in Vercel
2. Set root directory to `frontend/`
3. Add env var: `NEXT_PUBLIC_API_URL=https://your-render-api.onrender.com`
4. Deploy

---

## What I'd Improve

Given more time, here's what I'd tackle next:

1. **PostgreSQL in production** — SQLite is fine for dev, but a proper Postgres instance (with connection pooling via `asyncpg`) would be needed at scale.

2. **Task ownership enforcement** — currently update/delete endpoints don't verify ownership. I'd add middleware to check `task.owner_id == current_user.id` before mutations.

3. **Refresh tokens** — the current 24hr access token approach is simple but imperfect. A refresh token flow (stored in httpOnly cookies) would be more secure.

4. **Pagination UI** — the API supports `skip`/`limit` but the frontend loads all tasks at once. A proper paginated table or infinite scroll would improve perf with lots of tasks.

5. **Optimistic UI updates** — status changes could update the UI instantly and roll back on failure, rather than waiting for the API response.

6. **Test coverage** — I'd add `pytest` unit tests for the API endpoints and React Testing Library tests for critical UI flows.

7. **Task due dates** — the schema is easy to extend; the UI would benefit from a date picker and overdue indicators.

8. **Drag-and-drop Kanban view** — a second view mode alongside the table, using a library like `@dnd-kit`.
