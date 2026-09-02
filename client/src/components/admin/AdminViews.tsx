import React, { useState } from "react";
import {
  Activity, AlertTriangle, ArrowUpRight, BarChart3, Bell, BookOpen, Brain, Building2,
  Calendar, Check, ChevronDown, ChevronRight, Clock, Download, Eye, FileDown, FileText,
  Filter, HelpCircle, Info, Layers, Lock, LockKeyhole, Mail, MoreHorizontal, Plus,
  Printer, RefreshCw, Search, Shield, ShieldAlert, ShieldCheck, Sparkles, Stethoscope,
  TrendingDown, TrendingUp, UserCheck, UserPlus, UserRound, Users, Wind, X, Zap
} from "lucide-react";
import { toast } from "sonner";
import { usePortal } from "../../contexts/PortalContext";

// Privacy Banner Component
export function AdminPrivacyBanner() {
  return (
    <div className="mb-6 flex items-start gap-3.5 rounded-2xl border border-[#cfe4dd] bg-[#edf7f4] p-5 shadow-xs">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#23645f] shadow-xs">
        <ShieldCheck size={22} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-extrabold uppercase tracking-[.1em] text-[#23645f]">
            Privacy Protected Environment
          </span>
          <span className="rounded-full bg-[#d6ece4] px-2 py-0.5 text-[9px] font-bold text-[#1e5853]">
            ISO-27001 / FERPA Compliant
          </span>
        </div>
        <p className="mt-1 text-[13px] leading-5 text-[#446d67]">
          Administrative analytics are strictly aggregated and anonymized (minimum k-anonymity group size = 15).
          Individual student identities, private journal entries, and personal messages are <strong className="text-[#18314a]">not visible</strong> to administrators.
        </p>
      </div>
    </div>
  );
}

// 1. Admin Overview
export function AdminOverview({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { counselors, students, approveCounselor, approveStudent } = usePortal();
  const pendingCounselors = counselors.filter((c) => c.status === "Pending");
  const pendingStudents = students.filter((s) => s.status === "Pending");
  const pendingCount = pendingCounselors.length + pendingStudents.length;

  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      {/* Top Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="field-label mb-2 flex items-center gap-2">
            <Building2 size={13} className="text-[#2f9c95]" /> Institutional Administration · Campus Wellness Center
          </div>
          <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a] md:text-[32px]">
            Campus Wellness & Approvals
          </h1>
          <p className="mt-1.5 text-[14px] text-[#718189]">
            Institutional governance, user verifications, and privacy-preserving insights.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate("Reports")}
            className="flex items-center gap-2 rounded-xl border border-[#dce6e2] bg-white px-3.5 py-2.5 text-[12px] font-bold text-[#536b75] hover:border-[#2f9c95] transition"
          >
            <FileDown size={15} className="text-[#2f9c95]" /> Generate Report
          </button>
          <button
            onClick={() => onNavigate("Counselor Management")}
            className="btn btn-teal flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-bold"
          >
            <UserCheck size={15} /> User Approvals ({pendingCount} Pending)
          </button>
        </div>
      </div>

      {/* Prominent Privacy Banner */}
      <AdminPrivacyBanner />

      {/* Top Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="card p-5">
          <div className="field-label">Active Students</div>
          <div className="mt-2 text-[30px] font-extrabold text-[#18314a]">
            {students.filter(s => s.status === "Active").length + 4280}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#23645f]">
            <TrendingUp size={13} /> +12% this semester
          </div>
        </div>

        <div className="card signal-line p-5">
          <div className="field-label">Average Wellness</div>
          <div className="mt-2 text-[30px] font-extrabold text-[#18314a]">72%</div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#23645f]">
            <TrendingUp size={13} /> +4.2% this month
          </div>
        </div>

        <div className="card signal-line amber p-5">
          <div className="field-label">Pending Verifications</div>
          <div className="mt-2 text-[30px] font-extrabold text-[#b45b53]">{pendingCount}</div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#9a602a]">
            {pendingStudents.length} Students · {pendingCounselors.length} Counselors
          </div>
        </div>

        <div className="card p-5">
          <div className="field-label">Campus Counselors</div>
          <div className="mt-2 text-[30px] font-extrabold text-[#18314a]">
            {counselors.filter(c => c.status === "Active").length} Active
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#23645f]">
            <TrendingUp size={13} /> 100% capacity ready
          </div>
        </div>

        <div className="card p-5">
          <div className="field-label">Counseling Sessions</div>
          <div className="mt-2 text-[30px] font-extrabold text-[#18314a]">284</div>
          <div className="mt-1 text-[11px] text-[#76878e]">18 min avg response</div>
        </div>
      </div>

      {/* Main Grid: Campus Trends & Department Analytics */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        {/* Campus Trend Chart */}
        <section className="card p-6">
          <div className="flex items-center justify-between border-b border-[#edf1ef] pb-4">
            <div>
              <div className="field-label">Campus Wellbeing Index</div>
              <h2 className="mt-1 text-[18px] font-bold text-[#18314a]">Quarterly Emotional Health Trend</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#2f9c95]" />
              <span className="text-[12px] font-semibold text-[#546b73]">Campus Average</span>
            </div>
          </div>

          <div className="relative mt-6 h-[220px] w-full">
            <svg className="h-full w-full" viewBox="0 0 700 220" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendGradAdmin" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2f9c95" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2f9c95" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0 140 C100 130 200 90 300 105 S500 65 700 45 L700 220 L0 220 Z"
                fill="url(#trendGradAdmin)"
              />
              <path
                d="M0 140 C100 130 200 90 300 105 S500 65 700 45"
                fill="none"
                stroke="#2f9c95"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </section>

        {/* High Stress Departments */}
        <section className="card p-6">
          <div className="flex items-center justify-between border-b border-[#edf1ef] pb-4">
            <div>
              <div className="field-label">Cohort Analysis</div>
              <h2 className="mt-1 text-[18px] font-bold text-[#18314a]">Stress Level by Department</h2>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {[
              { dept: "Computer Science & Engineering", stress: 42, students: 840, tag: "Midterm Prep Peak", color: "bg-[#c96862]" },
              { dept: "Electronics & Communication", stress: 36, students: 620, tag: "Lab Exam Load", color: "bg-[#d28b47]" },
              { dept: "Mechanical Engineering", stress: 28, students: 510, tag: "Normal Baseline", color: "bg-[#2f9c95]" },
              { dept: "Management Studies", stress: 24, students: 390, tag: "Manageable", color: "bg-[#2f9c95]" },
            ].map((d) => (
              <div key={d.dept} className="rounded-xl border border-[#edf2ef] bg-[#fbfdfc] p-3.5">
                <div className="flex items-center justify-between text-[13px] font-bold text-[#18314a]">
                  <span>{d.dept}</span>
                  <span className="text-[12px] text-[#718288]">{d.stress}% elevated</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[#edf1ef]">
                  <div className={`h-2 rounded-full ${d.color}`} style={{ width: `${d.stress * 2}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] text-[#86979c]">
                  <span>{d.students} students</span>
                  <span>{d.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Pending Verifications & Quick Actions */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Pending Student Registrations */}
        <section className="card p-6 border-t-4 border-[#2f9c95]">
          <div className="flex items-center justify-between">
            <div>
              <div className="field-label text-[#23645f]">Student Onboarding</div>
              <h3 className="mt-1 text-[17px] font-bold text-[#18314a]">Pending Students ({pendingStudents.length})</h3>
            </div>
            <button
              onClick={() => onNavigate("Counselor Management")}
              className="text-[12px] font-bold text-[#23645f] hover:underline"
            >
              Review all →
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {pendingStudents.length === 0 ? (
              <div className="rounded-xl bg-[#f4f8f6] p-4 text-center text-[12px] text-[#6d7e86]">
                ✓ All student registration requests have been reviewed.
              </div>
            ) : (
              pendingStudents.slice(0, 3).map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-[#e4eae7] bg-[#fbfdfc] p-3.5">
                  <div>
                    <div className="text-[13px] font-bold text-[#18314a]">{s.name}</div>
                    <div className="text-[11px] text-[#74878e]">{s.department} · Year {s.yearOfStudy} · {s.anonymousId}</div>
                  </div>
                  <button
                    onClick={() => approveStudent(s.id)}
                    className="btn btn-teal rounded-lg px-3 py-1.5 text-[11px] font-bold"
                  >
                    Approve
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Pending Counselor Registrations */}
        <section className="card p-6 border-t-4 border-[#23645f]">
          <div className="flex items-center justify-between">
            <div>
              <div className="field-label text-[#23645f]">Staffing & Credentials</div>
              <h3 className="mt-1 text-[17px] font-bold text-[#18314a]">Pending Counselors ({pendingCounselors.length})</h3>
            </div>
            <button
              onClick={() => onNavigate("Counselor Management")}
              className="text-[12px] font-bold text-[#23645f] hover:underline"
            >
              Review all →
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {pendingCounselors.length === 0 ? (
              <div className="rounded-xl bg-[#f4f8f6] p-4 text-center text-[12px] text-[#6d7e86]">
                ✓ All counselor applications have been reviewed.
              </div>
            ) : (
              pendingCounselors.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-[#e4eae7] bg-[#fbfdfc] p-3.5">
                  <div>
                    <div className="text-[13px] font-bold text-[#18314a]">{c.name}</div>
                    <div className="text-[11px] text-[#74878e]">{c.department} · {c.empId}</div>
                  </div>
                  <button
                    onClick={() => approveCounselor(c.id)}
                    className="btn btn-teal rounded-lg px-3 py-1.5 text-[11px] font-bold"
                  >
                    Approve
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

// 2. Admin Wellness Trends
export function AdminWellnessTrends() {
  const [filterRange, setFilterRange] = useState("30 days");

  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="field-label mb-2">Longitudinal Observatory</div>
          <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a] md:text-[32px]">
            Campus Wellness Trends
          </h1>
          <p className="mt-1.5 text-[14px] text-[#718189]">
            Aggregate metrics tracking student wellness over extended timeframes.
          </p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-xl bg-[#f1f5f3] p-1 text-[11px] font-bold">
          {["7 days", "30 days", "90 days", "6 months", "1 year"].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRange(r)}
              className={`rounded-lg px-3 py-1.5 transition ${
                filterRange === r ? "bg-white text-[#23645f] shadow-xs" : "text-[#788a91] hover:text-[#23645f]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <AdminPrivacyBanner />

      <div className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
        <section className="card p-6">
          <div className="flex items-center justify-between border-b border-[#edf1ef] pb-4">
            <div>
              <div className="field-label">Overall Index</div>
              <h2 className="mt-1 text-[18px] font-bold text-[#18314a]">Average Wellness Score ({filterRange})</h2>
            </div>
            <div className="text-[26px] font-extrabold text-[#23645f]">72 / 100</div>
          </div>

          <div className="mt-3 text-[12px] text-[#6d7e86]">
            Last period comparison: <strong className="text-[#18314a]">68 / 100</strong> (+5.8% increase)
          </div>

          <div className="relative mt-6 h-[220px] w-full">
            <svg className="h-full w-full" viewBox="0 0 700 220" preserveAspectRatio="none">
              <path
                d="M0 140 C100 130 200 90 300 105 S500 65 700 45"
                fill="none"
                stroke="#2f9c95"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </section>

        <section className="card p-6">
          <div className="field-label">Multivariate Distribution</div>
          <h2 className="mt-1 text-[18px] font-bold text-[#18314a]">Key Wellness Components</h2>

          <div className="mt-5 space-y-4">
            {[
              { label: "Reported Mood Stability", value: "74%", delta: "+6% this term", color: "bg-[#2f9c95]" },
              { label: "Stress Manageability", value: "68%", delta: "+3% this term", color: "bg-[#80668b]" },
              { label: "Sleep Regularity (>6.5 hrs)", value: "59%", delta: "-4% during midterms", color: "bg-[#d28b47]" },
              { label: "Peer Support Connection", value: "81%", delta: "+9% this term", color: "bg-[#506c7d]" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[#edf2ef] bg-[#fbfdfc] p-3.5">
                <div className="flex justify-between text-[12px] font-bold text-[#18314a]">
                  <span>{s.label}</span>
                  <span>{s.value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[#edf1ef]">
                  <div className={`h-2 rounded-full ${s.color}`} style={{ width: s.value }} />
                </div>
                <div className="mt-1 text-[10px] text-[#7c8e94]">{s.delta}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

// 3. Admin Stress Insights & Hotspots
export function AdminStressInsights() {
  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      <div className="mb-6">
        <div className="field-label mb-2">Predictive & Pattern Analysis</div>
        <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a] md:text-[32px]">
          Campus Stress Insights
        </h1>
        <p className="mt-1.5 text-[14px] text-[#718189]">
          Identify aggregate systemic pressure points and AI-recommended institutional responses.
        </p>
      </div>

      <AdminPrivacyBanner />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="field-label">Academic Stress</div>
          <div className="mt-2 text-[30px] font-extrabold text-[#c96862]">42%</div>
          <div className="mt-1 text-[11px] text-[#76878e]">Coursework & deadlines</div>
        </div>
        <div className="card p-5">
          <div className="field-label">Exam Pressure</div>
          <div className="mt-2 text-[30px] font-extrabold text-[#d28b47]">38%</div>
          <div className="mt-1 text-[11px] text-[#76878e]">Midterm & finals</div>
        </div>
        <div className="card p-5">
          <div className="field-label">Placement Anxiety</div>
          <div className="mt-2 text-[30px] font-extrabold text-[#80668b]">27%</div>
          <div className="mt-1 text-[11px] text-[#76878e]">3rd & 4th year cohort</div>
        </div>
        <div className="card p-5">
          <div className="field-label">Sleep Disruptions</div>
          <div className="mt-2 text-[30px] font-extrabold text-[#506c7d]">31%</div>
          <div className="mt-1 text-[11px] text-[#76878e]">Under 5 hours/night</div>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <section className="card mt-6 p-6">
        <div className="flex items-center justify-between border-b border-[#edf1ef] pb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#2f9c95]" />
            <h2 className="text-[18px] font-bold text-[#18314a]">AI-Generated Institutional Recommendations</h2>
          </div>
          <span className="rounded-lg bg-[#edf6f4] px-2.5 py-1 text-[10px] font-bold text-[#23645f]">
            Review before institutional action
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Increase Counselor Hours During Exams",
              desc: "Stress signals spike +37% in weeks 8–10. Increasing counseling availability and drop-in slots in libraries mitigates crisis escalations.",
              priority: "High Impact",
            },
            {
              title: "Schedule Pre-Midterm Wellness Workshops",
              desc: "Conduct 15-minute group grounding and breathing seminars in lecture halls before major examinations.",
              priority: "Medium Impact",
            },
            {
              title: "Promote Night-Time Sleep Reset Exercises",
              desc: "Campus check-ins show 44% of students active after 2 AM. Boost in-app sleep stabilization awareness.",
              priority: "Preventative",
            },
          ].map((rec) => (
            <div key={rec.title} className="rounded-2xl border border-[#e2eae6] bg-[#fbfdfc] p-5 flex flex-col justify-between">
              <div>
                <span className="rounded-md bg-[#e6f3f0] px-2 py-0.5 text-[10px] font-bold text-[#23645f]">
                  {rec.priority}
                </span>
                <h3 className="mt-3 text-[15px] font-bold text-[#18314a]">{rec.title}</h3>
                <p className="mt-2 text-[12px] leading-5 text-[#6c7d84]">{rec.desc}</p>
              </div>
              <button
                onClick={() => toast.success(`Action item "${rec.title}" saved to Senate agenda`)}
                className="btn btn-teal mt-4 w-full rounded-xl py-2 text-[11px] font-bold"
              >
                Add to Action Plan
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

// 4. Admin Intervention Impact
export function AdminInterventionImpact() {
  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      <div className="mb-6">
        <div className="field-label mb-2">Efficacy & Adoption</div>
        <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a] md:text-[32px]">
          Intervention Impact
        </h1>
        <p className="mt-1.5 text-[14px] text-[#718189]">
          Aggregate student participation and reported stress changes across self-guided tools.
        </p>
      </div>

      <AdminPrivacyBanner />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="field-label">Breathing Exercises</div>
          <div className="mt-2 text-[28px] font-extrabold text-[#18314a]">1,248</div>
          <div className="mt-1 text-[11px] text-[#23645f]">7.8 → 5.9 reported stress</div>
        </div>
        <div className="card p-5">
          <div className="field-label">Grounding 5-4-3-2-1</div>
          <div className="mt-2 text-[28px] font-extrabold text-[#18314a]">842</div>
          <div className="mt-1 text-[11px] text-[#23645f]">7.4 → 6.1 reported stress</div>
        </div>
        <div className="card p-5">
          <div className="field-label">Thought Reframing</div>
          <div className="mt-2 text-[28px] font-extrabold text-[#18314a]">621</div>
          <div className="mt-1 text-[11px] text-[#23645f]">7.2 → 5.6 reported stress</div>
        </div>
        <div className="card p-5">
          <div className="field-label">Sleep Routines</div>
          <div className="mt-2 text-[28px] font-extrabold text-[#18314a]">512</div>
          <div className="mt-1 text-[11px] text-[#23645f]">6.9 → 5.1 reported stress</div>
        </div>
      </div>
    </main>
  );
}

// 5. User Management & Verification (Students and Counselors)
export function AdminCounselorManagement() {
  const {
    counselors, approveCounselor, rejectCounselor,
    students, approveStudent, rejectStudent, refreshAdminData
  } = usePortal();

  const [activeTab, setActiveTab] = useState<"students" | "counselors">("students");
  const [search, setSearch] = useState("");

  const pendingStudents = students.filter((s) => s.status === "Pending");
  const activeStudents = students.filter((s) => s.status === "Active");
  const pendingCounselors = counselors.filter((c) => c.status === "Pending");
  const activeCounselors = counselors.filter((c) => c.status === "Active");

  const filteredPendingStudents = pendingStudents.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) ||
           s.email.toLowerCase().includes(search.toLowerCase()) ||
           s.department.toLowerCase().includes(search.toLowerCase()) ||
           s.anonymousId.toLowerCase().includes(search.toLowerCase())
  );

  const filteredActiveStudents = activeStudents.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) ||
           s.email.toLowerCase().includes(search.toLowerCase()) ||
           s.department.toLowerCase().includes(search.toLowerCase()) ||
           s.anonymousId.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPendingCounselors = pendingCounselors.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
           c.email.toLowerCase().includes(search.toLowerCase()) ||
           c.department.toLowerCase().includes(search.toLowerCase()) ||
           c.empId.toLowerCase().includes(search.toLowerCase())
  );

  const filteredActiveCounselors = activeCounselors.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
           c.email.toLowerCase().includes(search.toLowerCase()) ||
           c.department.toLowerCase().includes(search.toLowerCase()) ||
           c.empId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="field-label mb-2">Institutional Governance</div>
          <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a] md:text-[32px]">
            User & Credential Approvals
          </h1>
          <p className="mt-1.5 text-[14px] text-[#718189]">
            Approve campus student registrations, verify counselor clinical credentials, and oversee institutional rosters.
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex gap-2 rounded-2xl bg-[#f0f5f3] p-1.5 border border-[#dce6e2]">
          <button
            onClick={() => { setActiveTab("students"); setSearch(""); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold transition ${
              activeTab === "students"
                ? "bg-white text-[#23645f] shadow-xs"
                : "text-[#6c7f86] hover:text-[#23645f]"
            }`}
          >
            <Users size={15} />
            Student Requests
            {pendingStudents.length > 0 && (
              <span className="rounded-full bg-[#e84855] text-white px-2 py-0.2 text-[10px] font-extrabold">
                {pendingStudents.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab("counselors"); setSearch(""); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold transition ${
              activeTab === "counselors"
                ? "bg-white text-[#23645f] shadow-xs"
                : "text-[#6c7f86] hover:text-[#23645f]"
            }`}
          >
            <Stethoscope size={15} />
            Counselor Credentials
            {pendingCounselors.length > 0 && (
              <span className="rounded-full bg-[#f39c12] text-white px-2 py-0.2 text-[10px] font-extrabold">
                {pendingCounselors.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search and refresh toolbar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9ba1]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab === "students" ? "students by name, email, department..." : "counselors by name, emp id..."}`}
            className="w-full rounded-xl border border-[#dfe6e3] bg-white pl-10 pr-4 py-2.5 text-[13px] outline-none focus:border-[#2f9c95]"
          />
        </div>
        <button
          onClick={refreshAdminData}
          className="flex items-center gap-2 rounded-xl border border-[#dfe6e3] bg-white px-3.5 py-2.5 text-[12px] font-bold text-[#556972] hover:border-[#2f9c95]"
        >
          <RefreshCw size={14} /> Refresh Queue
        </button>
      </div>

      {activeTab === "students" ? (
        <>
          {/* Pending Student Registrations Queue */}
          <section className="card p-6 border-l-4 border-[#2f9c95]">
            <div className="flex items-center justify-between border-b border-[#edf1ef] pb-4">
              <div>
                <div className="field-label text-[#23645f]">Verification Queue</div>
                <h2 className="mt-1 text-[18px] font-bold text-[#18314a]">
                  Pending Student Registrations ({pendingStudents.length})
                </h2>
              </div>
              <span className="rounded-full bg-[#edf6f4] px-3 py-1 text-[11px] font-bold text-[#23645f]">
                Institutional Administrator Authorization Required
              </span>
            </div>

            {filteredPendingStudents.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[#718189]">
                {pendingStudents.length === 0
                  ? "✓ No pending student registrations. All student accounts for your institution are approved."
                  : `No students matching "${search}"`}
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPendingStudents.map((s) => (
                  <div key={s.id} className="rounded-2xl border border-[#e2eae6] bg-[#fbfdfc] p-4 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-bold text-[#18314a]">{s.name}</span>
                        <span className="rounded-md bg-[#fff7e6] px-2 py-0.5 text-[10px] font-bold text-[#b36b00]">
                          Awaiting Approval
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-[12px] text-[#63757d]">
                        <div><strong className="text-[#18314a]">Email:</strong> {s.email}</div>
                        <div><strong className="text-[#18314a]">Department:</strong> {s.department}</div>
                        <div><strong className="text-[#18314a]">Year of Study:</strong> Year {s.yearOfStudy}</div>
                        <div><strong className="text-[#18314a]">Anonymous ID:</strong> <span className="font-mono text-[#23645f]">{s.anonymousId}</span></div>
                        <div className="text-[11px] text-[#97a6ab] pt-1">Registered {s.createdAt}</div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-2 border-t border-[#edf1ef] pt-3">
                      <button
                        onClick={() => approveStudent(s.id)}
                        className="btn btn-teal flex-1 rounded-xl py-2 text-[11px] font-bold"
                      >
                        <Check size={13} className="inline mr-1" /> Approve Student
                      </button>
                      <button
                        onClick={() => rejectStudent(s.id)}
                        className="rounded-xl border border-[#dfe6e3] px-3 py-2 text-[11px] font-bold text-[#71828a] hover:bg-[#fae9e7] hover:text-[#a94e4a]"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Active Students Roster */}
          <section className="card mt-6 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold text-[#18314a]">
                Approved Students Roster ({activeStudents.length})
              </h2>
              <span className="text-[11px] font-medium text-[#788a91]">
                Authorized for campus wellness bookings and peer support
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-[12px]">
                <thead>
                  <tr className="border-b border-[#edf1ef] text-[10px] font-bold uppercase tracking-[.1em] text-[#8a989d]">
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Anonymous ID</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Year</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f6f4]">
                  {filteredActiveStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-[#f8faf9]">
                      <td className="py-3.5 px-3 font-bold text-[#18314a]">{s.name}</td>
                      <td className="py-3.5 px-3 text-[#647881]">{s.email}</td>
                      <td className="py-3.5 px-3 font-mono text-[#23645f]">{s.anonymousId}</td>
                      <td className="py-3.5 px-3 text-[#647881]">{s.department}</td>
                      <td className="py-3.5 px-3 font-semibold">Year {s.yearOfStudy}</td>
                      <td className="py-3.5 px-3">
                        <span className="rounded-md bg-[#e6f3f0] px-2 py-0.5 text-[10px] font-bold text-[#23645f]">
                          Approved & Active
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => toast.info(`Account record active for ${s.name}`)}
                          className="text-[11px] font-bold text-[#23645f] hover:underline"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Pending Counselor Approvals Card */}
          <section className="card p-6 border-l-4 border-[#23645f]">
            <div className="flex items-center justify-between border-b border-[#edf1ef] pb-4">
              <div>
                <div className="field-label text-[#23645f]">Credential Verification</div>
                <h2 className="mt-1 text-[18px] font-bold text-[#18314a]">
                  Pending Counselor Registrations ({pendingCounselors.length})
                </h2>
              </div>
              <span className="rounded-full bg-[#fcf0e2] px-3 py-1 text-[11px] font-bold text-[#9a602a]">
                {pendingCounselors.length} Awaiting Verification
              </span>
            </div>

            {filteredPendingCounselors.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[#718189]">
                {pendingCounselors.length === 0
                  ? "✓ No pending counselor credentials. All staff accounts for your institution are approved."
                  : `No counselors matching "${search}"`}
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPendingCounselors.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-[#e2eae6] bg-[#fbfdfc] p-4 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-bold text-[#18314a]">{c.name}</span>
                        <span className="rounded-md bg-[#fff7e6] px-2 py-0.5 text-[10px] font-bold text-[#b36b00]">
                          Pending Credentials
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-[12px] text-[#63757d]">
                        <div><strong className="text-[#18314a]">Department:</strong> {c.department}</div>
                        <div><strong className="text-[#18314a]">Employee ID:</strong> {c.empId}</div>
                        <div><strong className="text-[#18314a]">Email:</strong> {c.email}</div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-2 border-t border-[#edf1ef] pt-3">
                      <button
                        onClick={() => approveCounselor(c.id)}
                        className="btn btn-teal flex-1 rounded-xl py-2 text-[11px] font-bold"
                      >
                        <Check size={13} className="inline mr-1" /> Approve Credentials
                      </button>
                      <button
                        onClick={() => rejectCounselor(c.id)}
                        className="rounded-xl border border-[#dfe6e3] px-3 py-2 text-[11px] font-bold text-[#71828a] hover:bg-[#fae9e7] hover:text-[#a94e4a]"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Active Counselors Table */}
          <section className="card mt-6 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold text-[#18314a]">
                Active Campus Counselors ({activeCounselors.length})
              </h2>
              <span className="text-[11px] font-medium text-[#788a91]">
                Authorized for clinical case management and session appointments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-[12px]">
                <thead>
                  <tr className="border-b border-[#edf1ef] text-[10px] font-bold uppercase tracking-[.1em] text-[#8a989d]">
                    <th className="py-3 px-3">Counselor</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Employee ID</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Active Cases</th>
                    <th className="py-3 px-3">Sessions (Month)</th>
                    <th className="py-3 px-3">Avg Response</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f6f4]">
                  {filteredActiveCounselors.map((c) => (
                    <tr key={c.id} className="hover:bg-[#f8faf9]">
                      <td className="py-3.5 px-3 font-bold text-[#18314a]">{c.name}</td>
                      <td className="py-3.5 px-3 text-[#647881]">{c.department}</td>
                      <td className="py-3.5 px-3 font-mono text-[#52666f]">{c.empId}</td>
                      <td className="py-3.5 px-3">
                        <span className="rounded-md bg-[#e6f3f0] px-2 py-0.5 text-[10px] font-bold text-[#23645f]">
                          Verified & Active
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold">{c.casesCount}</td>
                      <td className="py-3.5 px-3">{c.sessionsCount}</td>
                      <td className="py-3.5 px-3 font-semibold text-[#23645f]">{c.responseTime}</td>
                      <td className="py-3.5 px-3 text-right">
                        <button onClick={() => toast.info(`Managing clinical profile for ${c.name}`)} className="text-[11px] font-bold text-[#23645f] hover:underline">
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

// 6. Admin Reports Generator
export function AdminReports() {
  const [reportType, setReportType] = useState("Monthly Campus Wellness Report");
  const [generated, setGenerated] = useState(false);

  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      <div className="mb-6">
        <div className="field-label mb-2">Institutional Intelligence</div>
        <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a] md:text-[32px]">
          Campus Wellness Reports
        </h1>
        <p className="mt-1.5 text-[14px] text-[#718189]">
          Generate privacy-compliant aggregate reports for academic senate and wellbeing committees.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <section className="card p-6">
          <h2 className="text-[18px] font-bold mb-4">Report Builder</h2>
          <div className="space-y-4">
            <div>
              <label className="field-label block mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] p-2.5 text-[12px] outline-none focus:border-[#2f9c95]"
              >
                <option>Monthly Campus Wellness Report</option>
                <option>Stress Trends & Examination Impact</option>
                <option>Counseling Utilization & Capacity</option>
                <option>Intervention Efficacy & Engagement</option>
                <option>Comprehensive Annual Wellbeing Audit</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="field-label block mb-1">Start Date</label>
                <input type="text" defaultValue="Aug 01, 2026" className="w-full rounded-xl border border-[#dfe6e3] p-2.5 text-[12px]" />
              </div>
              <div>
                <label className="field-label block mb-1">End Date</label>
                <input type="text" defaultValue="Aug 22, 2026" className="w-full rounded-xl border border-[#dfe6e3] p-2.5 text-[12px]" />
              </div>
            </div>

            <div>
              <label className="field-label block mb-1">Cohort Filter</label>
              <select className="w-full rounded-xl border border-[#dfe6e3] p-2.5 text-[12px]">
                <option>All Academic Departments (4,281 students)</option>
                <option>Engineering Division Only</option>
                <option>Undergraduate Cohorts</option>
              </select>
            </div>

            <button
              onClick={() => {
                setGenerated(true);
                toast.success("Report successfully generated!");
              }}
              className="btn btn-teal w-full rounded-xl py-3 text-[12px] font-bold mt-2"
            >
              Generate Report
            </button>
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between border-b border-[#edf1ef] pb-4">
            <div>
              <div className="field-label">Report Preview</div>
              <h2 className="text-[18px] font-bold text-[#18314a]">{reportType}</h2>
            </div>
            {generated && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.success("PDF Export downloaded")}
                  className="flex items-center gap-1.5 rounded-xl border border-[#dfe6e3] bg-white px-3 py-2 text-[11px] font-bold text-[#23645f]"
                >
                  <FileDown size={14} /> Export PDF
                </button>
                <button
                  onClick={() => toast.success("CSV Dataset exported")}
                  className="flex items-center gap-1.5 rounded-xl border border-[#dfe6e3] bg-white px-3 py-2 text-[11px] font-bold text-[#556972]"
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-2xl bg-[#fbfdfc] border border-[#e5ece8] p-5 text-[12px] leading-6 text-[#455c65]">
            {generated ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-[#edf7f4] p-3 text-[#23645f] font-bold text-[11px]">
                  ✓ Privacy Guaranteed: Report verified to contain zero personally identifiable records.
                </div>
                <div>
                  <h3 className="font-bold text-[14px] text-[#18314a]">Executive Summary</h3>
                  <p>
                    During the reporting period (August 2026), 4,281 students engaged with MindSaathi across 18,420 check-in interactions.
                    Average campus wellness was recorded at 72%, reflecting a +4.2% stability improvement from the prior evaluation cycle.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-[14px] text-[#18314a]">Resource Recommendations</h3>
                  <p>
                    Elevated stress flags peaked around week 3 corresponding to mid-semester evaluations.
                    Recommended proactive resource allocation includes expanded counseling slots on Tuesdays and Thursdays between 2:00 PM – 5:00 PM.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-[#829298]">
                Click "Generate Report" to preview the aggregate document.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

// 7. Admin Privacy Center
export function AdminPrivacyCenter() {
  return (
    <main className="mobile-content mx-auto max-w-[1440px]">
      <div className="mb-6">
        <div className="field-label mb-2">Governance & Security</div>
        <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a] md:text-[32px]">
          Privacy & Data Controls
        </h1>
        <p className="mt-1.5 text-[14px] text-[#718189]">
          Review cryptographic anonymization standards, retention schedules, and institutional audit trails.
        </p>
      </div>

      <AdminPrivacyBanner />

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-[18px] font-bold text-[#18314a] mb-4">Privacy Architecture Standards</h2>
          <div className="space-y-3 text-[12px]">
            {[
              { title: "Student Identities", desc: "Protected via pseudonymized tokens (e.g. STU-2048). Raw identifiers are never sent to third parties.", status: "Active & Enforced" },
              { title: "Private Journals", desc: "Encrypted at rest with student-controlled keys. Zero administrative access permitted.", status: "Enforced" },
              { title: "K-Anonymity Safeguard", desc: "Department aggregations below 15 students are automatically masked.", status: "Active (k = 15)" },
              { title: "Audit Trail Logging", desc: "All counselor case reviews and administrative report generations are immutably logged.", status: "Immutable" },
            ].map((p) => (
              <div key={p.title} className="rounded-xl border border-[#edf2ef] bg-[#fbfdfc] p-3.5">
                <div className="flex justify-between font-bold text-[#18314a]">
                  <span>{p.title}</span>
                  <span className="text-[#23645f] text-[10px] bg-[#e6f3f0] px-2 py-0.5 rounded">{p.status}</span>
                </div>
                <p className="mt-1 text-[11px] text-[#64767c] leading-5">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-[18px] font-bold text-[#18314a] mb-4">Privacy Compliance Audit Log</h2>
          <div className="divide-y divide-[#f2f6f4] text-[11px]">
            {[
              { time: "10:42 AM", action: "Counselor reviewed risk indicator signals for STU-2048", actor: "Dr. Priya Sharma" },
              { time: "9:30 AM", action: "Admin generated Monthly Campus Wellness Report (aggregate)", actor: "Dean of Wellness" },
              { time: "Yesterday", action: "Counselor account approved following institutional credential check", actor: "Admin Cell" },
              { time: "Aug 20", action: "K-anonymity policy verified for CSE cohort export", actor: "Compliance Engine" },
            ].map((log, idx) => (
              <div key={idx} className="py-3 flex justify-between gap-4">
                <div>
                  <div className="font-bold text-[#18314a]">{log.action}</div>
                  <div className="text-[#84959b] mt-0.5">{log.actor}</div>
                </div>
                <div className="font-mono text-[#8a9ca2] shrink-0">{log.time}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

// 8. Admin Settings
export function AdminSettings() {
  return (
    <main className="mobile-content mx-auto max-w-[1080px]">
      <div className="mb-6">
        <div className="field-label mb-2">Configuration</div>
        <h1 className="text-[28px] font-extrabold tracking-[-.05em] text-[#18314a]">Institution & System Settings</h1>
      </div>

      <div className="card p-6 space-y-6">
        <div>
          <h2 className="text-[16px] font-bold text-[#18314a]">Institution Profile</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <label className="field-label block mb-1">University / College Name</label>
              <input type="text" defaultValue="Apex Institute of Technology" className="w-full rounded-xl border border-[#dfe6e3] p-2.5 text-[12px]" />
            </div>
            <div>
              <label className="field-label block mb-1">Campus Counseling Cell</label>
              <input type="text" defaultValue="Student Wellbeing Center" className="w-full rounded-xl border border-[#dfe6e3] p-2.5 text-[12px]" />
            </div>
          </div>
        </div>

        <div className="border-t border-[#edf1ef] pt-5">
          <h2 className="text-[16px] font-bold text-[#18314a]">Privacy Governance</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <label className="field-label block mb-1">Minimum Aggregate Cohort Size (k)</label>
              <input type="number" defaultValue={15} className="w-full rounded-xl border border-[#dfe6e3] p-2.5 text-[12px]" />
            </div>
            <div>
              <label className="field-label block mb-1">Data Retention Period</label>
              <select className="w-full rounded-xl border border-[#dfe6e3] p-2.5 text-[12px]">
                <option>1 Academic Year</option>
                <option>2 Academic Years</option>
                <option>Immediate Anonymization</option>
              </select>
            </div>
          </div>
        </div>

        <button onClick={() => toast.success("Institutional settings saved")} className="btn btn-teal rounded-xl px-6 py-2.5 text-[12px] font-bold">
          Save Settings
        </button>
      </div>
    </main>
  );
}
