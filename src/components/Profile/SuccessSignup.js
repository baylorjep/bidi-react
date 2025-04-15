import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import './ChoosePricingPlan.css';

function SuccessSignup() {
    return (
        <>
            <Helmet>
                <title>Account Created Successfully - Bidi</title>
                <meta name="description" content="Your Bidi account has been created successfully. Sign in to get started." />
            </Helmet>

            <div className="pricing-container">
                <div className="pricing-header">
                    <h1 className="pricing-title landing-page-title heading-reset">
                        Welcome to <span className="highlight">Bidi</span>
                    </h1>
                    <h2 className="pricing-subtitle">
                        Your account has been created successfully
                    </h2>
                </div>

                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    marginTop: '40px'
                }}>
                    <div className="plan-card" style={{
                        maxWidth: '400px',
                        textAlign: 'center',
                        padding: '40px'
                    }}>
                        <button 
                            onClick={() => window.location.href = '/signin'} 
                            className="plan-button"
                            style={{
                                fontSize: '1.1rem',
                                padding: '20px'
                            }}
                        >
                            Sign In to Get Started
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SuccessSignup;
                        