# ContractFlo Development Guidelines

Standards and conventions for contributing to the ContractFlo monorepo.

---

## Coding Standards

### General

- Write clear, self-documenting code. Comments explain *why*, not *what*.
- Prefer small, focused modules over large files.
- No dead code, commented-out blocks, or unused imports in committed code.
- All new code must pass linting and tests before merge.

### TypeScript (Frontend)

- Enable strict mode; avoid `any` unless absolutely necessary (document why).
- Use explicit return types on exported functions and hooks.
- Prefer `interface` for object shapes; use `type` for unions and utilities.
- Use async/await over raw Promise chains.
- Server Components by default; add `"use client"` only when interactivity requires it.

### Python (Backend)

- Target Python 3.12+. Use modern syntax (`str | None`, `list[str]`).
- Type-annotate all function signatures.
- Follow PEP 8; enforced by Ruff (line length 88).
- Use Pydantic v2 models for all request/response schemas.
- Async endpoints and I/O by default (`async def`).

---

## Naming Conventions

### TypeScript

| Element | Convention | Example |
|---------|------------|---------|
| Files (components) | kebab-case | `contract-card.tsx` |
| Files (utilities) | kebab-case | `api-client.ts` |
| React components | PascalCase | `ContractCard` |
| Functions / hooks | camelCase | `useContracts`, `fetchHealth` |
| Constants | SCREAMING_SNAKE_CASE | `API_BASE_URL` |
| Types / interfaces | PascalCase | `ContractSummary` |

### Python

| Element | Convention | Example |
|---------|------------|---------|
| Modules / packages | snake_case | `contract_service.py` |
| Classes | PascalCase | `ContractRepository` |
| Functions / methods | snake_case | `get_contract_by_id` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_UPLOAD_SIZE` |
| Pydantic models | PascalCase | `ContractCreate` |
| Private helpers | leading underscore | `_parse_clause` |

### API

| Element | Convention | Example |
|---------|------------|---------|
| URL paths | kebab-case, plural nouns | `/api/v1/contracts` |
| Query params | snake_case | `?page_size=20` |
| JSON fields | snake_case | `{ "created_at": "..." }` |

---

## Folder Conventions

### Monorepo Root

```
contractflo/
├── frontend/       # Next.js application — do not import from backend
├── backend/        # FastAPI application — do not import from frontend
├── docs/           # Architecture, roadmap, guidelines
├── scripts/        # Dev automation and setup scripts
└── .github/        # CI/CD workflows
```

Cross-package imports are forbidden. Frontend and backend communicate only via HTTP.

### Frontend

```
frontend/
├── app/                    # Routes, layouts, pages (App Router)
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   └── layout/             # App shell, nav, sidebar
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities, constants, API helpers
└── types/                  # Shared TypeScript types
```

- One component per file.
- Co-locate component-specific styles; use Tailwind utility classes.
- Place shared types in `types/`; feature-specific types may live next to the feature.

### Backend

```
backend/app/
├── api/
│   └── v1/
│       ├── router.py       # Aggregates v1 routes
│       └── endpoints/      # One file per resource/domain
├── core/                   # Config, logging, dependencies
├── models/                 # SQLAlchemy / domain models
├── schemas/                # Pydantic request/response models
├── services/               # Business logic
└── repositories/           # Database and external I/O
```

**Layer rules:**

1. `endpoints/` — HTTP handling only; validate input, call service, return response.
2. `services/` — Business logic; no HTTP or raw SQL.
3. `repositories/` — Data access; no business rules.
4. `schemas/` — Pydantic models; no logic.
5. `models/` — Persistence models; no API concerns.

---

## Git Workflow

### Branching

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code; protected |
| `feature/<short-description>` | New features |
| `fix/<short-description>` | Bug fixes |
| `chore/<short-description>` | Tooling, deps, docs |

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(frontend): add contract list page shell
fix(backend): correct CORS origin parsing
docs: update architecture diagram
chore(ci): add backend pytest workflow
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`.

### Pull Requests

1. Branch from latest `main`.
2. Keep PRs focused — one logical change per PR.
3. Include a clear description and test plan.
4. All CI checks must pass before merge.
5. Squash merge to `main` (default).

### Code Review

- At least one approval required before merge.
- Review for correctness, security, and adherence to these guidelines.
- Prefer constructive feedback with suggested alternatives.

---

## Environment Management

- Never commit secrets. Use `.env.example` templates.
- Prefix frontend public vars with `NEXT_PUBLIC_`.
- Backend secrets (API keys, database URLs) are server-side only.
- Document new environment variables in `.env.example` and relevant README sections.

---

## Testing

| Area | Tool | Location |
|------|------|----------|
| Backend unit/integration | pytest | `backend/tests/` |
| Frontend lint | ESLint | `frontend/` |

Run before opening a PR:

```bash
# Backend
cd backend && pytest && ruff check .

# Frontend
cd frontend && npm run lint
```

---

## Adding New Features (Checklist)

1. Confirm the feature aligns with the current roadmap phase.
2. Add backend schema → service → repository → endpoint (in that order).
3. Add frontend types → API helper → UI components → page.
4. Update `.env.example` if new config is required.
5. Add tests for non-trivial backend logic.
6. Update documentation if architecture or API contracts change.
