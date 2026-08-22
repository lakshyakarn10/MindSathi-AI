def test_admin_k_anonymity_masking(client, admin_token):
    res = client.get(
        "/api/v1/admin/analytics/departments",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    depts = res.json()

    # Find the small pilot cohort (<15 students)
    hidden_cohort = next((d for d in depts if d["department"] == "Robotics & AI Pilot"), None)
    assert hidden_cohort is not None
    assert hidden_cohort["visible"] is False
    assert "Data hidden to protect student privacy" in hidden_cohort["privacy_note"]

    # Larger cohorts should be visible
    cs_cohort = next((d for d in depts if d["department"] == "Computer Science & Engineering"), None)
    assert cs_cohort is not None
    assert cs_cohort["visible"] is True
    assert cs_cohort["cohort_size"] > 15

def test_admin_report_generation(client, admin_token):
    res = client.post(
        "/api/v1/admin/reports",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "type": "monthly_wellness",
            "start_date": "2026-08-01",
            "end_date": "2026-08-31"
        }
    )
    assert res.status_code == 200
    report = res.json()
    assert "id" in report
    assert "metrics" in report
    assert report["type"] == "monthly_wellness"

def test_admin_audit_logs(client, admin_token, db_session):
    from app.models.audit import AuditLog
    db_session.add(AuditLog(
        actor_user_id="ADMIN-1",
        actor_role="admin",
        action="TEST_ACTION",
        resource_type="system"
    ))
    db_session.commit()

    res = client.get(
        "/api/v1/admin/audit-logs",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    assert len(res.json()["data"]) >= 1
