import { Route, Routes, Link} from "react-router-dom"
import TenderData from "./pages/TenderData"
import LeadGenChat from "./pages/LeadGenChat"
import LeadGenChatV2 from "./pages/LeadGenChatV2"
import Rfp from "./pages/Rfp"
import Dashboard from "./pages/Dashboard"
export function App() {

  return (
    <>
      <nav className="flex flex-col gap-12 text-5xl font-bold">
        <Link to="/tenderdata">Check out Tender Data</Link>
        <Link to="/leadgenchat">Go to chat page for lead generation</Link>
        <Link to="/leadgenchatv2">
          Go to prompt page to filter leads, generation, v2
        </Link>
        <Link to="rfp">Testing page for RFP</Link>

          {/* A new link to the Dashboard route */}
          <Link to="/dashboard">Dashboard</Link>
      </nav>
      <Routes>
        <Route path="/tenderdata" element={<TenderData />} />
        <Route path="/leadgenchat" element={<LeadGenChat />} />
        <Route path="/leadgenchatv2" element={<LeadGenChatV2 />} />
        <Route path="/rfp" element={<Rfp />} />

        {/* Now actually use <Dashboard /> here */}
        <Route path="/dashboard" element={<Dashboard />} />

      </Routes>
    </>
  )
}

export default App
