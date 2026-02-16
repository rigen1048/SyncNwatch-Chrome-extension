import { useState } from "react";

export default function RoomLink() {
  const [roomLink, setRoomLink] = useState("");

  const handleSendLink = () => {
    const link = roomLink.trim();
    if (!link) return;

    console.log("Room link submitted:", link);

    // Send the URL to the background script without any validation or feedback
    chrome.runtime.sendMessage({
      type: "ChangeUrl", // Ensure this matches your background script
      url: link,
    });

    // Clear the input immediately after sending
    setRoomLink("");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ letterSpacing: "0.8px" }}>ROOM LINK</span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          maxWidth: "158px",
        }}
      >
        <input
          type="text"
          placeholder="Paste link"
          value={roomLink}
          onChange={(e) => setRoomLink(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendLink()}
          style={{
            width: "100%",
            maxWidth: "132px",
            padding: "6px 8px",
            background: "#1e293b",
            border: "1px solid #475569",
            borderRadius: "5px",
            color: "#e2e8f0",
            fontSize: "11px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={handleSendLink}
          disabled={!roomLink.trim()}
          style={{
            width: "26px",
            height: "26px",
            background: roomLink.trim() ? "#22d3ee" : "#334155",
            border: "none",
            borderRadius: "5px",
            color: "#ffffff",
            fontSize: "14px",
            cursor: roomLink.trim() ? "pointer" : "default",
            opacity: roomLink.trim() ? 1 : 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.3s",
          }}
        >
          ✓
        </button>
      </div>
    </div>
  );
}
