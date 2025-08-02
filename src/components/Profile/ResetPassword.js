import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import './ChoosePricingPlan.css';

function ResetPassword() {
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleResetPassword = async (e) => {
        e.preventDefault();

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://savewithbidi.vercel.app/reset-password',
        });

        if (error) {
            setErrorMessage(`Error sending reset email: ${error.message}`);
        } else {
            setSuccessMessage('Password reset email sent. It may take 5-10 minutes to arrive. Please check your inbox and spam folder.');
        }
    };

    return (
        <>
            <Helmet>
                <title>Reset Password - Bidi</title>
                <meta name="description" content="Reset your password for your Bidi account. We'll help you get back to connecting with top professionals." />
            </Helmet>

            <div className="pricing-container" style={{ height: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <div className="pricing-header" style={{ marginBottom: '20px' }}>
                    <h1 className="pricing-title landing-page-title heading-reset">
                        Reset Your Password
                    </h1>
                </div>

                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    marginTop: '20px'
                }}>
                    <div className="plan-card" style={{
                        maxWidth: '400px',
                        width: '100%',
                        padding: '40px'
                    }}>
                        {errorMessage && (
                            <div style={{
                                color: '#dc3545',
                                marginBottom: '20px',
                                textAlign: 'center',
                                padding: '10px',
                                borderRadius: '8px',
                                backgroundColor: '#fff'
                            }}>
                                {errorMessage}
                            </div>
                        )}
                        {successMessage && (
                            <div style={{
                                color: '#198754',
                                marginBottom: '20px',
                                textAlign: 'center',
                                padding: '10px',
                                borderRadius: '8px',
                                backgroundColor: '#fff'
                            }}>
                                {successMessage}
                            </div>
                        )}

                        <form onSubmit={handleResetPassword}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '500'
                                }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        fontSize: '1rem'
                                    }}
                                    placeholder="name@example.com"
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="plan-button"
                                style={{
                                    width: '100%',
                                    marginBottom: '20px'
                                }}
                            >
                                Send Reset Link
                            </button>

                            <div style={{
                                textAlign: 'center',
                                color: '#666'
                            }}>
                                Remember your password?{' '}
                                <Link 
                                    to="/signin"
                                    style={{
                                        color: 'var(--primary-color, #A328F4)',
                                        textDecoration: 'none',
                                        fontWeight: '500'
                                    }}
                                >
                                    Sign In
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ResetPassword;