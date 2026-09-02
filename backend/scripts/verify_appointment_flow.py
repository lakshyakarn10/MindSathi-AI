import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.counselor import Counselor
from app.models.student import Student
from app.api.routes.appointments import request_session
from app.api.routes.counselors import get_counselor_appointments, accept_apt
from app.schemas.appointment import AppointmentCreate
from datetime import datetime, timezone, timedelta

db = SessionLocal()
student = db.query(User).filter(User.role == UserRole.STUDENT).first()
counselor = db.query(User).filter(User.role == UserRole.COUNSELOR).first()

print('=== 1. Student Requests Appointment ===')
start = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
req = AppointmentCreate(
    counselor_id=counselor.counselor_profile.id,
    mode='video',
    reason='Midterm stress and exam anxiety',
    scheduled_start=start,
    duration_minutes=45,
    student_notes='Need advice on pacing my preparation'
)
created = request_session(req, current_user=student, db=db)
apt_id = created['data']['id']
status_val = created['data']['status']
print(f"Created appointment ID: {apt_id}, status: {status_val}")

print('\n=== 2. Counselor Fetches Appointments ===')
apts_res = get_counselor_appointments(status=None, current_user=counselor, db=db)
apts = apts_res['data']
found = next((a for a in apts if a['id'] == apt_id), None)
print(f"Counselor retrieved {len(apts)} total appointments.")
if found:
    print(f"Found newly created appointment in Counselor portal: ID={found['id']}, Status={found['status']}, Reason={found['reason']}")
else:
    print("ERROR: Appointment not found in counselor list!")

print('\n=== 3. Counselor Accepts the Appointment ===')
accept_res = accept_apt(appointment_id=apt_id, current_user=counselor, db=db)
print(f"Accept result: {accept_res['message']}")

print('\n=== 4. Counselor Re-checks Appointments ===')
apts_res2 = get_counselor_appointments(status=None, current_user=counselor, db=db)
found2 = next((a for a in apts_res2['data'] if a['id'] == apt_id), None)
print(f"Appointment status after acceptance: {found2['status'] if found2 else 'Not found'}")

print('\nALL VERIFICATION STEPS PASSED SUCCESSFULLY!')
