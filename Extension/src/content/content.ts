import { observeVideo } from "../../utility/video";

let videoElement: HTMLVideoElement | null = null;
let metadataLoaded = false;

// Track whether a seek was initiated by the extension
let pendingSeek: number | null = null;

function handleVideo(video: HTMLVideoElement) {
  if (videoElement === video) return;

  // Remove old listeners
  if (videoElement) {
    videoElement.removeEventListener("play", pushStatus);
    videoElement.removeEventListener("pause", pushStatus);
    videoElement.removeEventListener("ratechange", pushStatus);
    videoElement.removeEventListener("seeked", onSeeked);
    videoElement.removeEventListener("loadedmetadata", onMetadataLoaded);
  }

  videoElement = video;
  metadataLoaded = false;

  // Attach listeners
  video.addEventListener("play", pushStatus);
  video.addEventListener("pause", pushStatus);
  video.addEventListener("ratechange", pushStatus);

  // IMPORTANT: we no longer listen to timeupdate
  video.addEventListener("seeked", onSeeked);

  video.addEventListener("loadedmetadata", onMetadataLoaded);

  // If metadata already loaded, push initial state
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    metadataLoaded = true;
    pushStatus();
  }
}

function onMetadataLoaded() {
  if (metadataLoaded) return;
  metadataLoaded = true;
  pushStatus();
}

function onSeeked() {
  if (!videoElement || !metadataLoaded) return;

  // If this seek was triggered by our extension
  if (pendingSeek !== null) {
    pendingSeek = null; // mark as completed
    pushStatus(); // send final stable timestamp
    return;
  }

  // If user manually scrubbed, also send final timestamp
  pushStatus();
}

function pushStatus() {
  if (!videoElement || !metadataLoaded) return;

  chrome.runtime.sendMessage({
    type: "statusUpdate",
    status: {
      paused: videoElement.paused,
      speed: videoElement.playbackRate,
      currentTime: videoElement.currentTime,
      duration: videoElement.duration,
    },
  });
}

observeVideo(handleVideo);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!videoElement) {
    if (message.type === "getStatus") {
      sendResponse({ noVideo: true });
    }
    return;
  }

  if (!metadataLoaded) {
    if (message.type === "getStatus") {
      sendResponse({ loading: true });
    }
    return true;
  }

  switch (message.type) {
    case "play":
      videoElement.play();
      pushStatus();
      break;

    case "pause":
      videoElement.pause();
      pushStatus();
      break;

    case "setSpeed":
      videoElement.playbackRate = message.speed;
      pushStatus();
      break;

    case "seekTo":
      pendingSeek = message.time;
      videoElement.currentTime = message.time;
      // DO NOT pushStatus() here — wait for seeked event
      break;

    case "getStatus":
      sendResponse({
        paused: videoElement.paused,
        speed: videoElement.playbackRate,
        currentTime: videoElement.currentTime,
        duration: videoElement.duration,
      });
      return true;
  }
});
