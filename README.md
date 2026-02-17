# SyncNwatch – Universal Real-Time Video Sync Extension

**Lightweight Chrome extension** (~1k LOC) for **end-to-end encrypted, site-agnostic synchronized video playback** with friends.

Works on YouTube, Netflix, Disney+, Prime Video, local files, Vimeo, arbitrary streaming sites, SPAs, shadow DOM, cross-origin iframes, and DRM-protected players.

Play/pause, seek, speed — near-perfect sync with absolute state enforcement and minimal drift.

## Key Features

- Universal, resilient video detection (MutationObserver + dynamic DOM, SPA navigation, shadow roots, nested iframes, player reloads)
- Absolute state synchronization (full playback state sent on user action — no delta drift)
- Noise-free events (filters buffering, ads, auto-play; only genuine user-initiated changes)
- End-to-end encryption (AES-GCM, client-side keys; server sees no plaintext)
- Low-latency networking (~5 ms localhost, ~250 ms avg. cross-continent via WebSocket + Cloudflare Tunnel)
- Robust connectivity (auto-reconnect, heartbeats, handles tab sleep / network drops)
- Privacy-focused backend (outbound-only Cloudflare Tunnel Zero Trust, no public IP, built-in DDoS/WAF)
- Minimal UI (clean popup: room status, participants, sync state)

## Demo

https://github.com/user-attachments/assets/8c4a72a3-95cb-42cf-8578-5165c087ad2d


## Quick Setup

**Dependencies**
Python 3 • Node.js • Bun • Cloudflare account

**Extension**

```bash
git clone https://github.com/yourusername/syncnwatch
cd Extension
bun install
bun run build # the dist file will be created which is extension
```

→ Load unpacked in `chrome://extensions/` (Developer mode)

**Server**

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Then in another terminal:

```bash
cloudflared tunnel --url http://localhost:8001
```

→ Share the tunnel URL
→ Both users open the extension popup, paste the URL, and activate

## Current Limitations

- No volume sync (intentional — keeps personal audio preferences)
- No automatic buffering protection (planned for future)
- No built-in chat (intentional — use your preferred messaging/video call app)
- No standalone connection forwarding

## ⚠️ Important – No License Yet

This project currently has **no LICENSE file**.

Under default copyright law ("all rights reserved"):

**Allowed:**
- View the code
- Fork on GitHub (per GitHub ToS)
- Clone and run locally **for personal evaluation, learning, technical discussion, portfolio review, or interview purposes** (fair use)

**Not allowed without explicit permission:**
- Modify, distribute, sublicense, or create derivative works
- Use in production, commercial products, public demos, or any redistributed form
- Upload modified versions elsewhere or claim as your own

The author has not yet decided on a final license (MIT, GPL, proprietary, etc.) as distribution plans (portfolio-only vs commercial/open-source) are still under consideration.

If you want to use/modify this beyond personal evaluation, please contact the author via GitHub issue or email for permission.

Thank you for respecting these terms.

## Contributions

Not accepted until a license is finalized (to avoid legal complications).
Thanks for your understanding!
