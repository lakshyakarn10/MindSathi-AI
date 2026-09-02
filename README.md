# MindSaathi (AI-Powered Campus Mental Wellness Platform)

MindSaathi is a privacy-first, full-stack mental health and wellness companion system engineered specifically for higher education institutions. It bridges observational self-reflection, AI conversational grounding, longitudinal risk modeling, and seamless escalation to human campus counselors.

---

## Architecture Overview

```
                          ┌──────────────────────────┐
                          │   MindSaathi Frontend    │
                          │  (React 18 + TypeScript) │
                          └─────────────┬────────────┘
                                        │
                         REST APIs / WebSocket (Real-Time)
                                        │
                          ┌─────────────▼────────────┐
                          │     FastAPI Backend      │
                          │  (Python 3.11+ / asyncio)│
                          └──────┬──────┬──────┬─────┘
                                 │      │      │
            ┌────────────────────┘      │      └────────────────────┐
            ▼                           ▼                           ▼
┌────────────────────────┐ ┌────────────────────────┐ ┌────────────────────────┐
│      Safety Layer      │ │     Gemini 1.5 LLM     │ │ Multivariate Risk Engine│
│ ∙ Crisis Regex & Rule  │ │ ∙ Contextual Companion │ │ ∙ Wellness Indicator    │
│ ∙ Safety Interrupt     │ │ ∙ Structured Observer  │ │   (1.0 – 10.0 scale)    │
│ ∙ Immediate Tele-MANAS │ │ ∙ Offline Fallback     │ │ ∙ Longitudinal Baseline │
└────────────────────────┘ └────────────────────────┘ └────────────────────────┘
            │                           │                           │
            └────────────────────┬──────┴───────────────────────────┘
                                 │
                          ┌──────▼───────────┐
                          │  PostgreSQL DB   │
                          │ (SQLAlchemy ORM) │
                          └──────────────────┘
```

---

## Technology Stack

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy, Alembic, Pydantic v2, Pytest, Uvicorn, WebSockets.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Wouter, Radix UI.
- **AI & ML:** Google Gemini 1.5 Flash API, Custom Crisis Safety Filter, Multivariate Longitudinal Risk Engine.
- **Database:** PostgreSQL (Production) / SQLite (Test Suite).
- **Security & Privacy:** JWT Auth, Role-Based Access Control (RBAC), k-Anonymity ($k \ge 15$), zero-raw-message admin visibility.

---

## Key Features

1. **Daily Observational Check-Ins:**
   - Multi-factor reflection (Mood, Stress, Sleep, Energy, Academic Concerns).
   - Generates calibrated Wellness Score (0–100) and Wellness Risk Indicator (1.0–10.0).
2. **MindSaathi AI Companion:**
   - Empathetic conversational companion powered by Google Gemini 1.5 Flash.
   - Structured psychological theme and risk extraction.
   - Independent safety filter offering national 24/7 Tele-MANAS hotline (14416).
3. **Counselor Wellness Report:**
   - Clinical case view decomposing risk factors, behavioral shifts, and conversational themes.
   - Strict student privacy protection.
4. **Appointment Management:**
   - Supports `CHAT`, `VIDEO` (Google Meet), and `IN_PERSON` consultation modes.
   - State machine: `PENDING` $\to$ `CONFIRMED` / `REJECTED` / `RESCHEDULED`.
5. **Real-Time Student ↔ Counselor Chat:**
   - Real-time bidirectional WebSocket messaging with auto-reconnect and history persistence.
   - Live typing indicators and read receipts.
6. **Institutional Analytics with $k$-Anonymity:**
   - High-level cohort stress trends for administrators.
   - Automatic masking of cohorts with fewer than 15 students ($k < 15$).

---

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mindsaathi
JWT_SECRET_KEY=your-secure-jwt-secret-key-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=7
GEMINI_API_KEY=your-google-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
ENVIRONMENT=development
MIN_COHORT_PRIVACY_THRESHOLD=15
```

---

## Setup and Installation

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
```

### 2. Frontend Setup
```bash
cd client
npm install
```

---

## Running the Application

### Start Backend Dev Server
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation available at: `http://localhost:8000/docs`

### Start Frontend Dev Server
```bash
cd client
npm run dev
```
Client UI available at: `http://localhost:5000` (or Vite assigned port)

---

## Seeding Demo Accounts (Development Only)

Populate the database with pre-configured demo users:
```bash
cd backend
python scripts/seed_demo_data.py
```

### Demo Credentials

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Student** | `student@gtu.edu` | `Student@12345` | Alex River (2nd Year CSE) |
| **Counselor** | `counselor@gtu.edu` | `Counselor@12345` | Dr. Priya Sharma (Verified Lead Counselor) |
| **Admin** | `admin@gtu.edu` | `Admin@12345` | Prof. Rajesh Verma (Dean of Student Welfare) |

---

## Running Tests

### Backend Automated Test Suite
```bash
cd backend
python -m pytest
```
*Executes all 83 automated unit, integration, RBAC, WebSocket, and security tests with 100% pass rate.*

### Frontend Production Build Test
```bash
cd client
npm run build
```

---

## Security & Privacy Model

- **Zero-Secret Client Exposure:** `GEMINI_API_KEY` exists strictly on the server side and is never transmitted to the browser.
- **Administrative Privacy Boundary:** Institutional administrators can only access aggregate trends. Admins are strictly forbidden (`HTTP 403` / `WS 1008`) from viewing private chat messages, journal reflections, individual risk files, or raw companion logs.
- **$k$-Anonymity Protection:** Cohorts with fewer than 15 students ($k < 15$) are automatically redacted in institutional dashboards.
- **Strict Role Authorization:** All WebSocket and REST operations independently verify JWT authenticity and session ownership on the server side.

---

## Prototype Limitations

1. **Google Meet Links:** Video consultation links are provided directly by counselors during appointment confirmation rather than auto-generated via Google Workspace OAuth.
2. **Offline Fallback Mode:** In environments without internet or when `GEMINI_API_KEY` is omitted, MindSaathi smoothly engages an intelligent rule-based heuristic companion without crashing.
3. **Non-Diagnostic Scope:** AI-generated companion observations and Risk Indicators (1.0–10.0) serve purely as supportive observational cues and do not constitute clinical or medical diagnoses.
4. **Chat Topology:** Real-time WebSocket messaging is designed for direct 1-on-1 counseling sessions.
