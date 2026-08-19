import os
from supabase import create_client

def main():
    url = os.environ.get("SUPABASE_URL") or "https://lvjmhyacmnexeofsmikl.supabase.co"
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Ensure this is in .env
    
    if not key or key == "your_service_role_key_here":
        # Let's try to read it from .env directly if os.environ doesn't have it
        with open(".env", "r") as f:
            for line in f:
                if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    key = line.strip().split("=")[1]
                    break
    
    if not key or key == "your_service_role_key_here":
        print("Please set your SUPABASE_SERVICE_ROLE_KEY in backend/.env")
        return
        
    supabase = create_client(url, key)
    
    try:
        # 1. Get or Create user
        print("Checking user test@contractflo.com...")
        try:
            user_res = supabase.auth.admin.create_user({
                "email": "test@contractflo.com",
                "password": "password123",
                "email_confirm": True
            })
            user_id = user_res.user.id
            print(f"User created: {user_id}")
        except Exception as e:
            if "already been registered" in str(e).lower() or "already exists" in str(e).lower() or "unique constraint" in str(e).lower() or "duplicate" in str(e).lower() or hasattr(e, 'code') and getattr(e, 'code') == 'user_already_exists' or 'AuthApiError' in str(e):
                print("User already exists, fetching ID...")
                # Note: supabase python client admin API doesn't easily list users by email directly, 
                # so we can just query auth.users if we had DB access, but we don't.
                # Since we know the user was created in the last run (4a872733-7cb9-4da0-96d9-6f7b64096f47)
                user_id = "4a872733-7cb9-4da0-96d9-6f7b64096f47"
            else:
                raise e
        
        # 2. Create organization
        print("Creating organization...")
        org_res = supabase.table("organizations").insert({
            "name": "Test Organization",
            "slug": "test-organization"
        }).execute()
        org_id = org_res.data[0]["id"]
        
        # 3. Add to organization_members
        print("Adding user to organization...")
        supabase.table("organization_members").insert({
            "user_id": user_id,
            "organization_id": org_id,
            "role": "admin"
        }).execute()
        
        print("\nSUCCESS! You can now log in with:")
        print("Email: test@contractflo.com")
        print("Password: password123")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
