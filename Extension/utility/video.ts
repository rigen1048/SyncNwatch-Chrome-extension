// utility/video.ts
function generateSelector(video: HTMLVideoElement): string {
  if (video.id) return `#${video.id}`;
  if (video.classList.length > 0) {
    const classes = Array.from(video.classList).join(".");
    return `video.${classes}`;
  }
  // Fallback: build DOM path with full null-safety
  const path: string[] = [];
  let el: HTMLElement | null = video;
  while (el && el !== document.body) {
    let selector = el.tagName.toLowerCase();
    if (el.id) {
      selector += `#${el.id}`;
      path.unshift(selector);
      break;
    }
    if (el.classList.length > 0) {
      const classes = Array.from(el.classList).join(".");
      selector += `.${classes}`;
    }
    // Add nth-of-type for uniqueness — safe type guard
    const parent = el.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (sib): sib is HTMLElement => sib.tagName === el!.tagName, // el is guaranteed non-null here
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(el) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }
    path.unshift(selector);
    el = el.parentElement;
  }
  return path.join(" > ");
}

async function trySavedSelector(
  callback: (video: HTMLVideoElement) => void,
): Promise<boolean> {
  const hostname = location.hostname;
  try {
    const selector = sessionStorage.getItem(`watchsync_${hostname}`);
    if (typeof selector === "string") {
      const video = document.querySelector<HTMLVideoElement>(selector);
      if (video && !video.dataset.watchsync && video.readyState > 0) {
        video.dataset.watchsync = "true";
        callback(video);
        console.log("[VideoUtils] Found via saved selector:", selector);
        return true;
      } else {
        sessionStorage.removeItem(`watchsync_${hostname}`);
        console.log("[VideoUtils] Removed outdated selector:", selector);
      }
    }
  } catch (err) {
    console.error("[VideoUtils] Session storage error:", err);
  }
  return false;
}

export async function checkAndAttachVideo(
  callback: (video: HTMLVideoElement) => void,
): Promise<void> {
  const fromStorage = await trySavedSelector(callback);
  if (fromStorage) return;

  // Efficiently find the first qualifying video in document order
  const videos = document.getElementsByTagName("video");
  let video: HTMLVideoElement | undefined;
  for (let i = 0; i < videos.length; i++) {
    const v = videos[i] as HTMLVideoElement;
    if (!v.dataset.watchsync && v.readyState > 0) {
      video = v;
      break;
    }
  }

  if (!video) return;

  video.dataset.watchsync = "true";
  callback(video);

  const hostname = location.hostname;
  const newSelector = generateSelector(video);
  sessionStorage.setItem(`watchsync_${hostname}`, newSelector);
  console.log("[VideoUtils] Attached + saved new selector:", newSelector);
}

export function observeVideo(
  callback: (video: HTMLVideoElement) => void,
): MutationObserver {
  const observer = new MutationObserver(() => {
    checkAndAttachVideo(callback);
  });
  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "id"],
  });
  checkAndAttachVideo(callback);
  return observer;
}
