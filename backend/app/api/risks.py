import traceback

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from supabase import Client

from app.services.document_service import get_service_role_client
from app.services.risk_scoring import calculate_risk_score
from app.services.risk_service import extract_contract_risks

from .deps import get_current_user, get_supabase_client

router = APIRouter(prefix="/contracts", tags=["Risks"])

def process_risk_background(contract_id: str, risk_id: str):
    supabase = get_service_role_client()
    try:
        # 1. Verify Phase 3 document extraction is complete
        doc_res = supabase.table("contract_documents").select("id, extracted_text, extraction_status").eq("contract_id", contract_id).execute()
        if not doc_res.data or doc_res.data[0]["extraction_status"] != "completed" or not doc_res.data[0]["extracted_text"]:
            raise Exception("Contract document processing is not complete or extracted text is missing.")
            
        document_id = doc_res.data[0]["id"]
        text = doc_res.data[0]["extracted_text"]
        
        # 2. Get Intelligence for context
        intel_res = supabase.table("contract_intelligence").select("id, contract_type, parties").eq("contract_id", contract_id).execute()
        intelligence = {}
        intel_id = None
        contract_type = "Unknown"
        if intel_res.data:
            intel_id = intel_res.data[0]["id"]
            contract_type = intel_res.data[0].get("contract_type") or "Unknown"
            intelligence = {"parties": intel_res.data[0].get("parties")}
            
        # 3. Analyze Risks with Gemini
        analysis = extract_contract_risks(text, contract_type, intelligence)
        
        # 4. Calculate deterministic score
        score, level = calculate_risk_score(analysis)
        
        # 5. Store Results
        analysis_data = analysis.model_dump()
        
        update_data = {
            "contract_document_id": document_id,
            "contract_intelligence_id": intel_id,
            "risk_score": score,
            "risk_level": level,
            "findings": {
                "high": analysis_data.get("high_risks", []),
                "medium": analysis_data.get("medium_risks", []),
                "low": analysis_data.get("low_risks", [])
            },
            "missing_clauses": analysis_data.get("missing_clauses", []),
            "recommendations": [], # You could aggregate recommendations from findings
            "model_name": "gemini-1.5-flash",
            "analysis_version": "1.0",
        }
        
        supabase.table("contract_risks").update(update_data).eq("id", risk_id).execute()
        
    except Exception as e:
        print(f"Background risk analysis failed: {e}")
        print(traceback.format_exc())
        # In a robust system, we might add a status field to contract_risks. 
        # For now, we will update the score to null to signify failure if we had a status column.
        # Let's add an update to signify failure if we had a status, but since we don't, 
        # we'll just leave it empty. We can add a 'status' to the findings JSON to track it if needed.
        supabase.table("contract_risks").update({
            "findings": {"status": "failed", "error": str(e)}
        }).eq("id", risk_id).execute()


@router.post("/{contract_id}/risk-analysis")
def analyze_contract_risks(
    contract_id: str,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    # 1. Verify contract exists and user has access
    contract_res = supabase.table("contracts").select("id").eq("id", contract_id).execute()
    if not contract_res.data:
        raise HTTPException(status_code=404, detail="Contract not found or access denied")
        
    # 2. Check if Phase 3 is done
    doc_res = supabase.table("contract_documents").select("extraction_status").eq("contract_id", contract_id).execute()
    if not doc_res.data or doc_res.data[0]["extraction_status"] != "completed":
        raise HTTPException(status_code=400, detail="Contract document processing is not complete. Cannot run risk analysis.")

    # 3. Create or update contract_risks record with pending state
    risk_res = supabase.table("contract_risks").select("id").eq("contract_id", contract_id).execute()
    
    if risk_res.data:
        risk_id = risk_res.data[0]["id"]
        supabase.table("contract_risks").update({
            "findings": {"status": "processing"}
        }).eq("id", risk_id).execute()
    else:
        new_risk = supabase.table("contract_risks").insert({
            "contract_id": contract_id,
            "findings": {"status": "processing"}
        }).execute()
        risk_id = new_risk.data[0]["id"]
        
    # 4. Dispatch background task
    background_tasks.add_task(process_risk_background, contract_id, risk_id)
    
    return {"message": "Risk analysis started", "risk_id": risk_id, "status": "processing"}

@router.get("/{contract_id}/risks/status")
def get_risk_status(
    contract_id: str,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    risk_res = supabase.table("contract_risks").select("findings, risk_score").eq("contract_id", contract_id).execute()
    
    if not risk_res.data:
        return {"status": "none"}
        
    findings = risk_res.data[0].get("findings", {})
    if findings and isinstance(findings, dict) and findings.get("status"):
        return {"status": findings.get("status"), "error": findings.get("error")}
        
    if risk_res.data[0].get("risk_score") is not None:
         return {"status": "completed"}
         
    return {"status": "pending"}

@router.get("/{contract_id}/risks")
def get_contract_risks(
    contract_id: str,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    risk_res = supabase.table("contract_risks").select("*").eq("contract_id", contract_id).execute()
    
    if not risk_res.data:
        raise HTTPException(status_code=404, detail="Risk analysis not found")
        
    return risk_res.data[0]

@router.get("/all/risks")
def get_all_risks(
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """Get all risks for the organization's contracts for the Risk Center dashboard"""
    # RLS will limit to the user's org's contracts
    risk_res = supabase.table("contract_risks").select("*, contracts(title, contract_type)").execute()
    return risk_res.data
