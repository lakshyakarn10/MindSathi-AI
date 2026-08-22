def test_create_daily_checkin(client, student_token):
    res = client.post(
        "/api/v1/checkins",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "mood_score": 8,
            "stress_score": 4,
            "energy_score": 7,
            "sleep_hours": 7.5,
            "sleep_quality": 8,
            "academic_stress": 4,
            "social_connection": 7,
            "journal_text": "Feeling productive and well rested today."
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert "checkin_id" in data
    assert data["wellness_score"] > 70
    assert data["risk_level"] == "low"
    assert data["emotion"] in ["calm", "optimistic"]
    assert "recommended_exercise" in data

def test_get_today_checkin(client, student_token):
    res = client.get(
        "/api/v1/checkins/today",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["has_checked_in_today"] is True
    assert data["data"]["mood_score"] == 8

def test_wellness_trends(client, student_token):
    res = client.get(
        "/api/v1/wellness/trends?period=7d",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["period"] == "7d"
    assert len(data["data"]) >= 1

def test_wellness_insights(client, student_token):
    res = client.get(
        "/api/v1/wellness/insights",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 200
    assert len(res.json()["data"]) >= 1
