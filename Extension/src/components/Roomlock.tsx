import { useState } from "react";

export default function RoomLock() {
  const [isRoomLocked, setIsRoomLocked] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ letterSpacing: "0.8px" }}>ROOM LOCK</span>
      <button
        onClick={() => setIsRoomLocked(!isRoomLocked)}
        style={{
          padding: "4px 14px",
          background: isRoomLocked ? "#22d3ee" : "#1e293b",
          border: isRoomLocked ? "none" : "1px solid #475569",
          borderRadius: "6px",
          color: "#ffffff",
          fontSize: "11px",
          fontWeight: "bold",
          letterSpacing: "1px",
          cursor: "pointer",
          transition: "all 0.3s",
          minWidth: "48px",
        }}
        onMouseOver={(e) => {
          if (!isRoomLocked) e.currentTarget.style.background = "#334155";
        }}
        onMouseOut={(e) => {
          if (!isRoomLocked) e.currentTarget.style.background = "#1e293b";
        }}
      >
        {isRoomLocked ? "ON" : "OFF"}
      </button>
    </div>
  );
}
