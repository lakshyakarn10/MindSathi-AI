from app.schemas.auth import (
    TokenResponse, RefreshRequest, LoginRequest,
    StudentSignupRequest, CounselorSignupRequest, AdminSignupRequest,
    ForgotPasswordRequest, ResetPasswordRequest, MessageResponse
)
from app.schemas.user import UserRead, UserUpdate
from app.schemas.student import StudentRead, StudentUpdate, OnboardingRequest
from app.schemas.counselor import CounselorRead, CounselorUpdate
from app.schemas.admin import AdminRead, AdminUpdate
from app.schemas.wellness import (
    CheckinCreate, CheckinRead, CheckinResponse,
    TrendDataPoint, TrendsResponse, InsightItem
)
from app.schemas.journal import JournalCreate, JournalRead, JournalUpdate
from app.schemas.risk import (
    RiskFactorsDecomposition, RiskProfileResponse,
    EscalationCaseRead, EscalationCaseUpdate
)
from app.schemas.appointment import (
    AppointmentCreate, AppointmentRead, RescheduleRequest, CancelRequest,
    SessionNotesCreate, SessionRecordRead
)
from app.schemas.analytics import (
    ExerciseRead, ExerciseCompleteRequest, ExerciseCompletionRead,
    NotificationRead, MessageSendRequest, MessageRead, ConversationRead,
    CompanionChatRequest, CompanionChatResponse,
    ConsentUpdate, ConsentRead,
    AdminOverviewAnalytics, DepartmentAnalyticsItem, StressHotspotsResponse,
    InstitutionalRecommendation, AdminReportCreate, AdminReportRead
)
