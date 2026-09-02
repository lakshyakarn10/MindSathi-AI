import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import engine
from sqlalchemy import text

statements = [
    "UPDATE appointments SET mode = 'video'::sessionmode WHERE mode::text = 'VIDEO'",
    "UPDATE appointments SET mode = 'phone'::sessionmode WHERE mode::text = 'PHONE'",
    "UPDATE appointments SET mode = 'in_person'::sessionmode WHERE mode::text = 'IN_PERSON'",
    "UPDATE appointments SET mode = 'chat'::sessionmode WHERE mode::text = 'CHAT'",
    "UPDATE appointments SET status = 'pending'::appointmentstatus WHERE status::text = 'PENDING'",
    "UPDATE appointments SET status = 'confirmed'::appointmentstatus WHERE status::text = 'CONFIRMED'",
    "UPDATE appointments SET status = 'rejected'::appointmentstatus WHERE status::text = 'REJECTED'",
    "UPDATE appointments SET status = 'rescheduled'::appointmentstatus WHERE status::text = 'RESCHEDULED'",
    "UPDATE appointments SET status = 'cancelled'::appointmentstatus WHERE status::text = 'CANCELLED'",
    "UPDATE appointments SET status = 'completed'::appointmentstatus WHERE status::text = 'COMPLETED'"
]

with engine.begin() as conn:
    for s in statements:
        conn.execute(text(s))
print('Successfully normalized appointments table enums.')
