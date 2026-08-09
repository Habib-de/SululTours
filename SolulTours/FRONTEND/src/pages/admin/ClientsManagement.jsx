import React from 'react';

const ClientsManagement = ({ setActiveTab }) => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Clients</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Manage all clients.</p>
      </div>
    </div>
  );
};

export default ClientsManagement;
