import React from 'react';

const ConfirmationPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-purple-600">
      <div className="card max-w-2xl">
        <h1 className="text-3xl font-bold text-green-600 mb-4">✓ Registration Successful</h1>
        <p className="text-gray-600">QR code and event details will be displayed here</p>
      </div>
    </div>
  );
};

export default ConfirmationPage;
