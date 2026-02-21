import React from 'react';
import PropTypes from 'prop-types';
import styles from './ErrorBoundary.module.css';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log error to service
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
        
        // Send to error tracking service
        if (window.errorTrackingService) {
            window.errorTrackingService.logError(error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className={styles.errorBoundary}>
                    <div className={styles.container}>
                        <div className={styles.icon}>⚠️</div>
                        <h1 className={styles.title}>Algo salió mal</h1>
                        <p className={styles.message}>
                        {this.state.error?.message || 'Ha ocurrido un error inesperado'}
                        </p>
                        
                        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                            <details className={styles.details}>
                                <summary>Detalles del error (solo desarrollo)</summary>
                                <pre className={styles.stack}>
                                    {this.state.error?.stack}
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className={styles.actions}>
                            <button 
                                onClick={this.handleReset}
                                className={`${styles.button} ${styles.buttonPrimary}`}
                            >
                                Intentar de nuevo
                            </button>
                            <button 
                                onClick={this.handleReload}
                                className={`${styles.button} ${styles.buttonSecondary}`}
                            >
                                Recargar página
                            </button>
                            <button 
                                onClick={this.handleGoHome}
                                className={`${styles.button} ${styles.buttonSecondary}`}
                            >
                                Ir al inicio
                            </button>
                        </div>

                        {this.props.fallback && this.props.fallback(this.state.error)}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.func
};

export default ErrorBoundary;