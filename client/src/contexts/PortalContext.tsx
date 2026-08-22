import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  counselorApi, adminApi, notificationsApi, messagesApi,
  getAccessToken
} from "../services/api";

export type Role = "student" | "counselor" | "admin";

export interface StudentCase {
  id: string; // STU-2048
  risk: "HIGH" | "MEDIUM" | "LOW";
  score: number; // e.g. 82
  trend: "Declining" | "Stable" | "Improving";
  trendDirection: "down" | "flat" | "up";
  lastCheckIn: string;
  detectedTime: string;
  primarySignal: string;
  status: "New" | "Under Review" | "Contacted" | "Session Scheduled" | "Monitoring" | "Resolved";
  assignedCounselor: string;
  riskFactors: { label: string; score: string; points: number }[];
  sharedNotes?: string;
  history: { date: string; action: string; actor: string }[];
}

export interface Appointment {
  id: string;
  studentId: string;
  counselorName: string;
  date: string;
  time: string;
  mode: "In-person" | "Video" | "Phone";
  topic: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  durationMinutes: number;
  summaryNotes?: {
    discussionAreas: string;
    recommendations: string;
    followUpRequired: boolean;
    followUpDate?: string;
  };
}

export interface MessageThread {
  studentId: string;
  lastMessage: string;
  lastTime: string;
  unread: boolean;
  messages: { id: string; sender: "counselor" | "student"; text: string; time: string }[];
}

export interface CounselorAccount {
  id: string;
  name: string;
  empId: string;
  department: string;
  status: "Active" | "Pending" | "Rejected";
  casesCount: number;
  sessionsCount: number;
  responseTime: string;
  email: string;
}

export interface PortalNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  targetRole: Role;
  linkTab?: string;
}

interface PortalContextType {
  role: Role;
  setRole: (role: Role) => void;
  cases: StudentCase[];
  selectedCase: StudentCase | null;
  setSelectedCase: (c: StudentCase | null) => void;
  updateCaseStatus: (caseId: string, status: StudentCase["status"], note?: string) => void;
  appointments: Appointment[];
  scheduleAppointment: (apt: Omit<Appointment, "id" | "status">) => void;
  completeAppointment: (aptId: string, summary: NonNullable<Appointment["summaryNotes"]>) => void;
  threads: MessageThread[];
  activeThreadId: string;
  setActiveThreadId: (id: string) => void;
  sendMessage: (studentId: string, text: string) => void;
  counselors: CounselorAccount[];
  approveCounselor: (id: string) => void;
  rejectCounselor: (id: string) => void;
  notifications: PortalNotification[];
  dismissNotification: (id: string) => void;
  addNotification: (title: string, desc: string, targetRole: Role, linkTab?: string) => void;
}

const initialCases: StudentCase[] = [
  {
    id: "STU-2048",
    risk: "HIGH",
    score: 82,
    trend: "Declining",
    trendDirection: "down",
    lastCheckIn: "Today, 10:42 AM",
    detectedTime: "Today, 10:42 AM",
    primarySignal: "Sustained low mood & high exam stress",
    status: "New",
    assignedCounselor: "Dr. Priya Sharma",
    riskFactors: [
      { label: "Mood decline", score: "+21", points: 84 },
      { label: "Stress trend", score: "+17", points: 76 },
      { label: "Sleep reduction", score: "+12", points: 62 },
      { label: "Journal emotional signal", score: "+18", points: 72 },
      { label: "Recent check-in pattern", score: "+14", points: 58 },
      { label: "Crisis indicator (elevated language)", score: "+20", points: 80 },
    ],
    sharedNotes: "Student expressed difficulty keeping up with midterm prep and reduced sleep schedule (approx 4.5 hrs/night).",
    history: [
      { date: "Today, 10:42 AM", action: "Flagged by MindSaathi Risk Engine (High Risk)", actor: "System" },
      { date: "Today, 10:45 AM", action: "Assigned to Dr. Priya Sharma", actor: "System" },
    ],
  },
  {
    id: "STU-1932",
    risk: "MEDIUM",
    score: 64,
    trend: "Stable",
    trendDirection: "flat",
    lastCheckIn: "Today, 9:15 AM",
    detectedTime: "Yesterday, 3:20 PM",
    primarySignal: "Academic workload and relationship fatigue",
    status: "Monitoring",
    assignedCounselor: "Dr. Priya Sharma",
    riskFactors: [
      { label: "Stress trend", score: "+15", points: 65 },
      { label: "Sleep irregularities", score: "+9", points: 45 },
      { label: "Mood variation", score: "+11", points: 52 },
    ],
    sharedNotes: "Attended one grounding session last week. Monitoring daily check-ins.",
    history: [
      { date: "Yesterday, 3:20 PM", action: "Flagged with Medium Risk indicators", actor: "System" },
      { date: "Yesterday, 4:00 PM", action: "Counselor reviewed and initiated monitoring", actor: "Dr. Priya Sharma" },
    ],
  },
  {
    id: "STU-1044",
    risk: "LOW",
    score: 41,
    trend: "Improving",
    trendDirection: "up",
    lastCheckIn: "Yesterday, 6:30 PM",
    detectedTime: "3 days ago",
    primarySignal: "Sleep schedule adjustment",
    status: "Session Scheduled",
    assignedCounselor: "Dr. Rahul Mehta",
    riskFactors: [
      { label: "Sleep concerns", score: "+8", points: 38 },
      { label: "Daytime fatigue", score: "+6", points: 30 },
    ],
    history: [
      { date: "3 days ago", action: "Check-in identified sleep pattern shift", actor: "System" },
      { date: "2 days ago", action: "Session scheduled for sleep hygiene guidance", actor: "Dr. Rahul Mehta" },
    ],
  },
  {
    id: "STU-3120",
    risk: "MEDIUM",
    score: 58,
    trend: "Declining",
    trendDirection: "down",
    lastCheckIn: "2 days ago",
    detectedTime: "2 days ago",
    primarySignal: "Placement season anxiety",
    status: "Contacted",
    assignedCounselor: "Dr. Priya Sharma",
    riskFactors: [
      { label: "Placement anxiety", score: "+16", points: 68 },
      { label: "Anxiety spikes", score: "+14", points: 60 },
    ],
    history: [
      { date: "2 days ago", action: "Flagged by Risk Engine", actor: "System" },
      { date: "Yesterday, 11:30 AM", action: "Support message sent to student", actor: "Dr. Priya Sharma" },
    ],
  },
  {
    id: "STU-4402",
    risk: "HIGH",
    score: 86,
    trend: "Declining",
    trendDirection: "down",
    lastCheckIn: "Today, 8:10 AM",
    detectedTime: "Today, 8:15 AM",
    primarySignal: "Consecutive 4-day distress signal",
    status: "Under Review",
    assignedCounselor: "Dr. Priya Sharma",
    riskFactors: [
      { label: "Mood drop", score: "+23", points: 88 },
      { label: "Acute stress", score: "+19", points: 79 },
      { label: "Social isolation flags", score: "+15", points: 65 },
    ],
    history: [
      { date: "Today, 8:15 AM", action: "High-priority alert triggered", actor: "System" },
    ],
  },
  {
    id: "STU-5891",
    risk: "LOW",
    score: 34,
    trend: "Improving",
    trendDirection: "up",
    lastCheckIn: "Yesterday, 4:00 PM",
    detectedTime: "5 days ago",
    primarySignal: "General check-in follow-up",
    status: "Resolved",
    assignedCounselor: "Dr. Rahul Mehta",
    riskFactors: [
      { label: "Initial adjustment stress", score: "+5", points: 25 },
    ],
    history: [
      { date: "5 days ago", action: "Initial review", actor: "Dr. Rahul Mehta" },
      { date: "Yesterday", action: "Case marked as Resolved after successful exercises", actor: "Dr. Rahul Mehta" },
    ],
  }
];

const initialAppointments: Appointment[] = [
  {
    id: "APT-101",
    studentId: "STU-1932",
    counselorName: "Dr. Priya Sharma",
    date: "Today",
    time: "10:00 AM",
    mode: "Video",
    topic: "Follow-up & Academic Stress",
    status: "Scheduled",
    durationMinutes: 30,
  },
  {
    id: "APT-102",
    studentId: "STU-2048",
    counselorName: "Dr. Priya Sharma",
    date: "Tomorrow",
    time: "3:00 PM",
    mode: "In-person",
    topic: "Academic stress & Midterm support",
    status: "Scheduled",
    durationMinutes: 45,
  },
  {
    id: "APT-103",
    studentId: "STU-1044",
    counselorName: "Dr. Rahul Mehta",
    date: "Today",
    time: "4:30 PM",
    mode: "Video",
    topic: "Sleep Hygiene & Relaxation",
    status: "Scheduled",
    durationMinutes: 30,
  },
  {
    id: "APT-104",
    studentId: "STU-2048",
    counselorName: "Dr. Priya Sharma",
    date: "August 18, 2026",
    time: "3:00 PM",
    mode: "In-person",
    topic: "Initial Academic Stress Consultation",
    status: "Completed",
    durationMinutes: 42,
    summaryNotes: {
      discussionAreas: "Academic workload, exam preparation timeline, sleep routine disruptions.",
      recommendations: "Continue daily check-ins, practice box breathing 2x daily, review in 1 week.",
      followUpRequired: true,
      followUpDate: "August 23, 2026",
    }
  }
];

const initialThreads: MessageThread[] = [
  {
    studentId: "STU-2048",
    lastMessage: "Thank you for scheduling the session, Dr. Sharma.",
    lastTime: "11:05 AM",
    unread: true,
    messages: [
      { id: "m1", sender: "counselor", text: "Hello. I noticed your recent check-ins indicated a tough week with midterms. I am here if you would like to talk through any of it.", time: "10:50 AM" },
      { id: "m2", sender: "student", text: "Thank you Dr. Sharma. It has been pretty heavy between assignments and lab submissions.", time: "10:58 AM" },
      { id: "m3", sender: "counselor", text: "I completely understand. We have a session booked for tomorrow at 3:00 PM. In the meantime, please remember to take small pauses.", time: "11:02 AM" },
      { id: "m4", sender: "student", text: "Thank you for scheduling the session, Dr. Sharma.", time: "11:05 AM" },
    ]
  },
  {
    studentId: "STU-1932",
    lastMessage: "I wanted to ask about the grounding technique...",
    lastTime: "Yesterday",
    unread: false,
    messages: [
      { id: "m21", sender: "student", text: "I wanted to ask about the grounding technique we discussed.", time: "Yesterday, 2:15 PM" },
      { id: "m22", sender: "counselor", text: "Of course! The 5-4-3-2-1 technique is great right before starting study sessions.", time: "Yesterday, 2:40 PM" }
    ]
  },
  {
    studentId: "STU-3120",
    lastMessage: "Looking forward to connecting soon.",
    lastTime: "2 days ago",
    unread: false,
    messages: [
      { id: "m31", sender: "counselor", text: "Hi, I am available this week if you want to discuss placement prep stress.", time: "2 days ago" },
      { id: "m32", sender: "student", text: "Looking forward to connecting soon.", time: "2 days ago" }
    ]
  }
];

const initialCounselors: CounselorAccount[] = [
  { id: "c1", name: "Dr. Priya Sharma", empId: "EMP-1092", department: "Student Wellness Center", status: "Active", casesCount: 12, sessionsCount: 38, responseTime: "16 min", email: "priya.sharma@mindsaathi.demo" },
  { id: "c2", name: "Dr. Rahul Mehta", empId: "EMP-1140", department: "Academic Support & Guidance", status: "Active", casesCount: 9, sessionsCount: 31, responseTime: "21 min", email: "rahul.mehta@mindsaathi.demo" },
  { id: "c3", name: "Dr. Kavita Verma", empId: "EMP-1322", department: "Campus Mental Health Cell", status: "Active", casesCount: 7, sessionsCount: 24, responseTime: "19 min", email: "kavita.verma@mindsaathi.demo" },
  { id: "c4", name: "Dr. Ananya Singh", empId: "EMP-2841", department: "Engineering Student Care", status: "Pending", casesCount: 0, sessionsCount: 0, responseTime: "N/A", email: "ananya.singh@mindsaathi.demo" },
  { id: "c5", name: "Dr. Vikram Joshi", empId: "EMP-2904", department: "Hostel & Residential Wellness", status: "Pending", casesCount: 0, sessionsCount: 0, responseTime: "N/A", email: "vikram.joshi@mindsaathi.demo" },
  { id: "c6", name: "Dr. Sanya Nair", empId: "EMP-3011", department: "Postgraduate Student Support", status: "Pending", casesCount: 0, sessionsCount: 0, responseTime: "N/A", email: "sanya.nair@mindsaathi.demo" },
];

const initialNotifications: PortalNotification[] = [
  { id: "n1", title: "New high-priority case flagged", desc: "STU-2048 requires human support review due to sustained distress indicators.", time: "10 min ago", targetRole: "counselor" as Role, linkTab: "High-risk cases" },
  { id: "n2", title: "Session scheduled with counselor", desc: "Your session with Dr. Priya Sharma is confirmed for tomorrow at 3:00 PM.", time: "15 min ago", targetRole: "student" as Role, linkTab: "Support" },
  { id: "n3", title: "3 counselor accounts awaiting verification", desc: "Dr. Ananya Singh and 2 others submitted institutional credentials for approval.", time: "1 hour ago", targetRole: "admin" as Role, linkTab: "Counselor Management" },
  { id: "n4", title: "Exam-period stress spike detected", desc: "Aggregate campus stress increased by 27% across CSE & ECE departments.", time: "3 hours ago", targetRole: "admin" as Role, linkTab: "Stress Insights" },
  { id: "n5", title: "Follow-up due for STU-1044", desc: "Scheduled check-in reminder for sleep routine assessment.", time: "Yesterday", targetRole: "counselor" as Role, linkTab: "Appointments" },
];

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("student");
  const [cases, setCases] = useState<StudentCase[]>(initialCases);
  const [selectedCase, setSelectedCase] = useState<StudentCase | null>(initialCases[0]);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [threads, setThreads] = useState<MessageThread[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string>("STU-2048");
  const [counselors, setCounselors] = useState<CounselorAccount[]>(initialCounselors);
  const [notifications, setNotifications] = useState<PortalNotification[]>(initialNotifications);

  // ── Load live data when role changes and user is authenticated ──
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    if (role === "counselor") {
      // Load counselor cases
      counselorApi.getCases().then((res) => {
        const apiCases: StudentCase[] = (res.data ?? []).map((c: any) => ({
          id: c.anonymous_id ?? c.id,
          risk: (c.risk_level ?? "LOW").toUpperCase() as "HIGH" | "MEDIUM" | "LOW",
          score: c.risk_score ?? 50,
          trend: c.trend ?? "Stable",
          trendDirection: c.trend === "Declining" ? "down" : c.trend === "Improving" ? "up" : "flat",
          lastCheckIn: c.last_checkin ?? "—",
          detectedTime: c.created_at ?? "—",
          primarySignal: c.primary_signal ?? "Wellness monitoring",
          status: c.status ?? "New",
          assignedCounselor: c.assigned_counselor ?? "Unassigned",
          riskFactors: c.risk_factors ?? [],
          sharedNotes: c.notes ?? "",
          history: c.history ?? [],
        }));
        if (apiCases.length > 0) {
          setCases(apiCases);
          setSelectedCase(apiCases[0]);
        }
      }).catch(() => { /* keep mock data */ });

      // Load counselor appointments
      counselorApi.getAppointments().then((res) => {
        const apiApts: Appointment[] = (res.data ?? []).map((a: any) => ({
          id: a.id,
          studentId: a.student_anonymous_id ?? a.student_id,
          counselorName: a.counselor_name ?? "Your Counselor",
          date: a.scheduled_start ? new Date(a.scheduled_start).toLocaleDateString() : "TBD",
          time: a.scheduled_start ? new Date(a.scheduled_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD",
          mode: (a.mode ?? "video").charAt(0).toUpperCase() + (a.mode ?? "video").slice(1) as "In-person" | "Video" | "Phone",
          topic: a.session_type ?? "Wellness Support",
          status: (a.status ?? "scheduled").charAt(0).toUpperCase() + (a.status ?? "scheduled").slice(1) as "Scheduled" | "Completed" | "Cancelled",
          durationMinutes: a.duration_minutes ?? 30,
          summaryNotes: a.session_record ? {
            discussionAreas: a.session_record.discussion_topics ?? "",
            recommendations: a.session_record.recommendations ?? "",
            followUpRequired: a.session_record.follow_up_required ?? false,
            followUpDate: a.session_record.next_follow_up_date,
          } : undefined,
        }));
        if (apiApts.length > 0) setAppointments(apiApts);
      }).catch(() => { /* keep mock data */ });

      // Load message threads
      messagesApi.getConversations().then((res) => {
        const apiThreads: MessageThread[] = (res.data ?? []).map((t: any) => ({
          studentId: t.student_anonymous_id ?? t.id,
          lastMessage: t.last_message ?? "",
          lastTime: t.last_time ?? "—",
          unread: t.unread_count > 0,
          messages: (t.messages ?? []).map((m: any) => ({
            id: m.id,
            sender: m.sender_role === "counselor" ? "counselor" : "student",
            text: m.content,
            time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
          })),
        }));
        if (apiThreads.length > 0) setThreads(apiThreads);
      }).catch(() => { /* keep mock data */ });
    }

    if (role === "admin") {
      // Load counselor list
      adminApi.getCounselors().then((res) => {
        const apiCounselors: CounselorAccount[] = (res.data ?? []).map((c: any) => ({
          id: c.id,
          name: c.full_name ?? "Unknown",
          empId: c.employee_id ?? "—",
          department: c.department ?? "—",
          status: (c.approval_status === "approved" ? "Active" : c.approval_status === "pending" ? "Pending" : "Rejected") as "Active" | "Pending" | "Rejected",
          casesCount: c.active_cases ?? 0,
          sessionsCount: c.total_sessions ?? 0,
          responseTime: c.avg_response_time ?? "—",
          email: c.email ?? "—",
        }));
        if (apiCounselors.length > 0) setCounselors(apiCounselors);
      }).catch(() => { /* keep mock data */ });
    }

    // Load notifications for all roles
    notificationsApi.getNotifications().then((res) => {
      const apiNotifs: PortalNotification[] = (res.data ?? []).map((n: any) => ({
        id: n.id,
        title: n.title,
        desc: n.body ?? n.description ?? "",
        time: n.created_at ? new Date(n.created_at).toLocaleString() : "—",
        targetRole: (n.target_role ?? role) as Role,
        linkTab: n.link_tab,
      }));
      if (apiNotifs.length > 0) setNotifications(apiNotifs);
    }).catch(() => { /* keep mock data */ });

  }, [role]);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
  };

  const updateCaseStatus = (caseId: string, newStatus: StudentCase["status"], note?: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id === caseId) {
          const updatedHistory = note
            ? [{ date: "Just now", action: `Status updated to ${newStatus}: ${note}`, actor: role === "counselor" ? "Dr. Priya Sharma" : "Administrator" }, ...c.history]
            : [{ date: "Just now", action: `Status updated to ${newStatus}`, actor: role === "counselor" ? "Dr. Priya Sharma" : "Administrator" }, ...c.history];
          return { ...c, status: newStatus, history: updatedHistory };
        }
        return c;
      })
    );
    if (selectedCase && selectedCase.id === caseId) {
      setSelectedCase((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    toast.success(`Case ${caseId} status updated to "${newStatus}"`);
  };

  const scheduleAppointment = (apt: Omit<Appointment, "id" | "status">) => {
    const newApt: Appointment = {
      ...apt,
      id: `APT-${Date.now().toString().slice(-4)}`,
      status: "Scheduled",
    };
    setAppointments((prev) => [newApt, ...prev]);

    // Update case status to Session Scheduled
    updateCaseStatus(apt.studentId, "Session Scheduled", `Session scheduled for ${apt.date} at ${apt.time} (${apt.mode})`);

    // Add notification to student and counselor
    addNotification(
      "Counseling Session Scheduled",
      `Session with ${apt.counselorName} is confirmed for ${apt.date} at ${apt.time}.`,
      "student",
      "Support"
    );
    addNotification(
      `Session Scheduled with ${apt.studentId}`,
      `Appointment set for ${apt.date} at ${apt.time} (${apt.mode}).`,
      "counselor",
      "Appointments"
    );

    toast.success(`Session with ${apt.studentId} scheduled for ${apt.date} at ${apt.time}!`);
  };

  const completeAppointment = (aptId: string, summary: NonNullable<Appointment["summaryNotes"]>) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === aptId) {
          return { ...a, status: "Completed", summaryNotes: summary };
        }
        return a;
      })
    );

    // Update associated case to Monitoring
    const apt = appointments.find((a) => a.id === aptId);
    if (apt) {
      updateCaseStatus(apt.studentId, "Monitoring", "Counseling session completed. Follow-up monitoring active.");
    }

    toast.success("Session summary saved and case status updated to Monitoring.");
  };

  const sendMessage = (studentId: string, text: string) => {
    const newMsg = {
      id: `m-${Date.now()}`,
      sender: "counselor" as const,
      text,
      time: "Just now",
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.studentId === studentId) {
          return {
            ...t,
            lastMessage: text,
            lastTime: "Just now",
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      })
    );

    // Ensure case is marked as Contacted if it was New
    const targetCase = cases.find((c) => c.id === studentId);
    if (targetCase && (targetCase.status === "New" || targetCase.status === "Under Review")) {
      updateCaseStatus(studentId, "Contacted", "Counselor initiated supportive message");
    }

    toast.success(`Support message delivered to anonymous channel for ${studentId}.`);
  };

  const approveCounselor = (id: string) => {
    setCounselors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "Active" as const } : c))
    );
    addNotification("Counselor Account Approved", "Institutional credentials verified and active.", "admin", "Counselor Management");
    toast.success("Counselor account approved and active access granted.");
  };

  const rejectCounselor = (id: string) => {
    setCounselors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "Rejected" as const } : c))
    );
    toast.info("Counselor registration marked as rejected.");
  };

  const addNotification = (title: string, desc: string, targetRole: Role, linkTab?: string) => {
    const newNotif: PortalNotification = {
      id: `n-${Date.now()}`,
      title,
      desc,
      time: "Just now",
      targetRole,
      linkTab,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <PortalContext.Provider
      value={{
        role,
        setRole,
        cases,
        selectedCase,
        setSelectedCase,
        updateCaseStatus,
        appointments,
        scheduleAppointment,
        completeAppointment,
        threads,
        activeThreadId,
        setActiveThreadId,
        sendMessage,
        counselors,
        approveCounselor,
        rejectCounselor,
        notifications,
        dismissNotification,
        addNotification,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error("usePortal must be used within a PortalProvider");
  }
  return context;
}
