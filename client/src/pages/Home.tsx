/* Quiet Observatory: unified multi-role portal for MindSaathi (Student, Counselor, Institutional Admin) */
import React, { useState, useEffect } from "react";
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
import {
  CounselorOverview, CounselorCasesPage, CaseDetailView, CounselorAppointments,
  CounselorSessionsHistory, CounselorMessages, CounselorInterventions, CounselorAnalytics
} from "../components/counselor/CounselorViews";
import {
  AdminOverview, AdminWellnessTrends, AdminStressInsights, AdminInterventionImpact,
  AdminCounselorManagement, AdminReports, AdminPrivacyCenter, AdminSettings
} from "../components/admin/AdminViews";

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
  ["High-risk cases", AlertTriangle],
  ["Students", Users],
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
  const userDetails =
    role === "student"
      ? { name: "Alex Sharma", email: "alex@mindsaathi.demo", roleTitle: "Student", initials: "AS" }
      : role === "counselor"
      ? { name: "Dr. Priya Sharma", email: "priya.sharma@mindsaathi.demo", roleTitle: "Counselor", initials: "PS" }
      : { name: "Dean of Wellness", email: "admin@mindsaathi.demo", roleTitle: "Administrator", initials: "DW" };

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
  const { role, notifications } = usePortal();
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
                close();
                if (n.linkTab) onNavigate(n.linkTab);
                toast.info(n.title);
              }}
              className={`flex w-full gap-3 py-3 text-left transition ${
                i === 0 ? "bg-[#f4faf8] -mx-2 px-2 rounded-xl" : "hover:bg-[#fafcfb]"
              }`}
            >
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  i === 0 ? "bg-[#dcefea] text-[#2f9c95]" : "bg-[#f0f3f2] text-[#718189]"
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
        <button onClick={() => toast.success("All notifications marked as read")} className="text-[11px] font-bold text-[#23645f]">
          Mark all as read
        </button>
        <button onClick={() => toast.info("Notification center")} className="text-[11px] font-bold text-[#7d8d93]">
          Preferences
        </button>
      </div>
    </div>
  );
}

function ScoreRing({ score = 74 }: { score?: number }) {
  const r = 58,
    c = 2 * Math.PI * r;
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
          strokeDasharray={`${c * 0.74} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[38px] font-extrabold tracking-[-.07em] text-[#18314a]">{score}</div>
        <div className="text-[10px] font-bold uppercase tracking-[.12em] text-[#84949a]">of 100</div>
      </div>
    </div>
  );
}

function TrendChart() {
  return (
    <div className="relative h-[172px] w-full overflow-hidden">
      <div className="absolute inset-x-0 top-4 flex justify-between text-[10px] text-[#9aa7aa]">
        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
      </div>
      <svg className="absolute inset-0 top-7 h-[135px] w-full" viewBox="0 0 700 140" preserveAspectRatio="none">
        <g className="chart-grid">
          <line x1="0" y1="15" x2="700" y2="15" />
          <line x1="0" y1="55" x2="700" y2="55" />
          <line x1="0" y1="95" x2="700" y2="95" />
          <line x1="0" y1="135" x2="700" y2="135" />
        </g>
        <path
          d="M0 80 C48 75 62 62 104 67 S165 85 205 58 S260 48 302 67 S355 49 402 43 S455 56 500 37 S570 46 603 31 S667 26 700 20"
          fill="none"
          stroke="#2f9c95"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M0 49 C45 52 61 73 104 68 S166 44 205 77 S260 92 302 74 S355 83 402 70 S455 91 500 64 S570 76 603 55 S667 78 700 61"
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

function SessionCard({ onRequest }: { onRequest: () => void }) {
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
            <div className="text-[14px] font-bold">Dr. Priya Sharma</div>
            <div className="mt-1 text-[11px] text-[#788990]">Counseling session · In-person</div>
          </div>
          <Badge>Confirmed</Badge>
        </div>
        <div className="mt-4 flex items-center gap-4 text-[12px] font-bold text-[#536b75]">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={14} className="text-[#2f9c95]" />Tomorrow
          </span>
          <span className="flex items-center gap-1.5">
            <Clock3 size={14} className="text-[#2f9c95]" />3:00 PM
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button onClick={() => toast.success("Session details opened")} className="text-[12px] font-bold text-[#23645f]">
          View details <ArrowUpRight size={13} className="ml-1 inline" />
        </button>
        <button
          onClick={() => toast.info("Join link will be available 15 minutes before")}
          className="rounded-lg bg-[#18314a] px-3 py-2 text-[11px] font-bold text-white btn"
        >
          Join session
        </button>
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

function StudentDashboard({ onRequest, active = "Home" }: { onRequest: () => void; active?: string }) {
  if (active !== "Home") return <StudentSection active={active} onRequest={onRequest} />;

  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="field-label mb-2">Saturday, 22 August 2026</div>
          <h1 className="text-[29px] font-extrabold tracking-[-.05em] text-[#18314a] md:text-[34px]">
            Good morning, Alex<span className="text-[#2f9c95]">.</span>
          </h1>
          <p className="mt-2 text-[14px] text-[#718189]">A small check-in can help you notice the shape of your day.</p>
        </div>
        <button
          onClick={() => toast.info("MindSaathi Student Companion v2.6 active")}
          className="hidden items-center gap-2 rounded-xl border border-[#dce6e2] bg-white px-3 py-2 text-[11px] font-bold text-[#61747d] md:flex"
        >
          <CircleHelp size={14} /> How this works
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.08fr_.92fr]">
        <section className="card fade-up overflow-hidden p-6 md:p-7">
          <div className="flex flex-col justify-between gap-6 sm:flex-row">
            <div>
              <div className="field-label">Today's wellbeing</div>
              <div className="mt-3 flex items-center gap-3">
                <Badge>Doing okay</Badge>
                <span className="text-[11px] text-[#88979c]">Based on your recent check-ins</span>
              </div>
              <p className="mt-5 max-w-[270px] text-[14px] leading-6 text-[#647881]">
                Your wellbeing looks steady today. Keep making room for the things that restore you.
              </p>
            </div>
            <ScoreRing />
          </div>
          <div className="mt-5 grid grid-cols-4 divide-x divide-[#e7eeeb] rounded-2xl bg-[#f5f8f6] py-3">
            <Stat label="Mood" value="7/10" />
            <Stat label="Stress" value="5/10" />
            <Stat label="Energy" value="6/10" />
            <Stat label="Sleep" value="6h 42m" />
          </div>
          <button
            onClick={() => toast.success("Check-in flow ready")}
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
              Your stress has been a little higher than usual this week.
            </div>
            <p className="mt-4 max-w-[320px] text-[12px] leading-5 text-[#b3c5c6]">
              Not a conclusion—just a pattern worth meeting with a little care.
            </p>
            <button
              onClick={() => toast.info("Wellness insights opened")}
              className="mt-8 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 text-[11px] font-bold text-white hover:bg-white/15"
            >
              View insights <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="relative mt-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#87b3ae]">
            <ShieldCheck size={14} /> Private to you
          </div>
        </section>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#dfe8e4]" />
        <span className="field-label">Your support orbit</span>
        <div className="h-px w-12 bg-[#dfe8e4]" />
      </div>

      <div className="mt-4 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <section className="card fade-up delay-2 signal-line p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="field-label">Your week</div>
              <h2 className="mt-2 text-[18px] font-bold">Patterns, not perfection</h2>
            </div>
            <RangeToggle />
          </div>
          <div className="mt-3 flex gap-4 text-[10px] text-[#71828a]">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#2f9c95]" />Mood</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#d4b5dc]" />Stress</span>
          </div>
          <TrendChart />
          <div className="signal-line amber mt-2 rounded-r-xl bg-[#fffaf4] px-4 py-3">
            <div className="text-[11px] font-bold text-[#8c5b31]">One thing to notice</div>
            <div className="mt-1 text-[11px] leading-4 text-[#9d8062]">
              Your stress tends to rise around assignment deadlines.
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <SessionCard onRequest={onRequest} />
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="field-label">Recommended for you</div>
                <h3 className="mt-2 text-[17px] font-bold">A little support</h3>
              </div>
              <button onClick={() => toast.info("Exercise library opened")} className="text-[11px] font-bold text-[#23645f]">
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
        <MiniCard label="Check-ins this week" value="5" detail="You’re building a useful picture." icon={Check} color="teal" />
        <MiniCard label="Exercises completed" value="2" detail="Small moments still count." icon={Wind} color="lavender" />
        <MiniCard label="Average stress" value="5.2/10" detail="Slightly above your usual level." icon={Activity} color="amber" />
      </section>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-y border-[#cfe3dd] bg-[#edf7f4] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white p-2 text-[#2f9c95]">
            <Stethoscope size={18} />
          </div>
          <div>
            <div className="text-[12px] font-bold text-[#23645f]">Talking to someone could help.</div>
            <div className="mt-0.5 text-[11px] text-[#66827d]">Human support is available when you want it.</div>
          </div>
        </div>
        <button onClick={onRequest} className="btn rounded-lg bg-[#23645f] px-3.5 py-2.5 text-[11px] font-bold text-white">
          Request a session
        </button>
      </div>
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

function StudentSection({ active, onRequest, onGoHome }: { active: string; onRequest: () => void; onGoHome?: () => void }) {
  const [checkinStep, setCheckinStep] = useState(1);
  const [feeling, setFeeling] = useState("Okay");
  const [stressSource, setStressSource] = useState("Academics & Exams");
  const [sleepHours, setSleepHours] = useState("7 hours");
  const [checkinNotes, setCheckinNotes] = useState("");
  
  // AI Companion interactive state
  const [companionMessages, setCompanionMessages] = useState<Array<{ sender: "ai" | "user"; text: string; time: string }>>([
    { sender: "ai", text: "Hello Alex. I am MindSaathi's wellness companion. How are things feeling right now?", time: "Just now" }
  ]);
  const [inputMsg, setInputMsg] = useState("");

  // Exercise Player state
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [breathingPhase, setBreathingPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Rest">("Inhale");
  const [breathingCounter, setBreathingCounter] = useState(4);

  // Journal state
  const [journalEntries, setJournalEntries] = useState<Array<{ id: string; date: string; content: string }>>([
    { id: "j1", date: "Yesterday, 9:30 PM", content: "Spent 40 minutes reviewing course materials. Feeling slightly better after talking to my peer study group." }
  ]);
  const [currentJournal, setCurrentJournal] = useState("");

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

  const handleSendCompanion = (msgText: string) => {
    if (!msgText.trim()) return;
    const userMsg = { sender: "user" as const, text: msgText, time: "Just now" };
    setCompanionMessages((prev) => [...prev, userMsg]);
    setInputMsg("");

    setTimeout(() => {
      let reply = "I hear you. Taking a short pause to breathe can often help clear the mental space.";
      const lower = msgText.toLowerCase();
      if (lower.includes("exam") || lower.includes("workload") || lower.includes("assignment")) {
        reply = "Academic workload can feel heavy when deadlines cluster. Would breaking down your tasks into 25-minute focus intervals help?";
      } else if (lower.includes("sleep") || lower.includes("tired")) {
        reply = "Sleep is so foundational for emotional regulation. Would you like to try a gentle 5-minute wind-down routine tonight?";
      } else if (lower.includes("breathe") || lower.includes("anxious") || lower.includes("panic")) {
        reply = "Let's take a slow breath together. Inhale gently for 4 counts, hold for 4, and exhale for 4.";
      }
      setCompanionMessages((prev) => [...prev, { sender: "ai" as const, text: reply, time: "Just now" }]);
    }, 600);
  };

  const handleSaveJournal = () => {
    if (!currentJournal.trim()) {
      toast.error("Please write a reflection before saving.");
      return;
    }
    setJournalEntries((prev) => [
      { id: `j-${Date.now()}`, date: "Today, Just now", content: currentJournal },
      ...prev
    ]);
    setCurrentJournal("");
    toast.success("Reflection saved securely in your private journal.");
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
      ? "Supportive non-clinical conversations, grounding, and perspective shifts."
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
                  ].map(([x, y, tone]: any) => (
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
                <p className="mt-1 text-[12px] text-[#71828a]">Notes are stored strictly on your device.</p>
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
                    onClick={() => {
                      setCheckinStep(5);
                      toast.success("Check-in submitted successfully!");
                    }}
                    className="btn btn-teal rounded-xl px-5 py-2.5 text-[12px] font-bold flex items-center gap-1.5"
                  >
                    Complete Check-in <Check size={15} />
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
                  Thank you for checking in, Alex. Your steady daily reflections help build a healthier habit.
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

      {/* 2. AI COMPANION INTERACTIVE CHAT */}
      {active === "AI Companion" && (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <section className="card p-6 flex flex-col h-[520px]">
            <div className="flex items-center gap-3 border-b border-[#edf1ef] pb-3">
              <div className="rounded-xl bg-[#e7f3f0] p-2 text-[#2f9c95]">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-[#18314a]">MindSaathi Companion</h2>
                <div className="text-[10px] text-[#819097]">Confidential AI Support · Non-diagnostic</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {companionMessages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3.5 text-[13px] leading-5 ${
                      m.sender === "user"
                        ? "bg-[#18314a] text-white rounded-br-none"
                        : "bg-[#edf7f4] text-[#294c48] rounded-bl-none"
                    }`}
                  >
                    {m.text}
                    <div className={`mt-1 text-[9px] ${m.sender === "user" ? "text-white/60 text-right" : "text-[#7a9692]"}`}>
                      {m.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#edf1ef]">
              <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
                {["Try box breathing", "Break down workload", "Talk about exam stress", "Just listen"].map((chip) => (
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
                  placeholder="Share how you're feeling..."
                  className="flex-1 rounded-xl border border-[#dfe6e3] px-3.5 py-2 text-[12px] outline-none focus:border-[#2f9c95]"
                />
                <button type="submit" className="btn btn-teal rounded-xl px-4 py-2 text-[12px] font-bold">
                  <Send size={14} />
                </button>
              </form>
            </div>
          </section>

          <div className="flex flex-col gap-4">
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
              <p className="mt-2 text-[12px] text-[#71828a]">
                If you prefer speaking with a human counselor, confidential sessions are available Monday through Friday.
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
              ].map(([x, v, tone]: any) => (
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18314a]/40 backdrop-blur-sm p-4">
              <div className="w-full max-w-[480px] rounded-3xl bg-white p-7 text-center shadow-[0_25px_80px_rgba(24,49,74,.3)] animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-[#edf1ef] pb-3">
                  <div className="text-[15px] font-bold text-[#18314a]">{activeExercise}</div>
                  <button onClick={() => setActiveExercise(null)} className="text-[#88979c] hover:text-[#18314a]">
                    <X size={18} />
                  </button>
                </div>
                <div className="my-8 flex flex-col items-center justify-center">
                  <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-[#edf7f4] text-[#23645f] shadow-inner transition-all duration-700">
                    <div className="text-[32px] font-extrabold">{breathingCounter}</div>
                  </div>
                  <div className="mt-4 text-[18px] font-bold text-[#18314a]">{breathingPhase}</div>
                  <p className="mt-1 text-[12px] text-[#71828a]">
                    {breathingPhase === "Inhale"
                      ? "Breathe in slowly through your nose..."
                      : breathingPhase === "Hold"
                      ? "Hold your breath gently..."
                      : breathingPhase === "Exhale"
                      ? "Release slowly through your mouth..."
                      : "Pause and relax before the next cycle..."}
                  </p>
                </div>
                <button onClick={() => setActiveExercise(null)} className="btn btn-teal w-full rounded-xl py-3 text-[12px] font-bold">
                  Finish Exercise
                </button>
              </div>
            </div>
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

      {/* 6. SUPPORT ORBIT */}
      {active === "Support" && (
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
      if (location.includes("/cases")) setActive("High-risk cases");
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
          <StudentDashboard active={active} onRequest={() => setSessionModalOpen(true)} />
        ) : role === "counselor" ? (
          /* Counselor Views Rendering */
          active === "CasesDetail" && selectedCase ? (
            <CaseDetailView
              c={selectedCase}
              onBack={() => setActive("High-risk cases")}
              onNavigate={handleNavigation}
            />
          ) : active === "High-risk cases" || active === "Students" ? (
            <CounselorCasesPage
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
            <main className="mobile-content mx-auto max-w-[1080px]">
              <div className="card p-6">
                <h1 className="text-[22px] font-bold">Counselor Workspace Settings</h1>
                <p className="mt-1 text-[13px] text-[#71828a]">Manage clinical availability and alert sensitivity.</p>
                <button onClick={() => toast.success("Counselor settings saved")} className="btn btn-teal mt-4 rounded-xl px-5 py-2.5 text-[12px] font-bold">
                  Save Preferences
                </button>
              </div>
            </main>
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
              <button onClick={() => setActive("High-risk cases")} className="flex flex-col items-center gap-1 text-[#7e8e94]">
                <AlertTriangle size={18} />
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
  const [show, setShow] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
              <input className="mt-2 w-full rounded-xl border border-[#dfe6e3] bg-white px-4 py-3 text-[13px] outline-none focus:border-[#2f9c95]" type="email" placeholder="you@college.edu" />
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
      <div className="field-label">MindSaathi account</div>
      <h1 className="mt-3 text-[30px] font-extrabold tracking-[-.05em]">{mode === "login" ? "Welcome back" : "Join MindSaathi"}</h1>
      <p className="mt-2 text-[13px] leading-5 text-[#718189]">{mode === "login" ? "Sign in to continue your wellness journey." : "Choose your role to get started."}</p>
      <div className="mt-6">
        <RoleCards role={role} setRole={setRole} />
      </div>
      {mode === "signup" && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Full name" placeholder="Alex Sharma" />
          <Field label={role === "student" ? "College / Institution" : "Institution"} placeholder="Your institution" />
        </div>
      )}
      <div className="mt-5 grid gap-3">
        <Field
          label={mode === "login" ? "Email address" : role === "counselor" ? "Professional email" : role === "admin" ? "Institutional email" : "Email address"}
          placeholder={role + "@mindsaathi.demo"}
          type="email"
        />
        <label className="block field-label">
          Password
          <div className="relative mt-2">
            <input className="w-full rounded-xl border border-[#dfe6e3] bg-white px-4 py-3 pr-11 text-[13px] outline-none focus:border-[#2f9c95]" type={show ? "text" : "password"} placeholder="••••••••" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#819097]">
              <CircleHelp size={16} />
            </button>
          </div>
        </label>
        {mode === "signup" && <Field label="Confirm password" placeholder="••••••••" type="password" />}
      </div>
      {mode === "login" && (
        <div className="mt-3 flex justify-end">
          <button onClick={() => go("/forgot-password")} className="text-[11px] font-bold text-[#23645f]">
            Forgot password?
          </button>
        </div>
      )}
      <label className="mt-5 flex items-start gap-2 text-[11px] leading-4 text-[#718189]">
        <input type="checkbox" className="mt-0.5 accent-[#2f9c95]" /> I understand how my wellness data is used with privacy-first controls.
      </label>
      <button
        onClick={() => {
          if (mode === "login") {
            setGlobalRole(role);
            go(`/${role}`);
          } else {
            setSubmitted(true);
          }
        }}
        className="btn btn-teal mt-5 w-full rounded-xl py-3.5 text-[12px] font-bold"
      >
        {submitted
          ? "Request submitted"
          : mode === "login"
          ? "Log in"
          : role === "student"
          ? "Create Student Account"
          : role === "counselor"
          ? "Submit Counselor Registration"
          : "Request Administrator Access"}
      </button>
      {submitted && (
        <div className="mt-3 rounded-xl bg-[#edf7f4] p-3 text-[11px] leading-4 text-[#23645f]">
          {role === "counselor"
            ? "Your counselor account is awaiting institutional verification."
            : role === "admin"
            ? "Your administrator account will be available after verification."
            : "Your wellness information is private. Administrators only receive aggregate, anonymized insights."}
        </div>
      )}
      <div className="my-5 flex items-center gap-3 text-[10px] font-bold text-[#a0abad]">
        <span className="h-px flex-1 bg-[#e2e9e6]" />OR<span className="h-px flex-1 bg-[#e2e9e6]" />
      </div>
      <button onClick={() => toast.info("Institutional SSO sign-in is available in campus edition")} className="w-full rounded-xl border border-[#dfe6e3] bg-white py-3 text-[12px] font-bold text-[#536973]">
        Continue with Campus SSO
      </button>
      <div className="mt-5 text-center text-[11px] text-[#819097]">
        {mode === "login" ? "Don’t have an account?" : "Already have an account?"}{" "}
        <button onClick={() => go(mode === "login" ? "/signup" : "/login")} className="font-bold text-[#23645f]">
          {mode === "login" ? "Create an account" : "Log in"}
        </button>
      </div>
      <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-[#8b999d]">
        <LockKeyhole size={12} /> Your wellbeing data is protected with privacy-first controls.
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

  const handleLogout = () => {
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
  const { scheduleAppointment } = usePortal();
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState<"In-person" | "Video" | "Phone">("In-person");
  const [reason, setReason] = useState("Academic stress");
  const [time, setTime] = useState("Tomorrow · 3:00 PM");
  const selected = "border-[#2f9c95] bg-[#edf7f4] text-[#23645f]";
  const idle = "border-[#dce6e2] bg-white text-[#536973] hover:border-[#7cc0b7]";

  const handleBook = () => {
    scheduleAppointment({
      studentId: "STU-2048",
      counselorName: "Dr. Priya Sharma",
      date: time.includes("Tomorrow") ? "Tomorrow" : "Today",
      time: time.split("·")[1]?.trim() || "3:00 PM",
      mode,
      topic: reason,
      durationMinutes: 45,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#18314a]/30 p-0 backdrop-blur-sm md:items-center md:p-5">
        <div className="w-full max-w-[540px] rounded-t-[26px] bg-white p-7 text-center shadow-[0_30px_100px_rgba(24,49,74,.25)] md:rounded-[26px]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e5f3f1] text-[#2f9c95]">
            <Check size={28} />
          </div>
          <div className="mt-5 text-[22px] font-extrabold tracking-[-.04em]">Session scheduled</div>
          <p className="mx-auto mt-2 max-w-[300px] text-[13px] leading-5 text-[#718189]">
            Your session with Dr. Priya Sharma is set for tomorrow at 3:00 PM.
          </p>
          <div className="mt-5 rounded-2xl bg-[#f4f8f6] p-4 text-left text-[12px]">
            <div className="flex justify-between py-1"><span className="text-[#8a989d]">Mode</span><b>{mode}</b></div>
            <div className="flex justify-between py-1"><span className="text-[#8a989d]">Topic</span><b>{reason}</b></div>
            <div className="flex justify-between py-1"><span className="text-[#8a989d]">Status</span><b className="text-[#23645f]">Confirmed</b></div>
          </div>
          <button onClick={close} className="btn btn-primary mt-5 w-full rounded-xl py-3 text-[12px] font-bold">
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
            <p className="mt-2 text-[12px] text-[#718189]">Choose how you’d like to connect with a counselor.</p>
          </div>
          <button onClick={close} aria-label="Close session request" className="rounded-lg p-1 text-[#9aa6aa] hover:bg-[#f1f5f3]">
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2">
          {[
            ["Chat", MessageCircle, "Phone"],
            ["Phone", Phone, "Phone"],
            ["In-person", Users, "In-person"]
          ].map(([x, Icon, modeType]: any) => (
            <button
              type="button"
              aria-pressed={mode === (x === "Chat" ? "Video" : modeType)}
              onClick={() => setMode(x === "Chat" ? "Video" : modeType)}
              key={x}
              className={`rounded-xl border p-3 text-left transition ${mode === (x === "Chat" ? "Video" : modeType) ? selected : idle}`}
            >
              <Icon size={16} className={mode === (x === "Chat" ? "Video" : modeType) ? "text-[#2f9c95]" : "text-[#6f858d]"} />
              <div className="mt-2 text-[11px] font-bold">{x}</div>
              {mode === (x === "Chat" ? "Video" : modeType) && <Check size={13} className="mt-2 text-[#2f9c95]" />}
            </button>
          ))}
        </div>
        <div className="mt-5 field-label">What would you like support with?</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {["Academic stress", "Anxiety / worry", "Sleep", "Relationships", "General wellbeing"].map((x) => (
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
        <div className="mt-5 field-label">Preferred time</div>
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
          Schedule session <ArrowUpRight size={15} />
        </button>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[#8b999d]">
          <LockKeyhole size={12} /> Your request is private
        </div>
      </div>
    </div>
  );
}

function RangeToggle() {
  const [range, setRange] = useState("7 days");
  return (
    <div className="flex gap-1 rounded-lg bg-[#f1f5f3] p-1">
      {["7 days", "30 days"].map((x) => (
        <button
          type="button"
          aria-pressed={range === x}
          onClick={() => {
            setRange(x);
            toast.info(`${x} wellness view selected`);
          }}
          key={x}
          className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold transition ${
            range === x ? "bg-white text-[#23645f] shadow-sm" : "text-[#8b999d] hover:text-[#23645f]"
          }`}
        >
          {x}
        </button>
      ))}
    </div>
  );
}
