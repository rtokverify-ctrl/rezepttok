"""Integration tests: Full end-to-end workflows."""
from tests.conftest import auth_header, create_verified_user


SAMPLE_RECIPE = {
    "title": "Integration Pasta",
    "video_url": "/static/videos/test.mp4",
    "ingredients": [{"name": "Spaghetti", "amount": "500", "unit": "g"}],
    "steps": [{"order": 1, "instruction": "Kochen"}],
    "tags": ["Pasta"],
    "tips": "Al dente!"
}


def _get_my_id(client, token):
    return client.get("/my-profile", headers=auth_header(token)).json()["id"]


def test_full_user_flow(client):
    """Register (auto-verified) → Setup Profile → Upload → Feed."""
    # Register – now returns token directly
    r = client.post("/register", json={
        "username": "flowuser", "email": "flow@test.com",
        "password": "FlowPass1!", "age": 25
    })
    assert r.status_code == 200
    token = r.json()["access_token"]

    # Setup profile
    r = client.post("/update-profile",
                    data={"display_name": "Flow Chef", "bio": "Ich koche gerne"},
                    headers=auth_header(token))
    assert r.status_code == 200

    # Upload recipe
    r = client.post("/upload", json=SAMPLE_RECIPE, headers=auth_header(token))
    assert r.status_code == 200

    # Check feed
    feed = client.get("/feed", headers=auth_header(token)).json()
    assert len(feed) == 1
    assert feed[0]["chef"] == "Flow Chef"


def test_social_flow(client):
    """User A uploads → User B likes & comments → User A gets notifications."""
    token_a = create_verified_user(client, "chef_a", "a@test.com", "PassA123!")
    token_b = create_verified_user(client, "chef_b", "b@test.com", "PassB123!")

    # A uploads
    client.post("/upload", json=SAMPLE_RECIPE, headers=auth_header(token_a))
    feed = client.get("/feed", headers=auth_header(token_a)).json()
    recipe_id = feed[0]["id"]

    # B likes
    client.post(f"/recipes/{recipe_id}/like", headers=auth_header(token_b))

    # B comments
    client.post(f"/recipes/{recipe_id}/comments",
                json={"text": "Mega lecker!"},
                headers=auth_header(token_b))

    # B follows A
    a_id = _get_my_id(client, token_a)
    client.post(f"/users/{a_id}/toggle-follow", headers=auth_header(token_b))

    # A checks notifications – should have 3 (like + comment + follow)
    notifs = client.get("/notifications", headers=auth_header(token_a)).json()
    assert len(notifs) == 3
    types = {n["type"] for n in notifs}
    assert types == {"like", "comment", "follow"}


def test_chat_flow(client):
    """User A starts chat → sends message → User B reads → unread = 0."""
    token_a = create_verified_user(client, "chat_a", "ca@test.com", "PassA123!")
    token_b = create_verified_user(client, "chat_b", "cb@test.com", "PassB123!")
    b_id = _get_my_id(client, token_b)

    # A starts conversation
    conv = client.post(f"/conversations?user_id={b_id}", headers=auth_header(token_a))
    conv_id = conv.json()["conversation_id"]

    # A sends messages
    client.post(f"/conversations/{conv_id}/messages", json={"text": "Hey!"}, headers=auth_header(token_a))
    client.post(f"/conversations/{conv_id}/messages", json={"text": "Wie geht's?"}, headers=auth_header(token_a))

    # B checks unread
    convs = client.get("/conversations", headers=auth_header(token_b)).json()
    assert convs[0]["unread_count"] == 2

    # B marks as read
    client.post(f"/conversations/{conv_id}/read", headers=auth_header(token_b))

    # B checks again
    convs = client.get("/conversations", headers=auth_header(token_b)).json()
    assert convs[0]["unread_count"] == 0

    # B replies
    client.post(f"/conversations/{conv_id}/messages", json={"text": "Gut und dir?"}, headers=auth_header(token_b))

    # Full message history
    msgs = client.get(f"/conversations/{conv_id}/messages", headers=auth_header(token_a)).json()
    assert len(msgs) == 3


def test_save_flow(client):
    """Save recipe → create collection → add to collection → verify."""
    token = create_verified_user(client, "saver", "save@test.com", "SavePass1!")
    client.post("/upload", json=SAMPLE_RECIPE, headers=auth_header(token))
    feed = client.get("/feed", headers=auth_header(token)).json()
    recipe_id = feed[0]["id"]

    # Global save
    client.post(f"/recipes/{recipe_id}/toggle-global-save", headers=auth_header(token))

    # Create collection
    col = client.post("/collections", json={"name": "Lieblinge"}, headers=auth_header(token)).json()

    # Add to collection
    client.post(f"/recipes/{recipe_id}/toggle-collection/{col['id']}", headers=auth_header(token))

    # Verify saved videos
    saved = client.get("/my-saved-videos/all", headers=auth_header(token)).json()
    assert len(saved) >= 1

    # Verify collection videos
    col_vids = client.get(f"/collections/{col['id']}/videos", headers=auth_header(token)).json()
    assert len(col_vids) == 1
