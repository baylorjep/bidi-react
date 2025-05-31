import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const LocationBanner = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Check localStorage when component mounts
        const bannerHidden = localStorage.getItem('locationBannerHidden');
        if (bannerHidden === 'true') {
            setIsVisible(false);
        }
    }, []);

    if (!isVisible) return null;

    const handleClose = () => {
        setIsVisible(false);
        // Store the preference in localStorage
        localStorage.setItem('locationBannerHidden', 'true');
    };

    return (
        <div style={{
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #dee2e6',
            padding: '10px 35px 10px 20px',
            position: 'relative',
            textAlign: 'center',
            fontFamily: 'Outfit',
            width: '100%',
            zIndex: 1000,
            boxSizing: 'border-box'
        }}>
            <button
                onClick={handleClose}
                style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#666',
                    padding: '5px',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                aria-label="Close banner"
            >
                ×
            </button>
            <p style={{ 
                margin: 0,
                fontSize: '14px',
                color: '#495057',
                lineHeight: '1.4'
            }}>
                🎉 Get 5% off everything when you book through Bidi! Limited time offer.
                <Link 
                    to="/request-categories"
                    style={{
                        color: '#FF008A',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: 0,
                        margin: '0 5px',
                        font: 'inherit'
                    }}
                >
                    Click here to start saving
                </Link>
            </p>
        </div>
    );
};

export default LocationBanner;