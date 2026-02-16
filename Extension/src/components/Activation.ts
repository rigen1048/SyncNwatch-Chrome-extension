// src/hooks/useActivation.ts
import { useState, useEffect } from "react";
import {
  onConnectionStatusChange,
  type ConnectionStatus,
  getCurrentConnectionStatus,
  refreshVideoConnection,
} from "../../utility/connection";

export function useActivation() {
  const [isActive, setIsActive] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("searching");

  // Real-time updates via events
  useEffect(() => {
    const unsubscribe = onConnectionStatusChange((status) => {
      setConnectionStatus(status);
    });
    return unsubscribe;
  }, []);

  // Gentle polling when not clearly connected
  useEffect(() => {
    // Only poll if we're in ambiguous states: "searching" or "none"
    if (connectionStatus === "connected") return;

    let cancelled = false;

    const check = async () => {
      if (cancelled) return;

      // Force a fresh status request from content script
      await refreshVideoConnection();

      if (!cancelled) {
        const newStatus = getCurrentConnectionStatus();
        if (newStatus !== connectionStatus) {
          setConnectionStatus(newStatus);
        }
      }
    };

    // Initial check
    check();

    // Poll every 800ms when not connected
    const interval = setInterval(check, 800);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [connectionStatus]);

  const getCurrentTabId = async (): Promise<number | undefined> => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab?.id;
  };

  // Restore activation + force connection refresh on popup open
  useEffect(() => {
    const restore = async () => {
      try {
        // 1. Force refresh connection status
        await refreshVideoConnection();

        // 2. Check activation state from background
        const response = await chrome.runtime.sendMessage({
          type: "checkActivation",
        });

        if (response?.isCurrentTabActive) {
          setIsActive(true);
          setIsLocked(false);
        } else if (response?.storedTabId !== null) {
          setIsActive(false);
          setIsLocked(true);
        } else {
          setIsActive(false);
          setIsLocked(false);
        }

        // Sync local connection status after restore
        setConnectionStatus(getCurrentConnectionStatus());
      } catch (err) {
        console.warn(
          "[useActivation] Background not ready or no content script",
          err,
        );
        setIsActive(false);
        setIsLocked(false);
      }
    };

    restore();
  }, []);

  // Toggle activation
  const handleToggle = async () => {
    const tabId = await getCurrentTabId();
    if (!tabId) {
      console.warn("[useActivation] No active tab");
      return;
    }

    if (isActive) {
      // === DEACTIVATE ===
      try {
        await chrome.runtime.sendMessage({ type: "stopActivation" });
        console.log("[useActivation] Deactivated successfully");
      } catch (err) {
        console.error("[useActivation] Failed to stop activation:", err);
      }

      setIsActive(false);
      setIsLocked(false);

      // Force re-check connection after deactivation (content script may still send status)
      await refreshVideoConnection();
    } else {
      // === ACTIVATE ===
      if (connectionStatus !== "connected") {
        console.log(
          "[useActivation] Cannot activate: not connected",
          connectionStatus,
        );
        return;
      }

      if (isLocked) {
        console.log("[useActivation] Cannot activate: locked by another tab");
        return;
      }

      try {
        await chrome.runtime.sendMessage({
          type: "startActivation",
          tabId,
        });
        console.log(`[useActivation] Activated tab ${tabId}`);
        setIsActive(true);
        setIsLocked(false);
      } catch (err) {
        console.error("[useActivation] Failed to start activation:", err);
      }
    }
  };

  // UI derivations
  const buttonText = isActive ? "Deactivate" : "Activate";
  const isButtonDisabled = connectionStatus !== "connected" || isLocked;

  const statusText = isActive
    ? "Active (this tab)"
    : isLocked
      ? "Active in another tab"
      : connectionStatus === "connected"
        ? "Connected"
        : connectionStatus === "searching"
          ? "Searching for video..."
          : "No video detected"; // covers "none"

  const circleColor =
    isActive || isLocked || connectionStatus === "connected"
      ? "#10b981" // green
      : connectionStatus === "searching"
        ? "#fbbf24" // yellow
        : "#ef4444"; // red

  return {
    isActive,
    isLocked,
    buttonText,
    statusText,
    circleColor,
    isConnected: connectionStatus === "connected",
    isButtonDisabled,
    handleToggle,
  };
}
