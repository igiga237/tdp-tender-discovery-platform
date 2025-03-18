/* From fati12355*/
import React, {useState} from 'react';
import SearchBar from './SearchBar';
import DocumentViewer from './NlpResultDisplay';
import '../styles.css';
/* end From fati12355*/


import { Route, Routes, Link} from "react-router-dom"
import TenderData from "./TenderData"
import LeadGenChat from "./LeadGenChat"
import LeadGenChatV2 from "./LeadGenChatV2"
import Rfp from "./Rfp"
import UploadDoc from "./UploadDoc"
export function App() {


/* From fati12355*/
const App:React.FC = () => {
  const[documentContent, setDocumentContent] = useState('');

  const handleSearch = (query: String) => {
    //Fetching document content based on the query
    const mockContent = 'This is supposed to be the actual result to the user query:"${query}".';
    setDocumentContent(mockContent);
  };

  return (
    <div className = "app">
      <h1> Tender document processing result</h1>
      <SearchBar onSearch = {handleSearch} />
      <DocumentViewer content = {documentContent}/>
    </div>
  );
};
/* end From fati12355*/

  return (
    <>
      <nav className="flex flex-col gap-12 text-5xl font-bold">
        <Link to="/tenderdata">Check out Tender Data</Link>
        <Link to="/leadgenchat">Go to chat page for lead generation</Link>
        <Link to="/leadgenchatv2">
          Go to prompt page to filter leads, generation, v2
        </Link>
        <Link to="rfp">Testing page for RFP</Link>
      </nav>
      <Routes>
        <Route path="/tenderdata" element={<TenderData />} />
        <Route path="/leadgenchat" element={<LeadGenChat />} />
        <Route path="/leadgenchatv2" element={<LeadGenChatV2 />} />
        <Route path="/rfp" element={<Rfp />} />
	<Route path="/UploadDoc" element={<UploadDoc />} />
      </Routes>
    </>
  )
}

export default App
