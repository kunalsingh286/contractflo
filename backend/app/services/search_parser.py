from datetime import date, timedelta
from typing import Any

from dateutil.relativedelta import relativedelta


def parse_search_query(q: str) -> dict[str, Any]:
    """
    Deterministically parses a natural language query into structured filters.
    Returns a dictionary of extracted filters.
    """
    if not q:
        return {}
        
    q_lower = q.lower()
    filters = {
        "contract_type": None,
        "risk_level": None,
        "expiration_from": None,
        "expiration_to": None,
        "obligation_type": None,
        "semantic_query": q # By default, the whole query is passed to Qdrant
    }
    
    # 1. Parse Contract Type
    types = [
        "vendor agreement", "customer agreement", "nda", "msa", "employment", 
        "non-disclosure", "master service", "vendor", "customer", "partner"
    ]
    for ct in types:
        if ct in q_lower:
            # Map shortcuts to actual DB types if needed
            if ct == "vendor":
                filters["contract_type"] = "Vendor Agreement"
            elif ct == "customer":
                filters["contract_type"] = "Customer Agreement"
            elif ct in ["nda", "non-disclosure"]:
                filters["contract_type"] = "NDA"
            elif ct in ["msa", "master service"]:
                filters["contract_type"] = "MSA"
            else:
                filters["contract_type"] = ct.title()
            break
            
    # 2. Parse Risk Level
    if "high risk" in q_lower or "high liability" in q_lower or "unlimited liability" in q_lower:
        filters["risk_level"] = "high"
    elif "medium risk" in q_lower:
        filters["risk_level"] = "medium"
    elif "low risk" in q_lower:
        filters["risk_level"] = "low"
        
    # 3. Parse Dates (relative to today)
    today = date.today()
    if "expiring next quarter" in q_lower or "expires next quarter" in q_lower:
        # Calculate next quarter
        current_quarter = (today.month - 1) // 3 + 1
        next_quarter = current_quarter + 1
        year = today.year
        if next_quarter > 4:
            next_quarter = 1
            year += 1
        start_month = 3 * next_quarter - 2
        filters["expiration_from"] = date(year, start_month, 1)
        filters["expiration_to"] = filters["expiration_from"] + relativedelta(months=3, days=-1)
        
    elif "next month" in q_lower:
        first_of_next_month = (today.replace(day=1) + timedelta(days=32)).replace(day=1)
        filters["expiration_from"] = first_of_next_month
        filters["expiration_to"] = first_of_next_month + relativedelta(months=1, days=-1)
        
    elif "this year" in q_lower:
        filters["expiration_from"] = date(today.year, 1, 1)
        filters["expiration_to"] = date(today.year, 12, 31)
        
    elif "next year" in q_lower:
        filters["expiration_from"] = date(today.year + 1, 1, 1)
        filters["expiration_to"] = date(today.year + 1, 12, 31)
        
    # 4. Parse Obligation constraints
    if "notice period" in q_lower or "notice" in q_lower:
        filters["obligation_type"] = "notice"
    elif "payment" in q_lower:
        filters["obligation_type"] = "payment"
    elif "renewal" in q_lower:
        filters["obligation_type"] = "renewal"
        
    return filters
