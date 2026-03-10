"""Security tests: Auth enforcement, access control, edge cases."""
from tests.conftest import auth_header, create_verified_user


SAMPLE_RECIPE = {
    "title": "Security Test",
    "video_url": "/static/videos/test.mp4",
    "ingredients": [{"name": "Test", "amount": "1", "unit": "x"}],
    "steps": [{"order": 1, "instruction": "Testen"}],
    "tags": ["Test"],
    "tips": None
}

# ── ALL ENDPOINTS REQUIRE AUTH ───────────────────────────────────────

PROTECTED_GET_ENDPOINTS = [
    "/feed",
    "/my-profile",
    "/my-videos",
    "/notifications",
    "/shopping-list",
    "/conversations",
    "/collections",
]


def test_all_endpoints_require_auth(client):
    """Every protected endpoint must return 401 without a token."""
    for url in PROTECTED_GET_ENDPOINTS:
        r = client.get(url)
        assert r.status_code == 401, f"GET {url} should require auth, got {r.status_code}"


# ── ACCESS CONTROL ───────────────────────────────────────────────────

def test_cannot_delete_others_recipe(client, auth_token, second_auth_token):
    client.post("/upload", json=SAMPLE_RECIPE, headers=auth_header(auth_token))
    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    recipe_id = feed[0]["id"]

    r = client.delete(f"/recipes/{recipe_id}", headers=auth_header(second_auth_token))
    assert r.status_code == 403


def test_cannot_read_others_chat(client, auth_token, second_auth_token):
    user2_id = client.get("/my-profile", headers=auth_header(second_auth_token)).json()["id"]
    conv = client.post(f"/conversations?user_id={user2_id}", headers=auth_header(auth_token))
    conv_id = conv.json()["conversation_id"]

    third = create_verified_user(client, "intruder", "hack@test.com", "HackPass1!")
    r = client.get(f"/conversations/{conv_id}/messages", headers=auth_header(third))
    assert r.status_code == 403


# ── EDGE CASES ───────────────────────────────────────────────────────

def test_nonexistent_recipe(client, auth_token):
    r = client.post("/recipes/99999/like", headers=auth_header(auth_token))
    assert r.status_code == 404


def test_nonexistent_conversation(client, auth_token):
    r = client.get("/conversations/99999/messages", headers=auth_header(auth_token))
    assert r.status_code == 404


def test_nonexistent_user_profile(client, auth_token):
    r = client.get("/users/99999/profile", headers=auth_header(auth_token))
    assert r.status_code == 404


def test_sql_injection_in_search(client, auth_token):
    """Search with SQL injection should not crash."""
    r = client.get("/search?q=' OR 1=1 --", headers=auth_header(auth_token))
    assert r.status_code == 200


def test_very_long_input(client, auth_token):
    """Extremely long strings should not crash the server."""
    long_text = "A" * 10000
    # First create a recipe so we have a valid ID
    client.post("/upload", json=SAMPLE_RECIPE, headers=auth_header(auth_token))
    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    recipe_id = feed[0]["id"]

    r = client.post(f"/recipes/{recipe_id}/comments",
                    json={"text": long_text},
                    headers=auth_header(auth_token))
    assert r.status_code in [200, 422]


def test_negative_ids(client, auth_token):
    r = client.get("/users/-1/profile", headers=auth_header(auth_token))
    assert r.status_code == 404

    r = client.get("/conversations/-1/messages", headers=auth_header(auth_token))
    assert r.status_code in [403, 404]


def test_zero_id(client, auth_token):
    r = client.post("/recipes/0/like", headers=auth_header(auth_token))
    assert r.status_code == 404
