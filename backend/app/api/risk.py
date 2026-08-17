from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.api.deps import get_current_user, get_supabase_client
from app.schemas.risk import RiskAnalysisResponse
from app.services.risk_service import (
    RiskContractNotFoundError,
    RiskExtractionNotFoundError,
    RiskService,
    RiskServiceError,
)


router = APIRouter(
    prefix="/contracts",
    tags=["risk intelligence"],
)


@router.post(
    "/{contract_id}/risk-analysis",
    response_model=RiskAnalysisResponse,
)
async def analyze_contract_risks(
    contract_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    """
    Run Phase 4 Risk Intelligence on a contract.

    Prerequisite:
    Phase 3 contract intelligence must already exist.
    """

    service = RiskService(supabase)

    try:
        return await service.analyze_and_persist(contract_id)

    except RiskContractNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except RiskExtractionNotFoundError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except RiskServiceError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


@router.get(
    "/{contract_id}/risks",
    response_model=RiskAnalysisResponse,
)
async def get_contract_risks(
    contract_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    """
    Retrieve the latest saved Phase 4 risk analysis.
    """

    service = RiskService(supabase)

    try:
        return await service.get_risks(contract_id)

    except RiskServiceError as exc:
        if "not been generated" in str(exc):
            raise HTTPException(
                status_code=404,
                detail=str(exc),
            ) from exc

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc
