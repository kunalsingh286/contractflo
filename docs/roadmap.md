# ContractFlo Roadmap

This roadmap defines the phased delivery plan for ContractFlo from foundation to production-ready SaaS.

---

## Phase 0 — Foundation (Current)

**Goal:** Production-grade monorepo structure and developer experience.

- Monorepo layout (`frontend/`, `backend/`, `docs/`, `scripts/`, `.github/`)
- Next.js 15 + TypeScript + Tailwind + shadcn-ready frontend
- FastAPI backend with layered architecture
- Health check endpoint
- Architecture, roadmap, and development guidelines documentation
- CI pipeline skeleton
- Environment configuration templates

**Out of scope:** Authentication, business logic, AI features.

---

## Phase 1 — Authentication & Multi-Tenancy

**Goal:** Secure, tenant-isolated user access.

- Supabase Auth integration (email/password, OAuth)
- JWT validation on backend
- Organization (tenant) model and membership
- Role-based access control (RBAC) foundation
- Protected routes on frontend
- User profile and organization settings UI

---

## Phase 2 — Database & Core Data Models

**Goal:** Persistent contract and organization data.

- Supabase PostgreSQL connection and migration tooling
- Core models: Organization, User, Contract, Document, Tag
- Repository layer with async SQLAlchemy or Supabase client
- Database seed scripts for development
- Audit fields (created_at, updated_at, created_by)

---

## Phase 3 — Contract Ingestion

**Goal:** Upload and store contract documents.

- File upload API (PDF, DOCX)
- Object storage integration (Supabase Storage or S3-compatible)
- Document metadata extraction (filename, size, type)
- Contract listing and detail views in frontend
- Basic document viewer

---

## Phase 4 — Contract Parsing & Extraction

**Goal:** Structured data from unstructured contracts.

- PDF/DOCX text extraction pipeline
- Clause segmentation and classification
- Key field extraction (parties, dates, values, terms)
- Extraction results stored in PostgreSQL
- Extraction review UI

---

## Phase 5 — Vector Search & Embeddings

**Goal:** Semantic search across contract corpus.

- Qdrant Cloud integration
- Embedding pipeline (Gemini embeddings)
- Chunking strategy for contract clauses
- Semantic search API
- Search UI with relevance ranking

---

## Phase 6 — AI Analysis & Q&A

**Goal:** Intelligent contract understanding.

- Gemini API integration
- Contract summarization
- Risk and obligation identification
- Natural language Q&A over single contracts
- Analysis results caching

---

## Phase 7 — LangGraph Workflows

**Goal:** Multi-step AI agent orchestration.

- LangGraph workflow definitions
- Contract review workflows (e.g., redline analysis, compliance check)
- Workflow state persistence
- Human-in-the-loop approval steps
- Workflow monitoring and retry logic

---

## Phase 8 — Contract Operations

**Goal:** Operational workflows beyond analysis.

- Contract lifecycle states (draft, active, expired, terminated)
- Renewal and expiration alerts
- Task and assignment management
- Activity timeline and notifications
- Dashboard with KPIs

---

## Phase 9 — Integrations & API Platform

**Goal:** Connect ContractFlo to external systems.

- Public REST API with API keys
- Webhooks for contract events
- CRM/ERP integration adapters (Salesforce, HubSpot)
- Bulk import/export
- API documentation portal

---

## Phase 10 — Production Hardening & Scale

**Goal:** Enterprise-ready reliability and observability.

- Rate limiting and request throttling
- Comprehensive observability (metrics, tracing, alerting)
- Load testing and performance optimization
- Disaster recovery and backup strategy
- SOC 2 / security audit preparation
- SLA monitoring and uptime dashboards

---

## Guiding Principles

1. **Ship incrementally** — Each phase delivers user-visible value.
2. **Keep layers clean** — API → Service → Repository; no shortcuts.
3. **Security by default** — Auth and tenant isolation before feature velocity.
4. **Document decisions** — Update `docs/architecture.md` when architecture changes.
