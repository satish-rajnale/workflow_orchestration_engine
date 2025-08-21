import asyncio
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Callable, Optional
from enum import Enum
from .cache import cache
from .ably_service import ably_service


class JobStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobScheduler:
    def __init__(self):
        self.jobs: Dict[str, Dict[str, Any]] = {}
        self.is_running = False
        self.background_task = None
        
    async def start(self):
        """Start the job scheduler"""
        if self.is_running:
            return
            
        self.is_running = True
        self.background_task = asyncio.create_task(self._run_scheduler())
        print("🕐 Job scheduler started")
    
    async def stop(self):
        """Stop the job scheduler"""
        self.is_running = False
        if self.background_task:
            self.background_task.cancel()
            try:
                await self.background_task
            except asyncio.CancelledError:
                pass
        print("🕐 Job scheduler stopped")
    
    async def _run_scheduler(self):
        """Main scheduler loop"""
        while self.is_running:
            try:
                # Process pending jobs
                await self._process_jobs()
                
                # Clean up old completed jobs
                await self._cleanup_old_jobs()
                
                # Wait before next iteration
                await asyncio.sleep(1)
                
            except Exception as e:
                print(f"Error in scheduler loop: {e}")
                await asyncio.sleep(5)
    
    async def _process_jobs(self):
        """Process pending jobs"""
        current_time = datetime.utcnow()
        
        for job_id, job in list(self.jobs.items()):
            if job['status'] == JobStatus.PENDING.value:
                scheduled_time = datetime.fromisoformat(job['scheduled_at'])
                
                if current_time >= scheduled_time:
                    # Start the job
                    await self._execute_job(job_id, job)
    
    async def _execute_job(self, job_id: str, job: Dict[str, Any]):
        """Execute a job"""
        try:
            # Update job status to running
            job['status'] = JobStatus.RUNNING.value
            job['started_at'] = datetime.utcnow().isoformat()
            job['job_id'] = job_id  # Ensure job_id is always present
            job['updated_at'] = datetime.utcnow().isoformat()
            self.jobs[job_id] = job
            
            # Publish real-time update
            await ably_service.publish_job_status_update(job_id, job, job.get('user_id'))
            
            # Execute the job function
            if job['job_type'] == 'workflow_execution':
                await self._execute_workflow_job(job)
            elif job['job_type'] == 'email_send':
                await self._execute_email_job(job)
            else:
                # Generic job execution
                if 'function' in job and job['function']:
                    function = job['function']
                    args = job.get('args', [])
                    kwargs = job.get('kwargs', {})
                    
                    # Check if function is async
                    if asyncio.iscoroutinefunction(function):
                        result = await function(*args, **kwargs)
                    else:
                        # Run non-async function in thread pool
                        loop = asyncio.get_event_loop()
                        result = await loop.run_in_executor(None, function, *args, **kwargs)
                    
                    job['result'] = result
            
            # Mark job as completed
            job['status'] = JobStatus.COMPLETED.value
            job['completed_at'] = datetime.utcnow().isoformat()
            job['job_id'] = job_id  # Ensure job_id is always present
            job['updated_at'] = datetime.utcnow().isoformat()
            
            # Publish real-time update
            await ably_service.publish_job_status_update(job_id, job, job.get('user_id'))
            
        except Exception as e:
            # Mark job as failed
            job['status'] = JobStatus.FAILED.value
            job['error'] = str(e)
            job['failed_at'] = datetime.utcnow().isoformat()
            job['job_id'] = job_id  # Ensure job_id is always present
            job['updated_at'] = datetime.utcnow().isoformat()
            print(f"Job {job_id} failed: {e}")
            
            # Publish real-time update
            await ably_service.publish_job_status_update(job_id, job, job.get('user_id'))
        
        finally:
            self.jobs[job_id] = job
    
    async def _execute_workflow_job(self, job: Dict[str, Any]):
        """Execute a workflow job"""
        from .executor import WorkflowExecutor
        from ..db import get_db
        from ..models import Workflow, Execution
        
        # This would be implemented to handle long-running workflow executions
        # For now, we'll simulate the execution
        await asyncio.sleep(2)  # Simulate work
        
        # In a real implementation, you would:
        # 1. Get the workflow from database
        # 2. Create execution record
        # 3. Run the workflow executor
        # 4. Update execution status
    
    async def _execute_email_job(self, job: Dict[str, Any]):
        """Execute an email job"""
        from .email import email_service
        
        email_data = job.get('email_data', {})
        result = await email_service.send_email(
            to_email=email_data.get('to'),
            subject=email_data.get('subject'),
            body=email_data.get('body'),
            execution_id=email_data.get('execution_id'),
            step_id=email_data.get('step_id')
        )
        
        job['result'] = result
    
    async def _cleanup_old_jobs(self):
        """Clean up old completed jobs"""
        current_time = datetime.utcnow()
        cutoff_time = current_time - timedelta(hours=24)  # Keep jobs for 24 hours
        
        jobs_to_remove = []
        for job_id, job in self.jobs.items():
            if job['status'] in [JobStatus.COMPLETED.value, JobStatus.FAILED.value]:
                completed_time = datetime.fromisoformat(job.get('completed_at', job.get('failed_at', '1970-01-01')))
                if completed_time < cutoff_time:
                    jobs_to_remove.append(job_id)
        
        for job_id in jobs_to_remove:
            del self.jobs[job_id]
    
    async def schedule_job(self, job_type: str, scheduled_at: datetime, 
                          function: Optional[Callable] = None, 
                          args: list = None, kwargs: dict = None,
                          user_id: Optional[str] = None,
                          **job_data) -> str:
        """Schedule a new job"""
        job_id = str(uuid.uuid4())
        
        job = {
            'id': job_id,
            'job_id': job_id,  # Add job_id for consistency with frontend
            'job_type': job_type,
            'status': JobStatus.PENDING.value,
            'scheduled_at': scheduled_at.isoformat(),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'function': function,
            'args': args or [],
            'kwargs': kwargs or {},
            'user_id': user_id,
            'created_by': user_id,  # Add created_by field for user tracking
            **job_data
        }
        
        self.jobs[job_id] = job
        print(f"📅 Scheduled job {job_id} of type {job_type} for {scheduled_at}")
        
        # Publish real-time update for new job
        if user_id:
            await ably_service.publish_job_status_update(job_id, job, user_id)
        
        return job_id
    
    async def schedule_workflow_execution(self, workflow_id: int, execution_id: int, 
                                        scheduled_at: datetime = None, user_id: Optional[str] = None) -> str:
        """Schedule a workflow execution"""
        if scheduled_at is None:
            scheduled_at = datetime.utcnow()
        
        return await self.schedule_job(
            job_type='workflow_execution',
            scheduled_at=scheduled_at,
            workflow_id=workflow_id,
            execution_id=execution_id,
            user_id=user_id
        )
    
    async def schedule_email_send(self, email_data: Dict[str, Any], 
                                scheduled_at: datetime = None, user_id: Optional[str] = None) -> str:
        """Schedule an email send job"""
        if scheduled_at is None:
            scheduled_at = datetime.utcnow()
        
        return await self.schedule_job(
            job_type='email_send',
            scheduled_at=scheduled_at,
            email_data=email_data,
            user_id=user_id
        )
    
    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job status"""
        return self.jobs.get(job_id)
    
    async def cancel_job(self, job_id: str) -> bool:
        """Cancel a job"""
        if job_id in self.jobs:
            job = self.jobs[job_id]
            if job['status'] == JobStatus.PENDING.value:
                job['status'] = JobStatus.CANCELLED.value
                job['cancelled_at'] = datetime.utcnow().isoformat()
                job['job_id'] = job_id  # Ensure job_id is always present
                job['updated_at'] = datetime.utcnow().isoformat()
                self.jobs[job_id] = job
                
                # Publish real-time update
                await ably_service.publish_job_status_update(job_id, job, job.get('user_id'))
                
                return True
        return False
    
    async def get_jobs_by_type(self, job_type: str) -> list:
        """Get all jobs of a specific type"""
        return [job for job in self.jobs.values() if job['job_type'] == job_type]
    
    async def get_active_jobs(self) -> list:
        """Get all active jobs (pending or running)"""
        return [job for job in self.jobs.values() 
                if job['status'] in [JobStatus.PENDING.value, JobStatus.RUNNING.value]]
    
    async def get_user_jobs(self, user_id: str) -> list:
        """Get all jobs for a specific user"""
        user_jobs = [job for job in self.jobs.values() if job.get('user_id') == user_id]
        
        # Publish real-time update for job list
        # await ably_service.publish_job_list_update(user_id, user_jobs)
        
        return user_jobs

# Global job scheduler instance
job_scheduler = JobScheduler()
