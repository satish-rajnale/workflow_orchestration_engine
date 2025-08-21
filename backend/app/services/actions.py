from __future__ import annotations
import asyncio
from typing import Any, Dict, Callable

# Registry for node action handlers

Handler = Callable[[Dict[str, Any], Dict[str, Any]], 'asyncio.Future']


class ActionRegistry:
    def __init__(self) -> None:
        self._handlers: dict[str, Handler] = {}

    def register(self, name: str, handler: Handler) -> None:
        self._handlers[name] = handler

    def get(self, name: str) -> Handler | None:
        return self._handlers.get(name)


registry = ActionRegistry()


async def handle_delay(params: Dict[str, Any], context: Dict[str, Any]):
    await asyncio.sleep(int(params.get('seconds', 1)))


async def handle_notify(params: Dict[str, Any], context: Dict[str, Any]):
    await asyncio.sleep(0.01)


async def handle_http_request(params: Dict[str, Any], context: Dict[str, Any]):
    import httpx
    
    method = params.get('method', 'GET')
    url = params.get('url', '')
    headers = params.get('headers', {})
    body = params.get('body', {})
    
    if not url:
        raise Exception("URL is required for HTTP request")
    
    try:
        async with httpx.AsyncClient() as client:
            if method.upper() == 'GET':
                response = await client.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = await client.post(url, json=body, headers=headers)
            elif method.upper() == 'PUT':
                response = await client.put(url, json=body, headers=headers)
            elif method.upper() == 'DELETE':
                response = await client.delete(url, headers=headers)
            elif method.upper() == 'PATCH':
                response = await client.patch(url, json=body, headers=headers)
            else:
                raise Exception(f"Unsupported HTTP method: {method}")
            
            # Store response in context
            context['last_http_status'] = response.status_code
            context['last_http_response'] = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
            context['last_http_headers'] = dict(response.headers)
            
            return {
                'status': 'completed',
                'status_code': response.status_code,
                'response': context['last_http_response'],
                'headers': context['last_http_headers']
            }
            
    except Exception as e:
        context['last_http_error'] = str(e)
        raise Exception(f"HTTP request failed: {str(e)}")


# Default registrations
registry.register('delay', handle_delay)
registry.register('notify', handle_notify)
registry.register('http_request', handle_http_request)

async def handle_email(params: Dict[str, Any], context: Dict[str, Any]):
    from .email import email_service
    to_email = params.get('to', '')
    subject = params.get('subject', 'Workflow Notification')
    body = params.get('body', '')
    template = params.get('template', '')
    
    # Get execution_id and step_id from context
    execution_id = context.get('execution_id')
    step_id = context.get('current_step_id')
    
    # Use provided body or render template with context
    if body:
        email_body = body
    elif template:
        email_body = email_service.render_template(template, context)
    else:
        email_body = "No content provided"
    
    if not to_email:
        raise Exception("Email 'to' address is required")
    
    result = await email_service.send_email(to_email, subject, email_body, execution_id, step_id)
    
    if not result.get('success'):
        raise Exception(f"Failed to send email to {to_email}: {result.get('error', 'Unknown error')}")
    
    # Store email result in context
    context['last_email_id'] = result.get('email_id')
    context['last_email_status'] = result.get('success')
    context['last_email_to'] = to_email
    context['last_email_subject'] = subject
    
    return {
        'status': 'completed',
        'email_id': result.get('email_id'),
        'to': to_email,
        'subject': subject,
        'success': result.get('success')
    }

async def handle_check_ticket_assigned(params: Dict[str, Any], context: Dict[str, Any]):
    # This would check the database for ticket assignment
    # For now, we'll simulate by checking context
    ticket_id = context.get('ticket_id')
    assigned = context.get('ticket_assigned', False)
    
    # Store result in context for condition evaluation
    context['ticket_assigned'] = assigned
    context['check_result'] = assigned

# Register new actions
registry.register('email', handle_email)
registry.register('check_ticket_assigned', handle_check_ticket_assigned)
