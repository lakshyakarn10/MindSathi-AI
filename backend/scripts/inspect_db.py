from app.core.database import engine
from sqlalchemy import text, inspect

inspector = inspect(engine)
print("users table columns:")
cols = inspector.get_columns("users")
for c in cols:
    print(" ", c["name"], ":", c["type"])

print()
print("existing enum types:")
with engine.connect() as conn:
    result = conn.execute(text("SELECT typname FROM pg_type WHERE typcategory='E'"))
    for row in result:
        print(" ", row[0])
