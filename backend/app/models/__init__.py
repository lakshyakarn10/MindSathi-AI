from app.core.database import Base
from app.models.user import User, UserRole
from app.models.institution import Institution
from app.models.student import Student
from app.models.counselor import Counselor, VerificationStatus, AvailabilityStatus
from app.models.admin import Admin, AuthorizationStatus
from app.models.wellness import WellnessCheckin, RiskLevel
from app.models.journal import JournalEntry
from app.models.risk import EscalationCase, EscalationStatus
from app.models.appointment import Appointment, AppointmentStatus, SessionMode
from app.models.session import SessionRecord
from app.models.exercise import Exercise, ExerciseCompletion
from app.models.notification import Notification, NotificationType
from app.models.message import Conversation, Message
from app.models.consent import ConsentRecord, ConsentType
from app.models.audit import AuditLog
# Phase 1 addition
from app.models.companion import CompanionConversation, CompanionMessage, MessageRole

__all__ = [
    "Base",
    "User",
    "UserRole",
    "Institution",
    "Student",
    "Counselor",
    "VerificationStatus",
    "AvailabilityStatus",
    "Admin",
    "AuthorizationStatus",
    "WellnessCheckin",
    "RiskLevel",
    "JournalEntry",
    "EscalationCase",
    "EscalationStatus",
    "Appointment",
    "AppointmentStatus",
    "SessionMode",
    "SessionRecord",
    "Exercise",
    "ExerciseCompletion",
    "Notification",
    "NotificationType",
    "Conversation",
    "Message",
    "ConsentRecord",
    "ConsentType",
    "AuditLog",
    # Phase 1
    "CompanionConversation",
    "CompanionMessage",
    "MessageRole",
]
