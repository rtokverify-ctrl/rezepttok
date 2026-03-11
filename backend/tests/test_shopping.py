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

    # 2. Add item with quantity
    r = client.post(f"/shopping-lists/{list_id}/items", json={"item": "Bier", "quantity": "2 Kasten"}, headers=auth_header(auth_token))
    data = r.json()
    assert r.status_code == 200
    assert data["item"] == "Bier"
    assert data["quantity"] == "2 Kasten"
    assert data["completed"] is False
    assert data["list_id"] == list_id

def test_update_item(client, auth_token):
    # 1. Create list and item
    list_resp = client.post("/shopping-lists", json={"name": "Update Test"}, headers=auth_header(auth_token)).json()
    item_resp = client.post(f"/shopping-lists/{list_resp['id']}/items", json={"item": "Mehl", "quantity": "1kg"}, headers=auth_header(auth_token)).json()

    # 2. Update quantity
    r = client.patch(f"/shopping-lists/items/{item_resp['id']}", json={"quantity": "2kg"}, headers=auth_header(auth_token))
    assert r.status_code == 200
    assert r.json()["quantity"] == "2kg"
    assert r.json()["item"] == "Mehl" # Name should remain unchanged

    # 3. Update name
    r2 = client.patch(f"/shopping-lists/items/{item_resp['id']}", json={"item": "Dinkelmehl"}, headers=auth_header(auth_token))
    assert r2.status_code == 200
    assert r2.json()["item"] == "Dinkelmehl"
    assert r2.json()["quantity"] == "2kg"

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
