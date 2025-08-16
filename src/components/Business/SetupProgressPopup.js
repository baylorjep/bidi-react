import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const SetupProgressPopup = ({ userId, onNavigateToSection }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [aiBidderDismissed, setAiBidderDismissed] = useState(false);
  const [progress, setProgress] = useState({
    stripe: false,
    profile: false,
    photos: false,
    paymentSettings: false,
    businessSettings: false,
    calendar: false,
    bidTemplate: false,
    aiBidder: false
  });
  const [businessProfile, setBusinessProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      // Then fetch progress
      fetchProgress();
    }
  }, [userId]);

  // Load dismissed state from localStorage when component mounts
  useEffect(() => {
    if (userId) {
      const dismissed = localStorage.getItem(`aiBidderDismissed_${userId}`);
      if (dismissed) {
        setAiBidderDismissed(JSON.parse(dismissed));
      }
    }
  }, [userId]);

  const handleAiBidderDismiss = async () => {
    try {
      // Update the business profile in Supabase to mark AI bidder as completed
      const { error } = await supabase
        .from('business_profiles')
        .update({ 
          autobid_enabled: true,
          autobid_status: 'live',
          autobid_training_completed: true
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating business profile:', error);
        return;
      }

      setAiBidderDismissed(true);
      localStorage.setItem(`aiBidderDismissed_${userId}`, 'true');
      
      // Update progress to mark AI bidder as completed for basic/null users
      if (businessProfile?.membership_tier !== 'pro') {
        setProgress(prev => ({
          ...prev,
          aiBidder: true
        }));
      }

      // Refresh the business profile data
      fetchProgress();
    } catch (error) {
      console.error('Error dismissing AI bidder:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      setIsLoading(true);
      
      // Fetch business profile data
      const { data: businessProfile, error: profileError } = await supabase
        .from('business_profiles')
        .select('stripe_account_id, stripe_onboarding_completed, business_description, story, business_address, phone, website, minimum_price, down_payment_type, amount, consultation_hours, autobid_enabled, autobid_training_completed, business_category, bid_template, google_calendar_connected, autobid_status, membership_tier')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching business profile:', profileError);
        return;
      }

      setBusinessProfile(businessProfile);

      // Fetch profile photos
      const { data: photos, error: photosError } = await supabase
        .from('profile_photos')
        .select('*')
        .eq('user_id', userId);

      if (photosError) {
        console.error('Error fetching profile photos:', photosError);
        return;
      }

      // Calculate progress for specific tasks
      const hasStripe = !!businessProfile?.stripe_account_id;
      const hasProfile = !!(businessProfile?.business_description && businessProfile?.story);
      const hasPhotos = photos && photos.length > 0;
      const hasPaymentSettings = !!(businessProfile?.minimum_price && businessProfile?.down_payment_type);
      const hasBusinessSettings = !!(businessProfile?.phone && businessProfile?.business_category && businessProfile?.business_category.length > 0);
      const hasCalendar = !!(businessProfile?.google_calendar_connected === true);
      const hasBidTemplate = !!(businessProfile?.bid_template);
      const hasAiBidder = !!(businessProfile?.autobid_enabled && businessProfile?.autobid_status === 'live') || 
                          (businessProfile?.membership_tier !== 'pro' && aiBidderDismissed);



                  setProgress({
              stripe: hasStripe,
              profile: hasProfile,
              photos: hasPhotos,
              paymentSettings: hasPaymentSettings,
              businessSettings: hasBusinessSettings,
              calendar: hasCalendar,
              bidTemplate: hasBidTemplate,
              aiBidder: hasAiBidder
            });

    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressPercentage = () => {
    const completed = Object.values(progress).filter(Boolean).length;
    return Math.round((completed / Object.keys(progress).length) * 100);
  };

  const getStepStatus = (stepKey) => {
    return progress[stepKey] ? 'completed' : 'pending';
  };

  const handleStepClick = (stepKey) => {
    if (onNavigateToSection) {
      onNavigateToSection(stepKey);
    }
  };

  if (isLoading) {
    return null;
  }

  // Don't show if all steps are completed
  if (getProgressPercentage() === 100) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: window.innerWidth <= 768 ? '10px' : '20px',
        right: window.innerWidth <= 768 ? '10px' : '20px',
        left: window.innerWidth <= 768 ? '10px' : 'auto',
        width: window.innerWidth <= 768 ? 'calc(100vw - 20px)' : '320px',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e5e7eb',
        zIndex: 9999,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        transition: 'all 0.3s ease-in-out',
        overflow: 'hidden',
        animation: 'slideInUp 0.4s ease-out'
      }}
    >
      {!isMinimized && (
        <>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: window.innerWidth <= 768 ? '14px 16px' : '16px 20px',
            background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
            color: 'white'
          }}>
            <h4 style={{ 
              margin: 0, 
              fontSize: window.innerWidth <= 768 ? '15px' : '16px', 
              fontWeight: 600 
            }}>Complete Your Setup</h4>
            <button 
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              onClick={() => setIsMinimized(true)}
              title="Minimize"
            >
              <i className="fas fa-minus"></i>
            </button>
          </div>
        
          
          {/* Pink Progress Bar */}
          <div style={{
            height: '6px',
            backgroundColor: '#fce7f3',
            margin: window.innerWidth <= 768 ? '0 16px' : '0 20px',
            borderRadius: '9999px',
            overflow: 'hidden',
            marginTop: '10px'
          }}>
            <div 
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)',
                transition: 'width 0.5s ease-in-out',
                width: `${getProgressPercentage()}%`
              }}
            ></div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: window.innerWidth <= 768 ? '10px 16px' : '12px 20px',
            fontSize: window.innerWidth <= 768 ? '13px' : '14px',
            fontWeight: 500,
            color: '#6b7280'
          }}>
            {getProgressPercentage()}% Complete
          </div>

          <div style={{ padding: window.innerWidth <= 768 ? '0 16px 16px' : '0 20px 20px' }}>
            {/* Incomplete Steps - Show First */}
            {!progress.stripe && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: window.innerWidth <= 768 ? '14px 12px' : '12px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  marginBottom: window.innerWidth <= 768 ? '10px' : '8px',
                  backgroundColor: '#f3e8ff',
                  border: '1px solid #a855f7'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e9d5ff';
                  e.target.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f3e8ff';
                  e.target.style.transform = 'translateX(0)';
                }}
                onClick={() => handleStepClick('stripe')}
              >
                <div style={{
                  width: window.innerWidth <= 768 ? '36px' : '32px',
                  height: window.innerWidth <= 768 ? '36px' : '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  fontSize: window.innerWidth <= 768 ? '16px' : '14px',
                  backgroundColor: '#7c3aed',
                  color: 'white'
                }}>
                  <i className="fas fa-credit-card"></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: window.innerWidth <= 768 ? '15px' : '14px', 
                    fontWeight: 600, 
                    color: '#581c87',
                    marginBottom: '2px'
                  }}>Payment Account</div>
                  <div style={{ 
                    fontSize: window.innerWidth <= 768 ? '13px' : '12px', 
                    color: '#6b21a8'
                  }}>This is how Bidi pays you</div>
                </div>
                <div style={{
                  color: '#7c3aed',
                  fontSize: '12px',
                  marginLeft: '8px'
                }}>
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
            )}

            {!progress.profile && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: window.innerWidth <= 768 ? '14px 12px' : '12px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  marginBottom: window.innerWidth <= 768 ? '10px' : '8px',
                  backgroundColor: '#f3e8ff',
                  border: '1px solid #a855f7'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e9d5ff';
                  e.target.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f3e8ff';
                  e.target.style.transform = 'translateX(0)';
                }}
                onClick={() => handleStepClick('profile')}
              >
                <div style={{
                  width: window.innerWidth <= 768 ? '36px' : '32px',
                  height: window.innerWidth <= 768 ? '36px' : '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  fontSize: window.innerWidth <= 768 ? '16px' : '14px',
                  backgroundColor: '#7c3aed',
                  color: 'white'
                }}>
                  <i className="fas fa-user-edit"></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: window.innerWidth <= 768 ? '15px' : '14px', 
                    fontWeight: 600, 
                    color: '#581c87',
                    marginBottom: '2px'
                  }}>Business Profile</div>
                  <div style={{ 
                    fontSize: window.innerWidth <= 768 ? '13px' : '12px', 
                    color: '#6b21a8'
                  }}>Add business description and story</div>
                </div>
                <div style={{
                  color: '#7c3aed',
                  fontSize: '12px',
                  marginLeft: '8px'
                }}>
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
            )}

            {!progress.paymentSettings && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: window.innerWidth <= 768 ? '14px 12px' : '12px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  marginBottom: window.innerWidth <= 768 ? '10px' : '8px',
                  backgroundColor: '#f3e8ff',
                  border: '1px solid #a855f7'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e9d5ff';
                  e.target.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f3e8ff';
                  e.target.style.transform = 'translateX(0)';
                }}
                onClick={() => handleStepClick('paymentSettings')}
              >
                <div style={{
                  width: window.innerWidth <= 768 ? '36px' : '32px',
                  height: window.innerWidth <= 768 ? '36px' : '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  fontSize: window.innerWidth <= 768 ? '16px' : '14px',
                  backgroundColor: '#7c3aed',
                  color: 'white'
                }}>
                  <i className="fas fa-dollar-sign"></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: window.innerWidth <= 768 ? '15px' : '14px', 
                    fontWeight: 600, 
                    color: '#581c87',
                    marginBottom: '2px'
                  }}>Payment Settings</div>
                  <div style={{ 
                    fontSize: window.innerWidth <= 768 ? '13px' : '12px', 
                    color: '#6b21a8'
                  }}>Set minimum price & down payment</div>
                </div>
                <div style={{
                  color: '#7c3aed',
                  fontSize: '12px',
                  marginLeft: '8px'
                }}>
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
            )}

            {!progress.photos && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: window.innerWidth <= 768 ? '14px 12px' : '12px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  marginBottom: window.innerWidth <= 768 ? '10px' : '8px',
                  backgroundColor: '#f3e8ff',
                  border: '1px solid #a855f7'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e9d5ff';
                  e.target.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f3e8ff';
                  e.target.style.transform = 'translateX(0)';
                }}
                onClick={() => handleStepClick('photos')}
              >
                <div style={{
                  width: window.innerWidth <= 768 ? '36px' : '32px',
                  height: window.innerWidth <= 768 ? '36px' : '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  fontSize: window.innerWidth <= 768 ? '16px' : '14px',
                  backgroundColor: '#7c3aed',
                  color: 'white'
                }}>
                  <i className="fas fa-images"></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: window.innerWidth <= 768 ? '15px' : '14px', 
                    fontWeight: 600, 
                    color: '#581c87',
                    marginBottom: '2px'
                  }}>Portfolio Photos</div>
                  <div style={{ 
                    fontSize: window.innerWidth <= 768 ? '13px' : '12px', 
                    color: '#6b21a8'
                  }}>Upload your best work</div>
                </div>
                <div style={{
                  color: '#7c3aed',
                  fontSize: '12px',
                  marginLeft: '8px'
                }}>
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
            )}

            {!progress.businessSettings && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: window.innerWidth <= 768 ? '14px 12px' : '12px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  marginBottom: window.innerWidth <= 768 ? '10px' : '8px',
                  backgroundColor: '#f3e8ff',
                  border: '1px solid #a855f7'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e9d5ff';
                  e.target.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f3e8ff';
                  e.target.style.transform = 'translateX(0)';
                }}
                onClick={() => handleStepClick('businessSettings')}
              >
                <div style={{
                  width: window.innerWidth <= 768 ? '36px' : '32px',
                  height: window.innerWidth <= 768 ? '36px' : '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  fontSize: window.innerWidth <= 768 ? '16px' : '14px',
                  backgroundColor: '#7c3aed',
                  color: 'white'
                }}>
                  <i className="fas fa-building"></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: window.innerWidth <= 768 ? '15px' : '14px', 
                    fontWeight: 600, 
                    color: '#581c87',
                    marginBottom: '2px'
                  }}>Business Settings</div>
                  <div style={{ 
                    fontSize: window.innerWidth <= 768 ? '13px' : '12px', 
                    color: '#6b21a8'
                  }}>Add phone & business categories</div>
                </div>
                <div style={{
                  color: '#7c3aed',
                  fontSize: '12px',
                  marginLeft: '8px'
                }}>
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
            )}

            {!progress.calendar && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: window.innerWidth <= 768 ? '14px 12px' : '12px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  marginBottom: window.innerWidth <= 768 ? '10px' : '8px',
                  backgroundColor: '#f3e8ff',
                  border: '1px solid #a855f7'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e9d5ff';
                  e.target.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f3e8ff';
                  e.target.style.transform = 'translateX(0)';
                }}
                onClick={() => handleStepClick('calendar')}
              >
                <div style={{
                  width: window.innerWidth <= 768 ? '36px' : '32px',
                  height: window.innerWidth <= 768 ? '36px' : '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  fontSize: window.innerWidth <= 768 ? '16px' : '14px',
                  backgroundColor: '#7c3aed',
                  color: 'white'
                }}>
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: window.innerWidth <= 768 ? '15px' : '14px', 
                    fontWeight: 600, 
                    color: '#581c87',
                    marginBottom: '2px'
                  }}>Google Calendar</div>
                  <div style={{ 
                    fontSize: window.innerWidth <= 768 ? '13px' : '12px', 
                    color: '#6b21a8'
                  }}>Connect calendar for consultations</div>
                </div>
                <div style={{
                  color: '#7c3aed',
                  fontSize: '12px',
                  marginLeft: '8px'
                }}>
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
            )}

            {!progress.bidTemplate && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: window.innerWidth <= 768 ? '14px 12px' : '12px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  marginBottom: window.innerWidth <= 768 ? '10px' : '8px',
                  backgroundColor: '#f3e8ff',
                  border: '1px solid #a855f7'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e9d5ff';
                  e.target.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f3e8ff';
                  e.target.style.transform = 'translateX(0)';
                }}
                onClick={() => handleStepClick('bidTemplate')}
              >
                <div style={{
                  width: window.innerWidth <= 768 ? '36px' : '32px',
                  height: window.innerWidth <= 768 ? '36px' : '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  fontSize: window.innerWidth <= 768 ? '16px' : '14px',
                  backgroundColor: '#7c3aed',
                  color: 'white'
                }}>
                  <i className="fas fa-file-alt"></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: window.innerWidth <= 768 ? '15px' : '14px', 
                    fontWeight: 600, 
                    color: '#581c87',
                    marginBottom: '2px'
                  }}>Bid Template</div>
                  <div style={{ 
                    fontSize: window.innerWidth <= 768 ? '13px' : '12px', 
                    color: '#6b21a8'
                  }}>Create reusable bid template</div>
                </div>
                <div style={{
                  color: '#7c3aed',
                  fontSize: '12px',
                  marginLeft: '8px'
                }}>
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
            )}

            {!progress.aiBidder && 
             (businessProfile?.membership_tier === 'pro' || !aiBidderDismissed) && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: window.innerWidth <= 768 ? '14px 12px' : '12px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  marginBottom: window.innerWidth <= 768 ? '10px' : '8px',
                  backgroundColor: '#f3e8ff',
                  border: '1px solid #a855f7'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e9d5ff';
                  e.target.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f3e8ff';
                  e.target.style.transform = 'translateX(0)';
                }}
                onClick={() => handleStepClick('aiBidder')}
              >
                <div style={{
                  width: window.innerWidth <= 768 ? '36px' : '32px',
                  height: window.innerWidth <= 768 ? '36px' : '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  fontSize: window.innerWidth <= 768 ? '16px' : '14px',
                  backgroundColor: '#7c3aed',
                  color: 'white'
                }}>
                  <i className="fas fa-robot"></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: window.innerWidth <= 768 ? '15px' : '14px', 
                    fontWeight: 600, 
                    color: '#581c87',
                    marginBottom: '2px'
                  }}>AI Bidder</div>
                  <div style={{ 
                    fontSize: window.innerWidth <= 768 ? '13px' : '12px', 
                    color: '#6b21a8'
                  }}>
                    {businessProfile?.membership_tier === 'pro' 
                      ? 'Set up your AI bidder to automate responses'
                      : 'Try out our AI bidder feature'
                    }
                  </div>
                </div>
                <div style={{
                  color: '#7c3aed',
                  fontSize: '12px',
                  marginLeft: '8px'
                }}>
                  <i className="fas fa-chevron-right"></i>
                </div>
                {businessProfile?.membership_tier !== 'pro' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAiBidderDismiss();
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#6b21a8',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      marginLeft: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(107, 33, 168, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                    title="Dismiss this notification"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            )}

            {/* Completed Steps Accordion */}
            {Object.values(progress).some(Boolean) && (
              <div style={{ marginTop: '20px' }}>
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: '1px solid #e5e7eb'
                  }}
                  onClick={() => setShowCompleted(!showCompleted)}
                >
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: '#374151' 
                  }}>
                    Completed Steps ({Object.values(progress).filter(Boolean).length})
                  </div>
                  <div style={{
                    color: '#6b7280',
                    fontSize: '14px',
                    transition: 'transform 0.2s ease',
                    transform: showCompleted ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    <i className="fas fa-chevron-down"></i>
                  </div>
                </div>
                
                {showCompleted && (
                  <div style={{ marginTop: '12px' }}>
                    {progress.stripe && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#f0fdf4',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        border: '1px solid #bbf7d0'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          fontSize: '14px',
                          backgroundColor: '#22c55e',
                          color: 'white'
                        }}>
                          <i className="fas fa-check"></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 500, 
                            color: '#166534',
                            marginBottom: '2px'
                          }}>Payment Account</div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#16a34a'
                          }}>Stripe account connected</div>
                        </div>
                      </div>
                    )}

                    {progress.profile && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#f0fdf4',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        border: '1px solid #bbf7d0'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          fontSize: '14px',
                          backgroundColor: '#22c55e',
                          color: 'white'
                        }}>
                          <i className="fas fa-check"></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 500, 
                            color: '#166534',
                            marginBottom: '2px'
                          }}>Business Profile</div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#16a34a'
                          }}>Description and story added</div>
                        </div>
                      </div>
                    )}

                    {progress.paymentSettings && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#f0fdf4',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        border: '1px solid #bbf7d0'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          fontSize: '14px',
                          backgroundColor: '#22c55e',
                          color: 'white'
                        }}>
                          <i className="fas fa-check"></i>
                          <i className="fas fa-check"></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 500, 
                            color: '#166534',
                            marginBottom: '2px'
                          }}>Payment Settings</div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#16a34a'
                          }}>Minimum price and down payment set</div>
                        </div>
                      </div>
                    )}

                    {progress.photos && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#f0fdf4',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        border: '1px solid #bbf7d0'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          fontSize: '14px',
                          backgroundColor: '#22c55e',
                          color: 'white'
                        }}>
                          <i className="fas fa-check"></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 500, 
                            color: '#166534',
                            marginBottom: '2px'
                          }}>Portfolio Photos</div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#16a34a'
                          }}>Photos uploaded</div>
                        </div>
                      </div>
                    )}

                    {progress.businessSettings && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#f0fdf4',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        border: '1px solid #bbf7d0'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          fontSize: '14px',
                          backgroundColor: '#22c55e',
                          color: 'white'
                        }}>
                          <i className="fas fa-check"></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 500, 
                            color: '#166534',
                            marginBottom: '2px'
                          }}>Business Settings</div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#16a34a'
                          }}>Phone and categories added</div>
                        </div>
                      </div>
                    )}

                    {progress.calendar && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#f0fdf4',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        border: '1px solid #bbf7d0'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          fontSize: '14px',
                          backgroundColor: '#22c55e',
                          color: 'white'
                        }}>
                          <i className="fas fa-check"></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 500, 
                            color: '#166534',
                            marginBottom: '2px'
                          }}>Google Calendar</div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#16a34a'
                          }}>Calendar connected</div>
                        </div>
                      </div>
                    )}

                    {progress.bidTemplate && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#f0fdf4',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        border: '1px solid #bbf7d0'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          fontSize: '14px',
                          backgroundColor: '#22c55e',
                          color: 'white'
                        }}>
                          <i className="fas fa-check"></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 600, 
                            color: '#166534',
                            marginBottom: '2px'
                          }}>Bid Template</div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#16a34a'
                          }}>Template created</div>
                        </div>
                      </div>
                    )}

                    {progress.aiBidder && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#f0fdf4',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        border: '1px solid #bbf7d0'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          fontSize: '14px',
                          backgroundColor: '#22c55e',
                          color: 'white'
                        }}>
                          <i className="fas fa-check"></i>
                        </div>
                        <div style={{ flex: '1' }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 500, 
                            color: '#166534',
                            marginBottom: '2px'
                          }}>AI Bidder</div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#16a34a'
                          }}>
                            {businessProfile?.membership_tier === 'pro' 
                              ? 'AI bidder configured'
                              : 'AI bidder feature enabled'
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}





      {isMinimized && (
        <>
          {/* Mobile Minimized Button */}
          {window.innerWidth <= 768 ? (
            <button 
              style={{
                background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
                border: 'none',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                width: 'auto',
                justifyContent: 'center',
                position: 'fixed',
                top: '20px',
                zIndex: 10000
              }}
              onClick={() => setIsMinimized(false)}
              title="Expand Setup Progress"
            >
              <i className="fas fa-tasks"></i>
              <span style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '2px 6px',
                borderRadius: '9999px',
                fontSize: '10px',
                fontWeight: 600
              }}>
                {getProgressPercentage()}%
              </span>
            </button>
          ) : (
            /* Desktop Minimized Button */
            <button 
              style={{
                background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
                border: 'none',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                width: 'auto',
                justifyContent: 'center',
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 10000
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }}
              onClick={() => setIsMinimized(false)}
              title="Expand Setup Progress"
            >
              <i className="fas fa-tasks"></i>
              <span style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '4px 8px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                {getProgressPercentage()}%
              </span>
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default SetupProgressPopup;
