import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Referee from "./pages/Referee"
import Join from "./pages/Join"
import Room from "./pages/Room"
import Summary from "./pages/Summary"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/referee" element={<Referee />} />
        <Route path="/join" element={<Join />} />
        <Route path="/room/:code" element={<Room />} />
        <Route path="/summary/:code" element={<Summary />} />
      </Routes>
    </BrowserRouter>
  )
}
