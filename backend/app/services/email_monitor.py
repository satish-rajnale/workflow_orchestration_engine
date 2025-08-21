import json
import asyncio
from typing import Dict, Any, Callable
from .cache import cache


class EmailMonitor:
    def __init__(self):
        self.pubsub = None
        self.callbacks: Dict[str, Callable] = {}
        self.is_running = False
        
    async def start_monitoring(self):
        """Start monitoring email events from Redis pub/sub"""
        if self.is_running:
            return
            
        self.is_running = True
        
        try:
            # Use the same Redis client from cache
            self.pubsub = cache.client.pubsub()
            
            # Subscribe to the channel
            self.pubsub.subscribe('email_events')
            
            print("📧 Email monitor started - listening for events...")
            
            # Process messages in a non-blocking way
            while self.is_running:
                try:
                    # Use get_message with timeout to prevent blocking
                    message = self.pubsub.get_message(timeout=1.0)
                    if message and message['type'] == 'message':
                        await self._handle_email_event(json.loads(message['data']))
                    
                    # Small delay to prevent CPU spinning
                    await asyncio.sleep(0.1)
                    
                except Exception as e:
                    print(f"Error in email monitor loop: {e}")
                    await asyncio.sleep(1)
                    
        except Exception as e:
            print(f"⚠️  Email monitor failed to start (Redis may not be available): {e}")
            print("📧 Email monitoring will be disabled, but the server will continue running")
            # Don't let the error crash the entire application
            self.is_running = False
        finally:
            if self.pubsub:
                try:
                    self.pubsub.close()
                except:
                    pass
    
    async def stop_monitoring(self):
        """Stop monitoring email events"""
        self.is_running = False
        if self.pubsub:
            try:
                self.pubsub.close()
            except:
                pass
    
    async def _handle_email_event(self, event: Dict[str, Any]):
        """Handle email events from Redis pub/sub"""
        event_type = event.get('type')
        
        if event_type == 'email_send_attempt':
            print(f"📧 Email send attempt: {event.get('email_id')} to {event.get('to')}")
            
        elif event_type == 'email_sent':
            print(f"✅ Email sent successfully: {event.get('email_id')} to {event.get('to')}")
            # You can add custom logic here, like updating database, sending notifications, etc.
            
        elif event_type == 'email_failed':
            print(f"❌ Email failed: {event.get('email_id')} to {event.get('to')} - Error: {event.get('error')}")
            # You can add retry logic or alerting here
            
        # Call any registered callbacks
        if event_type in self.callbacks:
            try:
                await self.callbacks[event_type](event)
            except Exception as e:
                print(f"Error in callback for {event_type}: {e}")
    
    def register_callback(self, event_type: str, callback: Callable):
        """Register a callback for specific email event types"""
        self.callbacks[event_type] = callback
    
    async def get_email_status(self, email_id: str) -> Dict[str, Any]:
        """Get email status from Redis"""
        from .email import email_service
        return email_service.get_email_status(email_id)
    
    async def get_recent_emails(self, limit: int = 10) -> list:
        """Get recent email events (simplified implementation)"""
        # In a production environment, you might want to store this in a database
        # For now, we'll return an empty list
        return []


# Global email monitor instance
email_monitor = EmailMonitor()
