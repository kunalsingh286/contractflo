import json
import os
from typing import Literal

import google.generativeai as genai
from pydantic import BaseModel, Field

# Configure Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

class ObligationSchema(BaseModel):
    type: Literal['deliverable', 'payment', 'notice', 'reporting', 'renewal'] = Field(
        description="The category of the obligation."
    )
    title: str = Field(
        description="A concise, 3-6 word title for the obligation."
    )
    description: str = Field(
        description="A clear description of what must be done."
    )
    responsible_party: str | None = Field(
        description="The party responsible for fulfilling this obligation (e.g., 'Customer', 'Vendor', specific company name). Null if unclear."
    )
    counterparty: str | None = Field(
        description="The party receiving the benefit of the obligation. Null if unclear."
    )
    due_date: str | None = Field(
        description="ONLY provide this if the contract specifies an exact calendar date (YYYY-MM-DD). NEVER invent or calculate a date based on relative terms."
    )
    due_date_type: Literal['exact', 'relative', 'recurring', 'event_based', 'not_specified'] = Field(
        description="The type of deadline. 'exact' = specific calendar date. 'relative' = X days after Y. 'recurring' = every X. 'event_based' = upon X happening. 'not_specified' = no deadline mentioned."
    )
    due_date_expression: str | None = Field(
        description="The exact contractual phrase defining the relative, recurring, or event-based deadline (e.g., '30 days after invoice receipt')."
    )
    recurrence: str | None = Field(
        description="Description of recurrence if applicable (e.g., 'Monthly on the 5th')."
    )
    notice_period_days: int | None = Field(
        description="If this is a notice obligation, the number of days required for the notice."
    )
    source_clause: str | None = Field(
        description="The section or clause name where this obligation was found (e.g., 'Section 5.1')."
    )
    evidence: str = Field(
        description="An EXACT QUOTE from the contract text proving this obligation exists. This is mandatory."
    )
    confidence: float = Field(
        description="Confidence score between 0.0 and 1.0."
    )

class ObligationAnalysisSchema(BaseModel):
    obligations: list[ObligationSchema] = Field(
        description="List of extracted obligations from the contract."
    )

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
    Extracts structured obligations from raw contract text using Gemini 1.5 Flash.
    """
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    prompt = OBLIGATION_EXTRACTION_PROMPT.format(
        contract_text=contract_text,
        contract_type=contract_type
    )
    
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=ObligationAnalysisSchema,
            temperature=0.1,  # Low temperature for precise, non-creative extraction
        )
    )
    
    # Parse the response text into our Pydantic model
    result_dict = json.loads(response.text)
    return ObligationAnalysisSchema(**result_dict)
