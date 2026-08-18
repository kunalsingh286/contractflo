from datetime import date

from pydantic import BaseModel, Field


class SearchEvidence(BaseModel):
    section_title: str | None = None
    page_number: int | None = None
    excerpt: str

class SearchResultSchema(BaseModel):
    contract_id: str
    title: str
    contract_type: str | None = None
    counterparty: str | None = None
    status: str
    risk_level: str | None = None
    risk_score: int | None = None
    expiration_date: date | str | None = None
    relevance_score: float
    match_reasons: list[str] = Field(default_factory=list)
    evidence: list[SearchEvidence] = Field(default_factory=list)

class SearchResponseSchema(BaseModel):
    results: list[SearchResultSchema]
    total_count: int
    page: int
    page_size: int
    applied_filters: dict
