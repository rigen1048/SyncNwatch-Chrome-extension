import { useUniqueId } from "../utility/uniqueId";
import { useActivation } from "./components/Activation";
import RoomLink from "./components/Roomlink";
import RoomLock from "./components/Roomlock";

function App() {
  const { uniqueId, handleChangeId } = useUniqueId();
  const {
    isActive,
    buttonText,
    statusText,
    circleColor,
    isButtonDisabled,
    handleToggle,
  } = useActivation();

  const circleStyle = {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: circleColor,
    ...(isActive && {
      animation: "circle-pulse 1.5s infinite",
    }),
  };

  return (
    <>
      <style>{`
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 244, 0.7); }
          70% { box-shadow: 0 0 0 20px rgba(34, 197, 244, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 244, 0); }
        }
        @keyframes circle-pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        html, body {
          margin: 0;
          padding: 0;
          width: 260px;
          height: 340px;
          background: transparent;
          overflow: hidden;
        }
      `}</style>
      <div
        style={{
          width: "260px",
          height: "340px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#e2e8f0",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "28px 20px",
          boxSizing: "border-box",
          border: "1px solid #334155",
        }}
      >
        {/* Main Button */}
        <div
          style={{
            width: "120px",
            height: "120px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            onClick={handleToggle}
            disabled={isButtonDisabled}
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "60px",
              border: "none",
              background: isActive
                ? "linear-gradient(135deg, #22d3ee, #0891b2)"
                : isButtonDisabled
                  ? "#1e293b"
                  : "#334155",
              boxShadow: isActive
                ? "0 0 30px rgba(34, 197, 244, 0.6), 0 8px 25px rgba(0,0,0,0.4)"
                : "0 6px 15px rgba(0,0,0,0.3)",
              cursor: isButtonDisabled ? "not-allowed" : "pointer",
              opacity: isButtonDisabled ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              padding: "12px",
              boxSizing: "border-box",
              transition: "all 0.4s ease",
              animation: isActive ? "pulse-glow 2s infinite" : "none",
              outline: "none",
              WebkitAppearance: "none",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={(e) => {
              if (!isButtonDisabled) {
                e.currentTarget.style.transform = "scale(1.08)";
              }
            }}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {buttonText}
          </button>
        </div>

        {/* Status Indicator */}
        <div
          style={{
            fontSize: "13px",
            color: "#ffffff",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div style={circleStyle} />
          {statusText}
        </div>

        {/* Bottom Controls */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            fontSize: "11px",
            color: "#64748b",
          }}
        >
          {/* User ID */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ letterSpacing: "0.8px" }}>USER ID</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "15px",
                  fontWeight: "600",
                  letterSpacing: "2.5px",
                  color: "#22d3ee",
                }}
              >
                {uniqueId || "········"}
              </span>
              <button
                onClick={handleChangeId}
                style={{
                  width: "24px",
                  height: "24px",
                  background: "transparent",
                  border: "1px solid #475569",
                  borderRadius: "6px",
                  color: "#64748b",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#334155";
                  e.currentTarget.style.color = "#e2e8f0";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                ↻
              </button>
            </div>
          </div>

          {/* Room Link - extracted */}
          <RoomLink />

          {/* Room Lock - extracted */}
          <RoomLock />
        </div>
      </div>
    </>
  );
}

export default App;
