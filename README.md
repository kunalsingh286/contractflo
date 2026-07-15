# ContractFlo

**AI-Native Contract Intelligence & Contract Operations Platform**

ContractFlo helps organizations ingest, understand, search, and operate on contracts using modern AI — from clause extraction and semantic search to agent-driven review workflows.

This repository is a monorepo containing the frontend, backend, documentation, and shared tooling.

---

## Architecture

```
contractflo/
├── frontend/     Next.js 15 · TypeScript · Tailwind · shadcn/ui  →  Vercel
├── backend/      FastAPI · Python 3.12                          →  Railway
├── docs/         Architecture, roadmap, development guidelines
├── scripts/      Developer setup and automation
└── .github/      CI workflows
```

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python 3.12 |
| Database | Supabase PostgreSQL |
| Vector DB | Qdrant Cloud |
| AI | Gemini API, LangGraph |
| Deployment | Vercel (frontend), Railway (backend) |

See [docs/architecture.md](./docs/architecture.md) for the full system design.

---

## Prerequisites

- **Node.js** 20+ and npm
- **Python** 3.12+
- **Git**

---

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd contractflo
```

### 2. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements-dev.txt
copy .env.example .env        # Windows
# cp .env.example .env        # macOS / Linux

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs  
Health check: http://localhost:8000/api/v1/health

### 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env.local  # Windows
# cp .env.example .env.local  # macOS / Linux

npm run dev
```

App: http://localhost:3000

### 4. Automated setup (optional)

```powershell
# Windows
.\scripts\setup-dev.ps1

# macOS / Linux
./scripts/setup-dev.sh
```

### 5. Supabase Configuration

This project requires a Supabase project for authentication and database services.
To set this up:

1. **Create a project** on [Supabase](https://supabase.com/).
2. **Environment Variables**: Add your Supabase URL and Anon Key to `.env.local` in `frontend/` and `.env` in `backend/`.
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. **Database Migrations**: Run the SQL script found in `supabase/migrations/` using the Supabase SQL Editor in your dashboard, or via the Supabase CLI (`supabase db push`) to create the required tables and security policies.

---

## Development

| Task | Command |
|------|---------|
| Frontend dev server | `cd frontend && npm run dev` |
| Frontend lint | `cd frontend && npm run lint` |
| Frontend build | `cd frontend && npm run build` |
| Backend dev server | `cd backend && uvicorn app.main:app --reload` |
| Backend tests | `cd backend && pytest` |
| Backend lint | `cd backend && ruff check .` |

Guidelines: [docs/development-guidelines.md](./docs/development-guidelines.md)

---

## Roadmap Summary

| Phase | Focus |
|-------|-------|
| **0** | Foundation — monorepo, tooling, docs *(current)* |
| **1** | Authentication & multi-tenancy |
| **2** | Database & core data models |
| **3** | Contract ingestion |
| **4** | Parsing & extraction |
| **5** | Vector search & embeddings |
| **6** | AI analysis & Q&A |
| **7** | LangGraph workflows |
| **8** | Contract operations |
| **9** | Integrations & API platform |
| **10** | Production hardening & scale |

Full roadmap: [docs/roadmap.md](./docs/roadmap.md)

---

## Phase 0-2 Scope

**Phase 0 (Foundation)**: Delivered the monorepo structure, Next.js/FastAPI scaffolds, and documentation.
**Phase 1 (Authentication)**: Delivered Supabase Auth, organizations management, and RLS policies.
**Phase 2 (Repository)**: Delivered the production-grade Contract Repository, including:
- Supabase SQL schema for contracts and tags with strict RLS.
- Secure file upload and download via Supabase Storage.
- FastAPI REST endpoints (`/api/v1/contracts`).
- Modern UI for uploading, listing, and viewing contracts using `shadcn/ui`.

---

## License

Proprietary — All rights reserved.
