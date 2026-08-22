from fastapi import APIRouter
from app.api.routes import (
    health, auth, users, students, counselors, admins,
    checkins, wellness, risk, journal, companion,
    exercises, appointments, sessions, messages,
    notifications, analytics, reports, privacy, institutions
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(students.router)
api_router.include_router(counselors.router)
api_router.include_router(admins.router)
api_router.include_router(checkins.router)
api_router.include_router(wellness.router)
api_router.include_router(risk.router)
api_router.include_router(journal.router)
api_router.include_router(companion.router)
api_router.include_router(exercises.router)
api_router.include_router(appointments.router)
api_router.include_router(sessions.router)
api_router.include_router(messages.router)
api_router.include_router(notifications.router)
api_router.include_router(analytics.router)
api_router.include_router(reports.router)
api_router.include_router(privacy.router)
api_router.include_router(institutions.router)

