import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { db, auth } from "../firebase"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"
import { commanders } from "../commanders"
import { getDraftSteps } from "../draftSteps"

export default function Room() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [draftType, setDraftType] = useState("6-ban") // referee choice

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "rooms", code), snap => {
      const data = snap.data()
      setRoom(data)
      if (data?.draft?.type) {
        setDraftType(data.draft.type)
      }
    })
    return () => unsub()
  }, [code])

  if (!room) return <p>Loading...</p>

  const user = room.users?.[auth.currentUser.uid]
  const draft = room.draft
  const step = draft?.steps?.[draft.stepIndex]

  // =====================
  // STATUS HELPERS
  // =====================
  const banned = draft?.bans.map(b => b.commanderId) || []
  const pickedA = draft?.picks.A || []
  const pickedB = draft?.picks.B || []

  const getStatus = id => {
    if (banned.includes(id)) return "banned"
    if (pickedA.includes(id)) return "A"
    if (pickedB.includes(id)) return "B"
    return "available"
  }

  // =====================
  // START DRAFT (REFEREE)
  // =====================
  const startDraft = async () => {
    if (user.role !== "referee") return

    await updateDoc(doc(db, "rooms", code), {
      status: "draft",
      draft: {
        type: draftType,
        mode: "scrimmage",
        steps: getDraftSteps(draftType),
        stepIndex: 0,
        pickIndexInStep: 0,
        bans: [],
        picks: { A: [], B: [] },
        startedAt: Date.now(),
        turnStartedAt: Date.now()
      }
    })
  }

  // =====================
  // PERFORM PICK / BAN
  // =====================
  const performAction = async (id) => {
    if (!step || user.role !== step.team) return

    const roomRef = doc(db, "rooms", code)
    let updates = {}

    if (step.action === "ban") {
      updates["draft.bans"] = [...draft.bans, { team: step.team, commanderId: id }]
    }

    if (step.action === "pick") {
      updates[`draft.picks.${step.team}`] = [...draft.picks[step.team], id]
    }

    let nextPick = draft.pickIndexInStep + 1
    let nextStep = draft.stepIndex

    if (nextPick >= step.count) {
      nextPick = 0
      nextStep++
    }

    if (nextStep >= draft.steps.length) {
      updates.status = "done"
    }

    updates["draft.pickIndexInStep"] = nextPick
    updates["draft.stepIndex"] = nextStep

    await updateDoc(roomRef, updates)

    if (updates.status === "done") {
      navigate(`/summary/${code}`)
    }
  }

  // =====================
  // UI
  // =====================
  return (
    <div style={{ padding: 16 }}>
      <h2>Room Code: {code}</h2>

      {/* ================= LOBBY ================= */}
      {room.status === "lobby" && (
        <>
          <h3>Lobby</h3>

          <ul>
            {Object.entries(room.users).map(([uid, u]) => (
              <li key={uid}>
                <strong>{u.name}</strong> — {u.role}
              </li>
            ))}
          </ul>

          {/* REFEREE CONTROLS */}
          {user?.role === "referee" && (
            <div style={{
              marginTop: 20,
              padding: 12,
              border: "1px solid #333",
              borderRadius: 8,
              maxWidth: 320
            }}>
              <strong>Draft Format</strong>

              <div style={{ marginTop: 8 }}>
                <label>
                  <input
                    type="radio"
                    value="6-ban"
                    checked={draftType === "6-ban"}
                    onChange={() => setDraftType("6-ban")}
                  />
                  {" "}6 Ban Format
                </label>
              </div>

              <div>
                <label>
                  <input
                    type="radio"
                    value="8-ban"
                    checked={draftType === "8-ban"}
                    onChange={() => setDraftType("8-ban")}
                  />
                  {" "}8 Ban Format
                </label>
              </div>

              <button
                onClick={startDraft}
                style={{ marginTop: 12, width: "100%" }}
              >
                🚀 Start Draft
              </button>
            </div>
          )}

          {/* SHOW FORMAT TO OTHERS */}
          {user?.role !== "referee" && (
            <p style={{ marginTop: 12 }}>
              Draft Format: <strong>{draftType}</strong>
            </p>
          )}
        </>
      )}

      {/* ================= DRAFT ================= */}
      {room.status === "draft" && step && (
        <>
          {/* TURN INDICATOR */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12
          }}>
            <strong style={{ color: step.team === "A" ? "#3b82f6" : "#888" }}>
              TEAM A
            </strong>
            <strong>{step.action.toUpperCase()}</strong>
            <strong style={{ color: step.team === "B" ? "#a855f7" : "#888" }}>
              TEAM B
            </strong>
          </div>

          {/* TIMELINE */}
          <div style={{
            display: "flex",
            gap: 6,
            marginBottom: 16,
            flexWrap: "wrap"
          }}>
            {draft.steps.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  background:
                    i === draft.stepIndex ? "#22c55e" : "#333",
                  fontSize: 12
                }}
              >
                {s.team} {s.action}
              </div>
            ))}
          </div>

          {/* COMMANDER GRID */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
            gap: 10
          }}>
            {commanders.map(cmd => {
              const status = getStatus(cmd.id)
              const disabled = status !== "available"

              return (
                <div
                  key={cmd.id}
                  onClick={() =>
                    !disabled && user.role === step.team && performAction(cmd.id)
                  }
                  style={{
                    opacity: disabled ? 0.35 : 1,
                    border:
                      status === "A" ? "2px solid #3b82f6"
                        : status === "B" ? "2px solid #a855f7"
                        : status === "banned" ? "2px solid #ef4444"
                        : "1px solid #444",
                    borderRadius: 8,
                    padding: 4,
                    textAlign: "center",
                    cursor: disabled ? "not-allowed" : "pointer"
                  }}
                >
                  <img
                    src={`/commanders/${cmd.id}.png`}
                    alt={cmd.name}
                    style={{ width: "100%", borderRadius: 6 }}
                  />
                  <small>{cmd.name}</small>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
