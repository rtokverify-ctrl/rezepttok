from fastapi import APIRouter, WebSocket

router = APIRouter()

@router.websocket("/ws/chat/{chat_id}")
async def chat_endpoint(websocket: WebSocket, chat_id: str):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Message received: {data}")
