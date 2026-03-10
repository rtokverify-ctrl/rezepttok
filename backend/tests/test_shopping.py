"""Tests for shopping_router: Shopping List CRUD."""
from tests.conftest import auth_header


def test_empty_shopping_list(client, auth_token):
    r = client.get("/shopping-list", headers=auth_header(auth_token))
    assert r.status_code == 200
    assert r.json() == []


def test_add_item(client, auth_token):
    r = client.post("/shopping-list",
                    json={"item": "Milch"},
                    headers=auth_header(auth_token))
    assert r.status_code == 200
    assert r.json()["item"] == "Milch"
    assert r.json()["completed"] is False


def test_toggle_item(client, auth_token):
    item = client.post("/shopping-list", json={"item": "Butter"},
                       headers=auth_header(auth_token)).json()

    r = client.post(f"/shopping-list/{item['id']}/toggle", headers=auth_header(auth_token))
    assert r.json()["completed"] is True

    r = client.post(f"/shopping-list/{item['id']}/toggle", headers=auth_header(auth_token))
    assert r.json()["completed"] is False


def test_delete_item(client, auth_token):
    item = client.post("/shopping-list", json={"item": "Eier"},
                       headers=auth_header(auth_token)).json()

    r = client.delete(f"/shopping-list/{item['id']}", headers=auth_header(auth_token))
    assert r.status_code == 200

    items = client.get("/shopping-list", headers=auth_header(auth_token)).json()
    assert len(items) == 0


def test_multiple_items(client, auth_token):
    client.post("/shopping-list", json={"item": "Mehl"}, headers=auth_header(auth_token))
    client.post("/shopping-list", json={"item": "Zucker"}, headers=auth_header(auth_token))
    client.post("/shopping-list", json={"item": "Salz"}, headers=auth_header(auth_token))

    items = client.get("/shopping-list", headers=auth_header(auth_token)).json()
    assert len(items) == 3
