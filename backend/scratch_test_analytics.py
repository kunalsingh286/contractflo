import requests
from supabase import create_client
import os

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
    
    # Sign in
    res = supabase.auth.sign_in_with_password({"email": "test@contractflo.com", "password": "password123"})
    token = res.session.access_token
    
    # Hit API
    headers = {"Authorization": f"Bearer {token}"}
    api_res = requests.get("http://localhost:8000/api/v1/analytics/overview", headers=headers)
    print(f"Status: {api_res.status_code}")
    print(api_res.text)

if __name__ == "__main__":
    main()
