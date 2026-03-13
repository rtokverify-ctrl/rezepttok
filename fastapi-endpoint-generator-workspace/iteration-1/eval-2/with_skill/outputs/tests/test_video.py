from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_video():
    response = client.get("/videos/123")
    assert response.status_code in [200, 404]
