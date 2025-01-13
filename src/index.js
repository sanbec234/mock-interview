import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css';
import HomePage from './pages/home-page/HomePage.tsx';
import CompletionPage from './pages/completion-page/CompletionPage.tsx';
import Details from './pages/details-page/Details.tsx';
import reportWebVitals from './reportWebVitals';
import LoginPage from './pages/login/LoginPage.tsx';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <Router>
        <Routes>
          {/* Define the routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/completion-page" element={<CompletionPage />} />
          <Route path="/login-page" element={<LoginPage />} />
          <Route path="/collect-details-page" element={<Details />} />
        </Routes>
      </Router>
    </React.StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();