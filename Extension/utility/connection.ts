// ../utility/connection.ts

export type ConnectionStatus = "connected" | "searching" | "none";

type ConnectionCallback = (status: ConnectionStatus) => void;

// Internal singleton state
let currentConnectionStatus: ConnectionStatus = "searching";
const connectionListeners = new Set<ConnectionCallback>();

// Helper to update and notify listeners
function updateConnectionStatus(newStatus: ConnectionStatus) {
  if (currentConnectionStatus === newStatus) return;
  currentConnectionStatus = newStatus;
  connectionListeners.forEach((cb) => cb(newStatus));
}

// Initial status detection: try to query active tab
async function requestInitialStatus() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      updateConnectionStatus("none");
      return;
    }

    // Send message to content script to check if it exists and can respond
    await chrome.tabs.sendMessage(tab.id, { type: "pingConnection" });
    updateConnectionStatus("connected");
  } catch (e) {
    // No content script injected or no response → either no video page or not loaded
    updateConnectionStatus("searching");
  }
}

// Listen for explicit status updates from content script (optional but useful)
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "connectionStatus") {
    updateConnectionStatus(message.status as ConnectionStatus);
  }
});

// Initial check on module load
requestInitialStatus();

// ====================
// Public API (only what you asked to keep)
// ====================

/**
 * Subscribe to connection status changes.
 * Callback is called immediately with current status.
 * Returns unsubscribe function.
 */
export function onConnectionStatusChange(
  callback: ConnectionCallback,
): () => void {
  connectionListeners.add(callback);
  callback(currentConnectionStatus); // immediate
  return () => connectionListeners.delete(callback);
}

/**
 * Get current connection status synchronously
 */
export function getCurrentConnectionStatus(): ConnectionStatus {
  return currentConnectionStatus;
}

/**
 * Manually trigger a refresh of the connection status
 */
export async function refreshVideoConnection() {
  await requestInitialStatus();
}
