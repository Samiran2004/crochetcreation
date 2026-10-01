"""
Live collaboration rooms, one per design.

Clients exchange *object-level* operations rather than whole scenes. A design
is a flat list of independent objects and two people almost never touch the
same one at the same moment, so broadcasting "this object changed" converges
without the machinery a full CRDT would need — and it keeps a drag at a few
hundred bytes per frame instead of re-sending the artboard.

The server does not interpret the artboard. It checks who is allowed to
write, stamps the sender, and fans the message out; the canvases themselves
converge on the clients.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from fastapi import WebSocket

logger = logging.getLogger("app.collab")

# Assigned round-robin so every participant is a different colour in the
# presence row, their cursor and their selection outline.
PRESENCE_COLOURS = [
    "#C0663A",
    "#1F4E4A",
    "#C79A4B",
    "#585C36",
    "#3E7CB1",
    "#8E7DBE",
    "#D45D79",
    "#4A8A6F",
]


@dataclass
class Member:
    socket: WebSocket
    member_id: str
    name: str
    colour: str
    can_edit: bool
    # True when the connection was authenticated by a share link rather than
    # by an admin session, so revoking the link can close exactly those.
    via_share: bool = False


@dataclass
class Room:
    design_id: str
    members: List[Member] = field(default_factory=list)
    counter: int = 0


class CollabManager:
    def __init__(self) -> None:
        self._rooms: Dict[str, Room] = {}
        self._lock = asyncio.Lock()

    async def join(
        self,
        design_id: str,
        socket: WebSocket,
        member_id: str,
        name: str,
        can_edit: bool,
        via_share: bool,
    ) -> Member:
        async with self._lock:
            room = self._rooms.setdefault(design_id, Room(design_id=design_id))
            colour = PRESENCE_COLOURS[room.counter % len(PRESENCE_COLOURS)]
            room.counter += 1
            member = Member(
                socket=socket,
                member_id=member_id,
                name=name or "Guest",
                colour=colour,
                can_edit=can_edit,
                via_share=via_share,
            )
            room.members.append(member)
            return member

    async def leave(self, design_id: str, socket: WebSocket) -> None:
        async with self._lock:
            room = self._rooms.get(design_id)
            if not room:
                return
            room.members = [m for m in room.members if m.socket is not socket]
            if not room.members:
                self._rooms.pop(design_id, None)

    def roster(self, design_id: str) -> List[dict]:
        room = self._rooms.get(design_id)
        if not room:
            return []
        return [
            {
                "id": m.member_id,
                "name": m.name,
                "colour": m.colour,
                "canEdit": m.can_edit,
            }
            for m in room.members
        ]

    async def _send(self, member: Member, message: dict) -> bool:
        try:
            await member.socket.send_json(message)
            return True
        except Exception:
            return False

    async def broadcast(
        self, design_id: str, message: dict, exclude: Optional[WebSocket] = None
    ) -> None:
        room = self._rooms.get(design_id)
        if not room:
            return
        dead: List[Member] = []
        for member in list(room.members):
            if exclude is not None and member.socket is exclude:
                continue
            if not await self._send(member, message):
                dead.append(member)
        for member in dead:
            await self.leave(design_id, member.socket)

    async def announce_presence(self, design_id: str) -> None:
        await self.broadcast(
            design_id, {"type": "presence", "members": self.roster(design_id)}
        )

    async def close_shared_connections(self, design_id: str) -> None:
        """
        Disconnect everyone who got in through the share link.

        Revoking a link has to take effect on the people already inside it,
        not merely stop new ones arriving.
        """
        room = self._rooms.get(design_id)
        if not room:
            return
        for member in list(room.members):
            if not member.via_share:
                continue
            try:
                await member.socket.close(code=4003, reason="Sharing was turned off")
            except Exception:
                pass
            await self.leave(design_id, member.socket)
        await self.announce_presence(design_id)


collab = CollabManager()
