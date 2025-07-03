import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
import WeddingTimeline from './WeddingTimeline';
import BudgetTracker from './BudgetTracker';
import VendorManager from './VendorManager';
import GuestListManager from './GuestListManager';
import EventDetails from './EventDetails';
import WeddingChecklist from './WeddingChecklist';
import WeddingNotificationBell from './WeddingNotificationBell';
import WeddingOverview from './WeddingOverview';
import MobileChatList from '../Messaging/MobileChatList';
import ChatInterface from '../Messaging/ChatInterface';
import DashboardMessaging from '../Messaging/DashboardMessaging';
import DashboardSwitcher from '../DashboardSwitcher';
import LoadingSpinner from '../LoadingSpinner';
import './WeddingPlanningDashboard.css';

// Move these utility functions above getPageMetadata
const calculateDaysUntilWedding = (weddingData) => {
  if (!weddingData?.wedding_date) return 0;
  const weddingDate = new Date(weddingData.wedding_date);
  const today = new Date();
  return Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getWeddingPhase = (daysUntil) => {
  if (daysUntil < 0) return { phase: 'Wedding Memories', icon: '💕', color: '#8b5cf6' };
  if (daysUntil === 0) return { phase: 'Wedding Day!', icon: '🎉', color: '#f59e0b' };
  if (daysUntil <= 7) return { phase: 'Final Week', icon: '⏰', color: '#ef4444' };
  if (daysUntil <= 30) return { phase: 'Last Month', icon: '📅', color: '#f59e0b' };
  if (daysUntil <= 90) return { phase: 'Planning Phase', icon: '📋', color: '#3b82f6' };
  return { phase: 'Early Planning', icon: '🌱', color: '#10b981' };
};

// Place this at the very top of the file, before the component or any usage
const getPageMetadata = (tab, weddingData) => {
  const baseTitle = 'Bidi - Wedding Planning Dashboard';
  const baseDescription = 'Plan your dream wedding with Bidi. Manage vendors, budget, timeline, and more all in one place.';
  
  if (!weddingData) {
    return {
      title: 'Create Wedding Plan - Bidi',
      description: 'Start planning your dream wedding with Bidi. Create your wedding plan and begin your journey to the perfect day.',
      keywords: 'wedding planning, create wedding plan, wedding dashboard, Bidi'
    };
  }

  const weddingTitle = String(weddingData.wedding_title || 'My Wedding');
  const daysUntil = calculateDaysUntilWedding(weddingData);
  const weddingPhase = getWeddingPhase(daysUntil);

  switch (tab) {
    case 'overview':
      return {
        title: `${weddingTitle} - Wedding Overview - Bidi`,
        description: `Planning ${weddingTitle}? Track your wedding progress, manage vendors, and stay organized with Bidi's wedding planning dashboard.`,
        keywords: `wedding planning, ${weddingTitle}, wedding overview, wedding dashboard, Bidi`
      };
    
    case 'timeline':
      return {
        title: `${weddingTitle} - Wedding Timeline - Bidi`,
        description: `Create and manage your wedding timeline for ${weddingTitle}. Stay on track with important dates and milestones.`,
        keywords: `wedding timeline, ${weddingTitle}, wedding planning, wedding schedule, Bidi`
      };
    
    case 'budget':
      return {
        title: `${weddingTitle} - Budget Tracker - Bidi`,
        description: `Track your wedding budget for ${weddingTitle}. Monitor expenses, set budgets, and stay within your financial goals.`,
        keywords: `wedding budget, budget tracker, ${weddingTitle}, wedding planning, Bidi`
      };
    
    case 'vendors':
      return {
        title: `${weddingTitle} - Vendor Management - Bidi`,
        description: `Manage your wedding vendors for ${weddingTitle}. View bids, track vendor status, and organize your vendor contacts.`,
        keywords: `wedding vendors, vendor management, ${weddingTitle}, wedding planning, Bidi`
      };
    
    case 'guests':
      return {
        title: `${weddingTitle} - Guest List Manager - Bidi`,
        description: `Manage your wedding guest list for ${weddingTitle}. Track RSVPs, organize guest information, and plan seating arrangements.`,
        keywords: `wedding guest list, guest management, ${weddingTitle}, wedding planning, Bidi`
      };
    
    case 'details':
      return {
        title: `${weddingTitle} - Wedding Details - Bidi`,
        description: `Manage wedding details for ${weddingTitle}. Update venue information, wedding style, and important event details.`,
        keywords: `wedding details, wedding information, ${weddingTitle}, wedding planning, Bidi`
      };
    
    case 'messaging':
      return {
        title: `${weddingTitle} - Vendor Messages - Bidi`,
        description: `Communicate with your wedding vendors for ${weddingTitle}. Send and receive messages, discuss details, and coordinate your big day.`,
        keywords: `wedding vendor communication, vendor messages, ${weddingTitle}, wedding planning, Bidi`
      };
    
    case 'checklist':
      return {
        title: `${weddingTitle} - Wedding Checklist - Bidi`,
        description: `Stay organized with your wedding checklist for ${weddingTitle}. Track tasks, deadlines, and ensure nothing is forgotten.`,
        keywords: `wedding checklist, wedding tasks, ${weddingTitle}, wedding planning, Bidi`
      };
    
    case 'setup':
      return {
        title: 'Create Wedding Plan - Bidi',
        description: 'Start your wedding planning journey with Bidi. Create your wedding plan and begin organizing your dream wedding.',
        keywords: 'create wedding plan, wedding planning, wedding setup, Bidi'
      };
    
    default:
      return {
        title: baseTitle,
        description: baseDescription,
        keywords: 'wedding planning, wedding dashboard, Bidi'
      };
  }
};

function WeddingPlanningDashboard() {
  const [user, setUser] = useState(null);
  const [weddingData, setWeddingData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [isCreatingWedding, setIsCreatingWedding] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [showVendorsSubmenu, setShowVendorsSubmenu] = useState(false);
  const [showDesktopVendorsDropdown, setShowDesktopVendorsDropdown] = useState(false);
  const [moodBoardImages, setMoodBoardImages] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [backgroundImageIndex, setBackgroundImageIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Get page metadata FIRST
  const pageMetadata = getPageMetadata();

  // Initialize activeTab from URL parameter
  useEffect(() => {
    if (params.activeTab) {
      setActiveTab(params.activeTab);
    }
  }, [params.activeTab]);

  // Function to update tab and URL
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    // Update URL to reflect the active tab
    navigate(`/wedding-planner/${newTab}`, { replace: true });
  };

  useEffect(() => {
    checkUserAndLoadWedding();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    console.log('activeTab changed to:', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (weddingData?.wedding_date) {
      loadNotifications();
      generateAndSaveNotifications();
    }
  }, [weddingData]);

  // Update document title when pageMetadata changes
  useEffect(() => {
    if (pageMetadata && pageMetadata.title) {
      document.title = String(pageMetadata.title || 'Bidi - Wedding Planning Dashboard');
    }
  }, [pageMetadata]);

  // Close vendors submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showVendorsSubmenu) {
        const submenu = document.querySelector('.mobile-vendors-submenu');
        const vendorsButton = document.querySelector('.mobile-nav-item[data-tab="vendors"]');
        
        if (submenu && !submenu.contains(event.target) && 
            vendorsButton && !vendorsButton.contains(event.target)) {
          setShowVendorsSubmenu(false);
        }
      }
      
      // Close desktop vendors dropdown when clicking outside
      if (showDesktopVendorsDropdown) {
        const dropdown = document.querySelector('.desktop-vendors-dropdown');
        const vendorsButton = document.querySelector('.desktop-vendors-tab');
        
        if (dropdown && !dropdown.contains(event.target) && 
            vendorsButton && !vendorsButton.contains(event.target)) {
          setShowDesktopVendorsDropdown(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showVendorsSubmenu, showDesktopVendorsDropdown]);

  const checkUserAndLoadWedding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User from auth:', user);
      if (!user) {
        navigate('/signin');
        return;
      }
      setUser(user);
      
      // Check if user has an existing wedding plan
      const { data: existingWedding } = await supabase
        .from('wedding_plans')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Existing wedding data:', existingWedding);
      if (existingWedding) {
        setWeddingData(existingWedding);
        // Load mood board images
        loadMoodBoardImages(existingWedding.id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading wedding data:', error);
      setLoading(false);
    }
  };

  const loadMoodBoardImages = async (weddingPlanId) => {
    if (!weddingPlanId) return;

    try {
      // First, try to find the couple photos category
      const { data: coupleCategory, error: categoryError } = await supabase
        .from('wedding_photo_categories')
        .select('*')
        .eq('wedding_plan_id', weddingPlanId)
        .or(`name.ilike.%couple%,special_type.eq.couple_photos`)
        .single();

      if (categoryError && categoryError.code !== 'PGRST116') {
        console.error('Error loading couple category:', categoryError);
      }

      let query = supabase
        .from('wedding_mood_board')
        .select('*')
        .eq('wedding_plan_id', weddingPlanId)
        .order('uploaded_at', { ascending: false });

      // If couple category exists, prioritize photos from that category
      if (coupleCategory) {
        query = query.eq('category_id', coupleCategory.id);
      }

      const { data: moodBoardData, error: dbError } = await query;

      if (dbError) {
        console.error('Error loading mood board from database:', dbError);
        return;
      }

      if (moodBoardData && moodBoardData.length > 0) {
        const loadedImages = moodBoardData.map(item => ({
          url: item.image_url,
          name: item.image_name,
          uploaded_at: item.uploaded_at,
          id: item.id
        }));

        setMoodBoardImages(loadedImages);
      } else {
        // If no couple photos found, try to get any photos as fallback
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('wedding_mood_board')
          .select('*')
          .eq('wedding_plan_id', weddingPlanId)
          .order('uploaded_at', { ascending: false })
          .limit(6);

        if (!fallbackError && fallbackData && fallbackData.length > 0) {
          const fallbackImages = fallbackData.map(item => ({
            url: item.image_url,
            name: item.image_name,
            uploaded_at: item.uploaded_at,
            id: item.id
          }));
          setMoodBoardImages(fallbackImages);
        } else {
          setMoodBoardImages([]);
        }
      }
    } catch (error) {
      console.error('Error loading mood board images:', error);
    }
  };

  const createNewWedding = async (weddingDetails) => {
    try {
      console.log('Creating wedding with details:', weddingDetails);
      console.log('Current user:', user);
      
      if (!user) {
        console.error('No user available for creating wedding');
        toast.error('User not authenticated. Please sign in again.');
        return;
      }
      
      setIsCreatingWedding(true);
      
      const { data, error } = await supabase
        .from('wedding_plans')
        .insert([{
          user_id: user.id,
          ...weddingDetails,
          created_at: new Date().toISOString(),
          status: 'active'
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Wedding created successfully:', data);
      setWeddingData(data);
      // Load mood board images for new wedding
      loadMoodBoardImages(data.id);
      setIsCreatingWedding(false);
      toast.success('Wedding plan created successfully!');
      
      // Navigate to homepage after successful creation
      setTimeout(() => {
        navigate('/wedding-planner/overview');
      }, 1500); // Small delay to let user see the success message
    } catch (error) {
      console.error('Error creating wedding plan:', error);
      setIsCreatingWedding(false);
      
      // Check if it's a table doesn't exist error
      if (error.message && error.message.includes('relation "wedding_plans" does not exist')) {
        toast.error('Database table not found. Please contact support.');
      } else {
        toast.error('Failed to create wedding plan: ' + error.message);
      }
    }
  };

  const updateWeddingData = async (updates) => {
    try {
      // Check if this is a tab switch request from VendorManager
      if (updates && updates.type === 'switchTab') {
        console.log('Dashboard received switchTab request:', updates);
        handleTabChange(updates.tab);
        if (updates.chatData && updates.tab === 'messaging') {
          // chatData is now directly the business ID
          console.log('Setting selectedChatId to:', updates.chatData, 'type:', typeof updates.chatData);
          setSelectedChatId(updates.chatData);
        }
        return;
      }

      // Validate updates parameter
      if (!updates || typeof updates !== 'object') {
        console.error('Invalid updates parameter:', updates);
        toast.error('Invalid update data provided');
        return;
      }

      // Remove any undefined or null values that could cause JSON issues
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined && value !== null)
      );

      // Check if we have any valid updates
      if (Object.keys(cleanUpdates).length === 0) {
        console.warn('No valid updates to apply');
        return;
      }

      console.log('Updating wedding plan with:', cleanUpdates);

      const { data, error } = await supabase
        .from('wedding_plans')
        .update(cleanUpdates)
        .eq('id', weddingData.id)
        .select()
        .single();

      if (error) throw error;

      setWeddingData(data);
      toast.success('Wedding plan updated successfully!');
    } catch (error) {
      console.error('Error updating wedding plan:', error);
      console.error('Updates that caused the error:', updates);
      toast.error('Failed to update wedding plan');
    }
  };

  // Load notifications from database
  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      const { data: dbNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      // Transform database notifications to match component format
      const transformedNotifications = dbNotifications.map(notification => {
        try {
          const messageData = JSON.parse(notification.message);
          return {
            id: notification.id,
            type: notification.type,
            title: messageData.title,
            message: messageData.message,
            priority: messageData.priority,
            created_at: notification.created_at,
            read: notification.read
          };
        } catch (parseError) {
          console.error('Error parsing notification message:', parseError);
          // Fallback for malformed notifications
          return {
            id: notification.id,
            type: notification.type,
            title: 'Notification',
            message: notification.message || 'Unable to load notification',
            priority: 'medium',
            created_at: notification.created_at,
            read: notification.read
          };
        }
      });

      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Periodic notification check
  useEffect(() => {
    if (!user?.id || !weddingData?.wedding_date) return;

    const checkNotifications = () => {
      loadNotifications();
      generateAndSaveNotifications();
    };

    // Check every 5 minutes
    const interval = setInterval(checkNotifications, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.id, weddingData?.wedding_date]);

  // Generate and save notifications to database
  const generateAndSaveNotifications = async () => {
    if (!weddingData?.wedding_date || !user?.id) return;

    const weddingDate = new Date(weddingData.wedding_date);
    const today = new Date();
    const daysUntilWedding = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const notificationsToCreate = [];

    // Wedding day notifications
    if (daysUntilWedding === 0) {
      const message = JSON.stringify({
        title: '🎉 It\'s Your Wedding Day! 🎉',
        message: 'Congratulations! Today is your special day. Enjoy every moment!',
        priority: 'high'
      });
      const exists = await checkNotificationExists('celebration', message);
      if (!exists) {
        notificationsToCreate.push({
          type: 'celebration',
          message: message
        });
      }
    } else if (daysUntilWedding === 1) {
      const message = JSON.stringify({
        title: '💍 Wedding Tomorrow!',
        message: 'Your wedding is tomorrow! Make sure everything is ready and get some rest.',
        priority: 'high'
      });
      const exists = await checkNotificationExists('warning', message);
      if (!exists) {
        notificationsToCreate.push({
          type: 'warning',
          message: message
        });
      }
    } else if (daysUntilWedding <= 7) {
      const message = JSON.stringify({
        title: '⏰ Final Week!',
        message: `Only ${daysUntilWedding} days until your wedding! Final preparations time.`,
        priority: 'medium'
      });
      const exists = await checkNotificationExists('info', message);
      if (!exists) {
        notificationsToCreate.push({
          type: 'info',
          message: message
        });
      }
    }

    // Milestone notifications
    if (daysUntilWedding === 30) {
      const message = JSON.stringify({
        title: '📅 One Month to Go!',
        message: 'Your wedding is in exactly one month! Time for final vendor meetings and rehearsals.',
        priority: 'medium'
      });
      const exists = await checkNotificationExists('info', message);
      if (!exists) {
        notificationsToCreate.push({
          type: 'info',
          message: message
        });
      }
    } else if (daysUntilWedding === 60) {
      const message = JSON.stringify({
        title: '📋 Two Months to Go!',
        message: 'Two months until your wedding! Finalize vendor contracts and start dress fittings.',
        priority: 'medium'
      });
      const exists = await checkNotificationExists('info', message);
      if (!exists) {
        notificationsToCreate.push({
          type: 'info',
          message: message
        });
      }
    } else if (daysUntilWedding === 90) {
      const message = JSON.stringify({
        title: '🎯 Three Months to Go!',
        message: 'Three months until your wedding! Book remaining vendors and plan honeymoon.',
        priority: 'medium'
      });
      const exists = await checkNotificationExists('info', message);
      if (!exists) {
        notificationsToCreate.push({
          type: 'info',
          message: message
        });
      }
    }

    // Past due notifications
    if (daysUntilWedding < 0) {
      const message = JSON.stringify({
        title: '💕 Wedding Memories',
        message: 'Your wedding has passed! We hope it was everything you dreamed of.',
        priority: 'low'
      });
      const exists = await checkNotificationExists('info', message);
      if (!exists) {
        notificationsToCreate.push({
          type: 'info',
          message: message
        });
      }
    }

    // Budget reminders
    if (weddingData.budget && daysUntilWedding <= 30) {
      const message = JSON.stringify({
        title: '💰 Final Budget Check',
        message: 'Review your budget before the big day to avoid any surprises.',
        priority: 'medium'
      });
      const exists = await checkNotificationExists('warning', message);
      if (!exists) {
        notificationsToCreate.push({
          type: 'warning',
          message: message
        });
      }
    }

    // Guest list reminders
    if (weddingData.guest_count && daysUntilWedding <= 14) {
      const message = JSON.stringify({
        title: '👥 Final Guest Count',
        message: 'Provide final guest count to your venue and caterer.',
        priority: 'medium'
      });
      const exists = await checkNotificationExists('warning', message);
      if (!exists) {
        notificationsToCreate.push({
          type: 'warning',
          message: message
        });
      }
    }

    // Check for new bids
    await checkForNewBids(notificationsToCreate);

    // Check for new messages
    await checkForNewMessages(notificationsToCreate);

    // Save notifications to database
    if (notificationsToCreate.length > 0) {
      try {
        const notificationsWithUser = notificationsToCreate.map(notification => ({
          ...notification,
          user_id: user.id,
          read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('notifications')
          .insert(notificationsWithUser);

        if (error) {
          console.error('Error saving notifications:', error);
        } else {
          // Reload notifications after creating new ones
          loadNotifications();
        }
      } catch (error) {
        console.error('Error creating notifications:', error);
      }
    }
  };

  // Check for new bids on requests
  const checkForNewBids = async (notificationsToCreate) => {
    try {
      // Get all request IDs for this user from all request tables
      const requestTables = [
        'photography_requests',
        'videography_requests', 
        'catering_requests',
        'dj_requests',
        'florist_requests',
        'beauty_requests',
        'wedding_planning_requests'
      ];

      let allRequestIds = [];
      
      for (const table of requestTables) {
        let query = supabase.from(table).select('id, event_type, title');
        
        if (table === 'photography_requests') {
          query = query.eq('profile_id', user.id);
        } else {
          query = query.eq('user_id', user.id);
        }

        const { data: requests, error } = await query;
        if (!error && requests) {
          allRequestIds.push(...requests);
        }
      }

      if (allRequestIds.length === 0) return;

      // Get all bids for these requests
      const { data: bids, error } = await supabase
        .from('bids')
        .select('id, request_id, created_at, viewed')
        .in('request_id', allRequestIds.map(req => req.id))
        .eq('viewed', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error checking for new bids:', error);
        return;
      }

      // Group bids by request and create notifications
      const bidsByRequest = {};
      bids?.forEach(bid => {
        if (!bidsByRequest[bid.request_id]) {
          bidsByRequest[bid.request_id] = [];
        }
        bidsByRequest[bid.request_id].push(bid);
      });

      for (const [requestId, requestBids] of Object.entries(bidsByRequest)) {
        const request = allRequestIds.find(req => req.id === requestId);
        if (!request) continue;

        const requestTitle = request.title || request.event_type || 'Your request';
        const bidCount = requestBids.length;
        
        const message = JSON.stringify({
          title: `💰 New Bid${bidCount > 1 ? 's' : ''} Received!`,
          message: `You have ${bidCount} new bid${bidCount > 1 ? 's' : ''} on your ${requestTitle} request.`,
          priority: 'medium'
        });

        const exists = await checkNotificationExists('bid', message);
        if (!exists) {
          notificationsToCreate.push({
            type: 'bid',
            message: message
          });
        }
      }
    } catch (error) {
      console.error('Error checking for new bids:', error);
    }
  };

  // Check for new messages
  const checkForNewMessages = async (notificationsToCreate) => {
    try {
      // Get unread messages for this user
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          created_at,
          sender_id,
          business_profiles!messages_sender_id_fkey(business_name)
        `)
        .eq('recipient_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error checking for new messages:', error);
        return;
      }

      if (messages && messages.length > 0) {
        // Group messages by sender
        const messagesBySender = {};
        messages.forEach(message => {
          const senderId = message.sender_id;
          if (!messagesBySender[senderId]) {
            messagesBySender[senderId] = [];
          }
          messagesBySender[senderId].push(message);
        });

        for (const [senderId, senderMessages] of Object.entries(messagesBySender)) {
          const businessName = senderMessages[0]?.business_profiles?.business_name || 'A vendor';
          const messageCount = senderMessages.length;
          
          const message = JSON.stringify({
            title: `💬 New Message${messageCount > 1 ? 's' : ''} from ${businessName}`,
            message: `You have ${messageCount} unread message${messageCount > 1 ? 's' : ''} from ${businessName}.`,
            priority: 'medium'
          });

          const exists = await checkNotificationExists('message', message);
          if (!exists) {
            notificationsToCreate.push({
              type: 'message',
              message: message
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  };

  // Legacy function - keeping for backward compatibility
  const generateNotifications = () => {
    // This function is now deprecated in favor of generateAndSaveNotifications
    console.log('generateNotifications is deprecated, use generateAndSaveNotifications instead');
  };

  const dismissNotification = async (notificationId) => {
    try {
      // Mark notification as read in database
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user?.id || notifications.length === 0) return;

    try {
      // Mark all user's unread notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error clearing all notifications:', error);
        return;
      }

      // Clear local state
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  // Check if notification already exists to prevent duplicates
  const checkNotificationExists = async (type, message) => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', type)
        .eq('message', message)
        .eq('read', false)
        .limit(1);

      if (error) {
        console.error('Error checking notification existence:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking notification existence:', error);
      return false;
    }
  };

  // Background slideshow effect
  useEffect(() => {
    if (moodBoardImages.length === 0) return;

    const interval = setInterval(() => {
      setBackgroundImageIndex(prevIndex => 
        (prevIndex + 1) % moodBoardImages.length
      );
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [moodBoardImages.length]);

  const renderTabContent = () => {
    console.log('renderTabContent called, activeTab:', activeTab, 'weddingData:', weddingData);
    
    // Handle setup tab first
    if (activeTab === 'setup') {
      console.log('Rendering setup form');
      return (
        <div className="wedding-setup-form">
          <h2>Create Your Wedding Plan</h2>
          <WeddingSetupForm onSubmit={createNewWedding} loading={isCreatingWedding} />
        </div>
      );
    }
    
    if (!weddingData) {
      console.log('No wedding data, showing setup container');
      return (
        <div className="wedding-setup-container">
          <h2>Let's Start Planning Your Wedding!</h2>
          <p>Create your wedding plan to get started with timeline, budget tracking, and vendor management.</p>
          <button 
            className="create-wedding-btn"
            onClick={() => {
              handleTabChange('setup');
              console.log('ActiveTab set to setup');
            }}
          >
            Create Wedding Plan
          </button>
        </div>
      );
    }

    console.log('Wedding data exists, rendering tab content for:', activeTab);
    switch (activeTab) {
      case 'overview':
        return <WeddingOverview weddingData={weddingData} onNavigate={handleTabChange} />;
      
      case 'timeline':
        return <WeddingTimeline weddingData={weddingData} onUpdate={updateWeddingData} />;
      
      case 'budget':
        return <BudgetTracker weddingData={weddingData} onUpdate={updateWeddingData} />;
      
      case 'vendors':
        return <VendorManager weddingData={weddingData} onUpdate={updateWeddingData} />;
      
      case 'guests':
        return <GuestListManager weddingData={weddingData} onUpdate={updateWeddingData} />;
      
      case 'details':
        return <EventDetails weddingData={weddingData} onUpdate={updateWeddingData} />;
      
      case 'messaging':
        console.log('Rendering messaging tab with selectedChatId:', selectedChatId);
        return (
          <DashboardMessaging 
            currentUserId={user?.id} 
            userType="individual"
            selectedChatId={selectedChatId}
            onChatSelect={setSelectedChatId}
            onBack={() => setSelectedChatId(null)}
          />
        );
      
      case 'checklist':
        return <WeddingChecklist weddingData={weddingData} onUpdate={updateWeddingData} />;
      
      default:
        console.log('Default case, activeTab:', activeTab);
        return <div>Select a tab to get started</div>;
    }
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedImageIndex(0);
  };

  if (loading) {
    return (
      <div className="wedding-planning-dashboard">
        <LoadingSpinner 
          variant="ring" 
          color="#ff008a" 
          text="Loading your wedding plan..." 
          fullScreen={true}
        />
      </div>
    );
  }

  // Hero section data
  const daysUntil = calculateDaysUntilWedding(weddingData);
  const weddingPhase = getWeddingPhase(daysUntil);

  return (
    <div className="wedding-planning-dashboard">

      
      {/* Overview Hero Section */}
      {weddingData ? (
        <div className="overview-hero-container">
          {/* Notification Bell - positioned outside hero but in corner */}
          <div className="hero-notification-bell">
            <WeddingNotificationBell 
              notifications={notifications}
              onDismissNotification={dismissNotification}
              onClearAllNotifications={clearAllNotifications}
            />
          </div>
          
          <div 
            className="overview-hero"
            style={{
              backgroundImage: moodBoardImages.length > 0 
                ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${moodBoardImages[backgroundImageIndex]?.url})`
                : 'linear-gradient(135deg, #d84888 0%, #764ba2 100%);',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              transition: 'background-image 1s ease-in-out',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div className="frosted-hero-glass" />
            
            <div className="hero-content-wrapper">
              <div className="hero-content">
                <div className="wedding-title-section">
                  <h1 className="wedding-title">{weddingData.wedding_title}</h1>
                  <div className="wedding-date-display">
                    <i className="fas fa-calendar-heart"></i>
                    <span>{new Date(weddingData.wedding_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="wedding-location">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{weddingData.wedding_location || 'Location TBD'}</span>
                  </div>
                </div>
                
                <div className="countdown-section">
                  <div className={`countdown-card ${weddingPhase.phase.toLowerCase().replace(/\s+/g, '')}`}>
                    <div className="countdown-icon">{weddingPhase.icon}</div>
                    <div className="countdown-content">
                      <h3>{weddingPhase.phase}</h3>
                      <p className="countdown-days">
                        {daysUntil < 0 ? 'Wedding has passed' : 
                         daysUntil === 0 ? 'Today is your wedding day!' :
                         `${daysUntil} ${daysUntil === 1 ? 'day' : 'days'} to go`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Slideshow Indicator */}
              {moodBoardImages.length > 1 && (
                <div className="slideshow-indicator">
                  {moodBoardImages.map((_, index) => (
                    <div
                      key={index}
                      className={`slideshow-dot ${index === backgroundImageIndex ? 'active' : ''}`}
                      onClick={() => setBackgroundImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-header">
          <div className="header-content">
            <h1>
              <span className="cute-title">💕 Let's Plan Your Dream Wedding 💕</span>
              <div className="cute-subtitle">Every love story deserves a beautiful beginning</div>
            </h1>
          </div>
        </div>
      )}

      {/* Desktop Tabs - Hidden on Mobile */}
      <div className="dashboard-tabs desktop-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          <i className="fas fa-home"></i>
          Overview
        </button>
        
        {!weddingData && (
          <button 
            className={`tab ${activeTab === 'setup' ? 'active' : ''}`}
            onClick={() => handleTabChange('setup')}
          >
            <i className="fas fa-plus-circle"></i>
            Setup
          </button>
        )}
        
        {weddingData && (
          <>
            <button 
              className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => handleTabChange('timeline')}
            >
              <i className="fas fa-calendar-alt"></i>
              Timeline
            </button>
            
            <button 
              className={`tab ${activeTab === 'budget' ? 'active' : ''}`}
              onClick={() => handleTabChange('budget')}
            >
              <i className="fas fa-dollar-sign"></i>
              Budget
            </button>
            

            
            <div className="desktop-vendors-tab-container">
              <button 
                className={`tab desktop-vendors-tab ${activeTab === 'vendors' || activeTab === 'messaging' ? 'active' : ''}`}
                onClick={() => setShowDesktopVendorsDropdown(!showDesktopVendorsDropdown)}
              >
                <i className="fas fa-users"></i>
                Vendors
                <i className="fas fa-chevron-down" style={{ marginLeft: '8px', fontSize: '0.8rem' }}></i>
              </button>
              
              {showDesktopVendorsDropdown && (
                <div className="desktop-vendors-dropdown">
                  <button 
                    className={`dropdown-item-wedding-planning-dashboard ${activeTab === 'vendors' ? 'active' : ''}`}
                    onClick={() => {
                      handleTabChange('vendors');
                      setShowDesktopVendorsDropdown(false);
                    }}
                  >
                    <i className="fas fa-handshake"></i>
                    View Bids
                  </button>
                  <button 
                    className={`dropdown-item-wedding-planning-dashboard ${activeTab === 'messaging' ? 'active' : ''}`}
                    onClick={() => {
                      handleTabChange('messaging');
                      setShowDesktopVendorsDropdown(false);
                    }}
                  >
                    <i className="fas fa-comments" style={{ color: 'black' }}></i>
                    Messages
                  </button>
                </div>
              )}
            </div>
            
            <button 
              className={`tab ${activeTab === 'guests' ? 'active' : ''}`}
              onClick={() => handleTabChange('guests')}
            >
              <i className="fas fa-user-friends"></i>
              Guests
            </button>
            
            <button 
              className={`tab ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => handleTabChange('details')}
            >
              <i className="fas fa-info-circle"></i>
              Details
            </button>
          </>
        )}
      </div>

      <div className="dashboard-content">
        {renderTabContent()}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        {!weddingData ? (
          // Show setup tab when no wedding data
          <>
            <button 
              className={`mobile-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => handleTabChange('overview')}
            >
              <i className="fas fa-home"></i>
              <span>Overview</span>
            </button>
            
            <button 
              className={`mobile-nav-item ${activeTab === 'setup' ? 'active' : ''}`}
              onClick={() => handleTabChange('setup')}
            >
              <i className="fas fa-plus-circle"></i>
              <span>Setup</span>
            </button>
          </>
        ) : (
          // Show all tabs when wedding data exists
          <>
            <button 
              className={`mobile-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => {
                handleTabChange('overview');
                setShowVendorsSubmenu(false);
              }}
            >
              <i className="fas fa-home"></i>
              <span>Overview</span>
            </button>
            
            <button 
              className={`mobile-nav-item ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => {
                handleTabChange('timeline');
                setShowVendorsSubmenu(false);
              }}
            >
              <i className="fas fa-calendar-alt"></i>
              <span>Timeline</span>
            </button>
            
            <button 
              className={`mobile-nav-item ${activeTab === 'budget' ? 'active' : ''}`}
              onClick={() => {
                handleTabChange('budget');
                setShowVendorsSubmenu(false);
              }}
            >
              <i className="fas fa-dollar-sign"></i>
              <span>Budget</span>
            </button>
            
            <button 
              className={`mobile-nav-item ${activeTab === 'vendors' ? 'active' : ''}`}
              data-tab="vendors"
              onClick={() => {
                if (showVendorsSubmenu) {
                  setShowVendorsSubmenu(false);
                } else {
                  handleTabChange('vendors');
                  setShowVendorsSubmenu(true);
                }
              }}
            >
              <i className="fas fa-users"></i>
              <span>Vendors</span>
            </button>
            
            <button 
              className={`mobile-nav-item ${activeTab === 'guests' ? 'active' : ''}`}
              onClick={() => {
                handleTabChange('guests');
                setShowVendorsSubmenu(false);
              }}
            >
              <i className="fas fa-user-friends"></i>
              <span>Guests</span>
            </button>
            
            <button 
              className={`mobile-nav-item ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => {
                handleTabChange('details');
                setShowVendorsSubmenu(false);
              }}
            >
              <i className="fas fa-info-circle"></i>
              <span>Details</span>
            </button>
          </>
        )}
      </div>

      {/* Mobile Vendors Submenu */}
      {showVendorsSubmenu && (
        <div className="mobile-vendors-submenu">
          <button 
            className={`mobile-submenu-item ${activeTab === 'vendors' ? 'active' : ''}`}
            onClick={() => {
              handleTabChange('vendors');
              setShowVendorsSubmenu(false);
            }}
          >
            <i className="fas fa-handshake"></i>
            <span>View Bids</span>
          </button>
          <button 
            className={`mobile-submenu-item ${activeTab === 'messaging' ? 'active' : ''}`}
            onClick={() => {
              handleTabChange('messaging');
              setShowVendorsSubmenu(false);
            }}
          >
            <i className="fas fa-comments"></i>
            <span>Messages</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Wedding Setup Form Component
function WeddingSetupForm({ onSubmit, loading }) {
  console.log('WeddingSetupForm rendered, loading:', loading);
  
  const [formData, setFormData] = useState({
    wedding_title: '',
    wedding_date: '',
    wedding_location: '',
    budget: '',
    guest_count: '',
    wedding_style: '',
    color_scheme: ''
  });

  // Add color picker state
  const [allColors, setAllColors] = useState([
    { id: 'primary', name: 'Primary', value: '#ec4899', isDefault: true },
    { id: 'secondary', name: 'Secondary', value: '#8b5cf6', isDefault: true },
    { id: 'accent', name: 'Accent', value: '#f59e0b', isDefault: true },
    { id: 'neutral', name: 'Neutral', value: '#6b7280', isDefault: true }
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    console.log('Colors:', allColors);
    
    // Create color scheme string from colors
    const colorSchemeString = allColors.map(color => color.name).join(' & ');
    
    const submissionData = {
      ...formData,
      color_scheme: colorSchemeString,
      colors: allColors // Include the full colors array
    };
    
    console.log('Calling onSubmit function with:', submissionData);
    onSubmit(submissionData);
  };

  const handleChange = (e) => {
    console.log('Form field changed:', e.target.name, e.target.value);
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Color picker functions
  const handleColorChange = (colorId, color) => {
    setAllColors(prev => 
      prev.map(c => 
        c.id === colorId ? { ...c, value: color } : c
      )
    );
  };

  const addCustomColor = () => {
    const newColor = {
      id: `custom_${Date.now()}`,
      name: `Custom Color ${allColors.filter(c => c.id.startsWith('custom_')).length + 1}`,
      value: '#3b82f6',
      isDefault: false
    };
    setAllColors(prev => [...prev, newColor]);
  };

  const removeColor = (colorId) => {
    // Don't allow removing the last color
    if (allColors.length <= 1) {
      return;
    }
    setAllColors(prev => prev.filter(color => color.id !== colorId));
  };

  const updateColorName = (colorId, newName) => {
    setAllColors(prev => 
      prev.map(color => 
        color.id === colorId ? { ...color, name: newName } : color
      )
    );
  };

  console.log('WeddingSetupForm about to render form with data:', formData);

  return (
    <form onSubmit={handleSubmit} className="wedding-setup-form-content">
      <div className="form-group">
        <label htmlFor="wedding_title">Wedding Title</label>
        <input
          type="text"
          id="wedding_title"
          name="wedding_title"
          value={formData.wedding_title}
          onChange={handleChange}
          placeholder="e.g., Sarah & Michael's Wedding"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="wedding_date">Wedding Date</label>
        <input
          type="date"
          id="wedding_date"
          name="wedding_date"
          value={formData.wedding_date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="wedding_location">Wedding Location</label>
        <input
          type="text"
          id="wedding_location"
          name="wedding_location"
          value={formData.wedding_location}
          onChange={handleChange}
          placeholder="You can enter a city, venue, state or address"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="budget">Total Budget</label>
          <input
            type="number"
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            placeholder="50000"
          />
        </div>

        <div className="form-group">
          <label htmlFor="guest_count">Expected Guest Count</label>
          <input
            type="number"
            id="guest_count"
            name="guest_count"
            value={formData.guest_count}
            onChange={handleChange}
            placeholder="150"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="wedding_style">Wedding Style</label>
        <select
          id="wedding_style"
          name="wedding_style"
          value={formData.wedding_style}
          onChange={handleChange}
        >
          <option value="">Select Style</option>
          <option value="traditional">Traditional</option>
          <option value="modern">Modern</option>
          <option value="rustic">Rustic</option>
          <option value="elegant">Elegant</option>
          <option value="bohemian">Bohemian</option>
          <option value="vintage">Vintage</option>
          <option value="destination">Destination</option>
        </select>
      </div>

      {/* Color Palette Section */}
      <div className="form-group">
        <label>Color Palette</label>
        <p className="section-description">
          Click on any color swatch below to choose your wedding colors. You can add custom colors and remove any color from your palette (you must keep at least one color).
        </p>
        
        <div className="color-palette-grid">
          {allColors.map((color) => (
            <div key={color.id} className="color-item">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>{color.name}</label>
              <div 
                className="color-picker-container"
                onClick={() => {
                  // Trigger the hidden color input
                  const colorInput = document.getElementById(`color-input-${color.id}`);
                  if (colorInput) {
                    colorInput.click();
                  }
                }}
              >
                <input
                  id={`color-input-${color.id}`}
                  type="color"
                  value={color.value}
                  onChange={(e) => handleColorChange(color.id, e.target.value)}
                  className="color-picker"
                  title="Click to choose color"
                  style={{ display: 'none' }}
                />
                <div 
                  className="color-display"
                  style={{ backgroundColor: color.value }}
                ></div>
                <div className="color-info">
                  <input
                    type="text"
                    value={color.name}
                    onChange={(e) => updateColorName(color.id, e.target.value)}
                    className="custom-color-name"
                    placeholder="Color name"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="color-hint">
                    Click color to change
                  </span>
                </div>
                {allColors.length > 1 && (
                  <button
                    className="remove-color-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeColor(color.id);
                    }}
                    title="Remove this color"
                    type="button"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Color Button */}
        <div className="add-color-section">
          <button 
            className="add-color-btn"
            onClick={addCustomColor}
            type="button"
          >
            <i className="fas fa-plus"></i>
            Add New Color
          </button>
        </div>
        
        {allColors.length === 1 && (
          <div className="color-warning">
            <i className="fas fa-info-circle"></i>
            <span>Keep at least one color in your palette</span>
          </div>
        )}
        
        {allColors.length === 0 && (
          <div className="no-colors-message">
            <i className="fas fa-palette"></i>
            <p>No colors in your palette yet</p>
            <small>Click "Add New Color" to start building your wedding color scheme</small>
          </div>
        )}
        
        <div className="color-preview">
          <h4>Color Preview</h4>
          <div className="color-swatches-container">
            {allColors.map((color) => (
              <div 
                key={color.id} 
                className="color-swatch" 
                style={{ backgroundColor: color.value }}
              >
                {color.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? 'Creating...' : 'Create Wedding Plan'}
      </button>
    </form>
  );
}

export default WeddingPlanningDashboard;