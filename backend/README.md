# ContractFlo Backend

FastAPI service for ContractFlo — AI-Native Contract Intelligence & Contract Operations.

## Requirements

- Python 3.12+
- pip

## Setup

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements-dev.txt
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

## Test

```bash
pytest
```

## Lint

```bash
ruff check .
ruff format --check .
```

## Project layout

```
app/
├── api/           # Route definitions and versioned routers
├── core/          # Config, logging, shared infrastructure
├── models/        # Domain and ORM models
├── schemas/       # Pydantic request/response schemas
├── services/      # Business logic (future phases)
└── repositories/  # Data access layer
```
