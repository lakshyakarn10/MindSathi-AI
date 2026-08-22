def test_student_signup(client):
    res = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "new_student@mindsaathi.demo",
            "password": "StrongPassword123",
            "full_name": "New Student",
            "department": "Computer Science & Engineering",
            "year_of_study": 2,
            "preferred_language": "en"
        }
    )
    assert res.status_code == 201
    data = res.json()
    assert data["success"] is True
    assert data["role"] == "student"
    assert "anonymous_id" in data

def test_login_success(client, student_user):
    res = client.post(
        "/api/v1/auth/login",
        json={
            "email": student_user.email,
            "password": "password123",
            "role": "student"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == student_user.email

def test_login_invalid_password(client, student_user):
    res = client.post(
        "/api/v1/auth/login",
        json={
            "email": student_user.email,
            "password": "wrong_password_123",
            "role": "student"
        }
    )
    assert res.status_code == 401

def test_refresh_token(client, student_user):
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "password123"}
    )
    refresh_tok = login_res.json()["refresh_token"]

    res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_tok}
    )
    assert res.status_code == 200
    assert "access_token" in res.json()

def test_get_current_user_me(client, student_token):
    res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["email"] == "test_student@mindsaathi.demo"
    assert data["role"] == "student"
    assert "anonymous_id" in data
