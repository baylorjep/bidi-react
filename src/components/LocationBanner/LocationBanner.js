import React, { useState } from 'react';
import EmailCaptureModal from '../EmailCaptureModal/EmailCaptureModal';
import { supabase } from '../../supabaseClient';

const LocationBanner = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [showModal, setShowModal] = useState(false);

    if (!isVisible) return null;

    const handleEmailSubmit = async (email) => {
        try {
            const { data, error } = await supabase
                .from('email_subscribers')
                .insert([
                    { 
                        email,
                        article_id: 'waitlist',
                        is_waitlist: true
                    }
                ]);

            if (error) throw error;
            setShowModal(false);
            alert('Thank you for joining our waitlist!');
        } catch (error) {
            console.error('Error saving email:', error);
            if (error.code === '23505') {
                alert('This email is already subscribed!');
            } else {
                alert('There was an error. Please try again.');
            }
        }
    };

    return (
        <>
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
                    onClick={() => setIsVisible(false)}
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
                    🎉 Bidi is currently available exclusively in Utah! 
                    <button 
                        onClick={() => setShowModal(true)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#FF008A',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            padding: 0,
                            margin: '0 5px',
                            font: 'inherit'
                        }}
                    >
                        Join our waitlist
                    </button>
                    to be notified when we expand to your area!
                </p>
            </div>

            <EmailCaptureModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleEmailSubmit}
                isWaitlist={true}
            />
        </>
    );
};

export default LocationBanner;