import json
import os

import google.generativeai as genai
from pydantic import BaseModel, Field


class RiskFindingSchema(BaseModel):
    category: str = Field(description="Risk category (e.g., Liability, Termination, IP, Data Protection)")
    severity: str = Field(description="low, medium, or high")
    title: str = Field(description="Short title for the risk")
    explanation: str = Field(description="Clear business explanation of why this is a risk")
    evidence: str = Field(description="Actual quote or clause from the contract proving this risk")
    recommendation: str = Field(description="Actionable recommendation (e.g., 'Consider negotiating...')")
    confidence: float = Field(description="Confidence score (0.0 to 1.0)")

class MissingClauseSchema(BaseModel):
    category: str = Field(description="Clause category (e.g., Liability Cap, Data Protection)")
    importance: str = Field(description="low, medium, or high importance for this contract type")
    explanation: str = Field(description="Why this clause is important and should be considered")
    confidence: float = Field(description="Confidence score (0.0 to 1.0)")

class RiskAnalysisSchema(BaseModel):
    high_risks: list[RiskFindingSchema] | None = Field(default_factory=list, description="High severity risks")
    medium_risks: list[RiskFindingSchema] | None = Field(default_factory=list, description="Medium severity risks")
    low_risks: list[RiskFindingSchema] | None = Field(default_factory=list, description="Low severity risks")
    missing_clauses: list[MissingClauseSchema] | None = Field(default_factory=list, description="Important missing clauses")
    
RISK_EXTRACTION_PROMPT = """
ROLE:
You are an expert contract risk analyst and legal AI assistant.

TASK:
Analyze the supplied contract text and identify legal and business risks, as well as critical missing protections.

RULES:
1. ONLY use the provided contract text. Do not invent clauses or hallucinate risks.
2. Every risk MUST include direct 'evidence' (a quote or section reference) from the text. If you cannot quote it, do not include it.
3. Categorize risks logically (Liability, Indemnification, Payment, Termination, Renewal, IP, Data, etc.).
4. Severity MUST be based on actual contract context, not just keyword matching (e.g. 'liability' doesn't mean high risk automatically).
5. Only identify 'missing clauses' if they are standard and crucial for this specific contract type and context.
6. Recommendations must be actionable (e.g., 'Consider negotiating a liability cap').
7. Return strictly structured JSON matching the requested schema.
"""

def extract_contract_risks(text: str, contract_type: str, intelligence: dict) -> RiskAnalysisSchema:
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    model = genai.GenerativeModel(model_name)
    
    context = f"Contract Type: {contract_type}\n"
    if intelligence and "parties" in intelligence:
        context += f"Parties: {json.dumps(intelligence['parties'])}\n"
        
    full_prompt = f"{RISK_EXTRACTION_PROMPT}\n\nCONTEXT:\n{context}\n\nCONTRACT TEXT:\n{text}"
    
    response = model.generate_content(
        full_prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=RiskAnalysisSchema,
            temperature=0.0
        )
    )
    
    try:
        data = json.loads(response.text)
        return RiskAnalysisSchema.model_validate(data)
    except Exception as e:
        raise ValueError(f"Failed to parse Gemini risk response: {e}")
