from app.services.risk_service import RiskAnalysisSchema


def calculate_risk_score(analysis: RiskAnalysisSchema) -> tuple[int, str]:
    """
    Deterministically calculates a risk score (0-100) and risk level
    based on the findings in the risk analysis.
    """
    score = 0
    
    # Base weight configurations
    HIGH_WEIGHT = 20
    MEDIUM_WEIGHT = 10
    LOW_WEIGHT = 3
    MISSING_HIGH_WEIGHT = 15
    MISSING_MED_WEIGHT = 7
    MISSING_LOW_WEIGHT = 2
    
    # Calculate finding contributions
    if analysis.high_risks:
        score += len(analysis.high_risks) * HIGH_WEIGHT
    
    if analysis.medium_risks:
        score += len(analysis.medium_risks) * MEDIUM_WEIGHT
        
    if analysis.low_risks:
        score += len(analysis.low_risks) * LOW_WEIGHT
        
    # Calculate missing clauses contributions
    if analysis.missing_clauses:
        for clause in analysis.missing_clauses:
            if clause.importance.lower() == "high":
                score += MISSING_HIGH_WEIGHT
            elif clause.importance.lower() == "medium":
                score += MISSING_MED_WEIGHT
            else:
                score += MISSING_LOW_WEIGHT
                
    # Cap score at 100
    final_score = min(score, 100)
    
    # Determine level
    if final_score < 30:
        level = "Low"
    elif final_score < 60:
        level = "Medium"
    elif final_score < 80:
        level = "High"
    else:
        level = "Critical"
        
    return final_score, level
