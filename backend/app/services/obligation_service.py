import json
import os
from typing import Literal

import google.generativeai as genai
from pydantic import BaseModel, Field

# Configure Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

class ObligationSchema(BaseModel):
    type: Literal['deliverable', 'payment', 'notice', 'reporting', 'renewal', 'other']
    title: str
    description: str
    responsible_party: str | None
    counterparty: str | None
    due_date: str | None
    due_date_type: Literal['exact', 'relative', 'recurring', 'event_based', 'not_specified']
    due_date_expression: str | None
    recurrence: str | None
    notice_period_days: int | None
    source_clause: str | None
    evidence: str
    confidence: float | str

class ObligationAnalysisSchema(BaseModel):
    obligations: list[ObligationSchema] = []

OBLIGATION_EXTRACTION_PROMPT = """
You are an expert AI legal analyst specializing in contract intelligence.
Your task is to analyze the following extracted contract text and identify all actionable obligations.

An "obligation" is a mandatory duty, requirement, deadline, payment, notice, reporting requirement, or deliverable explicitly stated in the contract.
DO NOT extract general descriptive language, definitions, or non-binding statements.

For each obligation you identify, you MUST output a structured JSON response matching the provided schema.

CRITICAL RULES FOR DATES:
1. Exact Date ('exact'): Only use this if the contract states a specific calendar date (e.g., "March 30, 2027"). Populate `due_date` with YYYY-MM-DD.
2. Relative Date ('relative'): If the deadline is relative (e.g., "within 30 days of receipt"), set `due_date` to null. Set `due_date_expression` to the text describing it. NEVER calculate or invent a calendar date.
3. Recurring ('recurring'): If the obligation happens regularly (e.g., "Monthly reports"), set `due_date` to null and populate `recurrence` and `due_date_expression`.
4. Event-Based ('event_based'): If triggered by an event (e.g., "Upon termination"), set `due_date` to null and populate `due_date_expression`.
5. Not Specified ('not_specified'): If there is no deadline.
4. If a date is completely missing but the obligation requires one, set due_date_type to 'not_specified'.
5. 'confidence' MUST be a float between 0.0 and 1.0, not a string.

OUTPUT FORMAT:
Return a JSON object with EXACTLY this key:
- "obligations": array of objects (type, title, description, responsible_party, counterparty, due_date, due_date_type, due_date_expression, recurrence, notice_period_days, source_clause, evidence, confidence as a float from 0.0 to 1.0)

CRITICAL RULES FOR EVIDENCE:
Every obligation MUST have an `evidence` field containing an EXACT QUOTE from the contract text. No paraphrasing.

CRITICAL RULES FOR RESPONSIBLE PARTY:
Identify the exact party responsible (e.g., the specific company name, "Buyer", "Seller"). Do not guess if it is not explicitly clear.

Focus on these obligation types: deliverable, payment, notice, reporting, renewal.

Extracted Contract Text:
{contract_text}

Metadata (Use this for context if needed):
Contract Type: {contract_type}
"""

def extract_contract_obligations(contract_text: str, contract_type: str = "Unknown") -> ObligationAnalysisSchema:
    """
    Extracts structured obligations from raw contract text using Gemini 3.6 Flash.
    """
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    model = genai.GenerativeModel(model_name)
    
    prompt = OBLIGATION_EXTRACTION_PROMPT.format(
        contract_text=contract_text,
        contract_type=contract_type
    )
    
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.1,  # Low temperature for precise, non-creative extraction
        )
    )
    
    # Parse the response text into our Pydantic model
    result_dict = json.loads(response.text)
    return ObligationAnalysisSchema(**result_dict)
