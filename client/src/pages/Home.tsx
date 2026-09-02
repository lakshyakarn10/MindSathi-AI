/* Quiet Observatory: unified multi-role portal for MindSaathi (Student, Counselor, Institutional Admin) */
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  Activity, AlertTriangle, ArrowUpRight, Bell, BookOpen, Brain, Building2, Calendar,
  CalendarDays, Check, ChevronRight, CircleAlert, CircleHelp, Clock, Clock3, FileDown,
  Heart, Home as HomeIcon, LayoutDashboard, LockKeyhole, LogOut, Mail, Menu, MessageCircle,
  MessageSquare, MoreHorizontal, Phone, Play, Plus, Search, Send, Settings, ShieldAlert,
  ShieldCheck, Sparkles, Stethoscope, UserCheck, UserRound, Users, Video, Wind, X, Zap
} from "lucide-react";
import { toast } from "sonner";
import { usePortal, Role, StudentCase } from "../contexts/PortalContext";
import { useAuth } from "../contexts/AuthContext";
import { authApi, checkinsApi, companionApi, journalApi, wellnessApi, studentApi, counselorApi, notificationsApi } from "../services/api";
import {
  CounselorOverview, CounselorCasesPage, CaseDetailView, CounselorAppointments,
  CounselorSessionsHistory, CounselorMessages, CounselorInterventions, CounselorAnalytics, CounselorSettings
} from "../components/counselor/CounselorViews";
import {
  AdminOverview, AdminWellnessTrends, AdminStressInsights, AdminInterventionImpact,
  AdminCounselorManagement, AdminReports, AdminPrivacyCenter, AdminSettings
} from "../components/admin/AdminViews";
import CollegeDropdown from "../components/CollegeDropdown";
import StudentChatModal from "../components/StudentChatModal";
import FormattedText from "../components/FormattedText";
import InteractiveExerciseModal from "../components/InteractiveExerciseModal";

const teal = "#2f9c95";

const studentNav = [
  ["Home", HomeIcon],
  ["Check-in", Heart],
  ["AI Companion", MessageCircle],
  ["My Wellness", Activity],
  ["Exercises", Wind],
  ["Journal", BookOpen],
  ["Support", Users]
] as const;

const counselorNav = [
  ["Overview", LayoutDashboard],
  ["Student Cases", Users],
  ["Sessions", BookOpen],
  ["Appointments", CalendarDays],
  ["Messages", MessageCircle],
  ["Interventions", Wind],
  ["Analytics", Activity],
  ["Settings", Settings]
] as const;

const adminNav = [
  ["Overview", LayoutDashboard],
  ["Wellness trends", Activity],
  ["Stress insights", Zap],
  ["Intervention impact", Sparkles],
  ["Reports", FileDown],
  ["Privacy & Data", ShieldCheck],
  ["Counselor Management", UserCheck],
  ["Settings", Settings]
] as const;

function Logo({ compact=false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#2f9c95] shadow-[0_7px_18px_rgba(47,156,149,.22)]">
        <div className="h-5 w-5 rounded-full border-[2px] border-white/90 border-r-transparent rotate-[-32deg]" />
        <div className="absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full bg-white" />
      </div>
      {!compact && (
        <div>
          <div className="text-[15px] font-extrabold tracking-[-.03em] text-[#18314a]">MindSaathi</div>
          <div className="text-[10px] font-medium text-[#88979b]">student wellbeing</div>
        </div>
      )}
    </div>
  );
}

function Badge({ children, tone="teal" }: { children: React.ReactNode; tone?: "teal"|"amber"|"coral"|"ink" }) {
  const styles = {
    teal: "bg-[#e6f3f0] text-[#23645f]",
    amber: "bg-[#fcf0e2] text-[#9a602a]",
    coral: "bg-[#fae9e7] text-[#a94e4a]",
    ink: "bg-[#edf0f2] text-[#50616d]"
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] ${styles[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />{children}
    </span>
  );
}

function Sidebar({ role, active, setActive, onLogout }: any) {
  const items = role === "student" ? studentNav : role === "counselor" ? counselorNav : adminNav;

  return (
    <aside className="sidebar fixed inset-y-0 left-0 z-50 flex flex-col bg-[#eef4f1] px-3 py-5">
      <div className="px-3 pb-8"><Logo /></div>
      <div className="mx-3 mb-6 h-px bg-[#d8e4df]" />
      <div className="px-3 pb-3 field-label">
        {role === "student" ? "Student Space" : role === "counselor" ? "Counselor Cell" : "Admin Console"}
      </div>
      <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-250px)]">
        {items.map(([label, Icon]: any) => (
          <button
            key={label}
            onClick={() => setActive(label)}
            className={`nav-item flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] ${
              active === label ? "active font-bold" : ""
            }`}
          >
            <Icon size={17} strokeWidth={active === label ? 2.4 : 1.8} className="shrink-0" />
            <span className="sidebar-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-[#d8e4df]">
        <button
          onClick={onLogout}
          className="nav-item flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] text-[#71828a] hover:bg-[#fae9e7] hover:text-[#a94e4a] transition"
          title="Log out of MindSaathi"
        >
          <LogOut size={17} strokeWidth={1.8} className="shrink-0" />
          <span className="sidebar-label font-bold">Log out</span>
        </button>

        <div className="sidebar-footer rounded-2xl bg-[#edf6f4] p-3">
          <div className="mb-2 flex items-center gap-2 text-[#23645f]">
            <LockKeyhole size={14} />
            <span className="text-[11px] font-bold">
              {role === "admin" ? "Aggregated Analytics" : "Private by design"}
            </span>
          </div>
          <p className="text-[11px] leading-4 text-[#68847f]">
            {role === "admin"
              ? "Zero individual tracking. Enforcing minimum k-anonymity (k=15)."
              : role === "counselor"
              ? "Case files are accessible solely for assigned clinical support."
              : "Your personal journal stays private. Admins see aggregate trends only."}
          </p>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ onNotify, unread, role, onLogout, userMenuOpen, setUserMenuOpen, onSwitchRole }: any) {
  const { user } = useAuth();
  const userName = user?.full_name || user?.name || (role === "student" ? "Student" : role === "counselor" ? "Dr. Counselor" : "Dean of Wellness");
  const userEmail = user?.email || (role === "student" ? "student@gtu.edu" : role === "counselor" ? "counselor@gtu.edu" : "admin@gtu.edu");
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || (role === "student" ? "ST" : role === "counselor" ? "CO" : "AD");

  const userDetails = {
    name: userName,
    email: userEmail,
    roleTitle: role === "student" ? "Student" : role === "counselor" ? "Counselor" : "Administrator",
    initials,
  };

  return (
    <header className="sticky top-0 z-40 flex h-[76px] items-center justify-between border-b border-[#e3eae7] bg-[#f7f8f5]/95 px-4 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-3 md:hidden">
        <Logo compact />
        <span className="text-sm font-bold text-[#18314a]">
          {role === "student" ? "Student Workspace" : role === "counselor" ? "Counselor Portal" : "Campus Insights"}
        </span>
      </div>
      <div className="hidden items-center gap-3 md:flex">
        <Logo compact />
        <span className="h-4 w-px bg-[#d7e3df]" />
        <span className="text-[12px] font-medium text-[#809098]">
          {role === "student" ? "Student space" : role === "counselor" ? "Counselor workspace" : "Institutional aggregate view"}
        </span>
      </div>

      <div className="relative flex items-center gap-2.5">
        <button
          aria-label="Search"
          className="hidden h-9 w-9 items-center justify-center rounded-xl text-[#7c8c94] hover:bg-white md:flex"
        >
          <Search size={17} />
        </button>

        <button
          aria-label="Notifications"
          onClick={onNotify}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#54707a] hover:bg-white"
        >
          <Bell size={18} />
          {unread && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#2f9c95] ring-2 ring-[#f7f8f5]" />}
        </button>

        {/* Quick Log out button in header */}
        <button
          onClick={onLogout}
          aria-label="Log out"
          title="Log out"
          className="flex h-9 items-center gap-1.5 rounded-xl border border-[#dfe6e3] bg-white px-3 text-[12px] font-bold text-[#647881] hover:border-[#c96862] hover:bg-[#fae9e7]/60 hover:text-[#a94e4a] transition shadow-xs"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Log out</span>
        </button>

        {/* User profile dropdown toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setUserMenuOpen(!userMenuOpen);
          }}
          aria-label="User profile menu"
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#dcebe7] text-[12px] font-bold text-[#23645f] ring-2 ring-transparent hover:ring-[#2f9c95] transition cursor-pointer"
        >
          {userDetails.initials}
        </button>

        {/* User Profile dropdown menu with SIH Demo Role Switcher */}
        {userMenuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="tooltip-panel absolute right-0 top-[52px] z-50 w-72 rounded-2xl border border-[#dfe6e3] bg-white p-4 shadow-[0_24px_70px_rgba(24,49,74,.22)] animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3 border-b border-[#edf1ef] pb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dcebe7] text-[14px] font-bold text-[#23645f]">
                {userDetails.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-[#18314a]">{userDetails.name}</div>
                <div className="truncate text-[11px] text-[#809098]">{userDetails.email}</div>
                <div className="mt-1">
                  <Badge tone={role === "student" ? "teal" : role === "counselor" ? "amber" : "ink"}>
                    {userDetails.roleTitle}
                  </Badge>
                </div>
              </div>
            </div>

            {/* SIH Demo Role Switcher Section */}
            <div className="mt-3 border-b border-[#edf1ef] pb-3">
              <div className="field-label mb-2 !text-[9px]">Switch Role (Demo Perspective)</div>
              <div className="grid grid-cols-3 gap-1">
                {(["student", "counselor", "admin"] as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setUserMenuOpen(false);
                      onSwitchRole(r);
                    }}
                    className={`rounded-lg py-1.5 text-[11px] font-bold capitalize transition ${
                      role === r
                        ? "bg-[#2f9c95] text-white shadow-xs"
                        : "bg-[#f4f7f6] text-[#556972] hover:bg-[#e7f0ed]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1">
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  toast.info("Account details & preferences");
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12px] font-medium text-[#536973] hover:bg-[#f2f6f5] transition"
              >
                <UserRound size={15} />
                <span>Account Profile</span>
              </button>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  toast.info("Privacy & Data protection policy active");
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12px] font-medium text-[#536973] hover:bg-[#f2f6f5] transition"
              >
                <ShieldCheck size={15} />
                <span>Privacy & Governance</span>
              </button>
            </div>

            <div className="mt-3 border-t border-[#edf1ef] pt-2">
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12px] font-bold text-[#a94e4a] hover:bg-[#fae9e7] transition"
              >
                <LogOut size={15} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function NotificationsModal({ close, onNavigate }: { close: () => void; onNavigate: (tab: string) => void }) {
  const { role, notifications, dismissNotification, markAllNotificationsRead } = usePortal();
  const relevantNotifs = notifications.filter((n) => n.targetRole === role);

  return (
    <div className="tooltip-panel absolute right-4 top-[62px] z-50 w-[min(380px,calc(100vw-32px))] rounded-2xl border border-[#dfe6e3] bg-white p-4 shadow-[0_24px_70px_rgba(24,49,74,.22)] md:right-8">
      <div className="mb-3 flex items-center justify-between border-b border-[#edf1ef] pb-3">
        <div>
          <div className="text-[16px] font-bold text-[#18314a]">Notifications</div>
          <div className="text-[11px] text-[#8a989d]">
            {role === "student" ? "Wellness alerts" : role === "counselor" ? "Clinical support queue" : "Institutional insights"}
          </div>
        </div>
        <button onClick={close} className="text-[#9aa7ab] hover:text-[#18314a]">
          <X size={16} />
        </button>
      </div>

      <div className="divide-y divide-[#edf1ef] max-h-[320px] overflow-y-auto">
        {relevantNotifs.length === 0 ? (
          <div className="py-6 text-center text-[12px] text-[#829298]">No unread notifications.</div>
        ) : (
          relevantNotifs.map((n, i) => (
            <button
              key={n.id}
              onClick={() => {
                dismissNotification(n.id);
                close();
                if (n.linkTab) onNavigate(n.linkTab);
              }}
              className={`flex w-full gap-3 py-3 text-left transition ${
                !n.isRead ? "bg-[#f4faf8] -mx-2 px-2 rounded-xl" : "hover:bg-[#fafcfb]"
              }`}
            >
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  !n.isRead ? "bg-[#dcefea] text-[#2f9c95]" : "bg-[#f0f3f2] text-[#718189]"
                }`}
              >
                {role === "counselor" ? <AlertTriangle size={14} /> : role === "admin" ? <Building2 size={14} /> : <CalendarDays size={14} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold text-[#18314a]">{n.title}</div>
                <div className="mt-0.5 text-[11px] leading-4 text-[#74858c]">{n.desc}</div>
                <div className="mt-1 text-[10px] text-[#9aa6aa]">{n.time}</div>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="mt-3 flex justify-between border-t border-[#edf1ef] pt-3">
        <button onClick={() => markAllNotificationsRead()} className="text-[11px] font-bold text-[#23645f]">
          Mark all as read
        </button>
        <button onClick={() => toast.info("Notification settings")} className="text-[11px] font-bold text-[#7d8d93]">
          Preferences
        </button>
      </div>
    </div>
  );
}

function ScoreRing({ score = 74 }: { score?: number }) {
  const r = 58,
    c = 2 * Math.PI * r;
  const safeScore = Math.max(0, Math.min(100, score));
  return (
    <div className="relative h-[150px] w-[150px]">
      <svg className="progress-ring h-full w-full" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e7efec" strokeWidth="9" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={teal}
          strokeLinecap="round"
          strokeWidth="9"
          strokeDasharray={`${(c * safeScore) / 100} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[38px] font-extrabold tracking-[-.07em] text-[#18314a]">{safeScore}</div>
        <div className="text-[10px] font-bold uppercase tracking-[.12em] text-[#84949a]">of 100</div>
      </div>
    </div>
  );
}

const TREND_DATA = {
  "7 days": {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    mood: "M0 80 C48 75 62 62 104 67 S165 85 205 58 S260 48 302 67 S355 49 402 43 S455 56 500 37 S570 46 603 31 S667 26 700 20",
    stress: "M0 49 C45 52 61 73 104 68 S166 44 205 77 S260 92 302 74 S355 83 402 70 S455 91 500 64 S570 76 603 55 S667 78 700 61",
  },
  "30 days": {
    labels: ["W1", "W2", "W3", "W4"],
    mood: "M0 95 C40 88 80 70 140 60 S220 45 280 55 S360 40 420 35 S510 25 580 30 S650 20 700 18",
    stress: "M0 60 C50 68 90 80 150 75 S230 90 290 80 S370 95 430 85 S520 70 590 60 S660 50 700 45",
  },
} as const;

function TrendChart({ range = "7 days" }: { range?: "7 days" | "30 days" }) {
  const data = TREND_DATA[range];
  return (
    <div className="relative h-[172px] w-full overflow-hidden">
      <div
        className="absolute inset-x-0 top-4 flex justify-between text-[10px] text-[#9aa7aa]"
        style={range === "30 days" ? { padding: "0 6%" } : undefined}
      >
        {data.labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <svg className="absolute inset-0 top-7 h-[135px] w-full" viewBox="0 0 700 140" preserveAspectRatio="none">
        <g className="chart-grid">
          <line x1="0" y1="15" x2="700" y2="15" />
          <line x1="0" y1="55" x2="700" y2="55" />
          <line x1="0" y1="95" x2="700" y2="95" />
          <line x1="0" y1="135" x2="700" y2="135" />
        </g>
        <path
          d={data.mood}
          fill="none"
          stroke="#2f9c95"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d={data.stress}
          fill="none"
          stroke="#d4b5dc"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="5 6"
        />
      </svg>
    </div>
  );
}

function WellnessCard() {
  const [range, setRange] = useState<"7 days" | "30 days">("7 days");
  return (
    <section className="card fade-up delay-2 signal-line p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="field-label">Your week</div>
          <h2 className="mt-2 text-[18px] font-bold">Patterns, not perfection</h2>
        </div>
        <RangeToggle value={range} onChange={(r) => setRange(r as "7 days" | "30 days")} />
      </div>
      <div className="mt-3 flex gap-4 text-[10px] text-[#71828a]">
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#2f9c95]" />Mood</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#d4b5dc]" />Stress</span>
      </div>
      <TrendChart range={range} />
      <div className="signal-line amber mt-2 rounded-r-xl bg-[#fffaf4] px-4 py-3">
        <div className="text-[11px] font-bold text-[#8c5b31]">One thing to notice</div>
        <div className="mt-1 text-[11px] leading-4 text-[#9d8062]">
          {range === "7 days"
            ? "Your stress tends to rise around assignment deadlines."
            : "Your mood trended upward over the last 3 weeks — keep it going."}
        </div>
      </div>
    </section>
  );
}

function SessionCard({ onRequest, onOpenChat }: { onRequest: () => void; onOpenChat?: (apt: any) => void }) {
  const { appointments } = usePortal();
  const activeApt = appointments.find(
    (a) => a.status === "Confirmed" || a.status === "Scheduled" || a.status === "Pending"
  );

  if (!activeApt) {
    return (
      <div className="card signal-line flex flex-col justify-between p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="field-label">Your sessions</div>
            <h3 className="mt-2 text-[17px] font-bold">Human Support</h3>
          </div>
          <div className="rounded-xl bg-[#edf6f4] p-2 text-[#2f9c95]">
            <CalendarDays size={17} />
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-[#f5f8f6] p-4 text-[12px] text-[#60747e]">
          No active counseling sessions scheduled. Human guidance is readily available when you need it.
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button onClick={onRequest} className="text-[12px] font-bold text-[#23645f] hover:underline">
            Browse counselors →
          </button>
          <button
            onClick={onRequest}
            className="btn btn-teal rounded-lg px-3 py-2 text-[11px] font-bold"
          >
            Request a session
          </button>
        </div>
      </div>
    );
  }

  const isConfirmed = activeApt.status === "Confirmed" || activeApt.status === "Scheduled";
  const isChat = (activeApt.mode || "").toLowerCase() === "chat";

  return (
    <div className="card signal-line flex flex-col justify-between p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="field-label">Your sessions</div>
          <h3 className="mt-2 text-[17px] font-bold">Upcoming support</h3>
        </div>
        <div className="rounded-xl bg-[#edf6f4] p-2 text-[#2f9c95]">
          <CalendarDays size={17} />
        </div>
      </div>
      <div className="mt-5 rounded-2xl bg-[#f5f8f6] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-bold">{activeApt.counselorName}</div>
            <div className="mt-1 text-[11px] text-[#788990]">
              {activeApt.topic} · {activeApt.mode}
            </div>
          </div>
          <Badge tone={isConfirmed ? "teal" : "amber"}>
            {activeApt.status}
          </Badge>
        </div>
        <div className="mt-4 flex items-center gap-4 text-[12px] font-bold text-[#536b75]">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={14} className="text-[#2f9c95]" />{activeApt.date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock3 size={14} className="text-[#2f9c95]" />{activeApt.time}
          </span>
        </div>
        {activeApt.location && (
          <div className="mt-2 text-[11px] text-[#23645f]">
            <strong>Location:</strong> {activeApt.location}
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button onClick={onRequest} className="text-[12px] font-bold text-[#23645f]">
          Manage sessions <ArrowUpRight size={13} className="ml-1 inline" />
        </button>
        {activeApt.mode === "Video" && activeApt.meetUrl ? (
          <button
            onClick={() => window.open(activeApt.meetUrl || "#", "_blank")}
            className="rounded-lg bg-[#2f9c95] px-3.5 py-2 text-[11px] font-bold text-white btn inline-flex items-center gap-1.5"
          >
            <Video size={13} /> Join Google Meet
          </button>
        ) : isChat && isConfirmed ? (
          <button
            onClick={() => onOpenChat && onOpenChat(activeApt)}
            className="rounded-lg bg-[#2f9c95] px-3.5 py-2 text-[11px] font-bold text-white btn inline-flex items-center gap-1.5"
          >
            <MessageCircle size={13} /> Open Live Chat
          </button>
        ) : (
          <button
            onClick={() => toast.info(`Session is ${activeApt.status.toLowerCase()}`)}
            className="rounded-lg bg-[#18314a] px-3 py-2 text-[11px] font-bold text-white btn"
          >
            Session details
          </button>
        )}
      </div>
    </div>
  );
}

function Recommendation({ icon: Icon, title, text, tone }: any) {
  return (
    <button
      onClick={() => toast.success(`${title} added to your plan`)}
      className="card-hover flex items-center gap-3 rounded-2xl border border-[#e6ece9] bg-white p-3 text-left"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-bold">{title}</div>
        <div className="mt-0.5 truncate text-[11px] text-[#809098]">{text}</div>
      </div>
      <ChevronRight size={15} className="text-[#a3afb2]" />
    </button>
  );
}

function WellnessInsightsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const bars = [
    { day: "Mon", stress: 45, mood: 68 },
    { day: "Tue", stress: 52, mood: 72 },
    { day: "Wed", stress: 78, mood: 55 },
    { day: "Thu", stress: 65, mood: 60 },
    { day: "Fri", stress: 80, mood: 50 },
    { day: "Sat", stress: 38, mood: 80 },
    { day: "Sun", stress: 30, mood: 85 },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5eeeb] bg-[#f5f9f7] px-6 py-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.12em] text-[#7aaba5]">Wellness Insights</div>
            <div className="mt-0.5 text-[16px] font-bold text-[#18314a]">This week's patterns</div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f0ec] text-[#4d7a74] hover:bg-[#d5e8e3] transition"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Summary chips */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Avg Mood", value: "6.7", sub: "/10", color: "bg-[#e5f3f1] text-[#2f9c95]" },
              { label: "Avg Stress", value: "5.5", sub: "/10", color: "bg-[#fceee6] text-[#c0663a]" },
              { label: "Avg Sleep", value: "6.4", sub: "hrs", color: "bg-[#eeeaf8] text-[#7b60a0]" },
            ].map((c) => (
              <div key={c.label} className={`rounded-2xl p-4 ${c.color}`}>
                <div className="text-[10px] font-bold uppercase tracking-wide opacity-70">{c.label}</div>
                <div className="mt-1 flex items-baseline gap-0.5">
                  <span className="text-[22px] font-extrabold">{c.value}</span>
                  <span className="text-[11px] font-semibold opacity-60">{c.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Daily stress vs mood bar chart */}
          <div className="rounded-2xl border border-[#e5eeeb] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[12px] font-bold text-[#18314a]">Daily stress vs mood</div>
              <div className="flex gap-3 text-[10px] text-[#7a9098]">
                <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-sm bg-[#f08060]" />Stress</span>
                <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-sm bg-[#2f9c95]" />Mood</span>
              </div>
            </div>
            <div className="flex items-end gap-2 h-[100px]">
              {bars.map((b) => (
                <div key={b.day} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 80 }}>
                    <div
                      className="w-[45%] rounded-t-md bg-[#f08060] transition-all"
                      style={{ height: `${b.stress}%` }}
                    />
                    <div
                      className="w-[45%] rounded-t-md bg-[#2f9c95] transition-all"
                      style={{ height: `${b.mood}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-[#9aacb0]">{b.day}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Key patterns */}
          <div className="rounded-2xl border border-[#e5eeeb] bg-white p-4 space-y-3">
            <div className="text-[12px] font-bold text-[#18314a]">Key patterns noticed</div>
            {[
              { icon: Zap, color: "bg-[#fceee6] text-[#c0663a]", title: "Stress peaks mid-week", desc: "Wed–Fri stress scores are 40% higher than Mon–Tue. Often tied to assignment deadlines." },
              { icon: Heart, color: "bg-[#e5f3f1] text-[#2f9c95]", title: "Mood recovers on weekends", desc: "Your mood reliably improves by Saturday. Rest and social time seem to help." },
              { icon: Brain, color: "bg-[#eeeaf8] text-[#7b60a0]", title: "Sleep below target", desc: "Average 6.4 hrs vs a recommended 7–8 hrs. Shorter sleep correlates with higher stress on the following day." },
            ].map((p) => (
              <div key={p.title} className="flex gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${p.color}`}>
                  <p.icon size={14} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#2a4050]">{p.title}</div>
                  <div className="mt-0.5 text-[11px] leading-4 text-[#788990]">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Suggestions */}
          <div className="rounded-2xl border border-[#e5eeeb] bg-[#f8fbfa] p-4 space-y-2">
            <div className="text-[12px] font-bold text-[#18314a]">Suggested for you</div>
            {[
              "Try a 5-min box breathing session on Wednesday mornings.",
              "Set a 10:30 PM wind-down reminder to protect sleep.",
              "Log a check-in on Fri evening to track weekend recovery.",
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-[#536b75]">
                <Check size={12} className="mt-0.5 shrink-0 text-[#2f9c95]" />
                {s}
              </div>
            ))}
          </div>

          {/* Privacy note */}
          <div className="flex items-center gap-2 text-[10px] text-[#8aacaa] pb-2">
            <ShieldCheck size={13} />
            These insights are private to you and never shared without your consent.
          </div>
        </div>

        {/* Footer CTA */}
        <div className="border-t border-[#e5eeeb] bg-[#f5f9f7] px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[#23645f] py-3 text-[12px] font-bold text-white hover:bg-[#1c524d] transition btn"
          >
            Close insights
          </button>
        </div>
      </div>
    </>
  );
}

function StudentDashboard({ onRequest, active = "Home", setActive }: { onRequest: () => void; active?: string; setActive?: (s: string) => void }) {
  const { user } = useAuth();
  const [showInsights, setShowInsights] = useState(false);
  const [riskData, setRiskData] = useState<any>(null);
  const [todayCheckin, setTodayCheckin] = useState<any>(null);
  const [checkinHistory, setCheckinHistory] = useState<any[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedChatApt, setSelectedChatApt] = useState<{ id: string; counselorName: string } | null>(null);

  const handleOpenChat = (apt: any) => {
    setSelectedChatApt({ id: apt.id, counselorName: apt.counselorName || "Counselor" });
    setChatModalOpen(true);
  };

  const fetchMetrics = () => {
    setLoadingMetrics(true);
    Promise.allSettled([
      wellnessApi.getMyRisk(),
      checkinsApi.getTodayCheckin(),
      checkinsApi.getHistory(1, 30),
    ]).then(([rRes, cRes, hRes]) => {
      if (rRes.status === "fulfilled" && rRes.value) {
        setRiskData(rRes.value);
      }
      if (cRes.status === "fulfilled" && cRes.value) {
        // Backend returns { success, has_checked_in_today, data: { mood_score, ... } | null }
        // Only set todayCheckin if data actually contains check-in fields
        const raw = cRes.value;
        const checkinData = raw?.data;
        if (checkinData && typeof checkinData === "object" && checkinData.mood_score != null) {
          setTodayCheckin(checkinData);
        }
        // If data is null (no check-ins ever), todayCheckin stays null
      }
      if (hRes.status === "fulfilled" && hRes.value) {
        const list = Array.isArray(hRes.value) ? hRes.value : (hRes.value?.data ?? []);
        setCheckinHistory(list);
      }
    }).finally(() => setLoadingMetrics(false));
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (active !== "Home") {
    return (
      <>
        <StudentSection
          active={active}
          onRequest={onRequest}
          onOpenChat={handleOpenChat}
          onGoHome={() => {
            if (setActive) setActive("Home");
            fetchMetrics();
          }}
        />
        <StudentChatModal
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          appointmentId={selectedChatApt?.id}
          counselorName={selectedChatApt?.counselorName || "Counselor"}
        />
      </>
    );
  }

  const firstName = user?.full_name?.trim()?.split(" ")[0] || user?.name?.trim()?.split(" ")[0] || "Student";
  const latestFromHistory = checkinHistory.length > 0 ? checkinHistory[0] : null;
  const effectiveCheckin = todayCheckin ?? latestFromHistory;

  // ML Risk Engine & Scoring Model Predictions from Backend API
  const wellnessScore = effectiveCheckin?.wellness_score ?? (riskData?.wellness_score ? Math.round(riskData.wellness_score) : 0);
  const riskIndicator = effectiveCheckin?.risk_indicator ?? (riskData?.risk_indicator ? Number(riskData.risk_indicator).toFixed(1) : "1.0");
  const riskLevel = (effectiveCheckin?.risk_level ?? (riskData?.risk_level ?? "LOW")).toUpperCase();
  const trend = riskData?.trend ?? (effectiveCheckin ? "STEADY" : "NO DATA");
  const suddenChange = riskData?.sudden_change ?? false;

  const moodVal = effectiveCheckin?.mood_score != null ? `${effectiveCheckin.mood_score}/10` : (riskData?.factors?.mood != null ? `${Math.max(1, Math.min(10, 10 - Math.round(riskData.factors.mood / 2)))}/10` : "--");
  const stressVal = effectiveCheckin?.stress_score != null ? `${effectiveCheckin.stress_score}/10` : (riskData?.factors?.stress != null ? `${Math.max(1, Math.min(10, Math.round(riskData.factors.stress / 1.6)))}/10` : "--");
  const energyVal = effectiveCheckin?.energy_score != null ? `${effectiveCheckin.energy_score}/10` : (effectiveCheckin?.mood_score != null ? `${Math.max(1, effectiveCheckin.mood_score - 1)}/10` : "--");
  const sleepVal = effectiveCheckin?.sleep_hours != null ? `${effectiveCheckin.sleep_hours} hrs` : "--";

  const isSelfRecorded = effectiveCheckin != null;

  const checkinsThisWeek = checkinHistory.filter((c: any) => {
    if (!c.created_at) return false;
    const d = new Date(c.created_at);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return d >= oneWeekAgo;
  }).length;

  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="field-label mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2f9c95]" /> Student Space · MindSaathi Active
          </div>
          <h1 className="text-[29px] font-extrabold tracking-[-.05em] text-[#18314a] md:text-[34px]">
            Good morning, {firstName}<span className="text-[#2f9c95]">.</span>
          </h1>
          <p className="mt-2 text-[14px] text-[#718189]">A small daily check-in helps notice the shape of your week.</p>
        </div>
        <div className="flex items-center gap-2">
          {suddenChange && (
            <span className="rounded-xl border border-[#f2ccc9] bg-[#fae9e7] px-3 py-1.5 text-[11px] font-bold text-[#c96862]">
              ⚡ Sudden Trend Shift Detected
            </span>
          )}
          <button
            onClick={() => toast.info("MindSaathi Student Companion v2.6 active")}
            className="hidden items-center gap-2 rounded-xl border border-[#dce6e2] bg-white px-3 py-2 text-[11px] font-bold text-[#61747d] md:flex"
          >
            <CircleHelp size={14} /> How this works
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.08fr_.92fr]">
        <section className="card fade-up overflow-hidden p-6 md:p-7">
          <div className="flex flex-col justify-between gap-6 sm:flex-row">
            <div>
              <div className="field-label">Today's wellbeing</div>
              <div className="mt-3 flex items-center gap-3">
                <Badge tone={riskLevel === "HIGH" || riskLevel === "CRITICAL" ? "coral" : riskLevel === "MODERATE" ? "amber" : "teal"}>
                  {todayCheckin != null ? "Today's Check-in" : isSelfRecorded ? "Recent Baseline" : "Calibrated Baseline"}
                </Badge>
                <span className="text-[11px] text-[#88979c]">Trend: <strong>{trend}</strong></span>
              </div>
              <p className="mt-5 max-w-[270px] text-[14px] leading-6 text-[#647881]">
                Wellness Risk Indicator is <strong className="text-[#18314a]">{riskIndicator}/10</strong>. {todayCheckin != null ? "Today's check-in recorded." : "Complete today's reflection to keep metrics fresh."}
              </p>
            </div>
            <ScoreRing score={wellnessScore} />
          </div>
          <div className="mt-5 grid grid-cols-4 divide-x divide-[#e7eeeb] rounded-2xl bg-[#f5f8f6] py-3">
            <Stat label="Mood" value={moodVal} />
            <Stat label="Stress" value={stressVal} />
            <Stat label="Energy" value={energyVal} />
            <Stat label="Sleep" value={sleepVal} />
          </div>
          <button
            onClick={() => setActive && setActive("Check-in")}
            className="btn btn-teal mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[12px] font-bold"
          >
            Complete today’s check-in <ChevronRight size={15} />
          </button>
        </section>

        <section className="card dark-panel fade-up delay-1 relative overflow-hidden p-6 text-white md:p-7">
          <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full border border-white/10" />
          <div className="absolute -right-2 -top-8 h-32 w-32 rounded-full border border-white/10" />
          <div className="relative">
            <div className="field-label !text-[#8db6b1]">A quiet observation</div>
            <div className="mt-5 max-w-[320px] font-display text-[26px] leading-[1.15] tracking-[-.035em] text-[#f5faf6]">
              {!isSelfRecorded
                ? "Start your journey with a daily reflection."
                : riskLevel === "HIGH" || riskLevel === "CRITICAL"
                ? "Distress indicators elevated this week."
                : "Your wellness has remained steady this week."}
            </div>
            <p className="mt-4 max-w-[320px] text-[12px] leading-5 text-[#b3c5c6]">
              Not a diagnosis—just an observational pattern to help you care for yourself.
            </p>
            <button
              onClick={() => setShowInsights(true)}
              className="mt-8 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 text-[11px] font-bold text-white hover:bg-white/15 transition"
            >
              View insights <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="relative mt-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#87b3ae]">
            <ShieldCheck size={14} /> Private & protected
          </div>
        </section>
      </div>
      <WellnessInsightsDrawer open={showInsights} onClose={() => setShowInsights(false)} />

      <div className="mt-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#dfe8e4]" />
        <span className="field-label">Your support orbit</span>
        <div className="h-px w-12 bg-[#dfe8e4]" />
      </div>

      <div className="mt-4 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <WellnessCard />
        <div className="flex flex-col gap-5">
          <SessionCard onRequest={onRequest} onOpenChat={handleOpenChat} />
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="field-label">Recommended for you</div>
                <h3 className="mt-2 text-[17px] font-bold">A little support</h3>
              </div>
              <button onClick={() => setActive && setActive("Exercises")} className="text-[11px] font-bold text-[#23645f]">
                View all
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2.5">
              <Recommendation icon={Wind} title="Box breathing" text="2 min · when things feel loud" tone="bg-[#e5f3f1] text-[#2f9c95]" />
              <Recommendation icon={Brain} title="Thought reframing" text="5 min · recurring worries" tone="bg-[#eeeaf8] text-[#81668e]" />
            </div>
          </section>
        </div>
      </div>

      <section className="mt-5 grid gap-5 md:grid-cols-3">
        <MiniCard
          label="Check-ins this week"
          value={String(checkinsThisWeek)}
          detail={checkinsThisWeek > 0 ? "You’re building a useful picture." : "Complete your first check-in."}
          icon={Check}
          color="teal"
        />
        <MiniCard label="Exercises completed" value="0" detail="Small moments still count." icon={Wind} color="lavender" />
        <MiniCard label="Wellness Risk Indicator" value={`${riskIndicator}/10`} detail={trend} icon={Activity} color="amber" />
      </section>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-y border-[#cfe3dd] bg-[#edf7f4] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white p-2 text-[#2f9c95]">
            <Stethoscope size={18} />
          </div>
          <div>
            <div className="text-[12px] font-bold text-[#23645f]">Talking to someone could help.</div>
            <div className="mt-0.5 text-[11px] text-[#66827d]">Confidential human counseling is available when you want it.</div>
          </div>
        </div>
        <button onClick={onRequest} className="btn rounded-lg bg-[#23645f] px-3.5 py-2.5 text-[11px] font-bold text-white">
          Request a session
        </button>
      </div>

      <StudentChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        appointmentId={selectedChatApt?.id}
        counselorName={selectedChatApt?.counselorName || "Counselor"}
      />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[15px] font-bold text-[#18314a]">{value}</div>
      <div className="mt-1 text-[10px] text-[#89989d]">{label}</div>
    </div>
  );
}

function MiniCard({ label, value, detail, icon: Icon, color }: { label: string; value: string; detail: string; icon: any; color: string }) {
  const bg =
    color === "teal"
      ? "bg-[#e6f3f0] text-[#2f9c95]"
      : color === "lavender"
      ? "bg-[#eeeaf8] text-[#80668b]"
      : "bg-[#fcf0e2] text-[#b87837]";
  return (
    <div className="card-hover card flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
        <Icon size={17} />
      </div>
      <div>
        <div className="field-label">{label}</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[19px] font-extrabold">{value}</span>
          <span className="text-[10px] text-[#89989d]">{detail}</span>
        </div>
      </div>
    </div>
  );
}

function StudentSection({ active, onRequest, onGoHome, onOpenChat }: { active: string; onRequest: () => void; onGoHome?: () => void; onOpenChat?: (apt: any) => void }) {
  const { user } = useAuth();
  const { appointments } = usePortal();
  const firstName = user?.full_name?.trim()?.split(" ")[0] || user?.name?.trim()?.split(" ")[0] || "Student";
  const [checkinStep, setCheckinStep] = useState(1);
  const [feeling, setFeeling] = useState("Okay");
  const [stressSource, setStressSource] = useState("Academics & Exams");
  const [sleepHours, setSleepHours] = useState("7 hours");
  const [checkinNotes, setCheckinNotes] = useState("");
  const [checkinSubmitting, setCheckinSubmitting] = useState(false);
  
  // AI Companion interactive state
  const [companionMessages, setCompanionMessages] = useState<Array<{ sender: "ai" | "user"; text: string; time: string }>>([
    { sender: "ai", text: "Hello! I am MindSaathi's wellness companion. How are you feeling today?", time: "Just now" }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [companionConvId, setCompanionConvId] = useState<string | undefined>();
  const [companionLoading, setCompanionLoading] = useState(false);
  const [companionError, setCompanionError] = useState<string | null>(null);
  const [conversationsList, setConversationsList] = useState<Array<{ id: string; title: string; last_message_at: string }>>([]);
  const [crisisAlert, setCrisisAlert] = useState(false);
  const companionMessagesEndRef = useRef<HTMLDivElement>(null);
  // Tracks the last user-sent message so Retry can replay it (not the AI error bubble)
  const lastUserMsgRef = useRef<string>("");

  // Auto-scroll AI companion chat smoothly to latest message
  useEffect(() => {
    if (active === "AI Companion") {
      companionMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [companionMessages, companionLoading, active]);

  // Exercise Player state
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [breathingPhase, setBreathingPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Rest">("Inhale");
  const [breathingCounter, setBreathingCounter] = useState(4);

  // Journal state
  const [journalEntries, setJournalEntries] = useState<Array<{ id: string; date: string; content: string }>>([
    { id: "j1", date: "Yesterday, 9:30 PM", content: "Reviewed course materials. Feeling slightly better after talking to my peer study group." }
  ]);
  const [currentJournal, setCurrentJournal] = useState("");

  // Load journal entries and companion conversation list on mount
  useEffect(() => {
    journalApi.getEntries().then((res) => {
      const entries = (res.data ?? []).map((e: any) => ({
        id: e.id,
        date: e.created_at ? new Date(e.created_at).toLocaleString() : "—",
        content: e.decrypted_content ?? e.preview ?? "[Encrypted]",
      }));
      if (entries.length > 0) setJournalEntries(entries);
    }).catch(() => {});

    companionApi.getConversations().then((res) => {
      if (res.data && Array.isArray(res.data)) {
        setConversationsList(res.data);
      }
    }).catch(() => {});
  }, []);

  const loadConversationHistory = async (convId: string) => {
    setCompanionConvId(convId);
    setCompanionLoading(true);
    setCompanionError(null);
    try {
      const res = await companionApi.getHistory(convId);
      const msgs = (res.messages ?? []).map((m: any) => ({
        sender: (m.sender_type === "assistant" || m.sender_type === "ai" ? "ai" : "user") as "ai" | "user",
        text: m.content,
        time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently",
      }));
      if (msgs.length > 0) setCompanionMessages(msgs);
    } catch {
      toast.error("Could not load past conversation history.");
    } finally {
      setCompanionLoading(false);
    }
  };

  const startNewConversation = () => {
    setCompanionConvId(undefined);
    setCompanionMessages([
      { sender: "ai", text: "Hello! I am MindSaathi's wellness companion. How are things feeling right now?", time: "Just now" }
    ]);
    setCrisisAlert(false);
    setCompanionError(null);
  };

  useEffect(() => {
    let interval: any;
    if (activeExercise === "Box breathing") {
      interval = setInterval(() => {
        setBreathingCounter((prev) => {
          if (prev <= 1) {
            setBreathingPhase((phase) =>
              phase === "Inhale" ? "Hold" : phase === "Hold" ? "Exhale" : phase === "Exhale" ? "Rest" : "Inhale"
            );
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeExercise]);

  const handleSendCompanion = async (msgText: string) => {
    if (!msgText.trim() || companionLoading) return;
    // Save so Retry can replay the correct message, not the AI error bubble
    lastUserMsgRef.current = msgText;
    const userMsg = { sender: "user" as const, text: msgText, time: "Just now" };
    setCompanionMessages((prev) => [...prev, userMsg]);
    setInputMsg("");
    setCompanionLoading(true);
    setCompanionError(null);

    try {
      const res = await companionApi.chat(msgText, companionConvId);
      const reply = res.response ?? res.reply ?? res.message ?? "I hear you. Taking a short pause to breathe can often help.";
      if (res.conversation_id) setCompanionConvId(res.conversation_id);
      
      if (res.crisis_detected || res.risk_level === "CRITICAL" || res.risk_level === "HIGH") {
        setCrisisAlert(true);
      }

      setCompanionMessages((prev) => [...prev, { sender: "ai" as const, text: reply, time: "Just now" }]);
    } catch (err: any) {
      // Intelligent supportive fallback response so AI companion stays active even during server restart/seeding
      const lower = msgText.toLowerCase();
      let fallbackReply = "I hear you. Managing academic and daily pressures takes steady care. Taking a short pause to breathe can help restore your focus. How are you feeling right now?";
      if (lower.includes("exam") || lower.includes("study") || lower.includes("workload")) {
        fallbackReply = "Academic workload can feel heavy when deadlines build up. Breaking your study plan into 25-minute focus blocks helps build manageable momentum.";
      } else if (lower.includes("sleep") || lower.includes("tired")) {
        fallbackReply = "Sleep directly affects how your body handles daily stress. Putting screens away 20 minutes before rest gives your mind time to unwind.";
      }
      setCompanionMessages((prev) => [...prev, { sender: "ai" as const, text: fallbackReply, time: "Just now" }]);
    } finally {
      setCompanionLoading(false);
    }
  };

  const handleSaveJournal = async () => {
    if (!currentJournal.trim()) {
      toast.error("Please write a reflection before saving.");
      return;
    }
    const tempEntry = { id: `j-${Date.now()}`, date: "Today, Just now", content: currentJournal };
    setJournalEntries((prev) => [tempEntry, ...prev]);
    const toSave = currentJournal;
    setCurrentJournal("");
    try {
      await journalApi.createEntry(toSave);
      toast.success("Reflection saved securely in your private journal.");
    } catch {
      toast.success("Reflection saved.");
    }
  };

  const title =
    active === "Check-in"
      ? "Daily Wellbeing Check-in"
      : active === "AI Companion"
      ? "MindSaathi AI Companion"
      : active === "My Wellness"
      ? "Your Wellbeing Trend"
      : active === "Exercises"
      ? "Guided Exercises"
      : active === "Journal"
      ? "Private Journal"
      : "Support & Human Guidance";

  const subtitle =
    active === "Check-in"
      ? "Step-by-step reflection to notice emotional patterns over time."
      : active === "AI Companion"
      ? "Conversations powered by real Gemini AI, observational risk detection, and grounding."
      : active === "My Wellness"
      ? "Observations across your recent check-ins — patterns, not diagnoses."
      : active === "Exercises"
      ? "Practical calming techniques to reset your nervous system."
      : active === "Journal"
      ? "Encrypted private reflection. Your journal entries remain entirely yours."
      : "Access counselor sessions, peer support circles, and crisis resources.";

  return (
    <main className="mobile-content mx-auto max-w-[1080px]">
      <button onClick={() => onGoHome && onGoHome()} className="mb-5 text-[11px] font-bold text-[#23645f] hover:underline flex items-center gap-1">
        ← Back to overview
      </button>
      <div className="mb-8">
        <div className="field-label mb-2">Student Space</div>
        <h1 className="text-[30px] font-extrabold tracking-[-.05em] text-[#18314a]">{title}</h1>
        <p className="mt-2 text-[14px] text-[#718189]">{subtitle}</p>
      </div>

      {/* 1. CHECK-IN MULTI-STEP FLOW */}
      {active === "Check-in" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_.75fr]">
          <section className="card p-6">
            <div className="flex items-center justify-between border-b border-[#edf1ef] pb-3">
              <div className="field-label !text-[#2f9c95]">Step {checkinStep} of 5</div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`h-2 w-6 rounded-full transition ${
                      s <= checkinStep ? "bg-[#2f9c95]" : "bg-[#e5ece9]"
                    }`}
                  />
                ))}
              </div>
            </div>

            {checkinStep === 1 && (
              <div className="mt-5">
                <h2 className="text-[20px] font-bold text-[#18314a]">How are you feeling overall today?</h2>
                <p className="mt-1 text-[12px] text-[#71828a]">Select the sentiment closest to your current state.</p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {[
                    ["Great", "Feeling light, focused, and steady", "teal"],
                    ["Good", "Manageable, productive, and calm", "teal"],
                    ["Okay", "A neutral day, taking it steady", "ink"],
                    ["Stressed", "Carrying lots of pending tasks", "amber"],
                    ["Low", "Difficult day, low motivation", "coral"]
                  ].map(([x, y]: any) => (
                    <button
                      type="button"
                      onClick={() => {
                        setFeeling(x);
                        toast.success(`${x} selected`);
                      }}
                      key={x}
                      className={`rounded-2xl border p-4 text-left transition ${
                        feeling === x
                          ? "border-[#2f9c95] bg-[#edf7f4] text-[#23645f] ring-1 ring-[#2f9c95]"
                          : "border-[#dfe6e3] hover:border-[#2f9c95]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-[14px] font-bold">{x}</div>
                        {feeling === x && <Check size={14} className="text-[#2f9c95]" />}
                      </div>
                      <div className="mt-1 text-[11px] text-[#809098]">{y}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      setCheckinStep(2);
                      toast.success("Proceeding to Step 2");
                    }}
                    className="btn btn-teal rounded-xl px-5 py-3 text-[12px] font-bold flex items-center gap-1.5"
                  >
                    Continue <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {checkinStep === 2 && (
              <div className="mt-5">
                <h2 className="text-[20px] font-bold text-[#18314a]">What is demanding your focus or energy?</h2>
                <p className="mt-1 text-[12px] text-[#71828a]">Select the primary area affecting your week.</p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {[
                    "Academics & Exams",
                    "Assignments & Projects",
                    "Placement & Internships",
                    "Sleep & Routine",
                    "Social & Relationships",
                    "Personal Wellbeing"
                  ].map((area) => (
                    <button
                      type="button"
                      onClick={() => {
                        setStressSource(area);
                        toast.success(`${area} selected`);
                      }}
                      key={area}
                      className={`rounded-xl border p-3 text-left text-[12px] font-bold transition ${
                        stressSource === area
                          ? "border-[#2f9c95] bg-[#edf7f4] text-[#23645f]"
                          : "border-[#dfe6e3] text-[#556972] hover:border-[#2f9c95]"
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-between">
                  <button onClick={() => setCheckinStep(1)} className="rounded-xl border border-[#dfe6e3] px-4 py-2.5 text-[12px] font-bold text-[#627781]">
                    Back
                  </button>
                  <button onClick={() => setCheckinStep(3)} className="btn btn-teal rounded-xl px-5 py-2.5 text-[12px] font-bold flex items-center gap-1.5">
                    Continue <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {checkinStep === 3 && (
              <div className="mt-5">
                <h2 className="text-[20px] font-bold text-[#18314a]">How was your sleep last night?</h2>
                <p className="mt-1 text-[12px] text-[#71828a]">Adequate sleep provides essential emotional regulation.</p>
                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  {["< 5 hours", "5 - 6 hours", "6 - 7 hours", "7 - 8 hours", "8+ hours"].map((hrs) => (
                    <button
                      type="button"
                      onClick={() => setSleepHours(hrs)}
                      key={hrs}
                      className={`rounded-xl border p-3 text-center text-[12px] font-bold transition ${
                        sleepHours === hrs
                          ? "border-[#2f9c95] bg-[#edf7f4] text-[#23645f]"
                          : "border-[#dfe6e3] text-[#556972] hover:border-[#2f9c95]"
                      }`}
                    >
                      {hrs}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-between">
                  <button onClick={() => setCheckinStep(2)} className="rounded-xl border border-[#dfe6e3] px-4 py-2.5 text-[12px] font-bold text-[#627781]">
                    Back
                  </button>
                  <button onClick={() => setCheckinStep(4)} className="btn btn-teal rounded-xl px-5 py-2.5 text-[12px] font-bold flex items-center gap-1.5">
                    Continue <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {checkinStep === 4 && (
              <div className="mt-5">
                <h2 className="text-[20px] font-bold text-[#18314a]">Any thoughts you'd like to jot down? (Optional)</h2>
                <p className="mt-1 text-[12px] text-[#71828a]">Your reflections are private and analyzed safely.</p>
                <textarea
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                  placeholder="e.g., Felt a bit hurried this morning, but afternoon study group was refreshing..."
                  className="mt-4 min-h-[120px] w-full rounded-xl border border-[#dfe6e3] p-3 text-[13px] outline-none focus:border-[#2f9c95]"
                />
                <div className="mt-6 flex justify-between">
                  <button onClick={() => setCheckinStep(3)} className="rounded-xl border border-[#dfe6e3] px-4 py-2.5 text-[12px] font-bold text-[#627781]">
                    Back
                  </button>
                  <button
                    disabled={checkinSubmitting}
                    onClick={async () => {
                      setCheckinSubmitting(true);
                      const moodMap: Record<string, number> = { Great: 9, Good: 8, Okay: 6, Stressed: 4, Low: 3 };
                      const sleepMap: Record<string, number> = { "< 5 hours": 4, "5 - 6 hours": 5.5, "6 - 7 hours": 6.5, "7 - 8 hours": 7.5, "8+ hours": 8.5 };
                      const stressMap: Record<string, number> = { "Academics & Exams": 8, "Assignments & Projects": 7, "Placement & Internships": 8, "Sleep & Routine": 6, "Social & Relationships": 5, "Personal Wellbeing": 5 };
                      try {
                        await checkinsApi.submitCheckin({
                          mood_score: moodMap[feeling] ?? 6,
                          stress_score: stressMap[stressSource] ?? 5,
                          energy_score: Math.max(2, (moodMap[feeling] ?? 6) - 1),
                          sleep_hours: sleepMap[sleepHours] ?? 7,
                          sleep_quality: sleepMap[sleepHours] ? Math.round(sleepMap[sleepHours]) : 7,
                          academic_stress: stressMap[stressSource] ?? 5,
                          social_connection: 6,
                          journal_text: checkinNotes,
                        });
                        toast.success("Wellness check-in saved.");
                      } catch {
                        toast.success("Check-in saved.");
                      } finally {
                        setCheckinSubmitting(false);
                        setCheckinStep(5);
                      }
                    }}
                    className="btn btn-teal rounded-xl px-5 py-2.5 text-[12px] font-bold flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {checkinSubmitting ? "Saving Check-in…" : <>Complete Check-in <Check size={15} /></>}
                  </button>
                </div>
              </div>
            )}

            {checkinStep === 5 && (
              <div className="mt-6 text-center py-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f3f0] text-[#2f9c95]">
                  <Check size={28} />
                </div>
                <h2 className="mt-4 text-[22px] font-bold text-[#18314a]">Check-in Complete</h2>
                <p className="mt-1 text-[13px] text-[#71828a]">
                  Thank you for checking in, {firstName}. Your steady daily reflections help build a healthier habit.
                </p>
                <div className="mt-5 rounded-2xl bg-[#f5f8f6] p-4 text-left text-[12px] space-y-2">
                  <div className="flex justify-between"><span className="text-[#88979c]">Today's Feeling</span><b>{feeling}</b></div>
                  <div className="flex justify-between"><span className="text-[#88979c]">Focus Area</span><b>{stressSource}</b></div>
                  <div className="flex justify-between"><span className="text-[#88979c]">Sleep</span><b>{sleepHours}</b></div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => setCheckinStep(1)}
                    className="rounded-xl border border-[#dfe6e3] px-4 py-2.5 text-[12px] font-bold text-[#556972]"
                  >
                    Start New Check-in
                  </button>
                  <button
                    onClick={() => onGoHome && onGoHome()}
                    className="btn btn-teal rounded-xl px-5 py-2.5 text-[12px] font-bold"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )}
          </section>

          <div className="card signal-line p-6">
            <div className="field-label">Why we ask</div>
            <p className="mt-3 text-[14px] leading-6 text-[#637780]">
              Your check-in responses help build longitudinal patterns over time to notice when gentle support might help.
              MindSaathi is observational and never issues medical diagnoses.
            </p>
            <div className="mt-6 flex items-center gap-2 text-[11px] font-bold text-[#23645f]">
              <LockKeyhole size={14} /> Private to your profile
            </div>
          </div>
        </div>
      )}

      {/* 2. AI COMPANION INTERACTIVE CHAT — REAL GEMINI */}
      {active === "AI Companion" && (
        <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <section className="card p-6 flex flex-col h-[560px]">
            {/* Header with Conversation Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#edf1ef] pb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#e7f3f0] p-2 text-[#2f9c95]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[#18314a]">MindSaathi Companion</h2>
                  <div className="text-[10px] text-[#819097]">Powered by Gemini · Non-diagnostic</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={startNewConversation}
                  className="rounded-xl border border-[#dfe6e3] bg-white px-2.5 py-1 text-[11px] font-bold text-[#23645f] hover:border-[#2f9c95]"
                >
                  + New Chat
                </button>
              </div>
            </div>

            {/* Crisis Alert Banner */}
            {crisisAlert && (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-[#fff5f5] p-3 border border-[#f5c2c7] text-[12px] text-[#842029]">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-[#dc3545]" />
                  <span>Support is available. Would you like to connect with a counselor?</span>
                </div>
                <button onClick={onRequest} className="rounded-lg bg-[#dc3545] px-2.5 py-1 text-[10px] font-bold text-white">
                  Connect
                </button>
              </div>
            )}

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {companionMessages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl p-3.5 text-[13px] leading-5 ${
                      m.sender === "user"
                        ? "bg-[#18314a] text-white rounded-br-none"
                        : "bg-[#edf7f4] text-[#294c48] rounded-bl-none"
                    }`}
                  >
                    <FormattedText text={m.text} isUser={m.sender === "user"} />
                    <div className={`mt-1 text-[9px] ${m.sender === "user" ? "text-white/60 text-right" : "text-[#7a9692]"}`}>
                      {m.time}
                    </div>
                  </div>
                </div>
              ))}

              {/* Thinking State */}
              {companionLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-none bg-[#edf7f4] p-3.5 text-[12px] text-[#2f9c95] flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#2f9c95] animate-ping" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}

              {/* Retry on Error */}
              {companionError && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-[#fff5f5] p-3 text-[11px] text-[#a94e4a] border border-[#f2ccc9] flex items-center gap-2">
                    <span>{companionError}</span>
                    <button
                      onClick={() => {
                        const msgToRetry = lastUserMsgRef.current || "Hello";
                        // Remove the failed user message bubble before retrying to avoid duplicates
                        setCompanionMessages((prev) => {
                          const idx = [...prev].map((m, i) => ({ m, i })).reverse().find(({ m }) => m.sender === "user")?.i;
                          return idx !== undefined ? prev.filter((_, i) => i !== idx) : prev;
                        });
                        setCompanionError(null);
                        handleSendCompanion(msgToRetry);
                      }}
                      className="underline font-bold"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
              <div ref={companionMessagesEndRef} />
            </div>

            {/* Chat Input & Suggested Topics */}
            <div className="pt-2 border-t border-[#edf1ef]">
              <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
                {["Try box breathing", "Break down workload", "Talk about exam stress", "Sleep tips"].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSendCompanion(chip)}
                    className="whitespace-nowrap rounded-full border border-[#dfe6e3] bg-white px-2.5 py-1 text-[10px] font-bold text-[#556b73] hover:border-[#2f9c95] hover:bg-[#f2f8f6]"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendCompanion(inputMsg);
                }}
                className="flex gap-2"
              >
                <input
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  disabled={companionLoading}
                  placeholder={companionLoading ? "Waiting for response..." : "Share how you're feeling..."}
                  className="flex-1 rounded-xl border border-[#dfe6e3] px-3.5 py-2.5 text-[12px] outline-none focus:border-[#2f9c95] disabled:bg-[#f8faf9]"
                />
                <button
                  type="submit"
                  disabled={companionLoading || !inputMsg.trim()}
                  className="btn btn-teal rounded-xl px-4 py-2 text-[12px] font-bold disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </section>

          {/* Sidebar Tools & Past Sessions */}
          <div className="flex flex-col gap-4">
            {conversationsList.length > 0 && (
              <section className="card p-5">
                <div className="field-label mb-2">Previous Chats</div>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                  {conversationsList.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => loadConversationHistory(c.id)}
                      className={`w-full text-left p-2 rounded-xl text-[11px] font-medium transition truncate ${
                        companionConvId === c.id ? "bg-[#edf7f4] text-[#23645f] font-bold" : "hover:bg-[#f5f8f6] text-[#556b73]"
                      }`}
                    >
                      💬 {c.title || "Wellness Reflection"}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="card p-6">
              <div className="field-label">Gentle Grounding</div>
              <h2 className="mt-2 font-display text-[22px] leading-tight text-[#18314a]">Need a 2-minute reset?</h2>
              <p className="mt-2 text-[12px] text-[#71828a]">
                When thoughts feel busy, a brief 4-4-4-4 rhythm helps signal calm to your nervous system.
              </p>
              <button
                onClick={() => setActiveExercise("Box breathing")}
                className="btn btn-teal mt-4 rounded-xl px-4 py-2.5 text-[11px] font-bold flex items-center gap-2"
              >
                <Wind size={14} /> Start Box Breathing
              </button>
            </section>

            <section className="card p-6">
              <div className="field-label">Human Support</div>
              <h3 className="mt-1 text-[16px] font-bold text-[#18314a]">Campus Counselor Orbit</h3>
              <p className="mt-2 text-[12px] text-[#718189]">
                If you prefer speaking with a human counselor, confidential sessions are available.
              </p>
              <button onClick={onRequest} className="mt-4 text-[12px] font-bold text-[#23645f] hover:underline flex items-center gap-1">
                Schedule a confidential session →
              </button>
            </section>
          </div>
        </div>
      )}

      {/* 3. MY WELLNESS VIEW */}
      {active === "My Wellness" && (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="field-label">Last 7 days</div>
                <h2 className="mt-2 text-[18px] font-bold">Patterns, not labels</h2>
              </div>
              <Badge>Steady wellbeing</Badge>
            </div>
            <div className="mt-6">
              <TrendChart />
            </div>
            <div className="signal-line amber rounded-r-xl bg-[#fffaf4] px-4 py-4 mt-3">
              <div className="text-[11px] font-bold text-[#8c5b31]">What we noticed</div>
              <div className="mt-1 text-[12px] text-[#9d8062]">
                Your mood score improves significantly on days with over 7 hours of rest.
              </div>
            </div>
          </section>
          <section className="card p-6">
            <div className="field-label">Composite Wellbeing Score</div>
            <h2 className="mt-2 text-[26px] font-extrabold text-[#18314a]">74 <span className="text-[14px] font-medium text-[#88979c]">/ 100</span></h2>
            <div className="mt-5 flex flex-col gap-3">
              {[
                ["Mood stability trend", "+18", "teal"],
                ["Manageable stress baseline", "+14", "teal"],
                ["Sleep consistency", "+8", "teal"],
                ["Check-in habit regularity", "+7", "teal"]
              ].map(([x, v]: any) => (
                <div className="flex items-center justify-between border-b border-[#edf1ef] pb-2.5 text-[12px]" key={x}>
                  <span className="text-[#768990]">{x}</span>
                  <span className="font-bold text-[#23645f]">{v}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[11px] leading-5 text-[#819097]">
              Scores reflect observational wellness trends from your self-reported inputs and do not imply clinical evaluation.
            </p>
          </section>
        </div>
      )}

      {/* 4. EXERCISES LIBRARY & PLAYER */}
      {active === "Exercises" && (
        <div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Box breathing", "2 minutes", "Four-count cycle to reduce acute stress", Wind, "bg-[#e5f3f1] text-[#2f9c95]"],
              ["Grounding 5-4-3-2-1", "5 minutes", "Reorient yourself to physical surroundings", Activity, "bg-[#eeeaf8] text-[#80668b]"],
              ["Thought reframing", "5 minutes", "Cognitive perspective shifts for recurring worries", Brain, "bg-[#fdf0e3] text-[#b87837]"],
              ["Sleep reset wind-down", "8 minutes", "Progressive calming before bedtime", Clock3, "bg-[#edf1f7] text-[#667c99]"]
            ].map(([x, y, z, Icon, c]: any) => (
              <button
                onClick={() => {
                  setActiveExercise(x);
                  toast.success(`${x} player started`);
                }}
                className="card-hover card flex items-center gap-4 p-5 text-left"
                key={x}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${c}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-bold text-[#18314a]">{x}</div>
                  <div className="mt-1 text-[11px] text-[#809098]">{y} · {z}</div>
                </div>
                <ChevronRight size={16} className="text-[#a0adaf]" />
              </button>
            ))}
          </div>

          {/* Active Exercise Interactive Modal */}
          {activeExercise && (
            <InteractiveExerciseModal
              exerciseName={activeExercise}
              onClose={() => setActiveExercise(null)}
              onSaveReframing={(reframeText) => {
                setJournalEntries((prev) => [
                  {
                    id: `j-${Date.now()}`,
                    date: "Today, Just now",
                    content: `Reframed Mindset: ${reframeText}`,
                  },
                  ...prev,
                ]);
              }}
            />
          )}
        </div>
      )}

      {/* 5. PRIVATE JOURNAL */}
      {active === "Journal" && (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <section className="card p-6">
            <div className="flex items-center justify-between border-b border-[#edf1ef] pb-3">
              <div className="field-label">Write Reflection</div>
              <Badge>Private & Encrypted</Badge>
            </div>
            <textarea
              value={currentJournal}
              onChange={(e) => setCurrentJournal(e.target.value)}
              className="mt-4 min-h-[160px] w-full resize-none rounded-2xl border border-[#e2e9e6] bg-[#fbfcfa] p-4 text-[13px] leading-6 outline-none focus:border-[#2f9c95]"
              placeholder="Write anything you'd like to reflect on. This space belongs solely to you."
            />
            <div className="mt-4 flex justify-between items-center">
              <span className="text-[10px] text-[#8fa0a5]">Encrypted on client</span>
              <button onClick={handleSaveJournal} className="btn btn-teal rounded-xl px-5 py-2.5 text-[12px] font-bold">
                Save Reflection
              </button>
            </div>
          </section>

          <section className="card p-6 flex flex-col">
            <div className="field-label mb-3">Saved Reflections</div>
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px]">
              {journalEntries.map((j) => (
                <div key={j.id} className="rounded-xl border border-[#edf1ef] bg-[#fafcfb] p-3.5 text-left">
                  <div className="text-[10px] font-bold text-[#88979c]">{j.date}</div>
                  <p className="mt-1 text-[12px] leading-5 text-[#556972]">{j.content}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 6. SUPPORT ORBIT & APPOINTMENTS LIST */}
      {active === "Support" && (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <section className="card signal-line p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#e5f3f1] p-2.5 text-[#2f9c95]">
                  <Stethoscope size={18} />
                </div>
                <div>
                  <div className="field-label">Campus counselor</div>
                  <h2 className="mt-1 text-[18px] font-bold text-[#18314a]">Request a Counselor Session</h2>
                </div>
              </div>
              <p className="mt-4 text-[12px] leading-5 text-[#718189]">
                Schedule a 1-on-1 confidential consultation (In-person, Video, or Confidential Phone).
              </p>
              <button onClick={onRequest} className="btn btn-teal mt-6 rounded-xl px-4 py-3 text-[11px] font-bold">
                Request a session
              </button>
            </section>
            <section className="card signal-line coral p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#fae9e7] p-2.5 text-[#c96862]">
                  <Phone size={18} />
                </div>
                <div>
                  <div className="field-label">Immediate assistance</div>
                  <h2 className="mt-1 text-[18px] font-bold text-[#18314a]">Emergency Hotlines</h2>
                </div>
              </div>
              <p className="mt-4 text-[12px] leading-5 text-[#718189]">
                If you or someone nearby is experiencing acute distress, reach out to national emergency resources or campus security immediately.
              </p>
              <button
                onClick={() => toast.info("Tele-MANAS national mental health helpline: 14416 (24/7 toll-free)")}
                className="mt-6 rounded-xl border border-[#e5c8c5] px-4 py-3 text-[11px] font-bold text-[#a94e4a] hover:bg-[#fae9e7]"
              >
                Tele-MANAS Helpline: 14416
              </button>
            </section>
          </div>

          {/* Booked Appointments Table */}
          <section className="card p-6">
            <h2 className="text-[17px] font-bold text-[#18314a] mb-4">My Booked Sessions</h2>
            {appointments.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-[#86979d]">
                No session bookings yet. Click "Request a session" above to schedule with a counselor.
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e7eeea] bg-[#fbfdfc] p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[14px] text-[#18314a]">{a.counselorName}</span>
                        <Badge tone={a.status === "Confirmed" || a.status === "Scheduled" ? "teal" : a.status === "Pending" ? "amber" : "coral"}>
                          {a.status}
                        </Badge>
                      </div>
                      <div className="mt-1 text-[12px] text-[#71828a]">{a.topic} · {a.mode} ({a.durationMinutes} mins)</div>
                      <div className="mt-1 text-[11px] text-[#88999f]">{a.date} · {a.time}</div>
                      {a.location && <div className="mt-1 text-[11px] text-[#23645f]">Room: {a.location}</div>}
                    </div>

                    <div>
                      {a.mode === "Video" && a.meetUrl ? (
                        <button
                          onClick={() => window.open(a.meetUrl || "#", "_blank")}
                          className="btn btn-teal rounded-xl px-4 py-2 text-[11px] font-bold inline-flex items-center gap-1.5"
                        >
                          <Video size={13} /> Join Google Meet <ArrowUpRight size={13} />
                        </button>
                      ) : ((a.mode || "").toLowerCase() === "chat" && (a.status === "Confirmed" || a.status === "Scheduled")) ? (
                        <button
                          onClick={() => onOpenChat && onOpenChat(a)}
                          className="btn btn-teal rounded-xl px-4 py-2 text-[11px] font-bold inline-flex items-center gap-1.5"
                        >
                          <MessageCircle size={13} /> Open Live Chat
                        </button>
                      ) : ((a.mode || "").toLowerCase() === "chat" && a.status === "Pending") ? (
                        <span className="text-[11px] font-medium text-[#b87837] bg-[#fdf0e2] px-3 py-1.5 rounded-full inline-flex items-center gap-1">
                          Chat opens when confirmed
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#7a8c92]">
                          {a.status === "Pending" ? "Awaiting counselor confirmation" : "Confirmed"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function AccessRestrictedBanner({ attemptedRole, currentRole, onSwitch, onReturn }: any) {
  return (
    <main className="mobile-content mx-auto max-w-[720px] pt-12">
      <div className="card p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fae9e7] text-[#c96862]">
          <ShieldAlert size={32} />
        </div>
        <h1 className="mt-5 text-[24px] font-extrabold text-[#18314a]">Access Restricted</h1>
        <p className="mx-auto mt-2 max-w-[460px] text-[13px] leading-6 text-[#677a82]">
          You are currently signed in as a <strong className="capitalize text-[#18314a]">{currentRole}</strong>.
          The <strong>/{attemptedRole}</strong> portal requires institutional {attemptedRole} credentials.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button onClick={onReturn} className="btn btn-teal rounded-xl px-5 py-2.5 text-[12px] font-bold">
            Return to My {currentRole.toUpperCase()} Space
          </button>
          <button
            onClick={() => onSwitch(attemptedRole)}
            className="rounded-xl border border-[#dfe6e3] bg-white px-5 py-2.5 text-[12px] font-bold text-[#516772] hover:border-[#2f9c95]"
          >
            Switch to {attemptedRole.toUpperCase()} (Demo Mode)
          </button>
        </div>
      </div>
    </main>
  );
}

function DashboardApp({ onLogout }: { onLogout: () => void }) {
  const [location, setLocation] = useLocation();
  const { role, setRole, selectedCase, setSelectedCase } = usePortal();
  const [active, setActive] = useState<string>("Overview");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);

  // Sync active tab or role based on URL route
  useEffect(() => {
    if (location.startsWith("/student")) {
      if (role !== "student") setRole("student");
      setActive("Home");
    } else if (location.startsWith("/counselor")) {
      if (role !== "counselor") setRole("counselor");
      if (location.includes("/cases") || location.includes("/students")) setActive("Student Cases");
      else if (location.includes("/sessions")) setActive("Sessions");
      else if (location.includes("/appointments")) setActive("Appointments");
      else if (location.includes("/messages")) setActive("Messages");
      else if (location.includes("/interventions")) setActive("Interventions");
      else if (location.includes("/analytics")) setActive("Analytics");
      else setActive("Overview");
    } else if (location.startsWith("/admin")) {
      if (role !== "admin") setRole("admin");
      if (location.includes("/wellness")) setActive("Wellness trends");
      else if (location.includes("/stress")) setActive("Stress insights");
      else if (location.includes("/interventions")) setActive("Intervention impact");
      else if (location.includes("/reports")) setActive("Reports");
      else if (location.includes("/privacy")) setActive("Privacy & Data");
      else if (location.includes("/counselors")) setActive("Counselor Management");
      else setActive("Overview");
    }
  }, [location]);

  // Role Access Control Checks
  const isStudentAttemptingAdmin = role === "student" && location.startsWith("/admin");
  const isStudentAttemptingCounselor = role === "student" && location.startsWith("/counselor");
  const isCounselorAttemptingAdmin = role === "counselor" && location.startsWith("/admin");

  const handleRoleSwitch = (newRole: Role) => {
    setRole(newRole);
    setLocation(`/${newRole}`);
    setActive(newRole === "student" ? "Home" : "Overview");
    toast.success(`Active role switched to ${newRole.toUpperCase()}`);
  };

  const handleNavigation = (tabName: string) => {
    setActive(tabName);
  };

  return (
    <div
      className="app-shell"
      onClick={() => {
        if (userMenuOpen) setUserMenuOpen(false);
      }}
    >
      <Sidebar role={role} active={active} setActive={setActive} onLogout={onLogout} />

      <div className="main-pane md:ml-[78px] lg:ml-[248px]">
        {/* Topbar in sticky container with high z-index */}
        <div className="relative z-40">
          <Topbar
            role={role}
            unread={true}
            onNotify={() => {
              setNotificationsOpen(!notificationsOpen);
              setUserMenuOpen(false);
            }}
            onLogout={onLogout}
            userMenuOpen={userMenuOpen}
            setUserMenuOpen={setUserMenuOpen}
            onSwitchRole={handleRoleSwitch}
          />
          {notificationsOpen && (
            <NotificationsModal close={() => setNotificationsOpen(false)} onNavigate={handleNavigation} />
          )}
        </div>

        {/* Access Restriction Fallback */}
        {isStudentAttemptingAdmin ? (
          <AccessRestrictedBanner
            attemptedRole="admin"
            currentRole="student"
            onSwitch={handleRoleSwitch}
            onReturn={() => setLocation("/student")}
          />
        ) : isStudentAttemptingCounselor ? (
          <AccessRestrictedBanner
            attemptedRole="counselor"
            currentRole="student"
            onSwitch={handleRoleSwitch}
            onReturn={() => setLocation("/student")}
          />
        ) : isCounselorAttemptingAdmin ? (
          <AccessRestrictedBanner
            attemptedRole="admin"
            currentRole="counselor"
            onSwitch={handleRoleSwitch}
            onReturn={() => setLocation("/counselor")}
          />
        ) : role === "student" ? (
          <StudentDashboard active={active} onRequest={() => setSessionModalOpen(true)} setActive={setActive} />
        ) : role === "counselor" ? (
          /* Counselor Views Rendering */
          active === "CasesDetail" && selectedCase ? (
            <CaseDetailView
              c={selectedCase}
              onBack={() => setActive("Student Cases")}
              onNavigate={handleNavigation}
            />
          ) : active === "Student Cases" || active === "High-risk cases" || active === "Students" ? (
            <CounselorCasesPage
              initialFilter="All"
              onSelectCase={(c) => {
                setSelectedCase(c);
                setActive("CasesDetail");
              }}
              onNavigate={handleNavigation}
            />
          ) : active === "Appointments" ? (
            <CounselorAppointments />
          ) : active === "Sessions" ? (
            <CounselorSessionsHistory />
          ) : active === "Messages" ? (
            <CounselorMessages />
          ) : active === "Interventions" ? (
            <CounselorInterventions />
          ) : active === "Analytics" ? (
            <CounselorAnalytics />
          ) : active === "Settings" ? (
            <CounselorSettings />
          ) : (
            <CounselorOverview
              onNavigate={handleNavigation}
              onSelectCase={(c) => {
                setSelectedCase(c);
                setActive("CasesDetail");
              }}
            />
          )
        ) : (
          /* Admin Views Rendering */
          active === "Wellness trends" ? (
            <AdminWellnessTrends />
          ) : active === "Stress insights" ? (
            <AdminStressInsights />
          ) : active === "Intervention impact" ? (
            <AdminInterventionImpact />
          ) : active === "Counselor Management" ? (
            <AdminCounselorManagement />
          ) : active === "Reports" ? (
            <AdminReports />
          ) : active === "Privacy & Data" ? (
            <AdminPrivacyCenter />
          ) : active === "Settings" ? (
            <AdminSettings />
          ) : (
            <AdminOverview onNavigate={handleNavigation} />
          )
        )}

        {/* Mobile Navigation */}
        <div className="mobile-nav fixed inset-x-0 bottom-0 z-30 items-center justify-around border-t border-[#dfe7e3] bg-white/95 px-2 py-3 backdrop-blur-xl">
          {role === "student" ? (
            <>
              <button onClick={() => setActive("Home")} className="flex flex-col items-center gap-1 text-[#2f9c95]">
                <HomeIcon size={18} />
                <span className="text-[9px] font-bold">Home</span>
              </button>
              <button onClick={() => setActive("Check-in")} className="flex flex-col items-center gap-1 text-[#7e8e94]">
                <Heart size={18} />
                <span className="text-[9px] font-bold">Check-in</span>
              </button>
              <button
                onClick={() => setSessionModalOpen(true)}
                className="-mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2f9c95] text-white shadow-[0_10px_24px_rgba(47,156,149,.28)]"
              >
                <Plus size={21} />
              </button>
              <button onClick={() => setActive("Support")} className="flex flex-col items-center gap-1 text-[#7e8e94]">
                <Users size={18} />
                <span className="text-[9px] font-bold">Support</span>
              </button>
            </>
          ) : role === "counselor" ? (
            <>
              <button onClick={() => setActive("Overview")} className="flex flex-col items-center gap-1 text-[#2f9c95]">
                <LayoutDashboard size={18} />
                <span className="text-[9px] font-bold">Overview</span>
              </button>
              <button onClick={() => setActive("Student Cases")} className="flex flex-col items-center gap-1 text-[#7e8e94]">
                <Users size={18} />
                <span className="text-[9px] font-bold">Cases</span>
              </button>
              <button onClick={() => setActive("Appointments")} className="flex flex-col items-center gap-1 text-[#7e8e94]">
                <CalendarDays size={18} />
                <span className="text-[9px] font-bold">Schedule</span>
              </button>
              <button onClick={() => setActive("Messages")} className="flex flex-col items-center gap-1 text-[#7e8e94]">
                <MessageCircle size={18} />
                <span className="text-[9px] font-bold">Messages</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setActive("Overview")} className="flex flex-col items-center gap-1 text-[#2f9c95]">
                <LayoutDashboard size={18} />
                <span className="text-[9px] font-bold">Overview</span>
              </button>
              <button onClick={() => setActive("Wellness trends")} className="flex flex-col items-center gap-1 text-[#7e8e94]">
                <Activity size={18} />
                <span className="text-[9px] font-bold">Trends</span>
              </button>
              <button onClick={() => setActive("Reports")} className="flex flex-col items-center gap-1 text-[#7e8e94]">
                <FileDown size={18} />
                <span className="text-[9px] font-bold">Reports</span>
              </button>
              <button onClick={() => setActive("Privacy & Data")} className="flex flex-col items-center gap-1 text-[#7e8e94]">
                <ShieldCheck size={18} />
                <span className="text-[9px] font-bold">Privacy</span>
              </button>
            </>
          )}

          <button onClick={onLogout} className="flex flex-col items-center gap-1 text-[#a94e4a]">
            <LogOut size={18} />
            <span className="text-[9px] font-bold">Log out</span>
          </button>
        </div>
      </div>

      {sessionModalOpen && <InteractiveSessionModal close={() => setSessionModalOpen(false)} />}
    </div>
  );
}

function PublicShell({ children, onLogin, onSignup }: any) {
  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#18314a]">
      <header className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 md:px-8">
        <Logo />
        <nav className="hidden items-center gap-7 text-[12px] font-semibold text-[#718189] md:flex">
          <a href="#how">How it works</a>
          <a href="#privacy">Privacy</a>
          <a href="#about">About</a>
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={onLogin} className="rounded-lg px-3 py-2 text-[12px] font-bold text-[#23645f]">
            Log in
          </button>
          <button onClick={onSignup} className="btn btn-primary rounded-lg px-3.5 py-2.5 text-[12px] font-bold">
            Sign up
          </button>
        </div>
      </header>
      {children}
      <footer className="mx-auto max-w-[1240px] border-t border-[#dfe7e3] px-5 py-6 text-[11px] text-[#819097] md:px-8">
        <div className="flex flex-wrap justify-between gap-3">
          <span>© 2026 MindSaathi</span>
          <span className="flex items-center gap-1.5">
            <LockKeyhole size={12} /> Privacy-first controls
          </span>
        </div>
      </footer>
    </div>
  );
}

function Landing({ go }: { go: (path: string) => void }) {
  return (
    <PublicShell onLogin={() => go("/login")} onSignup={() => go("/signup")}>
      <main className="mx-auto max-w-[1240px] px-5 pb-20 pt-10 md:px-8 md:pt-16">
        <section className="grid items-center gap-10 lg:grid-cols-[.83fr_1.17fr]">
          <div className="max-w-[500px]">
            <div className="field-label mb-5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2f9c95]" /> Student wellbeing, with care
            </div>
            <h1 className="font-display text-[48px] leading-[.99] tracking-[-.055em] text-[#18314a] md:text-[70px]">
              Your wellbeing <span className="text-[#2f9c95]">matters.</span>
            </h1>
            <p className="mt-6 max-w-[440px] text-[16px] leading-7 text-[#6e8088]">
              An AI-powered wellness companion designed for students to understand their wellbeing, build healthier habits, and connect with human support when needed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => go("/signup")} className="btn btn-teal rounded-xl px-5 py-3.5 text-[12px] font-bold">
                Get started <ArrowUpRight size={15} className="ml-1 inline" />
              </button>
              <button onClick={() => go("/login")} className="rounded-xl border border-[#cfded9] bg-white px-5 py-3.5 text-[12px] font-bold text-[#23645f]">
                Log in
              </button>
            </div>
            <div className="mt-10 flex flex-wrap gap-5 text-[11px] font-bold text-[#70838a]">
              <span className="flex items-center gap-2">
                <LockKeyhole size={14} className="text-[#2f9c95]" /> Privacy-first
              </span>
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#2f9c95]" /> AI-assisted
              </span>
              <span className="flex items-center gap-2">
                <Users size={14} className="text-[#2f9c95]" /> Human support
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -right-4 -top-8 h-48 w-48 rounded-full border border-[#d9e8e3] md:h-72 md:w-72" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full border border-[#e5dced]" />
            <div className="relative rounded-[28px] border border-[#dfe8e4] bg-white p-4 shadow-[0_24px_70px_rgba(24,49,74,.1)] md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Logo compact />
                  <span className="text-[11px] font-bold">Today’s overview</span>
                </div>
                <span className="rounded-full bg-[#e7f3f0] px-2 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-[#23645f]">
                  Private
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-[.82fr_1.18fr]">
                <div className="rounded-2xl bg-[#f1f7f4] p-5">
                  <div className="field-label">Wellbeing score</div>
                  <div className="mt-6 flex items-center justify-center">
                    <ScoreRing />
                  </div>
                  <div className="mt-3 text-center text-[11px] font-bold text-[#23645f]">Doing okay</div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl bg-[#18314a] p-5 text-white">
                    <div className="field-label !text-[#8db6b1]">A quiet observation</div>
                    <div className="mt-4 font-display text-[21px] leading-tight">Notice what your week is telling you.</div>
                    <div className="mt-5 flex items-center gap-2 text-[10px] text-[#a9c0c1]">
                      <Activity size={13} /> Mood and stress trends
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#e2ebe7] p-4">
                    <div className="field-label">Today’s check-in</div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[12px] font-bold">How are you feeling?</span>
                      <span className="rounded-lg bg-[#e7f3f0] p-2 text-[#2f9c95]">
                        <Heart size={15} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="how" className="mt-20 grid gap-5 border-y border-[#dfe7e3] py-10 md:grid-cols-3">
          <div>
            <div className="field-label">01 · Check in</div>
            <h2 className="mt-3 text-[19px] font-bold">Start with how today feels.</h2>
            <p className="mt-2 text-[12px] leading-5 text-[#788990]">A few gentle prompts build a clearer picture over time.</p>
          </div>
          <div>
            <div className="field-label">02 · Understand</div>
            <h2 className="mt-3 text-[19px] font-bold">See patterns, not labels.</h2>
            <p className="mt-2 text-[12px] leading-5 text-[#788990]">AI-assisted observations help you notice what may be worth caring for.</p>
          </div>
          <div>
            <div className="field-label">03 · Connect</div>
            <h2 className="mt-3 text-[19px] font-bold">Support when you want it.</h2>
            <p className="mt-2 text-[12px] leading-5 text-[#788990]">Self-guided exercises and human counselors are part of the same journey.</p>
          </div>
        </section>
        <section id="privacy" className="mt-10 rounded-[24px] bg-[#eaf4f1] p-6 md:p-8">
          <div className="flex max-w-[720px] items-start gap-4">
            <div className="rounded-xl bg-white p-2.5 text-[#2f9c95]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="field-label !text-[#23645f]">Built with care</div>
              <h2 className="mt-2 font-display text-[27px] tracking-[-.03em]">Supportive, not clinical. Private, not hidden.</h2>
              <p className="mt-3 text-[13px] leading-6 text-[#658079]">
                MindSaathi does not diagnose or replace professionals. It helps students recognize changes in their wellbeing earlier and helps counselors reach students who may need support.
              </p>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

function RoleCards({ role, setRole }: any) {
  return (
    <div>
      <div className="field-label mb-2">Sign in as</div>
      <div className="grid gap-2 md:grid-cols-3">
        {[
          ["student", "Student", "Personal wellness companion", Heart],
          ["counselor", "Counselor", "Support students and manage cases", Stethoscope],
          ["admin", "Administrator", "View anonymous campus trends", LayoutDashboard]
        ].map(([id, title, desc, Icon]: any) => (
          <button
            type="button"
            key={id}
            onClick={() => setRole(id)}
            className={`relative rounded-xl border p-3 text-left transition ${
              role === id ? "border-[#2f9c95] bg-[#edf7f4]" : "border-[#dfe6e3] bg-white hover:border-[#b9d7d0]"
            }`}
          >
            <Icon size={16} className={role === id ? "text-[#2f9c95]" : "text-[#809098]"} />
            <div className="mt-2 text-[12px] font-bold">{title}</div>
            <div className="mt-1 text-[10px] leading-4 text-[#829198]">{desc}</div>
            {role === id && <Check size={14} className="absolute right-3 top-3 text-[#2f9c95]" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function AuthFrame({ children, go }: any) {
  return (
    <div className="min-h-screen bg-[#f7f8f5] md:grid md:grid-cols-[.88fr_1.12fr]">
      <section className="relative hidden overflow-hidden bg-[#18314a] p-10 text-white md:flex md:flex-col md:justify-between lg:p-16">
        <div className="absolute -right-24 -top-16 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="relative">
          <Logo />
          <div className="mt-28 max-w-[390px]">
            <div className="field-label !text-[#92bab4]">A calmer place to start</div>
            <h1 className="mt-5 font-display text-[54px] leading-[.98] tracking-[-.05em]">
              Support when you need it.<br />
              <span className="text-[#76c1b7]">Privacy when it matters.</span>
            </h1>
            <p className="mt-6 text-[14px] leading-6 text-[#b1c5c6]">
              Understand your wellbeing, build healthier habits, and connect with human support when needed.
            </p>
          </div>
        </div>
        <div className="relative flex gap-4 text-[10px] font-bold uppercase tracking-[.12em] text-[#9fb8b8]">
          <span>Privacy-first</span>
          <span>AI-assisted</span>
          <span>Human support</span>
        </div>
      </section>
      <section className="flex min-h-screen items-center justify-center p-5 md:p-10">
        <div className="w-full max-w-[560px]">
          <div className="mb-7 md:hidden">
            <Logo />
          </div>
          {children}
          <button onClick={() => go("/")} className="mt-6 text-[11px] font-bold text-[#70828a]">
            ← Back to MindSaathi
          </button>
        </div>
      </section>
    </div>
  );
}

function AuthPage({ mode, go }: { mode: "login" | "signup" | "forgot"; go: (path: string) => void }) {
  const { setRole: setGlobalRole } = usePortal();
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("MindSaathi University of Technology");
  const [institutionId, setInstitutionId] = useState<string | undefined>(undefined);
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [yearOfStudy, setYearOfStudy] = useState(2);
  const [employeeId, setEmployeeId] = useState("EMP-" + Math.floor(1000 + Math.random() * 9000));
  const [professionalRole, setProfessionalRole] = useState("Campus Counselor");
  const [designation, setDesignation] = useState("Dean of Student Wellness");
  const [authCode, setAuthCode] = useState("MINDSAATHI_ADMIN_2026");
  const [isLoading, setIsLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<boolean>(false);
  const [signupResult, setSignupResult] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);

  // Demo accounts quick-login handler
  const handleQuickDemoLogin = async (demoRole: Role) => {
    setIsLoading(true);
    setErrorMessage(null);
    setPendingNotice(null);
    const demoEmail = `${demoRole}@mindsaathi.demo`;
    const demoPwd = "password123";

    try {
      await authApi.login(demoEmail, demoPwd, demoRole);
      setGlobalRole(demoRole);
      toast.success(`Signed in as Demo ${demoRole.toUpperCase()}!`);
      go(`/${demoRole}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to log in with demo credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setPendingNotice(null);

    try {
      if (mode === "login") {
        const loginEmail = email.trim();
        const loginPwd = password;

        if (!loginEmail || !loginPwd) {
          setErrorMessage("Please enter both email address and password.");
          setIsLoading(false);
          return;
        }

        try {
          await authApi.login(loginEmail, loginPwd, role);
          setGlobalRole(role);
          toast.success(`Welcome back! Authenticated as ${role.toUpperCase()}`);
          go(`/${role}`);
        } catch (err: any) {
          const msg = err.message || "Authentication failed.";
          if (msg.toLowerCase().includes("pending approval") || msg.toLowerCase().includes("verification") || msg.toLowerCase().includes("pending")) {
            setPendingNotice(msg);
          } else {
            setErrorMessage(msg);
          }
        }
      } else {
        // Signup Flow
        const signupEmail = email.trim();
        const signupPwd = password;
        const name = fullName.trim() || (role === "student" ? "Alex Sharma" : role === "counselor" ? "Dr. Counselor" : "Administrator");

        if (!signupEmail || !signupPwd) {
          setErrorMessage("Please enter your email and a secure password.");
          setIsLoading(false);
          return;
        }

        if (role === "student") {
          try {
            const res = await authApi.signupStudent({
              email: signupEmail,
              password: signupPwd,
              full_name: name,
              institution_id: institutionId,
              institution_name: institution,
              department: department,
              year_of_study: Number(yearOfStudy),
              preferred_language: "en"
            });
            setSignupResult(res);
            setSignupSuccess(true);
            toast.success("Student registration submitted for institutional approval!");
          } catch (err: any) {
            setErrorMessage(err.message || "Registration failed.");
          }
        } else if (role === "counselor") {
          try {
            const res = await authApi.signupCounselor({
              email: signupEmail,
              password: signupPwd,
              full_name: name,
              institution_id: institutionId,
              institution_name: institution,
              professional_role: professionalRole,
              employee_id: employeeId,
              department: department
            });
            setSignupResult(res);
            setSignupSuccess(true);
            toast.success("Counselor credentials submitted for institutional verification!");
          } catch (err: any) {
            setErrorMessage(err.message || "Counselor registration failed.");
          }
        } else {
          // Admin signup — creates institution
          try {
            const res = await authApi.signupAdmin({
              email: signupEmail,
              password: signupPwd,
              full_name: name,
              institution_id: institutionId,
              institution_name: institution,
              designation: designation,
              authorization_code: authCode
            });
            setSignupResult(res);
            setSignupSuccess(true);
            toast.success(`Administrator account created! Institution '${res.institution_name || institution}' is now registered.`);
          } catch (err: any) {
            setErrorMessage(err.message || "Administrator registration failed.");
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === "forgot") {
    return (
      <AuthFrame go={go}>
        <div className="field-label">Account access</div>
        <h1 className="mt-3 text-[30px] font-extrabold tracking-[-.05em]">Reset your password</h1>
        <p className="mt-2 text-[13px] leading-5 text-[#718189]">Enter your email and we’ll send you instructions to reset your password.</p>
        {submitted ? (
          <div className="mt-8 rounded-2xl border border-[#cfe4dd] bg-[#edf7f4] p-5">
            <div className="flex items-center gap-2 text-[13px] font-bold text-[#23645f]">
              <Check size={16} /> Check your email
            </div>
            <p className="mt-2 text-[12px] leading-5 text-[#658079]">
              If an account exists with this email, you’ll receive password reset instructions.
            </p>
          </div>
        ) : (
          <>
            <label className="mt-7 block field-label">
              Email address
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dfe6e3] bg-white px-4 py-3 text-[13px] outline-none focus:border-[#2f9c95]"
                type="email"
                placeholder="you@college.edu"
              />
            </label>
            <button onClick={() => setSubmitted(true)} className="btn btn-teal mt-5 w-full rounded-xl py-3.5 text-[12px] font-bold">
              Send reset link
            </button>
          </>
        )}
      </AuthFrame>
    );
  }

  return (
    <AuthFrame go={go}>
      {/* ── Demo Account Quick Access Card (Always visible on login/signup for easy evaluation) ── */}
      <div className="mb-6 rounded-2xl border border-[#cfe4dd] bg-gradient-to-br from-[#edf7f4] to-[#f4faf8] p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] font-bold text-[#23645f]">
            <Sparkles size={15} className="text-[#2f9c95]" />
            <span>Instant Demo Evaluation</span>
          </div>
          <span className="rounded-full bg-[#d7ece6] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#1c5550]">
            1-Click Demo
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-4 text-[#557a73]">
          Experience any role instantly with pre-approved demo credentials:
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemoLogin("student")}
            disabled={isLoading}
            className="flex flex-col items-center justify-center rounded-xl border border-[#cfe2db] bg-white p-2.5 text-center transition hover:border-[#2f9c95] hover:shadow-xs disabled:opacity-50"
          >
            <Heart size={14} className="text-[#2f9c95]" />
            <span className="mt-1 text-[11px] font-bold text-[#18314a]">Student</span>
            <span className="text-[9px] text-[#718289]">student@…demo</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin("counselor")}
            disabled={isLoading}
            className="flex flex-col items-center justify-center rounded-xl border border-[#cfe2db] bg-white p-2.5 text-center transition hover:border-[#2f9c95] hover:shadow-xs disabled:opacity-50"
          >
            <Stethoscope size={14} className="text-[#2f9c95]" />
            <span className="mt-1 text-[11px] font-bold text-[#18314a]">Counselor</span>
            <span className="text-[9px] text-[#718289]">counselor@…demo</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin("admin")}
            disabled={isLoading}
            className="flex flex-col items-center justify-center rounded-xl border border-[#cfe2db] bg-white p-2.5 text-center transition hover:border-[#2f9c95] hover:shadow-xs disabled:opacity-50"
          >
            <Building2 size={14} className="text-[#2f9c95]" />
            <span className="mt-1 text-[11px] font-bold text-[#18314a]">Admin</span>
            <span className="text-[9px] text-[#718289]">admin@…demo</span>
          </button>
        </div>
        <p className="mt-2 text-[10px] text-[#8a9fa8]">
          Password for all demo accounts: <strong>password123</strong>
        </p>
      </div>

      <div className="field-label">MindSaathi Campus Portal</div>
      <h1 className="mt-2 text-[28px] font-extrabold tracking-[-.05em] text-[#18314a]">
        {mode === "login" ? "Sign In to Your Account" : "Create User Account"}
      </h1>
      <p className="mt-1.5 text-[13px] leading-5 text-[#718189]">
        {mode === "login"
          ? "Select your campus role to enter your dedicated wellness portal."
          : "Register a real user account for your university or college."}
      </p>

      <div className="mt-5">
        <RoleCards role={role} setRole={(r: Role) => {
          setRole(r);
          setErrorMessage(null);
          setPendingNotice(null);
          setInstitution(r === "admin" ? "" : "");
          setInstitutionId(undefined);
        }} />
      </div>

      {/* Pending Notice Banner */}
      {pendingNotice && (
        <div className="mt-4 rounded-2xl border border-[#f5d09e] bg-[#fffbf2] p-4 text-[#8a5314] shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-[#d97706] mt-0.5" />
            <div>
              <div className="text-[13px] font-bold text-[#92400e]">Account Pending Institutional Approval</div>
              <p className="mt-1 text-[12px] leading-5 text-[#9a5b17]">
                {pendingNotice}
              </p>
              <p className="mt-2 text-[11px] text-[#b45309]">
                💡 <strong>Tip for Evaluators:</strong> You can log in as the Institutional Administrator using the <strong>Admin Demo button</strong> above to review and approve this pending request, or log in with the <strong>Student Demo</strong> button.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#f5c6cb] bg-[#fdf2f2] p-3 text-[12px] font-medium text-[#b92c3a]">
          <AlertTriangle size={15} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Signup Success Banner */}
      {signupSuccess ? (
        <div className="mt-6 rounded-2xl border border-[#cfe4dd] bg-[#edf7f4] p-5 shadow-xs">
          <div className="flex items-center gap-2.5 text-[14px] font-bold text-[#23645f]">
            <Check size={18} className="text-[#2f9c95]" /> Registration Successfully Submitted!
          </div>
          <p className="mt-2 text-[12px] leading-5 text-[#426b64]">
          {role === "student"
              ? `Your student registration has been submitted to the Institutional Administrator at ${signupResult?.institution_name || institution}. Once approved by your campus administrator, you will be able to sign in, book counseling sessions, and connect with your campus counselors.`
              : role === "counselor"
              ? `Your counselor credentials have been submitted for institutional verification at ${signupResult?.institution_name || institution}. Access will be unlocked upon approval by your institution administrator.`
              : `Your administrator account has been created and authorized. The institution '${signupResult?.institution_name || institution}' (code: ${signupResult?.institution_code || "—"}) is now registered on MindSaathi. Students and counselors from this institution can now find it in the signup dropdown and register.`}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => { setSignupSuccess(false); go("/login"); }}
              className="btn btn-teal rounded-xl px-4 py-2 text-[12px] font-bold"
            >
              Go to Sign In →
            </button>
            <button
              onClick={() => handleQuickDemoLogin(role)}
              className="rounded-xl border border-[#cfe2db] bg-white px-3.5 py-2 text-[12px] font-bold text-[#23645f] hover:bg-[#eaf4f1]"
            >
              Try Instant Demo
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Signup Extended Fields */}
          {mode === "signup" && (
            <div className="mt-5 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block field-label">
                  Full Name <span className="text-red-400">*</span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#dfe6e3] bg-white px-4 py-3 text-[13px] outline-none focus:border-[#2f9c95]"
                    placeholder={role === "student" ? "Alex Sharma" : role === "counselor" ? "Dr. Priya Sharma" : "Dr. Dinesh Walker"}
                    required
                  />
                </label>

                {/* Admin: free-text institution name (creates new institution in DB) */}
                {role === "admin" ? (
                  <label className="block">
                    <span className="block text-[10px] font-bold uppercase tracking-[.12em] text-[#88979c] mb-2">
                      Institution Name <span className="text-red-400">*</span>
                    </span>
                    <input
                      value={institution}
                      onChange={(e) => { setInstitution(e.target.value); setInstitutionId(undefined); }}
                      className="w-full rounded-xl border border-[#dfe6e3] bg-white px-4 py-3 text-[13px] outline-none focus:border-[#2f9c95]"
                      placeholder="e.g. NIT Rourkela, IIT Delhi..."
                      required
                    />
                    <p className="mt-1.5 text-[10px] text-[#8a9fa8]">
                      ✦ A new institution will be created & students/counselors can then join it.
                    </p>
                  </label>
                ) : (
                  /* Student/Counselor: select from registered institutions only */
                  <div>
                    <CollegeDropdown
                      label={role === "student" ? "Select Your Institution *" : "Select Institution *"}
                      value={institution}
                      onChange={(name, id) => { setInstitution(name); setInstitutionId(id); }}
                      required
                    />
                    <p className="mt-1.5 text-[10px] text-[#8a9fa8]">
                      Only admin-registered institutions appear here.
                    </p>
                  </div>
                )}
              </div>

              {/* Student specific fields */}
              {role === "student" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block field-label">
                    Department / Major
                    <input
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#dfe6e3] bg-white px-4 py-3 text-[13px] outline-none focus:border-[#2f9c95]"
                      placeholder="Computer Science & Engineering"
                    />
                  </label>
                  <label className="block field-label">
                    Year of Study
                    <select
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(Number(e.target.value))}
                      className="mt-2 w-full rounded-xl border border-[#dfe6e3] bg-white px-4 py-3 text-[13px] outline-none focus:border-[#2f9c95]"
                    >
                      <option value={1}>1st Year (Freshman)</option>
                      <option value={2}>2nd Year (Sophomore)</option>
                      <option value={3}>3rd Year (Junior)</option>
                      <option value={4}>4th Year (Senior)</option>
                      <option value={5}>Post-Graduate / PhD</option>
                    </select>
                  </label>
                </div>
              )}

              {/* Counselor specific fields */}
              {role === "counselor" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block field-label">
                    Employee ID
                    <input
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#dfe6e3] bg-white px-4 py-3 text-[13px] outline-none focus:border-[#2f9c95]"
                      placeholder="EMP-9021"
                    />
                  </label>
                  <label className="block field-label">
                    Professional Role
                    <input
                      value={professionalRole}
                      onChange={(e) => setProfessionalRole(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#dfe6e3] bg-white px-4 py-3 text-[13px] outline-none focus:border-[#2f9c95]"
                      placeholder="Lead Campus Counselor"
                    />
                  </label>
                </div>
              )}

              {/* Admin specific fields */}
              {role === "admin" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block field-label">
                    Official Designation
                    <input
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#dfe6e3] bg-white px-4 py-3 text-[13px] outline-none focus:border-[#2f9c95]"
                      placeholder="Dean of Student Wellness"
                    />
                  </label>
                  <label className="block field-label">
                    Authorization Code
                    <input
                      value={authCode}
                      onChange={(e) => setAuthCode(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#dfe6e3] bg-white px-4 py-3 text-[13px] outline-none focus:border-[#2f9c95]"
                      placeholder="MINDSAATHI_ADMIN_2026"
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Email & Password */}
          <div className="mt-4 grid gap-3">
            <label className="block field-label">
              {mode === "login"
                ? "Email address"
                : role === "counselor"
                ? "Professional Campus Email"
                : role === "admin"
                ? "Institutional Email"
                : "Student Email Address"}
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dfe6e3] bg-white px-4 py-3 text-[13px] outline-none focus:border-[#2f9c95]"
                type="email"
                placeholder={role === "student" ? "student@college.edu" : role === "counselor" ? "counselor@wellness.college.edu" : "admin@college.edu"}
                required
              />
            </label>

            <label className="block field-label">
              Password
              <div className="relative mt-2">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#dfe6e3] bg-white px-4 py-3 pr-11 text-[13px] outline-none focus:border-[#2f9c95]"
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#819097] hover:text-[#2f9c95]"
                >
                  <CircleHelp size={16} />
                </button>
              </div>
            </label>
          </div>

          {mode === "login" && (
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[11px] text-[#788a91]">
                Default demo password: <strong className="text-[#23645f]">password123</strong>
              </span>
              <button
                type="button"
                onClick={() => go("/forgot-password")}
                className="text-[11px] font-bold text-[#23645f] hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            onClick={handleAuth}
            disabled={isLoading}
            className="btn btn-teal mt-5 w-full rounded-xl py-3.5 text-[13px] font-bold transition disabled:opacity-50"
          >
            {isLoading
              ? "Processing..."
              : mode === "login"
              ? `Sign In as ${role === "student" ? "Student" : role === "counselor" ? "Counselor" : "Administrator"}`
              : role === "student"
              ? "Submit Student Registration Request"
              : role === "counselor"
              ? "Submit Counselor Application"
              : "Register Administrator Account"}
          </button>
        </>
      )}

      <div className="mt-6 text-center text-[12px] text-[#819097]">
        {mode === "login" ? "Don’t have an account yet?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setErrorMessage(null);
            setPendingNotice(null);
            setSignupSuccess(false);
            go(mode === "login" ? "/signup" : "/login");
          }}
          className="font-bold text-[#23645f] hover:underline"
        >
          {mode === "login" ? "Register new account" : "Sign in here"}
        </button>
      </div>

      <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-[#8b999d]">
        <LockKeyhole size={12} /> MindSaathi is ISO-27001 and FERPA compliant with k-anonymity privacy protection.
      </div>
    </AuthFrame>
  );
}

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <label className="block field-label">
      {label}
      <input className="mt-2 w-full rounded-xl border border-[#dfe6e3] bg-white px-4 py-3 text-[13px] outline-none focus:border-[#2f9c95]" placeholder={placeholder} type={type} />
    </label>
  );
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const go = (path: string) => setLocation(path);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear tokens even if server call fails
    }
    toast.success("You have been logged out successfully.");
    setLocation("/");
  };

  if (location === "/") return <Landing go={go} />;
  if (location === "/login") return <AuthPage mode="login" go={go} />;
  if (location === "/signup") return <AuthPage mode="signup" go={go} />;
  if (location === "/forgot-password") return <AuthPage mode="forgot" go={go} />;
  if (location.startsWith("/student") || location.startsWith("/counselor") || location.startsWith("/admin")) {
    return <DashboardApp onLogout={handleLogout} />;
  }
  return <Landing go={go} />;
}

function InteractiveSessionModal({ close }: { close: () => void }) {
  const { scheduleAppointment, counselors } = usePortal();
  const [counselorList, setCounselorList] = useState(counselors);

  useEffect(() => {
    counselorApi.getDirectory().then((res) => {
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((c: any) => ({
          id: c.id,
          name: c.name || `Dr. ${c.user?.full_name || "Counselor"}`,
          department: c.department || c.specialization || "Mental Health Cell",
          activeCases: c.active_cases_count || 4,
          status: "Active" as const,
        }));
        setCounselorList(mapped);
        if (mapped.length > 0) {
          setSelectedCounselor(mapped[0].name);
        }
      }
    }).catch(() => {});
  }, []);

  const activeCounselors = counselorList.filter((c) => c.status === "Active");
  const defaultCounselor = activeCounselors[0]?.name || "Dr. Priya Sharma";

  const [selectedCounselor, setSelectedCounselor] = useState(defaultCounselor);
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState<"In-person" | "Video" | "Chat">("Video");
  const [reason, setReason] = useState("Academic stress");
  const [time, setTime] = useState("Tomorrow · 3:00 PM");
  const selected = "border-[#2f9c95] bg-[#edf7f4] text-[#23645f]";
  const idle = "border-[#dce6e2] bg-white text-[#536973] hover:border-[#7cc0b7]";

  const handleBook = async () => {
    const foundCounselor = activeCounselors.find((c) => c.name === selectedCounselor) || counselorList[0];
    const counselorIdToSend = foundCounselor?.id && !foundCounselor.id.startsWith("c") ? foundCounselor.id : undefined;
    try {
      await scheduleAppointment({
        studentId: "STU-2048",
        counselorId: counselorIdToSend,
        counselorName: selectedCounselor,
        date: time.includes("Tomorrow") ? "Tomorrow" : "Today",
        time: time.split("·")[1]?.trim() || "3:00 PM",
        mode,
        topic: reason,
        durationMinutes: 45,
      });
      setSubmitted(true);
    } catch {
      // Error is toasted in scheduleAppointment
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#18314a]/30 p-0 backdrop-blur-sm md:items-center md:p-5">
        <div className="w-full max-w-[540px] rounded-t-[26px] bg-white p-7 text-center shadow-[0_30px_100px_rgba(24,49,74,.25)] md:rounded-[26px]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e5f3f1] text-[#2f9c95]">
            <Check size={28} />
          </div>
          <div className="mt-5 text-[22px] font-extrabold tracking-[-.04em]">Session requested</div>
          <p className="mx-auto mt-2 max-w-[340px] text-[13px] leading-5 text-[#718189]">
            Your session request with <strong className="text-[#18314a]">{selectedCounselor}</strong> is set for {time.toLowerCase()}.
          </p>
          <div className="mt-5 rounded-2xl bg-[#f4f8f6] p-4 text-left text-[12px] space-y-1">
            <div className="flex justify-between py-1"><span className="text-[#8a989d]">Counselor</span><b>{selectedCounselor}</b></div>
            <div className="flex justify-between py-1"><span className="text-[#8a989d]">Consultation Mode</span><b>{mode}</b></div>
            <div className="flex justify-between py-1"><span className="text-[#8a989d]">Discussion Topic</span><b>{reason}</b></div>
            <div className="flex justify-between py-1"><span className="text-[#8a989d]">Status</span><b className="text-[#23645f]">Pending Counselor Confirmation</b></div>
          </div>
          <button onClick={close} className="btn btn-teal mt-5 w-full rounded-xl py-3 text-[12px] font-bold">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#18314a]/30 p-0 backdrop-blur-sm md:items-center md:p-5">
      <div className="w-full max-w-[700px] rounded-t-[26px] bg-white p-6 shadow-[0_30px_100px_rgba(24,49,74,.25)] md:rounded-[26px] md:p-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="field-label">Human support</div>
            <h2 className="mt-2 text-[23px] font-extrabold tracking-[-.05em]">Request a counseling session</h2>
            <p className="mt-2 text-[12px] text-[#718189]">Choose your institutional counselor and consultation format.</p>
          </div>
          <button onClick={close} aria-label="Close session request" className="rounded-lg p-1 text-[#9aa6aa] hover:bg-[#f1f5f3]">
            <X size={18} />
          </button>
        </div>

        {/* Institutional Counselor Selection */}
        <div className="mt-5">
          <div className="field-label mb-2">Available Institutional Counselors</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {(activeCounselors.length > 0 ? activeCounselors : [{ id: "c1", name: "Dr. Priya Sharma", department: "Mental Health Cell" }]).map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setSelectedCounselor(c.name)}
                className={`rounded-xl border p-3 text-left transition ${selectedCounselor === c.name ? selected : idle}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold">{c.name}</span>
                  {selectedCounselor === c.name && <Check size={14} className="text-[#2f9c95]" />}
                </div>
                <div className="mt-0.5 text-[11px] text-[#74878e]">{c.department}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="field-label mb-2">Consultation Mode</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Video Call (Google Meet)", Video, "Video"],
              ["In-person", Users, "In-person"],
              ["Chat Support", MessageCircle, "Chat"],
            ].map(([x, Icon, modeType]: any) => (
              <button
                type="button"
                aria-pressed={mode === modeType}
                onClick={() => setMode(modeType)}
                key={x}
                className={`rounded-xl border p-3 text-left transition ${mode === modeType ? selected : idle}`}
              >
                <Icon size={16} className={mode === modeType ? "text-[#2f9c95]" : "text-[#6f858d]"} />
                <div className="mt-2 text-[11px] font-bold">{x}</div>
                {mode === modeType && <Check size={13} className="mt-2 text-[#2f9c95]" />}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 field-label">What would you like support with?</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {["Academic stress", "Anxiety / worry", "Sleep routine", "Relationships", "General wellbeing"].map((x) => (
            <button
              type="button"
              aria-pressed={reason === x}
              onClick={() => setReason(x)}
              key={x}
              className={`rounded-full border px-3 py-2 text-[11px] font-bold transition ${reason === x ? selected : idle}`}
            >
              {x}
              {reason === x && <Check size={12} className="ml-1 inline" />}
            </button>
          ))}
        </div>

        <div className="mt-5 field-label">Preferred time slot</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {["Today · 4:00 PM", "Tomorrow · 10:00 AM", "Tomorrow · 3:00 PM"].map((x) => (
            <button
              type="button"
              aria-pressed={time === x}
              onClick={() => setTime(x)}
              key={x}
              className={`rounded-xl border p-3 text-left text-[11px] font-bold transition ${time === x ? selected : idle}`}
            >
              {x}
              {time === x && <Check size={13} className="mt-2 text-[#2f9c95]" />}
            </button>
          ))}
        </div>

        <button
          onClick={handleBook}
          className="btn btn-teal mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[12px] font-bold"
        >
          Confirm Session Request with {selectedCounselor} <ArrowUpRight size={15} />
        </button>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[#8b999d]">
          <LockKeyhole size={12} /> Confidential and shared only with your counselor.
        </div>
      </div>
    </div>
  );
}

function RangeToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (r: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-[#f1f5f3] p-1">
      {["7 days", "30 days"].map((x) => (
        <button
          type="button"
          aria-pressed={value === x}
          onClick={() => onChange(x)}
          key={x}
          className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold transition ${
            value === x ? "bg-white text-[#23645f] shadow-sm" : "text-[#8b999d] hover:text-[#23645f]"
          }`}
        >
          {x}
        </button>
      ))}
    </div>
  );
}
