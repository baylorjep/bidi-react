import React, { useContext } from 'react';
import { SupabaseStatusContext } from '../../context/SupabaseStatusProvider';

const SupabaseDownModal = () => {
  const { isSupabaseUp } = useContext(SupabaseStatusContext);

  if (isSupabaseUp) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-white bg-opacity-90 flex items-center justify-center z-[9999]">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md text-center border border-red-400">
        <h2 className="text-2xl font-bold mb-3 text-red-600">We're having issues</h2>
        <p className="text-gray-700">Our backend is currently down. We're working on fixing it. Please check back shortly.</p>
      </div>
    </div>
  );
};

export default SupabaseDownModal;