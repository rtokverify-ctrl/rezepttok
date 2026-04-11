import httpx
import logging
from sqlalchemy.orm import Session
from models import PushToken

logger = logging.getLogger(__name__)
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

async def send_push_notification(db: Session, user_id: int, title: str, body: str, data: dict = None):
    tokens = db.query(PushToken).filter(PushToken.user_id == user_id).all()
    if not tokens:
        return
        
    messages = []
    for t in tokens:
        messages.append({
            "to": t.token,
            "sound": "default",
            "title": title,
            "body": body,
            "data": data or {}
        })

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={
                    "Accept": "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                }
            )
            response_data = response.json()
            logger.info(f"Push notification sent: {response_data}")
            
            # Simple cleanup for unregistered tokens
            if "data" in response_data:
                for idx, ticket in enumerate(response_data["data"]):
                    if ticket.get("status") == "error" and ticket.get("details", {}).get("error") == "DeviceNotRegistered":
                        invalid_token = messages[idx]["to"]
                        db.query(PushToken).filter(PushToken.token == invalid_token).delete(synchronize_session=False)
                        db.commit()
                        logger.info(f"Removed unregistered push token: {invalid_token}")
                        
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
