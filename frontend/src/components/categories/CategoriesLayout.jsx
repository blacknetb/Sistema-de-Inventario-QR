import React from 'react';
import { Outlet } from 'react-router-dom';
import '../../assets/styles/CATEGORIES/categories.css';

const CategoriesLayout = () => {
    return (
        <div className="categories-layout">
            <div className="categories-container">
                <div className="categories-header">
                    <h1>📂 Gestión de Categorías</h1>
                    <p className="subtitle">
                        Organiza y administra las categorías de tu inventario
                    </p>
                </div>
                <Outlet />
            </div>
        </div>
    );
};

export default CategoriesLayout;