import React from 'react';
import { useSearchParams } from 'react-router-dom';

const GoogleBusinessError = () => {
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get('message') || 'An unknown error occurred';
  
  // Check for RLS policy error
  const isRLSError = errorMessage.includes('row-level security policy');
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{ 
        textAlign: 'center',
        maxWidth: '600px',
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>Error Connecting to Google Business Profile</h2>
        {isRLSError ? (
          <div>
            <p style={{ marginBottom: '15px' }}>There was an issue saving your authentication. Please contact support.</p>
            <div style={{ 
              backgroundColor: '#f8d7da', 
              color: '#721c24',
              padding: '15px',
              borderRadius: '4px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <p style={{ margin: '0' }}><strong>Error Details:</strong></p>
              <p style={{ margin: '0', whiteSpace: 'pre-wrap' }}>{errorMessage}</p>
            </div>
            <button
              onClick={() => window.location.href = '/support'}
              style={{
                backgroundColor: '#9633eb',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Contact Support
            </button>
          </div>
        ) : (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24',
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <p style={{ margin: '0' }}><strong>Error Details:</strong></p>
            <p style={{ margin: '0', whiteSpace: 'pre-wrap' }}>{errorMessage}</p>
          </div>
        )}
        <button
          onClick={() => window.history.back()}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default GoogleBusinessError; 