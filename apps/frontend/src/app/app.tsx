import { Route, Routes, Link} from "react-router-dom"
import TenderData from "./pages/TenderData"
import LeadGenChat from "./pages/LeadGenChat"
import LeadGenChatV2 from "./pages/LeadGenChatV2"
export function App() {

  return (
    <>
      <nav className="flex flex-col gap-12 text-5xl font-bold">
        <Link to="/tenderdata">Check out Tender Data</Link>
        <Link to="/leadgenchat">Go to chat page for lead generation</Link>
        <Link to="/leadgenchatv2">Go to prompt page to filter leads, generation, v2</Link>
      </nav>
      <Routes>
        <Route path="/tenderdata" element={<TenderData />} />
        <Route path="/leadgenchat" element={<LeadGenChat />} />
        <Route path="/leadgenchatv2" element={<LeadGenChatV2 />} />
      </Routes>
    </>
  )
}

export default App
