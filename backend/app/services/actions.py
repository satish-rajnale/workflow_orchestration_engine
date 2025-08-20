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
    await asyncio.sleep(0.05)
    # mock: set response into context
    context['last_http_status'] = 200


# Default registrations
registry.register('delay', handle_delay)
registry.register('notify', handle_notify)
registry.register('http_request', handle_http_request)

async def handle_email(params: Dict[str, Any], context: Dict[str, Any]):
    from .email import email_service
    to_email = params.get('to', '')
    template = params.get('template', '')
    subject = params.get('subject', 'Workflow Notification')
    
    # Render template with context
    body = email_service.render_template(template, context)
    success = await email_service.send_email(to_email, subject, body)
    
    if not success:
        raise Exception(f"Failed to send email to {to_email}")

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
