import os
import asyncio
from typing import Dict, Any, Optional
from ably import AblyRealtime

class AblyService:
    __client__ = None

    @staticmethod
    async def init_ably_client():
        """Initialize Ably realtime client"""
        ably_key = os.getenv('ABLY_REALTIME_KEY')
        if ably_key:
            try:
                client = AblyRealtime(ably_key)
                await client.connection.once_async('connected')
                AblyService.__client__ = client
                print("✅ Ably realtime enabled for the Server. Lezzz gooo!")
            except Exception as e:
                print(f"⚠️ Failed to initialize Ably realtime: {e}")
                AblyService.__client__ = None
        else:
            print("⚠️ Ably realtime key not provided - real-time updates will be simulated")

    @staticmethod
    async def publish(channel_name: str, event_name: str, data: Dict[str, Any]):
        """Publish message to Ably channel"""
        if not AblyService.__client__:
            print(f"📡 [SIMULATED] Published to {channel_name}: {event_name}")
            return
        
        try:
            channel = AblyService.__client__.channels.get(channel_name)
            await channel.publish(event_name, data)
            print(f"📡 Published to {channel_name}: {event_name}")
        except Exception as e:
            print(f"❌ Error publishing to {channel_name}: {e}")

    @staticmethod
    async def test_publish():
        """Test method to verify Ably publishing is working"""
        if not AblyService.__client__:
            print("❌ Ably client not initialized")
            return False
        
        try:
            test_channel = AblyService.__client__.channels.get("test-channel")
            await test_channel.publish("test-event", {"message": "Test message", "timestamp": "2025-01-20"})
            print("✅ Test publish successful")
            return True
        except Exception as e:
            print(f"❌ Test publish failed: {e}")
            return False

    async def publish_job_status_update(self, job_id: str, job_data: Dict[str, Any], user_id: Optional[str] = None):
        """Publish job status update to a specific channel"""
        # Create a channel for job updates
        channel_name = f"refresh-jobs"
        if user_id:
            channel_name = f"refresh-jobs"
        
        # Prepare the message
        message = {
            'job_id': job_id,
            'status': job_data.get('status'),
            'job_type': job_data.get('job_type'),
            'updated_at': job_data.get('updated_at'),
            'data': job_data
        }
        
        print(f"📡 Publishing job status update to {channel_name}: {message}")
        await AblyService.publish(channel_name, 'job-status-update', message)
    
    async def publish_job_list_update(self, user_id: str, jobs: list):
        """Publish job list update for a user"""
        channel_name = f"user-{user_id}-job-list"
        
        message = {
            'jobs': jobs,
            'timestamp': asyncio.get_event_loop().time()
        }
        
        print(f"📡 Publishing job list update to {channel_name}: {len(jobs)} jobs")
        await AblyService.publish(channel_name, 'job-list-update', message)
    
    async def get_token_request(self, user_id: str, client_id: str = None):
        """Generate a token request for client-side authentication"""
        try:
            if not AblyService.__client__:
                print("⚠️ Ably client not initialized - using mock token")
                return {
                    'keyName': 'mock-key',
                    'timestamp': int(asyncio.get_event_loop().time() * 1000),
                    'nonce': 'mock-nonce',
                    'mac': 'mock-mac'
                }
            
            token_params = {
                'clientId': client_id or f"user-{user_id}",
                'capability': {
                    f"user-{user_id}-job-updates": ['subscribe'],
                    f"user-{user_id}-job-list": ['subscribe'],
                    f"job-updates-*": ['subscribe']
                }
            }
            
            print(f"🔑 Generating token for user {user_id} with params: {token_params}")
            token_request = await AblyService.__client__.auth.create_token_request(token_params)
            print(f"✅ Generated Ably token for user {user_id}: {token_request}")
            return token_request
            
        except Exception as e:
            print(f"❌ Error creating token request: {e}")
            return None

# Global Ably service instance
ably_service = AblyService()
