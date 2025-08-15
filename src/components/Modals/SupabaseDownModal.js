import React, { useContext } from 'react';
import { SupabaseStatusContext } from '../../context/SupabaseStatusProvider';

const SupabaseDownModal = () => {
  const { isSupabaseUp } = useContext(SupabaseStatusContext);

  if (isSupabaseUp) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-white bg-opacity-95 flex items-center justify-center z-[9999]">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border-2 border-[#A328F4] tw-margin-top-4">
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