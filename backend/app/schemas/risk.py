from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class RiskItem(BaseModel):
    title: str
    description: str
    severity: Literal["high", "medium"]
    clause: str | None = None
    recommendation: str
    evidence: str | None = None


class MissingClause(BaseModel):
    clause: str
    importance: Literal["high", "medium"]
    reason: str
    recommendation: str


class RiskAnalysisResult(BaseModel):
    high_risks: list[RiskItem] = Field(default_factory=list)
    medium_risks: list[RiskItem] = Field(default_factory=list)
    missing_clauses: list[MissingClause] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class RiskAnalysisResponse(BaseModel):
    id: UUID
    contract_id: UUID
    risk_score: int
    risk_level: Literal["Low", "Medium", "High"]
    high_risks: list[dict]
    medium_risks: list[dict]
    missing_clauses: list[dict]
    recommendations: list[str]
    model_name: str | None = None
    created_at: datetime
    updated_at: datetime
