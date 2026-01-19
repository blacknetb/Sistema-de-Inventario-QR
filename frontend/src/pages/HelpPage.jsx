import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/pages/pages.css';

const HelpPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const faqs = [
    {
      id: 1,
      question: '¿Cómo agrego un nuevo producto al inventario?',
      answer: 'Para agregar un nuevo producto, ve a la página de "Inventario" y haz clic en el botón "Nuevo Producto". Completa todos los campos requeridos del formulario, incluyendo nombre, categoría, cantidad y precio. Una vez guardado, el producto aparecerá en tu lista de inventario.'
    },
    {
      id: 2,
      question: '¿Cómo puedo editar o eliminar un producto?',
      answer: 'En la lista de inventario, cada producto tiene botones de "Editar" y "Eliminar". Haz clic en "Editar" para modificar la información del producto, o en "Eliminar" para removerlo permanentemente del sistema.'
    },
    {
      id: 3,
      question: '¿Qué significa "Bajo Stock" y cómo configuro las alertas?',
      answer: 'Un producto está marcado como "Bajo Stock" cuando su cantidad está por debajo del umbral establecido. Puedes configurar este umbral en Configuración > Inventario. Las alertas se envían automáticamente cuando el stock llega a este nivel.'
    },
    {
      id: 4,
      question: '¿Cómo genero reportes del inventario?',
      answer: 'Ve a la sección "Reportes" donde encontrarás diferentes tipos de reportes: ventas, inventario, categorías y bajo stock. Puedes filtrar por fecha y exportar los reportes en formato PDF o Excel.'
    },
    {
      id: 5,
      question: '¿Puedo agregar múltiples usuarios al sistema?',
      answer: 'Sí, en Configuración > Usuarios puedes agregar nuevos usuarios y asignarles diferentes roles: Administrador, Gestor, Vendedor o Visualizador. Cada rol tiene permisos diferentes.'
    },
    {
      id: 6,
      question: '¿Cómo funciona el sistema de categorías?',
      answer: 'Las categorías te ayudan a organizar tus productos. Puedes crear nuevas categorías en la página "Categorías" y asignar productos a ellas. Esto facilita la búsqueda y filtrado de productos.'
    },
    {
      id: 7,
      question: '¿Puedo importar datos desde Excel?',
      answer: 'Sí, en la página de Inventario encontrarás un botón "Importar" que te permite cargar productos desde un archivo CSV o Excel. Asegúrate de que el archivo tenga el formato correcto siguiendo la plantilla proporcionada.'
    },
    {
      id: 8,
      question: '¿Cómo restauro mi contraseña si la olvidé?',
      answer: 'En la página de Login, haz clic en "¿Olvidaste tu contraseña?" e ingresa tu email. Recibirás un enlace para restablecer tu contraseña. Si no recibes el email, verifica tu carpeta de spam o contacta al administrador.'
    }
  ];

  const quickLinks = [
    { title: 'Guía de inicio rápido', path: '/docs/quickstart', icon: '🚀' },
    { title: 'Video tutoriales', path: '/docs/tutorials', icon: '🎥' },
    { title: 'Manual de usuario', path: '/docs/manual', icon: '📖' },
    { title: 'Preguntas frecuentes', path: '/docs/faq', icon: '❓' },
    { title: 'API Documentation', path: '/docs/api', icon: '🔌' },
    { title: 'Actualizaciones', path: '/docs/changelog', icon: '🔄' }
  ];

  const toggleFaq = (id) => {
    setActiveFaq(activeFaq === id ? null : id);
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm({
      ...contactForm,
      [name]: value
    });
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar el mensaje
    alert('Mensaje enviado. Nos pondremos en contacto contigo pronto.');
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Centro de Ayuda</h1>
          <p className="page-subtitle">Encuentra respuestas y soporte para tu sistema de inventario</p>
        </div>
      </div>

      <div className="row">
        <div className="col-2">
          <div className="page-card">
            <h3 className="section-title">Enlaces Rápidos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {quickLinks.map(link => (
                <Link 
                  key={link.path}
                  to={link.path}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '15px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#2c3e50',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eef2f7'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                >
                  <span style={{ fontSize: '1.5rem' }}>{link.icon}</span>
                  <span style={{ fontWeight: '600' }}>{link.title}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="page-card">
            <h3 className="section-title">Contacto de Soporte</h3>
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <span style={{ fontSize: '1.2rem' }}>📧</span>
                <div>
                  <div style={{ fontWeight: '600' }}>Email</div>
                  <div style={{ color: '#7f8c8d' }}>soporte@inventariopro.com</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <span style={{ fontSize: '1.2rem' }}>📞</span>
                <div>
                  <div style={{ fontWeight: '600' }}>Teléfono</div>
                  <div style={{ color: '#7f8c8d' }}>+1 800 123 4567</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <span style={{ fontSize: '1.2rem' }}>🕒</span>
                <div>
                  <div style={{ fontWeight: '600' }}>Horario de Atención</div>
                  <div style={{ color: '#7f8c8d' }}>Lunes a Viernes: 9:00 - 18:00</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="page-card">
            <h3 className="section-title">Preguntas Frecuentes</h3>
            <div className="faq-container">
              {faqs.map(faq => (
                <div className={`faq-item ${activeFaq === faq.id ? 'active' : ''}`} key={faq.id}>
                  <div className="faq-question" onClick={() => toggleFaq(faq.id)}>
                    {faq.question}
                    <span style={{ fontSize: '1.5rem' }}>{activeFaq === faq.id ? '−' : '+'}</span>
                  </div>
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="page-card">
            <h3 className="section-title">Contacta con Soporte</h3>
            <form onSubmit={handleContactSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Asunto</label>
                <input
                  type="text"
                  name="subject"
                  className="form-control"
                  value={contactForm.subject}
                  onChange={handleContactChange}
                  placeholder="¿En qué podemos ayudarte?"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Mensaje</label>
                <textarea
                  name="message"
                  className="form-control"
                  value={contactForm.message}
                  onChange={handleContactChange}
                  rows="4"
                  placeholder="Describe tu problema o pregunta en detalle..."
                  required
                />
              </div>
              
              <div className="form-group">
                <button type="submit" className="btn btn-primary">
                  <span className="btn-icon">📨</span> Enviar Mensaje
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;