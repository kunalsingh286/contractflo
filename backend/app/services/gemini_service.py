import json
import os

import google.generativeai as genai
from pydantic import BaseModel, Field

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

class PartySchema(BaseModel):
    name: str = Field(description="Name of the party")
    role: str | None = Field(None, description="Role of the party, e.g., 'customer', 'vendor', 'employer'")

class ConfidenceSchema(BaseModel):
    contract_type: float
    parties: float
    effective_date: float
    expiration_date: float
    renewal_date: float
    payment_terms: float

class ContractIntelligenceSchema(BaseModel):
    contract_type: str | None = Field(None, description="Type of contract, e.g., MSA, NDA, Employment Agreement")
    parties: list[PartySchema] | None = Field(None, description="List of parties involved")
    effective_date: str | None = Field(None, description="Effective date in YYYY-MM-DD format")
    expiration_date: str | None = Field(None, description="Expiration or termination date in YYYY-MM-DD format")
    renewal_date: str | None = Field(None, description="Renewal date or notice deadline in YYYY-MM-DD format")
    payment_terms: str | None = Field(None, description="Payment terms, preserving legally meaningful wording")
    confidence: ConfidenceSchema | None = Field(None, description="Confidence scores for each extracted field (0.0 to 1.0)")

EXTRACTION_PROMPT = """
ROLE:
You are a contract intelligence extraction engine.

TASK:
Extract structured metadata from the supplied contract text.

RULES:
* Use only information present in the contract.
* Never invent or hallucinate missing information.
* Return null when information is unavailable.
* Preserve important legal meaning, especially for payment terms.
* Identify all relevant parties.
* Distinguish contract effective date from expiration/termination dates.
* Identify renewal dates or renewal mechanisms when explicitly present.
* Identify the contract type based on the actual content.
* Return valid structured JSON only, strictly matching the requested schema.
"""

def extract_contract_intelligence(text: str) -> ContractIntelligenceSchema:
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    model = genai.GenerativeModel(model_name)
    
    response = model.generate_content(
        f"{EXTRACTION_PROMPT}\n\nCONTRACT TEXT:\n{text}",
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=ContractIntelligenceSchema,
            temperature=0.0
        )
    )
    
    try:
        data = json.loads(response.text)
        return ContractIntelligenceSchema.model_validate(data)
    except Exception as e:
        raise ValueError(f"Failed to parse Gemini response: {e}")
