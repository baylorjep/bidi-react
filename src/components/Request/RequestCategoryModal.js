import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function RequestCategoryModal({ isOpen, onClose, selectedCategories = [], requestData = {} }) {
  const navigate = useNavigate();

  const categories = [
    { id: 'photography', label: 'Photography', table: 'photography_requests' },
    { id: 'videography', label: 'Videography', table: 'videography_requests' },
    { id: 'catering', label: 'Catering', table: 'catering_requests' },
    { id: 'dj', label: 'DJ', table: 'dj_requests' },
    { id: 'florist', label: 'Florist', table: 'florist_requests' },
    { id: 'beauty', label: 'Hair & Makeup', table: 'beauty_requests' },
    { id: 'weddingPlanning', label: 'Wedding Planning', table: 'wedding_planning_requests' }
  ];

  // Filter categories to only show requested ones
  const requestedCategories = categories.filter(category => 
    selectedCategories.some(selectedCat => selectedCat.id === category.id)
  );

  // Auto-select if only one category
  useEffect(() => {
    if (isOpen && selectedCategories.length === 1) {
      handleCategorySelect(selectedCategories[0]);
    }
  }, [isOpen, selectedCategories]);

  const handleCategorySelect = (category) => {
    console.log('Selected category:', category);
    
    // Find the request ID for this category
    const requestId = requestData[category.id];
    
    navigate(`/vendor-selection/${category.id}`, {
      state: {
        requestId: requestId,
        table: category.table,
        categories: selectedCategories,
        requestData: requestData
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Close</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Select a Category</h2>
        <p className="text-gray-600 mb-6">
          Please select a category to browse vendors or wait for bids.
        </p>
        <div className="space-y-4">
          {requestedCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RequestCategoryModal; 