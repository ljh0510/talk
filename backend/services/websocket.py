import json
from typing import Dict, List
from fastapi import WebSocket, WebSocketDisconnect, status
from core.database import SessionLocal
import crud

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

async def handle_websocket_session(websocket: WebSocket, user_id: int):
    # 1. Retrieve user information
    async with SessionLocal() as db:
        user = await crud.get_user_by_id(db, user_id)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        rep = next((m for m in user.workspace_memberships if m.is_representative), None)
        if not rep and user.workspace_memberships:
            rep = user.workspace_memberships[0]
        display_name = rep.nickname if rep else user.username

    # 2. Connect client
    await manager.connect(str(user_id), websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                event = json.loads(data)
            except json.JSONDecodeError:
                continue
                
            event_type = event.get("type")
            room_id = event.get("room_id")
            
            if not event_type or not room_id:
                continue

            async with SessionLocal() as db:
                # Verify user membership using CRUD layer
                is_member = await crud.verify_room_membership(db, room_id, user_id)
                if not is_member:
                    continue
                
                # Fetch all member IDs in the room using CRUD layer
                room_member_ids = await crud.get_room_member_ids(db, room_id)
                room_member_str_ids = [str(uid) for uid in room_member_ids]

                if event_type == "typing":
                    typing_payload = {
                        "event": "typing",
                        "room_id": room_id,
                        "user_id": user_id,
                        "display_name": display_name,
                        "is_typing": event.get("is_typing", True)
                    }
                    other_member_ids = [m_id for m_id in room_member_str_ids if m_id != str(user_id)]
                    await manager.broadcast_to_members(other_member_ids, typing_payload)

    except WebSocketDisconnect:
        manager.disconnect(str(user_id), websocket)
    except Exception:
        manager.disconnect(str(user_id), websocket)
