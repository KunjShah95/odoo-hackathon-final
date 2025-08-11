import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';

const AdminPanel: React.FC = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
};

export default AdminPanel;
