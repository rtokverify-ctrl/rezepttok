"""Tests for users_router: Profile, Follow."""
from tests.conftest import auth_header, create_verified_user


def test_get_my_profile(client, auth_token):
    r = client.get("/my-profile", headers=auth_header(auth_token))
    assert r.status_code == 200
    data = r.json()
    assert data["username"] == "testuser"
    assert "followers_count" in data
    assert "following_count" in data


def test_get_user_profile(client, auth_token, second_auth_token):
    # Get testuser's profile as testuser2
    my = client.get("/my-profile", headers=auth_header(auth_token))
    user_id = my.json()["id"]

    r = client.get(f"/users/{user_id}/profile", headers=auth_header(second_auth_token))
    assert r.status_code == 200
    assert r.json()["profile"]["username"] == "testuser"
    assert r.json()["profile"]["i_follow"] is False


def test_get_nonexistent_profile(client, auth_token):
    r = client.get("/users/99999/profile", headers=auth_header(auth_token))
    assert r.status_code == 404


def test_update_profile(client, auth_token):
    r = client.post("/update-profile",
        data={"display_name": "Neuer Name", "bio": "Meine Bio"},
        headers=auth_header(auth_token))
    assert r.status_code == 200

    profile = client.get("/my-profile", headers=auth_header(auth_token)).json()
    assert profile["display_name"] == "Neuer Name"
    assert profile["bio"] == "Meine Bio"


def test_follow_toggle(client, auth_token, second_auth_token):
    # Get user1's ID
    user1 = client.get("/my-profile", headers=auth_header(auth_token)).json()
    user1_id = user1["id"]

    # User2 follows User1
    r = client.post(f"/users/{user1_id}/toggle-follow", headers=auth_header(second_auth_token))
    assert r.status_code == 200
    assert r.json()["following"] is True

    # Check follower count
    profile = client.get(f"/users/{user1_id}/profile", headers=auth_header(second_auth_token)).json()
    assert profile["profile"]["followers_count"] == 1
    assert profile["profile"]["i_follow"] is True

    # Unfollow
    r = client.post(f"/users/{user1_id}/toggle-follow", headers=auth_header(second_auth_token))
    assert r.json()["following"] is False


def test_cannot_follow_self(client, auth_token):
    my = client.get("/my-profile", headers=auth_header(auth_token)).json()
    r = client.post(f"/users/{my['id']}/toggle-follow", headers=auth_header(auth_token))
    assert r.status_code == 400
