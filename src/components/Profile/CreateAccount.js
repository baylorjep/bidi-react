import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '../../supabaseClient';
import './ChoosePricingPlan.css';

function CreateAccount() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const source = searchParams.get('source');

    useEffect(() => {
        // Check and refresh session if needed
        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (session) {
                // If user is already logged in, redirect to appropriate dashboard
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (profile?.role === 'business') {
                    navigate('/business-dashboard');
                } else if (profile?.role === 'individual') {
                    navigate('/individual-dashboard');
                }
            }
        };

        checkSession();
    }, [navigate]);

    const handleUserTypeSelection = async (type) => {
        try {
            if (type === 'business') {
                navigate('/choose-pricing-plan');
            } else {
                navigate(`/signup?type=${type}`);
            }
        } catch (error) {
            console.error('Navigation error:', error);
            // If there's an error, ensure we still navigate
            if (type === 'business') {
                window.location.href = '/choose-pricing-plan';
            } else {
                window.location.href = `/signup?type=${type}`;
            }
        }
    };

    return (
        <>
            <Helmet>
                <title>Create Account - Bidi</title>
                <meta name="description" content="Join Bidi - Create your account as a couple planning a wedding or as a wedding vendor." />
            </Helmet>
            
            <div className="pricing-container" style={{height:'70vh', display:'flex', justifyContent:'center', alignItems:'center', flexDirection:'column'}}>
                <div className="pricing-header">
                    <h1 className="pricing-title landing-page-title heading-reset">
                        Create an Account
                    </h1>
                </div>

                <div className="payment-plan-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div className="plan-card" onClick={() => handleUserTypeSelection('individual')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: '400px' }}>
                        <button className="plan-button">
                            Hire someone to help me
                        </button>
                    </div>

                    <div style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: 'bold',
                        color: '#666',
                        position: 'relative',
                        padding: '0 20px'
                    }}>
                        OR
                    </div>

                    <div className="plan-card" onClick={() => handleUserTypeSelection('business')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: '400px' }}>
                        <button className="plan-button vendor">
                            Offer my skills to others
                        </button>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#666', position: 'relative', padding: '0 20px', fontFamily: 'Inter' }}>
                        <div>
                            Trying to log in? <a href='/signin' style={{ color: '#000',}}>Click here</a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CreateAccount; 