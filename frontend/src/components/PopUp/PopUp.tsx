import React, { useState, useEffect, ReactNode } from 'react';
import './PopUp.css';

interface PopupProps {
  children: ReactNode;
}

const Popup: React.FC<PopupProps> = ({ children }) => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    setShowPopup(true);
  }, []);

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <>
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            {children}
            <button onClick={closePopup}>Close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Popup;
