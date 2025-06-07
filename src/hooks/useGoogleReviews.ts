import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { GoogleReviewsResponse } from '../types/google-reviews';

const CACHE_DURATION = 3600000; // 1 hour in milliseconds
const reviewsCache = new Map<string, { data: GoogleReviewsResponse; timestamp: number }>();

export const useGoogleReviews = (businessId: string) => {
  const [reviews, setReviews] = useState<GoogleReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async (placeId: string) => {
    try {
      // Check cache first
      const cachedData = reviewsCache.get(placeId);
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        setReviews(cachedData.data);
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/google-reviews?placeId=${placeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch Google reviews');
      }

      const data: GoogleReviewsResponse = await response.json();
      
      // Update cache
      reviewsCache.set(placeId, { data, timestamp: Date.now() });
      
      setReviews(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setReviews(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const { data: businessData, error: businessError } = await supabase
          .from('business_profiles')
          .select('google_place_id, google_reviews_status')
          .eq('id', businessId)
          .single();

        if (businessError) throw businessError;

        if (!businessData?.google_place_id || businessData.google_reviews_status !== 'approved') {
          setLoading(false);
          return;
        }

        await fetchReviews(businessData.google_place_id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [businessId, fetchReviews]);

  return { reviews, loading, error };
}; 