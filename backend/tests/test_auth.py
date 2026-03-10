"""Tests for auth_router: Register, Login (auto-verify mode)."""
from tests.conftest import auth_header, create_verified_user


# ── REGISTER ─────────────────────────────────────────────────────────

def test_register_success(client):
    r = client.post("/register", json={
        "username": "newuser", "email": "new@test.com",
        "password": "SecurePass1!", "age": 20
    })
    assert r.status_code == 200
    assert "access_token" in r.json()
    assert "email" in r.json()


def test_register_duplicate_username(client):
    client.post("/register", json={
        "username": "dup", "email": "a@test.com",
        "password": "SecurePass1!", "age": 20
    })
    r = client.post("/register", json={
        "username": "dup", "email": "b@test.com",
        "password": "SecurePass1!", "age": 20
    })
    assert r.status_code == 400
    assert "vergeben" in r.json()["detail"]


def test_register_duplicate_email(client):
    client.post("/register", json={
        "username": "user1", "email": "same@test.com",
        "password": "SecurePass1!", "age": 20
    })
    r = client.post("/register", json={
        "username": "user2", "email": "same@test.com",
        "password": "SecurePass1!", "age": 20
    })
    assert r.status_code == 400


def test_register_too_young(client):
    r = client.post("/register", json={
        "username": "kid", "email": "kid@test.com",
        "password": "SecurePass1!", "age": 12
    })
    assert r.status_code == 400
    assert "16" in r.json()["detail"]


def test_register_invalid_email(client):
    r = client.post("/register", json={
        "username": "user", "email": "notanemail",
        "password": "SecurePass1!", "age": 20
    })
    assert r.status_code == 400


# ── LOGIN ────────────────────────────────────────────────────────────

def test_login_success(client):
    # Register first (auto-verified)
    create_verified_user(client, "loginuser", "login@test.com", "SecurePass1!")
    r = client.post("/login", data={"username": "loginuser", "password": "SecurePass1!"})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password(client):
    create_verified_user(client, "wrongpw", "wp@test.com", "SecurePass1!")
    r = client.post("/login", data={"username": "wrongpw", "password": "WrongPass1!"})
    assert r.status_code == 400


def test_login_with_email(client):
    create_verified_user(client, "emaillogin", "eml@test.com", "SecurePass1!")
    r = client.post("/login", data={"username": "eml@test.com", "password": "SecurePass1!"})
    assert r.status_code == 200
    assert "access_token" in r.json()
