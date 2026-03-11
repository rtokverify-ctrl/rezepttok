"""Tests for shopping_router: Multiple Shopping Lists CRUD."""
from tests.conftest import auth_header

def test_empty_shopping_lists(client, auth_token):
    r = client.get("/shopping-lists", headers=auth_header(auth_token))
    assert r.status_code == 200
    assert r.json() == []

def test_create_and_delete_list(client, auth_token):
    r = client.post("/shopping-lists", json={"name": "Wocheneinkauf"}, headers=auth_header(auth_token))
    assert r.status_code == 200
    list_id = r.json()["id"]
    assert r.json()["name"] == "Wocheneinkauf"

    r = client.delete(f"/shopping-lists/{list_id}", headers=auth_header(auth_token))
    assert r.status_code == 200

    r = client.get("/shopping-lists", headers=auth_header(auth_token))
    assert len(r.json()) == 0

def test_add_item_to_list(client, auth_token):
    # 1. Create list
    list_resp = client.post("/shopping-lists", json={"name": "Party"}, headers=auth_header(auth_token)).json()
    list_id = list_resp["id"]

    # 2. Add item
    r = client.post(f"/shopping-lists/{list_id}/items", json={"item": "Bier"}, headers=auth_header(auth_token))
    assert r.status_code == 200
    assert r.json()["item"] == "Bier"
    assert r.json()["completed"] is False
    assert r.json()["list_id"] == list_id

def test_toggle_item(client, auth_token):
    l = client.post("/shopping-lists", json={"name": "Test"}, headers=auth_header(auth_token)).json()
    item = client.post(f"/shopping-lists/{l['id']}/items", json={"item": "Butter"}, headers=auth_header(auth_token)).json()

    r = client.post(f"/shopping-lists/items/{item['id']}/toggle", headers=auth_header(auth_token))
    assert r.json()["completed"] is True

    r = client.post(f"/shopping-lists/items/{item['id']}/toggle", headers=auth_header(auth_token))
    assert r.json()["completed"] is False

def test_delete_item(client, auth_token):
    l = client.post("/shopping-lists", json={"name": "Test 2"}, headers=auth_header(auth_token)).json()
    item = client.post(f"/shopping-lists/{l['id']}/items", json={"item": "Eier"}, headers=auth_header(auth_token)).json()

    r = client.delete(f"/shopping-lists/items/{item['id']}", headers=auth_header(auth_token))
    assert r.status_code == 200

    items = client.get(f"/shopping-lists/{l['id']}/items", headers=auth_header(auth_token)).json()
    assert len(items) == 0

def test_multiple_items(client, auth_token):
    l = client.post("/shopping-lists", json={"name": "Backen"}, headers=auth_header(auth_token)).json()
    client.post(f"/shopping-lists/{l['id']}/items", json={"item": "Mehl"}, headers=auth_header(auth_token))
    client.post(f"/shopping-lists/{l['id']}/items", json={"item": "Zucker"}, headers=auth_header(auth_token))
    client.post(f"/shopping-lists/{l['id']}/items", json={"item": "Salz"}, headers=auth_header(auth_token))

    items = client.get(f"/shopping-lists/{l['id']}/items", headers=auth_header(auth_token)).json()
    assert len(items) == 3
