from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class ContractBase(BaseModel):
    title: str
    contract_type: str
    status: str
    effective_date: date | None = None
    expiration_date: date | None = None
    renewal_date: date | None = None
    counterparty: str | None = None
    description: str | None = None

class ContractCreate(ContractBase):
    tags: list[str] | None = []

class ContractUpdate(BaseModel):
    title: str | None = None
    contract_type: str | None = None
    status: str | None = None
    effective_date: date | None = None
    expiration_date: date | None = None
    renewal_date: date | None = None
    counterparty: str | None = None
    description: str | None = None
    tags: list[str] | None = None

class ContractResponse(ContractBase):
    id: UUID
    organization_id: UUID
    uploaded_by: UUID | None = None
    storage_path: str
    file_name: str
    file_size: int
    mime_type: str
    created_at: datetime
    updated_at: datetime

class ContractTagResponse(BaseModel):
    id: UUID
    contract_id: UUID
    tag_name: str

class ContractVersionResponse(BaseModel):
    id: UUID
    contract_id: UUID
    version_number: int
    storage_path: str
    uploaded_by: UUID | None = None
    created_at: datetime
