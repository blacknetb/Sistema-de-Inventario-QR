import React from 'react';
import PropTypes from 'prop-types';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ 
    size = 'medium', 
    color = 'primary', 
    fullPage = false,
    text = '',
    overlay = false
}) => {
    const spinnerClasses = [
        styles.spinner,
        styles[`size-${size}`],
        styles[`color-${color}`]
    ].join(' ');

    const containerClasses = [
        styles.container,
        fullPage && styles.fullPage,
        overlay && styles.overlay
    ].filter(Boolean).join(' ');

    if (fullPage || overlay) {
        return (
            <div className={containerClasses}>
                <div className={spinnerClasses} />
                {text && <p className={styles.text}>{text}</p>}
            </div>
        );
    }

    return (
        <div className={containerClasses}>
            <div className={spinnerClasses} />
            {text && <p className={styles.text}>{text}</p>}
        </div>
    );
};

LoadingSpinner.propTypes = {
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    color: PropTypes.oneOf(['primary', 'secondary', 'white']),
    fullPage: PropTypes.bool,
    text: PropTypes.string,
    overlay: PropTypes.bool
};

export default LoadingSpinner;