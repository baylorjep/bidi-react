import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaLightbulb, FaRobot, FaGraduationCap, FaThumbsUp, FaThumbsDown, FaComments } from 'react-icons/fa';
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
  const [businessCategories, setBusinessCategories] = useState([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentCategory, setCurrentCategory] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);
  const [showSampleBid, setShowSampleBid] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [sampleBidApproved, setSampleBidApproved] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [consecutiveApprovals, setConsecutiveApprovals] = useState(0);
  const [currentSampleBidIndex, setCurrentSampleBidIndex] = useState(0);
  const [trainingProgress, setTrainingProgress] = useState({});
  const [currentSampleBidData, setCurrentSampleBidData] = useState([]);
  const [categoryProgress, setCategoryProgress] = useState({});
  const [isLoadingSampleBid, setIsLoadingSampleBid] = useState(false);
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
    try {
      console.log('Fetching sample bid data from API for category:', category);
      
      // Get the current training request to use its data, or generate category-specific data
      let requestData = currentRequest?.request_data;
      
      if (!requestData) {
        // Generate category-specific request data if no current request
        requestData = generateCategorySpecificRequest(category);
        console.log('Generated category-specific request data:', requestData);
      }

      // Parse request data if it's a string
      const parsedRequestData = typeof requestData === 'string' 
        ? JSON.parse(requestData) 
        : requestData;
      
      // Call the backend API to generate sample bids using real request data
      const response = await fetch('https://bidi-express.vercel.app/api/autobid/generate-sample-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: user.id,
          category: category,
          request_data: parsedRequestData
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate sample bid from API.');
      }

      const data = await response.json();
      console.log('API returned sample bid data:', data);
      
      // Convert API response to the expected format using real request data
      const sampleBid = {
        request: parsedRequestData,
        generatedBid: {
          amount: data.amount || 0,
          description: data.description || 'AI-generated bid description',
          breakdown: data.breakdown || 'Pricing breakdown',
          reasoning: data.reasoning || 'AI reasoning for pricing'
        }
      };

      return [sampleBid]; // Return as array to match existing structure
    } catch (error) {
      console.error('Error fetching sample bid from API:', error);
      
      // Fallback to hardcoded data if API fails
      const fallbackBids = {
        photography: [
          {
            request: {
              date: "2024-08-15",
              duration: "8 hours",
              location: "San Francisco, CA",
              event_type: "wedding",
              guest_count: 150,
              requirements: [
                "Full day coverage",
                "Engagement shoot",
                "Online gallery",
                "Print release",
                "Drone footage"
              ]
            },
            generatedBid: {
              amount: 2800,
              description: "Complete wedding photography package including full day coverage, engagement session, online gallery with 400+ edited photos, print release, and drone footage. Professional equipment and backup gear included.",
              breakdown: "Full day coverage (8 hours): $1,600\nEngagement shoot: $400\nOnline gallery & editing: $500\nDrone footage: $200\nPrint release: $100",
              reasoning: "Based on your training data, this pricing reflects your premium service quality and comprehensive coverage. The amount accounts for your experience level and the high-end equipment you use."
            }
          }
        ],
        videography: [
          {
            request: {
              date: "2024-09-20",
              duration: "4 hours",
              location: "Salt Lake City, UT",
              event_type: "wedding",
              guest_count: 80,
              requirements: [
                "Ceremony coverage",
                "Reception highlights",
                "Highlight reel",
                "Digital files"
              ]
            },
            generatedBid: {
              amount: 1800,
              description: "Wedding videography package covering ceremony and reception highlights. Includes professional editing, highlight reel, and digital file delivery. Perfect for capturing your special moments.",
              breakdown: "Ceremony coverage: $800\nReception highlights: $600\nHighlight reel: $300\nDigital files: $100",
              reasoning: "This pricing is based on your previous responses showing competitive rates for mid-sized weddings. The package provides comprehensive coverage while remaining accessible."
            }
          }
        ],
        florist: [
          {
            request: {
              date: "2024-07-15",
              duration: "Setup only",
              location: "Park City, UT",
              event_type: "wedding",
              guest_count: 100,
              requirements: [
                "Bridal bouquet",
                "8 boutonnieres",
                "12 centerpieces",
                "Delivery and setup"
              ]
            },
            generatedBid: {
              amount: 950,
              description: "Complete wedding floral package featuring a stunning bridal bouquet, boutonnieres for the wedding party, elegant centerpieces, and professional delivery and setup services.",
              breakdown: "Bridal bouquet: $200\n8 boutonnieres: $160\n12 centerpieces: $480\nDelivery & setup: $110",
              reasoning: "Based on your training responses, this pricing reflects your quality materials and professional service while staying within typical market ranges for this scope of work."
            }
          }
        ],
        beauty: [
          {
            request: {
              date: "2024-06-10",
              duration: "3 hours",
              location: "Orem, UT",
              event_type: "wedding",
              guest_count: 4,
              requirements: [
                "Bridal hair and makeup",
                "3 bridesmaids hair and makeup",
                "On-site service",
                "Trial session included"
              ]
            },
            generatedBid: {
              amount: 450,
              description: "Complete bridal party beauty package including bridal hair and makeup, three bridesmaids services, on-site application, and a trial session for the bride.",
              breakdown: "Bridal hair & makeup: $150\n3 bridesmaids: $225\nOn-site service: $50\nTrial session: $25",
              reasoning: "This pricing structure shows competitive rates while accounting for the convenience of on-site service and the value of the trial session."
            }
          }
        ],
        dj: [
          {
            request: {
              date: "2024-08-15",
              duration: "5 hours",
              location: "Salt Lake City, UT",
              event_type: "wedding",
              guest_count: 120,
              requirements: [
                "Ceremony music",
                "Reception DJ",
                "Professional sound system",
                "Playlist consultation",
                "MC services"
              ]
            },
            generatedBid: {
              amount: 800,
              description: "Complete wedding DJ package including ceremony music, reception entertainment, professional sound system, playlist consultation, and MC services for your special day.",
              breakdown: "Ceremony music: $150\nReception DJ (5 hours): $500\nProfessional sound system: $100\nPlaylist consultation: $50",
              reasoning: "This pricing reflects your professional equipment and experience while remaining competitive in the market."
            }
          }
        ],
        "wedding planning": [
          {
            request: {
              date: "2024-09-15",
              duration: "Full planning",
              location: "Salt Lake City, UT",
              event_type: "wedding",
              guest_count: 150,
              requirements: [
                "Full wedding planning",
                "Vendor coordination",
                "Timeline management",
                "Budget management",
                "Day-of coordination"
              ]
            },
            generatedBid: {
              amount: 2500,
              description: "Complete wedding planning package including full planning services, vendor coordination, timeline management, budget oversight, and day-of coordination to ensure your perfect day.",
              breakdown: "Full planning services: $1,500\nVendor coordination: $400\nTimeline management: $300\nBudget management: $200\nDay-of coordination: $100",
              reasoning: "This pricing reflects the comprehensive nature of full wedding planning services and your professional expertise."
            }
          }
        ],
        catering: [
          {
            request: {
              date: "2024-08-15",
              duration: "Dinner service",
              location: "Salt Lake City, UT",
              event_type: "wedding",
              guest_count: 120,
              requirements: [
                "Plated dinner service",
                "Appetizers",
                "Main course",
                "Dessert",
                "Staffing",
                "Setup and cleanup"
              ]
            },
            generatedBid: {
              amount: 4800,
              description: "Complete wedding catering package with plated dinner service for 120 guests. Includes appetizers, main course, dessert, professional staffing, and full setup and cleanup services.",
              breakdown: "Plated dinner (120 guests): $3,600\nAppetizers: $600\nDessert: $300\nStaffing: $200\nSetup & cleanup: $100",
              reasoning: "This pricing reflects the quality of plated service and comprehensive catering package for a mid-sized wedding."
            }
          }
        ],
        cake: [
          {
            request: {
              date: "2024-08-15",
              duration: "Delivery only",
              location: "Salt Lake City, UT",
              event_type: "wedding",
              guest_count: 120,
              requirements: [
                "3-tier wedding cake",
                "Custom design",
                "Delivery and setup",
                "Cake cutting service"
              ]
            },
            generatedBid: {
              amount: 450,
              description: "Beautiful 3-tier custom wedding cake designed to match your wedding theme. Includes delivery, setup, and cake cutting service for your special day.",
              breakdown: "3-tier cake: $300\nCustom design: $100\nDelivery & setup: $30\nCake cutting service: $20",
              reasoning: "This pricing reflects the custom design work and comprehensive service package for a wedding cake."
            }
          }
        ]
      };

      return fallbackBids[category] || fallbackBids.photography;
    }
  };

  // Helper function to safely capitalize category names
  const capitalizeCategory = (category) => {
    if (!category || typeof category !== 'string') {
      return 'Category';
    }
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Update sample bid data when business category changes
  useEffect(() => {
    const loadSampleBidData = async () => {
      if (!user || !currentCategory) return;
      
      setIsLoadingSampleBid(true);
      try {
        const sampleData = await getSampleBidData(currentCategory);
        console.log(`Loading sample bid data for category: ${currentCategory}`, sampleData);
        setCurrentSampleBidData(sampleData);
        console.log(`Updated sample bid data for category: ${currentCategory}`, sampleData.length, 'samples available');
      } catch (error) {
        console.error('Error loading sample bid data:', error);
        // Set empty array as fallback
        setCurrentSampleBidData([]);
      } finally {
        setIsLoadingSampleBid(false);
      }
    };

    loadSampleBidData();
  }, [currentCategory, user]);

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

        // Load requests for current category
        await loadCategoryRequests(userCategories[0]);

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
        // Show sample bid step instead of completion
        setShowSampleBid(true);
      }
    } catch (error) {
      console.error('Error submitting training response:', error);
      alert('Error saving your response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSampleBidResponse = async (approved) => {
    setSampleBidApproved(approved);
    
    try {
      // Save AI-generated bid to training responses
      const currentBid = currentSampleBidData[currentSampleBidIndex];
      const { data: aiResponse, error: aiError } = await supabase
        .from('autobid_training_responses')
        .insert({
          business_id: user.id,
          request_id: currentRequest?.id || 'sample-request',
          bid_amount: currentBid.generatedBid.amount,
          bid_description: currentBid.generatedBid.description,
          pricing_breakdown: currentBid.generatedBid.breakdown,
          pricing_reasoning: currentBid.generatedBid.reasoning,
          is_training: true,
          is_ai_generated: true,
          feedback: feedbackText,
          feedback_type: approved ? 'approved' : 'rejected',
          category: currentCategory
        })
        .select()
        .single();

      if (aiError) throw aiError;

      // Call the real training feedback API
      try {
        const feedbackResponse = await fetch('https://bidi-express.vercel.app/api/autobid/training-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            business_id: user.id,
            category: currentCategory,
            sample_bid_id: aiResponse.id,
            approved: approved,
            feedback: feedbackText || (approved ? 'Approved' : 'Needs adjustment'),
            suggested_changes: approved ? null : feedbackText
          }),
        });

        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json();
          console.log('Training feedback submitted to API:', feedbackData);
        } else {
          console.warn('Failed to submit feedback to API, but continuing with local storage');
        }
      } catch (apiError) {
        console.warn('Error submitting feedback to API:', apiError);
        // Continue with local storage even if API fails
      }

      // Save detailed feedback if provided
      if (feedbackText.trim()) {
        const { error: feedbackError } = await supabase
          .from('autobid_training_feedback')
          .insert({
            business_id: user.id,
            training_response_id: aiResponse.id,
            feedback_type: approved ? 'approved' : 'rejected',
            feedback_text: feedbackText,
            specific_issues: approved ? null : { general: 'needs_adjustment' },
            suggested_improvements: approved ? null : feedbackText
          });

        if (feedbackError) throw feedbackError;
      }

      // Update consecutive approvals for current category
      const newConsecutiveApprovals = approved ? consecutiveApprovals + 1 : 0;
      setConsecutiveApprovals(newConsecutiveApprovals);

      const currentProgress = categoryProgress[currentCategory];
      const { error: progressError } = await supabase
        .from('autobid_training_progress')
        .update({
          scenarios_approved: (currentProgress?.scenarios_approved || 0) + (approved ? 1 : 0),
          consecutive_approvals: newConsecutiveApprovals,
          training_completed: newConsecutiveApprovals >= 2,
          training_completed_at: newConsecutiveApprovals >= 2 ? new Date().toISOString() : null
        })
        .eq('business_id', user.id)
        .eq('category', currentCategory);

      if (progressError) throw progressError;

      // Update local progress state
      const updatedProgress = {
        ...categoryProgress,
        [currentCategory]: {
          ...currentProgress,
          scenarios_approved: (currentProgress?.scenarios_approved || 0) + (approved ? 1 : 0),
          consecutive_approvals: newConsecutiveApprovals,
          training_completed: newConsecutiveApprovals >= 2
        }
      };
      setCategoryProgress(updatedProgress);

      // Check if current category training is complete (2 consecutive approvals)
      if (newConsecutiveApprovals >= 2) {
        // Check if all categories are complete
        const allCategoriesComplete = businessCategories.every(cat => 
          updatedProgress[cat]?.training_completed
        );

        if (allCategoriesComplete) {
          // All categories complete - show final completion
          setShowSampleBid(false);
          setShowCompletion(true);
        } else {
          // Move to next category
          const nextCategoryIndex = currentCategoryIndex + 1;
          if (nextCategoryIndex < businessCategories.length) {
            const nextCategory = businessCategories[nextCategoryIndex];
            console.log('Moving to next category:', nextCategory, 'at index:', nextCategoryIndex);
            
            if (nextCategory) {
              setCurrentCategoryIndex(nextCategoryIndex);
              setCurrentCategory(nextCategory);
              await loadCategoryRequests(nextCategory);
            } else {
              console.error('Next category is undefined at index:', nextCategoryIndex);
              setShowSampleBid(false);
              setShowCompletion(true);
            }
          } else {
            // All categories complete
            console.log('All categories completed');
            setShowSampleBid(false);
            setShowCompletion(true);
          }
        }
      } else {
        // Generate a new sample bid for continuous training
        console.log('Generating new sample bid for continuous training...');
        setIsLoadingSampleBid(true);
        
        try {
          // Generate new sample bid data from API
          const newSampleData = await getSampleBidData(currentCategory);
          setCurrentSampleBidData(newSampleData);
          setCurrentSampleBidIndex(0); // Reset to first sample bid
          setSampleBidApproved(null);
          setFeedbackText('');
          console.log('New sample bid generated for continuous training');
        } catch (error) {
          console.error('Error generating new sample bid:', error);
          // If API fails, show completion for this category
          setShowSampleBid(false);
          setShowCompletion(true);
        } finally {
          setIsLoadingSampleBid(false);
        }
      }
    } catch (error) {
      console.error('Error handling sample bid response:', error);
      alert('Error saving your feedback. Please try again.');
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
                  onClick={async () => {
                    console.log('Button clicked - moving to next category');
                    console.log('Current category index:', currentCategoryIndex);
                    console.log('Next category index:', nextCategoryIndex);
                    console.log('Business categories:', businessCategories);
                    console.log('Next category:', nextCategory);
                    console.log('Moving to next category:', nextCategory);
                    setCurrentCategoryIndex(nextCategoryIndex);
                    setCurrentCategory(nextCategory);
                    await loadCategoryRequests(nextCategory);
                  }}
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
    if (!currentBid) {
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
              onClick={() => window.location.reload()}
            >
              Retry
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
                
                {currentBid && formatRequestData(currentBid.request)}
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

                    <div className="feedback-actions">
                      <button
                        className={`feedback-btn reject ${sampleBidApproved === false ? 'active' : ''}`}
                        onClick={() => handleSampleBidResponse(false)}
                      >
                        <FaThumbsDown />
                        Needs Adjustment
                      </button>
                      <button
                        className={`feedback-btn approve ${sampleBidApproved === true ? 'active' : ''}`}
                        onClick={() => handleSampleBidResponse(true)}
                      >
                        <FaThumbsUp />
                        Looks Good!
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