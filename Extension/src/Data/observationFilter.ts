import { sendPacket } from "./translator";

/**
 * Video status as received from the content script
 */
interface VideoStatus {
  paused: boolean;
  speed: number;
  currentTime: number;
  duration: number;
}

type PlayPauseState = 1 | -1 | 0; // 1 = playing, -1 = paused, 0 = initial/no video

class ObservationFilter {
  private lastPlayPause: PlayPauseState = 0;
  private lastSpeed: number | null = null;
  private lastTime: number | null = null;
  private cooldownEnd: number = 0; // performance.now() timestamp when cooldown ends; 0 means no cooldown
  private messageListener: ((message: any) => void) | null = null;
  private isActive: boolean = false;

  public start() {
    if (this.isActive) return;
    this.isActive = true;
    console.log("[ObservationFilter] Starting");
    this.subscribe();
  }

  public stop() {
    if (!this.isActive) return;
    this.isActive = false;
    console.log("[ObservationFilter] Stopping");
    this.shutdown();
  }

  private subscribe() {
    if (this.messageListener) return;
    this.messageListener = (message: any) => {
      if (message?.type === "statusUpdate" && message?.status) {
        this.handleStatusUpdate(message.status as VideoStatus);
      }
    };
    chrome.runtime.onMessage.addListener(this.messageListener);
  }

  private shutdown() {
    if (this.messageListener) {
      chrome.runtime.onMessage.removeListener(this.messageListener);
      this.messageListener = null;
    }
    this.lastPlayPause = 0;
    this.lastSpeed = null;
    this.lastTime = null;
    this.cooldownEnd = 0;
  }

  private handleStatusUpdate(status: VideoStatus | null) {
    if (!this.isActive) return;

    // Reset state if no valid video
    if (!status || status.duration <= 0 || isNaN(status.duration)) {
      this.lastPlayPause = 0;
      this.lastSpeed = null;
      this.lastTime = null;
      this.cooldownEnd = 0;
      return;
    }

    const { paused, speed, currentTime } = status;
    let now = performance.now(); // for proper ms condition check without leak

    // === Seek Detection (≥4 seconds jump) ===
    if (this.lastTime !== null) {
      const diff = Math.abs(currentTime - this.lastTime);
      if (diff >= 4) {
        sendPacket("t", Math.floor(currentTime));
        this.cooldownEnd = now + 60; // if wrote  performance.now() + 60, reassignment won't be fast enough
      }
    }
    this.lastTime = currentTime;

    // === Speed Change Detection ===
    if (this.lastSpeed !== null && this.lastSpeed !== speed) {
      sendPacket("r", Math.round(speed * 100));
    }
    this.lastSpeed = speed;

    // === Play / Pause Detection (completely skipped during cooldown) ===
    if (performance.now() > this.cooldownEnd) {
      const newPlayPause: PlayPauseState = paused ? -1 : 1;

      if (this.lastPlayPause !== 0 && this.lastPlayPause * newPlayPause !== 1) {
        sendPacket("p", paused ? "pause" : "play");
      }

      this.lastPlayPause = newPlayPause;
      this.cooldownEnd = now + 60; // to avoid Sync hazard
    }
    // During cooldown: intentionally skip all play/pause logic and state updates
  }
}

const filter = new ObservationFilter();

// Export minimal public API
export const start = () => filter.start();
export const stop = () => filter.stop();
