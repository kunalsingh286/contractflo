from __future__ import annotations

import asyncio
import json
import os
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.core.config import settings
from app.schemas.risk import (
    MissingClause,
    RiskAnalysisResult,
    RiskAnalysisResponse,
    RiskItem,
)


class RiskServiceError(Exception):
    """Base error for risk analysis failures."""


class RiskContractNotFoundError(RiskServiceError):
    """Raised when the requested contract does not exist."""


class RiskExtractionNotFoundError(RiskServiceError):
    """Raised when Phase 3 intelligence is unavailable."""


class RiskAIError(RiskServiceError):
    """Raised when AI-based risk analysis fails."""


class _GeminiRiskResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    high_risks: list[RiskItem] = Field(default_factory=list)
    medium_risks: list[RiskItem] = Field(default_factory=list)
    missing_clauses: list[MissingClause] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class RiskService:
    """
    Phase 4 Risk Intelligence Engine.
    """

    def __init__(self, supabase_client: Any | None = None) -> None:
        self._supabase = supabase_client
        self._client: Any | None = None

    async def analyze_contract(
        self,
        contract_id: UUID,
        extraction: dict[str, Any] | None = None,
        contract: dict[str, Any] | None = None,
    ) -> RiskAnalysisResult:
        """
        Analyze a contract using Phase 3 extraction data.

        The real production path requires Gemini.
        """

        if extraction is None:
            if self._supabase is None:
                raise RiskExtractionNotFoundError(
                    "No Phase 3 extraction was supplied and Supabase "
                    "is not configured."
                )

            extraction = await self._get_extraction(str(contract_id))

        analysis_input = self._build_analysis_input(
            contract or {},
            extraction,
        )

        api_key = self._resolve_api_key()

        if not api_key:
            raise RiskAIError(
                "GEMINI_API_KEY is not configured. "
                "Real risk analysis cannot be performed yet."
            )

        analysis = await self._call_gemini(analysis_input)

        return self._deduplicate_analysis(analysis)

    async def analyze_and_persist(
        self,
        contract_id: UUID,
    ) -> RiskAnalysisResponse:
        """
        Production flow:
        Supabase → Phase 3 extraction → Gemini → contract_risks.
        """

        if self._supabase is None:
            raise RiskServiceError(
                "Supabase is required for risk persistence."
            )

        contract_id_str = str(contract_id)

        contract = await self._get_contract(contract_id_str)
        extraction = await self._get_extraction(contract_id_str)

        analysis = await self.analyze_contract(
            contract_id=contract_id,
            extraction=extraction,
            contract=contract,
        )

        score = self._calculate_risk_score(analysis)
        risk_level = self._get_risk_level(score)

        record = {
            "contract_id": contract_id_str,
            "risk_score": score,
            "risk_level": risk_level,
            "high_risks": [
                item.model_dump(mode="json")
                for item in analysis.high_risks
            ],
            "medium_risks": [
                item.model_dump(mode="json")
                for item in analysis.medium_risks
            ],
            "missing_clauses": [
                item.model_dump(mode="json")
                for item in analysis.missing_clauses
            ],
            "recommendations": analysis.recommendations,
            "model_name": self._resolve_model_name(),
        }

        try:
            response = await self._run_query(
                self._supabase
                .table("contract_risks")
                .upsert(
                    record,
                    on_conflict="contract_id",
                    returning="representation",
                )
            )
        except Exception as exc:
            raise RiskServiceError(
                "Failed to save risk analysis."
            ) from exc

        rows = self._ensure_rows(response)

        if not rows:
            try:
                response = await self._run_query(
                    self._supabase
                    .table("contract_risks")
                    .select("*")
                    .eq("contract_id", contract_id_str)
                    .limit(1)
                )
            except Exception as exc:
                raise RiskServiceError(
                    "Failed to retrieve saved risk analysis."
                ) from exc

            rows = self._ensure_rows(response)

        if not rows:
            raise RiskServiceError(
                "Risk analysis was generated but was not saved."
            )

        return RiskAnalysisResponse.model_validate(rows[0])

    async def get_risks(
        self,
        contract_id: UUID,
    ) -> RiskAnalysisResponse:
        if self._supabase is None:
            raise RiskServiceError(
                "Supabase is required to retrieve persisted risks."
            )

        contract_id_str = str(contract_id)

        try:
            response = await self._run_query(
                self._supabase
                .table("contract_risks")
                .select("*")
                .eq("contract_id", contract_id_str)
                .limit(1)
            )
        except Exception as exc:
            raise RiskServiceError(
                "Failed to retrieve risk analysis."
            ) from exc

        rows = self._ensure_rows(response)

        if not rows:
            raise RiskServiceError(
                "Risk analysis has not been generated for this contract yet."
            )

        return RiskAnalysisResponse.model_validate(rows[0])

    async def _get_contract(
        self,
        contract_id: str,
    ) -> dict[str, Any]:
        try:
            response = await self._run_query(
                self._supabase
                .table("contracts")
                .select(
                    "id, title, contract_type, counterparty"
                )
                .eq("id", contract_id)
                .limit(1)
            )
        except Exception as exc:
            raise RiskServiceError(
                "Failed to load contract."
            ) from exc

        rows = self._ensure_rows(response)

        if not rows:
            raise RiskContractNotFoundError(
                f"Contract {contract_id} was not found."
            )

        return rows[0]

    async def _get_extraction(
        self,
        contract_id: str,
    ) -> dict[str, Any]:
        try:
            response = await self._run_query(
                self._supabase
                .table("contract_extractions")
                .select(
                    "contract_id, contract_type, parties, payment_terms, "
                    "key_dates, clauses, summary, raw_extraction, "
                    "extraction_status"
                )
                .eq("contract_id", contract_id)
                .limit(1)
            )
        except Exception as exc:
            raise RiskServiceError(
                "Failed to load Phase 3 contract intelligence."
            ) from exc

        rows = self._ensure_rows(response)

        if not rows:
            raise RiskExtractionNotFoundError(
                "No Phase 3 extraction exists for this contract."
            )

        extraction = rows[0]

        if extraction.get("extraction_status") != "completed":
            raise RiskExtractionNotFoundError(
                "Phase 3 extraction is not complete."
            )

        return extraction

    def _build_analysis_input(
        self,
        contract: dict[str, Any],
        extraction: dict[str, Any],
    ) -> str:
        source = {
            "contract": {
                "title": contract.get("title"),
                "contract_type": contract.get("contract_type"),
                "counterparty": contract.get("counterparty"),
            },
            "phase_3_intelligence": {
                "contract_type": extraction.get("contract_type"),
                "parties": extraction.get("parties"),
                "payment_terms": extraction.get("payment_terms"),
                "key_dates": extraction.get("key_dates"),
                "clauses": extraction.get("clauses"),
                "summary": extraction.get("summary"),
                "raw_extraction": extraction.get("raw_extraction"),
            },
        }

        return json.dumps(
            source,
            ensure_ascii=False,
            default=str,
        )

    async def _call_gemini(
        self,
        analysis_input: str,
    ) -> RiskAnalysisResult:
        api_key = self._resolve_api_key()
        model_name = self._resolve_model_name()

        try:
            client = self._get_client(api_key)

            response = await client.aio.models.generate_content(
                model=model_name,
                contents=self._build_user_prompt(analysis_input),
                config=self._build_generation_config(),
            )
        except Exception as exc:
            raise RiskAIError(
                "Gemini failed while generating risk analysis."
            ) from exc

        parsed_payload = self._parse_response_payload(response)

        try:
            validated = _GeminiRiskResponse.model_validate(parsed_payload)
        except ValidationError as exc:
            raise RiskAIError(
                "Gemini returned an invalid risk-analysis structure."
            ) from exc

        return RiskAnalysisResult(
            high_risks=validated.high_risks,
            medium_risks=validated.medium_risks,
            missing_clauses=validated.missing_clauses,
            recommendations=validated.recommendations,
        )

    def _calculate_risk_score(
        self,
        analysis: RiskAnalysisResult,
    ) -> int:
        score = len(analysis.high_risks) * 15
        score += len(analysis.medium_risks) * 7

        for clause in analysis.missing_clauses:
            if clause.importance == "high":
                score += 10
            else:
                score += 5

        return min(score, 100)

    def calculate_risk_score(
        self,
        analysis: RiskAnalysisResult,
    ) -> int:
        return self._calculate_risk_score(analysis)

    def get_risk_level(
        self,
        score: int,
    ) -> str:
        if score <= 30:
            return "Low"

        if score <= 60:
            return "Medium"

        return "High"

    def _get_risk_level(
        self,
        score: int,
    ) -> str:
        return self.get_risk_level(score)

    def _deduplicate_analysis(
        self,
        analysis: RiskAnalysisResult,
    ) -> RiskAnalysisResult:
        high_seen: set[str] = set()
        medium_seen: set[str] = set()
        missing_seen: set[str] = set()

        high_risks: list[RiskItem] = []
        medium_risks: list[RiskItem] = []
        missing_clauses: list[MissingClause] = []

        for item in analysis.high_risks:
            key = item.title.strip().lower()

            if key and key not in high_seen:
                high_seen.add(key)
                high_risks.append(item)

        for item in analysis.medium_risks:
            key = item.title.strip().lower()

            if key and key not in medium_seen:
                medium_seen.add(key)
                medium_risks.append(item)

        for item in analysis.missing_clauses:
            key = item.clause.strip().lower()

            if key and key not in missing_seen:
                missing_seen.add(key)
                missing_clauses.append(item)

        return RiskAnalysisResult(
            high_risks=high_risks,
            medium_risks=medium_risks,
            missing_clauses=missing_clauses,
            recommendations=self._unique_strings(
                analysis.recommendations
            ),
        )

    def _unique_strings(
        self,
        values: list[str],
    ) -> list[str]:
        seen: set[str] = set()
        result: list[str] = []

        for value in values:
            normalized = value.strip()

            if not normalized:
                continue

            key = normalized.lower()

            if key not in seen:
                seen.add(key)
                result.append(normalized)

        return result

    def _resolve_api_key(self) -> str | None:
        api_key = (
            getattr(settings, "GEMINI_API_KEY", None)
            or os.getenv("GEMINI_API_KEY")
        )

        if not api_key or not api_key.strip():
            return None

        return api_key.strip()

    def _resolve_model_name(self) -> str:
        model_name = (
            getattr(settings, "GEMINI_MODEL", None)
            or os.getenv("GEMINI_MODEL")
        )

        if not model_name or not model_name.strip():
            return "gemini-2.5-flash"

        return model_name.strip()

    def _get_client(
        self,
        api_key: str,
    ) -> Any:
        if self._client is not None:
            return self._client

        try:
            from google import genai
        except ModuleNotFoundError as exc:
            raise RiskAIError(
                "The google-genai package is not installed."
            ) from exc

        self._client = genai.Client(
            api_key=api_key
        )

        return self._client

    def _build_generation_config(self) -> Any:
        try:
            from google.genai import types
        except ModuleNotFoundError as exc:
            raise RiskAIError(
                "The google-genai package is not installed."
            ) from exc

        return types.GenerateContentConfig(
            system_instruction=(
                "You are ContractFlo's Risk Intelligence Engine. "
                "Analyze contractual risk using ONLY the supplied "
                "contract intelligence. Never invent clauses, facts, "
                "dates, obligations, or rights. "
                "\n\n"
                "Identify high risks, medium risks, missing clauses, "
                "and actionable recommendations. "
                "\n\n"
                "High risks include serious commercial or legal exposure "
                "such as unlimited liability, broad indemnification, "
                "one-sided termination, major IP ownership problems, "
                "serious data/privacy exposure, unreasonable penalties, "
                "or materially unfavorable dispute/governing-law terms. "
                "\n\n"
                "Medium risks include ambiguous payment terms, weak SLA "
                "protection, broad warranties, weak confidentiality, "
                "unclear renewal or notice provisions, and unclear "
                "deliverables. "
                "\n\n"
                "For missing clauses, only mark something missing when "
                "there is insufficient evidence that the clause exists. "
                "Consider the contract type. "
                "\n\n"
                "For every finding, give factual evidence where possible. "
                "Do not hallucinate. "
                "\n\n"
                "Return ONLY valid JSON."
            ),
            response_mime_type="application/json",
            response_schema=_GeminiRiskResponse,
            temperature=0,
            candidate_count=1,
            max_output_tokens=4096,
        )

    def _build_user_prompt(
        self,
        analysis_input: str,
    ) -> str:
        return (
            "Analyze the following ContractFlo contract intelligence "
            "for contractual risk.\n\n"
            "CONTRACT DATA:\n"
            f"{analysis_input}"
        )

    def _parse_response_payload(
        self,
        response: Any,
    ) -> Any:
        parsed = getattr(response, "parsed", None)

        if parsed is not None:
            if hasattr(parsed, "model_dump"):
                return parsed.model_dump(mode="json")

            return parsed

        response_text = getattr(response, "text", None)

        if not response_text:
            raise RiskAIError(
                "Gemini returned an empty response."
            )

        try:
            return json.loads(response_text)
        except json.JSONDecodeError as exc:
            raise RiskAIError(
                "Gemini returned invalid JSON."
            ) from exc

    async def _run_query(
        self,
        query: Any,
    ) -> Any:
        return await asyncio.to_thread(
            query.execute
        )

    def _ensure_rows(
        self,
        response: Any,
    ) -> list[dict[str, Any]]:
        rows = getattr(response, "data", None)

        if rows is None:
            return []

        if isinstance(rows, list):
            return rows

        if isinstance(rows, dict):
            return [rows]

        return []
