import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any
import os
import json
import uuid
from datetime import datetime
from .cache import cache


class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.resend.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '465'))
        self.smtp_username = os.getenv('SMTP_USERNAME', 'resend')
        self.smtp_password = os.getenv('SMTP_PASSWORD', 're_UeZReTGk_FoBnytjPEiUdhTEUxthYDuJj')
        self.from_email = os.getenv('FROM_EMAIL', 'satishrajnale98@gmail.com')

    async def send_email(self, to_email: str, subject: str, body: str, execution_id: str = None, step_id: str = None) -> Dict[str, Any]:
        email_id = str(uuid.uuid4())
        email_data = {
            'id': email_id,
            'to': to_email,
            'subject': subject,
            'body': body,
            'execution_id': execution_id,
            'step_id': step_id,
            'status': 'pending',
            'timestamp': datetime.utcnow().isoformat(),
            'attempts': 0
        }
        
        # Store email data in Redis
        cache.set_json(f"email:{email_id}", email_data, ex_seconds=3600)
        
        # Publish email event to Redis
        email_event = {
            'type': 'email_send_attempt',
            'email_id': email_id,
            'to': to_email,
            'subject': subject,
            'execution_id': execution_id,
            'step_id': step_id,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        try:
            # Publish to Redis pub/sub
            cache.client.publish('email_events', json.dumps(email_event))
            
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'html'))

            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
            
            server.send_message(msg)
            server.quit()
            
            # Update email status to success
            email_data['status'] = 'sent'
            email_data['sent_at'] = datetime.utcnow().isoformat()
            cache.set_json(f"email:{email_id}", email_data, ex_seconds=3600)
            
            # Publish success event
            success_event = {
                'type': 'email_sent',
                'email_id': email_id,
                'to': to_email,
                'subject': subject,
                'execution_id': execution_id,
                'step_id': step_id,
                'timestamp': datetime.utcnow().isoformat()
            }
            cache.client.publish('email_events', json.dumps(success_event))
            
            return {
                'success': True,
                'email_id': email_id,
                'message': 'Email sent successfully'
            }
            
        except Exception as e:
            # Update email status to failed
            email_data['status'] = 'failed'
            email_data['error'] = str(e)
            email_data['attempts'] = email_data.get('attempts', 0) + 1
            cache.set_json(f"email:{email_id}", email_data, ex_seconds=3600)
            
            # Publish failure event
            failure_event = {
                'type': 'email_failed',
                'email_id': email_id,
                'to': to_email,
                'subject': subject,
                'execution_id': execution_id,
                'step_id': step_id,
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
            cache.client.publish('email_events', json.dumps(failure_event))
            
            print(f"Email send failed: {e}")
            return {
                'success': False,
                'email_id': email_id,
                'error': str(e)
            }

    def get_email_status(self, email_id: str) -> Dict[str, Any]:
        """Get email status from Redis"""
        email_data = cache.get_json(f"email:{email_id}")
        if not email_data:
            return {'status': 'not_found'}
        return email_data

    def get_emails_by_execution(self, execution_id: str) -> list:
        """Get all emails for a specific execution"""
        # This is a simplified implementation
        # In production, you might want to use Redis sets or a database
        emails = []
        # You could implement pattern matching here
        return emails

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
