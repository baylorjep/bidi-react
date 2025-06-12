import { useState } from 'react';
import { toast } from 'react-toastify';

interface FetchReviewsResponse {
  success: boolean;
  message: string;
  count: number;
  error?: string;
  details?: string;
}

export const useGoogleReviews = (businessProfileId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    if (!businessProfileId) {
      setError('Business profile ID is required');
      toast.error('Business profile ID is required');
      return;
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

      const data: FetchReviewsResponse = await response.json();

      if (data.success) {
        toast.success(`Successfully fetched ${data.count} reviews`);
        return data;
      } else {
        const errorMessage = data.error || 'Failed to fetch reviews';
        setError(errorMessage);
        toast.error(errorMessage);
        if (data.details) {
          console.error('Review fetch error details:', data.details);
        }
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reviews';
      setError(errorMessage);
      toast.error('Failed to fetch reviews. Please try again later.');
      console.error('Error fetching reviews:', err);
      return null;
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