import React, { useState, useEffect } from 'react';
import DashboardHeader from './DashboardHeader';
import StatsCards from './StatsCards';
import InventoryTable from './InventoryTable';
import AddItemModal from './AddItemModal';
import QuickActions from './QuickActions';
import RecentActivity from './RecentActivity';
import '../../assets/styles/Dashboard/Dashboard.css';

const Dashboard = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Datos de ejemplo iniciales
  const initialItems = [
    { id: 1, name: 'Laptop Dell XPS 13', category: 'Electrónica', quantity: 15, price: 1299.99, status: 'Disponible' },
    { id: 2, name: 'Mouse Inalámbrico', category: 'Accesorios', quantity: 42, price: 29.99, status: 'Disponible' },
    { id: 3, name: 'Monitor 24" Samsung', category: 'Electrónica', quantity: 8, price: 199.99, status: 'Bajo Stock' },
    { id: 4, name: 'Teclado Mecánico', category: 'Accesorios', quantity: 0, price: 89.99, status: 'Agotado' },
    { id: 5, name: 'Impresora HP LaserJet', category: 'Oficina', quantity: 5, price: 349.99, status: 'Disponible' },
    { id: 6, name: 'Cargador USB-C', category: 'Electrónica', quantity: 27, price: 19.99, status: 'Disponible' },
    { id: 7, name: 'Disco Duro Externo 1TB', category: 'Almacenamiento', quantity: 12, price: 79.99, status: 'Disponible' },
    { id: 8, name: 'Router Wi-Fi 6', category: 'Redes', quantity: 3, price: 149.99, status: 'Bajo Stock' },
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setInventoryItems(initialItems);
      setLoading(false);
    }, 1000);
  }, []);

  const handleAddItem = (newItem) => {
    const newItemWithId = {
      ...newItem,
      id: inventoryItems.length > 0 ? Math.max(...inventoryItems.map(item => item.id)) + 1 : 1
    };
    setInventoryItems([...inventoryItems, newItemWithId]);
  };

  const handleDeleteItem = (id) => {
    setInventoryItems(inventoryItems.filter(item => item.id !== id));
  };

  const handleUpdateItem = (updatedItem) => {
    setInventoryItems(inventoryItems.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const statsData = {
    totalItems: inventoryItems.length,
    totalValue: inventoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    lowStockItems: inventoryItems.filter(item => item.status === 'Bajo Stock').length,
    outOfStockItems: inventoryItems.filter(item => item.status === 'Agotado').length,
  };

  return (
    <div className="dashboard">
      <DashboardHeader 
        title="Dashboard de Inventario" 
        onAddItem={openModal}
        user={{ name: 'Administrador' }}
      />
      
      <div className="dashboard-content">
        <div className="dashboard-main">
          <StatsCards stats={statsData} />
          <InventoryTable 
            items={inventoryItems}
            onDelete={handleDeleteItem}
            onUpdate={handleUpdateItem}
            loading={loading}
          />
        </div>
        
        <div className="dashboard-sidebar">
          <QuickActions 
            onAddItem={openModal}
            onExport={() => alert('Exportando datos...')}
            onPrint={() => window.print()}
          />
          <RecentActivity items={inventoryItems} />
        </div>
      </div>

      <AddItemModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onAddItem={handleAddItem}
      />
    </div>
  );
};

export default Dashboard;