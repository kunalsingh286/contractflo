from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID

class ContractBase(BaseModel):
    title: str
    contract_type: str
    status: str
    effective_date: Optional[date] = None
    expiration_date: Optional[date] = None
    renewal_date: Optional[date] = None
    counterparty: Optional[str] = None
    description: Optional[str] = None

class ContractCreate(ContractBase):
    tags: Optional[List[str]] = []

class ContractUpdate(BaseModel):
    title: Optional[str] = None
    contract_type: Optional[str] = None
    status: Optional[str] = None
    effective_date: Optional[date] = None
    expiration_date: Optional[date] = None
    renewal_date: Optional[date] = None
    counterparty: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None

class ContractResponse(ContractBase):
    id: UUID
    organization_id: UUID
    uploaded_by: Optional[UUID] = None
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
    uploaded_by: Optional[UUID] = None
    created_at: datetime
