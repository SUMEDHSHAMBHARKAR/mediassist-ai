import smtplib 
import logging
from email.message import EmailMessage
from app.core.config import EMAIL_ADDRESS , EMAIL_PASSWORD
import time

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAY = 2 




def send_email(recipient: str,subject: str, html_body: str):
    msg = EmailMessage()

    msg["From"] = EMAIL_ADDRESS
    msg["To"] = recipient
    msg["Subject"] = subject

    msg.set_content("Your email client does not support HTML.")

    msg.add_alternative(html_body,subtype="html")

    for attempt in range(1, MAX_RETRIES + 1):
        logger.info(f"Sending email (Attempt {attempt}/{MAX_RETRIES})")
        try:
            with smtplib.SMTP(
                "smtp.gmail.com",587
            ) as smtp:
                smtp.starttls()

                smtp.login(
                    EMAIL_ADDRESS ,EMAIL_PASSWORD
                )

                smtp.send_message(msg)
                logger.info("Email sent successfully!")
                return
        except Exception:
            if attempt == MAX_RETRIES:
                logger.exception(f"Failed to send email after {MAX_RETRIES} attempts.")
            else:
                logger.warning(f"Attempt {attempt} failed. Retrying...")
                time.sleep(RETRY_DELAY) 

         
                
                 

