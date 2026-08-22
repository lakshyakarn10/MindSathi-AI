def test_student_cannot_access_counselor_cases(client, student_token):
    res = client.get(
        "/api/v1/counselor/cases",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 403

def test_student_cannot_access_admin_analytics(client, student_token):
    res = client.get(
        "/api/v1/admin/analytics/overview",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 403

def test_counselor_cannot_access_admin_reports(client, counselor_token):
    res = client.get(
        "/api/v1/admin/reports",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert res.status_code == 403

def test_admin_cannot_access_student_journal(client, admin_token):
    res = client.get(
        "/api/v1/journal",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 403

def test_counselor_can_access_counselor_cases(client, counselor_token):
    res = client.get(
        "/api/v1/counselor/cases",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert res.status_code == 200
    assert "data" in res.json()

def test_admin_can_access_admin_overview(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/overview",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    assert res.json()["average_wellness"] == 72
