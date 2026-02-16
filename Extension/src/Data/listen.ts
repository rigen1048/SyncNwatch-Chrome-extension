// src/Data/listen.ts

import { PacketType, CommandSubEnums, Pcmd, Ucmd } from "./type";
import { receiveBinary } from "../components/websocket";
import { onValueReceived } from "./ping";

/**
 * Sends a control command to the content script in the CURRENT ACTIVE TAB.
 * Uses chrome.tabs.sendMessage for reliable delivery (unlike runtime.sendMessage).
 */
async function sendControlMessage(message: any) {
  try {
    // Get the active tab in the current window
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const tab = tabs[0];
    if (!tab?.id) {
      console.log(
        "[listen] No active tab found – cannot send control message:",
        message,
      );
      return;
    }

    // Send directly to the content script in that tab
    await chrome.tabs.sendMessage(tab.id, message);
    console.log(`[listen] Sent to tab ${tab.id}:`, message);
  } catch (error: any) {
    // Expected when no content script is injected (e.g., not on a video page)
    if (
      error.message?.includes("Receiving end does not exist") ||
      error.message?.includes("Could not establish connection")
    ) {
      console.log(
        "[listen] No content script listening in active tab (normal if not on video page)",
      );
      return;
    }

    // Unexpected errors
    console.error("[listen] Failed to send control message:", message, error);
  }
}

/**
 * Handles incoming binary packets from the WebSocket.
 */
function handleBinaryPacket(data: Uint8Array | ArrayBuffer) {
  const packet = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (packet.byteLength < 2) {
    console.warn("[listen] Received packet too short:", packet);
    return;
  }

  console.log(`[listener] Received packet: [${Array.from(packet).join(", ")}]`);

  const typeByte = packet[0];
  const typeEntry = Object.entries(PacketType).find(
    ([, value]) => value === typeByte,
  );
  if (!typeEntry) {
    console.warn("[listen] Unknown packet type byte:", typeByte);
    return;
  }
  const typeKey = typeEntry[0] as keyof typeof PacketType;

  // Handle 2-byte command packets (p, e, c, u)
  const subEnum = CommandSubEnums[typeKey as keyof typeof CommandSubEnums];
  if (subEnum !== undefined) {
    if (packet.byteLength < 2) {
      console.warn("[listen] Command packet incomplete:", typeKey);
      return;
    }
    const subByte = packet[1];

    switch (typeKey) {
      case "p": // play/pause
        if (subByte === Pcmd.play) {
          sendControlMessage({ type: "play" });
        } else if (subByte === Pcmd.pause) {
          sendControlMessage({ type: "pause" });
        }
        break;

      case "e": // error
        if (subByte === 0x00) {
          console.error("[listen] Server error: Video not found");
          // showError("Video not found");
        }
        break;

      case "u": // user notifications
        switch (subByte) {
          case Ucmd.joined:
            console.log("[listen] A user joined the room");
            // showNotification("A user joined the room");
            break;
          case Ucmd.left:
            console.log("[listen] A user left the room");
            // showNotification("A user left the room");
            break;
          case Ucmd.reconnect:
            console.log("[listen] A user reconnected");
            // showNotification("A user reconnected");
            break;
        }
        break;

      case "c": // server command (usually ignored)
        console.log("[listen] Received server command (ignored):", subByte);
        break;
    }
    return;
  }

  // Handle 3-byte numeric packets
  if (packet.byteLength < 3) {
    console.warn("[listen] Numeric packet too short for type:", typeKey);
    return;
  }

  const rawValue = (packet[1] << 8) | packet[2]; // big-endian uint16

  switch (typeKey) {
    case "t": // seek timestamp in milliseconds
      console.log(`[listen] Seek to ${rawValue / 1000}s`);
      sendControlMessage({
        type: "seekTo",
        time: rawValue,
      });
      break;

    case "r": // playback rate ×100
      console.log(`[listen] Set speed to ${rawValue / 100}x`);
      sendControlMessage({
        type: "setSpeed",
        speed: rawValue / 100,
      });
      break;

    case "l": // latency
      onValueReceived(rawValue);
      console.log(`[listen] Ping latency: ${rawValue}ms`);
      // updateLatencyDisplay(rawValue);
      break;

    case "d": // drift correction
      console.log(`[listen] Apply drift correction: ${rawValue}`);
      // applyDriftCorrection(rawValue);
      break;

    case "i": // reconnect user ID
      console.log(`[listen] User ID for reconnect: ${rawValue}`);
      // handleReconnectUserId(rawValue);
      break;

    default:
      console.warn(
        "[listen] Unhandled numeric packet type:",
        typeKey,
        rawValue,
      );
  }
}

/**
 * Optional: Allow content scripts or popup to query the current tab ID
 * (useful for debugging or advanced features)
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getTabId" && sender.tab) {
    sendResponse({ tabId: sender.tab.id });
    return false; // synchronous response
  }
  // Return false by default for async safety
  return false;
});

class PacketListener {
  private isActive: boolean = false;

  public enable() {
    if (this.isActive) return;
    this.isActive = true;
    console.log("[PacketListener] Enabling");
    receiveBinary(handleBinaryPacket);
  }

  public disable() {
    if (!this.isActive) return;
    this.isActive = false;
    console.log("[PacketListener] Disabling");
    // If receiveBinary ever supports unregistering, call it here
  }
}

const listener = new PacketListener();

// Export minimal public API
export const enable = () => listener.enable();
export const disable = () => listener.disable();
