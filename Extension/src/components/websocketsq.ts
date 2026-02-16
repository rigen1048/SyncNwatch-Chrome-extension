// ../utility/websocketManager.ts
class WebSocketManager {
  private socket: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private isActive: boolean = false;
  private messageCallback: ((data: Uint8Array) => void) | null = null;

  private connect() {
    if (!this.isActive) return;

    this.socket = new WebSocket("ws://localhost:8000/ws");
    this.socket.binaryType = "arraybuffer";

    this.socket.onopen = () => {
      console.log("[WS] Connected");
    };

    this.socket.onmessage = (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer) {
        const uint8 = new Uint8Array(event.data);
        // Only forward packets smaller than 6 bytes
        if (uint8.length < 6 && this.messageCallback) {
          this.messageCallback(uint8);
        }
      }
    };

    this.socket.onerror = (err) => {
      console.error("[WS] Error:", err);
    };

    this.socket.onclose = () => {
      this.socket = null;
      if (this.isActive) {
        this.reconnectTimeout = setTimeout(() => this.connect(), 1000);
      }
    };
  }

  public open() {
    if (this.isActive) return;
    this.isActive = true;
    console.log("[WS] Opening");
    this.connect();
  }

  public close() {
    if (!this.isActive) return;
    this.isActive = false;
    console.log("[WS] Closing");

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }

    // Recommended: clear the callback to avoid holding stale references
    this.messageCallback = null;
  }

  public sendBinary(data: Uint8Array) {
    // Only allow sending packets smaller than 6 bytes
    if (data.length >= 4) {
      console.warn("[WS] Blocked send: packet size >= 4 bytes");
      return;
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      console.warn("[WS] Cannot send - not connected");
    }
  }

  public receiveBinary(callback: (data: Uint8Array) => void) {
    this.messageCallback = callback;
  }
}

const manager = new WebSocketManager();

export const open = () => manager.open();
export const close = () => manager.close();
export const sendBinary = (data: Uint8Array) => manager.sendBinary(data);
export const receiveBinary = (callback: (data: Uint8Array) => void) =>
  manager.receiveBinary(callback);
