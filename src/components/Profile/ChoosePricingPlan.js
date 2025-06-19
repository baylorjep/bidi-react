import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import checkIcon from '../../assets/images/Icons/entypo_check.svg'
import checkIconWhite from '../../assets/images/Icons/ideas-entypo-check.svg'
import { supabase } from '../../supabaseClient';
import { Helmet } from 'react-helmet';
import './ChoosePricingPlan.css';

function ChoosePricingPlan() {
    const [userId, setUserId] = useState(null);
    const [email, setEmail] = useState('');
    const navigate = useNavigate();
  
    useEffect(() => {
      const fetchUserId = async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error fetching user:', error.message);
          return;
        }
        if (user) {
          setUserId(user.id);
          setEmail(user.email);
        }
      };
  
      fetchUserId();
    }, []);
  
    const updatePricingPlan = async (membershipTier) => {
      if (!userId) {
        console.error('User ID not available.');
        return;
      }
  
      try {
        const { data, error } = await supabase
          .from('business_profiles')
          .update({ membership_tier: membershipTier })
          .eq('id', userId);
  
        if (error) throw error;
        console.log('Data updated successfully:', data);
        navigate('/business-dashboard');
      } catch (err) {
        console.error('Error updating data:', err.message);
      }
    };

    const handleBetaSignup = async () => {
        try {
            // Add user to beta waitlist
            const { data, error } = await supabase
                .from('beta_waitlist')
                .insert([
                    {
                        user_id: userId,
                        email: email,
                        feature: 'ai_bidder',
                        status: 'pending'
                    }
                ]);

            if (error) throw error;

            // Show success message
            alert('Thanks for your interest! We\'ll notify you when the AI bidder beta is ready.');
            
        } catch (err) {
            console.error('Error signing up for beta:', err.message);
            alert('There was an error signing up for the beta. Please try again later.');
        }
    };

    const handlePlanSelection = (tier) => {
        navigate(`/signup?type=business&membership-tier=${tier}`);
    };

    return (
        <>
            <Helmet>
                <title>Bidi Pricing Plans | Choose Your Perfect Plan</title>
                <meta name="description" content="Choose from Bidi's flexible pricing plans. Start for free or upgrade to Plus for enhanced features. Find the perfect plan for your wedding business." />
            </Helmet>
            
            <div className="pricing-container">
                <div className="pricing-header">
                    <h1 className="pricing-title landing-page-title heading-reset">
                        Choose Your <span className="highlight">Perfect Plan</span>
                    </h1>
                    <h2 className="pricing-subtitle landing-page-subtitle heading-reset">
                        Start for free and only pay when you win jobs. Upgrade to Pro for advanced features and tools.
                    </h2>
                </div>

                <div className="payment-plan-container two-column">
                    <div className="plan-card">
                        <div>
                            <div className="plan-title">Basic</div>
                            <div className="plan-subheader">
                                Get started with Bidi and only pay when you win jobs.
                            </div>
                            <div className="includes-text">Includes:</div>
                            <div className="plan-items-container">
                                {[
                                    'Unlimited bids',
                                    'Access to all local wedding requests',
                                    'Basic vendor profile',
                                    'Secure payment processing',
                                    'Basic analytics dashboard',
                                    '10% commission on won jobs'
                                ].map((item, index) => (
                                    <div key={index} className="plan-item">
                                        <img src={checkIcon} alt="check" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="price-text">
                                10%<span className="price-suffix"> commission</span>
                            </div>
                            <button className="plan-button" onClick={() => handlePlanSelection('free')}>
                                Choose Plan
                            </button>
                        </div>
                    </div>

                    <div className="plan-card pro">
                        <div>
                            <div className="plan-header">
                                <div className="plan-title">Pro</div>
                                <div className="popular-tag">Beta</div>
                            </div>
                            <div className="plan-subheader">
                                Be among the first to test our AI-powered bidding tools.
                            </div>
                            <div className="includes-text">Everything in Free, plus:</div>
                            <div className="plan-items-container">
                                {[
                                    'Early access to AI bid optimization',
                                    'Help shape the future of automated bidding',
                                    'Market rate insights for your area',
                                    'Priority placement in search results',
                                    'Premium analytics and reporting',
                                    'VIP support during beta',
                                    'Lock in 20% commission rate'
                                ].map((item, index) => (
                                    <div key={index} className="plan-item">
                                        <img src={checkIcon} alt="check" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="price-text">
                                20%<span className="price-suffix"> commission</span>
                            </div>
                            <button className="plan-button beta-button" onClick={() => handlePlanSelection('pro')}>
                                Join Pro Beta
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ChoosePricingPlan;
