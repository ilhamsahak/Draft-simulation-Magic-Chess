import { useState } from "react"
import { db, auth } from "../firebase"
import { doc, setDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function Referee() {
  const [name, setName] = useState("")
  const navigate = useNavigate()

  const createRoom = async () => {
    if (!name.trim()) {
      alert("Please enter your alias")
      return
    }

    const code = generateRoomCode()

    await setDoc(doc(db, "rooms", code), {
      status: "lobby",
      users: {
        [auth.currentUser.uid]: {
          name,
          role: "referee",
          ready: false,
          joinedAt: Date.now()
        }
      },
      createdAt: Date.now()
    })

    navigate(`/room/${code}`)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Referee Setup</h2>

      <input
        placeholder="Referee alias"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <button onClick={createRoom}>
        Create Draft Room
      </button>
    </div>
  )
}
