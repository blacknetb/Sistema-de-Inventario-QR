import React from 'react';
import '../../assets/styles/layout/layout.css';

const MainContent = ({ children, padding = true, maxWidth = false }) => {
  return (
    <main className={`main-content ${padding ? 'with-padding' : ''} ${maxWidth ? 'max-width' : ''}`}>
      <div className="content-wrapper">
        {children}
      </div>
    </main>
  );
};

export default MainContent;