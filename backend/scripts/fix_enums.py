from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("UPDATE appointments SET mode = LOWER(CAST(mode AS text))::sessionmode, status = LOWER(CAST(status AS text))::appointmentstatus;"))
    conn.commit()
    print("Cleaned up appointments enum values successfully!")
