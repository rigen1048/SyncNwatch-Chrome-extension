// ping.ts
import { sendPacket } from "./translator"; // adjust path

const PING_INTERVAL_MS = 20_000; // 20 seconds
const PING_TYPE = "l" as const;
const PING_VALUE = 0;

let pingInterval: ReturnType<typeof setInterval> | null = null;
let lastPingTime = 0;
let onPongCallback: ((latencyMs: number) => void) | null = null;

/** Start the ping heartbeat */
export function startPing(onPong?: (latencyMs: number) => void) {
  if (pingInterval !== null) {
    console.warn("[ping] Already running");
    return;
  }

  onPongCallback = onPong ?? null;
  console.log("[ping] Starting heartbeat every 20s");

  sendPing(); // immediate ping
  pingInterval = setInterval(sendPing, PING_INTERVAL_MS);
}

/** Stop the ping heartbeat */
export function stopPing() {
  if (pingInterval === null) return;

  clearInterval(pingInterval);
  pingInterval = null;
  lastPingTime = 0; // optional: reset to avoid stale latency on restart
  console.log("[ping] Stopped");
}

/** Manually send a single ping (used by interval and for testing) */
export function sendPing() {
  lastPingTime = performance.now(); // ← Better precision than Date.now()
  console.log("[ping] → Sending ping");
  sendPacket(PING_TYPE, PING_VALUE);
}

/**
 * Called by the data-processing module on EVERY incoming decoded value.
 * Detects pong and notifies callback.
 */
export function onValueReceived(value: number | string) {
  if (typeof value === "number" && value === PING_VALUE) {
    const latency = Math.round(performance.now() - lastPingTime);

    console.log(`[ping] ← Pong received! Latency: ${latency}ms`);
    onPongCallback?.(latency);
  }
}

/** Optional: check if ping is active */
export function isPingRunning(): boolean {
  return pingInterval !== null;
}
