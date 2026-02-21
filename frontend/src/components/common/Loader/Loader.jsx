import React from 'react';
import styles from './Loader.module.css';

const Loader = ({ size = 'medium', fullScreen = false }) => {
  const loaderClasses = [
    styles.loader,
    styles[size],
    fullScreen ? styles.fullScreen : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={loaderClasses}>
      <div className={styles.spinner}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
};

export default Loader;