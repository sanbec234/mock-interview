import React, { useState, useEffect } from 'react';
import './header.css'; 

const Header: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  
  const handleOnlineStatus = () => {
    setIsOnline(true);
  };

  const handleOfflineStatus = () => {
    setIsOnline(false);
  };

  
  useEffect(() => {
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);

    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, []);

  return (
    <header>
      <h1>Mock Interview</h1>
      <nav>
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>

      
      {!isOnline && (
        <div className="offline-notification">
          <p>You are offline. Please check your internet connection.</p>
        </div>
      )}
    </header>
  );
};

export default Header;
