import os
from supabase import create_client

def main():
    url = os.environ.get("SUPABASE_URL") or "https://lvjmhyacmnexeofsmikl.supabase.co"
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not key or key == "your_service_role_key_here":
        with open(".env", "r") as f:
            for line in f:
                if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    key = line.strip().split("=")[1]
                    break
                    
    supabase = create_client(url, key)
    
    # Sign in to get the real user ID from the session!
    try:
        res = supabase.auth.sign_in_with_password({"email": "test@contractflo.com", "password": "password123"})
        real_user_id = res.user.id
        print(f"Real user ID is: {real_user_id}")
        
        # Check if they are in organization_members
        org_res = supabase.table("organization_members").select("*").eq("user_id", real_user_id).execute()
        if not org_res.data:
            print("User is NOT in organization_members! Fixing...")
            # Get any org
            any_org = supabase.table("organizations").select("id").limit(1).execute()
            if any_org.data:
                org_id = any_org.data[0]["id"]
                supabase.table("organization_members").insert({
                    "user_id": real_user_id,
                    "organization_id": org_id,
                    "role": "admin"
                }).execute()
                print("Fixed! Added to org.")
            else:
                print("No organizations found! Creating one...")
                new_org = supabase.table("organizations").insert({
                    "name": "Test Organization",
                    "slug": "test-organization-2"
                }).execute()
                org_id = new_org.data[0]["id"]
                supabase.table("organization_members").insert({
                    "user_id": real_user_id,
                    "organization_id": org_id,
                    "role": "admin"
                }).execute()
                print("Fixed! Created org and added user.")
        else:
            print("User IS in organization_members.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
