# MindSaathi — Comprehensive Project & Feature Documentation

> **MindSaathi** is an AI-powered, privacy-first mental health and wellness platform designed for educational institutions. It empowers students with self-guided wellness tools and confidential support, assists campus counselors with explainable early-risk triage, and provides institutional administrators with anonymized, aggregate campus wellness analytics.

---

## 📑 Table of Contents
1. [Core Design Philosophy & Privacy Architecture](#1-core-design-philosophy--privacy-architecture)
2. [Role-Based Access Control & Navigation](#2-role-based-access-control--navigation)
3. [Student Portal (`/student`) — Features & Buttons](#3-student-portal-student--features--buttons)
4. [Counselor Workspace (`/counselor`) — Features & Buttons](#4-counselor-workspace-counselor--features--buttons)
5. [Institutional Admin Portal (`/admin`) — Features & Buttons](#5-institutional-admin-portal-admin--features--buttons)
6. [Global Components & Shared Modals](#6-global-components--shared-modals)
7. [Comprehensive Button & Interaction Matrix](#7-comprehensive-button--interaction-matrix)
8. [Technical Architecture & State Management](#8-technical-architecture--state-management)

---

## 1. Core Design Philosophy & Privacy Architecture

MindSaathi is built around **privacy by design**, **calm aesthetics**, and **non-clinical observational AI**:

- **Human-Centered & Non-Diagnostic**: AI outputs are framed strictly as observational wellness patterns (e.g., *"Your stress has been slightly elevated this week"*) and **never** as medical diagnoses or psychiatric evaluations.
- **Strict Role-Based Segregation**:
  - **Students** control their personal wellness data, reflections, and appointment requests. Personal journal reflections remain encrypted and private.
  - **Counselors** access authorized cases identified through anonymous identifiers (`STU-2048`). Private reflections remain shielded unless explicitly shared with consent.
  - **Administrators** have access **strictly to aggregate, anonymized institutional trends**. Direct student identification is cryptographically blocked.
- **$k$-Anonymity Protection ($k \ge 15$)**: Cohorts with fewer than 15 students are automatically masked with *"Data hidden to protect student privacy"* badges to prevent de-anonymization.
- **Calm Visual Design ("Quiet Observatory")**: Deep slate navy (`#18314a`), restorative teal (`#2f9c95`), warm amber (`#d28b47`), soft coral (`#c96862`), and clean neutral backdrops (`#f7f8f5`) with micro-animations and typography.

---

## 2. Role-Based Access Control & Navigation

### 2.1 Supported Portals & URL Structure
| Role | Base URL | Primary Responsibility |
| :--- | :--- | :--- |
| **Student** | `/student` | Daily check-ins, AI companion, exercises, private journal, booking counselor support. |
| **Counselor** | `/counselor` | High-risk case review, triage queue, session scheduling, supportive messaging, intervention tracking. |
| **Administrator** | `/admin` | Campus-wide stress hotspots, semester trend analytics, counselor verification, privacy audits, report generation. |
| **Public / Guest** | `/`, `/login`, `/signup` | Product overview, role cards, institutional SSO, credential recovery. |

### 2.2 Access Restriction Safeguards
If an authenticated user attempts to access an unauthorized portal (e.g., a student visiting `/admin` or a counselor accessing `/admin`):
- An **Access Restricted** barrier is displayed informing the user of the role credential requirement.
- Provides a **"Return to My Space"** button.
- Provides a **"Switch Role (Demo Mode)"** button for SIH evaluators.

### 2.3 Instant Role Switcher (Topbar Profile Menu)
Located in the upper-right user avatar (`AS`, `PS`, or `DW`), this interactive dropdown allows one-click role switching between `Student`, `Counselor`, and `Admin` during live demonstrations with reactive state synchronization.

---

## 3. Student Portal (`/student`) — Features & Buttons

### 3.1 Overview Dashboard (`Home`)
- **Good Morning Header**: Displays localized date, personalized greeting (*"Good morning, Alex"*), and companion status.
- **Today's Wellbeing Card**:
  - **Composite Score Ring**: Radial progress indicator showing composite wellness score (e.g., `74 / 100`) and sentiment badge (*Doing okay*).
  - **Daily Vitals Bar**: Split statistics for `Mood (7/10)`, `Stress (5/10)`, `Energy (6/10)`, and `Sleep (6h 42m)`.
  - **Button**: `[Complete today's check-in]` → Opens the 5-Step Daily Check-in Wizard.
- **Quiet Observation Dark Panel**:
  - Highlights weekly observational insights (*"Your stress has been a little higher than usual this week"*).
  - **Button**: `[View insights]` → Routes to *My Wellness* analytics.
- **Longitudinal Trend Chart**: Dual-line graph tracking Mood (`Teal`) and Stress (`Lavender`) over the past 7 days with assignment correlation notes.
- **Upcoming Support Card**:
  - Displays scheduled appointment with counselor (Dr. Priya Sharma, In-Person/Video, Date & Time).
  - **Button**: `[View details]` → Displays appointment modal.
  - **Button**: `[Join session]` → Launches virtual consultation room (active 15 min prior).
- **Recommended For You**: Quick cards for *Box Breathing* (2 min) and *Thought Reframing* (5 min).
- **Support Orbit Footer**: Direct prompt (*"Talking to someone could help"*) with `[Request a session]` button.

---

### 3.2 Daily Check-in Wizard (`Check-in`)
An interactive 5-step reflection flow:
1. **Step 1 — Overall Feeling**: Select between `Great`, `Good`, `Okay`, `Stressed`, or `Low` with active highlight styling.
   - **Button**: `[Continue →]` → Advances to Step 2.
2. **Step 2 — Primary Focus / Stress Area**: Select between `Academics & Exams`, `Assignments & Projects`, `Placement & Internships`, `Sleep & Routine`, `Social & Relationships`, or `Personal Wellbeing`.
   - **Buttons**: `[Back]`, `[Continue →]` → Advances to Step 3.
3. **Step 3 — Sleep Quality & Duration**: Select between `< 5 hours`, `5 - 6 hours`, `6 - 7 hours`, `7 - 8 hours`, or `8+ hours`.
   - **Buttons**: `[Back]`, `[Continue →]` → Advances to Step 4.
4. **Step 4 — Private Notes (Optional)**: Freeform reflection text area stored strictly on the client.
   - **Buttons**: `[Back]`, `[Complete Check-in ✓]` → Submits check-in.
5. **Step 5 — Check-in Complete Summary**: Displays confirmation checkmark, summary review card, updated score, and return actions:
   - **Button**: `[Start New Check-in]` → Resets wizard to Step 1.
   - **Button**: `[Return to Dashboard]` → Navigates back to Student Home.

---

### 3.3 Interactive AI Companion (`AI Companion`)
- **Chat Feed**: Real-time non-diagnostic supportive chat with conversational timestamps.
- **Suggested Topic Chips**: Quick prompt buttons:
  - `[Try box breathing]` → Triggers breathing guidance.
  - `[Break down workload]` → Prompts step-by-step task decomposition.
  - `[Talk about exam stress]` → Initiates academic decompression conversation.
  - `[Just listen]` → Activates supportive reflective listening mode.
- **Message Input Form**: Text input with send button `[➤]` generating contextual, empathetic wellness responses.
- **Grounding Reset Card**: Quick-action card with `[Start Box Breathing]` button.
- **Counselor Escalation Link**: `[Schedule a confidential session →]` button.

---

### 3.4 Longitudinal Wellness Analytics (`My Wellness`)
- **7-Day Trend Chart**: High-resolution SVG wave graph mapping emotional variance across days.
- **Observation Callout**: Contextual note (e.g., *"Mood score improves on days with >7 hours of sleep"*).
- **Score Breakdown**:
  - `Mood stability trend (+18)`
  - `Manageable stress baseline (+14)`
  - `Sleep consistency (+8)`
  - `Check-in habit regularity (+7)`

---

### 3.5 Guided Exercises Library & Active Runner (`Exercises`)
- **Exercise Directory**:
  - **Box Breathing (2 min)**: 4-count nervous system regulation.
  - **Grounding 5-4-3-2-1 (5 min)**: Sensory physical awareness technique.
  - **Thought Reframing (5 min)**: Perspective shifting for recurring worries.
  - **Sleep Reset (8 min)**: Progressive evening wind-down.
- **Active Exercise Runner Modal**:
  - Interactive modal displaying an animated breathing circle.
  - Real-time countdown timer (`4s → 3s → 2s → 1s`).
  - Phase text indicator (`Inhale` ➔ `Hold` ➔ `Exhale` ➔ `Rest`).
  - **Button**: `[Finish Exercise]` or `[✕]` → Closes player.

---

### 3.6 Private Encrypted Journal (`Journal`)
- **Reflection Textarea**: Private notepad with client-side encryption indicator.
- **Button**: `[Save Reflection]`: Adds the entry to the immutable local reflection archive with timestamps.
- **Saved Reflections List**: Vertical chronological history of past personal entries.

---

### 3.7 Support & Session Booking (`Support`)
- **Campus Counselor Card**:
  - Details counselor availability (Mon–Fri, 9:00 AM–5:00 PM).
  - **Button**: `[Request a session]` → Opens the interactive appointment booking modal.
- **Emergency Resources Card**:
  - National crisis support guidelines.
  - **Button**: `[Tele-MANAS Helpline: 14416]` → Shows 24/7 toll-free mental health support details.

---

## 4. Counselor Workspace (`/counselor`) — Features & Buttons

### 4.1 Counselor Overview Dashboard (`Overview`)
- **Header**: Counselor greeting (*"Good morning, Dr. Sharma"*), date, and caseload context.
- **Top Metric Cards**:
  - **High Priority (`2`)**: Cases flagged for urgent clinical review.
  - **Needs Attention (`7`)**: Moderately elevated cases.
  - **Monitoring (`31`)**: Students undergoing active follow-ups.
  - **Follow-ups Today (`5`)**: Scheduled check-ins and appointments.
- **Priority Queue & Triage Table**:
  - Filter chips: `[All]`, `[High Risk]`, `[Medium Risk]`, `[Low Risk]`, `[New]`, `[Monitoring]`, `[Resolved]`.
  - Search bar: Filter cases in real-time by Anonymous Student ID (e.g., `STU-2048`).
  - Table Columns: `Anonymous ID`, `Risk Level Badge`, `Longitudinal Trend`, `Primary Risk Signals`, `Assigned Counselor`, `Status`, `Action`.
  - **Button**: `[Review Case →]` → Opens detailed Case Detail view.

---

### 4.2 Explainable AI Case Detail Page (`/counselor/cases/[id]`)
Detailed triage view for high-priority student cases (e.g., `STU-2048`):
- **Header & Back Navigation**: `[← Back to cases queue]` button.
- **Risk Overview Card**: High Risk badge (`82/100`), Declining trend, detected time.
- **Explainable AI Risk Factor Decomposition**:
  - Individual progress bars detailing why the risk engine flagged the case:
    - `Mood Score Decline (+21)`
    - `Stress Index Escalation (+17)`
    - `Sleep Duration Reduction (+12)`
    - `Journal Linguistic & Emotional Signal (+18)`
    - `Recent Check-in Irregularity (+14)`
    - `Crisis Keyword Indicator (+20)`
  - **Non-Clinical Disclaimer**: Highlights that weights are observational indicators.
- **Longitudinal Trend Chart**: Interactive 7-day, 30-day, and 90-day multi-metric charts for mood, stress, and sleep.
- **Private Journal Shield Section**:
  - Protected student journal records.
  - **Button**: `[View Shared Information (Consent Protected)]` → Confirms authorization and reveals consent-approved summary notes.
- **Action Hub & Workflow Buttons**:
  - **Button**: `[Contact Student]` → Opens direct supportive chat composer.
  - **Button**: `[Schedule Session]` → Opens calendar scheduling modal.
  - **Button**: `[Mark as Monitoring]` → Updates case lifecycle state.
  - **Button**: `[Resolve Case]` → Moves case to resolved status with audit entry.
- **Case Audit History**: Chronological log of counselor actions, notes, and status transitions.

---

### 4.3 Appointments & Calendar (`Appointments`)
- **Filter Tabs**: `[Today's Sessions]`, `[Upcoming Sessions]`, `[Past Sessions]`, `[Week Calendar View]`.
- **Appointment Cards**: Shows Student ID, topic, consultation mode (`In-person`, `Video`, `Phone`), time, and status.
- **Buttons**:
  - `[Join Video]` → Launches virtual consultation room.
  - `[View Notes]` → Displays consultation documentation.
  - `[+ New Appointment]` → Launches counselor scheduling modal.

---

### 4.4 Session History & Structured Summary Builder (`Sessions`)
- **Completed Sessions List**: Record of past counseling sessions with duration and status.
- **Structured Follow-up Summary Form**:
  - Text fields for `Discussion Areas & Key Themes`, `Recommended Coping Strategies`, and `Next Follow-up Date`.
  - Checkbox: `[x] Require Follow-up Monitoring`.
  - **Button**: `[Save Session Summary & Update Status]` → Commits notes and advances case status.

---

### 4.5 Confidential Supportive Messaging (`Messages`)
- **Split-Pane Layout**:
  - Left pane: Student conversation list (`STU-2048`, `STU-1932`, `STU-1044`, `STU-3120`) with unread badges.
  - Right pane: Active confidential message thread.
- **Message Composer**: Input box and `[Send Message]` button that delivers supportive responses while maintaining student anonymity.

---

### 4.6 Recommended Interventions Gallery (`Interventions`)
- **Intervention Cards**: Tracks completion volume and reported stress change for *Box Breathing*, *5-4-3-2-1 Grounding*, *Thought Reframing*, *Sleep Routine Reset*, and *Workload Breakdown*.
- **Reported Stress Impact**: Visual pill indicators (e.g., `7.8 → 5.1`, `-35% stress`).
- **Button**: `[Recommend to Case]` → Suggests intervention to active case.

---

### 4.7 Counselor Performance Analytics (`Analytics`)
- **Key Metrics**:
  - `Average Response Time: 18 min`
  - `Case Resolution Rate: 84%`
  - `Follow-up Adherence: 76%`
  - `Active Caseload: 12 students`
- **Charts**: Longitudinal weekly intake and resolution trends.

---

## 5. Institutional Admin Portal (`/admin`) — Features & Buttons

### 5.1 Institutional Overview (`Overview`)
- **Prominent Privacy Banner**: Highlights ISO-27001 / FERPA compliance, strict tokenization, and $k$-anonymity enforcement ($k \ge 15$).
- **Top Aggregate Metric Cards**:
  - **Participating Students (`4,281`)**: Campus coverage.
  - **Average Wellness (`72%`)**: +4% month-over-month.
  - **Elevated Stress Cohort (`18%`)**: -2% month-over-month.
  - **Check-in Participation (`64%`)**: +8% active habit rate.
  - **Counseling Sessions (`284`)**: Institutional utilization.
- **Campus Semester Trajectory Graph**: Aggregate wellness wave mapping normal academic weeks vs. exam periods.
- **Departmental Comparison & Privacy Masking**:
  - Displays average stress and participation across *Computer Science*, *Electronics*, *Mechanical*, and *Civil Engineering*.
  - Cohorts with $<15$ students display: *"Data hidden to protect student privacy"*.
- **Quick Links**: Direct buttons to `[View Stress Insights]`, `[Manage Counselors]`, and `[Generate Reports]`.

---

### 5.2 Campus Wellness Trends (`Wellness trends`)
- **Period Filter Buttons**: `[7 days]`, `[30 days]`, `[90 days]`, `[6 months]`, `[1 year]`.
- **Multivariate Distribution Graphs**: Aggregate breakdown of sleep consistency, academic stress indices, and check-in participation curves.

---

### 5.3 Campus Stress Hotspots & AI Recommendations (`Stress insights`)
- **Primary Stress Driver Breakdown**:
  - `Academic & Exam Workload (42%)`
  - `Examination Pressure (38%)`
  - `Placement & Career Anxiety (27%)`
  - `Sleep Pattern Disruptions (31%)`
- **Period Comparison Bars**: Normal Academic Period ($41\%$) vs. Examination Periods ($78\%$).
- **AI Institutional Recommendation Banner**:
  - Suggestions for resource allocation: *"Recommendation: Increase drop-in counselor availability and schedule guided relaxation sessions during mid-semester examination periods."*
  - **Button**: `[Add to Institutional Action Plan]` → Adds recommendation to executive notes.

---

### 5.4 Intervention Impact Analytics (`Intervention impact`)
- **Campus Engagement Statistics**:
  - `1,248 Breathing exercises completed`
  - `842 Grounding sessions`
  - `614 Thought reframing reflections`
- **Measured Outcome Metric**: Average stress score reduction of `2.4 points` post-exercise.

---

### 5.5 Counselor Staffing & Verification (`Counselor Management`)
- **Active Counselors Directory**: Table of verified counselors, employee IDs, assigned departments, active caseloads, and response times.
- **Pending Verification Queue**:
  - Lists applicant counselors awaiting institutional credential review.
  - **Button**: `[Approve]` → Verifies counselor, grants active clinical access, and issues confirmation notification.
  - **Button**: `[Reject]` → Rejects application and updates status.

---

### 5.6 Institutional Reports Generator (`Reports`)
- **Configuration Controls**:
  - **Report Type Dropdown**: `Monthly Campus Wellbeing Summary`, `Stress Hotspots & Academic Correlations`, `Counseling Center Utilization`, `Intervention Impact Analysis`.
  - **Date Range Dropdown**: `Current Month`, `Last Quarter`, `Semester to Date`, `Academic Year`.
  - **Department Filter**: `All Departments`, `Engineering`, `Sciences`, `Management`.
- **Live Report Preview**: Real-time structured report preview with executive summary, metric breakdowns, and departmental distributions.
- **Export Actions**:
  - **Button**: `[Export PDF Report]` → Generates formatted institutional PDF download.
  - **Button**: `[Export CSV Dataset]` → Exports anonymized aggregate data table.

---

### 5.7 Privacy, Governance & Audit Center (`Privacy & Data`)
- **Governance Standards Badges**: Cryptographic tokenization, zero individual tracking, FERPA / ISO-27001 compliance.
- **Immutable Compliance Audit Log**: Chronological log of administrative actions, data exports, verification approvals, and policy checks.
- **Button**: `[Run Compliance Check]` → Validates $k$-anonymity rules across all cohorts.

---

### 5.8 Institutional Settings (`Settings`)
- **University Profile**: Institution name, primary counseling center contact, and campus time zone.
- **Governance Parameters**: Minimum group size threshold ($k=15$) and automatic log retention schedules (90 days / 180 days / 1 year).
- **Button**: `[Save Configuration]` → Updates administrative policy settings.

---

## 6. Global Components & Shared Modals

### 6.1 Topbar Header
- **Logo & Breadcrumb**: Shows active space indicator (*Student Space*, *Counselor Workspace*, *Institutional Aggregate View*).
- **Search Button `[🔍]`**: Quick search modal trigger.
- **Notifications Bell Button `[🔔]`**:
  - Displays unread notification dot.
  - Opens the role-specific **Notifications Drawer** (*Session reminders, new high-priority cases, pending counselor verifications*).
  - Actions: `[Mark all as read]`, `[Preferences]`.
- **Log Out Button `[→ Log out]`**: Quick direct header logout action.
- **User Avatar Dropdown (`AS` / `PS` / `DW`)**:
  - Profile header with user name, email, and role badge.
  - **SIH Demo Role Switcher**: Quick-toggle buttons `[Student]`, `[Counselor]`, `[Admin]`.
  - Menu options: `[Account Profile]`, `[Privacy & Governance]`, `[Log out]`.

### 6.2 Sidebar Navigation
- **MindSaathi Brand Logo**: Top brand icon and tagline.
- **Workspace Navigation Buttons**: Dynamically displays navigation items according to active role.
- **Log Out Button `[Log out]`**: Prominent sidebar action.
- **Privacy Assurance Footer**: Displays active privacy guarantee tailored to current role.

### 6.3 Interactive Session Booking Modal (`InteractiveSessionModal`)
- Triggered by clicking `[Request a session]` or `[Schedule Session]`.
- **Consultation Mode Selector**:
  - `[Chat / Video]`
  - `[Phone]`
  - `[In-person]`
- **Support Topic Selector**:
  - `[Academic stress]`, `[Anxiety / worry]`, `[Sleep]`, `[Relationships]`, `[General wellbeing]`.
- **Preferred Time Selector**:
  - `[Today · 4:00 PM]`, `[Tomorrow · 10:00 AM]`, `[Tomorrow · 3:00 PM]`.
- **Button**: `[Schedule session →]`:
  - Adds appointment to counselor's schedule.
  - Updates case status to `Session Scheduled`.
  - Sends cross-portal notification to student and counselor.
  - Displays confirmation screen with `[Done]` button.

---

## 7. Comprehensive Button & Interaction Matrix

| Location | Button Label | Role | Action & Expected Outcome |
| :--- | :--- | :--- | :--- |
| **Topbar** | `Log out` | All | Logs out user, triggers success toast, and navigates to `/`. |
| **Topbar** | User Avatar (`AS`/`PS`/`DW`) | All | Toggles profile dropdown with elevated z-index above all cards. |
| **Topbar Dropdown** | `Student` | All | Switches active role to Student and routes to `/student`. |
| **Topbar Dropdown** | `Counselor` | All | Switches active role to Counselor and routes to `/counselor`. |
| **Topbar Dropdown** | `Admin` | All | Switches active role to Administrator and routes to `/admin`. |
| **Topbar** | `Bell Icon` | All | Toggles real-time notifications drawer for active role. |
| **Notifications** | `Mark all as read` | All | Clears unread notification indicators with toast confirmation. |
| **Sidebar** | `Log out` | All | Logs out user and returns to public landing page. |
| **Student Home** | `Complete today's check-in` | Student | Switches active view to 5-Step Daily Check-in Wizard. |
| **Student Home** | `View insights` | Student | Switches active view to *My Wellness* longitudinal analytics. |
| **Student Home** | `View details` | Student | Displays details of upcoming counseling session. |
| **Student Home** | `Join session` | Student | Launches virtual counseling room. |
| **Student Home** | `Request a session` | Student | Opens the interactive consultation scheduling modal. |
| **Student Check-in** | `Great`/`Good`/`Okay`/`Stressed`/`Low` | Student | Selects sentiment and enables Continue button. |
| **Student Check-in** | `Continue` | Student | Advances wizard to next step (Steps 1–4). |
| **Student Check-in** | `Back` | Student | Returns to preceding step in wizard. |
| **Student Check-in** | `Complete Check-in` | Student | Submits check-in, shows summary card, and updates scores. |
| **Student Check-in** | `Return to Dashboard` | Student | Navigates back to Student Home view. |
| **AI Companion** | `Topic Chips` | Student | Sends pre-built prompt (`Try box breathing`, `Exam stress`, etc.). |
| **AI Companion** | `Send Button [➤]` | Student | Submits custom text message and receives supportive AI reply. |
| **AI Companion** | `Start Box Breathing` | Student | Opens active breathing exercise modal runner. |
| **Exercises** | `Exercise Cards` | Student | Opens active exercise player modal with animated phase timer. |
| **Exercise Player** | `Finish Exercise` | Student | Closes exercise player and returns to library. |
| **Journal** | `Save Reflection` | Student | Encrypts and adds reflection to Saved Reflections archive. |
| **Support** | `Tele-MANAS Helpline: 14416` | Student | Displays 24/7 national mental health helpline information. |
| **Counselor Queue** | `Risk Filter Chips` | Counselor | Filters priority queue table (`All`, `High Risk`, `New`, etc.). |
| **Counselor Queue** | `Search Bar` | Counselor | Filters cases in real-time by Anonymous Student ID. |
| **Counselor Queue** | `Review Case →` | Counselor | Opens Case Detail triage view for selected student. |
| **Case Detail** | `← Back to cases queue` | Counselor | Returns to counselor priority queue table. |
| **Case Detail** | `7d / 30d / 90d` | Counselor | Toggles longitudinal wellness trend chart timeframe. |
| **Case Detail** | `View Shared Information` | Counselor | Confirms consent and reveals protected student summary notes. |
| **Case Detail** | `Contact Student` | Counselor | Opens direct confidential message composer for student. |
| **Case Detail** | `Schedule Session` | Counselor | Opens session scheduler modal for the active student. |
| **Case Detail** | `Mark as Monitoring` | Counselor | Updates case lifecycle status to `Monitoring`. |
| **Case Detail** | `Resolve Case` | Counselor | Transitions case to `Resolved` and adds audit trail note. |
| **Appointments** | `Join Video` | Counselor | Launches virtual counseling session link. |
| **Appointments** | `+ New Appointment` | Counselor | Opens consultation scheduling modal. |
| **Sessions** | `Save Session Summary` | Counselor | Commits structured consultation notes and updates status. |
| **Messages** | `Send Message` | Counselor | Delivers anonymous supportive message to student thread. |
| **Interventions** | `Recommend to Case` | Counselor | Suggests targeted intervention exercise to active case. |
| **Admin Overview** | `View Stress Insights` | Admin | Routes to campus stress hotspots analytics. |
| **Admin Overview** | `Manage Counselors` | Admin | Routes to counselor staffing and verification view. |
| **Admin Overview** | `Generate Reports` | Admin | Routes to custom report builder. |
| **Admin Trends** | `7d/30d/90d/6m/1y` | Admin | Toggles multi-period aggregate campus wellness curves. |
| **Admin Stress** | `Add to Action Plan` | Admin | Adds AI recommendation to institutional wellness notes. |
| **Admin Counselors** | `Approve` | Admin | Approves applicant counselor and activates clinical access. |
| **Admin Counselors** | `Reject` | Admin | Rejects applicant counselor registration. |
| **Admin Reports** | `Export PDF Report` | Admin | Generates formatted institutional summary PDF. |
| **Admin Reports** | `Export CSV Dataset` | Admin | Exports anonymized aggregate dataset table. |
| **Admin Privacy** | `Run Compliance Check` | Admin | Validates $k$-anonymity and tokenization integrity. |
| **Admin Settings** | `Save Configuration` | Admin | Saves university profile and retention settings. |
| **Access Restriction**| `Return to My Space` | All | Redirects user to their authorized dashboard. |
| **Access Restriction**| `Switch Role (Demo)` | All | Switches active role to requested portal in demo mode. |

---

## 8. Technical Architecture & State Management

### 8.1 State Engine (`PortalContext.tsx`)
A unified reactive context that manages:
- **Active Role & Case Tracking**: `role`, `setRole`, `cases`, `selectedCase`, `updateCaseStatus`.
- **Appointments & Schedules**: `appointments`, `scheduleAppointment`, `completeAppointment`.
- **Confidential Messaging**: `threads`, `activeThreadId`, `sendMessage`.
- **Staffing & Approvals**: `counselors`, `approveCounselor`, `rejectCounselor`.
- **Cross-Portal Notifications**: `notifications`, `addNotification`, `dismissNotification`.

### 8.2 Frontend Stack
- **Framework**: React 19 + TypeScript.
- **Routing**: `wouter` (lightweight declarative routing with URL synchronization).
- **Styling**: Tailwind CSS v4 with custom color tokens (`teal`, `navy`, `coral`, `amber`).
- **Icons**: `lucide-react`.
- **Notifications / Toasts**: `sonner`.
- **Dev / Build Engine**: Vite with HMR.

---

*Documentation updated and verified against active MindSaathi build.*
