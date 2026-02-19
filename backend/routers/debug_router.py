from fastapi import APIRouter, HTTPException
from pydantic import EmailStr
from services.mail_manager import mail_manager

router = APIRouter()

@router.get("/test-email")
async def test_email(email: EmailStr):
    try:
        await mail_manager.send_verification_code(email, "TEST-CODE-123")
        return {"msg": "Email sent successfully", "recipient": email}
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"DEBUG EMAIL ERROR: {error_trace}")
        return {"msg": "Email failed", "error": str(e), "trace": error_trace}
