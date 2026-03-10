"""Tests for notifications: Like/Follow/Comment trigger correct notifications."""
from tests.conftest import auth_header, create_verified_user


SAMPLE_RECIPE = {
    "title": "Notification Test",
    "video_url": "/static/videos/test.mp4",
    "ingredients": [{"name": "Test", "amount": "1", "unit": "x"}],
    "steps": [{"order": 1, "instruction": "Testen"}],
    "tags": ["Test"],
    "tips": None
}


def _get_my_id(client, token):
    return client.get("/my-profile", headers=auth_header(token)).json()["id"]


def _get_recipe_id(client, token):
    """Create a recipe and return its ID from the feed."""
    client.post("/upload", json=SAMPLE_RECIPE, headers=auth_header(token))
    feed = client.get("/feed", headers=auth_header(token)).json()
    return feed[0]["id"]


def test_like_creates_notification(client, auth_token, second_auth_token):
    recipe_id = _get_recipe_id(client, auth_token)

    # User2 likes it
    client.post(f"/recipes/{recipe_id}/like", headers=auth_header(second_auth_token))

    # User1 checks notifications
    notifs = client.get("/notifications", headers=auth_header(auth_token)).json()
    assert len(notifs) == 1
    assert notifs[0]["type"] == "like"


def test_follow_creates_notification(client, auth_token, second_auth_token):
    user1_id = _get_my_id(client, auth_token)

    # User2 follows User1
    client.post(f"/users/{user1_id}/toggle-follow", headers=auth_header(second_auth_token))

    # User1 checks notifications
    notifs = client.get("/notifications", headers=auth_header(auth_token)).json()
    assert any(n["type"] == "follow" for n in notifs)


def test_comment_creates_notification(client, auth_token, second_auth_token):
    recipe_id = _get_recipe_id(client, auth_token)

    # User2 comments
    client.post(f"/recipes/{recipe_id}/comments",
                json={"text": "Super!"},
                headers=auth_header(second_auth_token))

    notifs = client.get("/notifications", headers=auth_header(auth_token)).json()
    assert any(n["type"] == "comment" for n in notifs)


def test_self_like_no_notification(client, auth_token):
    """Liking your own recipe should NOT create a notification."""
    recipe_id = _get_recipe_id(client, auth_token)

    # Like own recipe
    client.post(f"/recipes/{recipe_id}/like", headers=auth_header(auth_token))

    notifs = client.get("/notifications", headers=auth_header(auth_token)).json()
    like_notifs = [n for n in notifs if n["type"] == "like"]
    assert len(like_notifs) == 0


def test_self_comment_no_notification(client, auth_token):
    """Commenting on your own recipe should NOT create a notification."""
    recipe_id = _get_recipe_id(client, auth_token)

    client.post(f"/recipes/{recipe_id}/comments",
                json={"text": "Mein eigener Kommentar"},
                headers=auth_header(auth_token))

    notifs = client.get("/notifications", headers=auth_header(auth_token)).json()
    comment_notifs = [n for n in notifs if n["type"] == "comment"]
    assert len(comment_notifs) == 0
