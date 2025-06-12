import React from 'react';
import { useGoogleReviews } from '../../hooks/useGoogleReviews';
import LoadingSpinner from '../LoadingSpinner';

interface FetchReviewsButtonProps {
  businessProfileId: string;
  onSuccess?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const FetchReviewsButton: React.FC<FetchReviewsButtonProps> = ({
  businessProfileId,
  onSuccess,
  className = '',
  variant = 'primary'
}) => {
  const { fetchReviews, isLoading, error } = useGoogleReviews(businessProfileId);

  const handleClick = async () => {
    const result = await fetchReviews();
    if (result?.success && onSuccess) {
      onSuccess();
    }
  };

  const getButtonClasses = () => {
    const baseClasses = 'btn';
    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline-primary'
    };
    return `${baseClasses} ${variantClasses[variant]} ${className}`.trim();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={getButtonClasses()}
      style={{ minWidth: '150px', position: 'relative' }}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size={20} color="#fff" />
          <span style={{ marginLeft: '8px' }}>Fetching...</span>
        </>
      ) : (
        <>
          <i className="fas fa-sync-alt me-2"></i>
          Fetch Reviews
        </>
      )}
      {error && (
        <div className="text-danger small mt-1">
          {error}
        </div>
      )}
    </button>
  );
}; 