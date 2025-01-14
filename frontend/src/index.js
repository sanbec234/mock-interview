import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./index.css";
import HomePage from "./pages/home-page/HomePage.tsx";
import CompletionPage from "./pages/completion-page/CompletionPage.tsx";
import LoginPage from "./pages/login-page/LoginPage.tsx";
import Details from './pages/details-page/Details.tsx';
import reportWebVitals from "./reportWebVitals";

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      setShowMessage(true);

      setTimeout(() => {
        setShowMessage(false);
      }, 3000);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  if (!showMessage) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        backgroundColor: isOnline ? "green" : "red",
        color: "white",
        textAlign: "center",
        padding: "10px",
        zIndex: 1000,
        transition: "opacity 0.5s ease",
      }}
    >
      {isOnline ? "You are Online" : "You are Offline"}
    </div>
  );
};

const App = () => (
  <Router>
    <NetworkStatus />
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/complete-test" element={<CompletionPage />} />
      <Route path="/completion-page" element={<CompletionPage />} />
      <Route path="/collect-details-page" element={<Details />} />
    </Routes>
  </Router>
);

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

reportWebVitals();
