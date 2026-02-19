from fastapi import APIRouter
from services.mail_manager import mail_manager

router = APIRouter()

@router.get("/test-email")
async def test_email(email: str):
    try:
        result = await mail_manager.send_verification_code(email, "TEST-CODE-123")
        return {
            "msg": "Email sent successfully",
            "recipient": email,
            "mailjet_response": result,
            "debug_info": {
                "api_key_set": bool(mail_manager.api_key),
                "from": mail_manager.from_email
            }
        }
    except Exception as e:
        import traceback
        return {
            "msg": "Email failed",
            "error": str(e),
            "trace": traceback.format_exc(),
            "debug_info": {
                "api_key_set": bool(mail_manager.api_key),
                "from": mail_manager.from_email
            }
        }
