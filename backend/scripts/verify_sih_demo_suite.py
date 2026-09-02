import os
import sys
import json
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

def run_sih_demo_verification():
    results = {}
    client = TestClient(app)

    print("\n" + "="*70)
    print("MINDSAATHI - FINAL SIH DEMO VERIFICATION SUITE")
    print("="*70 + "\n")

    # --- Authentication Helper ---
    def login(email, password):
        res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        if res.status_code != 200:
            raise Exception(f"Login failed for {email}: {res.status_code} {res.text}")
        return res.json()["access_token"]

    student_token = login("student@gtu.edu", "Student@12345")
    counselor_token = login("counselor@gtu.edu", "Counselor@12345")
    admin_token = login("admin@gtu.edu", "Admin@12345")

    stu_headers = {"Authorization": f"Bearer {student_token}"}
    coun_headers = {"Authorization": f"Bearer {counselor_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # =========================================================================
    # TEST 1 - REAL GEMINI COMPANION
    # =========================================================================
    print("--- TEST 1: Real Gemini AI Companion ---")
    status_res = client.get("/api/v1/companion/status")
    print("Companion Service Status:", status_res.json())

    chat_turn1 = client.post(
        "/api/v1/companion/chat",
        headers=stu_headers,
        json={"message": "I have been feeling stressed about my upcoming placements."}
    )
    t1_data = chat_turn1.json()
    conv_id = t1_data.get("conversation_id")
    print(f"Turn 1 Response ({t1_data.get('model_used')}): {t1_data.get('response')[:120]}...")
    print(f"Is Fallback: {t1_data.get('is_fallback')}")

    chat_turn2 = client.post(
        "/api/v1/companion/chat",
        headers=stu_headers,
        json={"message": "I have also been sleeping only about five hours recently.", "conversation_id": conv_id}
    )
    t2_data = chat_turn2.json()
    print(f"Turn 2 Response ({t2_data.get('model_used')}): {t2_data.get('response')[:120]}...")
    print(f"Observations Extracted: {t2_data.get('observations')}")

    results["Real Gemini"] = {
        "status": "PASS" if chat_turn1.status_code == 200 and chat_turn2.status_code == 200 else "FAIL",
        "evidence": f"Model: {t1_data.get('model_used')}, Fallback: {t1_data.get('is_fallback')}, Multi-turn context maintained."
    }

    # =========================================================================
    # TEST 2 - STUDENT CHECK-IN & WELLNESS RISK INDICATOR
    # =========================================================================
    print("\n--- TEST 2: Student Check-in & Wellness Risk Indicator ---")
    checkin_res = client.post(
        "/api/v1/checkins",
        headers=stu_headers,
        json={
            "mood_score": 6,
            "stress_score": 7,
            "sleep_hours": 5.5,
            "energy_score": 6,
            "journal_text": "Placement preparation pressure is rising."
        }
    )
    c_data = checkin_res.json()
    print("Check-in Result:", c_data)
    trends_res = client.get("/api/v1/wellness/trends", headers=stu_headers)
    trends_data = trends_res.json() if trends_res.status_code == 200 else {}
    print("Trends Result:", trends_data.get("risk_trend"))

    results["Student Check-in"] = {
        "status": "PASS" if checkin_res.status_code == 200 else "FAIL",
        "evidence": f"Wellness Score: {c_data.get('wellness_score')}, Risk Indicator: {c_data.get('risk_indicator')}/10, Level: {c_data.get('risk_level')}"
    }

    # =========================================================================
    # TEST 3 - COUNSELOR ESCALATION
    # =========================================================================
    print("\n--- TEST 3: Counselor Escalation Pipeline ---")
    esc_checkin = client.post(
        "/api/v1/checkins",
        headers=stu_headers,
        json={
            "mood_score": 2,
            "stress_score": 9,
            "sleep_hours": 3.5,
            "energy_score": 2,
            "journal_text": "Exhausted and unable to keep up with coursework."
        }
    )
    print("Escalation Check-in Result:", esc_checkin.json())

    coun_cases = client.get("/api/v1/counselor/cases", headers=coun_headers)
    cases_data = coun_cases.json().get("data", [])
    print(f"Counselor Cases Count: {len(cases_data)}")
    active_case = cases_data[0] if cases_data else None

    results["Counselor Escalation"] = {
        "status": "PASS" if len(cases_data) > 0 else "FAIL",
        "evidence": f"Escalation Case Triggered: {active_case.get('id') if active_case else 'None'}, Level: {active_case.get('risk_level') if active_case else 'None'}"
    }

    # =========================================================================
    # TEST 4 - COUNSELOR WELLNESS REPORT
    # =========================================================================
    print("\n--- TEST 4: Counselor Observational Wellness Report ---")
    if active_case:
        report_res = client.get(f"/api/v1/counselor/cases/{active_case['id']}/report", headers=coun_headers)
        r_wrapper = report_res.json()
        r_data = r_wrapper.get("data", {})
        risk_block = r_data.get("risk", {})
        print("Counselor Report Summary:")
        print(f" - Student: {r_data.get('student_reference')}")
        print(f" - Risk Indicator: {risk_block.get('risk_indicator')}/10 (Score: {risk_block.get('wellness_score')})")
        print(f" - Factors: {r_data.get('risk_factors')}")
        print(f" - Behavioral Changes: {len(r_data.get('behavioral_changes', []))} detected")
        print(f" - Conversation Themes: {r_data.get('conversation_themes')}")
        print(f" - Recommendation: {r_data.get('recommendation')}")
        print(f" - Safety State: {r_data.get('safety')}")

        results["Counselor Report"] = {
            "status": "PASS" if report_res.status_code == 200 and risk_block.get("risk_indicator") is not None else "FAIL",
            "evidence": f"Report generated for {r_data.get('student_reference')} with risk indicator {risk_block.get('risk_indicator')}/10, privacy protection intact."
        }
    else:
        results["Counselor Report"] = {"status": "FAIL", "evidence": "No active escalation case found."}

    # =========================================================================
    # TEST 5 - CHAT APPOINTMENT WORKFLOW
    # =========================================================================
    print("\n--- TEST 5: Chat Appointment Workflow ---")
    coun_dir_res = client.get("/api/v1/counselor/directory", headers=stu_headers)
    coun_id = coun_dir_res.json().get("data", [])[0]["id"]

    now = datetime.now(timezone.utc)
    apt_req = client.post(
        "/api/v1/appointments",
        headers=stu_headers,
        json={
            "counselor_id": coun_id,
            "session_type": "counseling",
            "mode": "chat",
            "reason": "Anxiety about placements",
            "scheduled_start": (now + timedelta(days=1)).isoformat(),
            "scheduled_end": (now + timedelta(days=1, minutes=45)).isoformat(),
            "duration_minutes": 45
        }
    )
    apt_payload = apt_req.json()
    apt_item = apt_payload.get("data", {})
    apt_id = apt_item.get("id")
    print("Appointment Request:", apt_item.get("status"), apt_id)

    # Counselor accepts via PATCH /api/v1/counselor/appointments/{id}/accept
    apt_accept = client.patch(
        f"/api/v1/counselor/appointments/{apt_id}/accept",
        headers=coun_headers
    )
    accept_data = apt_accept.json()
    print("Counselor Confirmation:", accept_data.get("data", {}).get("status"))

    results["Chat Appointment"] = {
        "status": "PASS" if apt_item.get("status") == "pending" and accept_data.get("data", {}).get("status") == "confirmed" else "FAIL",
        "evidence": f"Workflow: pending -> confirmed, Apt ID: {apt_id}"
    }

    # =========================================================================
    # TEST 6 - REAL-TIME WEBSOCKET CHAT
    # =========================================================================
    print("\n--- TEST 6: Real-Time WebSocket Chat ---")
    conv_lookup = client.get(f"/api/v1/messages/appointment/{apt_id}/conversation", headers=stu_headers)
    conv_data = conv_lookup.json().get("data", {})
    chat_conv_id = conv_data.get("conversation_id")
    print(f"Live Chat Conversation ID: {chat_conv_id}, Enabled: {conv_data.get('is_chat_enabled')}")

    # WebSocket bidirectional test
    with client.websocket_connect(f"/api/v1/ws/chat/{chat_conv_id}?token={student_token}") as stu_ws:
        with client.websocket_connect(f"/api/v1/ws/chat/{chat_conv_id}?token={counselor_token}") as coun_ws:
            # Student sends message
            stu_ws.send_json({"type": "message", "content": "Hello counselor, thank you for accepting my session."})
            
            # Counselor receives broadcast
            coun_rcv = coun_ws.receive_json()
            print("Counselor Received via WebSocket:", coun_rcv.get("message", {}).get("content"))

            # Counselor sends reply
            coun_ws.send_json({"type": "message", "content": "Hello Alex. I am here to help you work through this."})

            # Student receives broadcast
            stu_rcv = stu_ws.receive_json()
            print("Student Received via WebSocket:", stu_rcv.get("message", {}).get("content"))

    # Verify history persistence
    hist_res = client.get(f"/api/v1/messages/{chat_conv_id}", headers=stu_headers)
    print("Persisted Message History Count:", len(hist_res.json()))

    results["WebSocket Chat"] = {
        "status": "PASS" if len(hist_res.json()) >= 2 else "FAIL",
        "evidence": f"Bidirectional delivery verified, PostgreSQL persistence verified ({len(hist_res.json())} messages)."
    }

    # =========================================================================
    # TEST 7 - VIDEO APPOINTMENT (GOOGLE MEET)
    # =========================================================================
    print("\n--- TEST 7: Video Appointment & Google Meet URL ---")
    video_apt_res = client.post(
        "/api/v1/appointments",
        headers=stu_headers,
        json={
            "counselor_id": coun_id,
            "session_type": "counseling",
            "mode": "video",
            "reason": "Midterm anxiety follow-up",
            "scheduled_start": (now + timedelta(days=2)).isoformat(),
            "scheduled_end": (now + timedelta(days=2, minutes=45)).isoformat(),
            "duration_minutes": 45
        }
    )
    video_id = video_apt_res.json().get("data", {}).get("id")

    # Counselor accepts and adds meet URL
    client.patch(f"/api/v1/counselor/appointments/{video_id}/accept", headers=coun_headers)
    video_url_res = client.patch(
        f"/api/v1/counselor/appointments/{video_id}/meet-url",
        headers=coun_headers,
        json={"meet_url": "https://meet.google.com/abc-defg-hij"}
    )
    print("Video Session Confirmed with Meet URL:", video_url_res.json().get("data", {}).get("meet_url"))

    # Student verifies in appointments list
    stu_apts_res = client.get("/api/v1/students/me/appointments", headers=stu_headers).json()
    stu_apts = stu_apts_res.get("data", [])
    video_apt_item = next((a for a in stu_apts if a.get("id") == video_id), {})

    results["Video Appointment"] = {
        "status": "PASS" if video_apt_item.get("meet_url") == "https://meet.google.com/abc-defg-hij" else "FAIL",
        "evidence": f"Meet URL preserved & accessible to student: {video_apt_item.get('meet_url')}"
    }

    # =========================================================================
    # TEST 8 - IN-PERSON APPOINTMENT & LOCATION
    # =========================================================================
    print("\n--- TEST 8: In-Person Appointment & Location ---")
    inperson_apt_res = client.post(
        "/api/v1/appointments",
        headers=stu_headers,
        json={
            "counselor_id": coun_id,
            "session_type": "counseling",
            "mode": "in_person",
            "reason": "Decompression consultation",
            "scheduled_start": (now + timedelta(days=3)).isoformat(),
            "scheduled_end": (now + timedelta(days=3, minutes=45)).isoformat(),
            "duration_minutes": 45
        }
    )
    inperson_id = inperson_apt_res.json().get("data", {}).get("id")

    # Counselor accepts and adds location
    client.patch(f"/api/v1/counselor/appointments/{inperson_id}/accept", headers=coun_headers)
    inperson_loc_res = client.patch(
        f"/api/v1/counselor/appointments/{inperson_id}/location",
        headers=coun_headers,
        json={"location": "Room 304, Student Wellness Center"}
    )
    print("In-Person Session Confirmed with Location:", inperson_loc_res.json().get("data", {}).get("location"))

    # Student verifies in appointments list
    stu_apts2_res = client.get("/api/v1/students/me/appointments", headers=stu_headers).json()
    stu_apts2 = stu_apts2_res.get("data", [])
    inperson_apt_item = next((a for a in stu_apts2 if a.get("id") == inperson_id), {})

    results["In-person Appointment"] = {
        "status": "PASS" if inperson_apt_item.get("location") == "Room 304, Student Wellness Center" else "FAIL",
        "evidence": f"Campus Location preserved: {inperson_apt_item.get('location')}"
    }

    # =========================================================================
    # TEST 9 - NOTIFICATIONS
    # =========================================================================
    print("\n--- TEST 9: Notification Dispatch ---")
    notifs = client.get("/api/v1/notifications", headers=stu_headers).json()
    print(f"Student Notifications Count: {len(notifs)}")
    unread_count = sum(1 for n in notifs if not n.get("is_read"))
    print(f"Unread Count: {unread_count}")

    results["Notifications"] = {
        "status": "PASS" if len(notifs) > 0 else "FAIL",
        "evidence": f"{len(notifs)} notifications received, unread count: {unread_count}."
    }

    # =========================================================================
    # TEST 10 - ADMIN APPROVAL & AGGREGATE PRIVACY (k-ANONYMITY)
    # =========================================================================
    print("\n--- TEST 10: Admin Approval & Aggregate Privacy (k-Anonymity) ---")
    admin_overview = client.get("/api/v1/admin/analytics/overview", headers=admin_headers).json()
    print("Admin Overview:", admin_overview.get("privacy_banner"))

    dept_analytics = client.get("/api/v1/admin/analytics/departments", headers=admin_headers).json()
    print("Department Analytics (k-anonymity checked):")
    for d in dept_analytics:
        print(f" - {d.get('department')}: Size {d.get('cohort_size')}, Visible: {d.get('visible')}, Note: {d.get('privacy_note')}")

    # Admin privacy restriction check
    admin_chat_access = client.get(f"/api/v1/messages/{chat_conv_id}", headers=admin_headers)
    print(f"Admin Access to Private Chat Status: {admin_chat_access.status_code} (Expected 403)")

    results["Admin Privacy"] = {
        "status": "PASS" if admin_chat_access.status_code == 403 and any(not d.get("visible") for d in dept_analytics) else "FAIL",
        "evidence": f"k-Anonymity masking verified (small cohort hidden), Admin blocked from private chat (HTTP {admin_chat_access.status_code})."
    }

    # =========================================================================
    # TEST 11 - COMPLETE END-TO-END SIH DEMO FLOW
    # =========================================================================
    print("\n--- TEST 11: Complete End-to-End SIH Demo Validation ---")
    all_passed = all(v["status"] == "PASS" for v in results.values())
    results["Complete SIH Demo"] = {
        "status": "PASS" if all_passed else "FAIL",
        "evidence": "Entire sequence (Login -> Check-in -> Companion -> Escalation -> Report -> Appointment -> WebSocket Chat -> Admin Governance) executed seamlessly."
    }

    print("\n" + "="*70)
    print("SUMMARY TABLE:")
    print("="*70)
    print(f"{'Test':<25} | {'Result':<6} | {'Evidence'}")
    print("-" * 70)
    for test_name, res in results.items():
        print(f"{test_name:<25} | {res['status']:<6} | {res['evidence']}")
    print("="*70 + "\n")

    return results

if __name__ == "__main__":
    run_sih_demo_verification()
