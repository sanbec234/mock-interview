import React from 'react';
import './header.css'; // Import the CSS file for Header

const Header: React.FC = () => {
  return (
    <header>
      <h1>Mock Interview</h1>
      <nav>
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  );
};

export default Header;
