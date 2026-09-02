"""
Full reset + recreate of all MindSathi tables on Supabase.
Drops all app-owned tables and enum types, then recreates from models.
"""
from app.core.database import engine, Base
import app.models
from sqlalchemy import text, inspect

inspector = inspect(engine)
existing_tables = inspector.get_table_names()

# All MindSathi app tables in reverse dependency order (children first)
APP_TABLES = [
    "audit_logs",
    "notifications",
    "consent_records",
    "companion_messages",
    "companion_conversations",
    "exercise_completions",
    "guided_exercises",
    "journal_entries",
    "checkin_flags",
    "wellness_checkins",
    "appointments",
    "messages",
    "conversations",
    "risk_assessments",
    "admins",
    "counselors",
    "students",
    "users",
    "institutions",
]

APP_ENUMS = [
    "userrole",
    "risklevel",
    "sessionmode",
    "appointmentstatus",
    "messagerole",
    "sessiontype",
    "consenttype",
    "notificationtype",
    "availabilitystatus",
    "authorizationstatus",
    "escalationstatus",
    "verificationstatus",
]

with engine.connect() as conn:
    conn.execute(text("SET session_replication_role = replica"))  # Disable FK checks

    print("Dropping app tables...")
    for table in APP_TABLES:
        if table in existing_tables:
            conn.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))
            print(f"  Dropped: {table}")

    print("Dropping app enum types...")
    for enum in APP_ENUMS:
        conn.execute(text(f"DROP TYPE IF EXISTS {enum} CASCADE"))
        print(f"  Dropped enum: {enum}")

    conn.execute(text("SET session_replication_role = DEFAULT"))
    conn.commit()

print("\nRecreating all tables from models...")
Base.metadata.create_all(bind=engine)
print("Done! All tables created successfully.")

# Verify
inspector2 = inspect(engine)
tables = inspector2.get_table_names()
print(f"\nTables in database ({len(tables)} total):")
for t in sorted(tables):
    print(f"  {t}")
