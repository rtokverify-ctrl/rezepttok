import os
import httpx
from dotenv import load_dotenv

load_dotenv()

class MailManager:
    def __init__(self):
        self.api_key = os.getenv("MAILJET_API_KEY", "")
        self.secret_key = os.getenv("MAILJET_SECRET_KEY", "")
        self.from_email = os.getenv("MAIL_FROM", "rtok.verify@gmail.com")
        self.from_name = os.getenv("MAIL_FROM_NAME", "RezeptTok")

    async def send_verification_code(self, email: str, code: str):
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2 style="color: #00C2FF;">RezeptTok Verification</h2>
            <p>Dein Bestätigungscode lautet:</p>
            <h1 style="background-color: #f0f0f0; display: inline-block; padding: 10px 20px; letter-spacing: 5px;">{code}</h1>
            <p>Dieser Code ist 10 Minuten gültig.</p>
        </div>
        """

        if not self.api_key or not self.secret_key:
            print("WARNING: Mailjet API keys not set.")
            raise Exception("MAILJET_API_KEY or MAILJET_SECRET_KEY not configured")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.mailjet.com/v3.1/send",
                auth=(self.api_key, self.secret_key),
                json={
                    "Messages": [{
                        "From": {
                            "Email": self.from_email,
                            "Name": self.from_name
                        },
                        "To": [{
                            "Email": email
                        }],
                        "Subject": "Dein RezeptTok 2FA Code",
                        "HTMLPart": html
                    }]
                },
                timeout=30.0
            )

            if response.status_code != 200:
                error_msg = response.text
                print(f"Mailjet API Error ({response.status_code}): {error_msg}")
                raise Exception(f"Email sending failed: {error_msg}")

            result = response.json()
            print(f"Email sent successfully to {email} via Mailjet")
            return result

mail_manager = MailManager()
