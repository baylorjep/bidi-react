import React from 'react';
import { useGoogleReviews } from '../../../hooks/useGoogleReviews';
import { GoogleReviewsProps } from '../../../types/google-reviews';
import StarIcon from '../../../assets/star-duotone.svg';
import EmptyStarIcon from '../../../assets/userpov-vendor-profile-star.svg';
import '../../../styles/GoogleReviews.css';

const ReviewCard: React.FC<{
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url: string;
}> = ({ author_name, rating, text, time, profile_photo_url }) => (
  <div className="google-review-card" role="article">
    <div className="review-header">
      <div className="reviewer-info">
        {profile_photo_url ? (
          <img 
            src={profile_photo_url} 
            alt={`${author_name}'s profile`}
            className="reviewer-avatar"
          />
        ) : (
          <div className="reviewer-avatar">
            {author_name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="reviewer-details">
          <span className="reviewer-name">{author_name}</span>
          <span className="review-date">
            {new Date(time * 1000).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>
      <div className="review-rating" role="img" aria-label={`${rating} out of 5 stars`}>
        {[...Array(5)].map((_, i) => (
          <img
            key={i}
            src={i < rating ? StarIcon : EmptyStarIcon}
            alt={i < rating ? 'Filled star' : 'Empty star'}
            className="review-star"
          />
        ))}
      </div>
    </div>
    <div className="review-content">
      {text}
    </div>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="google-reviews-skeleton">
    <div className="skeleton-header">
      <div className="skeleton-rating"></div>
    </div>
    <div className="skeleton-reviews">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton-review">
          <div className="skeleton-reviewer"></div>
          <div className="skeleton-text"></div>
        </div>
      ))}
    </div>
  </div>
);

const GoogleReviews: React.FC<GoogleReviewsProps> = ({ businessId, className }) => {
  const { reviews, loading, error } = useGoogleReviews(businessId);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !reviews) {
    return null; // Don't show anything if there's an error or no reviews
  }

  return (
    <section 
      className={`google-reviews-section ${className || ''}`}
      aria-label="Google Reviews"
    >
      <div className="google-reviews-header">
        <h3>Google Reviews</h3>
        {reviews.rating > 0 && (
          <div className="google-rating">
            <span className="rating-value">{reviews.rating.toFixed(1)}</span>
            <div 
              className="rating-stars"
              role="img"
              aria-label={`${reviews.rating} out of 5 stars`}
            >
              {[...Array(5)].map((_, i) => (
                <img
                  key={i}
                  src={i < Math.round(reviews.rating) ? StarIcon : EmptyStarIcon}
                  alt={i < Math.round(reviews.rating) ? 'Filled star' : 'Empty star'}
                  className="star-icon-portfolio"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="google-reviews-grid">
        {reviews.reviews.map((review, index) => (
          <ReviewCard key={index} {...review} />
        ))}
      </div>
    </section>
  );
};

export default GoogleReviews; 