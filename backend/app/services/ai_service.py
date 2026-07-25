from __future__ import annotations

import json
import os
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, ValidationError

from app.core.config import settings


class AIServiceError(Exception):
    """Base error for AI service failures."""


class EmptyContractTextError(AIServiceError, ValueError):
    """Raised when the contract text input is empty."""


class MissingGeminiAPIKeyError(AIServiceError, RuntimeError):
    """Raised when the Gemini API key is not configured."""


class MissingGeminiModelError(AIServiceError, RuntimeError):
    """Raised when the Gemini model name is not configured."""


class GeminiDependencyError(AIServiceError, ImportError):
    """Raised when the Gemini SDK is unavailable."""


class GeminiAPIError(AIServiceError, RuntimeError):
    """Raised when Gemini returns an API-level failure."""


class InvalidGeminiResponseError(AIServiceError, ValueError):
    """Raised when Gemini returns malformed or unexpected content."""


class MissingRequiredFieldsError(InvalidGeminiResponseError):
    """Raised when Gemini omits required response fields."""


class _PartiesSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")

    party_a: str | None = None
    party_b: str | None = None


class _KeyDatesSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")

    effective_date: str | None = None
    expiration_date: str | None = None
    renewal_date: str | None = None


class _PaymentTermsSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")

    payment_due: str | None = None
    currency: str | None = None
    amount: str | None = None


class _ClausesSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")

    termination: str | None = None
    confidentiality: str | None = None
    liability: str | None = None
    governing_law: str | None = None
    ip_ownership: str | None = None


class _ContractAnalysisSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_type: Literal[
        "NDA",
        "Master Service Agreement",
        "Vendor Agreement",
        "Customer Agreement",
        "Employment Agreement",
        "Unknown",
    ]
    parties: _PartiesSchema
    key_dates: _KeyDatesSchema
    payment_terms: _PaymentTermsSchema
    clauses: _ClausesSchema
    summary: str | None = None


class AIService:
    """Convert contract text into validated structured intelligence using Gemini."""

    def __init__(self) -> None:
        self._client: Any | None = None

    async def analyze_contract(self, contract_text: str) -> dict[str, Any]:
        """Analyze contract text and return validated structured JSON."""

        normalized_text = contract_text.strip()
        if not normalized_text:
            raise EmptyContractTextError("Contract text cannot be empty.")

        api_key = self._resolve_api_key()
        model_name = self._resolve_model_name()

        try:
            response = await self._get_client(api_key).aio.models.generate_content(
                model=model_name,
                contents=self._build_user_prompt(normalized_text),
                config=self._build_generation_config(),
            )
        except GeminiAPIError:
            raise
        except Exception as exc:
            raise GeminiAPIError(
                "Gemini failed while analyzing the contract text."
            ) from exc

        parsed_payload = self._parse_response_payload(response)

        try:
            validated = _ContractAnalysisSchema.model_validate(parsed_payload)
        except ValidationError as exc:
            raise MissingRequiredFieldsError(
                "Gemini response is missing required fields or contains invalid data."
            ) from exc

        return validated.model_dump(mode="json")

    def _resolve_api_key(self) -> str:
        api_key = getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY")
        if not api_key or not api_key.strip():
            raise MissingGeminiAPIKeyError("GEMINI_API_KEY is not configured.")
        return api_key.strip()

    def _resolve_model_name(self) -> str:
        model_name = getattr(settings, "GEMINI_MODEL", None) or os.getenv("GEMINI_MODEL")
        if not model_name or not model_name.strip():
            raise MissingGeminiModelError("GEMINI_MODEL is not configured.")
        return model_name.strip()

    def _get_client(self, api_key: str) -> Any:
        if self._client is not None:
            return self._client

        try:
            from google import genai
        except ModuleNotFoundError as exc:
            raise GeminiDependencyError(
                "The google-genai package is not installed in the current environment."
            ) from exc

        self._client = genai.Client(api_key=api_key)
        return self._client

    def _build_generation_config(self) -> Any:
        try:
            from google.genai import types
        except ModuleNotFoundError as exc:
            raise GeminiDependencyError(
                "The google-genai package is not installed in the current environment."
            ) from exc

        system_instruction = (
            "You are an expert legal contract analysis engine. Analyze the contract text "
            "with strict factual discipline and legal precision. Never hallucinate. "
            "Extract only information that is explicitly present in the contract. Never "
            "infer missing values, fill gaps, or guess intent from context. If a field is "
            "not stated, return null or an empty string rather than inventing content. "
            "Preserve party names exactly as written, including punctuation, spacing, and "
            "capitalization. Preserve legal terminology exactly as expressed in the source "
            "text. Classify the contract into only one of the following categories: NDA, "
            "Master Service Agreement, Vendor Agreement, Customer Agreement, Employment "
            "Agreement, or Unknown. Return ONLY valid JSON. Never wrap the JSON in markdown, "
            "code fences, explanations, prose, or commentary. Ensure the response matches "
            "the required schema exactly and includes every required top-level field."
        )

        return types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=_ContractAnalysisSchema,
            temperature=0,
            candidate_count=1,
            max_output_tokens=2048,
        )

    def _build_user_prompt(self, contract_text: str) -> str:
        return (
            "Analyse the following contract and return structured JSON.\n\n"
            "Contract:\n"
            f"{contract_text}"
        )

    def _parse_response_payload(self, response: Any) -> Any:
        parsed_payload = getattr(response, "parsed", None)
        if parsed_payload is not None:
            if hasattr(parsed_payload, "model_dump"):
                return parsed_payload.model_dump(mode="json")
            return parsed_payload

        response_text = getattr(response, "text", None)
        if not response_text:
            raise InvalidGeminiResponseError(
                "Gemini returned an empty response body."
            )

        try:
            return json.loads(response_text)
        except json.JSONDecodeError as exc:
            raise InvalidGeminiResponseError(
                "Gemini returned content that is not valid JSON."
            ) from exc