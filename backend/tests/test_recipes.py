"""Tests for recipes_router: Feed, CRUD, Like, Comment, Save, Collections."""
from tests.conftest import auth_header, create_verified_user


SAMPLE_RECIPE = {
    "title": "Test Pasta",
    "video_url": "/static/videos/test.mp4",
    "ingredients": [{"name": "Nudeln", "amount": "500", "unit": "g"}],
    "steps": [{"order": 1, "instruction": "Wasser kochen"}],
    "tags": ["Pasta", "Schnell"],
    "tips": "Salz ins Wasser!"
}


def _create_recipe(client, token, recipe=None):
    r = client.post("/upload", json=recipe or SAMPLE_RECIPE, headers=auth_header(token))
    return r


# ── FEED ─────────────────────────────────────────────────────────────

def test_empty_feed(client, auth_token):
    r = client.get("/feed", headers=auth_header(auth_token))
    assert r.status_code == 200
    assert r.json() == []


def test_feed_with_recipe(client, auth_token):
    _create_recipe(client, auth_token)
    r = client.get("/feed", headers=auth_header(auth_token))
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["title"] == "Test Pasta"


# ── CREATE / DELETE ──────────────────────────────────────────────────

def test_create_recipe(client, auth_token):
    r = _create_recipe(client, auth_token)
    assert r.status_code == 200
    
    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    assert feed[0]["title"] == "Test Pasta"


def test_delete_own_recipe(client, auth_token):
    # Create and get recipe ID from feed
    _create_recipe(client, auth_token)
    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    recipe_id = feed[0]["id"]

    r = client.delete(f"/recipes/{recipe_id}", headers=auth_header(auth_token))
    assert r.status_code == 200

    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    assert len(feed) == 0


def test_delete_others_recipe(client, auth_token, second_auth_token):
    _create_recipe(client, auth_token)
    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    recipe_id = feed[0]["id"]

    r = client.delete(f"/recipes/{recipe_id}", headers=auth_header(second_auth_token))
    assert r.status_code == 403


# ── LIKE ─────────────────────────────────────────────────────────────

def test_like_toggle(client, auth_token):
    _create_recipe(client, auth_token)
    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    recipe_id = feed[0]["id"]

    # Like
    client.post(f"/recipes/{recipe_id}/like", headers=auth_header(auth_token))
    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    assert feed[0]["i_liked_it"] is True
    assert feed[0]["likes_count"] == 1

    # Unlike
    client.post(f"/recipes/{recipe_id}/like", headers=auth_header(auth_token))
    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    assert feed[0]["i_liked_it"] is False
    assert feed[0]["likes_count"] == 0


# ── COMMENTS ─────────────────────────────────────────────────────────

def test_comment_create_and_load(client, auth_token):
    _create_recipe(client, auth_token)
    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    recipe_id = feed[0]["id"]

    r = client.post(f"/recipes/{recipe_id}/comments",
                    json={"text": "Lecker!"},
                    headers=auth_header(auth_token))
    assert r.status_code == 200
    assert r.json()["text"] == "Lecker!"

    comments = client.get(f"/recipes/{recipe_id}/comments",
                          headers=auth_header(auth_token)).json()
    assert len(comments) == 1


# ── SAVE & COLLECTIONS ──────────────────────────────────────────────

def test_global_save_toggle(client, auth_token):
    _create_recipe(client, auth_token)
    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    recipe_id = feed[0]["id"]

    # Save
    r = client.post(f"/recipes/{recipe_id}/toggle-global-save", headers=auth_header(auth_token))
    assert r.json()["saved"] is True

    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    assert feed[0]["i_saved_it"] is True

    # Unsave
    r = client.post(f"/recipes/{recipe_id}/toggle-global-save", headers=auth_header(auth_token))
    assert r.json()["saved"] is False


def test_collection_create_and_save(client, auth_token):
    _create_recipe(client, auth_token)
    feed = client.get("/feed", headers=auth_header(auth_token)).json()
    recipe_id = feed[0]["id"]

    # Create collection
    col = client.post("/collections", json={"name": "Favoriten"}, headers=auth_header(auth_token))
    assert col.status_code == 200
    col_id = col.json()["id"]

    # Save recipe to collection
    r = client.post(f"/recipes/{recipe_id}/toggle-collection/{col_id}", headers=auth_header(auth_token))
    assert r.json()["active"] is True

    # Check collection videos
    vids = client.get(f"/collections/{col_id}/videos", headers=auth_header(auth_token)).json()
    assert len(vids) == 1

    # Remove from collection
    r = client.post(f"/recipes/{recipe_id}/toggle-collection/{col_id}", headers=auth_header(auth_token))
    assert r.json()["active"] is False


# ── TRENDING ─────────────────────────────────────────────────────────

def test_trending_recipes(client, auth_token):
    _create_recipe(client, auth_token)
    r = client.get("/recipes/trending", headers=auth_header(auth_token))
    assert r.status_code == 200
    data = r.json()["data"]
    assert len(data) >= 1
    assert data[0]["title"] == "Test Pasta"
    assert "views" in data[0]
