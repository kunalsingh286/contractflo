import pg8000
import socket
import sys

regions = [
    "us-east-1", "us-west-1", "us-west-2", "eu-west-1", "eu-west-2", "eu-central-1", 
    "ap-south-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", 
    "sa-east-1", "ca-central-1"
]

project_ref = "lvjmhyacmnexeofsmikl"
user = f"postgres.{project_ref}"
password = "nhgP7rYAw56m4aIz"

for region in regions:
    host = f"aws-0-{region}.pooler.supabase.com"
    try:
        socket.gethostbyname(host)
    except socket.gaierror:
        continue
        
    print(f"Trying pooler: {host}")
    try:
        conn = pg8000.connect(
            user=user,
            password=password,
            host=host,
            database="postgres",
            port=6543,
            timeout=3
        )
        print(f"SUCCESS on {host}!")
        conn.close()
        sys.exit(0)
    except Exception as e:
        print(f"Failed on {host}: {e}")

print("Could not connect to any pooler.")
sys.exit(1)
