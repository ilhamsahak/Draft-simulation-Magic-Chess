import { useNavigate } from "react-router-dom"

export default function Home() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: 40 }}>
      <h2>Magic Chess Draft</h2>

      <p>Select your role:</p>

      <button onClick={() => navigate("/referee")}>
        I am a Referee
      </button>

      <br /><br />

      <button onClick={() => navigate("/join")}>
        I am a Drafter
      </button>
    </div>
  )
}
