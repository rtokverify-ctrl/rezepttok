# Email Setup Guide for RezeptTok

To send real emails instead of just printing them to the console, you need to configure the SMTP settings in your `.env` file.

## 1. Create/Update `.env` file

Create a file named `.env` in the `backend/` directory if it doesn't exist. Add the following configuration:

```ini
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=your_email@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_FROM_NAME="RezeptTok Security"
```

## 2. Getting a Gmail App Password (if using Gmail)

You cannot use your regular Gmail password. You must generate an App Password:

1.  Go to your [Google Account Security settings](https://myaccount.google.com/security).
2.  Enable **2-Step Verification** if it isn't already.
3.  Search for **App Passwords** (or find it under 2-Step Verification).
4.  Create a new App Password (e.g., name it "RezeptTok").
5.  Copy the 16-character password and paste it into `MAIL_PASSWORD` in your `.env` file.

## 3. Switch Code to Production Mode

In `backend/services/mail_manager.py`:

1.  Uncomment `await self.fast_mail.send_message(message)`.
2.  (Optional) Comment out the mock print statements.

## 4. Troubleshooting

-   **Connection Refused**: Check if the firewall blocks port 587. Try port 465 with `MAIL_SSL_TLS=True` and `MAIL_STARTTLS=False`.
-   **Auth Error**: Ensure you are using the App Password, not your login password.
