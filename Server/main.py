
import logging
from typing import List, Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("websocket_hub")

# Shared state
connected_clients: List[WebSocket] = []
client_ids: Dict[WebSocket, bytes] = {}  # Stores 0x09 payload (without the 0x09 byte)
room_open: bool = True

def get_stats() -> str:
    total = len(connected_clients)
    identified = len(client_ids)
    return f"Clients: {total} total, {identified} identified"

async def broadcast(data: bytes, exclude: WebSocket | None = None):
    """Broadcast to all clients except the optional excluded one."""
    if not connected_clients:
        return

    target_count = len(connected_clients) - (1 if exclude else 0)
    logger.info(f"BROADCAST → {data.hex().upper()} | to {target_count} clients | {get_stats()}")

    disconnected = []
    for client in connected_clients[:]:  # copy to avoid modification issues
        if client == exclude:
            continue
        try:
            await client.send_bytes(data)
        except Exception:
            disconnected.append(client)

    # Clean up failed clients
    for client in disconnected:
        await disconnect_client(client)

async def disconnect_client(ws: WebSocket):
    """Properly clean up a disconnected client."""
    if ws in connected_clients:
        connected_clients.remove(ws)

    had_id = ws in client_ids
    if had_id:
        client_ids.pop(ws)

    client_info = f"{ws.client.host}:{ws.client.port}" if ws.client else "unknown"
    id_preview = client_ids.get(ws, b"")[:8].hex().upper() + ("..." if len(client_ids.get(ws, b"")) > 8 else "")
    logger.info(
        f"DISCONNECTED ← {client_info} | {'ID: ' + id_preview if had_id else 'no ID'} | {get_stats()}"
    )

    if room_open:
        await broadcast(bytes([0x06, 0x03]))  # User left notification
@app.websocket("/")
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global room_open

    await websocket.accept()
    connected_clients.append(websocket)

    client_info = f"{websocket.client.host}:{websocket.client.port}" if websocket.client else "unknown"
    logger.info(f"CONNECTED → {client_info} | {get_stats()}")

    # Notify ALL clients (including the new one) that a user joined
    if room_open:
        await broadcast(bytes([0x06, 0x02]))

    try:
        while True:
            data = await websocket.receive_bytes()

            if not data:
                continue

            hex_data = data.hex().upper()
            short_hex = hex_data[:64] + ("..." if len(hex_data) > 64 else "")
            logger.info(f"RECEIVED ← {client_info} | 0x{data[0]:02X} | {short_hex} | len={len(data)}")

            opcode = data[0]

            # Server commands (0x05)
            if opcode == 0x05 and len(data) >= 2:
                cmd = data[1]
                if cmd == 0x00 and room_open:  # Close room
                    room_open = False
                    logger.info(f"ROOM CLOSED by {client_info}")
                    await broadcast(bytes([0x06, 0x00]))
                elif cmd == 0x01 and not room_open:  # Open room
                    room_open = True
                    logger.info(f"ROOM OPENED by {client_info}")
                    await broadcast(bytes([0x06, 0x01]))
                continue

            # Latency ping (0x07) - echo back to sender only
            if opcode == 0x07:
                try:
                    await websocket.send_bytes(data)
                except Exception:
                    pass
                continue

            # Drift (0x08) - currently ignored
            if opcode == 0x08:
                continue

            # Client ID packet (0x09) - store and broadcast to everyone including sender
            if opcode == 0x09:
                old_count = len(client_ids)
                client_ids[websocket] = data[1:]  # store payload without opcode
                id_preview = data[1:][:16].hex().upper() + ("..." if len(data) > 17 else "")
                logger.info(f"ID RECEIVED ← {client_info} | {id_preview} | identified: {old_count} → {len(client_ids)}")
                await broadcast(data)  # broadcast full packet including 0x09
                continue

            # All other packets (P2P data) - broadcast to everyone including sender
            await broadcast(data, exclude = websocket)

    except WebSocketDisconnect:
        logger.info(f"DISCONNECT ← {client_info}")
        await disconnect_client(websocket)
    except Exception as e:
        logger.error(f"ERROR with {client_info}: {e}")
        await disconnect_client(websocket)
