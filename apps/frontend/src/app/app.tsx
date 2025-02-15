import { Route, Routes, Link} from "react-router-dom"
import TenderData from "./pages/TenderData"
import LeadGenChat from "./pages/LeadGenChat"
import { numberbro } from "../api"

export function App() {

  return (
    <>
      <nav className="flex flex-col gap-12 text-5xl font-bold">
        <Link to="/tenderdata">Check out Tender Data</Link>
        <h1>{numberbro}</h1>
        <Link to="/leadgenchat">Go to chat page for lead generation</Link>
      </nav>
      <Routes>
        <Route path="/tenderdata" element={<TenderData />} />
        <Route path="/leadgenchat" element={<LeadGenChat />} />
      </Routes>
    </>
  )
}

export default App
