import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine

def fix_enums():
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        for val in ["CHAT", "chat", "VIDEO", "video", "PHONE", "phone", "IN_PERSON", "in_person"]:
            try:
                conn.execute(text(f"ALTER TYPE sessionmode ADD VALUE IF NOT EXISTS '{val}';"))
                print(f"Added sessionmode value: {val}")
            except Exception as e:
                print(f"sessionmode {val}: {e}")

        for val in ["PENDING", "pending", "CONFIRMED", "confirmed", "REJECTED", "rejected", "RESCHEDULED", "rescheduled", "CANCELLED", "cancelled", "IN_PROGRESS", "in_progress", "COMPLETED", "completed", "NO_SHOW", "no_show"]:
            try:
                conn.execute(text(f"ALTER TYPE appointmentstatus ADD VALUE IF NOT EXISTS '{val}';"))
                print(f"Added appointmentstatus value: {val}")
            except Exception as e:
                print(f"appointmentstatus {val}: {e}")

if __name__ == "__main__":
    fix_enums()
