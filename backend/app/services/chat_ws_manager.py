from typing import Dict, List, Set, Optional, Any
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)

class ChatConnectionManager:
    """
    Manages active WebSocket connections for student <-> counselor confidential chat rooms.
    Maintains an in-memory mapping of conversation_id -> list of active WebSocket connections.
    """
    def __init__(self):
        # Mapping: conversation_id -> Dict[WebSocket, str (user_id)]
        self._active_connections: Dict[str, Dict[WebSocket, str]] = {}

    async def connect(self, conversation_id: str, user_id: str, websocket: WebSocket) -> None:
        """Accepts a WebSocket connection and registers it with the conversation."""
        await websocket.accept()
        if conversation_id not in self._active_connections:
            self._active_connections[conversation_id] = {}
        self._active_connections[conversation_id][websocket] = user_id
        logger.info(f"WebSocket client connected to conversation {conversation_id} (user: {user_id})")

    def disconnect(self, conversation_id: str, websocket: WebSocket) -> None:
        """Removes a disconnected WebSocket from the conversation room."""
        if conversation_id in self._active_connections:
            user_id = self._active_connections[conversation_id].pop(websocket, None)
            if not self._active_connections[conversation_id]:
                del self._active_connections[conversation_id]
            logger.info(f"WebSocket client disconnected from conversation {conversation_id} (user: {user_id})")

    async def broadcast_to_conversation(
        self,
        conversation_id: str,
        data: Dict[str, Any],
        exclude_ws: Optional[WebSocket] = None
    ) -> None:
        """Broadcasts a JSON message to all active participants in a conversation."""
        if conversation_id not in self._active_connections:
            return

        dead_sockets: List[WebSocket] = []
        for ws, user_id in list(self._active_connections[conversation_id].items()):
            if exclude_ws and ws == exclude_ws:
                continue
            try:
                await ws.send_json(data)
            except Exception as e:
                logger.warning(f"Failed to send message to user {user_id} in {conversation_id}: {e}")
                dead_sockets.append(ws)

        for ws in dead_sockets:
            self.disconnect(conversation_id, ws)

    async def send_personal_message(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        """Sends a JSON message to a specific WebSocket client."""
        try:
            await websocket.send_json(data)
        except Exception as e:
            logger.warning(f"Failed to send personal message: {e}")

    def is_user_in_conversation(self, conversation_id: str, user_id: str) -> bool:
        """Checks if a user is actively connected to the specified conversation."""
        if conversation_id not in self._active_connections:
            return False
        return user_id in self._active_connections[conversation_id].values()

    def get_online_users(self, conversation_id: str) -> Set[str]:
        """Returns the set of distinct user IDs currently connected to the conversation."""
        if conversation_id not in self._active_connections:
            return set()
        return set(self._active_connections[conversation_id].values())

# Global singleton connection manager
chat_ws_manager = ChatConnectionManager()
