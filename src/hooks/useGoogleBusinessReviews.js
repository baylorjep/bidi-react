import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const useGoogleBusinessReviews = (businessId) => {
  const [state, setState] = useState({
    reviews: [],
    totalReviews: 0,
    averageRating: 0,
    loading: false,
    error: null,
  });

  const fetchReviews = useCallback(async (accountId, locationId) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // First, fetch reviews from Google Business Profile API
      const response = await fetch(
        `http://localhost:5000/api/google-places/business-profile/reviews?accountId=${accountId}&locationId=${locationId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reviews from Google Business Profile');
      }

      const data = await response.json();

      // Transform and store reviews in Supabase
      const reviewsToInsert = data.reviews.map((review) => ({
        vendor_id: businessId,
        rating: review.rating,
        comment: review.comment,
        created_at: new Date(review.createTime).toISOString(),
        first_name: review.reviewer.displayName.split(' ')[0] || '',
        last_name: review.reviewer.displayName.split(' ').slice(1).join(' ') || '',
        is_google_review: true,
        google_review_id: review.reviewId,
        profile_photo_url: review.reviewer.profilePhotoUrl || null,
        relative_time_description: review.createTime,
        review_language: review.reviewReply?.language || 'en',
        review_rating: review.rating,
        is_approved: true, // Auto-approve Google reviews
      }));

      // Insert reviews into Supabase
      const { error: insertError } = await supabase
        .from('reviews')
        .upsert(reviewsToInsert, {
          onConflict: 'google_review_id',
          ignoreDuplicates: true,
        });

      if (insertError) {
        throw new Error('Failed to store reviews in database');
      }

      // Fetch the stored reviews from Supabase
      const { data: storedReviews, error: fetchError } = await supabase
        .from('reviews')
        .select('*')
        .eq('vendor_id', businessId)
        .eq('is_google_review', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error('Failed to fetch stored reviews');
      }

      // Calculate average rating
      const totalRating = storedReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = storedReviews.length > 0 ? totalRating / storedReviews.length : 0;

      setState({
        reviews: storedReviews,
        totalReviews: storedReviews.length,
        averageRating,
        loading: false,
        error: null,
      });

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred while fetching reviews',
      }));
    }
  }, [businessId]);

  return {
    ...state,
    fetchReviews,
  };
}; 