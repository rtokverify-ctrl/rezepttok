from tests.conftest import auth_header

def test_share_shopping_list(client, auth_token, second_auth_token):
    # 1. User A creates a list
    list_resp = client.post("/shopping-lists", json={"name": "Shared Party"}, headers=auth_header(auth_token)).json()
    list_id = list_resp["id"]

    # 2. User A shares the list with User B
    r = client.post(f"/shopping-lists/{list_id}/share", json={"username": "testuser2"}, headers=auth_header(auth_token))
    assert r.status_code == 200
    assert "Shared Party" in [l["name"] for l in client.get("/shopping-lists", headers=auth_header(second_auth_token)).json()]

def test_shared_list_access(client, auth_token, second_auth_token):
    # 1. User A creates and adds an item
    list_resp = client.post("/shopping-lists", json={"name": "WG Einkauf"}, headers=auth_header(auth_token)).json()
    list_id = list_resp["id"]
    client.post(f"/shopping-lists/{list_id}/items", json={"item": "Bier"}, headers=auth_header(auth_token))

    # 2. User A shares it
    client.post(f"/shopping-lists/{list_id}/share", json={"username": "testuser2"}, headers=auth_header(auth_token))

    # 3. User B should now see the list in their GET /shopping-lists
    user_b_lists = client.get("/shopping-lists", headers=auth_header(second_auth_token)).json()
    has_shared_list = any(l["id"] == list_id and l["is_shared"] is True for l in user_b_lists)
    assert has_shared_list is True

    # 4. User B should be able to see the items and toggle them
    items = client.get(f"/shopping-lists/{list_id}/items", headers=auth_header(second_auth_token)).json()
    assert len(items) == 1
    assert items[0]["item"] == "Bier"

    item_id = items[0]["id"]
    t = client.post(f"/shopping-lists/items/{item_id}/toggle", headers=auth_header(second_auth_token))
    assert t.json()["completed"] is True
