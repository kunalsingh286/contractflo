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
        # Auto-provision an organization to prevent 403 blocks for new or test users
        try:
            import re
            import uuid
            email_prefix = user.email.split("@")[0] if user and user.email else "User"
            org_slug = re.sub(r'[^a-z0-9]', '-', email_prefix.lower()) + '-' + str(uuid.uuid4())[:8]
            
            # Use Service Role to directly insert (bypassing RLS and RPC auth checks)
            new_org = supabase.table("organizations").insert({
                "name": f"{email_prefix.capitalize()}'s Company",
                "slug": org_slug
            }).execute()
            
            # Postgrest doesn't always throw exceptions on failure, so we must check the response data
            if not new_org.data:
                print(f"Failed to create org. Response: {new_org}")
                raise Exception(f"Failed to create organization: {new_org}")
                
            org_id = new_org.data[0]["id"]
            
            member_res = supabase.table("organization_members").insert({
                "organization_id": org_id,
                "user_id": user.id,
                "role": "admin"
            }).execute()
            
            if not member_res.data:
                print(f"Failed to create member. Response: {member_res}")
                raise Exception(f"Failed to create organization member: {member_res}")
                
        except Exception as e:
            print(f"Auto-provisioning failed: {str(e)}")
            raise HTTPException(status_code=403, detail=f"User does not belong to any organization and auto-provisioning failed: {str(e)}")
    else:
        org_id = org_res.data[0]["organization_id"]
    
    # 2. Get deterministic aggregations
    return get_dashboard_analytics(supabase, org_id)
