from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone
from time import perf_counter
from typing import Any
from uuid import UUID

from app.core.config import settings
from app.schemas.extraction import ContractExtractionResponse, ExtractionStatus
from app.services.ai_service import AIService, AIServiceError
from app.services.document_service import DocumentService, DocumentServiceError


class ExtractionServiceError(Exception):
    """Base error for extraction pipeline failures."""


class ContractNotFoundError(ExtractionServiceError, LookupError):
    """Raised when the requested contract does not exist."""


class ContractStorageDownloadError(ExtractionServiceError, RuntimeError):
    """Raised when the contract PDF cannot be downloaded from storage."""


class ExtractionPersistenceError(ExtractionServiceError, RuntimeError):
    """Raised when extraction state cannot be written to the database."""


class DocumentExtractionPipelineError(ExtractionServiceError, RuntimeError):
    """Raised when text extraction fails during pipeline execution."""


class AIAnalysisPipelineError(ExtractionServiceError, RuntimeError):
    """Raised when Gemini analysis fails during pipeline execution."""


class ExtractionService:
    """Coordinate contract loading, PDF extraction, Gemini analysis, and persistence."""

    def __init__(
        self,
        supabase_client: Any,
        document_service: DocumentService,
        ai_service: AIService,
    ) -> None:
        self._supabase = supabase_client
        self._document_service = document_service
        self._ai_service = ai_service

    async def get_contract_intelligence(
        self,
        contract_id: UUID,
    ) -> ContractExtractionResponse:
        """
        Fetch previously extracted contract intelligence.
        """

        try:
            response = await self._run_query(
                self._supabase.table("contract_extractions")
                .select("*")
                .eq("contract_id", str(contract_id))
                .limit(1)
            )
        except Exception as exc:
            raise ExtractionPersistenceError(
                "Failed to fetch contract intelligence."
            ) from exc

        rows = self._ensure_rows(response)

        if not rows:
            raise ContractNotFoundError(
                f"No intelligence found for contract {contract_id}"
            )

        return ContractExtractionResponse.model_validate(rows[0])

    async def analyze_contract(self, contract_id: UUID) -> ContractExtractionResponse:
        """Run the full extraction pipeline for a contract."""

        started_at = perf_counter()
        contract_row = await self._load_contract(contract_id)

        try:
            await self._upsert_extraction_record(
                contract_id=contract_id,
                payload=self._build_processing_payload(),
            )
            pdf_bytes = await self._download_contract_pdf(contract_row)
            contract_text = await self._document_service.extract_text(pdf_bytes)
            analysis = await self._ai_service.analyze_contract(contract_text)

            completed_payload = self._build_completed_payload(
                contract_id=contract_id,
                analysis=analysis,
                processing_time_ms=self._elapsed_ms(started_at),
            )
            extraction_row = await self._upsert_extraction_record(
                contract_id=contract_id,
                payload=completed_payload,
            )
            await self._upsert_obligations_record(
                contract_id=contract_id,
                obligation_candidates=analysis.get("obligation_candidates") or {},
            )
            return ContractExtractionResponse.model_validate(extraction_row)
        except DocumentServiceError as exc:
            await self._mark_extraction_failed(contract_id, exc, started_at)
            raise DocumentExtractionPipelineError(
                "Document text extraction failed during the pipeline."
            ) from exc
        except AIServiceError as exc:
            await self._mark_extraction_failed(contract_id, exc, started_at)
            raise AIAnalysisPipelineError(
                "Gemini analysis failed during the pipeline."
            ) from exc
        except Exception as exc:
            await self._mark_extraction_failed(contract_id, exc, started_at)
            raise ExtractionServiceError(
                "The extraction pipeline failed unexpectedly."
            ) from exc

    async def _load_contract(self, contract_id: UUID) -> dict[str, Any]:
        try:
            response = await self._run_query(
                self._supabase.table("contracts")
                .select("id, storage_path, file_name, mime_type, title, contract_type")
                .eq("id", str(contract_id))
            )
        except Exception as exc:
            raise ExtractionPersistenceError("Failed to load contract from the database.") from exc

        contract_rows = self._ensure_rows(response)
        if not contract_rows:
            raise ContractNotFoundError(f"Contract {contract_id} was not found.")

        contract_row = contract_rows[0]
        storage_path = contract_row.get("storage_path")
        if not storage_path:
            raise ContractStorageDownloadError(
                f"Contract {contract_id} does not have a storage path."
            )

        return contract_row

    async def _download_contract_pdf(self, contract_row: dict[str, Any]) -> bytes:
        storage_path = contract_row["storage_path"]

        try:
            response = await self._run_storage_download(storage_path)
        except Exception as exc:
            raise ContractStorageDownloadError(
                f"Failed to download contract PDF from storage path '{storage_path}'."
            ) from exc

        if response is None:
            raise ContractStorageDownloadError(
                f"No PDF bytes were returned for storage path '{storage_path}'."
            )

        if isinstance(response, bytes):
            pdf_bytes = response
        elif isinstance(response, bytearray):
            pdf_bytes = bytes(response)
        elif hasattr(response, "read"):
            pdf_bytes = response.read()
        else:
            pdf_bytes = bytes(response)

        if not pdf_bytes:
            raise ContractStorageDownloadError(
                f"Downloaded PDF for storage path '{storage_path}' was empty."
            )

        return pdf_bytes

    async def _mark_extraction_failed(
        self,
        contract_id: UUID,
        error: Exception,
        started_at: float,
    ) -> None:
        failure_payload = {
            **self._build_failure_payload(),
            "processing_time_ms": self._elapsed_ms(started_at),
            "extraction_error": str(error),
        }

        try:
            await self._upsert_extraction_record(
                contract_id=contract_id,
                payload=failure_payload,
            )
        except Exception as exc:
            raise ExtractionPersistenceError(
                "Failed to persist the failed extraction state."
            ) from exc

    def _build_processing_payload(self) -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        return {
            "extraction_status": ExtractionStatus.processing.value,
            "extraction_error": None,
            "extracted_at": None,
            "updated_at": now,
        }

    def _build_failure_payload(self) -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        return {
            "extraction_status": ExtractionStatus.failed.value,
            "extraction_error": None,
            "extracted_at": None,
            "updated_at": now,
        }

    def _build_completed_payload(
        self,
        contract_id: UUID,
        analysis: dict[str, Any],
        processing_time_ms: int,
    ) -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        return {
            "contract_id": str(contract_id),
            "contract_type": analysis.get("contract_type"),
            "parties": analysis.get("parties"),
            "payment_terms": analysis.get("payment_terms"),
            "key_dates": analysis.get("key_dates"),
            "clauses": analysis.get("clauses"),
            "summary": analysis.get("summary"),
            "raw_extraction": analysis,
            "model_name": self._resolve_model_name(),
            "processing_time_ms": processing_time_ms,
            "token_usage": self._extract_token_usage(analysis),
            "extraction_status": ExtractionStatus.completed.value,
            "extraction_error": None,
            "extracted_at": now,
            "updated_at": now,
        }

    def _extract_token_usage(self, analysis: dict[str, Any]) -> dict[str, Any] | None:
        token_usage = analysis.get("token_usage")
        return token_usage if isinstance(token_usage, dict) else None

    def _resolve_model_name(self) -> str:
        model_name = getattr(settings, "GEMINI_MODEL", None) or os.getenv("GEMINI_MODEL")
        if model_name:
            return model_name
        raise ExtractionServiceError("GEMINI_MODEL is not configured.")

    async def _upsert_extraction_record(
        self,
        contract_id: UUID,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        record_payload = {"contract_id": str(contract_id), **payload}

        try:
            response = await self._run_query(
                self._supabase.table("contract_extractions")
                .upsert(
                    record_payload,
                    on_conflict="contract_id",
                    returning="representation",
                )
            )
        except Exception as exc:
            raise ExtractionPersistenceError(
                "Failed to save contract extraction state."
            ) from exc

        rows = self._ensure_rows(response)
        if not rows:
            try:
                response = await self._run_query(
                    self._supabase.table("contract_extractions")
                    .select("*")
                    .eq("contract_id", str(contract_id))
                    .limit(1)
                )
            except Exception as exc:
                raise ExtractionPersistenceError(
                    "Failed to fetch the saved contract extraction record."
                ) from exc

            rows = self._ensure_rows(response)
            if not rows:
                raise ExtractionPersistenceError(
                    "The database did not return the saved extraction record."
                )

        return rows[0]

    async def _upsert_obligations_record(
        self,
        contract_id: UUID,
        obligation_candidates: dict[str, Any],
    ) -> None:
        obligations_payload = {
            "contract_id": str(contract_id),
            "deliverables": obligation_candidates.get("deliverables") or [],
            "payment_obligations": obligation_candidates.get("payment_obligations") or [],
            "notice_periods": obligation_candidates.get("notice_periods") or [],
            "reporting_requirements": obligation_candidates.get("reporting_requirements") or [],
            "renewal_obligations": obligation_candidates.get("renewal_obligations") or [],
        }

        try:
            await self._run_query(
                self._supabase.table("obligations").upsert(
                    obligations_payload,
                    on_conflict="contract_id",
                    returning="representation",
                )
            )
        except Exception as exc:
            raise ExtractionPersistenceError(
                "Failed to save contract obligations."
            ) from exc

    async def _run_query(self, query: Any) -> Any:
        return await asyncio.to_thread(query.execute)

    async def _run_storage_download(self, storage_path: str) -> Any:
        return await asyncio.to_thread(
            self._supabase.storage.from_("contracts").download,
            storage_path,
        )

    def _ensure_rows(self, response: Any) -> list[dict[str, Any]]:
        rows = getattr(response, "data", None)
        if rows is None:
            return []
        if isinstance(rows, list):
            return rows
        if isinstance(rows, dict):
            return [rows]
        return []

    def _elapsed_ms(self, started_at: float) -> int:
        return int((perf_counter() - started_at) * 1000)