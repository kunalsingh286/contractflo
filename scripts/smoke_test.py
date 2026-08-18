import argparse
import requests
import sys
import time

def check_endpoint(url: str, name: str, expected_status: int = 200) -> bool:
    print(f"Checking {name} at {url}...")
    try:
        start_time = time.time()
        response = requests.get(url, timeout=10)
        elapsed = time.time() - start_time
        
        if response.status_code == expected_status:
            print(f"✅ {name} is UP (Status {response.status_code}, {elapsed:.2f}s)")
            return True
        else:
            print(f"❌ {name} returned unexpected status {response.status_code}")
            return False
    except requests.RequestException as e:
        print(f"❌ {name} is DOWN or unreachable: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Smoke test ContractFlo deployment")
    parser.add_argument("--frontend-url", default="http://localhost:3000", help="URL of the frontend")
    parser.add_argument("--backend-url", default="http://localhost:8000", help="URL of the backend")
    args = parser.parse_args()
    
    print("========================================")
    print("ContractFlo Smoke Test")
    print("========================================")
    
    success = True
    
    # Check Frontend
    if not check_endpoint(args.frontend_url, "Frontend"):
        success = False
        
    # Check Backend Health
    health_url = f"{args.backend_url.rstrip('/')}/api/v1/health"
    if not check_endpoint(health_url, "Backend API Health"):
        success = False
        
    print("========================================")
    if success:
        print("✅ ALL SYSTEMS GO")
        sys.exit(0)
    else:
        print("❌ SMOKE TEST FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main()
