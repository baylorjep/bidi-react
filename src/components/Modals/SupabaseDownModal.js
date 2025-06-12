import React, { useContext } from 'react';
import { SupabaseStatusContext } from '../../context/SupabaseStatusProvider';

const SupabaseDownModal = () => {
  const { isSupabaseUp } = useContext(SupabaseStatusContext);

  if (isSupabaseUp) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-white bg-opacity-95 flex items-center justify-center z-[9999]">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border-2 border-[#A328F4]">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-[#A328F4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-3 text-[#A328F4] font-['Outfit']">Service Temporarily Unavailable</h2>
        <p className="text-gray-700 mb-4 font-['Outfit']">We're experiencing technical difficulties with our backend services. Our team has been notified and is working to resolve the issue.</p>
        <div className="text-sm text-gray-500 font-['Outfit']">
          <p>What you can do:</p>
          <ul className="list-disc list-inside mt-2">
            <li>Refresh the page in a few minutes</li>
            <li>Check our status page for updates</li>
            <li>Contact support if the issue persists</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SupabaseDownModal;