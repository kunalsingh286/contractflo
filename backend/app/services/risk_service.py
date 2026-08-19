import json
import os

import google.generativeai as genai
from pydantic import BaseModel, Field


class RiskFindingSchema(BaseModel):
    category: str
    severity: str
    title: str
    explanation: str
    evidence: str
    recommendation: str
    confidence: float | str

class MissingClauseSchema(BaseModel):
    category: str
    importance: str
    explanation: str
    confidence: float | str

class RiskAnalysisSchema(BaseModel):
    high_risks: list[RiskFindingSchema] | None = []
    medium_risks: list[RiskFindingSchema] | None = []
    low_risks: list[RiskFindingSchema] | None = []
    missing_clauses: list[MissingClauseSchema] | None = []
    
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

OUTPUT FORMAT:
Return a JSON object with EXACTLY these four keys:
- "high_risks": array of objects (category, severity, title, explanation, evidence, recommendation, confidence as a float from 0.0 to 1.0)
- "medium_risks": array of objects
- "low_risks": array of objects
- "missing_clauses": array of objects (category, importance, explanation, confidence as a float from 0.0 to 1.0)
8. 'confidence' MUST be a float between 0.0 and 1.0, not a string.
"""

def extract_contract_risks(text: str, contract_type: str, intelligence: dict) -> RiskAnalysisSchema:
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    model = genai.GenerativeModel(model_name)
    
    context = f"Contract Type: {contract_type}\n"
    if intelligence and "parties" in intelligence:
        context += f"Parties: {json.dumps(intelligence['parties'])}\n"
        
    full_prompt = f"{RISK_EXTRACTION_PROMPT}\n\nCONTEXT:\n{context}\n\nCONTRACT TEXT:\n{text}"
    
    response = model.generate_content(
        full_prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.0
        )
    )
    
    try:
        data = json.loads(response.text)
        return RiskAnalysisSchema.model_validate(data)
    except Exception as e:
        raise ValueError(f"Failed to parse Gemini risk response: {e}")
