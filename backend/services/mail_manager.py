import os
import httpx
from dotenv import load_dotenv

load_dotenv()

class MailManager:
    def __init__(self):
        self.api_key = os.getenv("RESEND_API_KEY", "")
        self.from_email = os.getenv("MAIL_FROM", "RezeptTok <onboarding@resend.dev>")

    async def send_verification_code(self, email: str, code: str):
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2 style="color: #00C2FF;">RezeptTok Verification</h2>
            <p>Dein Bestätigungscode lautet:</p>
            <h1 style="background-color: #f0f0f0; display: inline-block; padding: 10px 20px; letter-spacing: 5px;">{code}</h1>
            <p>Dieser Code ist 10 Minuten gültig.</p>
        </div>
        """

        if not self.api_key:
            print("WARNING: No RESEND_API_KEY set. Email not sent.")
            raise Exception("RESEND_API_KEY not configured")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": self.from_email,
                    "to": [email],
                    "subject": "Dein RezeptTok 2FA Code",
                    "html": html
                },
                timeout=30.0
            )

            if response.status_code != 200:
                error_msg = response.text
                print(f"Resend API Error ({response.status_code}): {error_msg}")
                raise Exception(f"Email sending failed: {error_msg}")

            print(f"Email sent successfully to {email} via Resend")
            return response.json()

mail_manager = MailManager()
