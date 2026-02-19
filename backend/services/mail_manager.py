import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from typing import List
from dotenv import load_dotenv

load_dotenv()

class MailManager:
    def __init__(self):
        self.conf = ConnectionConfig(
            MAIL_USERNAME=os.getenv("MAIL_USERNAME", "user@example.com"),
            MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "password"),
            MAIL_FROM=os.getenv("MAIL_FROM", os.getenv("MAIL_USERNAME", "noreply@rezepttok.com")),
            MAIL_PORT=int(os.getenv("MAIL_PORT", 465)),
            MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
            MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "RezeptTok Security"),
            MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "False").lower() == "true",
            MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "True").lower() == "true",
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True
        )
        self.fast_mail = FastMail(self.conf)

    async def send_verification_code(self, email: EmailStr, code: str):
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2 style="color: #00C2FF;">RezeptTok Verification</h2>
            <p>Dein Bestätigungscode lautet:</p>
            <h1 style="background-color: #f0f0f0; display: inline-block; padding: 10px 20px; letter-spacing: 5px;">{code}</h1>
            <p>Dieser Code ist 10 Minuten gültig.</p>
        </div>
        """
        
        message = MessageSchema(
            subject="Dein RezeptTok 2FA Code",
            recipients=[email],
            body=html,
            subtype=MessageType.html
        )
        
        try:
            await self.fast_mail.send_message(message)
            # MOCK FOR DEV (DISABLED):
            # print(f"=======================================")
            # print(f"MOCK MAIL TO: {email}")
            # print(f"CODE: {code}")
            # print(f"=======================================")
        except Exception as e:
            print(f"Error sending email: {e}")

mail_manager = MailManager()
