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

  // Fetch email and saved progress when component loads
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email);
        // Check for saved progress
        const { data: profile } = await supabase
          .from('business_profiles')
          .select('stripe_setup_progress')
          .eq('id', user.id)
          .single();
        
        if (profile?.stripe_setup_progress) {
          setSavedProgress(profile.stripe_setup_progress);
          setCurrentStep(profile.stripe_setup_progress);
        }
      }
    };
    fetchUserData();
  }, []);

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
    setIsLoading(true);
    setAccountCreatePending(true);
    setError(null);

    try {
      const response = await fetch('https://bidi-express.vercel.app/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ email })
      });

      const json = await response.json();
      
      if (json.account) {
        setConnectedAccountId(json.account);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { error: supabaseError } = await supabase
            .from('business_profiles')
            .update({ 
              stripe_setup_progress: 'verification'
            })
            .eq('id', user.id);

          if (supabaseError) {
            console.error('Failed to save progress:', supabaseError);
            setError('Failed to save progress. Please try again.');
          } else {
            setCurrentStep('verification');
          }
        }
      } else if (json.error) {
        setError(json.error.message || 'Failed to create Stripe account');
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
    setOnboardingExited(true);
    
    if (exitData?.status === 'completed') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('business_profiles')
          .update({ 
            stripe_account_id: connectedAccountId,
            stripe_setup_progress: 'completed',
            stripe_onboarding_completed: true
          })
          .eq('id', user.id);
        setSavedProgress('completed');
        setCurrentStep('banking');
      }
      setTimeout(() => navigate('/dashboard'), 1500); // Give time to see completion state
    } else {
      // Save progress
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
              onClick={() => setCurrentStep('account')}
            >
              Get Started
            </button>
            {savedProgress && savedProgress !== 'intro' && (
              <button 
                className="btn-secondary-stripe-onboarding mt-3"
                onClick={() => setCurrentStep(savedProgress)}
              >
                Continue Previous Setup
              </button>
            )}
          </div>
        );

      case 'account':
        return (
          <div className="onboarding-step-stripe-onboarding">
            <h2>Connect Your Account</h2>
            <p className="mb-4">
              To receive payments for the jobs you win, you'll need to set up a payment account.
              Bidi will never charge you to talk to users or place bids — a small service fee is
              only deducted after you've been paid.
            </p>
            
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
            {!accountCreatePending && !connectedAccountId && (
              <button 
                className="btn-primary-stripe-onboarding"
                onClick={createAccount}
                disabled={isLoading}
              >
                {isLoading ? 'Connecting...' : `Connect`}
              </button>
            )}

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
                />
              </ConnectComponentsProvider>
            )}
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
            <div className="step-indicator-stripe-onboarding"></div>
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
          <a href="/contact" target="_blank" rel="noopener noreferrer">
            contact support
          </a>.
        </p>
      </div>
    </div>
  );
}