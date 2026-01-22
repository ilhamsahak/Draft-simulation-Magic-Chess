import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Referee from "./pages/Referee";
import Join from "./pages/Join";
import Room from "./pages/Room";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/referee" element={<Referee />} />
        <Route path="/join" element={<Join />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </HashRouter>
  );
}
