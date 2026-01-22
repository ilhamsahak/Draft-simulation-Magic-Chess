import { useState } from "react"
import { db, auth } from "../firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"

export default function Join() {
  const [name, setName] = useState("")
  const [team, setTeam] = useState("A")
  const [code, setCode] = useState("")
  const navigate = useNavigate()

  const joinRoom = async () => {
    if (!name || !code) {
      alert("Please fill all fields")
      return
    }

    const roomRef = doc(db, "rooms", code.toUpperCase())
    const snap = await getDoc(roomRef)

    if (!snap.exists()) {
      alert("Room not found")
      return
    }

    const room = snap.data()

    // Prevent overwriting team
    const teamTaken = Object.values(room.users || {}).some(
      u => u.role === team
    )

    if (teamTaken) {
      alert(`Team ${team} already taken`)
      return
    }

    await updateDoc(roomRef, {
      [`users.${auth.currentUser.uid}`]: {
        name,
        role: team,
        ready: false,
        joinedAt: Date.now()
      }
    })

    navigate(`/room/${code}`)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Join Draft Room</h2>

      <input
        placeholder="Your alias / team name"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <br /><br />

      <select value={team} onChange={e => setTeam(e.target.value)}>
        <option value="A">Team A</option>
        <option value="B">Team B</option>
      </select>

      <br /><br />

      <input
        placeholder="Room Code"
        value={code}
        onChange={e => setCode(e.target.value)}
      />

      <br /><br />

      <button onClick={joinRoom}>
        Join Room
      </button>
    </div>
  )
}
