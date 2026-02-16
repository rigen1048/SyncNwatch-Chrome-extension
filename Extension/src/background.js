import { open, close, setWebSocketUrl } from "./components/websocket";
import { start, stop } from "./Data/observationFilter";
import { enable, disable } from "./Data/listen";
import { startPing, stopPing } from "./Data/ping";

function yes() {
  open();
  start();
  enable();
  startPing();
}
function no() {
  stopPing();
  disable();
  stop();
  close();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // === Legacy: DO NOT REMOVE (moved to the very beginning as requested) ===
  if (message.type === "getTabId" && sender.tab) {
    sendResponse({ tabId: sender.tab.id });
    return false; // sync response
  }

  // === Check stored activation ===
  if (message.type === "checkActivation") {
    (async () => {
      try {
        // Get the currently active tab in the current window (same logic as popup)
        const [currentTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        const currentTabId = currentTab?.id ?? null;

        if (currentTabId === null) {
          sendResponse({
            storedTabId: null,
            isCurrentTabActive: false,
          });
          return;
        }

        // Retrieve stored active tab ID
        const result = await chrome.storage.session.get("1");
        const storedTabId = result["1"] ?? null;

        sendResponse({
          storedTabId,
          isCurrentTabActive: storedTabId === currentTabId,
        });
      } catch (err) {
        console.error("[background] Error in checkActivation:", err);
        sendResponse({
          storedTabId: null,
          isCurrentTabActive: false,
        });
      }
    })();

    return true; // indicates async response
  }

  // === Start activation ===
  if (message.type === "startActivation" && message.tabId != null) {
    (async () => {
      try {
        await chrome.storage.session.set({ 1: message.tabId });
        yes();
        console.log("[background] Activation started for tab:", message.tabId);
      } catch (err) {
        console.error("[background] Failed to start activation:", err);
      }
    })();

    return false; // fire-and-forget, no response needed
  }

  // === Stop activation ===
  if (message.type === "stopActivation") {
    (async () => {
      try {
        await chrome.storage.session.remove("1");
        no();
        console.log("[background] Activation stopped");
      } catch (err) {
        console.error("[background] Failed to stop activation:", err);
      }
    })();

    return false; // fire-and-forget
  }
  if (message.type === "ChangeUrl") {
    if (typeof message.url !== "string" || message.url.trim() === "") {
      console.warn("[background] Invalid or missing URL in ChaneUrl message");
      sendResponse({ success: false, error: "Invalid URL" });
      return false;
    }

    const newUrl = message.url.trim();
    setWebSocketUrl(newUrl);

    // Auto-reconnect if currently activated
    (async () => {
      try {
        const result = await chrome.storage.session.get("1");
        if (result["1"] != null) {
          no();
          yes(); // Will use the new URL
          console.log(
            "[background] WebSocket reconnected with new URL:",
            newUrl,
          );
        } else {
          console.log(
            "[background] WebSocket URL updated (pending activation):",
            newUrl,
          );
        }
      } catch (err) {
        console.error(
          "[background] Error checking activation during URL change:",
          err,
        );
      }
    })();

    sendResponse({ success: true, newUrl });
    return false;
  }

  // Default: no async response
  return false;
});
