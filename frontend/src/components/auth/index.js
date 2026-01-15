// Exportar todos los componentes de autenticación
export { default as Login } from './Login';
export { default as Register } from './Register';
export { default as ForgotPassword } from './ForgotPassword';
export { default as ResetPassword } from './ResetPassword';
export { default as AuthLayout } from './AuthLayout';
export { default as Profile } from './Profile';
export { default as PasswordStrength } from './PasswordStrength';
export { default as ProtectedRoute } from './ProtectedRoute';
export { default as GuestRoute } from './GuestRoute';
export { AuthProvider, useAuth } from './AuthContext';