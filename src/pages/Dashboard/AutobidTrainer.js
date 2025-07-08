import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaLightbulb, FaRobot, FaGraduationCap, FaThumbsUp, FaThumbsDown, FaComments } from 'react-icons/fa';
import '../../styles/AutobidTrainer.css';

/**
 * AutobidTrainer Component
 * 
 * BUG FIX (June 25, 2025): Fixed critical issues with AI bid generation and feedback submission:
 * 1. Removed problematic useEffect that was automatically calling getSampleBidData when currentCategory/user changed
 *    - This was causing multiple API calls and UI updates with different bids
 *    - Users would see one bid initially, then it would swap to another bid when the second API call completed
 * 2. Fixed data structure mismatch where component expected currentBid.request but API returned currentBid.requestData
 * 3. Added comprehensive error handling to prevent blank screens when AI bid generation fails
 * 4. Added safety checks to ensure valid sample bid data before showing AI testing screens
 * 5. Improved duplicate submission prevention with better state management
 * 
 * The root cause was the automatic useEffect triggering multiple API calls, causing race conditions
 * and duplicate feedback submissions. Now getSampleBidData is only called explicitly when needed.
 */

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
  const [businessCategories, setBusinessCategories] = useState([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentCategory, setCurrentCategory] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);
  const [showSampleBid, setShowSampleBid] = useState(false);
  const [showTransitionStep, setShowTransitionStep] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [sampleBidApproved, setSampleBidApproved] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [consecutiveApprovals, setConsecutiveApprovals] = useState(0);
  const [currentSampleBidIndex, setCurrentSampleBidIndex] = useState(0);
  const [trainingProgress, setTrainingProgress] = useState({});
  const [currentSampleBidData, setCurrentSampleBidData] = useState([]);
  const [categoryProgress, setCategoryProgress] = useState({});
  const [isLoadingSampleBid, setIsLoadingSampleBid] = useState(false);
  const [usedAIRequestIds, setUsedAIRequestIds] = useState(new Set());
  const [availableAIRequests, setAvailableAIRequests] = useState([]);
  const [isGeneratingBid, setIsGeneratingBid] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const navigate = useNavigate();

  const TOTAL_STEPS = 5;

  // Helper function to generate category-specific request data
  const generateCategorySpecificRequest = (category) => {
    const baseRequest = {
      date: "2024-08-15",
      event_type: "wedding",
      guest_count: 120
    };

    const categoryRequests = {
      photography: {
        ...baseRequest,
        duration: "8 hours",
        location: "Salt Lake City, UT",
      requirements: [
        "Full day coverage",
        "Engagement shoot",
        "Online gallery",
        "Print release",
        "Drone footage"
      ]
    },
      videography: {
        ...baseRequest,
        duration: "6 hours",
        location: "Park City, UT",
        requirements: [
          "Ceremony coverage",
          "Reception highlights",
          "Highlight reel",
          "Feature film",
          "Digital files"
        ]
      },
      florist: {
        ...baseRequest,
        duration: "Setup only",
        location: "Salt Lake City, UT",
        requirements: [
          "Bridal bouquet",
          "8 boutonnieres",
          "12 centerpieces",
          "Delivery and setup"
        ]
      },
      beauty: {
        ...baseRequest,
        duration: "4 hours",
        location: "Orem, UT",
        guest_count: 6,
        requirements: [
          "Bridal hair and makeup",
          "5 bridesmaids hair and makeup",
          "On-site service",
          "Trial session included"
        ]
      },
      dj: {
        ...baseRequest,
        duration: "5 hours",
        location: "Salt Lake City, UT",
        requirements: [
          "Ceremony music",
          "Reception DJ",
          "Professional sound system",
          "Playlist consultation",
          "MC services"
        ]
      },
      "wedding planning": {
        ...baseRequest,
        duration: "Full planning",
        location: "Park City, UT",
        requirements: [
          "Full wedding planning",
          "Vendor coordination",
          "Timeline management",
          "Budget management",
          "Day-of coordination"
        ]
      },
      catering: {
        ...baseRequest,
        duration: "Dinner service",
        location: "Salt Lake City, UT",
        requirements: [
          "Plated dinner service",
          "Appetizers",
          "Main course",
          "Dessert",
          "Staffing",
          "Setup and cleanup"
        ]
      },
      cake: {
        ...baseRequest,
        duration: "Delivery only",
        location: "Salt Lake City, UT",
        requirements: [
          "3-tier wedding cake",
          "Custom design",
          "Delivery and setup",
          "Cake cutting service"
        ]
      }
    };

    return categoryRequests[category] || categoryRequests.photography;
  };

  // Dynamic sample bid data based on business category - now using real API
  const getSampleBidData = async (category) => {
    // Prevent duplicate calls
    if (isGeneratingBid) {
      console.log('Already generating bid, skipping duplicate call');
      return null;
    }

    try {
      setIsGeneratingBid(true);
      console.log('Fetching sample bid data from API for category:', category);
      console.log('Current user ID:', user?.id);
      
      // Get a request that hasn't been used for AI testing yet
      let selectedRequest = null;
      
      // Fetch all requests for this category
      const { data: allRequests, error } = await supabase
        .from('autobid_training_requests')
        .select('*')
        .eq('is_active', true)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (!allRequests || allRequests.length === 0) {
        throw new Error('No training requests found for category: ' + category);
      }

      // Get the current used request IDs from state
      const currentUsedIds = Array.from(usedAIRequestIds);
      console.log('Current used request IDs:', currentUsedIds);
      console.log('All available requests:', allRequests.map(req => ({ id: req.id, date: req.request_data?.date || 'unknown' })));
      
      // Find the first request that hasn't been used yet
      const availableRequest = allRequests.find(req => !currentUsedIds.includes(req.id));
      
      if (availableRequest) {
        // Use an available request
        selectedRequest = availableRequest;
        console.log('Using available request:', selectedRequest.id, 'with date:', selectedRequest.request_data?.date || 'unknown');
        
        // Update state to mark this request as used
        setUsedAIRequestIds(prev => new Set([...prev, selectedRequest.id]));
      } else {
        // All requests have been used, reset and start over
        console.log('All requests used, resetting for recycling');
        selectedRequest = allRequests[0];
        setUsedAIRequestIds(new Set([selectedRequest.id]));
        console.log('Recycling to request:', selectedRequest.id);
      }

      // Call the real API to generate AI sample bid
      const apiUrl = 'https://bidi-express.vercel.app/api/autobid/generate-sample-bid';
      const requestBody = {
        business_id: user.id,
        category: category,
        sample_request: selectedRequest.request_data
      };
      
      console.log('Calling API:', apiUrl);
      console.log('Request body:', requestBody);
      console.log('User ID:', user.id);
      console.log('Category:', category);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API response:', data);

      if (data.success && data.sample_bid) {
        const sampleBidData = [{
          requestId: selectedRequest.id,
          requestData: selectedRequest.request_data,
    generatedBid: {
            amount: data.sample_bid.amount,
            description: data.sample_bid.description,
            breakdown: data.sample_bid.breakdown,
            reasoning: data.sample_bid.reasoning
          }
        }];
        
        console.log('Generated sample bid data:', sampleBidData);
        return sampleBidData;
      } else {
        throw new Error('Failed to generate sample bid: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating sample bid data:', error);
      throw error;
    } finally {
      setIsGeneratingBid(false);
    }
  };

  // Helper function to safely capitalize category names
  const capitalizeCategory = (category) => {
    if (!category || typeof category !== 'string') {
      return 'Category';
    }
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

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

        // Get business categories
        const { data: businessProfile } = await supabase
          .from('business_profiles')
          .select('business_category')
          .eq('id', currentUser.id)
          .single();

        let userCategories = [];
        
        if (businessProfile?.business_category) {
          if (Array.isArray(businessProfile.business_category)) {
            userCategories = businessProfile.business_category.filter(cat => cat !== 'other');
          } else {
            userCategories = [businessProfile.business_category];
          }
        }

        if (userCategories.length === 0) {
          console.log('No categories found, using photography as default');
          userCategories = ['photography'];
        }

        setBusinessCategories(userCategories);
        setCurrentCategory(userCategories[0]);
        console.log('User categories:', userCategories);
        console.log('Current category set to:', userCategories[0]);

        // Fetch category-specific training progress
        const { data: progressData, error: progressError } = await supabase
          .from('autobid_training_progress')
          .select('*')
          .eq('business_id', currentUser.id);

        if (progressError && progressError.code !== 'PGRST116') {
          throw progressError;
        }

        // Organize progress by category
        const progressByCategory = {};
        if (progressData) {
          progressData.forEach(progress => {
            progressByCategory[progress.category] = progress;
          });
        }

        // Create progress records for missing categories
        for (const category of userCategories) {
          if (!progressByCategory[category]) {
            const { data: newProgress, error: createError } = await supabase
              .from('autobid_training_progress')
              .insert({
                business_id: currentUser.id,
                category: category,
                total_scenarios_completed: 0,
                scenarios_approved: 0,
                consecutive_approvals: 0,
                training_completed: false
              })
              .select()
              .single();

            if (createError) throw createError;
            progressByCategory[category] = newProgress;
          }
        }

        setTrainingProgress(progressByCategory);
        setCategoryProgress(progressByCategory);

        // Check if user needs to resume training
        const currentCategoryProgress = progressByCategory[userCategories[0]];
        console.log('Current category progress:', currentCategoryProgress);

        if (currentCategoryProgress) {
          const completedSteps = currentCategoryProgress.total_scenarios_completed || 0;
          const consecutiveApprovals = currentCategoryProgress.consecutive_approvals || 0;
          const trainingCompleted = currentCategoryProgress.training_completed || false;

          console.log(`Resume check - Completed: ${completedSteps}/${TOTAL_STEPS}, Consecutive: ${consecutiveApprovals}/2, Training completed: ${trainingCompleted}`);

          // Load requests for current category
          await loadCategoryRequests(userCategories[0]);

          // Resume logic
          if (completedSteps >= TOTAL_STEPS) {
            // Completed all scenarios - should be in AI sample bid phase
            console.log('Resuming in AI sample bid phase - all scenarios completed');
            setCompletedSteps(completedSteps);
            setConsecutiveApprovals(consecutiveApprovals);
            
            // Check if we have any AI training responses for this category
            const { data: aiResponses, error: aiError } = await supabase
              .from('autobid_training_responses')
              .select('*')
              .eq('business_id', currentUser.id)
              .eq('category', userCategories[0])
              .eq('is_ai_generated', true)
          .order('created_at', { ascending: false });

            if (aiError && aiError.code !== 'PGRST116') {
              console.error('Error checking AI responses:', aiError);
            }

            if (aiResponses && aiResponses.length > 0) {
              // We have AI responses, go directly to AI testing
              setShowSampleBid(true);
              
              // Initialize available requests for AI testing (excluding already used ones)
              try {
                const { data: allRequests, error } = await supabase
          .from('autobid_training_requests')
          .select('*')
          .eq('is_active', true)
                  .eq('category', userCategories[0])
          .order('created_at', { ascending: false });

        if (error) throw error;

                // Get the IDs of requests that have already been used for AI testing
                const usedRequestIds = new Set(aiResponses.map(response => response.request_id));
                
                // Filter out already used requests
                const availableRequests = allRequests?.filter(req => !usedRequestIds.has(req.id)) || [];
                
                setAvailableAIRequests(availableRequests);
                setUsedAIRequestIds(usedRequestIds);
                console.log('Resumed AI testing with', availableRequests.length, 'available requests (', usedRequestIds.size, 'already used)');
              } catch (error) {
                console.error('Error initializing resumed AI requests:', error);
              }
              
              // Load sample bid data
              setIsLoadingSampleBid(true);
              try {
                const sampleData = await getSampleBidData(userCategories[0]);
                if (sampleData && sampleData.length > 0) {
                  setCurrentSampleBidData(sampleData);
                  console.log('Resumed sample bid data loaded:', sampleData.length, 'samples');
          } else {
                  // No sample data generated, show error
                  console.error('No sample bid data generated when resuming');
                  setShowSampleBid(false);
                  alert('Unable to resume AI testing. Please try again or contact support.');
                }
              } catch (error) {
                console.error('Error loading resumed sample bid data:', error);
                setShowSampleBid(false);
                alert('Error resuming AI testing. Please try again or contact support.');
              } finally {
                setIsLoadingSampleBid(false);
          }
        } else {
              // No AI responses yet, show transition step
              setShowTransitionStep(true);
            }
          } else if (trainingCompleted) {
            // Training is complete for this category, check if all categories are done
            const allCategoriesComplete = userCategories.every(cat => 
              progressByCategory[cat]?.training_completed
            );

            if (allCategoriesComplete) {
              // All categories complete - show final completion
            setShowCompletion(true);
            setIsLoading(false);
            return;
        } else {
              // Move to next incomplete category
              const nextIncompleteCategory = userCategories.find(cat => 
                !progressByCategory[cat]?.training_completed
              );
              if (nextIncompleteCategory) {
                setCurrentCategory(nextIncompleteCategory);
                await loadCategoryRequests(nextIncompleteCategory);
              }
            }
          } else if (completedSteps > 0) {
            // Resume in middle of training scenarios
            console.log(`Resuming at step ${completedSteps + 1} of ${TOTAL_STEPS}`);
            setCompletedSteps(completedSteps);
            setCurrentStep(completedSteps);
            
            // Set the current request to the next one
            if (trainingRequests.length > completedSteps) {
              setCurrentRequest(trainingRequests[completedSteps]);
            }
          }
        } else {
          // No progress found, start fresh
          await loadCategoryRequests(userCategories[0]);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching training data:', error);
        setIsLoading(false);
      }
    };

    fetchUserAndRequests();
  }, [navigate]);

  const loadCategoryRequests = async (category) => {
    try {
      console.log('Loading requests for category:', category);
      
      if (!category) {
        console.error('No category provided to loadCategoryRequests');
        return;
      }

      // Fetch training requests for specific category
      const { data: requests, error } = await supabase
        .from('autobid_training_requests')
        .select('*')
        .eq('is_active', true)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log(`Found ${requests.length} requests for category: ${category}`);

      // If we don't have enough category-specific requests, use general requests
      if (requests.length < TOTAL_STEPS) {
        const { data: generalRequests, error: generalError } = await supabase
          .from('autobid_training_requests')
          .select('*')
          .eq('is_active', true)
          .neq('category', category)
          .order('created_at', { ascending: false });

        if (generalError) throw generalError;

        const combinedRequests = [
          ...requests,
          ...generalRequests.slice(0, TOTAL_STEPS - requests.length)
        ];

        setTrainingRequests(combinedRequests);
        setCurrentRequest(combinedRequests[0]);
      } else {
        setTrainingRequests(requests.slice(0, TOTAL_STEPS));
        setCurrentRequest(requests[0]);
      }

      // Reset training state for new category
      setCurrentStep(0);
      setCompletedSteps(0);
      setConsecutiveApprovals(categoryProgress[category]?.consecutive_approvals || 0);
      setShowSampleBid(false);
      setShowCompletion(false);
      setSampleBidApproved(null);
      setFeedbackText('');
      setCurrentSampleBidIndex(0);
      setBidAmount('');
      setBidDescription('');
      setPricingBreakdown('');
      setPricingReasoning('');

      console.log('Successfully loaded category requests for:', category);

    } catch (error) {
      console.error('Error loading category requests:', error);
      // Show error state or fallback
      alert('Error loading training requests. Please try refreshing the page.');
    }
  };

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
          is_training: true,
          is_ai_generated: false,
          category: currentCategory
        });

      if (error) throw error;

      // Update training progress for current category
      const newCompletedSteps = completedSteps + 1;
      setCompletedSteps(newCompletedSteps);

      const currentProgress = categoryProgress[currentCategory];
      const { error: progressError } = await supabase
        .from('autobid_training_progress')
        .update({
          total_scenarios_completed: newCompletedSteps,
          last_training_date: new Date().toISOString()
        })
        .eq('business_id', user.id)
        .eq('category', currentCategory);

      if (progressError) throw progressError;

      if (newCompletedSteps < TOTAL_STEPS) {
        setCurrentStep(newCompletedSteps);
        setCurrentRequest(trainingRequests[newCompletedSteps]);
        setBidAmount('');
        setBidDescription('');
        setPricingBreakdown('');
        setPricingReasoning('');
      } else {
        // Show transition step instead of going directly to AI testing
        setShowTransitionStep(true);
      }
    } catch (error) {
      console.error('Error submitting training response:', error);
      alert('Error saving your response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSampleBidResponse = async (approved) => {
    // Prevent duplicate submissions
    if (isSubmittingFeedback) {
      console.log('Already submitting feedback, skipping duplicate call');
      return;
    }

    setSampleBidApproved(approved);
    
    try {
      setIsSubmittingFeedback(true);
      
      // Save AI-generated bid to training responses
      const currentBid = currentSampleBidData[currentSampleBidIndex];
      const { data: aiResponse, error: aiError } = await supabase
        .from('autobid_training_responses')
        .insert({
          business_id: user.id,
          request_id: currentBid.requestId || currentRequest?.id || 'sample-request',
          bid_amount: currentBid.generatedBid.amount,
          bid_description: currentBid.generatedBid.description,
          pricing_breakdown: currentBid.generatedBid.breakdown,
          pricing_reasoning: currentBid.generatedBid.reasoning,
          is_training: true,
          is_ai_generated: true,
          category: currentCategory
        });

      if (aiError) throw aiError;

      // Call the real training feedback API
      try {
        const feedbackResponse = await fetch('https://bidi-express.vercel.app/api/autobid/training-feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            business_id: user.id,
            category: currentCategory,
            sample_bid_id: aiResponse[0].id,
            approved: approved,
            feedback: approved ? 'Approved' : 'Rejected',
            suggested_changes: null
          }),
        });

        if (!feedbackResponse.ok) {
          console.error('Feedback API error:', feedbackResponse.status);
        } else {
          const feedbackData = await feedbackResponse.json();
          console.log('Feedback submitted successfully:', feedbackData);
        }
      } catch (feedbackError) {
        console.error('Error submitting feedback:', feedbackError);
      }

      // Update consecutive approvals
      const newConsecutiveApprovals = approved ? consecutiveApprovals + 1 : 0;
      setConsecutiveApprovals(newConsecutiveApprovals);

      // Check if current category training is complete (2 consecutive approvals)
      if (newConsecutiveApprovals >= 2) {
        // Check if all categories are complete
        const allCategoriesComplete = businessCategories.every(cat => 
          categoryProgress[cat]?.training_completed
        );

        if (allCategoriesComplete) {
          // All categories complete - show final completion
    setShowSampleBid(false);
    setShowCompletion(true);
        } else {
          // Show category completion animation before moving to next category
          setShowSampleBid(false);
          setShowCompletion(true);
          
          // The completion screen will handle the transition to next category
        }
      } else {
        // Continue with next AI sample bid
        const nextIndex = currentSampleBidIndex + 1;
        if (nextIndex < currentSampleBidData.length) {
          setCurrentSampleBidIndex(nextIndex);
        } else {
          // Generate new AI sample bid data
          setIsLoadingSampleBid(true);
          try {
            const newSampleData = await getSampleBidData(currentCategory);
            if (newSampleData && newSampleData.length > 0) {
              setCurrentSampleBidData(newSampleData);
              setCurrentSampleBidIndex(0);
              console.log('Generated new AI sample bid data:', newSampleData.length, 'samples');
            } else {
              // No new sample data generated, show error
              console.error('No new sample bid data generated');
              setShowSampleBid(false);
              // Show error or fallback screen
              alert('Unable to generate more AI sample bids. Please try again or contact support.');
            }
          } catch (error) {
            console.error('Error generating new sample bid data:', error);
            setShowSampleBid(false);
            // Show error or fallback screen
            alert('Error generating AI sample bid. Please try again or contact support.');
          } finally {
            setIsLoadingSampleBid(false);
          }
        }
      }
    } catch (error) {
      console.error('Error handling sample bid response:', error);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleStartAITesting = async () => {
    // Prevent duplicate calls
    if (isGeneratingBid || isLoadingSampleBid) {
      console.log('Already starting AI testing, skipping duplicate call');
      return;
    }

    setShowTransitionStep(false);
    setShowSampleBid(true);
    
    // Initialize available requests for AI testing
    try {
      const { data: allRequests, error } = await supabase
        .from('autobid_training_requests')
        .select('*')
        .eq('is_active', true)
        .eq('category', currentCategory)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAvailableAIRequests(allRequests || []);
      setUsedAIRequestIds(new Set());
      console.log('Initialized AI testing with', allRequests?.length, 'available requests');
    } catch (error) {
      console.error('Error initializing AI requests:', error);
    }
    
    // Generate fresh AI sample bid data
    setIsLoadingSampleBid(true);
    try {
      const sampleData = await getSampleBidData(currentCategory);
      if (sampleData && sampleData.length > 0) {
        setCurrentSampleBidData(sampleData);
        setCurrentSampleBidIndex(0);
        console.log('Fresh AI sample bid data generated:', sampleData.length, 'samples');
      } else {
        // No sample data generated, don't show AI testing screen
        console.error('No sample bid data generated for AI testing');
        setShowSampleBid(false);
        alert('Unable to generate AI sample bid. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Error generating fresh AI sample bid data:', error);
      setShowSampleBid(false);
      alert('Error generating AI sample bid. Please try again or contact support.');
    } finally {
      setIsLoadingSampleBid(false);
    }
  };

  const handleContinueToNextCategory = async () => {
    const nextCategoryIndex = currentCategoryIndex + 1;
    if (nextCategoryIndex < businessCategories.length) {
      const nextCategory = businessCategories[nextCategoryIndex];
      console.log('Moving to next category:', nextCategory, 'at index:', nextCategoryIndex);
      
      if (nextCategory) {
        setCurrentCategoryIndex(nextCategoryIndex);
        setCurrentCategory(nextCategory);
        setShowCompletion(false);
        setShowTransitionStep(true);
        await loadCategoryRequests(nextCategory);
      } else {
        console.error('Next category is undefined at index:', nextCategoryIndex);
        setShowCompletion(false);
        setShowSampleBid(true);
      }
    } else {
      // All categories complete
      console.log('All categories completed');
      setShowCompletion(false);
      setShowSampleBid(true);
    }
  };

  const formatRequestData = (requestData) => {
    const data = typeof requestData === 'string' ? JSON.parse(requestData) : requestData;
    
    return (
      <div className="request-display">
        <div className="request-header">
          <h3>{data.event_type ? data.event_type.charAt(0).toUpperCase() + data.event_type.slice(1) : 'Event'} Request</h3>
          <span className="request-date">{data.start_date || data.date}</span>
        </div>
        
        <div className="request-details">
          <div className="detail-row">
            <span className="detail-label">Date:</span>
            <span className="detail-value">{data.start_date || data.date}</span>
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
          {(data.num_people || data.guest_count) && (
            <div className="detail-row">
              <span className="detail-label">Guest Count:</span>
              <span className="detail-value">{data.num_people || data.guest_count}</span>
            </div>
          )}
          {data.price_range && (
            <div className="detail-row">
              <span className="detail-label">Budget Range:</span>
              <span className="detail-value">{data.price_range}</span>
            </div>
          )}
        </div>

        {data.additional_comments && (
          <div className="requirements-section">
            <h4>Additional Comments:</h4>
            <p className="additional-comments">{data.additional_comments}</p>
          </div>
        )}

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
    // Check if this is final completion or category completion
    const allCategoriesComplete = businessCategories.every(cat => 
      categoryProgress[cat]?.training_completed
    );

    if (allCategoriesComplete) {
      // Final completion - all categories trained
    return (
      <div className="autobid-trainer-container">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                  Congratulations! You've completed AI training for all your business categories. Your pricing insights will help us generate more accurate and personalized bids for your business.
                </motion.p>
                
            <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="completion-stats"
                >
                  <div className="stat-item">
                    <span className="stat-number">{businessCategories.length}</span>
                    <span className="stat-label">Categories Trained</span>
                </div>
                  <div className="stat-item">
                    <span className="stat-number">{TOTAL_STEPS * businessCategories.length}</span>
                    <span className="stat-label">Total Scenarios</span>
              </div>
                  <div className="stat-item">
                    <span className="stat-number">✓</span>
                    <span className="stat-label">AI Ready</span>
                </div>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.0, duration: 0.6 }}
                  className="category-summary"
                >
                  <h3>Trained Categories:</h3>
                  <div className="category-list">
                    {businessCategories.map((category, index) => (
                      <div key={category} className="category-item">
                        <span className="category-name">{capitalizeCategory(category)}</span>
                        <span className="category-status">✓ Complete</span>
                  </div>
                    ))}
                  </div>
                </motion.div>
                
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.1, duration: 0.6 }}
                  className="btn-primary"
                  onClick={() => navigate('/business-dashboard')}
                >
                  Return to Dashboard
                </motion.button>
                  </div>
            </motion.div>
          </AnimatePresence>
                  </div>
    );
    } else {
      // Category completion - show next category prompt
      const nextCategoryIndex = currentCategoryIndex + 1;
      const nextCategory = businessCategories[nextCategoryIndex];
      
      // Safety check - if no next category, show final completion
      if (!nextCategory) {
        return (
          <div className="autobid-trainer-container">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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
                    Congratulations! You've completed AI training for all your business categories. Your pricing insights will help us generate more accurate and personalized bids for your business.
                  </motion.p>
                  
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.6 }}
                    className="btn-primary"
                    onClick={() => navigate('/business-dashboard')}
                  >
                    Return to Dashboard
                  </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
      </div>
    );
  }

    return (
      <div className="autobid-trainer-container">
        <AnimatePresence>
          <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                  <FaCheckCircle />
              </motion.div>
              
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="completion-title"
              >
                  {currentCategory && capitalizeCategory(currentCategory)} Training Complete!
              </motion.h1>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="completion-description"
              >
                  Great job! You've completed AI training for {capitalizeCategory(currentCategory)}. Now let's train the AI for your {nextCategory} services.
              </motion.p>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="completion-stats"
              >
                  <div className="stat-item">
                    <span className="stat-number">{currentCategoryIndex + 1}</span>
                    <span className="stat-label">of {businessCategories.length} Categories</span>
                  </div>
                <div className="stat-item">
                  <span className="stat-number">{TOTAL_STEPS}</span>
                  <span className="stat-label">Scenarios Completed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">✓</span>
                    <span className="stat-label">{capitalizeCategory(currentCategory)} Trained</span>
                </div>
              </motion.div>
              
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                className="btn-primary"
                  onClick={handleContinueToNextCategory}
              >
                  Continue to {nextCategory && capitalizeCategory(nextCategory)} Training
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
    }
  }

  if (showTransitionStep) {
  return (
    <div className="autobid-trainer-container">
      <div className="trainer-header">
        <button 
          className="back-button"
            onClick={() => navigate('/business-dashboard')}
          >
            ← Back to Dashboard
          </button>
          
          <div className="header-content">
            <div className="header-title">
              <FaCheckCircle className="header-icon" />
              <h1>Manual Training Complete - {capitalizeCategory(currentCategory)}</h1>
            </div>
            <p className="header-description">
              Great job! You've completed the manual training scenarios. Now let's test our AI with your pricing data.
            </p>
          </div>

          <div className="progress-section">
            <div className="category-progress">
              <span className="category-label">
                Training {currentCategoryIndex + 1} of {businessCategories.length}: {capitalizeCategory(currentCategory)}
              </span>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: '100%' }}
                />
              </div>
              <span className="progress-text">
                Manual training complete ✓
              </span>
            </div>
          </div>
        </div>

        <div className="trainer-content">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="transition-step"
            >
              <div className="transition-content">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
                  className="transition-icon"
                >
                  <FaRobot />
                </motion.div>
                
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="transition-title"
                >
                  Ready to Test AI Generated Bids!
                </motion.h2>
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="transition-description"
                >
                  Based on your {TOTAL_STEPS} training scenarios, our AI will now generate sample bids for you to review. 
                  This helps us fine-tune the AI to match your pricing strategy perfectly.
                </motion.p>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="transition-stats"
                >
                  <div className="stat-item">
                    <span className="stat-number">{TOTAL_STEPS}</span>
                    <span className="stat-label">Scenarios Trained</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">AI</span>
                    <span className="stat-label">Ready to Test</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">2</span>
                    <span className="stat-label">Approvals Needed</span>
                  </div>
                </motion.div>
                
                <button
                  className="start-ai-testing-btn"
                  onClick={handleStartAITesting}
                  disabled={isGeneratingBid || isLoadingSampleBid}
                >
                  {isGeneratingBid || isLoadingSampleBid ? (
                    <>
                      <LoadingSpinner color="white" size={16} />
                      Starting AI Testing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-robot"></i>
                      Start AI Testing
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (showSampleBid) {
    const currentBid = currentSampleBidData[currentSampleBidIndex];
    
    // Add debugging and safety checks
    console.log('Sample bid data:', currentSampleBidData);
    console.log('Current sample bid index:', currentSampleBidIndex);
    console.log('Current bid:', currentBid);
    console.log('Loading sample bid:', isLoadingSampleBid);
    
    // Show loading state while fetching sample bid data
    if (isLoadingSampleBid) {
      return (
        <div className="autobid-trainer-container">
          <div className="trainer-header">
            <button 
              className="back-button"
              onClick={() => navigate('/business-dashboard')}
            >
              ← Back to Dashboard
        </button>
        
        <div className="header-content">
          <div className="header-title">
            <FaRobot className="header-icon" />
                <h1>AI Sample Bid Test - {capitalizeCategory(currentCategory)}</h1>
          </div>
          <p className="header-description">
                Generating personalized AI bid based on your training data...
              </p>
            </div>
          </div>
          <div className="loading-container">
            <LoadingSpinner color="#9633eb" size={50} />
            <p>Generating AI sample bid...</p>
          </div>
        </div>
      );
    }
    
    // If no current bid, show error or fallback
    if (!currentBid || !currentBid.generatedBid) {
      return (
        <div className="autobid-trainer-container">
          <div className="trainer-header">
            <button 
              className="back-button"
              onClick={() => navigate('/business-dashboard')}
            >
              ← Back to Dashboard
            </button>
            
            <div className="header-content">
              <div className="header-title">
                <FaRobot className="header-icon" />
                <h1>AI Sample Bid Test - {capitalizeCategory(currentCategory)}</h1>
              </div>
              <p className="header-description">
                Unable to generate sample bid. Please try again.
              </p>
            </div>
          </div>
          <div className="error-container">
            <p>Error: Could not generate sample bid for {capitalizeCategory(currentCategory)}</p>
            <button 
              className="btn-primary"
              onClick={handleStartAITesting}
              disabled={isGeneratingBid || isLoadingSampleBid}
            >
              {isGeneratingBid || isLoadingSampleBid ? (
                <>
                  <LoadingSpinner color="white" size={16} />
                  Generating...
                </>
              ) : (
                'Retry Generation'
              )}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="autobid-trainer-container">
        <div className="trainer-header">
          <button 
            className="back-button"
            onClick={() => navigate('/business-dashboard')}
          >
            ← Back to Dashboard
          </button>
          
          <div className="header-content">
            <div className="header-title">
              <FaRobot className="header-icon" />
              <h1>AI Sample Bid Test - {capitalizeCategory(currentCategory)}</h1>
            </div>
            <p className="header-description">
              Based on your {capitalizeCategory(currentCategory)} training, here's a sample bid our AI generated. Let us know if this looks accurate!
          </p>
        </div>

        <div className="progress-section">
            <div className="category-progress">
              <span className="category-label">
                Training {currentCategoryIndex + 1} of {businessCategories.length}: {capitalizeCategory(currentCategory)}
              </span>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(consecutiveApprovals / 2) * 100}%` }}
                />
              </div>
              <span className="progress-text">
                {consecutiveApprovals} of 2 consecutive approvals needed
                {consecutiveApprovals < 2 && (
                  <span className="training-note"> (Training continues until 2 in a row)</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="trainer-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={`sample-${currentSampleBidIndex}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="sample-bid-step"
            >
              <div className="request-section">
                <div className="section-header">
                  <FaLightbulb className="section-icon" />
                  <h2>Sample {capitalizeCategory(currentCategory)} Request</h2>
                </div>
                
                {currentBid && formatRequestData(currentBid.requestData)}
              </div>

              <div className="ai-bid-section">
                <div className="section-header">
                  <FaRobot className="section-icon" />
                  <h2>AI-Generated Bid</h2>
                </div>

                <div className="ai-bid-display">
                  <div className="bid-amount">
                    <span className="amount-label">Bid Amount:</span>
                    <span className="amount-value">${currentBid.generatedBid.amount.toLocaleString()}</span>
                  </div>

                  <div className="bid-description">
                    <h4>Description:</h4>
                    <p>{currentBid.generatedBid.description}</p>
                  </div>

                  {currentBid.generatedBid.breakdown && (
                    <div className="bid-breakdown">
                      <h4>Pricing Breakdown:</h4>
                      <pre>{currentBid.generatedBid.breakdown}</pre>
                    </div>
                  )}

                  {currentBid.generatedBid.reasoning && (
                    <div className="bid-reasoning">
                      <h4>Pricing Reasoning:</h4>
                      <p>{currentBid.generatedBid.reasoning}</p>
                    </div>
                  )}
                </div>

                <div className="feedback-section">
                  <div className="section-header">
                    <FaComments className="section-icon" />
                    <h2>Your Feedback</h2>
                  </div>

                  <div className="feedback-form">
                    <div className="feedback-textarea">
                      <label htmlFor="feedbackText">Additional Feedback (Optional)</label>
                      <textarea
                        id="feedbackText"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Tell us what you think about this bid. What would you change? What's good about it?"
                        rows="4"
                      />
                    </div>

                    <div className="feedback-buttons">
                      <button
                        className={`feedback-btn approve-btn ${sampleBidApproved === true ? 'selected' : ''}`}
                        onClick={() => handleSampleBidResponse(true)}
                        disabled={isSubmittingFeedback}
                      >
                        {isSubmittingFeedback ? (
                          <>
                            <LoadingSpinner color="white" size={16} />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check"></i>
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        className={`feedback-btn reject-btn ${sampleBidApproved === false ? 'selected' : ''}`}
                        onClick={() => handleSampleBidResponse(false)}
                        disabled={isSubmittingFeedback}
                      >
                        {isSubmittingFeedback ? (
                          <>
                            <LoadingSpinner color="white" size={16} />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-times"></i>
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="autobid-trainer-container">
      <div className="trainer-header">
        <button 
          className="back-button"
          onClick={() => navigate('/business-dashboard')}
        >
          ← Back to Dashboard
        </button>
        
        <div className="header-content">
          <div className="header-title">
            <FaRobot className="header-icon" />
            <h1>AI Bid Trainer - {capitalizeCategory(currentCategory)}</h1>
          </div>
          <p className="header-description">
            Help train our AI by providing pricing for these {capitalizeCategory(currentCategory)} sample requests. This will help us generate more accurate bids for your {capitalizeCategory(currentCategory)} services.
          </p>
        </div>

        <div className="progress-section">
          <div className="category-progress">
            <span className="category-label">
              Training {currentCategoryIndex + 1} of {businessCategories.length}: {capitalizeCategory(currentCategory)}
            </span>
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
                <h2>Sample {capitalizeCategory(currentCategory)} Request #{currentStep + 1}</h2>
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