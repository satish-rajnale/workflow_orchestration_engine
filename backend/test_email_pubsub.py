#!/usr/bin/env python3
"""
Test script to verify Redis pub/sub functionality for email events
"""
import json
import time
import redis

def test_email_pubsub():
    """Test Redis pub/sub for email events"""
    
    # Connect to Redis on localhost
    r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    
    # Subscribe to email events
    pubsub = r.pubsub()
    pubsub.subscribe('email_events')
    
    print("🔍 Listening for email events...")
    print("📧 Publishing test email event...")
    
    # Publish a test email event
    test_event = {
        'type': 'email_send_attempt',
        'email_id': 'test-email-123',
        'to': 'test@example.com',
        'subject': 'Test Email',
        'execution_id': 'test-exec-456',
        'step_id': 'test-step-789',
        'timestamp': time.time()
    }
    
    r.publish('email_events', json.dumps(test_event))
    
    # Listen for events
    try:
        for message in pubsub.listen():
            if message['type'] == 'message':
                event = json.loads(message['data'])
                print(f"✅ Received event: {event['type']}")
                print(f"   Email ID: {event.get('email_id')}")
                print(f"   To: {event.get('to')}")
                print(f"   Subject: {event.get('subject')}")
                break
    except KeyboardInterrupt:
        print("\n⏹️  Stopping listener...")
    finally:
        pubsub.unsubscribe()
        pubsub.close()

if __name__ == "__main__":
    test_email_pubsub()
