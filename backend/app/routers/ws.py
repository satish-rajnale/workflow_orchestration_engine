from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List

router = APIRouter()


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, workflow_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.setdefault(workflow_id, []).append(websocket)

    def disconnect(self, workflow_id: int, websocket: WebSocket) -> None:
        if workflow_id in self.active_connections:
            self.active_connections[workflow_id] = [ws for ws in self.active_connections[workflow_id] if ws is not websocket]
            if not self.active_connections[workflow_id]:
                self.active_connections.pop(workflow_id, None)

    async def broadcast(self, workflow_id: int, message):
        for ws in self.active_connections.get(workflow_id, []):
            await ws.send_json(message)


manager = ConnectionManager()


@router.websocket('/ws/executions/{workflow_id}')
async def websocket_endpoint(websocket: WebSocket, workflow_id: int):
    await manager.connect(workflow_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(workflow_id, websocket)
