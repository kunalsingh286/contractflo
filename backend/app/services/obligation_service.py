from __future__ import annotations

import asyncio
from typing import Any
from uuid import UUID

from app.schemas.obligations import ObligationsResponse


class ObligationsServiceError(Exception):
    """Base error for obligations retrieval failures."""


class ObligationsNotFoundError(ObligationsServiceError, LookupError):
    """Raised when no obligations row exists for a contract."""


class ObligationService:
    def __init__(self, supabase_client: Any) -> None:
        self._supabase = supabase_client

    async def get_obligations(self, contract_id: UUID) -> ObligationsResponse:
        try:
            response = await self._run_query(
                self._supabase.table("obligations")
                .select("*")
                .eq("contract_id", str(contract_id))
                .limit(1)
            )
        except Exception as exc:
            raise ObligationsServiceError(
                "Failed to retrieve contract obligations."
            ) from exc

        rows = self._ensure_rows(response)

        if not rows:
            raise ObligationsNotFoundError(
                f"No obligations found for contract {contract_id}"
            )

        return ObligationsResponse.model_validate(rows[0])

    async def _run_query(self, query: Any) -> Any:
        return await asyncio.to_thread(query.execute)

    def _ensure_rows(self, response: Any) -> list[dict[str, Any]]:
        rows = getattr(response, "data", None)
        if rows is None:
            return []
        if isinstance(rows, list):
            return rows
        if isinstance(rows, dict):
            return [rows]
        return []
