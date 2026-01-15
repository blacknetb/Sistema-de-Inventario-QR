/**
 * Archivo de exportación principal para componentes de Layout
 * Permite importaciones limpias desde otros módulos
 */

import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import MainLayout from './MainLayout';

// Exportación individual
export { Header, Sidebar, Footer, MainLayout };

// Exportación por defecto (MainLayout como principal)
export default MainLayout;