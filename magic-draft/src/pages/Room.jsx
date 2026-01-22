import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { db, auth } from "../firebase"
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion
} from "firebase/firestore"
import { getDraftSteps } from "../draftSteps"
import { commanders } from "../commanders"

export default function Room() {
  const { code } = useParams()
  const [room, setRoom] = useState(null)
  const [copied, setCopied] = useState(false)
  const [chatInput, setChatInput] = useState("")

  // =========================
  // FIRESTORE SUBSCRIBE
  // =========================
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "rooms", code), (snap) => {
      setRoom(snap.data())
    })
    return () => unsub()
  }, [code])

  if (!room) return <p>Loading room...</p>

  const user = room.users?.[auth.currentUser.uid]

  // =========================
  // COPY ROOM CODE
  // =========================
  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // =========================
  // READY CHECK
  // =========================
  const toggleReady = async () => {
    if (!user || user.role === "spectator") return

    await updateDoc(doc(db, "rooms", code), {
      [`users.${auth.currentUser.uid}.ready`]: !user.ready
    })
  }

  const allReady =
    Object.values(room.users).some((u) => u.role === "referee" && u.ready) &&
    Object.values(room.users).some((u) => u.role === "A" && u.ready) &&
    Object.values(room.users).some((u) => u.role === "B" && u.ready)

  // =========================
  // START DRAFT (REFEREE)
  // =========================
  const startDraft = async () => {
    if (!user || user.role !== "referee") return

    const draftType = "6-ban"
    const draftMode = "scrimmage"

    await updateDoc(doc(db, "rooms", code), {
      status: "draft",
      draft: {
        mode: draftMode,
        type: draftType,
        stepIndex: 0,
        pickIndexInStep: 0,
        steps: getDraftSteps(draftType),
        bans: [],
        picks: { A: [], B: [] },
        startedAt: Date.now(),
        turnStartedAt: Date.now()
      },
      chat: []
    })
  }

  // =========================
  // DRAFT STATE
  // =========================
  const draft = room.draft
  const currentStep = draft?.steps?.[draft.stepIndex]

  const currentTurn =
    room.status === "draft" && currentStep
      ? `${currentStep.team} – ${currentStep.action.toUpperCase()} (${draft.pickIndexInStep + 1}/${currentStep.count})`
      : null

  // =========================
  // PERFORM PICK / BAN
  // =========================
  const performAction = async (commanderId) => {
    if (!draft || !currentStep) return
    if (user.role !== currentStep.team) return

    const roomRef = doc(db, "rooms", code)
    let updates = {}

    if (currentStep.action === "ban") {
      updates["draft.bans"] = [
        ...draft.bans,
        { team: currentStep.team, commanderId }
      ]
    }

    if (currentStep.action === "pick") {
      updates[`draft.picks.${currentStep.team}`] = [
        ...draft.picks[currentStep.team],
        commanderId
      ]
    }

    let nextPickIndex = draft.pickIndexInStep + 1
    let nextStepIndex = draft.stepIndex

    if (nextPickIndex >= currentStep.count) {
      nextPickIndex = 0
      nextStepIndex += 1
    }

    updates["draft.pickIndexInStep"] = nextPickIndex
    updates["draft.stepIndex"] = nextStepIndex
    updates["draft.turnStartedAt"] = Date.now()

    await updateDoc(roomRef, updates)
  }

  // =========================
  // CHAT
  // =========================
  const sendMessage = async () => {
    if (!chatInput.trim()) return

    await updateDoc(doc(db, "rooms", code), {
      chat: arrayUnion({
        uid: auth.currentUser.uid,
        name: user?.name || "Unknown",
        role: user?.role || "spectator",
        message: chatInput,
        timestamp: Date.now()
      })
    })

    setChatInput("")
  }

  // =========================
  // HELPERS
  // =========================
  const getCommanderName = (id) =>
    commanders.find((c) => c.id === id)?.name || id

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: 20, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
      {/* LEFT: DRAFT */}
      <div>
        {/* Room Code */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0 }}>Room Code: {code}</h2>
          <button onClick={copyRoomCode}>📋 Copy</button>
          {copied && <span style={{ color: "green" }}>✔ Copied</span>}
        </div>

        {/* LOBBY */}
        {room.status === "lobby" && (
          <>
            <h3>Lobby</h3>
            <ul>
              {Object.entries(room.users).map(([uid, u]) => (
                <li key={uid}>
                  <strong>{u.name}</strong> — {u.role}{" "}
                  {u.ready ? "✅ Ready" : "❌ Not Ready"}
                </li>
              ))}
            </ul>

            {user && user.role !== "spectator" && (
              <button onClick={toggleReady}>
                {user.ready ? "Unready" : "Ready"}
              </button>
            )}

            {allReady && user?.role === "referee" && (
              <div style={{ marginTop: 20 }}>
                <button onClick={startDraft}>🚀 Start Draft</button>
              </div>
            )}
          </>
        )}

        {/* DRAFT */}
        {room.status === "draft" && (
          <>
            <h3>Draft Phase</h3>
            {currentTurn && <h4>Current Turn: {currentTurn}</h4>}

            <h4>Bans</h4>
            <ul>
              {draft.bans.map((b, i) => (
                <li key={i}>
                  Team {b.team} banned {getCommanderName(b.commanderId)}
                </li>
              ))}
            </ul>

            <h4>Picks</h4>
            <strong>Team A</strong>
            <ul>
              {draft.picks.A.map((id, i) => (
                <li key={i}>{getCommanderName(id)}</li>
              ))}
            </ul>

            <strong>Team B</strong>
            <ul>
              {draft.picks.B.map((id, i) => (
                <li key={i}>{getCommanderName(id)}</li>
              ))}
            </ul>

            {user && user.role === currentStep?.team && (
              <div style={{ marginTop: 20 }}>
                <p>Select a commander:</p>
                {commanders.map((cmd) => (
                  <button
                    key={cmd.id}
                    style={{ margin: 5 }}
                    onClick={() => performAction(cmd.id)}
                  >
                    {cmd.name}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* RIGHT: CHAT */}
      <div style={{ borderLeft: "1px solid #333", paddingLeft: 15 }}>
        <h3>Room Chat</h3>

        <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 10 }}>
          {(room.chat || []).map((c, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <strong>{c.name}</strong>{" "}
              <span style={{ fontSize: 12, color: "#888" }}>
                ({c.role})
              </span>
              <br />
              <span>{c.message}</span>
            </div>
          ))}
        </div>

        <input
          placeholder="Type a message..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          style={{ width: "100%" }}
        />

        <button onClick={sendMessage} style={{ marginTop: 5 }}>
          Send
        </button>
      </div>
    </div>
  )
}
