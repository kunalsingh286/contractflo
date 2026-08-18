from pydantic import BaseModel


class ContractTypeCount(BaseModel):
    contract_type: str
    count: int

class LifecycleCount(BaseModel):
    status: str
    count: int

class RiskDistribution(BaseModel):
    high: int = 0
    medium: int = 0
    low: int = 0
    critical: int = 0

class UpcomingRenewal(BaseModel):
    contract_id: str
    title: str
    contract_type: str | None
    counterparty: str | None
    renewal_date: str | None
    expiration_date: str | None
    days_remaining: int
    risk_level: str | None

class ObligationMetrics(BaseModel):
    total: int = 0
    overdue: int = 0
    due_soon: int = 0

class HighRiskContract(BaseModel):
    contract_id: str
    title: str
    contract_type: str | None
    counterparty: str | None
    risk_score: int | None
    risk_level: str | None

class AnalyticsDashboardSchema(BaseModel):
    total_contracts: int
    contracts_by_type: list[ContractTypeCount]
    risk_distribution: RiskDistribution
    lifecycle_distribution: list[LifecycleCount]
    upcoming_renewals: list[UpcomingRenewal]
    open_obligations: ObligationMetrics
    high_risk_contracts: list[HighRiskContract]
