import asyncio
import json
from datetime import datetime
from typing import Dict, Any, Optional
from .scheduler import job_scheduler
from .email import email_service
from .actions import handle_email, handle_delay, handle_http_request
from ..models import Workflow, Execution

class WorkflowExecutor:
    def __init__(self):
        self.executions: Dict[str, Dict[str, Any]] = {}
    
    async def execute_workflow(self, workflow_id: int, payload: Dict[str, Any] = None, user_id: Optional[str] = None) -> str:
        """Execute a workflow"""
        execution_id = f"exec_{workflow_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Create execution record
        execution = {
            'id': execution_id,
            'workflow_id': workflow_id,
            'status': 'running',
            'started_at': datetime.utcnow().isoformat(),
            'payload': payload or {},
            'steps': [],
            'user_id': user_id
        }
        
        self.executions[execution_id] = execution
        
        # Schedule the execution as a background job
        await job_scheduler.schedule_workflow_execution(
            workflow_id=workflow_id,
            execution_id=execution_id,
            user_id=user_id
        )
        
        return execution_id
    
    async def execute_step(self, step: Dict[str, Any], context: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """Execute a single workflow step"""
        step_id = step.get('id', 'unknown')
        action = step.get('action', 'notify')
        params = step.get('params', {})
        
        # Add step to execution context
        context['current_step'] = step_id
        context['step_params'] = params
        
        try:
            # Execute based on action type
            if action == 'email':
                result = await handle_email(params, context)
                # Schedule email as background job
                await job_scheduler.schedule_email_send(
                    email_data={
                        'to': params.get('to'),
                        'subject': params.get('subject'),
                        'body': params.get('body'),
                        'execution_id': context.get('execution_id'),
                        'step_id': step_id
                    },
                    user_id=user_id
                )
                return result
                
            elif action == 'delay':
                # Schedule delay as background job
                delay_seconds = params.get('seconds', 5)
                await job_scheduler.schedule_job(
                    job_type='delay',
                    scheduled_at=datetime.utcnow(),
                    function=handle_delay,
                    args=[delay_seconds],
                    user_id=user_id
                )
                return {'status': 'scheduled', 'delay_seconds': delay_seconds}
                
            elif action == 'http_request':
                # Schedule HTTP request as background job
                await job_scheduler.schedule_job(
                    job_type='http_request',
                    scheduled_at=datetime.utcnow(),
                    function=handle_http_request,
                    args=[params, context],
                    user_id=user_id
                )
                return {'status': 'scheduled', 'url': params.get('url')}
                
            else:
                # Default notification action
                return {
                    'status': 'completed',
                    'message': f'Executed {action} for step {step_id}',
                    'step_id': step_id
                }
                
        except Exception as e:
            return {
                'status': 'failed',
                'error': str(e),
                'step_id': step_id
            }
    
    async def get_execution_status(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get execution status"""
        return self.executions.get(execution_id)
    
    async def get_execution_history(self, workflow_id: int) -> list:
        """Get execution history for a workflow"""
        return [
            execution for execution in self.executions.values()
            if execution['workflow_id'] == workflow_id
        ]

# Global executor instance
workflow_executor = WorkflowExecutor()
