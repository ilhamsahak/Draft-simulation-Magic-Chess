import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { db, auth } from "../firebase"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"
import { getDraftSteps } from "../draftSteps"
import { commanders } from "../commanders"

export default function Room() {
  const { code } = useParams()
  const [room, setRoom] = useState(null)
  const [copied, setCopied] = useState(false)

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
      }
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
  // HELPERS
  // =========================
  const getCommanderName = (id) =>
    commanders.find((c) => c.id === id)?.name || id

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: 20 }}>
      {/* Room Code */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Room Code: {code}</h2>
        <button onClick={copyRoomCode}>📋 Copy</button>
        {copied && <span style={{ color: "green" }}>✔ Copied</span>}
      </div>

      {/* ================= LOBBY ================= */}
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

      {/* ================= DRAFT ================= */}
      {room.status === "draft" && (
        <>
          <h3 style={{ marginTop: 30 }}>Draft Phase</h3>

          {currentTurn && <h4>Current Turn: {currentTurn}</h4>}

          {/* BANS */}
          <h4>Bans</h4>
          {draft.bans.length === 0 && <p>No bans yet</p>}
          <ul>
            {draft.bans.map((b, i) => (
              <li key={i}>
                <strong>Team {b.team}</strong> banned{" "}
                {getCommanderName(b.commanderId)}
              </li>
            ))}
          </ul>

          {/* PICKS */}
          <h4>Picks</h4>

          <div>
            <strong>Team A</strong>
            <ul>
              {draft.picks.A.length === 0 && <li>No picks yet</li>}
              {draft.picks.A.map((id, i) => (
                <li key={i}>{getCommanderName(id)}</li>
              ))}
            </ul>
          </div>

          <div>
            <strong>Team B</strong>
            <ul>
              {draft.picks.B.length === 0 && <li>No picks yet</li>}
              {draft.picks.B.map((id, i) => (
                <li key={i}>{getCommanderName(id)}</li>
              ))}
            </ul>
          </div>

          {/* ACTION BUTTONS */}
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
  )
}
