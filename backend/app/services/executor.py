import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional, Callable
from sqlalchemy.orm import Session
from ..models import Execution, ExecutionLog, Workflow
from .cache import cache
from .conditions import evaluate_condition
from .actions import registry


class WorkflowExecutor:
    def __init__(
        self,
        db: Session,
        workflow: Workflow,
        execution: Execution,
        ws_broadcast: Optional[Callable[[int, Dict[str, Any]], Any]] = None,
        initial_context: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.db = db
        self.workflow = workflow
        self.execution = execution
        self.ws_broadcast = ws_broadcast
        self.context: Dict[str, Any] = initial_context.copy() if initial_context else {}

    async def run(self) -> None:
        self.execution.status = 'running'
        self.execution.started_at = datetime.utcnow()
        self.db.add(self.execution)
        self.db.commit()
        self.db.refresh(self.execution)
        await self._notify({"type": "execution_started", "execution_id": self.execution.id})

        try:
            nodes: List[Dict[str, Any]] = self.workflow.definition.get('nodes', [])
            edges: List[Dict[str, Any]] = self.workflow.definition.get('edges', [])
            node_map = {n['id']: n for n in nodes}

            start_nodes = [n for n in nodes if n.get('type') == 'start'] or nodes[:1]
            for start in start_nodes:
                await self._execute_node(start, node_map, edges)

            self.execution.status = 'succeeded'
        except Exception as exc:
            self.execution.status = 'failed'
            await self._log(node_id='engine', status='error', message=str(exc))
        finally:
            self.execution.finished_at = datetime.utcnow()
            self.db.add(self.execution)
            self.db.commit()
            await self._notify({"type": "execution_finished", "execution_id": self.execution.id, "status": self.execution.status})
            cache.set_json(f"workflow:{self.workflow.id}:last_execution", {"id": self.execution.id, "status": self.execution.status})

    async def _execute_node(self, node: Dict[str, Any], node_map: Dict[str, Dict[str, Any]], edges: List[Dict[str, Any]]) -> None:
        node_id = node['id']
        action = node.get('action')
        params = node.get('params', {})
        await self._log(node_id=node_id, status='started', message=f"Node {action} started")
        await self._notify({"type": "node_started", "node_id": node_id, "action": action})

        handler = registry.get(action or 'noop')
        tries = int(node.get('retries', 0)) + 1
        last_exc: Optional[Exception] = None
        for attempt in range(1, tries + 1):
            try:
                if handler:
                    await handler(params, self.context)
                break
            except Exception as exc:  # retry with backoff
                last_exc = exc
                await self._log(node_id=node_id, status='retry', message=f'Retry {attempt} failed: {exc}')
                await asyncio.sleep(min(2 ** attempt, 10))
        else:
            raise last_exc if last_exc else Exception('Unknown action failure')

        await self._log(node_id=node_id, status='completed', message=f"Node {action} completed")
        await self._notify({"type": "node_completed", "node_id": node_id})

        next_edges = [e for e in edges if e.get('source') == node_id]
        for edge in next_edges:
            target_id = edge.get('target')
            condition = edge.get('condition')
            if condition and not evaluate_condition(condition, context={"data": self.context, "params": params}):
                continue
            target_node = node_map.get(target_id)
            if target_node:
                await self._execute_node(target_node, node_map, edges)

    async def _log(self, node_id: str, status: str, message: str | None = None) -> None:
        log = ExecutionLog(execution_id=self.execution.id, node_id=node_id, status=status, message=message)
        self.db.add(log)
        self.db.commit()
        await self._notify({"type": "log", "node_id": node_id, "status": status, "message": message})

    async def _notify(self, event: Dict[str, Any]) -> None:
        if self.ws_broadcast:
            await self.ws_broadcast(self.workflow.id, event)
