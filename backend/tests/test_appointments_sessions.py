from datetime import datetime, timedelta, timezone

def test_appointment_lifecycle(client, student_token, counselor_token):
    start_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()

    # 1. Student requests session
    req_res = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "session_type": "academic_stress",
            "mode": "video",
            "reason": "Midterm anxiety and time management",
            "scheduled_start": start_time,
            "duration_minutes": 45
        }
    )
    assert req_res.status_code == 200
    apt_data = req_res.json()["data"]
    apt_id = apt_data["id"]

    # 2. Counselor views appointment
    c_apts = client.get(
        "/api/v1/counselor/appointments",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert c_apts.status_code == 200
    assert len(c_apts.json()["data"]) >= 1

    # 3. Counselor accepts appointment
    accept_res = client.patch(
        f"/api/v1/counselor/appointments/{apt_id}/accept",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["data"]["status"] == "confirmed"

    # 4. Counselor completes session and records confidential notes
    notes_res = client.patch(
        f"/api/v1/counselor/appointments/{apt_id}/complete",
        headers={"Authorization": f"Bearer {counselor_token}"},
        json={
            "discussion_topics": "Exam pacing and relaxation strategies",
            "summary": "Student engaged well with breathing techniques",
            "recommendations": "Practice 5-min daily box breathing",
            "follow_up_required": True
        }
    )
    assert notes_res.status_code == 200
    assert "session_record_id" in notes_res.json()["data"]

    # 5. Student checks session history
    hist_res = client.get(
        "/api/v1/students/me/sessions",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert hist_res.status_code == 200
    assert len(hist_res.json()["data"]) >= 1
