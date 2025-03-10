// apps/frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TenderData from "./pages/TenderData";
import LeadGenChat from "./pages/LeadGenChat";
import LeadGenChatV2 from "./pages/LeadGenChatV2";
import Rfp from "./pages/Rfp";
import Login from './pages/Login';
import ForgotResetPassword from './pages/ForgotResetPassword';
import SignUp from "./pages/SignUp";
import Navbar from './component/Navbar';
import { useAuth } from './component/AuthContext'; 
import { getaccountAPI } from '../api'; 
import { useEffect, useState } from "react";
import TenderSearch from './pages/TenderSearch';

export function App() {
  const { auth, setAuth } = useAuth();
  const [appLoading, setAppLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      console.log("App.tsx -> fetchUser called");

      const token = localStorage.getItem("token");
      console.log("LocalStorage token:", token);

      if (!token) {
        console.log("No token found, skipping getaccountAPI");
        setAppLoading(false);
        return;
      }

      try {
        console.log("Calling getaccountAPI...");
        const response = await getaccountAPI(); 
        console.log("Response from /api/v1/auth/account:", response);

        // If the backend returns { user: { ... } }, we can setAuth
        if (response && response.user) {
          setAuth({
            isAuthenticated: true,
            user: {
              email: response.user.email,
              name: response.user.name || response.user.email,
            },
          });
        } else {
          console.warn("No user returned from getaccountAPI");
          setAuth({ isAuthenticated: false, user: { email: "", name: "" } });
        }
      } catch (error) {
        console.error("Failed to fetch user account:", error);
        setAuth({ isAuthenticated: false, user: { email: "", name: "" } });
      } finally {
        setAppLoading(false);
      }
    };

    fetchUser();
  }, [setAuth]);

  if (appLoading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'
      }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: '1rem' }}>
        {auth.isAuthenticated ? `Welcome, ${auth.user.name}` : 'Welcome to Wouessi'}
      </div>
      <Routes>
        <Route path="/tenderdata" element={<TenderData />} />
        <Route path="/leadgenchat" element={<LeadGenChat />} />
        <Route path="/leadgenchatv2" element={<LeadGenChatV2 />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-reset-password" element={<ForgotResetPassword />} />
        <Route path="/forgot-reset-password/:token" element={<ForgotResetPassword />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/tendersearch" element={<TenderSearch />} />
        <Route path="/rfp" element={<Rfp />} />
      </Routes>
    </>
  );
}

export default App;

