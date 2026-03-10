"""Data integrity tests: Counts, consistency, cascading behavior."""
from tests.conftest import auth_header, create_verified_user


SAMPLE_RECIPE = {
    "title": "Integrity Test",
    "video_url": "/static/videos/test.mp4",
    "ingredients": [{"name": "Test", "amount": "1", "unit": "x"}],
    "steps": [{"order": 1, "instruction": "Testen"}],
    "tags": ["Test"],
    "tips": None
}


def _get_my_id(client, token):
    return client.get("/my-profile", headers=auth_header(token)).json()["id"]


def _get_recipe_id(client, token):
    client.post("/upload", json=SAMPLE_RECIPE, headers=auth_header(token))
    feed = client.get("/feed", headers=auth_header(token)).json()
    return feed[0]["id"]


def test_like_count_accuracy(client, auth_token, second_auth_token):
    """Like count in feed should match actual likes."""
    recipe_id = _get_recipe_id(client, auth_token)

    # Both users like
    client.post(f"/recipes/{recipe_id}/like", headers=auth_header(auth_token))
    client.post(f"/recipes/{recipe_id}/like", headers=auth_header(second_auth_token))

    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    assert feed[0]["likes_count"] == 2

    # One unlikes
    client.post(f"/recipes/{recipe_id}/like", headers=auth_header(auth_token))
    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    assert feed[0]["likes_count"] == 1


def test_follower_count_accuracy(client, auth_token, second_auth_token):
    """Follower count should match actual follows."""
    user1_id = _get_my_id(client, auth_token)

    # Follow
    client.post(f"/users/{user1_id}/toggle-follow", headers=auth_header(second_auth_token))
    profile = client.get(f"/users/{user1_id}/profile", headers=auth_header(second_auth_token)).json()
    assert profile["profile"]["followers_count"] == 1

    # Unfollow
    client.post(f"/users/{user1_id}/toggle-follow", headers=auth_header(second_auth_token))
    profile = client.get(f"/users/{user1_id}/profile", headers=auth_header(second_auth_token)).json()
    assert profile["profile"]["followers_count"] == 0


def test_comment_count_accuracy(client, auth_token, second_auth_token):
    """Comment count in feed should match actual comments."""
    recipe_id = _get_recipe_id(client, auth_token)

    client.post(f"/recipes/{recipe_id}/comments", json={"text": "Eins"}, headers=auth_header(auth_token))
    client.post(f"/recipes/{recipe_id}/comments", json={"text": "Zwei"}, headers=auth_header(second_auth_token))

    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    assert feed[0]["comments_count"] == 2


def test_unread_count_after_read(client, auth_token, second_auth_token):
    """Unread count should be 0 after marking as read."""
    user2_id = _get_my_id(client, second_auth_token)
    conv = client.post(f"/conversations?user_id={user2_id}", headers=auth_header(auth_token))
    conv_id = conv.json()["conversation_id"]

    # Send 3 messages
    for i in range(3):
        client.post(f"/conversations/{conv_id}/messages",
                    json={"text": f"Msg {i}"}, headers=auth_header(auth_token))

    # User2 unread = 3
    convs = client.get("/conversations", headers=auth_header(second_auth_token)).json()
    assert convs[0]["unread_count"] == 3

    # Mark read
    client.post(f"/conversations/{conv_id}/read", headers=auth_header(second_auth_token))

    # Unread = 0
    convs = client.get("/conversations", headers=auth_header(second_auth_token)).json()
    assert convs[0]["unread_count"] == 0


def test_recipe_delete_removes_from_feed(client, auth_token):
    """Deleted recipe should not appear in feed."""
    recipe_id = _get_recipe_id(client, auth_token)
    assert len(client.get("/feed", headers=auth_header(auth_token)).json()) == 1

    client.delete(f"/recipes/{recipe_id}", headers=auth_header(auth_token))
    assert len(client.get("/feed", headers=auth_header(auth_token)).json()) == 0


def test_saved_status_in_feed(client, auth_token):
    """i_saved_it flag should be accurate in feed."""
    recipe_id = _get_recipe_id(client, auth_token)

    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    assert feed[0]["i_saved_it"] is False

    client.post(f"/recipes/{recipe_id}/toggle-global-save", headers=auth_header(auth_token))
    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    assert feed[0]["i_saved_it"] is True
