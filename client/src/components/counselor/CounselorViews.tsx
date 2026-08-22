import React, { useState } from "react";
import {
  Activity, AlertTriangle, ArrowUpRight, Bell, BookOpen, Brain, Calendar, CalendarDays, Check,
  ChevronRight, CircleAlert, CircleHelp, Clock, Clock3, Eye, FileText, Filter, Flame, Heart,
  HelpCircle, Info, LockKeyhole, Mail, MessageCircle, MessageSquare, MoreHorizontal, Phone,
  Plus, RefreshCw, Search, Send, ShieldAlert, ShieldCheck, Sparkles, Stethoscope, User,
  UserCheck, UserRound, Users, Video, Wind, X, Zap
} from "lucide-react";
import { toast } from "sonner";
import { StudentCase, Appointment, usePortal } from "../../contexts/PortalContext";

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
  const followupsToday = appointments.filter((a) => a.date === "Today" && a.status === "Scheduled").length + 2;

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
            <CalendarDays size={15} className="text-[#2f9c95]" /> Today's Schedule ({followupsToday})
          </button>
          <button
            onClick={() => onNavigate("High-risk cases")}
            className="btn btn-teal flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-bold"
          >
            <AlertTriangle size={15} /> High-Risk Cases ({highCount})
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
            <span>+1 from yesterday</span> · Immediate review recommended
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
            <span>-1 from yesterday</span> · Moderate risk signals
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
            <span>+3 active</span> · Following self-guided plans
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[.1em] text-[#809098]">
            <span>Follow-ups Today</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f4f7] text-[#506c7d]">
              <Clock3 size={15} />
            </span>
          </div>
          <div className="mt-3 text-[32px] font-extrabold tracking-[-.05em] text-[#18314a]">{followupsToday}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#667e8c]">
            <span>2 pending review</span> · 3 completed
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
                        Review Case
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Two Column Section: Upcoming Appointments & AI Observations */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        {/* Today's Counseling Appointments */}
        <section className="card p-6">
          <div className="flex items-center justify-between border-b border-[#edf1ef] pb-4">
            <div>
              <div className="field-label">Scheduled Consultations</div>
              <h3 className="mt-1 text-[17px] font-bold text-[#18314a]">Upcoming Sessions</h3>
            </div>
            <button
              onClick={() => onNavigate("Appointments")}
              className="text-[12px] font-bold text-[#23645f] hover:underline"
            >
              View all calendar →
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {appointments
              .filter((a) => a.status === "Scheduled")
              .slice(0, 3)
              .map((a) => (
                <div
                  key={a.id}
                  className="card-hover flex items-center justify-between rounded-2xl border border-[#e5ebe8] bg-[#fbfdfc] p-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f3f0] text-[#2f9c95]">
                      {a.mode === "Video" ? <Video size={18} /> : a.mode === "Phone" ? <Phone size={18} /> : <Users size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] font-extrabold text-[#18314a]">{a.studentId}</span>
                        <span className="rounded-md bg-[#edf6f4] px-2 py-0.5 text-[10px] font-bold text-[#23645f]">
                          {a.mode}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[12px] font-medium text-[#70828a]">{a.topic}</div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] font-bold text-[#55707b]">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-[#2f9c95]" /> {a.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-[#2f9c95]" /> {a.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toast.info(`Opening ${a.mode} session room for ${a.studentId}`)}
                    className="btn btn-primary rounded-xl px-3.5 py-2 text-[11px] font-bold"
                  >
                    {a.mode === "Video" ? "Join Video" : "Open Case"}
                  </button>
                </div>
              ))}
          </div>
        </section>

        {/* Ethical System & Guidelines */}
        <section className="card p-6 flex flex-col justify-between">
          <div>
            <div className="field-label flex items-center gap-1.5 text-[#23645f]">
              <LockKeyhole size={13} /> Privacy & Ethical Protocol
            </div>
            <h3 className="mt-2 text-[18px] font-bold text-[#18314a]">Calm, Privacy-First Care</h3>
            <p className="mt-2 text-[13px] leading-6 text-[#627780]">
              MindSaathi uses privacy-preserving risk calculations to assist human counselors in reaching students earlier.
              AI outputs represent supportive observational signals and are <strong className="text-[#18314a]">never psychiatric diagnoses</strong>.
            </p>

            <div className="mt-4 rounded-2xl bg-[#edf7f4] p-4 text-[12px] text-[#2c5b56] leading-5">
              <div className="font-bold flex items-center gap-1.5">
                <Check size={14} /> Student Confidentiality Safeguard
              </div>
              <p className="mt-1 text-[11px] text-[#517671]">
                Personal journals and identifiable notes remain strictly protected. Only authorized counselors assigned to high-priority cases have escalation support visibility.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-[#edf1ef] pt-4">
            <span className="text-[11px] text-[#809098]">MindSaathi Protocol v2.6 · ISO-27001 Certified</span>
            <button
              onClick={() => toast.info("Privacy & Compliance whitepaper opened")}
              className="text-[11px] font-bold text-[#23645f] hover:underline"
            >
              Policy Details →
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

// 2. High-Risk Cases Page
export function CounselorCasesPage({ onSelectCase, onNavigate }: { onSelectCase: (c: StudentCase) => void; onNavigate: (tab: string) => void }) {
  const { cases } = usePortal();
  const [filter, setFilter] = useState("All");

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

  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      <div className="mb-7">
        <div className="field-label mb-2">Student Risk Orbit</div>
        <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a] md:text-[32px]">High-Risk Cases</h1>
        <p className="mt-1.5 text-[14px] text-[#718189]">
          Review students who may require additional human support.
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

// 3. Case Detail Screen
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
  const [timeRange, setTimeRange] = useState("7 days");
  const [showSharedJournal, setShowSharedJournal] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [sessionTopic, setSessionTopic] = useState("Academic stress & Midterm support");
  const [sessionMode, setSessionMode] = useState<"In-person" | "Video" | "Phone">("Video");
  const [sessionTime, setSessionTime] = useState("Tomorrow · 3:00 PM");
  const [sessionDuration, setSessionDuration] = useState(45);

  const handleContactSubmit = (type: string, messageText: string) => {
    sendMessage(c.id, messageText || `Hello ${c.id}, this is Dr. Priya Sharma from Campus Support. I am reaching out to see how we can assist you.`);
    setContactModalOpen(false);
    toast.success(`Contact outreach sent via ${type} to ${c.id}`);
  };

  const handleScheduleSubmit = () => {
    scheduleAppointment({
      studentId: c.id,
      counselorName: "Dr. Priya Sharma",
      date: sessionTime.includes("Tomorrow") ? "Tomorrow" : "Today",
      time: sessionTime.split("·")[1]?.trim() || "3:00 PM",
      mode: sessionMode,
      topic: sessionTopic,
      durationMinutes: sessionDuration,
    });
    setScheduleModalOpen(false);
  };

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
              <h1 className="font-mono text-[28px] font-extrabold tracking-tight text-[#18314a] md:text-[34px]">{c.id}</h1>
              <RiskBadge risk={c.risk} score={c.score} />
              <StatusBadge status={c.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-[12px] text-[#6d7e86]">
              <span>Risk Score: <strong className="text-[#18314a]">{c.score} / 100</strong></span>
              <span>Trend: <strong className={c.trend === "Declining" ? "text-[#b45b53]" : "text-[#23645f]"}>{c.trend}</strong></span>
              <span>Detected: <strong>{c.detectedTime}</strong></span>
              <span>Assigned: <strong>{c.assignedCounselor}</strong></span>
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
                updateCaseStatus(c.id, "Monitoring", "Counselor marked as regular monitoring active");
              }}
              className="rounded-xl border border-[#dfe6e3] bg-white px-3 py-2.5 text-[12px] font-bold text-[#556b73] hover:border-[#2f9c95]"
            >
              Mark as Monitoring
            </button>
            <button
              onClick={() => {
                updateCaseStatus(c.id, "Resolved", "Case resolved successfully after student check-in stabilization");
              }}
              className="rounded-xl border border-[#d2ded8] bg-[#f2f7f5] px-3 py-2.5 text-[12px] font-bold text-[#23645f] hover:bg-[#e6f3f0]"
            >
              Resolve Case
            </button>
          </div>
        </div>

        {/* Privacy Notice Banner */}
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#d3e5df] bg-[#edf7f4] p-4 text-[12px] text-[#23645f]">
          <ShieldCheck size={18} className="shrink-0 text-[#2f9c95]" />
          <div>
            <span className="font-bold">Student Privacy Protocol Active:</span> Student identity and sensitive personal details are protected according to institutional privacy policy. AI flags indicate trend anomalies and do not constitute a medical diagnosis.
          </div>
        </div>

        {/* 2 Column Layout: Why Flagged vs Wellness Trends */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Explainable AI Risk Factor Decomposition */}
          <section className="rounded-2xl border border-[#e4eae6] bg-[#fbfdfc] p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="field-label">Explainable Analysis</div>
                <h3 className="mt-1 text-[17px] font-bold text-[#18314a]">Why was this case flagged?</h3>
              </div>
              <span className="rounded-lg bg-[#fae9e7] px-2 py-1 text-[10px] font-bold text-[#c96862]">
                Multivariate Signals
              </span>
            </div>

            <p className="mt-2 text-[12px] text-[#71828a]">
              The risk engine identified elevated distress across multiple signal categories:
            </p>

            <div className="mt-4 flex flex-col gap-3">
              {c.riskFactors.map((rf) => (
                <div key={rf.label} className="rounded-xl bg-white p-3 border border-[#edf2ef] shadow-2xs">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-bold text-[#18314a]">{rf.label}</span>
                    <span className="font-mono font-bold text-[#c96862]">{rf.score} pts</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#f1f4f3] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        rf.points > 75 ? "bg-[#c96862]" : rf.points > 55 ? "bg-[#d28b47]" : "bg-[#2f9c95]"
                      }`}
                      style={{ width: `${rf.points}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 text-[11px] text-[#718289]">
              <Info size={14} className="text-[#2f9c95]" />
              <span>Risk is calculated from longitudinal trends, not isolated single responses.</span>
            </div>
          </section>

          {/* Student Wellness Trend Charts */}
          <section className="rounded-2xl border border-[#e4eae6] bg-white p-5 md:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="field-label">Longitudinal Observation</div>
                  <h3 className="mt-1 text-[17px] font-bold text-[#18314a]">Student Wellness Trend</h3>
                </div>
                <div className="flex gap-1 rounded-lg bg-[#f1f5f3] p-1 text-[10px] font-bold">
                  {["7 days", "30 days", "90 days"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setTimeRange(r)}
                      className={`rounded-md px-2.5 py-1 transition ${
                        timeRange === r ? "bg-white text-[#23645f] shadow-xs" : "text-[#7d8e94]"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Legend */}
              <div className="mt-3 flex gap-4 text-[11px] text-[#6d7e86]">
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#2f9c95]"/> Reported Mood</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#d4b5dc]"/> Stress Index</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#7caec2]"/> Sleep Stability</span>
              </div>

              {/* SVG Trend Chart */}
              <div className="relative mt-4 h-[160px] w-full overflow-hidden">
                <svg className="h-full w-full" viewBox="0 0 700 160" preserveAspectRatio="none">
                  <line x1="0" y1="20" x2="700" y2="20" stroke="#f0f3f2" strokeDasharray="3 3"/>
                  <line x1="0" y1="60" x2="700" y2="60" stroke="#f0f3f2" strokeDasharray="3 3"/>
                  <line x1="0" y1="100" x2="700" y2="100" stroke="#f0f3f2" strokeDasharray="3 3"/>
                  <line x1="0" y1="140" x2="700" y2="140" stroke="#f0f3f2" strokeDasharray="3 3"/>

                  {/* Mood Line */}
                  <path
                    d="M0 40 C100 45 200 65 300 80 S500 110 700 125"
                    fill="none"
                    stroke="#2f9c95"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Stress Line */}
                  <path
                    d="M0 130 C120 120 220 90 320 60 S520 40 700 25"
                    fill="none"
                    stroke="#c96862"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Sleep Line */}
                  <path
                    d="M0 80 C120 75 220 95 320 110 S520 130 700 145"
                    fill="none"
                    stroke="#7caec2"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                </svg>
              </div>

              {/* Quiet Observations Box */}
              <div className="mt-3 rounded-xl bg-[#fffaf4] border-l-4 border-[#d28b47] p-3 text-[11px] leading-5 text-[#865d38]">
                <strong>Observed Pattern:</strong> Student's reported stress increased consistently over the last 5 days during examination milestones, while sleep duration decreased compared with baseline (average ~4.5h vs 7.1h).
              </div>
            </div>
          </section>
        </div>

        {/* Private Information Safeguards & Shared Content */}
        <section className="mt-6 rounded-2xl border border-[#e4eae6] bg-[#fbfdfc] p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf6f4] text-[#2f9c95]">
                <LockKeyhole size={16} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#18314a]">Private Information Handling</h3>
                <div className="text-[11px] text-[#76878d]">Protected student-generated content</div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSharedJournal(!showSharedJournal);
                toast.info(showSharedJournal ? "Shared details concealed" : "Consent-authorized summary decrypted");
              }}
              className="btn rounded-xl border border-[#d2dfdb] bg-white px-3.5 py-2 text-[11px] font-bold text-[#23645f] hover:bg-[#edf7f4]"
            >
              {showSharedJournal ? "Hide Shared Information" : "View Shared Information"}
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-[#e8eeeb] bg-white p-4 text-[12px] leading-6 text-[#576c75]">
            {showSharedJournal ? (
              <div>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#23645f]">
                  <Check size={14} /> Shared with Counselor Consent:
                </div>
                <p className="bg-[#f7faf8] p-3 rounded-lg border border-[#e6efe9] text-[#335650] italic">
                  "{c.sharedNotes || "Student reported high stress from midterm exams, difficulty falling asleep before 3 AM, and feelings of exhaustion."}"
                </p>
                <div className="mt-2 text-[10px] text-[#86979c]">
                  Access log recorded in audit trail for compliance. Raw personal entries remain encrypted.
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[12px] text-[#77888f]">
                <span>
                  Raw journal text is private. Summary insights are shared under institutional consent and escalation protocols.
                </span>
                <span className="text-[11px] font-bold text-[#2f9c95]">Encrypted & Protected</span>
              </div>
            )}
          </div>
        </section>

        {/* Case Activity History */}
        <section className="mt-6 border-t border-[#edf1ef] pt-5">
          <div className="field-label mb-3">Case History & Audit Trail</div>
          <div className="divide-y divide-[#f2f6f4]">
            {c.history.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2f9c95]" />
                  <span className="font-semibold text-[#18314a]">{h.action}</span>
                </div>
                <div className="text-[11px] text-[#809098]">
                  {h.actor} · {h.date}
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
                <h3 className="mt-1 text-[20px] font-extrabold text-[#18314a]">Contact Student {c.id}</h3>
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
                  defaultValue={`Hello ${c.id}, I noticed your recent check-ins indicated a challenging week. I am here if you would like to connect or explore helpful strategies.`}
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
                <h3 className="mt-1 text-[20px] font-extrabold text-[#18314a]">Schedule Session with {c.id}</h3>
              </div>
              <button onClick={() => setScheduleModalOpen(false)} className="rounded-lg p-1 text-[#8b999e] hover:bg-[#f1f5f3]">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="field-label block mb-1">Session Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Video", "In-person", "Phone"] as const).map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setSessionMode(mode)}
                      className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[12px] font-bold transition ${
                        sessionMode === mode ? "border-[#2f9c95] bg-[#edf7f4] text-[#23645f]" : "border-[#dfe6e3] text-[#60737c]"
                      }`}
                    >
                      {mode === "Video" ? <Video size={14} /> : mode === "In-person" ? <Users size={14} /> : <Phone size={14} />}
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
                ✓ Confirms automatically to both student and counselor calendar.
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
  const { appointments } = usePortal();
  const [tab, setTab] = useState<"Today" | "Upcoming" | "Past" | "Calendar">("Today");

  const todayList = appointments.filter((a) => a.date === "Today" || a.date.includes("August 22"));
  const upcomingList = appointments.filter((a) => a.status === "Scheduled");
  const pastList = appointments.filter((a) => a.status === "Completed" || a.status === "Cancelled");

  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="field-label mb-2">Consultation Schedule</div>
          <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a] md:text-[32px]">Counselor Appointments</h1>
          <p className="mt-1.5 text-[14px] text-[#718189]">Manage scheduled sessions, video links, and follow-ups.</p>
        </div>
        <div className="flex items-center gap-2">
          {["Today", "Upcoming", "Past", "Calendar"].map((t: any) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl px-3.5 py-2 text-[12px] font-bold transition ${
                tab === t ? "bg-[#18314a] text-white" : "border border-[#dfe6e3] bg-white text-[#657881] hover:border-[#2f9c95]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "Calendar" ? (
        <section className="card p-6">
          <div className="flex items-center justify-between border-b border-[#edf1ef] pb-4">
            <h2 className="text-[18px] font-bold">Week View · August 2026</h2>
            <div className="text-[12px] font-bold text-[#23645f]">Dr. Priya Sharma (Available 9:00 AM – 5:00 PM)</div>
          </div>
          <div className="mt-6 grid grid-cols-5 gap-3">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, idx) => (
              <div key={day} className="rounded-2xl border border-[#e4eae7] bg-[#fbfdfc] p-4">
                <div className="font-bold text-[13px] text-[#18314a]">{day}</div>
                <div className="mt-3 flex flex-col gap-2">
                  {idx === 0 && (
                    <div className="rounded-xl bg-[#e6f3f0] p-2 text-[11px] font-bold text-[#23645f]">
                      10:00 AM · STU-1932 (Video)
                    </div>
                  )}
                  {idx === 1 && (
                    <div className="rounded-xl bg-[#eeeaf8] p-2 text-[11px] font-bold text-[#6a4888]">
                      3:00 PM · STU-2048 (In-person)
                    </div>
                  )}
                  {idx === 2 && (
                    <div className="rounded-xl bg-[#fcf0e2] p-2 text-[11px] font-bold text-[#8f5d2b]">
                      2:00 PM · STU-1044 (Follow-up)
                    </div>
                  )}
                  <button onClick={() => toast.info("Slot available for booking")} className="mt-2 text-center text-[10px] font-bold text-[#8da0a6] hover:text-[#23645f]">
                    + Add availability slot
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(tab === "Today" ? todayList : tab === "Upcoming" ? upcomingList : pastList).map((a) => (
            <div key={a.id} className="card-hover card flex flex-col justify-between p-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[14px] font-extrabold text-[#18314a]">{a.studentId}</span>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${a.status === "Completed" ? "bg-[#e6f3f0] text-[#23645f]" : "bg-[#f3f6f5] text-[#556b73]"}`}>
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
                    {a.mode === "Video" ? <Video size={13} className="text-[#2f9c95]" /> : a.mode === "Phone" ? <Phone size={13} className="text-[#2f9c95]" /> : <Users size={13} className="text-[#2f9c95]" />}
                    <span>{a.mode} ({a.durationMinutes} mins)</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#edf1ef] pt-3">
                <span className="text-[11px] text-[#86979c]">{a.counselorName}</span>
                <button
                  onClick={() => toast.success(`Session link active for ${a.studentId}`)}
                  className="btn btn-teal rounded-lg px-3 py-1.5 text-[11px] font-bold"
                >
                  {a.mode === "Video" ? "Join Video" : "Open Session"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

// 5. Counselor Session History & Summary Screen
export function CounselorSessionsHistory() {
  const { appointments, completeAppointment } = usePortal();
  const [selectedAptForSummary, setSelectedAptForSummary] = useState<Appointment | null>(null);
  const [discussionAreas, setDiscussionAreas] = useState("Academic workload, exam preparation timeline, sleep routine disruptions.");
  const [recommendations, setRecommendations] = useState("Continue daily check-ins, practice box breathing 2x daily, review in 1 week.");
  const [followUpDate, setFollowUpDate] = useState("August 28, 2026");

  const completedList = appointments.filter((a) => a.status === "Completed");

  const handleSaveSummary = () => {
    if (selectedAptForSummary) {
      completeAppointment(selectedAptForSummary.id, {
        discussionAreas,
        recommendations,
        followUpRequired: true,
        followUpDate,
      });
      setSelectedAptForSummary(null);
    }
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
            {completedList.map((a) => (
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
                    onClick={() => setSelectedAptForSummary(a)}
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
            ))}
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
              <select className="w-full rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-3.5 py-2.5 text-[12px] outline-none focus:border-[#2f9c95]">
                <option>STU-2048 · Academic stress & Midterm support</option>
                <option>STU-1932 · Follow-up consultation</option>
                <option>STU-1044 · Sleep hygiene guidance</option>
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
  const { threads, activeThreadId, setActiveThreadId, sendMessage } = usePortal();
  const [inputText, setInputText] = useState("");

  const activeThread = threads.find((t) => t.studentId === activeThreadId) || threads[0];

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(activeThread.studentId, inputText.trim());
    setInputText("");
  };

  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      <div className="mb-6">
        <div className="field-label mb-1">Confidential Channels</div>
        <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a]">Counselor Messages</h1>
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
                placeholder="Search student ID..."
                className="w-full rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] py-2 pl-8 pr-3 text-[12px] outline-none focus:border-[#2f9c95]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#f2f6f4]">
            {threads.map((t) => (
              <button
                key={t.studentId}
                onClick={() => setActiveThreadId(t.studentId)}
                className={`flex w-full items-start gap-3 p-4 text-left transition ${
                  activeThreadId === t.studentId ? "bg-[#edf7f4]" : "hover:bg-[#f8faf9]"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#dcebe7] font-mono text-[12px] font-bold text-[#23645f]">
                  {t.studentId.slice(-4)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[13px] font-bold text-[#18314a]">{t.studentId}</span>
                    <span className="text-[10px] text-[#8e9fa4]">{t.lastTime}</span>
                  </div>
                  <div className="mt-1 truncate text-[11px] text-[#6e8088]">{t.lastMessage}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Conversation Box */}
        <div className="card flex flex-col overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[#edf1ef] bg-[#fbfdfc] px-6 py-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[16px] font-extrabold text-[#18314a]">{activeThread?.studentId}</span>
                <span className="rounded-full bg-[#e6f3f0] px-2 py-0.5 text-[10px] font-bold text-[#23645f]">
                  Counseling Channel
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-[#7d8f96]">
                Messages are protected as part of the student support record.
              </div>
            </div>
            <button onClick={() => toast.info("Opening session options")} className="btn btn-teal rounded-xl px-3.5 py-1.5 text-[11px] font-bold">
              Schedule Video
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeThread?.messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "counselor" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[480px] rounded-2xl p-4 text-[13px] leading-6 ${
                    m.sender === "counselor"
                      ? "bg-[#18314a] text-white rounded-br-xs"
                      : "bg-[#edf7f4] text-[#2c534f] rounded-bl-xs"
                  }`}
                >
                  {m.text}
                </div>
                <span className="mt-1 px-1 text-[10px] text-[#93a2a7]">{m.time}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#edf1ef] bg-white p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Write a supportive, professional message..."
                className="flex-1 rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-4 py-3 text-[13px] outline-none focus:border-[#2f9c95]"
              />
              <button
                onClick={handleSend}
                className="btn btn-teal flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
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
