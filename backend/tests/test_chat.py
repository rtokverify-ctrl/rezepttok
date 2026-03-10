"""Tests for chat_router: Conversations, Messages, Access Control."""
from tests.conftest import auth_header, create_verified_user


def _get_my_id(client, token):
    return client.get("/my-profile", headers=auth_header(token)).json()["id"]


# ── CONVERSATIONS ────────────────────────────────────────────────────

def test_create_conversation(client, auth_token, second_auth_token):
    user2_id = _get_my_id(client, second_auth_token)

    r = client.post(f"/conversations?user_id={user2_id}", headers=auth_header(auth_token))
    assert r.status_code == 200
    assert "conversation_id" in r.json()


def test_create_duplicate_conversation(client, auth_token, second_auth_token):
    user2_id = _get_my_id(client, second_auth_token)

    r1 = client.post(f"/conversations?user_id={user2_id}", headers=auth_header(auth_token))
    r2 = client.post(f"/conversations?user_id={user2_id}", headers=auth_header(auth_token))

    assert r1.json()["conversation_id"] == r2.json()["conversation_id"]


def test_list_conversations(client, auth_token, second_auth_token):
    user2_id = _get_my_id(client, second_auth_token)
    client.post(f"/conversations?user_id={user2_id}", headers=auth_header(auth_token))

    r = client.get("/conversations", headers=auth_header(auth_token))
    assert r.status_code == 200
    assert len(r.json()) == 1


# ── MESSAGES ─────────────────────────────────────────────────────────

def test_send_and_get_messages(client, auth_token, second_auth_token):
    user2_id = _get_my_id(client, second_auth_token)
    conv = client.post(f"/conversations?user_id={user2_id}", headers=auth_header(auth_token))
    conv_id = conv.json()["conversation_id"]

    # Send message
    r = client.post(f"/conversations/{conv_id}/messages",
                    json={"text": "Hallo!"},
                    headers=auth_header(auth_token))
    assert r.status_code == 200
    assert r.json()["text"] == "Hallo!"

    # Get messages
    msgs = client.get(f"/conversations/{conv_id}/messages", headers=auth_header(auth_token))
    assert len(msgs.json()) == 1
    assert msgs.json()[0]["text"] == "Hallo!"


def test_message_order(client, auth_token, second_auth_token):
    user2_id = _get_my_id(client, second_auth_token)
    conv = client.post(f"/conversations?user_id={user2_id}", headers=auth_header(auth_token))
    conv_id = conv.json()["conversation_id"]

    client.post(f"/conversations/{conv_id}/messages", json={"text": "Erste"}, headers=auth_header(auth_token))
    client.post(f"/conversations/{conv_id}/messages", json={"text": "Zweite"}, headers=auth_header(auth_token))

    msgs = client.get(f"/conversations/{conv_id}/messages", headers=auth_header(auth_token)).json()
    assert msgs[0]["text"] == "Erste"
    assert msgs[1]["text"] == "Zweite"


# ── ACCESS CONTROL ───────────────────────────────────────────────────

def test_cannot_read_others_conversation(client, auth_token, second_auth_token):
    user2_id = _get_my_id(client, second_auth_token)
    conv = client.post(f"/conversations?user_id={user2_id}", headers=auth_header(auth_token))
    conv_id = conv.json()["conversation_id"]

    # Create a third user who's not part of this conversation
    third_token = create_verified_user(client, "user3", "u3@test.com", "TestPass789!")
    r = client.get(f"/conversations/{conv_id}/messages", headers=auth_header(third_token))
    assert r.status_code == 403


def test_cannot_send_to_others_conversation(client, auth_token, second_auth_token):
    user2_id = _get_my_id(client, second_auth_token)
    conv = client.post(f"/conversations?user_id={user2_id}", headers=auth_header(auth_token))
    conv_id = conv.json()["conversation_id"]

    third_token = create_verified_user(client, "user3b", "u3b@test.com", "TestPass789!")
    r = client.post(f"/conversations/{conv_id}/messages",
                    json={"text": "Hacked!"},
                    headers=auth_header(third_token))
    assert r.status_code == 403


# ── READ STATUS ──────────────────────────────────────────────────────

def test_mark_as_read(client, auth_token, second_auth_token):
    user2_id = _get_my_id(client, second_auth_token)
    conv = client.post(f"/conversations?user_id={user2_id}", headers=auth_header(auth_token))
    conv_id = conv.json()["conversation_id"]

    # User1 sends message
    client.post(f"/conversations/{conv_id}/messages", json={"text": "Hi"}, headers=auth_header(auth_token))

    # User2 checks unread
    convs = client.get("/conversations", headers=auth_header(second_auth_token)).json()
    assert convs[0]["unread_count"] >= 1

    # User2 marks as read
    r = client.post(f"/conversations/{conv_id}/read", headers=auth_header(second_auth_token))
    assert r.status_code == 200

    # Check again
    convs = client.get("/conversations", headers=auth_header(second_auth_token)).json()
    assert convs[0]["unread_count"] == 0
