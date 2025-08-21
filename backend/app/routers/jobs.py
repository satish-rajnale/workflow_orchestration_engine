from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..db import get_db
from ..models import User
from ..deps import get_current_user
from ..services.ably_service import ably_service
import asyncio

router = APIRouter()


@router.get('/test-update')
async def test_job_update(current_user: User = Depends(get_current_user)):
    """Test endpoint to manually trigger a job status update"""
    try:
        from ..services.ably_service import ably_service
        
        test_job_data = {
            'job_id': f'test-job-{int(asyncio.get_event_loop().time())}',
            'status': 'running',
            'job_type': 'workflow_execution',
            'created_at': '2025-01-20T12:00:00Z',
            'updated_at': '2025-01-20T12:00:00Z',
            'workflow_id': '1'
        }
        
        await ably_service.publish_job_status_update(
            job_id=test_job_data['job_id'],
            job_data=test_job_data,
            user_id=str(current_user.id)
        )
        
        return {"message": "Test job update published", "job_id": test_job_data['job_id']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to publish test update: {str(e)}")


@router.get('/token')
async def get_ably_token(current_user: User = Depends(get_current_user)):
    """Get Ably token for real-time communication"""
    try:
        token_request = await ably_service.get_token_request(str(current_user.id))
        if token_request:
            return token_request
        else:
            raise HTTPException(status_code=500, detail="Failed to generate token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get token: {str(e)}")


@router.get('')
async def list_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all jobs for the current user"""
    from ..services.scheduler import job_scheduler
    
    try:
        # Get jobs for the current user
        user_jobs = await job_scheduler.get_user_jobs(str(current_user.id))
        
        # Ensure each job has job_id field
        jobs = []
        for job in user_jobs:
            job_data = job.copy()
            job_data['job_id'] = job.get('id')  # Ensure job_id is always present
            jobs.append(job_data)
        
        return jobs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list jobs: {str(e)}")


@router.get('/{job_id}')
async def get_job_status(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get job status by job ID"""
    from ..services.scheduler import job_scheduler
    
    try:
        job = await job_scheduler.get_job_status(job_id)
        if not job:
            raise HTTPException(status_code=404, detail='Job not found')
        
        # Check if the job belongs to the current user
        if job.get('user_id') != str(current_user.id):
            raise HTTPException(status_code=403, detail='Access denied')
        
        job_data = job.copy()
        job_data['job_id'] = job_id  # Ensure job_id is always present
        return job_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get job status: {str(e)}")


@router.delete('/{job_id}')
async def cancel_job(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Cancel a job"""
    from ..services.scheduler import job_scheduler
    
    try:
        # First check if the job belongs to the current user
        job = await job_scheduler.get_job_status(job_id)
        if not job:
            raise HTTPException(status_code=404, detail='Job not found')
        
        if job.get('user_id') != str(current_user.id):
            raise HTTPException(status_code=403, detail='Access denied')
        
        success = await job_scheduler.cancel_job(job_id)
        if not success:
            raise HTTPException(status_code=404, detail='Job not found or cannot be cancelled')
        
        return {"message": "Job cancelled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel job: {str(e)}")


@router.get('/active')
async def get_active_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all active jobs (pending or running) for the current user"""
    from ..services.scheduler import job_scheduler
    
    try:
        # Get active jobs for the current user
        active_jobs = await job_scheduler.get_user_jobs(str(current_user.id))
        
        # Filter for active jobs (pending or running)
        active_jobs = [job for job in active_jobs if job.get('status') in ['pending', 'running']]
        
        # Ensure each job has job_id field
        jobs = []
        for job in active_jobs:
            job_data = job.copy()
            job_data['job_id'] = job.get('id')  # Ensure job_id is always present
            jobs.append(job_data)
        
        return jobs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get active jobs: {str(e)}")
