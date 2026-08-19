import pg8000
import sys

def migrate():
    try:
        conn = pg8000.connect(
            user="postgres.lvjmhyacmnexeofsmikl",
            password="nhgP7rYAw56m4aIz",
            host="aws-0-ap-southeast-1.pooler.supabase.com",
            database="postgres",
            port=6543
        )
        print("Connected to Supabase Transaction Pooler successfully.")
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)
            
    import os
    import glob

    migrations = sorted(glob.glob("supabase/migrations/*.sql"))
    
    cursor = conn.cursor()
    
    for mig_file in migrations:
        filename = os.path.basename(mig_file)
        print(f"Applying migration: {filename}...")
        try:
            with open(mig_file, "r") as f:
                sql = f.read()
            # We'll just execute it. If it fails due to "already exists", we catch it and continue
            cursor.execute(sql)
            conn.commit()
            print(f" -> SUCCESS: {filename}")
        except Exception as e:
            conn.rollback()
            # If it's just 'already exists' or similar, we can ignore it
            error_str = str(e).lower()
            if "already exists" in error_str or "duplicate object" in error_str:
                print(f" -> SKIPPED (Already exists): {filename}")
            else:
                print(f" -> ERROR in {filename}: {e}")
                # We can continue to try next ones in case this was partially applied before
            
    print("Migration complete!")
    conn.close()

if __name__ == "__main__":
    migrate()
