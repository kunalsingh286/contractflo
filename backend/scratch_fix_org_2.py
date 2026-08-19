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
                    
    auth_client = create_client(url, key)
    res = auth_client.auth.sign_in_with_password({"email": "test@contractflo.com", "password": "password123"})
    real_user_id = res.user.id
    print(f"Real user ID is: {real_user_id}")
    
    # Create a fresh client that DOES NOT have the user session, so it uses Service Role
    admin_client = create_client(url, key)
    
    try:
        org_res = admin_client.table("organization_members").select("*").eq("user_id", real_user_id).execute()
        if not org_res.data:
            print("User is NOT in organization_members! Fixing...")
            any_org = admin_client.table("organizations").select("id").limit(1).execute()
            if any_org.data:
                org_id = any_org.data[0]["id"]
                admin_client.table("organization_members").insert({
                    "user_id": real_user_id,
                    "organization_id": org_id,
                    "role": "admin"
                }).execute()
                print("Fixed! Added to org.")
            else:
                print("No organizations found! Creating one...")
                new_org = admin_client.table("organizations").insert({
                    "name": "Test Organization",
                    "slug": "test-organization-2"
                }).execute()
                org_id = new_org.data[0]["id"]
                admin_client.table("organization_members").insert({
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
