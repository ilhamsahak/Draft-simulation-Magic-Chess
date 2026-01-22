import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { db } from "../firebase"
import { doc, getDoc } from "firebase/firestore"
import { commanders } from "../commanders"

export default function Summary() {
  const { code } = useParams()
  const [room, setRoom] = useState(null)

  useEffect(() => {
    getDoc(doc(db, "rooms", code)).then(snap => {
      setRoom(snap.data())
    })
  }, [code])

  if (!room) return <p>Loading...</p>

  const getName = id =>
    commanders.find(c => c.id === id)?.name || id

  return (
    <div style={{ padding: 20 }}>
      <h2>Draft Summary</h2>

      <h3>Team A</h3>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {room.draft.picks.A.map(id => (
          <div key={id} style={{ textAlign: "center" }}>
            <img
              src={`/commanders/${id}.png`}
              style={{ width: 80, borderRadius: 8 }}
            />
            <div>{getName(id)}</div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 20 }}>Team B</h3>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {room.draft.picks.B.map(id => (
          <div key={id} style={{ textAlign: "center" }}>
            <img
              src={`/commanders/${id}.png`}
              style={{ width: 80, borderRadius: 8 }}
            />
            <div>{getName(id)}</div>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 20 }}>
        📸 Screenshot this page and share with your team
      </p>
    </div>
  )
}
