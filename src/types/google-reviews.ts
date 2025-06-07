export interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url: string;
}

export interface GoogleReviewsResponse {
  rating: number;
  reviews: GoogleReview[];
}

export interface GoogleReviewsProps {
  businessId: string;
  className?: string;
} 