from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class ObligationsResponse(BaseModel):
    id: UUID
    contract_id: UUID
    deliverables: list[Any] | None = None
    payment_obligations: list[Any] | None = None
    notice_periods: list[Any] | None = None
    reporting_requirements: list[Any] | None = None
    renewal_obligations: list[Any] | None = None
    created_at: datetime
    updated_at: datetime
