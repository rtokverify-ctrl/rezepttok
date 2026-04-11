from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc
from datetime import datetime
from typing import List

from database import get_db
from models import User, Conversation, Message
from auth import get_current_user, SECRET_KEY, ALGORITHM
from schemas import MessageCreate, MessageOut, ConversationOut, ConversationUserOut
from jose import JWTError, jwt

router = APIRouter()

# ── Active WebSocket connections: user_id -> WebSocket ───────────────
active_connections: dict[int, WebSocket] = {}


# ── Helper: check if user is participant ─────────────────────────────
def get_conversation_for_user(conv_id: int, user_id: int, db: Session) -> Conversation:
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(404, "Conversation not found")
    if conv.user1_id != user_id and conv.user2_id != user_id:
        raise HTTPException(403, "Not your conversation")
    return conv


# ── GET /conversations ───────────────────────────────────────────────
@router.get("/conversations", response_model=List[ConversationOut])
def get_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    convs = (
        db.query(Conversation)
        .filter(or_(Conversation.user1_id == current_user.id, Conversation.user2_id == current_user.id))
        .order_by(desc(Conversation.updated_at))
        .all()
    )

    result = []
    for c in convs:
        other_id = c.user2_id if c.user1_id == current_user.id else c.user1_id
        other_user = db.query(User).filter(User.id == other_id).first()
        if not other_user:
            continue

        last_msg = (
            db.query(Message)
            .filter(Message.conversation_id == c.id)
            .order_by(desc(Message.id))
            .first()
        )

        unread = (
            db.query(func.count(Message.id))
            .filter(
                Message.conversation_id == c.id,
                Message.sender_id != current_user.id,
                Message.read == False,
            )
            .scalar()
        )

        result.append(ConversationOut(
            id=c.id,
            other_user=ConversationUserOut(
                id=other_user.id,
                username=other_user.username,
                avatar_url=other_user.avatar_url,
            ),
            last_message=last_msg.text if last_msg else None,
            last_message_time=last_msg.created_at if last_msg else None,
            unread_count=unread or 0,
        ))
    return result


# ── POST /conversations ──────────────────────────────────────────────
@router.post("/conversations")
def create_conversation(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot message yourself")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User not found")

    # Check if conversation already exists
    existing = (
        db.query(Conversation)
        .filter(
            or_(
                and_(Conversation.user1_id == current_user.id, Conversation.user2_id == user_id),
                and_(Conversation.user1_id == user_id, Conversation.user2_id == current_user.id),
            )
        )
        .first()
    )
    if existing:
        return {"conversation_id": existing.id}

    now = datetime.utcnow().isoformat()
    conv = Conversation(user1_id=current_user.id, user2_id=user_id, created_at=now, updated_at=now)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return {"conversation_id": conv.id}


# ── GET /conversations/{id}/messages ─────────────────────────────────
@router.get("/conversations/{conv_id}/messages", response_model=List[MessageOut])
def get_messages(conv_id: int, skip: int = 0, limit: int = 50, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conv = get_conversation_for_user(conv_id, current_user.id, db)

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(desc(Message.id))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return list(reversed(messages))


# ── POST /conversations/{id}/messages ────────────────────────────────
@router.post("/conversations/{conv_id}/messages", response_model=MessageOut)
async def send_message(conv_id: int, msg: MessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conv = get_conversation_for_user(conv_id, current_user.id, db)

    if not msg.text or not msg.text.strip():
        raise HTTPException(400, "Message cannot be empty")

    now = datetime.utcnow().isoformat()
    message = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        text=msg.text.strip(),
        created_at=now,
        read=False,
    )
    db.add(message)
    conv.updated_at = now
    db.commit()
    db.refresh(message)

    # Push to recipient via WebSocket if connected
    recipient_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id
    
    # WebSocket Push (Real-time)
    if recipient_id in active_connections:
        try:
            await active_connections[recipient_id].send_json({
                "type": "new_message",
                "conversation_id": conv.id,
                "message": {
                    "id": message.id,
                    "text": message.text,
                    "sender_id": message.sender_id,
                    "created_at": message.created_at,
                    "read": message.read,
                },
            })
        except Exception:
            pass  # Connection may have dropped

    # Push Notification (Background)
    try:
        from services.push_service import send_push_notification
        await send_push_notification(
            db, 
            recipient_id, 
            f"Neue Nachricht von {current_user.display_name or current_user.username}", 
            message.text,
            {"type": "chat", "conversation_id": conv.id}
        )
    except Exception as e:
        print(f"Chat push error: {e}")

    return message


# ── POST /conversations/{id}/read ────────────────────────────────────
@router.post("/conversations/{conv_id}/read")
def mark_as_read(conv_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conv = get_conversation_for_user(conv_id, current_user.id, db)

    db.query(Message).filter(
        Message.conversation_id == conv.id,
        Message.sender_id != current_user.id,
        Message.read == False,
    ).update({"read": True})
    db.commit()
    return {"status": "ok"}


# ── WebSocket /ws/chat?token=... ─────────────────────────────────────
@router.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket, token: str = Query(...)):
    # Authenticate via JWT token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return

    db = next(get_db())
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            await websocket.close(code=4001)
            return
        user_id = user.id
    finally:
        db.close()

    await websocket.accept()
    active_connections[user_id] = websocket

    try:
        while True:
            # Keep connection alive; client can send pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.pop(user_id, None)
