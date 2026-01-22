import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Join from "./pages/Join";
import Referee from "./pages/Referee";
import Room from "./pages/Room";
import Summary from "./pages/Summary";

export default function App() {
  return (
    <BrowserRouter basename="/Draft-simulation-Magic-Chess">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join" element={<Join />} />
        <Route path="/referee" element={<Referee />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/summary/:roomId" element={<Summary />} />
      </Routes>
    </BrowserRouter>
  );
}
