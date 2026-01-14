import React, { Component } from "react";
import PropTypes from "prop-types";

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorTimestamp: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorTimestamp: new Date().toISOString(),
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      errorInfo,
      errorTimestamp: new Date().toISOString(),
    });

    console.error("Error capturado por Error Boundary:", {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      path: window.location.pathname,
      userAgent: navigator.userAgent,
    });

    if (process.env.NODE_ENV === "production") {
      this.sendErrorToMonitoring(error, errorInfo);
    }
  }

  sendErrorToMonitoring(error, errorInfo) {
    try {
      fetch("/api/logs/error", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: error.message,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      }).catch(console.error);
    } catch (e) {
      console.error("Error enviando log:", e);
    }
  }

  handleRefresh = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = "/";
  };

  handleGoBack = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600 dark:text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.406 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                Oops! Algo salió mal
              </h1>

              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Ha ocurrido un error inesperado en la aplicación.
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-left border border-gray-200 dark:border-gray-600 overflow-auto">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Error:
                      </p>
                      <code className="text-sm text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 p-2 rounded block">
                        {this.state.error.toString()}
                      </code>
                    </div>

                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Component Stack:
                        </p>
                        <pre className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}

                    {this.state.errorTimestamp && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Ocurrió:{" "}
                        {new Date(this.state.errorTimestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-8 space-y-4">
                <button
                  onClick={this.handleRefresh}
                  className="w-full inline-flex justify-center items-center px-5 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Recargar página
                </button>

                <button
                  onClick={this.handleGoBack}
                  className="w-full inline-flex justify-center items-center px-5 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver atrás
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full inline-flex justify-center items-center px-5 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Ir al inicio
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Si el problema persiste, contacta al soporte técnico.
                </p>

                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs text-gray-400">
                  <span>
                    Error ID: {Math.random().toString(36).slice(2, 11)}
                  </span>
                  <span>•</span>
                  <span>Tiempo: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

RouteErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default RouteErrorBoundary;