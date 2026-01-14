import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout, Menu, Button, Avatar, Dropdown, Breadcrumb,
  message, ConfigProvider, theme, Spin, Alert
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  Inventory2Outlined,
  ApartmentOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  HomeOutlined
} from '@ant-design/icons';

// Importación de estilos CSS unificados
import '../../assets/styles/layout.css';

// Componente para manejar errores de carga
const ErrorBoundaryFallback = ({ error }) => (
  <div className="error-container">
    <Alert
      message="Error al cargar el componente"
      description={error.message}
      type="error"
      showIcon
    />
    <Button type="primary" onClick={() => window.location.reload()}>
      Recargar página
    </Button>
  </div>
);

// Componente principal del layout
const MainLayout = () => {
  const { Header, Sider, Content, Footer } = Layout;
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [breadcrumbItems, setBreadcrumbItems] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Estado para el tema (claro/oscuro)
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Mapeo de rutas a nombres para el breadcrumb
  const routeNames = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/inventory': 'Inventario',
    '/products': 'Productos',
    '/categories': 'Categorías',
    '/suppliers': 'Proveedores',
    '/users': 'Usuarios',
    '/reports': 'Reportes',
    '/settings': 'Configuración',
    '/sales': 'Ventas',
    '/purchases': 'Compras'
  };

  // Generar items del breadcrumb basado en la ruta actual
  useEffect(() => {
    const pathSnippets = location.pathname.split('/').filter(i => i);
    const items = pathSnippets.map((snippet, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      return {
        title: routeNames[url] || snippet.charAt(0).toUpperCase() + snippet.slice(1)
      };
    });

    // Agregar Home al inicio
    const breadcrumbItems = [
      { title: <Link to="/"><HomeOutlined /> Home</Link> },
      ...items
    ];

    setBreadcrumbItems(breadcrumbItems);
  }, [location.pathname]);

  // Simular carga inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500); // Reducido de 1000ms a 500ms para mejor UX

    return () => clearTimeout(timer);
  }, []);

  // Manejar logout
  const handleLogout = () => {
    // Mejora: Mostrar confirmación antes de cerrar sesión
    message.loading('Cerrando sesión...', 1);

    setTimeout(() => {
      // Aquí iría la lógica real de logout (limpiar tokens, etc.)
      localStorage.removeItem('authToken');
      message.success('Sesión cerrada exitosamente');
      navigate('/login');
    }, 1000);
  };

  // Configuración del dropdown del usuario
  const userMenuItems = [
    {
      key: '1',
      label: 'Perfil',
      icon: <UserOutlined />
    },
    {
      key: '2',
      label: 'Configuración',
      icon: <SettingOutlined />
    },
    {
      type: 'divider'
    },
    {
      key: '3',
      label: 'Cerrar Sesión',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true
    }
  ];

  // Items del menú principal
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>
    },
    {
      key: '/inventory',
      icon: <Inventory2Outlined />,
      label: <Link to="/inventory">Inventario</Link>
    },
    {
      key: '/products',
      icon: <ShoppingCartOutlined />,
      label: <Link to="/products">Productos</Link>,
      children: [
        {
          key: '/products/list',
          label: <Link to="/products/list">Lista de Productos</Link>
        },
        {
          key: '/products/add',
          label: <Link to="/products/add">Agregar Producto</Link>
        }
      ]
    },
    {
      key: '/categories',
      icon: <ApartmentOutlined />,
      label: <Link to="/categories">Categorías</Link>
    },
    {
      key: '/suppliers',
      icon: <TeamOutlined />,
      label: <Link to="/suppliers">Proveedores</Link>
    },
    {
      key: '/sales',
      icon: <ShoppingCartOutlined />,
      label: <Link to="/sales">Ventas</Link>
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: <Link to="/reports">Reportes</Link>
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: <Link to="/users">Usuarios</Link>
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">Configuración</Link>
    }
  ];

  // Manejar colapso del menú
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
    // Mejora: Guardar preferencia en localStorage
    localStorage.setItem('sidebarCollapsed', JSON.stringify(!collapsed));
  };

  // Cargar preferencia del sidebar al inicio
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed) {
      setCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // Manejar cambio de tema
  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    // Mejora: Guardar preferencia de tema
    localStorage.setItem('darkTheme', JSON.stringify(!isDarkTheme));
  };

  // Cargar preferencia de tema al inicio
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkTheme');
    if (savedTheme) {
      setIsDarkTheme(JSON.parse(savedTheme));
    }
  }, []);

  // Si está cargando, mostrar spinner
  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Cargando aplicación..." />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkTheme ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          borderRadius: 8,
          colorBgContainer: isDarkTheme ? '#1f2937' : '#ffffff',
          colorBorder: isDarkTheme ? '#374151' : '#e5e7eb',
        },
        components: {
          Layout: {
            bodyBg: isDarkTheme ? '#111827' : '#f9fafb',
            headerBg: isDarkTheme ? '#1f2937' : '#ffffff',
            siderBg: isDarkTheme ? '#1f2937' : '#1f2937',
          },
          Menu: {
            darkItemBg: '#1f2937',
            darkItemColor: '#d1d5db',
            darkItemHoverBg: '#374151',
            darkItemSelectedBg: '#3b82f6',
          }
        }
      }}
    >
      <Layout style={{ minHeight: '100vh' }} className="main-layout">
        {/* Sidebar */}
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={250}
          collapsedWidth={80}
          className="site-layout-sider"
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
          }}
        >
          {/* Logo de la aplicación */}
          <div className="logo-container" style={{ padding: '16px', textAlign: 'center' }}>
            {collapsed ? (
              <div className="logo-mini" style={{ 
                height: '40px', 
                width: '40px', 
                backgroundColor: '#3b82f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                IQ
              </div>
            ) : (
              <div className="logo-full" style={{ textAlign: 'center' }}>
                <h2 style={{ 
                  color: 'white', 
                  margin: 0, 
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  Sistema de Inventario
                </h2>
                <p className="logo-subtitle" style={{ 
                  color: '#9ca3af', 
                  fontSize: '12px',
                  marginTop: '4px'
                }}>
                  v1.0.0
                </p>
              </div>
            )}
          </div>

          {/* Menú de navegación */}
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={[location.pathname]}
            defaultOpenKeys={[`/${location.pathname.split('/')[1]}`]}
            items={menuItems}
            className="main-menu"
            style={{ 
              borderRight: 0,
              backgroundColor: 'transparent'
            }}
          />
        </Sider>

        {/* Layout principal (contenido) */}
        <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'margin-left 0.2s' }} className="site-layout">
          {/* Header */}
          <Header className="site-layout-header" style={{ 
            padding: '0 24px',
            background: isDarkTheme ? '#1f2937' : '#ffffff',
            borderBottom: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={toggleCollapsed}
                className="sidebar-toggle"
                style={{ 
                  fontSize: '16px',
                  color: isDarkTheme ? '#d1d5db' : '#374151'
                }}
              />

              {/* Breadcrumb */}
              <Breadcrumb
                items={breadcrumbItems}
                className="breadcrumb-nav"
                style={{ 
                  color: isDarkTheme ? '#d1d5db' : '#374151'
                }}
              />
            </div>

            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Botón para cambiar tema */}
              <Button
                type="text"
                icon={isDarkTheme ? '☀️' : '🌙'}
                onClick={toggleTheme}
                className="theme-toggle"
                title={isDarkTheme ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                style={{ 
                  fontSize: '18px',
                  color: isDarkTheme ? '#d1d5db' : '#374151'
                }}
              />

              {/* Notificaciones (placeholder) */}
              <Button
                type="text"
                icon={<span className="notification-badge">3</span>}
                className="notifications-btn"
                title="Notificaciones"
                style={{ 
                  color: isDarkTheme ? '#d1d5db' : '#374151'
                }}
              />

              {/* Perfil de usuario */}
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <div className="user-profile" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s',
                  ':hover': {
                    backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6'
                  }
                }}>
                  <Avatar
                    icon={<UserOutlined />}
                    className="user-avatar"
                    size="default"
                    style={{ 
                      backgroundColor: '#3b82f6'
                    }}
                  />
                  {!collapsed && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="user-name" style={{ 
                          fontSize: '14px', 
                          fontWeight: 500,
                          color: isDarkTheme ? '#f9fafb' : '#111827'
                        }}>
                          Admin User
                        </span>
                        <span className="user-role" style={{ 
                          fontSize: '12px',
                          color: isDarkTheme ? '#9ca3af' : '#6b7280'
                        }}>
                          Administrador
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </Dropdown>
            </div>
          </Header>

          {/* Contenido principal */}
          <Content className="site-layout-content" style={{ 
            margin: '24px 16px', 
            padding: 24,
            minHeight: 280,
            background: isDarkTheme ? '#111827' : '#f9fafb',
            borderRadius: '8px'
          }}>
            <div className="content-wrapper">
              {/* Suspense para carga diferida de componentes */}
              <Suspense fallback={
                <div className="content-loading" style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  minHeight: '300px'
                }}>
                  <Spin tip="Cargando contenido..." />
                </div>
              }>
                {/* Error Boundary para manejar errores en componentes hijos */}
                <React.ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
                  <Outlet />
                </React.ErrorBoundary>
              </Suspense>
            </div>
          </Content>

          {/* Footer */}
          <Footer className="site-layout-footer" style={{ 
            textAlign: 'center',
            background: isDarkTheme ? '#1f2937' : '#ffffff',
            borderTop: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
            padding: '24px 50px'
          }}>
            <div className="footer-content">
              <p style={{ 
                marginBottom: '8px',
                color: isDarkTheme ? '#d1d5db' : '#6b7280'
              }}>
                Sistema de Inventario © {new Date().getFullYear()} -
                Desarrollado por el equipo de desarrollo
              </p>
              <div className="footer-links" style={{ 
                marginBottom: '8px',
                color: isDarkTheme ? '#9ca3af' : '#9ca3af'
              }}>
                <Link to="/privacy" style={{ 
                  color: isDarkTheme ? '#60a5fa' : '#3b82f6',
                  textDecoration: 'none',
                  ':hover': { textDecoration: 'underline' }
                }}>
                  Política de Privacidad
                </Link>
                <span className="divider" style={{ margin: '0 8px' }}>|</span>
                <Link to="/terms" style={{ 
                  color: isDarkTheme ? '#60a5fa' : '#3b82f6',
                  textDecoration: 'none',
                  ':hover': { textDecoration: 'underline' }
                }}>
                  Términos de Servicio
                </Link>
                <span className="divider" style={{ margin: '0 8px' }}>|</span>
                <Link to="/help" style={{ 
                  color: isDarkTheme ? '#60a5fa' : '#3b82f6',
                  textDecoration: 'none',
                  ':hover': { textDecoration: 'underline' }
                }}>
                  Ayuda
                </Link>
                <span className="divider" style={{ margin: '0 8px' }}>|</span>
                <Link to="/contact" style={{ 
                  color: isDarkTheme ? '#60a5fa' : '#3b82f6',
                  textDecoration: 'none',
                  ':hover': { textDecoration: 'underline' }
                }}>
                  Contacto
                </Link>
              </div>
              <p className="footer-version" style={{ 
                fontSize: '12px',
                color: isDarkTheme ? '#6b7280' : '#9ca3af'
              }}>
                Versión 1.0.0 | Última actualización: {new Date().toLocaleDateString()}
              </p>
            </div>
          </Footer>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default MainLayout;