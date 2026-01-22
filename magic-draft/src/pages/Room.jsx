import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Room() {
  const { roomId } = useParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log("Room mounted");
    console.log("roomId:", roomId);
    setMounted(true);
  }, [roomId]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#111",
      color: "#fff",
      padding: "24px",
      fontFamily: "system-ui"
    }}>
      <h1>ROOM DEBUG PAGE</h1>

      <p><strong>Mounted:</strong> {mounted ? "YES" : "NO"}</p>
      <p><strong>Room ID:</strong> {roomId || "❌ missing"}</p>

      <hr />

      <p>If you see this page, routing & deployment are ✅</p>

      <div style={{
        marginTop: "20px",
        padding: "12px",
        background: "#222",
        borderRadius: "8px"
      }}>
        <p>Next steps will restore:</p>
        <ul>
          <li>Firestore snapshot</li>
          <li>Draft state</li>
          <li>Commander grid</li>
          <li>Timeline indicator</li>
        </ul>
      </div>
    </div>
  );
}
