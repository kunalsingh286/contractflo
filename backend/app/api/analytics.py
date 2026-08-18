from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.api.schemas.analytics import AnalyticsDashboardSchema
from app.services.analytics_service import get_dashboard_analytics

from .deps import get_current_user, get_supabase_client

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=AnalyticsDashboardSchema)
def get_analytics_overview(
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Returns organization-scoped analytics for the main dashboard.
    """
    # 1. Verify user belongs to an organization
    org_res = supabase.table("organization_members").select("organization_id").eq("user_id", user.id).execute()
    if not org_res.data:
        raise HTTPException(status_code=403, detail="User does not belong to any organization")
        
    org_id = org_res.data[0]["organization_id"]
    
    # 2. Get deterministic aggregations
    return get_dashboard_analytics(supabase, org_id)
