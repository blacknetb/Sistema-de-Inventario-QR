import React from 'react';
import '../../assets/styles/layout/layout.css';

const Container = ({ 
  children, 
  fluid = false, 
  centered = false, 
  className = '',
  padding = true,
  maxWidth = '1200px',
  style = {}
}) => {
  const containerClass = `
    container 
    ${fluid ? 'container-fluid' : 'container-fixed'} 
    ${centered ? 'container-centered' : ''} 
    ${padding ? 'container-padding' : ''} 
    ${className}
  `.trim();

  const containerStyle = fluid ? style : { ...style, maxWidth };

  return (
    <div className={containerClass} style={containerStyle}>
      {children}
    </div>
  );
};

export default Container;