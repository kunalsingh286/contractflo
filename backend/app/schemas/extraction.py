from enum import Enum
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class ExtractionStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class ContractExtractionResponse(BaseModel):
    id: UUID
    contract_id: UUID
    contract_type: str | None = None
    parties: dict[str, Any] | None = None
    payment_terms: dict[str, Any] | None = None
    key_dates: dict[str, Any] | None = None
    clauses: dict[str, Any] | None = None
    summary: str | None = None
    obligation_candidates: dict[str, Any] | None = None
    extraction_status: ExtractionStatus
    extraction_error: str | None = None
    extracted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    raw_extraction: dict[str, Any] | None = None
    model_name: str | None = None
    processing_time_ms: int | None = None
    token_usage: dict[str, Any] | None = None
