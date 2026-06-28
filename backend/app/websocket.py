from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        # Maps user_id to list of active WebSockets (allows multi-device/multi-tab connection)
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            dead_sockets = []
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception:
                    # Collect closed/dead sockets for cleanup
                    dead_sockets.append(websocket)
            for ws in dead_sockets:
                self.disconnect(user_id, ws)

    async def broadcast_to_members(self, member_ids: List[str], message: dict):
        for user_id in member_ids:
            await self.send_personal_message(message, user_id)

manager = ConnectionManager()
