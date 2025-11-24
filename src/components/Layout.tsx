import React from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => (
  <div className="layout-root">
    <Sidebar />
    <main className="main-content">
      <Outlet />
    </main>
  </div>
);

export default Layout;