import React from "react";
import "./header.css"; // Import the CSS file for Header
import { useNavigate } from "react-router-dom";

const Header: React.FC = () => {
  const navigator = useNavigate();
  const logoutHandler = () => {
    localStorage.clear();
    navigator("/login");
  };

  return (
    <header>
      <h1>Mock Interview</h1>
      <nav>
        <span onClick={logoutHandler}>Log out</span>
      </nav>
    </header>
  );
};

export default Header;
