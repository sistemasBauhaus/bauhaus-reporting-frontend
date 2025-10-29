import React, { useState } from 'react';
import { FiMenu, FiChevronLeft, FiHome, FiBarChart2, FiSettings, FiLogOut } from "react-icons/fi";
import { Link, useNavigate } from 'react-router-dom';

const menuItems = [
  { label: 'Inicio', icon: FiHome, href: '/dashboard' },
  { label: 'Reportes', icon: FiBarChart2, href: '/reportes' },
  { label: 'Configuración', icon: FiSettings, href: '/configuracion' },
];

const Sidebar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Elimina el token
    navigate('/login'); // Redirige al login
  };

  return (
    <>
      {/* Botón hamburguesa para móviles */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-900 text-white p-2 rounded-lg shadow"
        onClick={() => setOpen(!open)}
        aria-label="Abrir menú"
      >
        {FiMenu({ className: "text-2xl" })}
      </button>
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen bg-blue-900 text-white shadow-lg z-40 transform transition-transform duration-300
        overflow-y-auto
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:block
        ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex flex-col h-full">
          {/* Letras B y colapsar */}
          <div className="flex items-center px-4 py-6 border-b border-blue-800 justify-between">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-800 rounded-full">
              <span className="text-xl font-extrabold text-white">B</span>
            </div>
            {!collapsed && (
              <span className="bauhaus-header-title text-white text-lg ml-2">Bauhaus</span>
            )}
            <button
              className="hidden md:block text-white ml-2"
              onClick={() => setCollapsed(!collapsed)}
              aria-label="Colapsar sidebar"
            >
              {FiChevronLeft({ className: `text-xl transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}` })}
            </button>
          </div>
          {/* Menú */}
          <nav className="flex-1 py-6 space-y-2 flex flex-col items-center">
            {menuItems.map(item => (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center px-2 py-2 rounded-lg hover:bg-blue-800 transition w-full
                  ${collapsed ? 'justify-center' : 'justify-start pl-4'}`}
              >
                {item.icon({ className: "text-lg" })}
                {!collapsed && (
                  <span className="text-base ml-2">{item.label}</span>
                )}
              </Link>
            ))}
          </nav>
          {/* Logout */}
          <div className="py-6 border-t border-blue-800 flex flex-col items-center">
            <button
              className={`flex items-center px-2 py-2 rounded-lg hover:bg-blue-800 transition w-full
                ${collapsed ? 'justify-center' : 'justify-start pl-4'}`}
              onClick={handleLogout}
            >
              {FiLogOut({ className: "text-2xl" })}
              {!collapsed && (
                <span className="text-base ml-2">Salir</span>
              )}
            </button>
          </div>
        </div>
      </aside>
      {/* Overlay para cerrar en móvil */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;

