#!/usr/bin/env python3
"""
Test script to verify job scheduler functionality
"""
import asyncio
import time
from datetime import datetime, timedelta
from app.services.scheduler import job_scheduler

async def test_job_scheduler():
    """Test job scheduler functionality"""
    
    print("🕐 Testing Job Scheduler...")
    
    # Start the scheduler
    await job_scheduler.start()
    
    # Schedule a test job
    scheduled_time = datetime.utcnow() + timedelta(seconds=2)
    job_id = await job_scheduler.schedule_job(
        job_type='test_job',
        scheduled_at=scheduled_time,
        function=lambda: print("✅ Test job executed successfully!"),
        test_data="Hello from test job"
    )
    
    print(f"📅 Scheduled test job: {job_id}")
    print(f"⏰ Scheduled for: {scheduled_time}")
    
    # Wait for job to execute
    print("⏳ Waiting for job to execute...")
    await asyncio.sleep(5)
    
    # Check job status
    job_status = await job_scheduler.get_job_status(job_id)
    print(f"📊 Job status: {job_status}")
    
    # Get active jobs
    active_jobs = await job_scheduler.get_active_jobs()
    print(f"🔄 Active jobs: {len(active_jobs)}")
    
    # Stop the scheduler
    await job_scheduler.stop()
    
    print("✅ Job scheduler test completed!")

if __name__ == "__main__":
    asyncio.run(test_job_scheduler())
