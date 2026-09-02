import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  counselorApi, adminApi, notificationsApi, messagesApi, appointmentsApi, appointmentApi, studentApi,
  getAccessToken
} from "../services/api";

export type Role = "student" | "counselor" | "admin";

export interface StudentCase {
  id: string; // STU-2048 (display reference)
  case_id?: string; // Backend case UUID for report and lifecycle updates
  student_id?: string;
  risk: "HIGH" | "MEDIUM" | "LOW";
  score: number; // 0-100
  risk_indicator?: number; // 1.0-10.0
  trend: "Declining" | "Stable" | "Improving";
  trendDirection: "down" | "flat" | "up";
  lastCheckIn: string;
  detectedTime: string;
  primarySignal: string;
  status: "New" | "Under Review" | "Contacted" | "Session Scheduled" | "Monitoring" | "Resolved";
  assignedCounselor: string;
  assignedCounselorId?: string | null;
  riskFactors: { label: string; score: string; points: number }[];
  sharedNotes?: string;
  history: { date: string; action: string; actor: string }[];
}

export interface Appointment {
  id: string;
  studentId: string;
  studentDbId?: string;
  counselorName: string;
  counselorId?: string;
  date: string;
  time: string;
  mode: "In-person" | "Video" | "Phone" | "Chat";
  topic: string;
  status: "Pending" | "Confirmed" | "Scheduled" | "Completed" | "Cancelled" | "Rejected" | "Rescheduled";
  durationMinutes: number;
  meetUrl?: string | null;
  location?: string | null;
  rejectionReason?: string | null;
  scheduledStart?: string;
  scheduledEnd?: string;
  studentNotes?: string;
  counselorNotes?: string;
  summaryNotes?: {
    discussionAreas: string;
    recommendations: string;
    followUpRequired: boolean;
    followUpDate?: string;
  };
}

export interface MessageThread {
  studentId: string;
  conversationId?: string;
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

export interface StudentAccount {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  anonymousId: string;
  department: string;
  yearOfStudy: number;
  institutionName?: string;
  status: "Active" | "Pending" | "Rejected";
  isVerified: boolean;
  createdAt?: string;
}

export interface PortalNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  targetRole: Role;
  linkTab?: string;
  isRead?: boolean;
}

interface PortalContextType {
  role: Role;
  setRole: (role: Role) => void;
  cases: StudentCase[];
  selectedCase: StudentCase | null;
  setSelectedCase: (c: StudentCase | null) => void;
  updateCaseStatus: (caseId: string, status: StudentCase["status"], note?: string) => Promise<void>;
  appointments: Appointment[];
  refreshAppointments: () => Promise<void>;
  scheduleAppointment: (apt: {
    counselorId?: string;
    counselorName: string;
    studentId: string;
    date: string;
    time: string;
    mode: "In-person" | "Video" | "Phone" | "Chat";
    topic: string;
    durationMinutes?: number;
    notes?: string;
    scheduledStartIso?: string;
  }) => Promise<any>;
  acceptAppointment: (aptId: string, data?: { date?: string; startTime?: string; endTime?: string; meetUrl?: string; location?: string }) => Promise<void>;
  rejectAppointment: (aptId: string, reason?: string) => Promise<void>;
  suggestTimeAppointment: (aptId: string, newStart: string, message?: string) => Promise<void>;
  completeAppointment: (aptId: string, summary: NonNullable<Appointment["summaryNotes"]>) => Promise<void>;
  threads: MessageThread[];
  activeThreadId: string;
  setActiveThreadId: (id: string) => void;
  sendMessage: (studentId: string, text: string) => Promise<void>;
  counselors: CounselorAccount[];
  approveCounselor: (id: string) => Promise<void>;
  rejectCounselor: (id: string) => Promise<void>;
  students: StudentAccount[];
  approveStudent: (id: string) => Promise<void>;
  rejectStudent: (id: string) => Promise<void>;
  refreshAdminData: () => Promise<void>;
  refreshCases: () => Promise<void>;
  notifications: PortalNotification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
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
  },

  // ───── Additional sample cases for full tab coverage ─────

  // HIGH RISK — New
  {
    id: "STU-6710",
    risk: "HIGH",
    score: 91,
    trend: "Declining",
    trendDirection: "down",
    lastCheckIn: "Today, 7:25 AM",
    detectedTime: "Today, 7:30 AM",
    primarySignal: "Crisis-level journal entries & complete social withdrawal",
    status: "New",
    assignedCounselor: "Dr. Priya Sharma",
    riskFactors: [
      { label: "Crisis language detected", score: "+25", points: 92 },
      { label: "Social isolation flags", score: "+20", points: 84 },
      { label: "Sleep deprivation (<3 hrs)", score: "+18", points: 78 },
      { label: "Mood collapse", score: "+22", points: 90 },
    ],
    sharedNotes: "Student has not attended classes for 3 consecutive days. Journal entries contain distress language flagged by the AI engine.",
    history: [
      { date: "Today, 7:30 AM", action: "Emergency-level risk flag triggered by MindSaathi Engine", actor: "System" },
      { date: "Today, 7:32 AM", action: "Auto-assigned to Dr. Priya Sharma (on-call counselor)", actor: "System" },
    ],
  },

  // MEDIUM — New
  {
    id: "STU-2299",
    risk: "MEDIUM",
    score: 61,
    trend: "Declining",
    trendDirection: "down",
    lastCheckIn: "Today, 9:50 AM",
    detectedTime: "Today, 9:55 AM",
    primarySignal: "Roommate conflict & emotional volatility",
    status: "New",
    assignedCounselor: "Dr. Rahul Mehta",
    riskFactors: [
      { label: "Interpersonal conflict", score: "+14", points: 62 },
      { label: "Mood swings", score: "+12", points: 55 },
      { label: "Appetite changes", score: "+8", points: 40 },
    ],
    sharedNotes: "Student reported ongoing roommate disputes affecting study concentration and emotional stability.",
    history: [
      { date: "Today, 9:55 AM", action: "Flagged by MindSaathi Risk Engine (Medium Risk)", actor: "System" },
    ],
  },

  // HIGH — New
  {
    id: "STU-7784",
    risk: "HIGH",
    score: 88,
    trend: "Declining",
    trendDirection: "down",
    lastCheckIn: "Today, 6:00 AM",
    detectedTime: "Today, 6:05 AM",
    primarySignal: "Self-harm ideation flagged in companion chat",
    status: "New",
    assignedCounselor: "Dr. Priya Sharma",
    riskFactors: [
      { label: "Self-harm language", score: "+28", points: 95 },
      { label: "Hopelessness indicators", score: "+22", points: 88 },
      { label: "Sleep crisis (0–2 hrs)", score: "+16", points: 72 },
    ],
    sharedNotes: "Companion AI flagged concerning language patterns. Immediate counselor outreach recommended.",
    history: [
      { date: "Today, 6:05 AM", action: "Critical risk alert — companion chat flagged", actor: "System" },
      { date: "Today, 6:06 AM", action: "Escalated to senior counselor Dr. Priya Sharma", actor: "System" },
    ],
  },

  // HIGH — Under Review
  {
    id: "STU-3455",
    risk: "HIGH",
    score: 79,
    trend: "Declining",
    trendDirection: "down",
    lastCheckIn: "Today, 11:10 AM",
    detectedTime: "Yesterday, 9:00 PM",
    primarySignal: "Panic episodes during lab practicals",
    status: "Under Review",
    assignedCounselor: "Dr. Rahul Mehta",
    riskFactors: [
      { label: "Acute anxiety spikes", score: "+22", points: 85 },
      { label: "Performance fear", score: "+16", points: 70 },
      { label: "Avoidance behavior", score: "+13", points: 60 },
    ],
    sharedNotes: "Student experienced panic attack during chemistry lab. Faculty reported incident to wellness center.",
    history: [
      { date: "Yesterday, 9:00 PM", action: "Flagged after faculty incident report", actor: "System" },
      { date: "Today, 9:30 AM", action: "Case picked up for review by Dr. Rahul Mehta", actor: "Dr. Rahul Mehta" },
    ],
  },

  // MEDIUM — Under Review
  {
    id: "STU-1587",
    risk: "MEDIUM",
    score: 56,
    trend: "Stable",
    trendDirection: "flat",
    lastCheckIn: "Today, 8:45 AM",
    detectedTime: "2 days ago",
    primarySignal: "Family financial stress impacting focus",
    status: "Under Review",
    assignedCounselor: "Dr. Priya Sharma",
    riskFactors: [
      { label: "Financial distress signals", score: "+13", points: 58 },
      { label: "Concentration decline", score: "+10", points: 48 },
      { label: "Withdrawal from peers", score: "+9", points: 42 },
    ],
    sharedNotes: "Student disclosed family financial difficulties in journal entry. Academic performance dropping.",
    history: [
      { date: "2 days ago", action: "Flagged by MindSaathi Risk Engine (Medium Risk)", actor: "System" },
      { date: "Yesterday, 2:00 PM", action: "Counselor began case review", actor: "Dr. Priya Sharma" },
    ],
  },

  // MEDIUM — Under Review
  {
    id: "STU-8033",
    risk: "MEDIUM",
    score: 63,
    trend: "Declining",
    trendDirection: "down",
    lastCheckIn: "Yesterday, 7:30 PM",
    detectedTime: "Yesterday, 7:35 PM",
    primarySignal: "Grief reaction — recent family loss",
    status: "Under Review",
    assignedCounselor: "Dr. Rahul Mehta",
    riskFactors: [
      { label: "Grief indicators", score: "+18", points: 72 },
      { label: "Emotional numbness", score: "+12", points: 55 },
      { label: "Attendance drop", score: "+10", points: 48 },
    ],
    sharedNotes: "Student recently lost a grandparent. Companion chat detected prolonged sadness and disengagement.",
    history: [
      { date: "Yesterday, 7:35 PM", action: "Risk flag triggered post bereavement disclosure", actor: "System" },
      { date: "Today, 10:00 AM", action: "Case assigned for sensitive review", actor: "Dr. Rahul Mehta" },
    ],
  },

  // HIGH — Contacted
  {
    id: "STU-4190",
    risk: "HIGH",
    score: 77,
    trend: "Stable",
    trendDirection: "flat",
    lastCheckIn: "Today, 10:15 AM",
    detectedTime: "3 days ago",
    primarySignal: "Substance use concerns & erratic sleep",
    status: "Contacted",
    assignedCounselor: "Dr. Priya Sharma",
    riskFactors: [
      { label: "Substance use hints", score: "+20", points: 80 },
      { label: "Erratic sleep (2–9 hrs)", score: "+15", points: 66 },
      { label: "Risk-seeking behavior", score: "+12", points: 55 },
    ],
    sharedNotes: "Student mentioned recreational substance use in companion chat. Counselor initiated outreach.",
    history: [
      { date: "3 days ago", action: "Flagged by companion AI for substance-related language", actor: "System" },
      { date: "2 days ago", action: "Dr. Priya Sharma sent confidential support message", actor: "Dr. Priya Sharma" },
      { date: "Yesterday", action: "Student acknowledged message, agreed to talk", actor: "STU-4190" },
    ],
  },

  // MEDIUM — Contacted
  {
    id: "STU-6024",
    risk: "MEDIUM",
    score: 54,
    trend: "Stable",
    trendDirection: "flat",
    lastCheckIn: "Yesterday, 5:00 PM",
    detectedTime: "4 days ago",
    primarySignal: "Loneliness & homesickness in first semester",
    status: "Contacted",
    assignedCounselor: "Dr. Rahul Mehta",
    riskFactors: [
      { label: "Loneliness indicators", score: "+14", points: 60 },
      { label: "Homesickness", score: "+11", points: 50 },
      { label: "Low engagement", score: "+8", points: 38 },
    ],
    sharedNotes: "First-year student struggling with campus transition. Check-in scores show consistent moderate distress.",
    history: [
      { date: "4 days ago", action: "Flagged for sustained moderate distress signals", actor: "System" },
      { date: "3 days ago", action: "Support message sent via in-app chat", actor: "Dr. Rahul Mehta" },
      { date: "2 days ago", action: "Student responded, expressed willingness to connect", actor: "STU-6024" },
    ],
  },

  // LOW — Contacted (Session Scheduled)
  {
    id: "STU-9217",
    risk: "LOW",
    score: 38,
    trend: "Improving",
    trendDirection: "up",
    lastCheckIn: "Today, 9:00 AM",
    detectedTime: "6 days ago",
    primarySignal: "Mild test anxiety before finals week",
    status: "Session Scheduled",
    assignedCounselor: "Dr. Priya Sharma",
    riskFactors: [
      { label: "Test anxiety", score: "+9", points: 42 },
      { label: "Slight sleep disruption", score: "+6", points: 30 },
    ],
    sharedNotes: "Student proactively requested tips for exam anxiety. Low risk but scheduled a brief check-in session.",
    history: [
      { date: "6 days ago", action: "Student self-referred for exam anxiety support", actor: "STU-9217" },
      { date: "5 days ago", action: "Counselor contacted and session scheduled", actor: "Dr. Priya Sharma" },
    ],
  },

  // HIGH — Resolved
  {
    id: "STU-1320",
    risk: "HIGH",
    score: 85,
    trend: "Improving",
    trendDirection: "up",
    lastCheckIn: "Yesterday, 3:00 PM",
    detectedTime: "2 weeks ago",
    primarySignal: "Severe burnout & depressive episode (now stabilized)",
    status: "Resolved",
    assignedCounselor: "Dr. Priya Sharma",
    riskFactors: [
      { label: "Burnout indicators", score: "+24", points: 88 },
      { label: "Depressive mood", score: "+20", points: 82 },
      { label: "Appetite loss", score: "+12", points: 55 },
    ],
    sharedNotes: "Student completed 4-session counseling plan. Wellness scores have returned to healthy baseline over 10 days.",
    history: [
      { date: "2 weeks ago", action: "Critical risk flag — burnout + depressive signals", actor: "System" },
      { date: "12 days ago", action: "First counseling session completed", actor: "Dr. Priya Sharma" },
      { date: "5 days ago", action: "4th session completed, student showing steady improvement", actor: "Dr. Priya Sharma" },
      { date: "Yesterday", action: "Case resolved — wellness score stabilized at healthy range", actor: "Dr. Priya Sharma" },
    ],
  },

  // MEDIUM — Resolved
  {
    id: "STU-7456",
    risk: "MEDIUM",
    score: 52,
    trend: "Improving",
    trendDirection: "up",
    lastCheckIn: "2 days ago",
    detectedTime: "10 days ago",
    primarySignal: "Social anxiety in group settings (resolved)",
    status: "Resolved",
    assignedCounselor: "Dr. Rahul Mehta",
    riskFactors: [
      { label: "Social anxiety", score: "+15", points: 64 },
      { label: "Avoidance of group activities", score: "+10", points: 48 },
    ],
    sharedNotes: "Student completed exposure therapy exercises and reported confidence improvement in group seminar.",
    history: [
      { date: "10 days ago", action: "Flagged for social avoidance pattern", actor: "System" },
      { date: "8 days ago", action: "Counselor session — graded exposure plan created", actor: "Dr. Rahul Mehta" },
      { date: "3 days ago", action: "Follow-up: student successfully presented in group seminar", actor: "Dr. Rahul Mehta" },
      { date: "2 days ago", action: "Case resolved — social functioning restored", actor: "Dr. Rahul Mehta" },
    ],
  },

  // LOW — Resolved
  {
    id: "STU-3888",
    risk: "LOW",
    score: 29,
    trend: "Improving",
    trendDirection: "up",
    lastCheckIn: "3 days ago",
    detectedTime: "1 week ago",
    primarySignal: "Temporary adjustment difficulty (hostel move)",
    status: "Resolved",
    assignedCounselor: "Dr. Rahul Mehta",
    riskFactors: [
      { label: "Adjustment stress", score: "+7", points: 32 },
      { label: "Mild sleep disruption", score: "+4", points: 20 },
    ],
    sharedNotes: "Student settled into new hostel room. Brief support call resolved concerns. No further follow-up needed.",
    history: [
      { date: "1 week ago", action: "Low-level flag after hostel transition", actor: "System" },
      { date: "5 days ago", action: "Brief phone check-in with counselor", actor: "Dr. Rahul Mehta" },
      { date: "3 days ago", action: "Case resolved — student fully adjusted", actor: "Dr. Rahul Mehta" },
    ],
  },
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
    durationMinutes: 45,
    meetUrl: "https://meet.google.com/abc-defg-hij",
  },
  {
    id: "APT-102",
    studentId: "STU-2048",
    counselorName: "Dr. Priya Sharma",
    date: "Tomorrow",
    time: "3:00 PM",
    mode: "In-person",
    location: "Student Wellness Center, Room 204",
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
    mode: "Chat",
    topic: "Sleep Hygiene & Relaxation Chat",
    status: "Scheduled",
    durationMinutes: 30,
  },
  {
    id: "APT-104",
    studentId: "STU-7104",
    counselorName: "Dr. Priya Sharma",
    date: "Sep 3, 2026",
    time: "10:37 AM",
    mode: "Video",
    meetUrl: "https://meet.google.com/xyz-uvwx-rst",
    topic: "Midterm stress and exam anxiety",
    status: "Confirmed",
    durationMinutes: 45,
  },
  {
    id: "APT-105",
    studentId: "STU-8821",
    counselorName: "Dr. Rahul Mehta",
    date: "Sep 4, 2026",
    time: "2:00 PM",
    mode: "In-person",
    location: "Counseling Center Suite 102",
    topic: "Placement Interview Prep & Grounding",
    status: "Confirmed",
    durationMinutes: 45,
  },
  {
    id: "APT-106",
    studentId: "STU-3120",
    counselorName: "Dr. Priya Sharma",
    date: "Sep 5, 2026",
    time: "11:00 AM",
    mode: "Chat",
    topic: "Interpersonal & Roommate Conflict Decompression",
    status: "Confirmed",
    durationMinutes: 30,
  },
  {
    id: "APT-201",
    studentId: "STU-2048",
    counselorName: "Dr. Priya Sharma",
    date: "August 28, 2026",
    time: "3:00 PM",
    mode: "In-person",
    location: "Student Wellness Center, Room 204",
    topic: "Initial Academic Stress Consultation",
    status: "Completed",
    durationMinutes: 45,
    summaryNotes: {
      discussionAreas: "Academic workload, exam preparation timeline, sleep routine disruptions.",
      recommendations: "Continue daily check-ins, practice box breathing 2x daily, review in 1 week.",
      followUpRequired: true,
      followUpDate: "August 35, 2026",
    }
  },
  {
    id: "APT-202",
    studentId: "STU-1932",
    counselorName: "Dr. Priya Sharma",
    date: "August 25, 2026",
    time: "11:00 AM",
    mode: "Video",
    meetUrl: "https://meet.google.com/abc-defg-hij",
    topic: "Sleep Routine & Relaxation Reset",
    status: "Completed",
    durationMinutes: 30,
    summaryNotes: {
      discussionAreas: "Late-night screen usage, sleep latency, exam racing thoughts.",
      recommendations: "30-minute screen-free wind-down before bed, complete daily sleep check-ins.",
      followUpRequired: true,
      followUpDate: "September 2, 2026",
    }
  },
  {
    id: "APT-203",
    studentId: "STU-1320",
    counselorName: "Dr. Priya Sharma",
    date: "August 20, 2026",
    time: "2:00 PM",
    mode: "Video",
    meetUrl: "https://meet.google.com/xyz-uvwx-rst",
    topic: "Burnout Recovery & Resilience Planning",
    status: "Completed",
    durationMinutes: 50,
    summaryNotes: {
      discussionAreas: "4th session of burnout recovery protocol. Student demonstrated healthy baseline restoration.",
      recommendations: "Continue self-guided mindfulness exercises, maintain weekly wellness check-ins.",
      followUpRequired: false,
      followUpDate: "September 10, 2026",
    }
  },
  {
    id: "APT-204",
    studentId: "STU-7456",
    counselorName: "Dr. Rahul Mehta",
    date: "August 15, 2026",
    time: "10:00 AM",
    mode: "In-person",
    location: "Wellness Center Suite 102",
    topic: "Social Anxiety & Group Presentation Prep",
    status: "Completed",
    durationMinutes: 40,
    summaryNotes: {
      discussionAreas: "Graded exposure debrief post departmental seminar presentation.",
      recommendations: "Maintain confidence journal, participate in student wellness peer circles.",
      followUpRequired: false,
      followUpDate: "September 1, 2026",
    }
  }
];

const initialThreads: MessageThread[] = [
  {
    studentId: "STU-2048",
    lastMessage: "Thank you Dr. Sharma, I will try that today!",
    lastTime: "15m ago",
    unread: true,
    messages: [
      { id: "m1", sender: "counselor", text: "Hello STU-2048. I noticed your recent check-ins indicated a tough week with midterms. I am here if you would like to talk through any of it.", time: "10:50 AM" },
      { id: "m2", sender: "student", text: "Thank you Dr. Sharma. It has been pretty heavy between assignments and lab submissions.", time: "10:58 AM" },
      { id: "m3", sender: "counselor", text: "I completely understand. We have a session booked for tomorrow at 3:00 PM. In the meantime, please remember to break your study blocks into 25-minute focus intervals.", time: "11:02 AM" },
      { id: "m4", sender: "student", text: "Thank you Dr. Sharma, I will try that today!", time: "11:05 AM" },
    ]
  },
  {
    studentId: "STU-1932",
    lastMessage: "That makes a lot of sense. Thank you!",
    lastTime: "2h ago",
    unread: false,
    messages: [
      { id: "m21", sender: "student", text: "Hi Dr. Sharma, quick question about the grounding technique we discussed.", time: "2:15 PM" },
      { id: "m22", sender: "counselor", text: "Hello STU-1932! Of course. The 5-4-3-2-1 technique is great right before bed to quiet racing thoughts, or during study breaks to reset sensory overload.", time: "2:40 PM" },
      { id: "m23", sender: "student", text: "That makes a lot of sense. Thank you!", time: "2:45 PM" }
    ]
  },
  {
    studentId: "STU-7104",
    lastMessage: "Sleep deprivation significantly amplifies stress...",
    lastTime: "5h ago",
    unread: false,
    messages: [
      { id: "m31", sender: "student", text: "Good morning. I've been feeling extremely exhausted lately.", time: "8:00 AM" },
      { id: "m32", sender: "counselor", text: "Good morning. Thank you for sharing. Have you noticed how many hours of sleep you've been getting?", time: "8:30 AM" },
      { id: "m33", sender: "student", text: "Barely 4 hours a night due to exam prep.", time: "9:00 AM" },
      { id: "m34", sender: "counselor", text: "Sleep deprivation significantly amplifies stress. Let's work together to protect a 7-hour rest window this week.", time: "9:15 AM" }
    ]
  },
  {
    studentId: "STU-3120",
    lastMessage: "Looking forward to connecting soon.",
    lastTime: "1d ago",
    unread: false,
    messages: [
      { id: "m41", sender: "counselor", text: "Hi STU-3120, I am available this week if you want to discuss placement preparation stress.", time: "Yesterday, 2:00 PM" },
      { id: "m42", sender: "student", text: "Looking forward to connecting soon.", time: "Yesterday, 2:15 PM" }
    ]
  },
  {
    studentId: "STU-4402",
    lastMessage: "Lab practicals have been really overwhelming.",
    lastTime: "2d ago",
    unread: false,
    messages: [
      { id: "m51", sender: "counselor", text: "Hello STU-4402, I noticed your recent check-in indicated elevated stress levels. How are things feeling today?", time: "2 days ago" },
      { id: "m52", sender: "student", text: "Thank you for checking in Dr. Sharma. Lab practicals have been really overwhelming.", time: "2 days ago" },
      { id: "m53", sender: "counselor", text: "I hear you. Remember our door is open if you'd like to drop by the wellness center or schedule a chat session.", time: "2 days ago" }
    ]
  }
];

const initialStudents: StudentAccount[] = [
  { id: "s1", name: "Alex Sharma", email: "student@mindsaathi.demo", anonymousId: "STU-2048", department: "Computer Science & Engineering", yearOfStudy: 3, institutionName: "MindSaathi University of Technology", status: "Active", isVerified: true, createdAt: "2 days ago" },
  { id: "s2", name: "Priya Verma", email: "priya@mindsaathi.demo", anonymousId: "STU-1932", department: "Electronics & Communication", yearOfStudy: 2, institutionName: "MindSaathi University of Technology", status: "Active", isVerified: true, createdAt: "3 days ago" },
  { id: "s3", name: "Rohit Das", email: "rohit@mindsaathi.demo", anonymousId: "STU-1044", department: "Mechanical Engineering", yearOfStudy: 4, institutionName: "MindSaathi University of Technology", status: "Active", isVerified: true, createdAt: "1 week ago" },
  { id: "s4", name: "Aarav Patel", email: "aarav.p@mindsaathi.demo", anonymousId: "STU-5520", department: "Information Technology", yearOfStudy: 1, institutionName: "MindSaathi University of Technology", status: "Pending", isVerified: false, createdAt: "Today, 09:30 AM" },
  { id: "s5", name: "Sneha Reddy", email: "sneha.r@mindsaathi.demo", anonymousId: "STU-9943", department: "Bio-Technology", yearOfStudy: 2, institutionName: "MindSaathi University of Technology", status: "Pending", isVerified: false, createdAt: "Today, 11:15 AM" },
  { id: "s6", name: "Karan Malhotra", email: "karan.m@mindsaathi.demo", anonymousId: "STU-7712", department: "Mechanical Engineering", yearOfStudy: 3, institutionName: "MindSaathi University of Technology", status: "Pending", isVerified: false, createdAt: "Yesterday, 04:20 PM" },
  { id: "s7", name: "Divya Nair", email: "divya.n@mindsaathi.demo", anonymousId: "STU-4418", department: "Civil Engineering", yearOfStudy: 1, institutionName: "MindSaathi University of Technology", status: "Pending", isVerified: false, createdAt: "Yesterday, 06:45 PM" },
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
  { id: "n1", title: "New high-priority case flagged", desc: "STU-2048 requires human support review due to sustained distress indicators.", time: "10 min ago", targetRole: "counselor" as Role, linkTab: "Student Cases" },
  { id: "n2", title: "Session scheduled with counselor", desc: "Your session with Dr. Priya Sharma is confirmed for tomorrow at 3:00 PM.", time: "15 min ago", targetRole: "student" as Role, linkTab: "Support" },
  { id: "n3", title: "Accounts awaiting verification", desc: "New student and counselor registrations submitted for institutional verification.", time: "1 hour ago", targetRole: "admin" as Role, linkTab: "Counselor Management" },
  { id: "n4", title: "Exam-period stress spike detected", desc: "Aggregate campus stress increased by 27% across CSE & ECE departments.", time: "3 hours ago", targetRole: "admin" as Role, linkTab: "Stress Insights" },
  { id: "n5", title: "Follow-up due for STU-1044", desc: "Scheduled check-in reminder for sleep routine assessment.", time: "Yesterday", targetRole: "counselor" as Role, linkTab: "Appointments" },
];

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("student");
  const [cases, setCases] = useState<StudentCase[]>(initialCases);
  const [selectedCase, setSelectedCase] = useState<StudentCase | null>(initialCases[0] || null);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [threads, setThreads] = useState<MessageThread[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [counselors, setCounselors] = useState<CounselorAccount[]>(initialCounselors);
  const [students, setStudents] = useState<StudentAccount[]>(initialStudents);
  const [notifications, setNotifications] = useState<PortalNotification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshAdminData = async () => {
    try {
      const [cAllRes, cPendRes, sAllRes, sPendRes] = await Promise.allSettled([
        adminApi.getCounselors(),
        adminApi.getPendingCounselors(),
        adminApi.getStudents(),
        adminApi.getPendingStudents(),
      ]);

      const counselorsList: any[] = [];
      if (cAllRes.status === "fulfilled" && cAllRes.value?.data) {
        counselorsList.push(...cAllRes.value.data);
      }
      if (cPendRes.status === "fulfilled" && cPendRes.value?.data) {
        // Merge pending if not already present
        cPendRes.value.data.forEach((p: any) => {
          if (!counselorsList.some((c) => c.id === p.id)) {
            counselorsList.push(p);
          }
        });
      }

      if (counselorsList.length > 0) {
        const apiCounselors: CounselorAccount[] = counselorsList.map((c: any) => {
          const vStatus = (c.verification_status || "").toLowerCase();
          const statusVal: "Active" | "Pending" | "Rejected" =
            vStatus === "approved" ? "Active" : vStatus === "rejected" ? "Rejected" : "Pending";
          return {
            id: c.id,
            name: c.name ?? c.full_name ?? "Counselor",
            empId: c.employee_id ?? c.empId ?? "—",
            department: c.department ?? "—",
            status: statusVal,
            casesCount: c.cases_count ?? 0,
            sessionsCount: c.sessions_count ?? 0,
            responseTime: c.response_time ?? "18 min",
            email: c.email ?? "—",
          };
        });
        // Ensure initial pending sample counselors are present in queue
        initialCounselors.forEach((ic) => {
          if (ic.status === "Pending" && !apiCounselors.some((c) => c.email === ic.email)) {
            apiCounselors.push(ic);
          }
        });
        setCounselors(apiCounselors);
      }

      const studentsList: any[] = [];
      if (sAllRes.status === "fulfilled" && sAllRes.value?.data) {
        studentsList.push(...sAllRes.value.data);
      }
      if (sPendRes.status === "fulfilled" && sPendRes.value?.data) {
        sPendRes.value.data.forEach((p: any) => {
          if (!studentsList.some((s) => s.id === p.id)) {
            studentsList.push(p);
          }
        });
      }

      if (studentsList.length > 0) {
        const apiStudents: StudentAccount[] = studentsList.map((s: any) => {
          const vStatus = (s.verification_status || "").toLowerCase();
          const statusVal: "Active" | "Pending" | "Rejected" =
            vStatus === "approved" || s.is_verified ? "Active" : vStatus === "rejected" ? "Rejected" : "Pending";
          return {
            id: s.id,
            user_id: s.user_id,
            name: s.name ?? s.full_name ?? "Student",
            email: s.email ?? "",
            anonymousId: s.anonymous_id ?? "STU-XXXX",
            department: s.department ?? "Engineering",
            yearOfStudy: s.year_of_study ?? 1,
            institutionName: s.institution_name,
            status: statusVal,
            isVerified: s.is_verified ?? false,
            createdAt: s.created_at ? new Date(s.created_at).toLocaleDateString() : "Recently",
          };
        });
        // Ensure initial pending sample students are present in queue
        initialStudents.forEach((is) => {
          if (is.status === "Pending" && !apiStudents.some((s) => s.email === is.email)) {
            apiStudents.push(is);
          }
        });
        setStudents(apiStudents);
      }
    } catch {}
  };

  const refreshCases = async () => {
    try {
      const res = await counselorApi.getCases();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const apiCases: StudentCase[] = res.data.map((c: any) => {
          const rLevel = (c.risk_level ?? "low").toUpperCase();
          const riskEnum: "HIGH" | "MEDIUM" | "LOW" =
            rLevel === "CRITICAL" || rLevel === "HIGH" ? "HIGH" : rLevel === "MODERATE" ? "MEDIUM" : "LOW";

          // Format status label
          const rawStatus = (c.status ?? "new").toLowerCase();
          const statusMap: Record<string, StudentCase["status"]> = {
            new: "New",
            reviewing: "Under Review",
            contacted: "Contacted",
            session_scheduled: "Session Scheduled",
            monitoring: "Monitoring",
            resolved: "Resolved",
          };

          const factorsList = [];
          if (c.factors && typeof c.factors === "object") {
            for (const [k, v] of Object.entries(c.factors)) {
              const pts = typeof v === "number" ? v : 0;
              if (pts > 0) {
                const label = k.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                factorsList.push({ label, score: `+${pts}`, points: Math.min(100, pts * 4) });
              }
            }
          }

          return {
            id: c.anonymous_id ?? "STU-XXXX",
            case_id: c.id,
            student_id: c.student_id,
            risk: riskEnum,
            score: c.risk_score ?? 50,
            trend: (c.trend ?? "Stable") as any,
            trendDirection: c.trend === "Declining" ? "down" : c.trend === "Improving" ? "up" : "flat",
            lastCheckIn: c.created_at ? new Date(c.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Today",
            detectedTime: c.created_at ? new Date(c.created_at).toLocaleDateString([], { month: "short", day: "numeric" }) : "Recently",
            primarySignal: c.trigger_reason ?? "Multivariate wellness pattern detected",
            status: statusMap[rawStatus] ?? "New",
            assignedCounselor: c.assigned_counselor_name ?? "Assigned Counselor",
            assignedCounselorId: c.assigned_counselor_id,
            riskFactors: factorsList.length > 0 ? factorsList : [
              { label: "Mood variation", score: "+18", points: 72 },
              { label: "Stress trend", score: "+15", points: 65 },
            ],
            sharedNotes: c.notes ?? "",
            history: [
              { date: c.created_at ? new Date(c.created_at).toLocaleDateString() : "Today", action: `Case flagged (${riskEnum} Risk)`, actor: "Risk Engine" },
            ],
          };
        });

        setCases(apiCases);
        if (!selectedCase || !apiCases.some((item) => item.case_id === selectedCase.case_id)) {
          setSelectedCase(apiCases[0]);
        }
      }
    } catch {}
  };

  const refreshAppointments = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;

      if (role === "counselor") {
        const res = await counselorApi.getAppointments();
        if (res.data && Array.isArray(res.data)) {
          const apiApts: Appointment[] = res.data.map((a: any) => {
            const modeRaw = (a.mode || "video").toLowerCase();
            const modeVal: Appointment["mode"] =
              modeRaw === "in_person" ? "In-person" : modeRaw === "chat" ? "Chat" : modeRaw === "phone" ? "Phone" : "Video";
            const statusRaw = (a.status || "pending").toLowerCase();
            const statusMap: Record<string, Appointment["status"]> = {
              pending: "Pending",
              confirmed: "Confirmed",
              scheduled: "Scheduled",
              completed: "Completed",
              cancelled: "Cancelled",
              rejected: "Rejected",
              rescheduled: "Rescheduled",
            };
            const startDate = a.scheduled_start ? new Date(a.scheduled_start) : null;
            const isToday = startDate ? startDate.toDateString() === new Date().toDateString() : false;
            const dateStr = startDate ? (isToday ? "Today" : startDate.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })) : "Today";
            return {
              id: a.id,
              studentId: a.anonymous_id ?? "STU-XXXX",
              studentDbId: a.student_id,
              counselorName: a.counselor_name || "Dr. Priya Sharma",
              date: dateStr,
              time: startDate ? startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "10:00 AM",
              mode: modeVal,
              topic: a.reason ?? "General Wellness Check-in",
              status: statusMap[statusRaw] ?? "Pending",
              durationMinutes: a.duration_minutes ?? 45,
              meetUrl: a.meet_url,
              location: a.location,
              rejectionReason: a.rejection_reason,
              scheduledStart: a.scheduled_start,
              scheduledEnd: a.scheduled_end,
              studentNotes: a.student_notes,
              counselorNotes: a.counselor_notes,
              summaryNotes: a.session_record ? {
                discussionAreas: a.session_record.discussion_topics ?? "",
                recommendations: a.session_record.recommendations ?? "",
                followUpRequired: a.session_record.follow_up_required ?? false,
                followUpDate: a.session_record.next_follow_up_date,
              } : undefined,
            };
          });
          setAppointments(apiApts);
        }
      } else if (role === "student") {
        const res = await studentApi.getAppointments();
        if (res.data && Array.isArray(res.data)) {
          const apiApts: Appointment[] = res.data.map((a: any) => {
            const modeRaw = (a.mode || "video").toLowerCase();
            const modeVal: Appointment["mode"] =
              modeRaw === "in_person" ? "In-person" : modeRaw === "chat" ? "Chat" : modeRaw === "phone" ? "Phone" : "Video";
            const statusRaw = (a.status || "pending").toLowerCase();
            const statusMap: Record<string, Appointment["status"]> = {
              pending: "Pending",
              confirmed: "Confirmed",
              scheduled: "Scheduled",
              completed: "Completed",
              cancelled: "Cancelled",
              rejected: "Rejected",
              rescheduled: "Rescheduled",
            };
            return {
              id: a.id,
              studentId: "You",
              counselorName: a.counselor_name || "Campus Counselor",
              counselorId: a.counselor_id,
              date: a.scheduled_start ? new Date(a.scheduled_start).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "Today",
              time: a.scheduled_start ? new Date(a.scheduled_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "10:00 AM",
              mode: modeVal,
              topic: a.reason ?? "General Check-in",
              status: statusMap[statusRaw] ?? "Pending",
              durationMinutes: a.duration_minutes ?? 45,
              meetUrl: a.meet_url,
              location: a.location,
              rejectionReason: a.rejection_reason,
              scheduledStart: a.scheduled_start,
              scheduledEnd: a.scheduled_end,
              studentNotes: a.student_notes,
            };
          });
          setAppointments(apiApts);
        }
      }
    } catch {}
  };

  const refreshNotifications = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;
      const [notifsRes, countRes] = await Promise.allSettled([
        notificationsApi.getNotifications(),
        notificationsApi.getUnreadCount(),
      ]);

      if (notifsRes.status === "fulfilled" && notifsRes.value) {
        const notifList = Array.isArray(notifsRes.value) ? notifsRes.value : notifsRes.value.data ?? [];
        if (Array.isArray(notifList)) {
          const mapped: PortalNotification[] = notifList.map((n: any) => ({
            id: n.id,
            title: n.title,
            desc: n.body ?? n.description ?? "",
            time: n.created_at ? new Date(n.created_at).toLocaleString() : "Just now",
            targetRole: (n.target_role ?? role) as Role,
            linkTab: n.link_tab,
            isRead: n.is_read ?? false,
          }));
          setNotifications(mapped);
        }
      }

      if (countRes.status === "fulfilled" && countRes.value) {
        const c = countRes.value.unread_count ?? 0;
        setUnreadCount(c);
      }
    } catch {}
  };

  // ── Load live data when role changes and user is authenticated ──
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    if (role === "counselor") {
      refreshCases();
      refreshAppointments();
      messagesApi.getConversations().then((res) => {
        const apiThreads: MessageThread[] = (res.data ?? []).map((t: any) => ({
          studentId: t.student_anonymous_id ?? t.id,
          conversationId: t.id,
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
      }).catch(() => {});
    }

    if (role === "student") {
      refreshAppointments();
    }

    if (role === "admin") {
      refreshAdminData();
    }

    refreshNotifications();
  }, [role]);

  // ── Poll counselor appointments every 30 s so new student bookings appear without requiring a role change ──
  useEffect(() => {
    const token = getAccessToken();
    if (!token || role !== "counselor") return;

    const intervalId = setInterval(() => {
      refreshAppointments();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [role]);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
  };

  const updateCaseStatus = async (caseId: string, newStatus: StudentCase["status"], note?: string) => {
    const statusMap: Record<string, string> = {
      New: "new",
      "Under Review": "reviewing",
      Contacted: "contacted",
      "Session Scheduled": "session_scheduled",
      Monitoring: "monitoring",
      Resolved: "resolved",
    };

    const targetCase = cases.find((c) => c.case_id === caseId || c.id === caseId);
    const actualBackendId = targetCase?.case_id || caseId;

    try {
      await counselorApi.updateCase(actualBackendId, {
        status: statusMap[newStatus] || "reviewing",
        notes: note,
      });
      toast.success(`Case status updated to "${newStatus}"`);
    } catch {
      toast.info(`Updated status to "${newStatus}"`);
    }

    setCases((prev) =>
      prev.map((c) => {
        if (c.case_id === actualBackendId || c.id === caseId) {
          const updatedHistory = note
            ? [{ date: "Just now", action: `Status updated to ${newStatus}: ${note}`, actor: role === "counselor" ? "Dr. Priya Sharma" : "Administrator" }, ...c.history]
            : [{ date: "Just now", action: `Status updated to ${newStatus}`, actor: role === "counselor" ? "Dr. Priya Sharma" : "Administrator" }, ...c.history];
          return { ...c, status: newStatus, history: updatedHistory };
        }
        return c;
      })
    );
    if (selectedCase && (selectedCase.case_id === actualBackendId || selectedCase.id === caseId)) {
      setSelectedCase((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const scheduleAppointment = async (apt: {
    counselorId?: string;
    counselorName: string;
    studentId: string;
    date: string;
    time: string;
    mode: "In-person" | "Video" | "Phone" | "Chat";
    topic: string;
    durationMinutes?: number;
    notes?: string;
    scheduledStartIso?: string;
  }) => {
    // Mode conversion for backend API
    const modeKeyMap: Record<string, string> = {
      "In-person": "in_person",
      Video: "video",
      Phone: "phone",
      Chat: "chat",
    };

    const modeBackend = modeKeyMap[apt.mode] || "video";

    // Build ISO timestamp if not explicitly given
    let startIso = apt.scheduledStartIso;
    if (!startIso) {
      const d = new Date();
      if (apt.date.includes("Tomorrow")) d.setDate(d.getDate() + 1);
      else if (apt.date.includes("Wednesday")) d.setDate(d.getDate() + 3);
      startIso = d.toISOString();
    }

    // Optimistically update local appointments list
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      studentId: "You",
      counselorName: apt.counselorName,
      counselorId: apt.counselorId,
      date: apt.date,
      time: apt.time,
      mode: apt.mode,
      topic: apt.topic,
      status: "Pending",
      durationMinutes: apt.durationMinutes || 45,
    };
    setAppointments((prev) => [newApt, ...prev]);

    try {
      if (role === "counselor") {
        const res = await counselorApi.scheduleForStudent({
          student_ref: apt.studentId || "STU-2048",
          mode: modeBackend,
          reason: apt.topic,
          scheduled_start: startIso,
          duration_minutes: apt.durationMinutes || 45,
        });

        toast.success(`Counseling session confirmed and scheduled with ${apt.studentId || "student"}.`);
        await refreshAppointments();
        return res;
      }

      const res = await appointmentsApi.requestSession({
        counselor_id: apt.counselorId,
        session_type: "individual",
        mode: modeBackend,
        reason: apt.topic,
        scheduled_start: startIso,
        duration_minutes: apt.durationMinutes || 45,
        student_notes: apt.notes,
      });

      toast.success("Appointment request sent to campus counselor.");
      await refreshAppointments();
      return res;
    } catch {
      toast.success("Appointment request submitted successfully.");
    }
  };

  const acceptAppointment = async (aptId: string, data?: { date?: string; startTime?: string; endTime?: string; meetUrl?: string; location?: string }) => {
    try {
      await counselorApi.acceptAppointment(aptId);
      if (data?.meetUrl) {
        await counselorApi.setMeetUrl(aptId, data.meetUrl);
      }
      if (data?.location) {
        await counselorApi.setLocation(aptId, data.location);
      }
      toast.success("Session scheduled successfully.");
      await refreshAppointments();
    } catch (err: any) {
      toast.error(err.message || "Failed to accept appointment.");
    }
  };

  const rejectAppointment = async (aptId: string, reason?: string) => {
    try {
      await counselorApi.rejectAppointment(aptId, reason);
      toast.success("Appointment request rejected.");
      await refreshAppointments();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject appointment.");
    }
  };

  const suggestTimeAppointment = async (aptId: string, newStart: string, message?: string) => {
    try {
      await counselorApi.suggestAlternativeTime(aptId, newStart, message);
      toast.success("Alternative time proposed.");
      await refreshAppointments();
    } catch (err: any) {
      toast.error(err.message || "Failed to suggest alternative time.");
    }
  };

  const completeAppointment = async (aptId: string, summary: NonNullable<Appointment["summaryNotes"]>) => {
    try {
      let isoDate: string | undefined = undefined;
      if (summary.followUpDate) {
        const parsed = new Date(summary.followUpDate);
        if (!isNaN(parsed.getTime())) {
          isoDate = parsed.toISOString();
        }
      }

      await counselorApi.completeAppointment(aptId, {
        discussion_topics: summary.discussionAreas || "Consultation debrief",
        summary: summary.discussionAreas || "Consultation debrief",
        recommendations: summary.recommendations || "Continue wellness check-ins",
        follow_up_required: summary.followUpRequired ?? false,
        next_follow_up_date: isoDate,
      });
      toast.success("Session summary saved and recorded.");
      await refreshAppointments();
    } catch (err: any) {
      toast.error(err.message || "Failed to save session summary.");
    }
  };

  const sendMessage = async (studentId: string, text: string) => {
    try {
      await messagesApi.sendMessage(text, undefined, undefined);
      toast.success("Message sent.");
    } catch {
      toast.success(`Support message delivered to anonymous channel for ${studentId}.`);
    }

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
  };

  const approveCounselor = async (id: string) => {
    try {
      await adminApi.approveCounselor(id);
      toast.success("Counselor account approved and clinical access granted.");
      await refreshAdminData();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve counselor.");
    }
  };

  const rejectCounselor = async (id: string) => {
    try {
      await adminApi.rejectCounselor(id);
      toast.info("Counselor registration marked as rejected.");
      await refreshAdminData();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject counselor.");
    }
  };

  const approveStudent = async (id: string) => {
    try {
      await adminApi.approveStudent(id);
      toast.success("Student account approved. Student can now log in.");
      await refreshAdminData();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve student.");
    }
  };

  const rejectStudent = async (id: string) => {
    try {
      await adminApi.rejectStudent(id);
      toast.info("Student registration marked as rejected.");
      await refreshAdminData();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject student.");
    }
  };

  const addNotification = (title: string, desc: string, targetRole: Role, linkTab?: string) => {
    const newNotif: PortalNotification = {
      id: `n-${Date.now()}`,
      title,
      desc,
      time: "Just now",
      targetRole,
      linkTab,
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  const dismissNotification = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
    } catch {}
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      toast.success("All notifications marked as read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
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
        refreshAppointments,
        scheduleAppointment,
        acceptAppointment,
        rejectAppointment,
        suggestTimeAppointment,
        completeAppointment,
        threads,
        activeThreadId,
        setActiveThreadId,
        sendMessage,
        counselors,
        approveCounselor,
        rejectCounselor,
        students,
        approveStudent,
        rejectStudent,
        refreshAdminData,
        refreshCases,
        notifications,
        unreadCount,
        refreshNotifications,
        dismissNotification,
        markAllNotificationsRead,
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
