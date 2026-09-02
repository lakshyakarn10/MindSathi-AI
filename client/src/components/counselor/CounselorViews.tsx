import React, { useState, useEffect, useRef } from "react";
import {
  Activity, AlertTriangle, ArrowUpRight, Bell, BookOpen, Brain, Calendar, CalendarDays, Check,
  ChevronRight, CircleAlert, CircleHelp, Clock, Clock3, Eye, FileText, Filter, Flame, Heart,
  HelpCircle, Info, Link as LinkIcon, LockKeyhole, Mail, MapPin, MessageCircle, MessageSquare, MoreHorizontal, Phone,
  Plus, RefreshCw, Search, Send, ShieldAlert, ShieldCheck, Sparkles, Stethoscope, User,
  UserCheck, UserRound, Users, Video, Wind, X, Zap, Wifi, WifiOff, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { StudentCase, Appointment, usePortal } from "../../contexts/PortalContext";
import { counselorApi, messagesApi } from "../../services/api";
import { useChatWebSocket } from "../../hooks/useChatWebSocket";
import FormattedText from "../FormattedText";

export function RiskBadge({ risk, score }: { risk: "HIGH" | "MEDIUM" | "LOW"; score?: number }) {
  if (risk === "HIGH") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fae9e7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] text-[#a94e4a]">
        <ShieldAlert size={12} className="shrink-0 text-[#c96862]" />
        Priority support {score ? `· ${score}` : ""}
      </span>
    );
  }
  if (risk === "MEDIUM") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fcf0e2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] text-[#9a602a]">
        <AlertTriangle size={12} className="shrink-0 text-[#d28b47]" />
        Needs attention {score ? `· ${score}` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f3f0] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] text-[#23645f]">
      <ShieldCheck size={12} className="shrink-0 text-[#2f9c95]" />
      Monitoring {score ? `· ${score}` : ""}
    </span>
  );
}

export function StatusBadge({ status }: { status: StudentCase["status"] }) {
  const map: Record<string, string> = {
    New: "bg-[#fae9e7] text-[#a94e4a] border-[#f2ccc9]",
    "Under Review": "bg-[#fff7e6] text-[#b36b00] border-[#fce3b8]",
    Contacted: "bg-[#e8f1fd] text-[#1d5ca8] border-[#c8ddf7]",
    "Session Scheduled": "bg-[#eeeaf8] text-[#6d4c8b] border-[#d8cce8]",
    Monitoring: "bg-[#e6f3f0] text-[#23645f] border-[#c5e4dc]",
    Resolved: "bg-[#edf1ef] text-[#556972] border-[#d5deda]",
  };
  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-bold ${map[status] || "bg-[#edf1ef] text-[#556972]"}`}>
      {status}
    </span>
  );
}

// 1. Counselor Overview Dashboard
export function CounselorOverview({ onNavigate, onSelectCase }: { onNavigate: (tab: string) => void; onSelectCase: (c: StudentCase) => void }) {
  const { cases, appointments } = usePortal();
  const [filterRisk, setFilterRisk] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const highCount = cases.filter((c) => c.risk === "HIGH").length;
  const mediumCount = cases.filter((c) => c.risk === "MEDIUM").length;
  const monitoringCount = cases.filter((c) => c.status === "Monitoring" || c.risk === "LOW").length;
  const pendingAptsCount = appointments.filter((a) => a.status === "Pending").length;
  const followupsToday = appointments.filter((a) => (a.date === "Today" || a.date.includes("Today")) && (a.status === "Scheduled" || a.status === "Confirmed")).length;

  const filteredCases = cases.filter((c) => {
    const matchesRisk =
      filterRisk === "All" ||
      (filterRisk === "High Risk" && c.risk === "HIGH") ||
      (filterRisk === "Medium Risk" && c.risk === "MEDIUM") ||
      (filterRisk === "Low Risk" && c.risk === "LOW") ||
      (filterRisk === "New" && c.status === "New") ||
      (filterRisk === "Monitoring" && c.status === "Monitoring") ||
      (filterRisk === "Resolved" && c.status === "Resolved");

    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.primarySignal.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRisk && matchesSearch;
  });

  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      {/* Top Welcome Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="field-label mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2f9c95]" /> Counselor Workspace · Student Safety & Care
          </div>
          <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a] md:text-[32px]">
            Good morning, Dr. Sharma<span className="text-[#2f9c95]">.</span>
          </h1>
          <p className="mt-1.5 text-[14px] text-[#718189]">
            Here's an overview of student wellbeing requiring your attention.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate("Appointments")}
            className="flex items-center gap-2 rounded-xl border border-[#dce6e2] bg-white px-3.5 py-2.5 text-[12px] font-bold text-[#536b75] hover:border-[#2f9c95] transition"
          >
            <CalendarDays size={15} className="text-[#2f9c95]" />
            Appointments {pendingAptsCount > 0 ? `(${pendingAptsCount} Pending)` : `(${followupsToday} Today)`}
          </button>
          <button
            onClick={() => onNavigate("Student Cases")}
            className="btn btn-teal flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-bold"
          >
            <Users size={15} /> Student Cases ({highCount} High Risk)
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card signal-line coral p-5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[.1em] text-[#809098]">
            <span>High Priority</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fae9e7] text-[#c96862]">
              <ShieldAlert size={15} />
            </span>
          </div>
          <div className="mt-3 text-[32px] font-extrabold tracking-[-.05em] text-[#18314a]">{highCount}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#b75b55]">
            <span>Active escalations</span> · Immediate review recommended
          </div>
        </div>

        <div className="card signal-line amber p-5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[.1em] text-[#809098]">
            <span>Needs Attention</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fcf0e2] text-[#d28b47]">
              <AlertTriangle size={15} />
            </span>
          </div>
          <div className="mt-3 text-[32px] font-extrabold tracking-[-.05em] text-[#18314a]">{mediumCount}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#8b6138]">
            <span>Moderate signals</span> · Longitudinal monitoring
          </div>
        </div>

        <div className="card signal-line p-5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[.1em] text-[#809098]">
            <span>Monitoring</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e6f3f0] text-[#2f9c95]">
              <Activity size={15} />
            </span>
          </div>
          <div className="mt-3 text-[32px] font-extrabold tracking-[-.05em] text-[#18314a]">{monitoringCount}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#23645f]">
            <span>Active check-ins</span> · Following self-guided plans
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[.1em] text-[#809098]">
            <span>Pending Requests</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f4f7] text-[#506c7d]">
              <Clock3 size={15} />
            </span>
          </div>
          <div className="mt-3 text-[32px] font-extrabold tracking-[-.05em] text-[#18314a]">{pendingAptsCount}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#667e8c]">
            <span>Awaiting counselor response</span>
          </div>
        </div>
      </div>

      {/* Priority Queue Section */}
      <section className="card mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#edf1ef] pb-5">
          <div>
            <div className="field-label">Priority Queue</div>
            <h2 className="mt-1 text-[19px] font-bold text-[#18314a]">Cases Needing a Human Look</h2>
            <p className="mt-0.5 text-[12px] text-[#718189]">
              Ranked by risk indicators across check-ins, journal sentiments, and trends.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b999d]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anonymous student ID..."
                className="w-56 rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] py-2 pl-8 pr-3 text-[12px] outline-none focus:border-[#2f9c95]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1 rounded-xl bg-[#f1f5f3] p-1 text-[11px]">
              {["All", "High Risk", "Medium Risk", "Low Risk", "New", "Monitoring", "Resolved"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterRisk(f)}
                  className={`rounded-lg px-2.5 py-1 font-bold transition ${
                    filterRisk === f ? "bg-white text-[#23645f] shadow-xs" : "text-[#7b8c92] hover:text-[#23645f]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-[#edf1ef] text-[10px] font-bold uppercase tracking-[.1em] text-[#8a989d]">
                <th className="py-3 px-3">Anonymous ID</th>
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-3">Trend</th>
                <th className="py-3 px-3">Last Check-in</th>
                <th className="py-3 px-3">Primary Signal</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f6f4]">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#829298]">
                    No cases match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-[#f8faf9] transition">
                    <td className="py-3.5 px-3 font-extrabold text-[#18314a]">
                      <span className="font-mono text-[13px]">{c.id}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <RiskBadge risk={c.risk} score={c.score} />
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          c.trend === "Declining"
                            ? "text-[#b45b53]"
                            : c.trend === "Stable"
                            ? "text-[#877148]"
                            : "text-[#2f9c95]"
                        }`}
                      >
                        {c.trendDirection === "down" ? "↓" : c.trendDirection === "up" ? "↑" : "→"} {c.trend}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[#70828a]">{c.lastCheckIn}</td>
                    <td className="py-3.5 px-3 font-medium text-[#465b64] max-w-[220px] truncate">{c.primarySignal}</td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => {
                          onSelectCase(c);
                          onNavigate("CasesDetail");
                        }}
                        className="btn btn-teal rounded-lg px-3 py-1.5 text-[11px] font-bold"
                      >
                        Review Wellness Report →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

// 2. High-Risk Cases Page
export function CounselorCasesPage({
  onSelectCase,
  onNavigate,
  initialFilter = "All"
}: {
  onSelectCase: (c: StudentCase) => void;
  onNavigate: (tab: string) => void;
  initialFilter?: string;
}) {
  const { cases } = usePortal();
  const [filter, setFilter] = useState(initialFilter);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const newCases = cases.filter((c) => c.status === "New").length;
  const underReview = cases.filter((c) => c.status === "Under Review").length;
  const contacted = cases.filter((c) => c.status === "Contacted" || c.status === "Session Scheduled").length;
  const resolved = cases.filter((c) => c.status === "Resolved").length;

  const displayCases = cases.filter((c) => {
    if (filter === "New") return c.status === "New";
    if (filter === "Under Review") return c.status === "Under Review";
    if (filter === "Contacted") return c.status === "Contacted" || c.status === "Session Scheduled";
    if (filter === "Resolved") return c.status === "Resolved";
    if (filter === "High Risk Only") return c.risk === "HIGH";
    return true;
  });

  const isHighRiskView = filter === "High Risk Only" || initialFilter === "High Risk Only";

  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      <div className="mb-7">
        <div className="field-label mb-2">Campus Student Directory</div>
        <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a] md:text-[32px]">
          Student Cases & Wellbeing Roster
        </h1>
        <p className="mt-1.5 text-[14px] text-[#718189]">
          Review observational summaries, filter by risk level or case status, and initiate confidential clinical support.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="field-label">New Cases</div>
          <div className="mt-2 text-[30px] font-extrabold text-[#c96862]">{newCases}</div>
          <div className="mt-1 text-[11px] text-[#71828a]">Requires first review</div>
        </div>
        <div className="card p-5">
          <div className="field-label">Under Review</div>
          <div className="mt-2 text-[30px] font-extrabold text-[#d28b47]">{underReview}</div>
          <div className="mt-1 text-[11px] text-[#71828a]">Assigned to counselor</div>
        </div>
        <div className="card p-5">
          <div className="field-label">Contacted / Scheduled</div>
          <div className="mt-2 text-[30px] font-extrabold text-[#2f9c95]">{contacted}</div>
          <div className="mt-1 text-[11px] text-[#71828a]">Support in progress</div>
        </div>
        <div className="card p-5">
          <div className="field-label">Resolved</div>
          <div className="mt-2 text-[30px] font-extrabold text-[#556972]">{resolved}</div>
          <div className="mt-1 text-[11px] text-[#71828a]">Stabilized baseline</div>
        </div>
      </div>

      {/* Cases List */}
      <section className="card mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#edf1ef] pb-4">
          <h2 className="text-[18px] font-bold text-[#18314a]">Case Directory ({displayCases.length})</h2>
          <div className="flex flex-wrap gap-1.5 rounded-xl bg-[#f1f5f3] p-1 text-[11px]">
            {["All", "High Risk Only", "New", "Under Review", "Contacted", "Resolved"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-lg px-3 py-1 font-bold transition ${
                  filter === tab ? "bg-white text-[#23645f] shadow-xs" : "text-[#7b8c92] hover:text-[#23645f]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayCases.map((c) => (
            <div
              key={c.id}
              className={`card-hover card flex flex-col justify-between p-5 ${
                c.risk === "HIGH" ? "signal-line coral" : c.risk === "MEDIUM" ? "signal-line amber" : "signal-line"
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[16px] font-extrabold text-[#18314a]">{c.id}</span>
                    <div className="mt-0.5 text-[11px] text-[#7a8c92]">Detected: {c.detectedTime}</div>
                  </div>
                  <RiskBadge risk={c.risk} score={c.score} />
                </div>

                <div className="mt-4 rounded-xl bg-[#f8faf9] p-3 text-[12px]">
                  <div className="field-label !text-[9px]">Primary Risk Signal</div>
                  <div className="mt-1 font-semibold text-[#18314a] leading-snug">{c.primarySignal}</div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-[#657881]">
                  <span>Trend: <b className={c.trend === "Declining" ? "text-[#b45b53]" : "text-[#23645f]"}>{c.trend}</b></span>
                  <span>Status: <StatusBadge status={c.status} /></span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#edf1ef] pt-3">
                <span className="text-[11px] text-[#8a989d]">Assigned: {c.assignedCounselor}</span>
                <button
                  onClick={() => {
                    onSelectCase(c);
                    onNavigate("CasesDetail");
                  }}
                  className="btn btn-teal rounded-lg px-3.5 py-1.5 text-[11px] font-bold"
                >
                  Review Case →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

// 3. Case Detail Screen — COUNSELOR WELLNESS REPORT
export function CaseDetailView({
  c,
  onBack,
  onNavigate,
}: {
  c: StudentCase;
  onBack: () => void;
  onNavigate: (tab: string) => void;
}) {
  const { updateCaseStatus, scheduleAppointment, sendMessage } = usePortal();
  const [report, setReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [sessionTopic, setSessionTopic] = useState("Academic stress & Midterm support");
  const [sessionMode, setSessionMode] = useState<"In-person" | "Video" | "Phone" | "Chat">("Video");
  const [sessionTime, setSessionTime] = useState("Tomorrow · 3:00 PM");
  const [sessionDuration, setSessionDuration] = useState(45);

  // Load real Counselor Wellness Report from backend endpoint
  useEffect(() => {
    setLoadingReport(true);
    const caseIdentifier = c.case_id || c.id;
    counselorApi.getCaseReport(caseIdentifier)
      .then((res) => {
        if (res.data) setReport(res.data);
      })
      .catch(() => {
        // Keep fallback data if endpoint not reachable
      })
      .finally(() => setLoadingReport(false));
  }, [c.case_id, c.id]);

  const handleContactSubmit = (type: string, messageText: string) => {
    sendMessage(c.id, messageText || `Hello ${c.id}, this is Dr. Priya Sharma from Campus Support. I am reaching out to see how we can assist you.`);
    setContactModalOpen(false);
    toast.success(`Contact outreach sent via ${type} to ${c.id}`);
  };

  const handleScheduleSubmit = async () => {
    try {
      await scheduleAppointment({
        studentId: c.id,
        counselorName: "Dr. Priya Sharma",
        date: sessionTime.includes("Tomorrow") ? "Tomorrow" : "Today",
        time: sessionTime.split("·")[1]?.trim() || "3:00 PM",
        mode: sessionMode,
        topic: sessionTopic,
        durationMinutes: sessionDuration,
      });
      setScheduleModalOpen(false);
    } catch {}
  };

  const displayRef = report?.student_reference || c.id;
  const riskInfo = report?.risk || {
    wellness_score: c.score,
    risk_indicator: (c.score / 10).toFixed(1),
    risk_level: c.risk,
    previous_risk_indicator: null,
    risk_change: null,
    trend: c.trend.toUpperCase(),
    sudden_change: false,
  };

  const riskFactors = report?.risk_factors || c.riskFactors.map((rf) => ({
    label: rf.label,
    contribution: rf.points,
  }));

  const behavioralChanges = report?.behavioral_changes || [
    { metric: "mood", label: "Mood", baseline: 7.2, current: 4.5, delta: -2.7, direction: "declining", severity: "moderate", concerning: true },
    { metric: "stress", label: "Stress", baseline: 4.8, current: 7.9, delta: 3.1, direction: "increasing", severity: "significant", concerning: true },
    { metric: "sleep", label: "Sleep", baseline: 7.1, current: 4.8, delta: -2.3, direction: "declining", severity: "moderate", concerning: true },
  ];

  const conversationThemes = report?.conversation_themes || [
    "Academic pressure", "Placement concerns", "Sleep disruption"
  ];

  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      {/* Back Button & Case Header */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-[12px] font-bold text-[#23645f] hover:underline cursor-pointer"
      >
        ← Back to Case Queue
      </button>

      <div className="card p-6 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#edf1ef] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-[28px] font-extrabold tracking-tight text-[#18314a] md:text-[34px]">
                {displayRef}
              </h1>
              <RiskBadge risk={(riskInfo.risk_level === "CRITICAL" || riskInfo.risk_level === "HIGH" ? "HIGH" : riskInfo.risk_level === "MODERATE" ? "MEDIUM" : "LOW")} score={riskInfo.wellness_score} />
              <StatusBadge status={c.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-[12px] text-[#6d7e86]">
              <span>Risk Indicator: <strong className="text-[#18314a]">{riskInfo.risk_indicator} / 10</strong></span>
              <span>Wellness Score: <strong className="text-[#18314a]">{riskInfo.wellness_score} / 100</strong></span>
              {riskInfo.previous_risk_indicator !== null && riskInfo.previous_risk_indicator !== undefined && (
                <span>Previous: <strong>{riskInfo.previous_risk_indicator}</strong></span>
              )}
              {riskInfo.risk_change !== null && riskInfo.risk_change !== undefined && (
                <span>Change: <strong className={riskInfo.risk_change > 0 ? "text-[#b45b53]" : "text-[#23645f]"}>{riskInfo.risk_change > 0 ? `+${riskInfo.risk_change}` : riskInfo.risk_change}</strong></span>
              )}
              <span>Trend: <strong className={riskInfo.trend === "DECLINING" ? "text-[#b45b53]" : "text-[#23645f]"}>{riskInfo.trend}</strong></span>
              {riskInfo.sudden_change && (
                <span className="rounded-md bg-[#fae9e7] px-2 py-0.5 text-[10px] font-bold text-[#c96862]">⚡ Sudden Shift</span>
              )}
            </div>
          </div>

          {/* Counselor Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setContactModalOpen(true)}
              className="btn btn-teal flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[12px] font-bold"
            >
              <MessageSquare size={15} /> Contact Student
            </button>
            <button
              onClick={() => setScheduleModalOpen(true)}
              className="btn btn-primary flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[12px] font-bold"
            >
              <CalendarDays size={15} /> Schedule Session
            </button>
            <button
              onClick={() => {
                updateCaseStatus(c.case_id || c.id, "Monitoring", "Counselor initiated monitoring protocol");
              }}
              className="rounded-xl border border-[#dfe6e3] bg-white px-3 py-2.5 text-[12px] font-bold text-[#556b73] hover:border-[#2f9c95]"
            >
              Mark as Monitoring
            </button>
            <button
              onClick={() => {
                updateCaseStatus(c.case_id || c.id, "Resolved", "Case resolved following student stabilization");
              }}
              className="rounded-xl border border-[#d2ded8] bg-[#f2f7f5] px-3 py-2.5 text-[12px] font-bold text-[#23645f] hover:bg-[#e6f3f0]"
            >
              Resolve Case
            </button>
          </div>
        </div>

        {/* Safety Alert (if critical) */}
        {report?.safety?.safety_indicator_detected && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#f5c2c7] bg-[#fff5f5] p-4 text-[12px] text-[#842029]">
            <AlertTriangle size={18} className="shrink-0 text-[#dc3545]" />
            <div>
              <span className="font-bold">Elevated Concern Flag:</span> {report.safety.action}
            </div>
          </div>
        )}

        {/* Privacy Notice Banner */}
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#d3e5df] bg-[#edf7f4] p-4 text-[12px] text-[#23645f]">
          <ShieldCheck size={18} className="shrink-0 text-[#2f9c95]" />
          <div>
            <span className="font-bold">Observational Report Disclaimer:</span> {report?.disclaimer || "AI-generated observational summary for counselor reference only. Not a medical diagnosis. Raw personal conversations remain strictly protected."}
          </div>
        </div>

        {/* 2 Column Grid: Risk Factors & Behavioral Changes */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Risk Factors */}
          <section className="rounded-2xl border border-[#e4eae6] bg-[#fbfdfc] p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="field-label">Risk Decomposition</div>
                <h3 className="mt-1 text-[17px] font-bold text-[#18314a]">Contributing Risk Factors</h3>
              </div>
              <span className="rounded-lg bg-[#fae9e7] px-2 py-1 text-[10px] font-bold text-[#c96862]">
                Multivariate Engine
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {riskFactors.map((rf: any, idx: number) => (
                <div key={idx} className="rounded-xl bg-white p-3 border border-[#edf2ef] shadow-2xs">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-bold text-[#18314a]">{rf.label || rf.factor}</span>
                    <span className="font-mono font-bold text-[#c96862]">+{rf.contribution ?? rf.points ?? 15} pts</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#f1f4f3] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (rf.contribution || 0) > 20 ? "bg-[#c96862]" : (rf.contribution || 0) > 10 ? "bg-[#d28b47]" : "bg-[#2f9c95]"
                      }`}
                      style={{ width: `${Math.min(100, (rf.contribution || 15) * 3.5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Behavioral Shifts Table */}
          <section className="rounded-2xl border border-[#e4eae6] bg-white p-5 md:p-6 flex flex-col justify-between">
            <div>
              <div className="field-label">Longitudinal Shift</div>
              <h3 className="mt-1 text-[17px] font-bold text-[#18314a]">Recent Behavioral Changes</h3>
              <p className="mt-1 text-[12px] text-[#71828a]">Compared against 14-day student baseline.</p>

              <div className="mt-4 space-y-3">
                {behavioralChanges.map((b: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-[#f8faf9] p-3 text-[12px] border border-[#edf1ef]">
                    <div>
                      <span className="font-bold text-[#18314a]">{b.label || b.metric}</span>
                      <div className="text-[11px] text-[#788990]">Baseline: {b.baseline} → Current: <b>{b.current}</b></div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold ${b.concerning ? "bg-[#fae9e7] text-[#c96862]" : "bg-[#e6f3f0] text-[#23645f]"}`}>
                        {b.delta > 0 ? `+${b.delta}` : b.delta} ({b.direction})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Conversation Themes & Observational Summary */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Conversation Themes */}
          <section className="rounded-2xl border border-[#e4eae6] bg-[#fbfdfc] p-5 md:p-6">
            <div className="field-label">AI Extracted Themes</div>
            <h3 className="mt-1 text-[17px] font-bold text-[#18314a]">Recent Conversation Themes</h3>
            <p className="mt-1 text-[12px] text-[#71828a]">Protected thematic tags — raw transcript is not exposed.</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {conversationThemes.map((theme: string, i: number) => (
                <span
                  key={i}
                  className="rounded-xl border border-[#cfe2dc] bg-[#eef7f4] px-3 py-1.5 text-[12px] font-bold text-[#23645f]"
                >
                  ✦ {theme}
                </span>
              ))}
            </div>

            {report?.recommendation && (
              <div className="mt-5 rounded-xl bg-[#fffaf4] border-l-4 border-[#d28b47] p-3.5 text-[12px] leading-5 text-[#865d38]">
                <strong>Recommended Counselor Action:</strong> {report.recommendation}
              </div>
            )}
          </section>

          {/* Observational Summary */}
          <section className="rounded-2xl border border-[#e4eae6] bg-white p-5 md:p-6">
            <div className="field-label">Structured Insights</div>
            <h3 className="mt-1 text-[17px] font-bold text-[#18314a]">Observational Summary</h3>
            <p className="mt-3 text-[13px] leading-6 text-[#455a64] bg-[#fbfdfc] p-4 rounded-xl border border-[#edf1ef]">
              {report?.observational_summary || "Student exhibited elevated academic and examination stress patterns over recent check-ins. Suggest supportive check-in or offering grounding exercise recommendations."}
            </p>
          </section>
        </div>

        {/* Case Escalation History */}
        <section className="mt-6 border-t border-[#edf1ef] pt-5">
          <div className="field-label mb-3">Escalation History & Audit Trail</div>
          <div className="divide-y divide-[#f2f6f4]">
            {(report?.escalation_history || c.history).map((h: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2.5 text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2f9c95]" />
                  <span className="font-semibold text-[#18314a]">{h.action}</span>
                </div>
                <div className="text-[11px] text-[#809098]">
                  {h.actor || "System"} · {h.date || "Today"}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modal 1: Contact Student Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18314a]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-[500px] rounded-[24px] bg-white p-6 shadow-[0_24px_70px_rgba(24,49,74,.22)]">
            <div className="flex items-start justify-between border-b border-[#edf1ef] pb-4">
              <div>
                <div className="field-label">Counselor Outreach</div>
                <h3 className="mt-1 text-[20px] font-extrabold text-[#18314a]">Contact Student {displayRef}</h3>
              </div>
              <button onClick={() => setContactModalOpen(false)} className="rounded-lg p-1 text-[#8b999e] hover:bg-[#f1f5f3]">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4">
              <div className="field-label mb-2">Select Channel</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["In-app supportive message", MessageCircle],
                  ["Institutional notification", Bell],
                  ["Confidential email", Mail],
                  ["Priority follow-up alert", Sparkles],
                ].map(([t, Icon]: any, idx) => (
                  <div
                    key={t}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-[12px] font-bold ${
                      idx === 0 ? "border-[#2f9c95] bg-[#edf7f4] text-[#23645f]" : "border-[#dfe6e3] text-[#556972]"
                    }`}
                  >
                    <Icon size={16} className="text-[#2f9c95]" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <label className="field-label block mb-1">Supportive Message</label>
                <textarea
                  defaultValue={`Hello ${displayRef}, I noticed your recent check-ins indicated a challenging week. I am here if you would like to connect or explore helpful strategies.`}
                  className="w-full min-h-[90px] rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] p-3 text-[12px] leading-5 outline-none focus:border-[#2f9c95]"
                  id="contact-msg-input"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setContactModalOpen(false)}
                  className="rounded-xl border border-[#dfe6e3] px-4 py-2.5 text-[12px] font-bold text-[#647881]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById("contact-msg-input") as HTMLTextAreaElement;
                    handleContactSubmit("In-app message", el?.value || "");
                  }}
                  className="btn btn-teal rounded-xl px-5 py-2.5 text-[12px] font-bold"
                >
                  Send Supportive Outreach
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Schedule Session Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18314a]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-[540px] rounded-[24px] bg-white p-6 shadow-[0_24px_70px_rgba(24,49,74,.22)]">
            <div className="flex items-start justify-between border-b border-[#edf1ef] pb-4">
              <div>
                <div className="field-label">Appointment Scheduling</div>
                <h3 className="mt-1 text-[20px] font-extrabold text-[#18314a]">Schedule Session with {displayRef}</h3>
              </div>
              <button onClick={() => setScheduleModalOpen(false)} className="rounded-lg p-1 text-[#8b999e] hover:bg-[#f1f5f3]">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="field-label block mb-1">Session Mode</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["Video", "In-person", "Chat", "Phone"] as const).map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setSessionMode(mode)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[12px] font-bold transition ${
                        sessionMode === mode ? "border-[#2f9c95] bg-[#edf7f4] text-[#23645f]" : "border-[#dfe6e3] text-[#60737c]"
                      }`}
                    >
                      {mode === "Video" ? <Video size={14} /> : mode === "In-person" ? <Users size={14} /> : mode === "Chat" ? <MessageCircle size={14} /> : <Phone size={14} />}
                      <span>{mode}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label block mb-1">Topic / Support Area</label>
                <input
                  type="text"
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                  className="w-full rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-3.5 py-2.5 text-[12px] outline-none focus:border-[#2f9c95]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label block mb-1">Date & Time</label>
                  <select
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    className="w-full rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-3.5 py-2.5 text-[12px] outline-none focus:border-[#2f9c95]"
                  >
                    <option>Today · 4:00 PM</option>
                    <option>Tomorrow · 10:00 AM</option>
                    <option>Tomorrow · 3:00 PM</option>
                    <option>Wednesday · 2:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="field-label block mb-1">Duration</label>
                  <select
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-3.5 py-2.5 text-[12px] outline-none focus:border-[#2f9c95]"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl bg-[#f5f8f6] p-3 text-[11px] text-[#637982]">
                ✓ Confirms automatically and notifies student.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setScheduleModalOpen(false)}
                  className="rounded-xl border border-[#dfe6e3] px-4 py-2.5 text-[12px] font-bold text-[#647881]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleSubmit}
                  className="btn btn-teal rounded-xl px-5 py-2.5 text-[12px] font-bold"
                >
                  Confirm & Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// 4. Counselor Appointments Screen
export function CounselorAppointments() {
  const { appointments, acceptAppointment, rejectAppointment, suggestTimeAppointment, refreshAppointments } = usePortal();

  useEffect(() => {
    refreshAppointments();
  }, []);

  const pendingList = appointments.filter((a) => a.status === "Pending");
  const todayList = appointments.filter((a) => (a.date === "Today" || (a.date && a.date.includes("Today"))) && (a.status === "Confirmed" || a.status === "Scheduled"));
  const upcomingList = appointments.filter((a) => a.status === "Confirmed" || a.status === "Scheduled");
  const completedList = appointments.filter((a) => a.status === "Completed");
  const rejectedList = appointments.filter((a) => a.status === "Rejected" || a.status === "Cancelled");
  const rescheduledList = appointments.filter((a) => a.status === "Rescheduled");

  const [tab, setTab] = useState<"Pending Requests" | "Today" | "Upcoming" | "Completed" | "Rejected" | "Rescheduled" | "All">(
    pendingList.length > 0 ? "Pending Requests" : todayList.length > 0 ? "Today" : upcomingList.length > 0 ? "Upcoming" : completedList.length > 0 ? "Completed" : "All"
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals for appointment actions
  const [activeModal, setActiveModal] = useState<{ type: "accept" | "reject" | "suggest"; apt: Appointment } | null>(null);
  const [meetUrlInput, setMeetUrlInput] = useState("https://meet.google.com/abc-defg-hij");
  const [locationInput, setLocationInput] = useState("Student Wellness Center, Room 204");
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [suggestDateInput, setSuggestDateInput] = useState("Tomorrow · 4:00 PM");
  const [suggestMessageInput, setSuggestMessageInput] = useState("");

  const getDisplayList = () => {
    switch (tab) {
      case "Pending Requests": return pendingList;
      case "Today": return todayList;
      case "Upcoming": return upcomingList;
      case "Completed": return completedList;
      case "Rejected": return rejectedList;
      case "Rescheduled": return rescheduledList;
      default: return appointments;
    }
  };

  const currentList = getDisplayList();

  const handleConfirmAccept = async () => {
    if (!activeModal) return;
    const { apt } = activeModal;
    await acceptAppointment(apt.id, {
      meetUrl: apt.mode === "Video" ? meetUrlInput : undefined,
      location: apt.mode === "In-person" ? locationInput : undefined,
    });
    setActiveModal(null);
  };

  const handleConfirmReject = async () => {
    if (!activeModal) return;
    await rejectAppointment(activeModal.apt.id, rejectionReasonInput);
    setActiveModal(null);
  };

  const handleConfirmSuggestTime = async () => {
    if (!activeModal) return;
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 1);
    await suggestTimeAppointment(activeModal.apt.id, newDate.toISOString(), suggestMessageInput);
    setActiveModal(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAppointments();
    } finally {
      setIsRefreshing(false);
    }
  };

  const tabsConfig = [
    { label: "Pending Requests", count: pendingList.length },
    { label: "Today", count: todayList.length },
    { label: "Upcoming", count: upcomingList.length },
    { label: "Completed", count: completedList.length },
    { label: "Rejected", count: rejectedList.length },
    { label: "Rescheduled", count: rescheduledList.length },
    { label: "All", count: appointments.length },
  ] as const;

  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="field-label mb-2">Consultation Schedule</div>
          <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a] md:text-[32px]">Counselor Appointments</h1>
          <p className="mt-1.5 text-[14px] text-[#718189]">Accept pending student requests, provide Google Meet links, or manage sessions.</p>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh appointments"
            className="flex items-center gap-1.5 rounded-xl border border-[#dfe6e3] bg-white px-3 py-1.5 text-[11px] font-bold text-[#657881] hover:border-[#2f9c95] disabled:opacity-50 transition"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>
          {tabsConfig.map(({ label: t, count }) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition ${
                tab === t ? "bg-[#18314a] text-white" : "border border-[#dfe6e3] bg-white text-[#657881] hover:border-[#2f9c95]"
              }`}
            >
              {t} {count > 0 ? `(${count})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {currentList.length === 0 ? (
          <div className="col-span-full card p-8 text-center text-[#788a91]">
            <CalendarDays size={32} className="mx-auto mb-2 text-[#9bb3ab]" />
            <div className="font-bold text-[14px] text-[#18314a]">No appointments in "{tab}"</div>
            <p className="mt-1 text-[12px]">When students request or complete sessions, they will appear here.</p>
          </div>
        ) : (
          currentList.map((a) => (
            <div key={a.id} className="card-hover card flex flex-col justify-between p-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[14px] font-extrabold text-[#18314a]">{a.studentId}</span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      a.status === "Confirmed" || a.status === "Scheduled"
                        ? "bg-[#e6f3f0] text-[#23645f]"
                        : a.status === "Pending"
                        ? "bg-[#fcf0e2] text-[#9a602a]"
                        : a.status === "Rejected"
                        ? "bg-[#fae9e7] text-[#a94e4a]"
                        : "bg-[#f3f6f5] text-[#556b73]"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>

                <div className="mt-3 text-[14px] font-bold text-[#18314a]">{a.topic}</div>

                <div className="mt-4 flex flex-col gap-2 rounded-xl bg-[#f8faf9] p-3 text-[11px] text-[#657881]">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-[#2f9c95]" />
                    <span>{a.date} · {a.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.mode === "Video" ? <Video size={13} className="text-[#2f9c95]" /> : a.mode === "Chat" ? <MessageCircle size={13} className="text-[#2f9c95]" /> : a.mode === "Phone" ? <Phone size={13} className="text-[#2f9c95]" /> : <Users size={13} className="text-[#2f9c95]" />}
                    <span>{a.mode} ({a.durationMinutes} mins)</span>
                  </div>
                  {a.meetUrl && (
                    <div className="flex items-center gap-1.5 text-[#23645f] truncate font-medium">
                      <LinkIcon size={12} /> <a href={a.meetUrl} target="_blank" rel="noreferrer" className="underline truncate">{a.meetUrl}</a>
                    </div>
                  )}
                  {a.location && (
                    <div className="flex items-center gap-1.5 text-[#23645f] font-medium">
                      <MapPin size={12} /> <span>{a.location}</span>
                    </div>
                  )}
                  {a.rejectionReason && (
                    <div className="text-[#a94e4a] italic">Reason: {a.rejectionReason}</div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#edf1ef] pt-3">
                {a.status === "Pending" ? (
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={() => setActiveModal({ type: "accept", apt: a })}
                      className="btn btn-teal flex-1 rounded-lg py-1.5 text-[11px] font-bold"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => setActiveModal({ type: "suggest", apt: a })}
                      className="rounded-lg border border-[#dfe6e3] px-2 py-1.5 text-[11px] font-bold text-[#556b73] hover:border-[#2f9c95]"
                    >
                      Suggest Time
                    </button>
                    <button
                      onClick={() => setActiveModal({ type: "reject", apt: a })}
                      className="rounded-lg border border-[#f2ccc9] bg-[#fff5f5] px-2 py-1.5 text-[11px] font-bold text-[#a94e4a]"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-[11px] text-[#86979c]">{a.counselorName}</span>
                    {a.mode === "Video" ? (
                      <a
                        href={a.meetUrl || "https://meet.google.com/abc-defg-hij"}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-teal rounded-lg px-3.5 py-1.5 text-[11px] font-bold inline-flex items-center gap-1.5 shadow-xs"
                      >
                        Join Meet <ArrowUpRight size={13} />
                      </a>
                    ) : a.mode === "In-person" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#edf6f4] px-3 py-1.5 text-[11px] font-bold text-[#23645f] border border-[#c5e4dc]">
                        <MapPin size={13} className="text-[#2f9c95]" /> {a.location || "Wellness Center Rm 204"}
                      </span>
                    ) : a.mode === "Chat" ? (
                      <button
                        onClick={() => toast.info(`Opening live chat with ${a.studentId}`)}
                        className="btn btn-teal rounded-lg px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1"
                      >
                        <MessageCircle size={13} /> Open Live Chat
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#edf0f2] px-3 py-1.5 text-[11px] font-bold text-[#50616d]">
                        Phone Consultation
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Accept Appointment Modal */}
      {activeModal?.type === "accept" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18314a]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-[500px] rounded-[24px] bg-white p-6 shadow-[0_24px_70px_rgba(24,49,74,.22)]">
            <div className="flex items-start justify-between border-b border-[#edf1ef] pb-4">
              <div>
                <div className="field-label text-[#23645f]">Confirm Session Booking</div>
                <h3 className="mt-1 text-[20px] font-extrabold text-[#18314a]">Accept Request from {activeModal.apt.studentId}</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="rounded-lg p-1 text-[#8b999e] hover:bg-[#f1f5f3]">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-[#f8faf9] p-3 text-[12px] text-[#556b73]">
                <div><strong>Topic:</strong> {activeModal.apt.topic}</div>
                <div><strong>Mode:</strong> {activeModal.apt.mode}</div>
                <div><strong>Date & Time:</strong> {activeModal.apt.date} · {activeModal.apt.time}</div>
              </div>

              {activeModal.apt.mode === "Video" && (
                <div>
                  <label className="field-label block mb-1">Google Meet URL *</label>
                  <input
                    type="url"
                    value={meetUrlInput}
                    onChange={(e) => setMeetUrlInput(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[12px] outline-none focus:border-[#2f9c95]"
                  />
                  <p className="mt-1 text-[10px] text-[#86979c]">Enter the HTTPS Google Meet URL for this video session.</p>
                </div>
              )}

              {activeModal.apt.mode === "In-person" && (
                <div>
                  <label className="field-label block mb-1">In-Person Meeting Location *</label>
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="e.g. Student Wellness Center Room 204"
                    className="w-full rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[12px] outline-none focus:border-[#2f9c95]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edf1ef]">
                <button onClick={() => setActiveModal(null)} className="rounded-xl border border-[#dfe6e3] px-4 py-2 text-[12px] font-bold text-[#647881]">
                  Cancel
                </button>
                <button onClick={handleConfirmAccept} className="btn btn-teal rounded-xl px-5 py-2 text-[12px] font-bold">
                  Confirm & Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Appointment Modal */}
      {activeModal?.type === "reject" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18314a]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-[480px] rounded-[24px] bg-white p-6 shadow-[0_24px_70px_rgba(24,49,74,.22)]">
            <div className="flex items-start justify-between border-b border-[#edf1ef] pb-4">
              <div>
                <div className="field-label text-[#a94e4a]">Appointment Request</div>
                <h3 className="mt-1 text-[20px] font-extrabold text-[#18314a]">Reject Request</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="rounded-lg p-1 text-[#8b999e] hover:bg-[#f1f5f3]">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="field-label block mb-1">Rejection Reason (Optional)</label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g., Scheduling conflict during requested hours. Please feel free to request alternative time slot."
                className="w-full min-h-[90px] rounded-xl border border-[#dfe6e3] bg-white p-3 text-[12px] outline-none focus:border-[#2f9c95]"
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edf1ef]">
                <button onClick={() => setActiveModal(null)} className="rounded-xl border border-[#dfe6e3] px-4 py-2 text-[12px] font-bold text-[#647881]">
                  Cancel
                </button>
                <button onClick={handleConfirmReject} className="rounded-xl bg-[#c96862] text-white px-5 py-2 text-[12px] font-bold hover:bg-[#a94e4a]">
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggest Time Modal */}
      {activeModal?.type === "suggest" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18314a]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-[480px] rounded-[24px] bg-white p-6 shadow-[0_24px_70px_rgba(24,49,74,.22)]">
            <div className="flex items-start justify-between border-b border-[#edf1ef] pb-4">
              <div>
                <div className="field-label text-[#23645f]">Alternative Timeslot</div>
                <h3 className="mt-1 text-[20px] font-extrabold text-[#18314a]">Suggest Alternative Time</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="rounded-lg p-1 text-[#8b999e] hover:bg-[#f1f5f3]">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="field-label block mb-1">Proposed Date & Time</label>
                <input
                  type="text"
                  value={suggestDateInput}
                  onChange={(e) => setSuggestDateInput(e.target.value)}
                  className="w-full rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[12px] outline-none focus:border-[#2f9c95]"
                />
              </div>

              <div>
                <label className="field-label block mb-1">Message to Student (Optional)</label>
                <textarea
                  value={suggestMessageInput}
                  onChange={(e) => setSuggestMessageInput(e.target.value)}
                  placeholder="I am available tomorrow at 4:00 PM if this works for you."
                  className="w-full min-h-[80px] rounded-xl border border-[#dfe6e3] bg-white p-3 text-[12px] outline-none focus:border-[#2f9c95]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edf1ef]">
                <button onClick={() => setActiveModal(null)} className="rounded-xl border border-[#dfe6e3] px-4 py-2 text-[12px] font-bold text-[#647881]">
                  Cancel
                </button>
                <button onClick={handleConfirmSuggestTime} className="btn btn-teal rounded-xl px-5 py-2 text-[12px] font-bold">
                  Send Proposal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// 5. Counselor Session History & Summary Screen
export function CounselorSessionsHistory() {
  const { appointments, completeAppointment } = usePortal();
  const [selectedAptId, setSelectedAptId] = useState<string>("");
  const [discussionAreas, setDiscussionAreas] = useState("Academic workload, exam preparation timeline, sleep routine disruptions.");
  const [recommendations, setRecommendations] = useState("Continue daily check-ins, practice box breathing 2x daily, review in 1 week.");
  const [followUpDate, setFollowUpDate] = useState("2026-09-10");

  const completedList = appointments.filter((a) => a.status === "Completed");

  useEffect(() => {
    if (!selectedAptId && appointments.length > 0) {
      setSelectedAptId(appointments[0].id);
    }
  }, [appointments, selectedAptId]);

  const handleSelectApt = (apt: Appointment) => {
    setSelectedAptId(apt.id);
    if (apt.summaryNotes) {
      setDiscussionAreas(apt.summaryNotes.discussionAreas || "");
      setRecommendations(apt.summaryNotes.recommendations || "");
      setFollowUpDate(apt.summaryNotes.followUpDate || "2026-09-10");
    }
  };

  const handleSaveSummary = () => {
    const targetId = selectedAptId || (appointments[0] ? appointments[0].id : "");
    if (!targetId) {
      toast.error("Please select an appointment to record session summary.");
      return;
    }

    completeAppointment(targetId, {
      discussionAreas,
      recommendations,
      followUpRequired: true,
      followUpDate,
    });
  };

  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      <div className="mb-7">
        <div className="field-label mb-2">Clinical Support Logs</div>
        <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a] md:text-[32px]">Session History & Summaries</h1>
        <p className="mt-1.5 text-[14px] text-[#718189]">Review completed consultations and structured follow-up summaries.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
        <section className="card p-6">
          <h2 className="text-[18px] font-bold mb-4">Completed Consultations ({completedList.length})</h2>
          <div className="flex flex-col gap-4">
            {completedList.length === 0 ? (
              <div className="py-8 text-center text-[#829298] bg-[#f8faf9] rounded-2xl border border-[#edf1ef]">
                No completed session records logged yet. Select an appointment on the right to log notes.
              </div>
            ) : (
              completedList.map((a) => (
                <div key={a.id} className="rounded-2xl border border-[#e2eae6] bg-[#fbfdfc] p-4 flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[14px] font-extrabold text-[#18314a]">{a.studentId}</span>
                        <span className="rounded-md bg-[#edf7f4] px-2 py-0.5 text-[10px] font-bold text-[#23645f]">Completed</span>
                      </div>
                      <div className="mt-1 text-[13px] font-bold text-[#18314a]">{a.topic}</div>
                      <div className="mt-0.5 text-[11px] text-[#75878e]">{a.date} · {a.time} ({a.durationMinutes} mins)</div>
                    </div>
                    <button
                      onClick={() => handleSelectApt(a)}
                      className="btn btn-teal rounded-xl px-3 py-1.5 text-[11px] font-bold"
                    >
                      Edit / View Summary
                    </button>
                  </div>

                  {a.summaryNotes && (
                    <div className="mt-2 rounded-xl bg-white p-3 border border-[#edf2ef] text-[11px] leading-5 text-[#546b74]">
                      <div><strong>Discussion:</strong> {a.summaryNotes.discussionAreas}</div>
                      <div className="mt-1"><strong>Next Steps:</strong> {a.summaryNotes.recommendations}</div>
                      {a.summaryNotes.followUpDate && (
                        <div className="mt-1 font-bold text-[#23645f]">Follow-up: {a.summaryNotes.followUpDate}</div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Add / Edit Structured Summary Form */}
        <section className="card p-6">
          <div className="field-label">Documentation</div>
          <h2 className="mt-1 text-[18px] font-bold text-[#18314a]">Add Structured Session Summary</h2>
          <p className="mt-1 text-[12px] text-[#788a91]">Keep counselor notes structured and separate from raw student journals.</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="field-label block mb-1">Select Case Appointment</label>
              <select
                value={selectedAptId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedAptId(id);
                  const found = appointments.find((a) => a.id === id);
                  if (found) handleSelectApt(found);
                }}
                className="w-full rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-3.5 py-2.5 text-[12px] outline-none focus:border-[#2f9c95]"
              >
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.studentId} · {a.topic} ({a.mode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label block mb-1">Key Discussion Areas</label>
              <textarea
                value={discussionAreas}
                onChange={(e) => setDiscussionAreas(e.target.value)}
                className="w-full min-h-[75px] rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] p-3 text-[12px] leading-5 outline-none focus:border-[#2f9c95]"
              />
            </div>

            <div>
              <label className="field-label block mb-1">Recommended Next Steps</label>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                className="w-full min-h-[75px] rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] p-3 text-[12px] leading-5 outline-none focus:border-[#2f9c95]"
              />
            </div>

            <div>
              <label className="field-label block mb-1">Follow-up Date</label>
              <input
                type="text"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                placeholder="YYYY-MM-DD"
                className="w-full rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-3.5 py-2.5 text-[12px] outline-none focus:border-[#2f9c95]"
              />
            </div>

            <button
              onClick={handleSaveSummary}
              className="btn btn-teal mt-2 w-full rounded-xl py-3 text-[12px] font-bold"
            >
              Save Session Summary
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

// 6. Counselor Messages Screen
export function CounselorMessages() {
  const { threads, activeThreadId, setActiveThreadId } = usePortal();
  const [liveConversations, setLiveConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedStudentLabel, setSelectedStudentLabel] = useState<string>("Active Student");
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingDebounceRef = useRef<number | null>(null);

  // Load active conversations from backend
  useEffect(() => {
    async function fetchConvs() {
      try {
        const res = await messagesApi.getConversations();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setLiveConversations(res.data);
          if (!selectedConvId) {
            setSelectedConvId(res.data[0].id);
            setSelectedStudentLabel(res.data[0].student_anonymous_id || `Student #${res.data[0].id.slice(-4)}`);
          }
        }
      } catch (err) {
        console.warn("Could not fetch live conversations, using local threads:", err);
      }
    }
    fetchConvs();
  }, []);

  const {
    messages: liveMessages,
    status: wsStatus,
    isOtherTyping,
    isOtherOnline,
    error: wsError,
    isLoadingHistory,
    sendMessage: sendWsMessage,
    sendTyping,
    markAsRead,
    reconnect
  } = useChatWebSocket({
    conversationId: selectedConvId,
    enabled: Boolean(selectedConvId),
  });

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveMessages, isOtherTyping]);

  // Mark as read when conversation is selected
  useEffect(() => {
    if (selectedConvId) {
      markAsRead();
    }
  }, [selectedConvId, markAsRead]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    sendTyping(true);
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = window.setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendTyping(false);
    sendWsMessage(inputText.trim(), "counselor");
    setInputText("");
  };

  // Fallback to portal threads if no live conversations exist yet
  const displayConversations = liveConversations.length > 0
    ? liveConversations.filter(c => !searchQuery || (c.student_anonymous_id || "").toLowerCase().includes(searchQuery.toLowerCase()))
    : threads
        .filter(t => !searchQuery || t.studentId.toLowerCase().includes(searchQuery.toLowerCase()))
        .map(t => ({
          id: t.conversationId || t.studentId,
          student_anonymous_id: t.studentId,
          last_message: t.lastMessage,
          updated_at: t.lastTime
        }));

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConvId && displayConversations.length > 0) {
      const first = displayConversations[0];
      setSelectedConvId(first.id);
      setSelectedStudentLabel(first.student_anonymous_id || first.id);
    }
  }, [displayConversations, selectedConvId]);

  const selectedThread = threads.find(
    (t) => t.studentId === selectedStudentLabel || t.studentId === selectedConvId || t.conversationId === selectedConvId
  );

  const messagesToDisplay = liveMessages.length > 0 ? liveMessages : (selectedThread ? selectedThread.messages : []);

  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="field-label mb-1">Confidential Channels</div>
          <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a]">Counselor Messages</h1>
        </div>
        <div className="flex items-center gap-3">
          {wsStatus === "connected" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f3f0] px-3 py-1 text-[11px] font-bold text-[#23645f]">
              <Wifi size={13} className="text-[#2f9c95]" />
              Real-time Connected
            </span>
          ) : wsStatus === "connecting" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdf0e2] px-3 py-1 text-[11px] font-bold text-[#b87837]">
              <Loader2 size={13} className="animate-spin text-[#d28b47]" />
              Connecting...
            </span>
          ) : (
            <button
              onClick={reconnect}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#fae9e7] px-3 py-1 text-[11px] font-bold text-[#a94e4a] hover:bg-[#f5d5d2]"
            >
              <WifiOff size={13} />
              Re-establish Connection
            </button>
          )}
        </div>
      </div>

      <div className="grid h-[640px] gap-4 lg:grid-cols-[340px_1fr]">
        {/* Left Side: Student Threads */}
        <div className="card flex flex-col overflow-hidden p-0">
          <div className="border-b border-[#edf1ef] p-4">
            <div className="field-label">Active Support Channels</div>
            <div className="relative mt-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b999d]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student ID..."
                className="w-full rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] py-2 pl-8 pr-3 text-[12px] outline-none focus:border-[#2f9c95]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#f2f6f4]">
            {displayConversations.map((t) => {
              const isSelected = selectedConvId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedConvId(t.id);
                    setSelectedStudentLabel(t.student_anonymous_id || t.id);
                    setActiveThreadId(t.id);
                  }}
                  className={`flex w-full items-start gap-3 p-4 text-left transition ${
                    isSelected ? "bg-[#edf7f4]" : "hover:bg-[#f8faf9]"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#dcebe7] font-mono text-[12px] font-bold text-[#23645f]">
                    {(t.student_anonymous_id || t.id).slice(-4)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[13px] font-bold text-[#18314a]">
                        {t.student_anonymous_id || t.id}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-[11px] text-[#6e8088]">
                      {t.last_message || "No messages yet"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Conversation Box */}
        <div className="card flex flex-col overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[#edf1ef] bg-[#fbfdfc] px-6 py-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[16px] font-extrabold text-[#18314a]">{selectedStudentLabel}</span>
                <span className="rounded-full bg-[#e6f3f0] px-2 py-0.5 text-[10px] font-bold text-[#23645f]">
                  Counseling Room
                </span>
                {isOtherOnline && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f7eb] px-2 py-0.5 text-[10px] font-bold text-[#1b7a3e]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#27ae60]"></span>
                    Student Online
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[11px] text-[#7d8f96]">
                End-to-end encrypted counselor-student session. Not visible to administration.
              </div>
            </div>
            <button onClick={() => toast.info("Opening scheduling drawer...")} className="btn btn-teal rounded-xl px-3.5 py-1.5 text-[11px] font-bold">
              Schedule Video
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoadingHistory && (
              <div className="flex items-center justify-center py-6 text-[12px] text-[#8e9fa4]">
                <Loader2 size={16} className="animate-spin mr-2 text-[#2f9c95]" />
                Loading conversation history...
              </div>
            )}

            {wsError && (
              <div className="rounded-xl border border-[#fae9e7] bg-[#fef5f4] p-3 text-[12px] text-[#a94e4a] flex items-center justify-between">
                <span>{wsError}</span>
                <button onClick={reconnect} className="font-bold underline ml-2">Retry</button>
              </div>
            )}

            {messagesToDisplay.length === 0 && !isLoadingHistory && (
              <div className="py-12 text-center text-[13px] text-[#8e9fa4]">
                No messages yet. Send a supportive greeting to begin this session.
              </div>
            )}

            {messagesToDisplay.map((m: any) => {
              const isCounselor = m.sender_role === "counselor" || m.sender === "counselor" || m.sender_id === "me";
              const timeStr = m.created_at
                ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : (m.time || "Just now");
              const textContent = m.content || m.text || "";

              return (
                <div
                  key={m.id || Math.random()}
                  className={`flex flex-col ${isCounselor ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[480px] rounded-2xl p-4 text-[13px] leading-6 ${
                      isCounselor
                        ? "bg-[#18314a] text-white rounded-br-xs"
                        : "bg-[#edf7f4] text-[#2c534f] rounded-bl-xs"
                    }`}
                  >
                    <FormattedText text={textContent} isUser={isCounselor} />
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 px-1 text-[10px] text-[#93a2a7]">
                    <span>{timeStr}</span>
                    {isCounselor && (
                      <span className="font-medium text-[#2f9c95]">
                        {m.is_read ? "· Read" : "· Sent"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {isOtherTyping && (
              <div className="flex items-center gap-2 text-[12px] italic text-[#6e8088] animate-pulse">
                <span className="h-2 w-2 rounded-full bg-[#2f9c95]"></span>
                Student is typing a response...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-[#edf1ef] bg-white p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Write a supportive, professional message..."
                className="flex-1 rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-4 py-3 text-[13px] outline-none focus:border-[#2f9c95]"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="btn btn-teal flex h-11 w-11 shrink-0 items-center justify-center rounded-xl disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// 7. Counselor Interventions Screen
export function CounselorInterventions() {
  const interventions = [
    { name: "Box Breathing", duration: "2 minutes", category: "Breathing", recommendedFor: "Elevated acute stress", completions: 42, beforeStress: "7.8", afterStress: "5.1", icon: Wind, color: "bg-[#e5f3f1] text-[#2f9c95]" },
    { name: "5-4-3-2-1 Grounding", duration: "5 minutes", category: "Grounding", recommendedFor: "Anxiety spikes & overwhelm", completions: 31, beforeStress: "7.4", afterStress: "5.8", icon: Activity, color: "bg-[#eeeaf8] text-[#80668b]" },
    { name: "Cognitive Reframing", duration: "5 minutes", category: "Thought Reframing", recommendedFor: "Exam catastrophizing", completions: 28, beforeStress: "7.1", afterStress: "5.4", icon: Brain, color: "bg-[#fdf0e3] text-[#b87837]" },
    { name: "Sleep Stabilization", duration: "8 minutes", category: "Sleep", recommendedFor: "Insomnia & racing thoughts", completions: 19, beforeStress: "6.9", afterStress: "4.8", icon: Clock3, color: "bg-[#edf1f7] text-[#667c99]" },
    { name: "Workload Breakdown", duration: "4 minutes", category: "Study Stress", recommendedFor: "Assignment deadlines", completions: 37, beforeStress: "8.1", afterStress: "6.0", icon: BookOpen, color: "bg-[#edf8f5] text-[#2f9c95]" },
  ];

  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      <div className="mb-7">
        <div className="field-label mb-2">Self-Guided Tool Orbit</div>
        <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a] md:text-[32px]">Recommended Interventions</h1>
        <p className="mt-1.5 text-[14px] text-[#718189]">
          Student engagement and reported stress changes across self-guided wellness exercises.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {interventions.map((inv) => {
          const Icon = inv.icon;
          return (
            <div key={inv.name} className="card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${inv.color}`}>
                    <Icon size={22} />
                  </div>
                  <span className="rounded-full bg-[#edf6f4] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] text-[#23645f]">
                    {inv.category}
                  </span>
                </div>

                <h3 className="mt-4 text-[17px] font-bold text-[#18314a]">{inv.name}</h3>
                <div className="mt-1 text-[12px] text-[#76878e]">Duration: {inv.duration} · {inv.recommendedFor}</div>

                <div className="mt-4 rounded-xl bg-[#f8faf9] p-3">
                  <div className="field-label !text-[9px]">Reported Stress Change</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-[20px] font-extrabold text-[#18314a]">{inv.beforeStress} → {inv.afterStress}</span>
                    <span className="text-[11px] font-bold text-[#23645f]">(-{(Number(inv.beforeStress) - Number(inv.afterStress)).toFixed(1)} avg)</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#edf1ef] pt-3">
                <span className="text-[11px] text-[#86979c]">{inv.completions} student completions</span>
                <button
                  onClick={() => toast.success(`${inv.name} recommended to active student queue`)}
                  className="text-[11px] font-bold text-[#23645f] hover:underline"
                >
                  Assign to Student →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

// 8. Counselor Analytics Screen
export function CounselorAnalytics() {
  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      <div className="mb-7">
        <div className="field-label mb-2">Operational Insights</div>
        <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a] md:text-[32px]">Counselor Analytics</h1>
        <p className="mt-1.5 text-[14px] text-[#718189]">Response times, resolution rates, and intervention engagement.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="field-label">Avg Response Time</div>
          <div className="mt-2 text-[30px] font-extrabold text-[#18314a]">18 min</div>
          <div className="mt-1 text-[11px] font-semibold text-[#23645f]">↓ 4 min improvement</div>
        </div>
        <div className="card p-5">
          <div className="field-label">Resolved Cases</div>
          <div className="mt-2 text-[30px] font-extrabold text-[#18314a]">84%</div>
          <div className="mt-1 text-[11px] font-semibold text-[#23645f]">48 students stabilized</div>
        </div>
        <div className="card p-5">
          <div className="field-label">Follow-Up Completion</div>
          <div className="mt-2 text-[30px] font-extrabold text-[#18314a]">76%</div>
          <div className="mt-1 text-[11px] font-semibold text-[#865d38]">Across 2-week intervals</div>
        </div>
        <div className="card p-5">
          <div className="field-label">Active Consultations</div>
          <div className="mt-2 text-[30px] font-extrabold text-[#18314a]">38</div>
          <div className="mt-1 text-[11px] font-semibold text-[#556972]">This semester</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-[18px] font-bold text-[#18314a]">Risk Cases Managed Over Time</h2>
          <div className="mt-4 h-[180px] w-full">
            <svg className="h-full w-full" viewBox="0 0 500 150">
              <path d="M0 120 C100 110 200 70 300 85 S400 40 500 30" fill="none" stroke="#2f9c95" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <div className="mt-2 text-[11px] text-[#71828a]">Consistently identifying cases 3–5 days earlier than traditional walk-in models.</div>
        </section>

        <section className="card p-6">
          <h2 className="text-[18px] font-bold text-[#18314a]">Intervention Adoption Breakdown</h2>
          <div className="mt-5 flex flex-col gap-3">
            {[
              ["Box Breathing", "84% completion", "bg-[#2f9c95]"],
              ["Grounding Exercises", "72% completion", "bg-[#80668b]"],
              ["Thought Reframing", "64% completion", "bg-[#d28b47]"],
              ["Sleep Routines", "58% completion", "bg-[#506c7d]"],
            ].map(([name, stat, col]) => (
              <div key={name}>
                <div className="flex justify-between text-[12px] font-bold text-[#18314a] mb-1">
                  <span>{name}</span>
                  <span>{stat}</span>
                </div>
                <div className="h-2 rounded-full bg-[#edf1ef]">
                  <div className={`h-2 rounded-full ${col}`} style={{ width: stat.split("%")[0] + "%" }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

// 9. Counselor Settings Screen
export function CounselorSettings() {
  const [counselorName, setCounselorName] = useState("Dr. Priya Sharma");
  const [roleTitle, setRoleTitle] = useState("Lead Campus Counselor");
  const [department, setDepartment] = useState("Department of Psychological Services");
  const [empId, setEmpId] = useState("EMP-9021");
  const [meetTemplate, setMeetTemplate] = useState("https://meet.google.com/abc-defg-hij");
  const [officeLocation, setOfficeLocation] = useState("Student Wellness Center, Suite 204");
  const [sessionDuration, setSessionDuration] = useState("45");
  const [notifyHighRisk, setNotifyHighRisk] = useState(true);
  const [notifyDailyDigest, setNotifyDailyDigest] = useState(true);
  const [notifyStudentMessage, setNotifyStudentMessage] = useState(true);
  const [autoEscalate, setAutoEscalate] = useState(true);

  const handleSave = () => {
    toast.success("Counselor workspace preferences updated successfully.");
  };

  return (
    <main className="mobile-content mx-auto max-w-[1080px]">
      <div className="mb-6">
        <div className="field-label mb-2">Workspace & Clinical Governance</div>
        <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a]">
          Counselor Workspace Settings
        </h1>
        <p className="mt-1 text-[13px] text-[#71828a]">
          Manage clinical availability, consultation defaults, alert sensitivities, and notification preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Card 1: Clinical Profile */}
        <section className="card p-6">
          <div className="flex items-center gap-3 border-b border-[#edf1ef] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f3f0] text-[#23645f]">
              <UserRound size={20} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#18314a]">Counselor Identity & Credentials</h2>
              <p className="text-[11px] text-[#71828a]">Information displayed to students when scheduling sessions.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block field-label">
              Full Name & Title
              <input
                type="text"
                value={counselorName}
                onChange={(e) => setCounselorName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-3.5 py-2.5 text-[12px] outline-none focus:border-[#2f9c95]"
              />
            </label>

            <label className="block field-label">
              Professional Role
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-3.5 py-2.5 text-[12px] outline-none focus:border-[#2f9c95]"
              />
            </label>

            <label className="block field-label">
              Department / Cell
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-3.5 py-2.5 text-[12px] outline-none focus:border-[#2f9c95]"
              />
            </label>

            <label className="block field-label">
              Employee ID
              <input
                type="text"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-3.5 py-2.5 text-[12px] outline-none focus:border-[#2f9c95]"
              />
            </label>
          </div>
        </section>

        {/* Card 2: Consultation & Availability Defaults */}
        <section className="card p-6">
          <div className="flex items-center gap-3 border-b border-[#edf1ef] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eeeaf8] text-[#80668b]">
              <CalendarDays size={20} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#18314a]">Consultation Defaults & Rooms</h2>
              <p className="text-[11px] text-[#71828a]">Configure video meet links, office locations, and default slot lengths.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block field-label">
              Default Google Meet Link (Video Consultations)
              <input
                type="url"
                value={meetTemplate}
                onChange={(e) => setMeetTemplate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-3.5 py-2.5 text-[12px] outline-none focus:border-[#2f9c95]"
              />
            </label>

            <label className="block field-label">
              In-Person Office Location
              <input
                type="text"
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-3.5 py-2.5 text-[12px] outline-none focus:border-[#2f9c95]"
              />
            </label>

            <label className="block field-label">
              Default Slot Duration
              <select
                value={sessionDuration}
                onChange={(e) => setSessionDuration(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-3.5 py-2.5 text-[12px] outline-none focus:border-[#2f9c95]"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </label>
          </div>
        </section>

        {/* Card 3: Alert Sensitivity & Notification Controls */}
        <section className="card p-6">
          <div className="flex items-center gap-3 border-b border-[#edf1ef] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fae9e7] text-[#a94e4a]">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#18314a]">Alert Sensitivity & Escalations</h2>
              <p className="text-[11px] text-[#71828a]">Set triggers for high-risk case alerts and emergency notifications.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3.5">
            <div className="flex items-center justify-between rounded-xl bg-[#f8faf9] p-3.5 border border-[#edf1ef]">
              <div>
                <div className="text-[13px] font-bold text-[#18314a]">High-Risk Student Alerts</div>
                <div className="text-[11px] text-[#71828a]">Receive instant push/in-app notifications when a student score reaches High Risk (&gt;75).</div>
              </div>
              <input
                type="checkbox"
                checked={notifyHighRisk}
                onChange={(e) => setNotifyHighRisk(e.target.checked)}
                className="h-5 w-5 rounded border-[#dfe6e3] accent-[#2f9c95]"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#f8faf9] p-3.5 border border-[#edf1ef]">
              <div>
                <div className="text-[13px] font-bold text-[#18314a]">Direct Student Messages</div>
                <div className="text-[11px] text-[#71828a]">Notify when a student replies in the confidential counseling chat.</div>
              </div>
              <input
                type="checkbox"
                checked={notifyStudentMessage}
                onChange={(e) => setNotifyStudentMessage(e.target.checked)}
                className="h-5 w-5 rounded border-[#dfe6e3] accent-[#2f9c95]"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#f8faf9] p-3.5 border border-[#edf1ef]">
              <div>
                <div className="text-[13px] font-bold text-[#18314a]">Automated Case Escalation</div>
                <div className="text-[11px] text-[#71828a]">Automatically flag unassigned critical cases after 24 hours of inactivity.</div>
              </div>
              <input
                type="checkbox"
                checked={autoEscalate}
                onChange={(e) => setAutoEscalate(e.target.checked)}
                className="h-5 w-5 rounded border-[#dfe6e3] accent-[#2f9c95]"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              className="btn btn-teal rounded-xl px-6 py-3 text-[12px] font-bold flex items-center gap-2"
            >
              <Check size={16} /> Save Counselor Preferences
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

