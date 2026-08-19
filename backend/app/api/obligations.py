from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.api.deps import get_current_user, get_supabase_client
from app.schemas.obligations import ObligationsResponse
from app.services.obligation_service import (
    ObligationsNotFoundError,
    ObligationsServiceError,
    ObligationService,
)


router = APIRouter(
    prefix="/contracts",
    tags=["obligations"],
)


@router.get(
    "/{contract_id}/obligations",
    response_model=ObligationsResponse,
)
async def get_contract_obligations(
    contract_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    service = ObligationService(supabase)

    try:
        return await service.get_obligations(contract_id)

    except ObligationsNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except ObligationsServiceError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc
