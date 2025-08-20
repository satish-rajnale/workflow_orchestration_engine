import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any
import os


class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.resend.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '465'))
        self.smtp_username = os.getenv('SMTP_USERNAME', 'resend')
        self.smtp_password = os.getenv('SMTP_PASSWORD', 're_UeZReTGk_FoBnytjPEiUdhTEUxthYDuJj')
        self.from_email = os.getenv('FROM_EMAIL', 'satishrajnale98@gmail.com')

    async def send_email(self, to_email: str, subject: str, body: str) -> bool:
        try:
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            smtplib._AuthObject()
            msg.attach(MIMEText(body, 'html'))

            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
            server.send_message(msg)
            server.quit()
            return True
        except Exception as e:
            print(f"Email send failed: {e}")
            return False

    def render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        templates = {
            'ack_ticket': f"""
            <h2>Ticket Acknowledgment</h2>
            <p>We've received your ticket (#{context.get('ticket_id', 'N/A')}). Our team will get back to you soon.</p>
            <p>Ticket Title: {context.get('ticket_title', 'N/A')}</p>
            """,
            'escalate_ticket': f"""
            <h2>Ticket Escalation</h2>
            <p>Ticket #{context.get('ticket_id', 'N/A')} has not been assigned for 2 hours. Please review.</p>
            <p>Ticket Title: {context.get('ticket_title', 'N/A')}</p>
            <p>User: {context.get('user_email', 'N/A')}</p>
            """
        }
        return templates.get(template_name, 'Template not found')


email_service = EmailService()
