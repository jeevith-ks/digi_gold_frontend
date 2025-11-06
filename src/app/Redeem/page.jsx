'use client';
import React from 'react';

const RedeemMetal = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-center mb-6" style={{ color: '#50C2C9' }}>
            Redeem Metal
          </h1>
          
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Holdings</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-500 text-center">No holdings found</p>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#50C2C9' }}>Gifts</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-500 text-center">No holdings found</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">SIP</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-500 text-center">No holdings found</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedeemMetal;