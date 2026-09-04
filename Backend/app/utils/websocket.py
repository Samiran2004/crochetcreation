import logging
from dataclasses import dataclass
from typing import List, Optional
from fastapi import WebSocket

logger = logging.getLogger("app.ws")


@dataclass
class Connection:
    socket: WebSocket
    user_id: str
    is_admin: bool


class WebSocketManager:
    """
    Tracks who is on the other end of each socket so order events can be
    addressed rather than shouted.

    Order payloads carry customer names, emails, phone numbers and shipping
    addresses, so a plain broadcast would hand every shopper everyone else's
    personal details. Every send goes through `send_order_event`, which
    delivers only to admins and to the customer the order belongs to.
    """

    def __init__(self):
        self.active_connections: List[Connection] = []

    async def connect(self, websocket: WebSocket, user_id: str, is_admin: bool):
        await websocket.accept()
        self.active_connections.append(
            Connection(socket=websocket, user_id=str(user_id), is_admin=is_admin)
        )

    def disconnect(self, websocket: WebSocket):
        self.active_connections = [
            c for c in self.active_connections if c.socket is not websocket
        ]

    async def _send(self, connection: Connection, message: dict):
        try:
            await connection.socket.send_json(message)
        except Exception:
            self.disconnect(connection.socket)

    async def send_order_event(self, action: str, order: dict, owner_id: Optional[str]):
        """
        Deliver an order event to every admin, plus the one customer who placed
        it. `owner_id` is the order's user_id (None for guest orders, which then
        reach admins only).
        """
        message = {"action": action, "data": order}
        owner = str(owner_id) if owner_id else None

        for connection in list(self.active_connections):
            if connection.is_admin or (owner is not None and connection.user_id == owner):
                await self._send(connection, message)

    async def broadcast_to_admins(self, message: dict):
        for connection in list(self.active_connections):
            if connection.is_admin:
                await self._send(connection, message)


manager = WebSocketManager()
