import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaLightbulb, FaRobot, FaGraduationCap } from 'react-icons/fa';
import '../../styles/AutobidTrainer.css';

const AutobidTrainer = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [trainingRequests, setTrainingRequests] = useState([]);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidDescription, setBidDescription] = useState('');
  const [pricingBreakdown, setPricingBreakdown] = useState('');
  const [pricingReasoning, setPricingReasoning] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [businessCategory, setBusinessCategory] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);
  const navigate = useNavigate();

  const TOTAL_STEPS = 5;

  useEffect(() => {
    const fetchUserAndRequests = async () => {
      try {
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          navigate('/login');
          return;
        }
        setUser(currentUser);

        // Get business category
        const { data: businessProfile } = await supabase
          .from('business_profiles')
          .select('business_category')
          .eq('id', currentUser.id)
          .single();

        let userCategory = '';
        if (businessProfile?.business_category) {
          userCategory = Array.isArray(businessProfile.business_category) 
            ? businessProfile.business_category[0] 
            : businessProfile.business_category;
          setBusinessCategory(userCategory);
        }

        // Fetch training requests
        const { data: requests, error } = await supabase
          .from('autobid_training_requests')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter by business category if available
        let filteredRequests = requests;
        if (userCategory && userCategory !== 'other') {
          // First, get category-specific requests
          const categoryRequests = requests.filter(req => req.category === userCategory);
          
          // If we have enough category-specific requests, use them
          if (categoryRequests.length >= TOTAL_STEPS) {
            filteredRequests = categoryRequests.slice(0, TOTAL_STEPS);
          } else {
            // Mix category-specific and general requests
            const generalRequests = requests.filter(req => req.category !== userCategory);
            filteredRequests = [
              ...categoryRequests,
              ...generalRequests.slice(0, TOTAL_STEPS - categoryRequests.length)
            ];
          }
        } else {
          // If no specific category or 'other', use general requests
          filteredRequests = requests.slice(0, TOTAL_STEPS);
        }

        setTrainingRequests(filteredRequests);
        setCurrentRequest(filteredRequests[0]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching training data:', error);
        setIsLoading(false);
      }
    };

    fetchUserAndRequests();
  }, [navigate]);

  const handleSubmit = async () => {
    if (!bidAmount || !bidDescription) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('autobid_training_responses')
        .insert({
          business_id: user.id,
          request_id: currentRequest.id,
          bid_amount: parseFloat(bidAmount),
          bid_description: bidDescription,
          pricing_breakdown: pricingBreakdown,
          pricing_reasoning: pricingReasoning,
          is_training: true
        });

      if (error) throw error;

      // Move to next step
      const nextStep = currentStep + 1;
      setCompletedSteps(nextStep);

      if (nextStep < TOTAL_STEPS) {
        setCurrentStep(nextStep);
        setCurrentRequest(trainingRequests[nextStep]);
        setBidAmount('');
        setBidDescription('');
        setPricingBreakdown('');
        setPricingReasoning('');
      } else {
        setShowCompletion(true);
      }
    } catch (error) {
      console.error('Error submitting training response:', error);
      alert('Error saving your response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRequestData = (requestData) => {
    const data = typeof requestData === 'string' ? JSON.parse(requestData) : requestData;
    
    return (
      <div className="request-display">
        <div className="request-header">
          <h3>{data.event_type ? data.event_type.charAt(0).toUpperCase() + data.event_type.slice(1) : 'Event'} Request</h3>
          <span className="request-date">{data.date}</span>
        </div>
        
        <div className="request-details">
          <div className="detail-row">
            <span className="detail-label">Date:</span>
            <span className="detail-value">{data.date}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Duration:</span>
            <span className="detail-value">{data.duration}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Location:</span>
            <span className="detail-value">{data.location}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Event Type:</span>
            <span className="detail-value">{data.event_type}</span>
          </div>
          {data.guest_count && (
            <div className="detail-row">
              <span className="detail-label">Guest Count:</span>
              <span className="detail-value">{data.guest_count}</span>
            </div>
          )}
        </div>

        {data.requirements && data.requirements.length > 0 && (
          <div className="requirements-section">
            <h4>Requirements:</h4>
            <ul className="requirements-list">
              {data.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="autobid-trainer-container">
        <div className="loading-container">
          <LoadingSpinner color="#9633eb" size={50} />
          <p>Loading training scenarios...</p>
        </div>
      </div>
    );
  }

  if (showCompletion) {
    return (
      <div className="autobid-trainer-container">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="completion-screen"
          >
            <div className="completion-content">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
                className="completion-icon"
              >
                <FaGraduationCap />
              </motion.div>
              
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="completion-title"
              >
                AI Training Complete!
              </motion.h1>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="completion-description"
              >
                Thank you for training our AI! Your pricing insights will help us generate more accurate and personalized bids for your business.
              </motion.p>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="completion-stats"
              >
                <div className="stat-item">
                  <span className="stat-number">{TOTAL_STEPS}</span>
                  <span className="stat-label">Scenarios Completed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">✓</span>
                  <span className="stat-label">AI Trained</span>
                </div>
              </motion.div>
              
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                className="btn-primary"
                onClick={() => navigate('/business-settings')}
              >
                Return to Settings
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="autobid-trainer-container">
      <div className="trainer-header">
        <button 
          className="back-button"
          onClick={() => navigate('/business-settings')}
        >
          ← Back to Settings
        </button>
        
        <div className="header-content">
          <div className="header-title">
            <FaRobot className="header-icon" />
            <h1>AI Bid Trainer</h1>
          </div>
          <p className="header-description">
            Help train our AI by providing pricing for these sample requests. This will help us generate more accurate bids for your business.
          </p>
        </div>

        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(completedSteps / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <span className="progress-text">
            Step {currentStep + 1} of {TOTAL_STEPS}
          </span>
        </div>
      </div>

      <div className="trainer-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="training-step"
          >
            <div className="request-section">
              <div className="section-header">
                <FaLightbulb className="section-icon" />
                <h2>Sample Request #{currentStep + 1}</h2>
              </div>
              
              {currentRequest && formatRequestData(currentRequest.request_data)}
            </div>

            <div className="response-section">
              <div className="section-header">
                <FaCheckCircle className="section-icon" />
                <h2>Your Pricing Response</h2>
              </div>

              <div className="response-form">
                <div className="form-group">
                  <label htmlFor="bidAmount">Your Bid Amount ($)</label>
                  <input
                    type="number"
                    id="bidAmount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Enter your bid amount"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bidDescription">Bid Description *</label>
                  <textarea
                    id="bidDescription"
                    value={bidDescription}
                    onChange={(e) => setBidDescription(e.target.value)}
                    placeholder="Describe your services and what's included in your bid..."
                    rows="4"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pricingBreakdown">Pricing Breakdown (Optional)</label>
                  <textarea
                    id="pricingBreakdown"
                    value={pricingBreakdown}
                    onChange={(e) => setPricingBreakdown(e.target.value)}
                    placeholder="Break down your pricing (e.g., 8 hours coverage: $400, Engagement shoot: $200, Online gallery: $100)"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pricingReasoning">Why This Pricing? (Optional)</label>
                  <textarea
                    id="pricingReasoning"
                    value={pricingReasoning}
                    onChange={(e) => setPricingReasoning(e.target.value)}
                    placeholder="Explain your pricing strategy (e.g., market rates, experience level, equipment costs, etc.)"
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="btn-primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !bidAmount || !bidDescription}
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner color="white" size={16} />
                        Saving...
                      </>
                    ) : (
                      currentStep === TOTAL_STEPS - 1 ? 'Complete Training' : 'Next Scenario'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AutobidTrainer; 