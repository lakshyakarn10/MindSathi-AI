/**
 * MindSaathi API Client
 * Centralized, typed API service layer for communicating with the FastAPI backend.
 */

const API_BASE_URL = "/api/v1";

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

// Token Management
export const getAccessToken = (): string | null => localStorage.getItem("mindsaathi_access_token");
export const getRefreshToken = (): string | null => localStorage.getItem("mindsaathi_refresh_token");
export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem("mindsaathi_access_token", accessToken);
  localStorage.setItem("mindsaathi_refresh_token", refreshToken);
};
export const clearTokens = () => {
  localStorage.removeItem("mindsaathi_access_token");
  localStorage.removeItem("mindsaathi_refresh_token");
  localStorage.removeItem("mindsaathi_user");
};

// Core Request Handler
async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = true, headers = {}, ...rest } = options;
  const token = getAccessToken();

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (requiresAuth && token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let response = await fetch(url, {
    ...rest,
    headers: reqHeaders,
  });

  // Handle Token Refresh on 401
  if (response.status === 401 && requiresAuth) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setTokens(refreshData.access_token, refreshData.refresh_token);
          reqHeaders["Authorization"] = `Bearer ${refreshData.access_token}`;

          // Retry initial request
          response = await fetch(url, {
            ...rest,
            headers: reqHeaders,
          });
        } else {
          clearTokens();
        }
      } catch {
        clearTokens();
      }
    }
  }

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || errJson.detail?.error?.message || errJson.message || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

// -------------------------------------------------------------
// 1. Authentication API
// -------------------------------------------------------------
export const authApi = {
  login: async (email: string, password: string, role: string = "student") => {
    const res = await apiRequest("/auth/login", {
      method: "POST",
      requiresAuth: false,
      body: JSON.stringify({ email, password, role }),
    });
    if (res.access_token && res.refresh_token) {
      setTokens(res.access_token, res.refresh_token);
      localStorage.setItem("mindsaathi_user", JSON.stringify(res.user));
    }
    return res;
  },

  signupStudent: async (data: any) => {
    return apiRequest("/auth/signup", {
      method: "POST",
      requiresAuth: false,
      body: JSON.stringify(data),
    });
  },

  signupCounselor: async (data: any) => {
    return apiRequest("/auth/signup/counselor", {
      method: "POST",
      requiresAuth: false,
      body: JSON.stringify(data),
    });
  },

  signupAdmin: async (data: any) => {
    return apiRequest("/auth/signup/admin", {
      method: "POST",
      requiresAuth: false,
      body: JSON.stringify(data),
    });
  },

  getMe: async () => {
    return apiRequest("/auth/me");
  },

  logout: async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      clearTokens();
    }
  },
};

// -------------------------------------------------------------
// 2. Student Portal API
// -------------------------------------------------------------
export const studentApi = {
  getProfile: async () => apiRequest("/students/me"),
  updateProfile: async (data: any) => apiRequest("/students/me", { method: "PATCH", body: JSON.stringify(data) }),
  completeOnboarding: async (data: any) => apiRequest("/students/onboarding", { method: "POST", body: JSON.stringify(data) }),
  getAppointments: async () => apiRequest("/students/me/appointments"),
  getSessions: async () => apiRequest("/students/me/sessions"),
};

// -------------------------------------------------------------
// 3. Wellness & Check-ins API
// -------------------------------------------------------------
export const checkinsApi = {
  submitCheckin: async (data: {
    mood_score: number;
    stress_score: number;
    energy_score: number;
    sleep_hours: number;
    sleep_quality: number;
    academic_stress: number;
    social_connection: number;
    journal_text?: string;
  }) => {
    return apiRequest("/checkins", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getToday: async () => apiRequest("/checkins/today"),
  getHistory: async (page = 1, limit = 20) => apiRequest(`/checkins?page=${page}&limit=${limit}`),
};

export const wellnessApi = {
  getTrends: async (period = "7d") => apiRequest(`/wellness/trends?period=${period}`),
  getInsights: async () => apiRequest("/wellness/insights"),
  getMyRisk: async () => apiRequest("/risk/me"),
};

// -------------------------------------------------------------
// 4. Private Journal API
// -------------------------------------------------------------
export const journalApi = {
  getEntries: async () => apiRequest("/journal"),
  createEntry: async (content: string, mood = "Neutral") =>
    apiRequest("/journal", {
      method: "POST",
      body: JSON.stringify({ content, mood }),
    }),
  updateEntry: async (id: string, content: string, mood?: string) =>
    apiRequest(`/journal/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ content, mood }),
    }),
  deleteEntry: async (id: string) => apiRequest(`/journal/${id}`, { method: "DELETE" }),
};

// -------------------------------------------------------------
// 5. AI Companion API
// -------------------------------------------------------------
export const companionApi = {
  chat: async (message: string, conversationId?: string) =>
    apiRequest("/companion/chat", {
      method: "POST",
      body: JSON.stringify({ message, conversation_id: conversationId }),
    }),
};

// -------------------------------------------------------------
// 6. Guided Exercises API
// -------------------------------------------------------------
export const exercisesApi = {
  getExercises: async () => apiRequest("/exercises", { requiresAuth: false }),
  completeExercise: async (exerciseId: string, beforeStress: number, afterStress: number, durationSeconds = 120) =>
    apiRequest(`/exercises/${exerciseId}/complete`, {
      method: "POST",
      body: JSON.stringify({
        before_stress: beforeStress,
        after_stress: afterStress,
        duration_seconds: durationSeconds,
      }),
    }),
};

// -------------------------------------------------------------
// 7. Appointments & Session Booking API
// -------------------------------------------------------------
export const appointmentsApi = {
  requestSession: async (data: {
    counselor_id?: string;
    session_type?: string;
    mode?: string;
    reason?: string;
    scheduled_start: string;
    duration_minutes?: number;
    student_notes?: string;
  }) =>
    apiRequest("/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  reschedule: async (appointmentId: string, newStart: string, message?: string) =>
    apiRequest(`/appointments/${appointmentId}/reschedule`, {
      method: "PATCH",
      body: JSON.stringify({ new_start: newStart, message }),
    }),

  cancel: async (appointmentId: string, reason?: string) =>
    apiRequest(`/appointments/${appointmentId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),
};

// -------------------------------------------------------------
// 8. Counselor Workspace API
// -------------------------------------------------------------
export const counselorApi = {
  getCases: async (riskLevel?: string, status?: string, search?: string) => {
    let url = "/counselor/cases?";
    if (riskLevel) url += `risk_level=${encodeURIComponent(riskLevel)}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    return apiRequest(url);
  },

  getCaseDetail: async (caseId: string) => apiRequest(`/counselor/cases/${caseId}`),
  updateCase: async (caseId: string, data: { status?: string; notes?: string; assigned_counselor_id?: string }) =>
    apiRequest(`/counselor/cases/${caseId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getCaseRisk: async (caseId: string) => apiRequest(`/counselor/cases/${caseId}/risk`),
  getAppointments: async (status?: string) =>
    apiRequest(status ? `/counselor/appointments?status=${status}` : "/counselor/appointments"),
  acceptAppointment: async (appointmentId: string) =>
    apiRequest(`/counselor/appointments/${appointmentId}/accept`, { method: "PATCH" }),
  completeAppointment: async (
    appointmentId: string,
    data: {
      discussion_topics: string;
      summary: string;
      recommendations: string;
      follow_up_required?: boolean;
      next_follow_up_date?: string;
    }
  ) =>
    apiRequest(`/counselor/appointments/${appointmentId}/complete`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  getSessions: async () => apiRequest("/counselor/sessions"),
};

// -------------------------------------------------------------
// 9. Confidential Messaging API
// -------------------------------------------------------------
export const messagesApi = {
  getConversations: async () => apiRequest("/messages"),
  getMessages: async (conversationId: string) => apiRequest(`/messages/${conversationId}`),
  sendMessage: async (content: string, conversationId?: string, receiverId?: string) =>
    apiRequest("/messages", {
      method: "POST",
      body: JSON.stringify({ content, conversation_id: conversationId, receiver_id: receiverId }),
    }),
};

// -------------------------------------------------------------
// 10. Notifications API
// -------------------------------------------------------------
export const notificationsApi = {
  getNotifications: async () => apiRequest("/notifications"),
  getUnreadCount: async () => apiRequest("/notifications/unread-count"),
  markRead: async (id: string) => apiRequest(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: async () => apiRequest("/notifications/read-all", { method: "POST" }),
};

// -------------------------------------------------------------
// 11. Institutional Admin API
// -------------------------------------------------------------
export const adminApi = {
  getOverview: async () => apiRequest("/admin/analytics/overview"),
  getDepartments: async () => apiRequest("/admin/analytics/departments"),
  getStressHotspots: async () => apiRequest("/admin/analytics/stress-hotspots"),
  getRecommendations: async () => apiRequest("/admin/analytics/recommendations"),
  getCounselors: async () => apiRequest("/admin/counselors"),
  getPendingCounselors: async () => apiRequest("/admin/counselors/pending"),
  approveCounselor: async (counselorId: string) =>
    apiRequest(`/admin/counselors/${counselorId}/approve`, { method: "PATCH" }),
  rejectCounselor: async (counselorId: string) =>
    apiRequest(`/admin/counselors/${counselorId}/reject`, { method: "PATCH" }),
  createReport: async (type = "monthly_wellness", startDate?: string, endDate?: string) =>
    apiRequest("/admin/reports", {
      method: "POST",
      body: JSON.stringify({ type, start_date: startDate, end_date: endDate }),
    }),
  getReports: async () => apiRequest("/admin/reports"),
  getAuditLogs: async (limit = 50) => apiRequest(`/admin/audit-logs?limit=${limit}`),
};

// -------------------------------------------------------------
// 12. Privacy & Consent API
// -------------------------------------------------------------
export const privacyApi = {
  getConsent: async () => apiRequest("/privacy/consent"),
  updateConsent: async (consentType: string, granted: boolean) =>
    apiRequest("/privacy/consent", {
      method: "PATCH",
      body: JSON.stringify({ consent_type: consentType, granted }),
    }),
  getMyDataSummary: async () => apiRequest("/privacy/my-data"),
  exportData: async () => apiRequest("/privacy/export", { method: "POST" }),
  deleteAccount: async () => apiRequest("/privacy/account", { method: "DELETE" }),
};
