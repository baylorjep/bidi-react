import React, { useState, useEffect } from 'react';
import { useStripeConnect } from '../../hooks/useStripeConnect';
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from '@stripe/react-connect-js';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './EnhancedStripeOnboarding.css';

const ONBOARDING_STEPS = [
  {
    id: 'intro',
    title: 'Welcome',
    description: 'Get ready to accept payments for your services',
  },
  {
    id: 'account',
    title: 'Create Account',
    description: 'Connect your email with Stripe',
  },
  {
    id: 'verification',
    title: 'Verify Identity',
    description: 'Provide required verification information',
  },
  {
    id: 'banking',
    title: 'Banking Details',
    description: 'Set up your bank account for payouts',
  },
];

export default function EnhancedStripeOnboarding() {
  const [currentStep, setCurrentStep] = useState('intro');
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [onboardingExited, setOnboardingExited] = useState(false);
  const [error, setError] = useState(null);
  const [connectedAccountId, setConnectedAccountId] = useState();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);
  const stripeConnectInstance = useStripeConnect(connectedAccountId);
  const navigate = useNavigate();

  // Fetch email on mount
  useEffect(() => {
    const fetchUserData = async () => {
      console.log('Fetching initial user data');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email);
      }
    };
    fetchUserData();
  }, []);

  // Debug connectedAccountId changes
  useEffect(() => {
    console.log('connectedAccountId changed to:', connectedAccountId);
  }, [connectedAccountId]);

  // Handle beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (currentStep !== 'intro' && savedProgress !== 'completed') {
        const message = 'If you leave now, you\'ll need to restart the Stripe setup process from the beginning when you return.';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentStep, savedProgress]);

  // Reset progress when component unmounts if not completed
  useEffect(() => {
    return () => {
      if (currentStep !== 'intro' && savedProgress !== 'completed') {
        const resetProgress = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('business_profiles')
              .update({ 
                stripe_setup_progress: null,
                stripe_account_id: null
              })
              .eq('id', user.id);
          }
        };
        resetProgress();
      }
    };
  }, [currentStep, savedProgress]);

  const saveProgress = async (step) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('business_profiles')
        .update({ stripe_setup_progress: step })
        .eq('id', user.id);
    }
  };

  const createAccount = async () => {
    if (isLoading || accountCreatePending) {
      return; // Prevent multiple simultaneous calls
    }

    setIsLoading(true);
    setAccountCreatePending(true);
    setError(null);
    setConnectedAccountId(null); // Reset any existing account ID

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated. Please log in again.');
        setIsLoading(false);
        setAccountCreatePending(false);
        return;
      }

      const response = await fetch('https://bidi-express.vercel.app/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ 
          email,
          userId: user.id 
        })
      });

      const json = await response.json();
      console.log('Account creation response:', json);
      
      if (json.accountId) {
        console.log('Account ID received from backend:', json.accountId);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          console.log('User found, updating progress...');
          const { error: supabaseError } = await supabase
            .from('business_profiles')
            .update({ 
              stripe_setup_progress: 'verification'
            })
            .eq('id', user.id);

          if (supabaseError) {
            console.error('Failed to save progress:', supabaseError);
            setError('Failed to save progress. Please try again.');
            setIsLoading(false);
            setAccountCreatePending(false);
            return;
          }

          // Only set these after successful database update
          console.log('Setting connectedAccountId to:', json.accountId);
          setConnectedAccountId(json.accountId);
          setCurrentStep('verification');
          console.log('Connected account ID set to:', json.accountId);
          console.log('Current step set to verification');
        } else {
          console.error('No user found after account creation');
          setError('User authentication error. Please try again.');
        }
      } else if (json.error) {
        console.error('Backend returned error:', json.error);
        setError(json.error.message || 'Failed to create Stripe account');
      } else {
        console.error('Unexpected response format:', json);
        setError('Unexpected response from server');
      }
    } catch (err) {
      console.error('Error during account creation:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
      setAccountCreatePending(false);
    }
  };

  const handleOnboardingExit = async (exitData) => {
    console.log('Onboarding exit event:', exitData);
    console.log('Current connectedAccountId:', connectedAccountId);
    console.log('Current step:', currentStep);
    setOnboardingExited(true);
    
    // Check if onboarding was completed successfully
    const isCompleted = exitData?.status === 'completed' || 
                       exitData?.type === 'account_updated' ||
                       (exitData && Object.keys(exitData).length === 0); // Sometimes Stripe sends empty object on success
    
    console.log('Is completed:', isCompleted);
    console.log('Has connectedAccountId:', !!connectedAccountId);
    
    if (isCompleted && connectedAccountId) {
      console.log('Saving completed account to database:', connectedAccountId);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: updateError } = await supabase
          .from('business_profiles')
          .update({ 
            stripe_account_id: connectedAccountId,
            stripe_setup_progress: 'completed',
            stripe_onboarding_completed: true
          })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Failed to save account ID to database:', updateError);
          setError('Failed to save account. Please contact support.');
        } else {
          console.log('Successfully saved account ID to database');
          setSavedProgress('completed');
          setCurrentStep('banking');
          
          // Navigate to dashboard after successful completion
          setTimeout(() => navigate('/dashboard'), 1500);
        }
      } else {
        console.error('No user found during completion');
        setError('User authentication error during completion');
      }
    } else {
      console.log('Onboarding not completed or no account ID, saving progress');
      console.log('Reason - isCompleted:', isCompleted, 'connectedAccountId:', connectedAccountId);
      // Save progress for incomplete onboarding
      await saveProgress(currentStep);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <div className="onboarding-step-stripe-onboarding">
            <h2>Welcome to Stripe Payment Setup</h2>
            <div className="setup-info-stripe-onboarding">
              <div className="info-card-stripe-onboarding">
                <h3>What You'll Need</h3>
                <ul>
                  <li>Government-issued ID</li>
                  <li>Bank account information</li>
                  <li>Business information (if applicable)</li>
                </ul>
              </div>
              <div className="info-card-stripe-onboarding">
                <h3>Estimated Time</h3>
                <p>5-10 minutes</p>
              </div>
            </div>
            <button 
              className="btn-primary-stripe-onboarding"
              onClick={() => {
                console.log('Moving to account step');
                setCurrentStep('account');
              }}
            >
              Get Started
            </button>
          </div>
        );

      case 'account':
        return (
          <div className="onboarding-step-stripe-onboarding">
            <h2>Connect Your Account</h2>
            {savedProgress === 'verification' ? (
              <p className="mb-4">
                Welcome back! For security reasons, we need to restart the Stripe verification process.
                Your progress is saved, and you'll be able to complete the setup from where you left off
                once reconnected.
              </p>
            ) : (
              <p className="mb-4">
                To receive payments for the jobs you win, you'll need to set up a payment account.
                Bidi will never charge you to talk to users or place bids — a small service fee is
                only deducted after you've been paid.
              </p>
            )}
            
            {error && (
              <div className="error-message-stripe-onboarding">
                <p>{error}</p>
                <button 
                  className="btn-secondary-stripe-onboarding mt-2"
                  onClick={() => setError(null)}
                >
                  Try Again
                </button>
              </div>
            )}

            <div>
            <button 
              className="btn-primary-stripe-onboarding"
              onClick={createAccount}
              disabled={isLoading || accountCreatePending}
            >
              {isLoading || accountCreatePending ? 'Connecting...' : 'Connect'}
            </button>

            {accountCreatePending && (
              <div className="loading-state-stripe-onboarding">
                <div className="spinner-stripe-onboarding"></div>
                <p>Creating your Stripe connected account...</p>
              </div>
            )}

            </div>


          </div>
        );

      case 'verification':
        return (
          <div className="onboarding-step-stripe-onboarding">
            {stripeConnectInstance && (
              <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
                <ConnectAccountOnboarding
                  onExit={handleOnboardingExit}
                  onReady={() => {
                    console.log('Stripe onboarding component ready');
                  }}
                  onError={(error) => {
                    console.error('Stripe onboarding error:', error);
                    setError('An error occurred during onboarding. Please try again.');
                  }}
                />
              </ConnectComponentsProvider>
            )}
            
            {/* Manual completion button in case automatic detection fails */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <p style={{ color: '#666', marginBottom: '1rem' }}>
                If you've completed the verification but are still seeing this page, click the button below:
              </p>
              <button 
                className="btn-secondary-stripe-onboarding"
                onClick={() => handleOnboardingExit({ status: 'completed' })}
              >
                I've Completed Verification
              </button>
            </div>
          </div>
        );

      case 'banking':
        return (
          <div className="onboarding-step-stripe-onboarding">
            <div className="completion-message-stripe-onboarding">
              <div className="success-icon-stripe-onboarding">
                <i className="fas fa-check-circle"></i>
              </div>
              <h2>Setup Complete!</h2>
              <p>Your Stripe account has been successfully connected and verified.</p>
              <p>You can now receive payments for your services through Bidi.</p>
              <div className="redirecting-message-stripe-onboarding">
                <p>Redirecting to your dashboard...</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="enhanced-stripe-onboarding">
      {/* Progress Indicator */}
      <div className="progress-bar-stripe-onboarding">
        {ONBOARDING_STEPS.map((step) => (
          <div 
            key={step.id}
            className={`progress-step-stripe-onboarding ${currentStep === step.id ? 'active' : ''} 
                       ${ONBOARDING_STEPS.findIndex(s => s.id === currentStep) > 
                         ONBOARDING_STEPS.findIndex(s => s.id === step.id) ? 'completed' : ''}
                       ${savedProgress === 'completed' && step.id === 'banking' ? 'completed' : ''}`}
          >
            <div className="step-indicator-stripe-onboarding">
              {ONBOARDING_STEPS.findIndex(s => s.id === currentStep) > 
                ONBOARDING_STEPS.findIndex(s => s.id === step.id) || 
                (savedProgress === 'completed' && step.id === 'banking') ? (
                <svg 
                  className="checkmark" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24"
                  fill="white"
                  width="16"
                  height="16"
                >
                  <path d="M9.55 18.2L3.65 12.3a.996.996 0 0 1 0-1.41c.39-.39 1.02-.39 1.41 0l4.49 4.49 8.99-8.99c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41L9.55 18.2z"/>
                </svg>
              ) : null}
            </div>
            <div className="step-details-stripe-onboarding">
              <h4>{step.title}</h4>
              <p>{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="onboarding-content-stripe-onboarding">
        {renderStep()}
      </div>

      {/* Help Section */}
      <div className="help-section-stripe-onboarding">
        <h3>Need Help?</h3>
        <p>
          If you're having trouble setting up your account, check our{' '}
          <a href="/help/stripe-setup" target="_blank" rel="noopener noreferrer">
            setup guide
          </a>{' '}
          or{' '}
          <a href="/about" target="_blank" rel="noopener noreferrer">
            contact support
          </a>.
        </p>
      </div>
    </div>
  );
}