import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

/**
 * ✅ ACCESS DENIED - PÁGINA DE ACCESO DENEGADO MEJORADA
 */
const AccessDenied = ({
  missingRoles = [],
  missingPermissions = [],
  message = "No tienes los permisos necesarios para acceder a esta página.",
  title = "Acceso Denegado"
}) => {
  const navigate = useNavigate();

  // ✅ MEJORA: Función para volver atrás con validación
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
        <div className="text-center">
          {/* ✅ MEJORA: Icono animado */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-6">
            <div className="access-denied-icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-600 dark:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>

          <p className="mt-3 text-gray-600 dark:text-gray-300">
            {message}
          </p>

          {/* ✅ MEJORA: Mostrar permisos/roles faltantes para debugging */}
          {(missingRoles.length > 0 || missingPermissions.length > 0) && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-left border border-gray-200 dark:border-gray-600">
              <div className="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.406 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Permisos requeridos:
                </p>
              </div>

              {missingRoles.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
                    Roles requeridos:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {missingRoles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {missingPermissions.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
                    Permisos requeridos:
                  </p>
                  <div className="space-y-1">
                    {missingPermissions.map((permission) => (
                      <div
                        key={permission}
                        className="flex items-center text-xs text-gray-500 dark:text-gray-400"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mr-2"></div>
                        {permission}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ✅ MEJORA: Acciones con mejor diseño */}
          <div className="mt-8 space-y-4">
            <button
              onClick={handleGoBack}
              className="w-full inline-flex justify-center items-center px-5 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver atrás
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full inline-flex justify-center items-center px-5 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Ir al inicio
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="w-full inline-flex justify-center items-center px-5 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Ver mi perfil
            </button>
          </div>

          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            Si crees que esto es un error, contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

AccessDenied.propTypes = {
  missingRoles: PropTypes.array,
  missingPermissions: PropTypes.array,
  message: PropTypes.string,
  title: PropTypes.string
};

export default AccessDenied;