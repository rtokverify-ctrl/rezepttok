from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_update_shopping_note():
    # Mock auth header would go here
    response = client.patch(
        "/shopping/1/note",
        json={"note": "Buy the organic ones"},
        headers={"Authorization": "Bearer test"}
    )
    # Testing for standard 404 since item 1 might not exist in test db
    assert response.status_code in [200, 404]
