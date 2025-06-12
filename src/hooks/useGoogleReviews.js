import { useState } from 'react';
import { toast } from 'react-toastify';

export const useGoogleReviews = (businessProfileId) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReviews = async () => {
    if (!businessProfileId) {
      setError('Business profile ID is required');
      return { success: false, error: 'Business profile ID is required' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/google-places/fetch-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessProfileId }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch reviews');
      }

      toast.success(`Successfully fetched ${data.count} reviews`);
      return { success: true, data };
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch reviews';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchReviews,
    isLoading,
    error,
  };
}; 