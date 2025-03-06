import { Route, Routes, Link} from "react-router-dom"
import TenderData from "./pages/TenderData"
import LeadGenChat from "./pages/LeadGenChat"
import LeadGenChatV2 from "./pages/LeadGenChatV2"
import Rfp from "./pages/Rfp"
import TenderSearch from "./pages/TenderSearch"
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
        <Link to="/tendersearch">Search for Tenders</Link>
      </nav>
      <Routes>
        <Route path="/tenderdata" element={<TenderData />} />
        <Route path="/leadgenchat" element={<LeadGenChat />} />
        <Route path="/leadgenchatv2" element={<LeadGenChatV2 />} />
        <Route path="/rfp" element={<Rfp />} />
        <Route path="/tendersearch" element={<TenderSearch />} />
      </Routes>
    </>
  )
}

export default App
