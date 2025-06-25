import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
import BidDisplay from '../Bid/BidDisplay';
import './VendorManager.css';

function VendorManager({ weddingData, onUpdate, compact = false }) {
  const [vendors, setVendors] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showEditVendor, setShowEditVendor] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [customCategories, setCustomCategories] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showBidNotes, setShowBidNotes] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [bidNotes, setBidNotes] = useState('');
  const [bidInterestRating, setBidInterestRating] = useState(0);
  const navigate = useNavigate();

  const defaultVendorCategories = [
    { id: 'photography', name: 'Photography', icon: 'fas fa-camera', color: '#667eea', isDefault: true },
    { id: 'videography', name: 'Videography', icon: 'fas fa-video', color: '#764ba2', isDefault: true },
    { id: 'catering', name: 'Catering', icon: 'fas fa-utensils', color: '#f093fb', isDefault: true },
    { id: 'dj', name: 'DJ & Music', icon: 'fas fa-music', color: '#4facfe', isDefault: true },
    { id: 'florist', name: 'Florist', icon: 'fas fa-seedling', color: '#43e97b', isDefault: true },
    { id: 'beauty', name: 'Hair & Makeup', icon: 'fas fa-spa', color: '#fa709a', isDefault: true },
    { id: 'venue', name: 'Venue', icon: 'fas fa-building', color: '#a8edea', isDefault: true },
    { id: 'transportation', name: 'Transportation', icon: 'fas fa-car', color: '#ffecd2', isDefault: true },
    { id: 'officiant', name: 'Officiant', icon: 'fas fa-pray', color: '#fc466b', isDefault: true },
    { id: 'decor', name: 'Decor & Rentals', icon: 'fas fa-palette', color: '#ff9a9e', isDefault: true },
    { id: 'planning', name: 'Wedding Planning', icon: 'fas fa-calendar-check', color: '#ff6b6b', isDefault: true }
  ];

  // Combine default and custom categories, filtering out hidden ones
  const vendorCategories = [
    ...defaultVendorCategories.filter(cat => !customCategories.find(hidden => 
      (hidden.category_id === cat.id || hidden.id === cat.id) && hidden.is_hidden
    )),
    ...customCategories.filter(cat => cat.is_custom && !cat.is_hidden).map(cat => ({
      id: cat.category_id,
      name: cat.category_name,
      icon: cat.category_icon,
      color: cat.category_color,
      isDefault: false
    }))
  ];

  useEffect(() => {
    if (weddingData) {
      loadVendors();
      loadCustomCategories();
      loadBids();
      getCurrentUser();
    }
  }, [weddingData]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const loadBids = async () => {
    try {
      // First, get all request IDs for this wedding from all request tables
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
      
      // Query each request table to get IDs for this wedding
      for (const table of requestTables) {
        let query = supabase.from(table).select('id, event_type');
        
        // Handle different user ID column names
        if (table === 'photography_requests') {
          query = query.eq('profile_id', weddingData.user_id);
        } else {
          query = query.eq('user_id', weddingData.user_id);
        }

        const { data: requests, error } = await query;

        if (error) {
          console.error(`Error fetching from ${table}:`, error);
          continue;
        }

        if (requests && requests.length > 0) {
          allRequestIds.push(...requests.map(req => ({ id: req.id, table, event_type: req.event_type })));
        }
      }

      if (allRequestIds.length === 0) {
        setBids([]);
        return;
      }

      // Now fetch bids for all these request IDs
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select(`
          *,
          business_profiles (
            id,
            business_name,
            membership_tier,
            google_calendar_connected
          )
        `)
        .in('request_id', allRequestIds.map(req => req.id))
        .order('created_at', { ascending: false });

      if (bidsError) throw bidsError;

      // Fetch profile photos for all businesses
      const businessIds = [...new Set(bidsData?.map(bid => bid.business_profiles?.id).filter(Boolean) || [])];
      let profilePhotos = {};
      
      if (businessIds.length > 0) {
        const { data: photosData, error: photosError } = await supabase
          .from('profile_photos')
          .select('user_id, photo_url')
          .eq('photo_type', 'profile')
          .in('user_id', businessIds);

        if (!photosError && photosData) {
          photosData.forEach(photo => {
            profilePhotos[photo.user_id] = photo.photo_url;
          });
        }
      }

      // Create a map of request_id to category for easy lookup
      const requestCategoryMap = {};
      allRequestIds.forEach(req => {
        requestCategoryMap[req.id] = {
          category: getCategoryFromEventType(req.event_type, req.table),
          table: req.table
        };
      });

      // Add category information and profile images to each bid
      const bidsWithCategory = (bidsData || []).map(bid => ({
        ...bid,
        business_profiles: {
          ...bid.business_profiles,
          profile_image: profilePhotos[bid.business_profiles?.id] || '/images/default.jpg'
        },
        service_requests: {
          category: requestCategoryMap[bid.request_id]?.category || 'unknown',
          table: requestCategoryMap[bid.request_id]?.table || 'unknown'
        }
      }));

      setBids(bidsWithCategory);
    } catch (error) {
      console.error('Error loading bids:', error);
    }
  };

  // Helper function to map event types and tables to categories
  const getCategoryFromEventType = (eventType, table) => {
    // Map table names to categories
    const tableCategoryMap = {
      'photography_requests': 'photography',
      'videography_requests': 'videography',
      'catering_requests': 'catering',
      'dj_requests': 'dj',
      'florist_requests': 'florist',
      'beauty_requests': 'beauty',
      'wedding_planning_requests': 'planning'
    };

    // If we can map by table, use that
    if (tableCategoryMap[table]) {
      return tableCategoryMap[table];
    }

    // Otherwise, try to map by event type
    const eventTypeLower = eventType?.toLowerCase() || '';
    
    if (eventTypeLower.includes('wedding')) {
      // For wedding events, we need to determine the specific category
      // This might need to be refined based on your specific needs
      return 'photography'; // Default fallback
    }

    return 'unknown';
  };

  const loadCustomCategories = async () => {
    try {
      // Load category preferences from Supabase
      const { data: preferences, error } = await supabase
        .from('wedding_vendor_category_preferences')
        .select('*')
        .eq('wedding_id', weddingData.id);

      if (error) {
        console.error('Error loading category preferences:', error);
        setCustomCategories([]);
        return;
      }

      // Separate hidden default categories and custom categories
      const hiddenCategories = preferences?.filter(pref => pref.is_hidden && !pref.is_custom) || [];
      const customCategories = preferences?.filter(pref => pref.is_custom) || [];
      
      // Set hidden categories (these will be filtered out in the vendorCategories array)
      setCustomCategories([...hiddenCategories, ...customCategories]);
    } catch (error) {
      console.error('Error loading custom categories:', error);
      setCustomCategories([]);
    }
  };

  const addCustomCategory = async (categoryData) => {
    try {
      const newCategory = {
        wedding_id: weddingData.id,
        category_id: `custom-${Date.now()}`,
        category_name: categoryData.name,
        category_icon: categoryData.icon,
        category_color: categoryData.color,
        is_hidden: false,
        is_custom: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('wedding_vendor_category_preferences')
        .insert([newCategory])
        .select()
        .single();

      if (error) throw error;

      setCustomCategories([...customCategories, data]);
      setShowCategoryManager(false);
      toast.success('Category added successfully!');
    } catch (error) {
      console.error('Error adding custom category:', error);
      toast.error('Failed to add category');
    }
  };

  const removeCustomCategory = async (categoryId) => {
    try {
      // Check if there are any vendors in this category
      const { data: vendorsInCategory, error: vendorsError } = await supabase
        .from('wedding_vendors')
        .select('id')
        .eq('wedding_id', weddingData.id)
        .eq('category', categoryId);

      if (vendorsError) throw vendorsError;

      if (vendorsInCategory && vendorsInCategory.length > 0) {
        toast.error('Cannot remove category that has vendors. Please remove or reassign vendors first.');
        return;
      }

      // Find the category to determine if it's default or custom
      const categoryToRemove = vendorCategories.find(cat => cat.id === categoryId);
      
      if (categoryToRemove && categoryToRemove.isDefault) {
        // For default categories, mark as hidden in Supabase
        const { error } = await supabase
          .from('wedding_vendor_category_preferences')
          .upsert([{
            wedding_id: weddingData.id,
            category_id: categoryId,
            category_name: categoryToRemove.name,
            category_icon: categoryToRemove.icon,
            category_color: categoryToRemove.color,
            is_hidden: true,
            is_custom: false,
            updated_at: new Date().toISOString()
          }], { onConflict: 'wedding_id,category_id' });

        if (error) throw error;

        // Add to local state
        const hiddenCategory = { 
          ...categoryToRemove, 
          isHidden: true,
          wedding_id: weddingData.id,
          category_id: categoryId,
          is_hidden: true,
          is_custom: false
        };
        setCustomCategories([...customCategories, hiddenCategory]);
        toast.success('Category hidden successfully!');
      } else {
        // For custom categories, delete from Supabase
        const { error } = await supabase
          .from('wedding_vendor_category_preferences')
          .delete()
          .eq('wedding_id', weddingData.id)
          .eq('category_id', categoryId)
          .eq('is_custom', true);

        if (error) throw error;

        // Remove from local state
        setCustomCategories(customCategories.filter(cat => cat.category_id !== categoryId));
        toast.success('Category removed successfully!');
      }
    } catch (error) {
      console.error('Error removing category:', error);
      toast.error('Failed to remove category');
    }
  };

  const unhideCategory = async (categoryId) => {
    try {
      // Remove the hidden preference from Supabase
      const { error } = await supabase
        .from('wedding_vendor_category_preferences')
        .delete()
        .eq('wedding_id', weddingData.id)
        .eq('category_id', categoryId)
        .eq('is_hidden', true);

      if (error) throw error;

      // Remove from local state
      setCustomCategories(customCategories.filter(cat => 
        !(cat.category_id === categoryId && cat.is_hidden)
      ));
      toast.success('Category unhidden successfully!');
    } catch (error) {
      console.error('Error unhiding category:', error);
      toast.error('Failed to unhide category');
    }
  };

  const loadVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_vendors')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading vendors:', error);
      setLoading(false);
    }
  };

  const addVendor = async (vendorData) => {
    try {
      // Validate required fields
      if (!vendorData.name || !vendorData.category) {
        toast.error('Vendor name and category are required');
        return;
      }

      // Ensure contact_info is properly formatted
      const contactInfo = vendorData.contact_info || '';
      
      const { data, error } = await supabase
        .from('wedding_vendors')
        .insert([{
          wedding_id: weddingData.id,
          name: vendorData.name,
          category: vendorData.category,
          contact_info: contactInfo,
          notes: vendorData.notes || '',
          pricing: vendorData.pricing || '',
          rating: vendorData.rating || 0,
          is_booked: vendorData.is_booked || false,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setVendors([data, ...vendors]);
      setShowAddVendor(false);
      toast.success('Vendor added successfully!');
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast.error('Failed to add vendor');
    }
  };

  const updateVendorStatus = async (vendorId, status) => {
    try {
      const { error } = await supabase
        .from('wedding_vendors')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendorId);

      if (error) throw error;

      setVendors(vendors.map(vendor => 
        vendor.id === vendorId ? { ...vendor, status, updated_at: new Date().toISOString() } : vendor
      ));
      toast.success('Vendor status updated!');
    } catch (error) {
      console.error('Error updating vendor status:', error);
      toast.error('Failed to update vendor status');
    }
  };

  const updateVendorRating = async (vendorId, rating) => {
    try {
      const { error } = await supabase
        .from('wedding_vendors')
        .update({ 
          rating,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendorId);

      if (error) throw error;

      setVendors(vendors.map(vendor => 
        vendor.id === vendorId ? { ...vendor, rating, updated_at: new Date().toISOString() } : vendor
      ));
      toast.success('Vendor rating updated!');
    } catch (error) {
      console.error('Error updating vendor rating:', error);
      toast.error('Failed to update vendor rating');
    }
  };

  const deleteVendor = async (vendorId) => {
    try {
      const { error } = await supabase
        .from('wedding_vendors')
        .delete()
        .eq('id', vendorId);

      if (error) throw error;

      setVendors(vendors.filter(vendor => vendor.id !== vendorId));
      toast.success('Vendor removed successfully!');
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to remove vendor');
    }
  };

  const editVendor = async (vendorData) => {
    try {
      // Validate required fields
      if (!vendorData.name || !vendorData.category) {
        toast.error('Vendor name and category are required');
        return;
      }

      // Ensure contact_info is properly formatted
      const contactInfo = vendorData.contact_info || '';

      const { error } = await supabase
        .from('wedding_vendors')
        .update({
          name: vendorData.name,
          category: vendorData.category,
          contact_info: contactInfo,
          notes: vendorData.notes || '',
          pricing: vendorData.pricing || '',
          rating: vendorData.rating || 0,
          is_booked: vendorData.is_booked || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingVendor.id);

      if (error) throw error;

      setVendors(vendors.map(vendor => 
        vendor.id === editingVendor.id ? { 
          ...vendor, 
          name: vendorData.name,
          category: vendorData.category,
          contact_info: contactInfo,
          notes: vendorData.notes || '',
          pricing: vendorData.pricing || '',
          rating: vendorData.rating || 0,
          is_booked: vendorData.is_booked || false,
          updated_at: new Date().toISOString()
        } : vendor
      ));
      setShowEditVendor(false);
      setEditingVendor(null);
      toast.success('Vendor updated successfully!');
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast.error('Failed to update vendor');
    }
  };

  const requestBidsFromVendors = (category) => {
    // Navigate to the existing request form system
    const categoryMap = {
      'photography': '/photography-request',
      'videography': '/videography-request',
      'catering': '/catering-request',
      'dj': '/dj-request',
      'florist': '/florist-request',
      'beauty': '/hair-and-makeup-request',
      'planning': '/wedding-planning-request'
    };

    const requestPath = categoryMap[category.id];
    if (requestPath) {
      navigate(requestPath, {
        state: {
          weddingData: weddingData,
          category: category
        }
      });
    } else {
      // For categories without specific request forms, use the master request flow
      navigate('/master-request-flow', {
        state: {
          weddingData: weddingData,
          selectedCategory: category
        }
      });
    }
  };

  const getVendorsByCategory = (categoryId) => {
    return vendors.filter(vendor => vendor.category === categoryId);
  };

  const getBidsByCategory = (categoryId) => {
    return bids.filter(bid => bid.service_requests?.category === categoryId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'declined': return '#ef4444';
      case 'contacted': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return 'fas fa-check-circle';
      case 'pending': return 'fas fa-clock';
      case 'declined': return 'fas fa-times-circle';
      case 'contacted': return 'fas fa-phone';
      default: return 'fas fa-question-circle';
    }
  };

  const getInterestLevelText = (rating) => {
    switch (rating) {
      case 1: return 'Not Interested';
      case 2: return 'Low Interest';
      case 3: return 'Somewhat Interested';
      case 4: return 'Very Interested';
      case 5: return 'Highly Interested';
      default: return 'No Rating';
    }
  };

  // Helper function to safely parse contact information
  const parseContactInfo = (contactInfo) => {
    if (!contactInfo || typeof contactInfo !== 'string') {
      return [];
    }
    
    try {
      return contactInfo.split(', ').map(contact => {
        const parts = contact.split(': ');
        return {
          type: parts[0] || 'other',
          value: parts[1] || ''
        };
      }).filter(contact => contact.value.trim() !== '');
    } catch (error) {
      console.error('Error parsing contact info:', error);
      return [];
    }
  };

  // Helper function to get contact icon
  const getContactIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'email': return 'fas fa-envelope';
      case 'phone': return 'fas fa-phone';
      case 'website': return 'fas fa-globe';
      case 'instagram': return 'fab fa-instagram';
      case 'facebook': return 'fab fa-facebook';
      case 'twitter': return 'fab fa-twitter';
      case 'linkedin': return 'fab fa-linkedin';
      default: return 'fas fa-info-circle';
    }
  };

  // Bid action handlers
  const handleApprove = async (bidId) => {
    try {
      const { error } = await supabase
        .from('bids')
        .update({ status: 'approved' })
        .eq('id', bidId);

      if (error) throw error;
      
      setBids(bids.map(bid => 
        bid.id === bidId ? { ...bid, status: 'approved' } : bid
      ));
      toast.success('Bid approved!');
    } catch (error) {
      console.error('Error approving bid:', error);
      toast.error('Failed to approve bid');
    }
  };

  const handleDeny = async (bidId) => {
    try {
      const { error } = await supabase
        .from('bids')
        .update({ status: 'denied' })
        .eq('id', bidId);

      if (error) throw error;
      
      setBids(bids.map(bid => 
        bid.id === bidId ? { ...bid, status: 'denied' } : bid
      ));
      toast.success('Bid denied');
    } catch (error) {
      console.error('Error denying bid:', error);
      toast.error('Failed to deny bid');
    }
  };

  const handleInterested = async (bidId) => {
    try {
      // Find the current bid to check its status
      const currentBid = bids.find(bid => bid.id === bidId);
      const newStatus = currentBid.status === 'interested' ? 'pending' : 'interested';
      
      const { error } = await supabase
        .from('bids')
        .update({ status: newStatus })
        .eq('id', bidId);

      if (error) throw error;
      
      setBids(bids.map(bid => 
        bid.id === bidId ? { ...bid, status: newStatus } : bid
      ));
      
      const message = newStatus === 'interested' ? 'Marked as interested!' : 'Moved back to pending';
      toast.success(message);
    } catch (error) {
      console.error('Error updating bid status:', error);
      toast.error('Failed to update bid status');
    }
  };

  const handlePending = async (bid) => {
    try {
      const { error } = await supabase
        .from('bids')
        .update({ status: 'pending' })
        .eq('id', bid.id);

      if (error) throw error;
      
      setBids(bids.map(b => 
        b.id === bid.id ? { ...b, status: 'pending' } : b
      ));
      toast.success('Moved to pending');
    } catch (error) {
      console.error('Error moving to pending:', error);
      toast.error('Failed to update bid status');
    }
  };

  const handleMessage = (chatData) => {
    console.log('VendorManager handleMessage called with chatData:', chatData);
    
    // For mobile, switch to the messaging tab in the dashboard
    if (window.innerWidth <= 768) {
      // Transform the chatData to the format expected by DashboardMessaging
      // BidDisplay passes: { id, name, profileImage }
      // DashboardMessaging expects: business_id (just the ID)
      const businessId = chatData.id;
      console.log('Extracted businessId:', businessId);
      
      // Switch to messaging tab instead of navigating
      if (onUpdate) {
        onUpdate({ type: 'switchTab', tab: 'messaging', chatData: businessId });
      }
    } else {
      // For desktop, handle messaging - this will be passed to the parent component
      if (onUpdate) {
        onUpdate({ type: 'message', data: chatData });
      }
    }
  };

  const handlePayNow = (bid) => {
    // Handle payment - navigate to payment page
    navigate('/payment', { state: { bid } });
  };

  const handleScheduleConsultation = (consultationData) => {
    toast.success('Consultation scheduled successfully!');
  };

  // Bid rating and notes functions
  const handleBidRating = async (bidId, rating) => {
    try {
      const { error } = await supabase
        .from('bids')
        .update({ 
          interest_rating: rating,
          updated_at: new Date().toISOString()
        })
        .eq('id', bidId);

      if (error) throw error;
      
      setBids(bids.map(bid => 
        bid.id === bidId ? { ...bid, interest_rating: rating } : bid
      ));
      toast.success('Interest rating updated!');
    } catch (error) {
      console.error('Error updating bid rating:', error);
      toast.error('Failed to update interest rating');
    }
  };

  const handleBidNotes = async (bidId, notes) => {
    try {
      const { error } = await supabase
        .from('bids')
        .update({ 
          client_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', bidId);

      if (error) throw error;
      
      setBids(bids.map(bid => 
        bid.id === bidId ? { ...bid, client_notes: notes } : bid
      ));
      toast.success('Notes saved!');
    } catch (error) {
      console.error('Error updating bid notes:', error);
      toast.error('Failed to save notes');
    }
  };

  const openBidNotes = (bid) => {
    setSelectedBid(bid);
    setBidNotes(bid.client_notes || '');
    setBidInterestRating(bid.interest_rating || 0);
    setShowBidNotes(true);
  };

  const saveBidNotes = async () => {
    if (!selectedBid) return;
    
    await handleBidNotes(selectedBid.id, bidNotes);
    await handleBidRating(selectedBid.id, bidInterestRating);
    setShowBidNotes(false);
    setSelectedBid(null);
  };

  if (compact) {
    const confirmedVendors = vendors.filter(v => v.status === 'confirmed').length;
    const totalVendors = vendors.length;
    
    return (
      <div className="vendor-manager-compact">
        <div className="vendor-summary">
          <div className="vendor-count">
            <span className="count-number">{confirmedVendors}</span>
            <span className="count-label">Confirmed</span>
          </div>
          <div className="vendor-count">
            <span className="count-number">{totalVendors}</span>
            <span className="count-label">Total</span>
          </div>
        </div>
        <div className="vendor-progress">
          <div 
            className="progress-bar" 
            style={{ width: `${totalVendors > 0 ? (confirmedVendors / totalVendors) * 100 : 0}%` }}
          ></div>
        </div>
        <button 
          className="add-vendor-btn-compact"
          onClick={() => setShowAddVendor(true)}
        >
          <i className="fas fa-plus"></i>
          Add Vendor
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="vendor-manager-loading">
        <div className="loading-spinner"></div>
        <p>Loading vendors...</p>
      </div>
    );
  }

  return (
    <div className="vendor-manager">
      <div className="vendor-manager-header">
        <h2>Vendor Management</h2>
        <div className="vendor-manager-actions">
          <button 
            className="manage-categories-btn"
            onClick={() => setShowCategoryManager(true)}
          >
            <i className="fas fa-tags"></i>
            Manage Categories
          </button>
          <button 
            className="add-vendor-btn"
            onClick={() => setShowAddVendor(true)}
          >
            <i className="fas fa-plus"></i>
            Add Vendor
          </button>
        </div>
      </div>

      <div className="vendor-categories-vendor-manager">
        {vendorCategories.map(category => {
          const categoryVendors = getVendorsByCategory(category.id);
          const categoryBids = getBidsByCategory(category.id);
          const confirmedCount = categoryVendors.filter(v => v.status === 'confirmed').length;
          const approvedBidsCount = categoryBids.filter(b => b.status === 'approved').length;
          
          return (
            <div key={category.id}>
              <div 
                className={`vendor-category ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
              >
                <div className="category-icon" style={{ backgroundColor: category.color }}>
                  <i className={category.icon}></i>
                </div>
                <div className="category-info">
                  <h3>{category.name}</h3>
                  <p>
                    {categoryVendors.length} vendors • {confirmedCount} confirmed
                    {categoryBids.length > 0 && ` • ${categoryBids.length} bids • ${approvedBidsCount} approved`}
                  </p>
                </div>
                <div className="category-actions-vendor-manager">
                  <button 
                    className="request-bids-btn-vendor-manager"
                    onClick={(e) => {
                      e.stopPropagation();
                      requestBidsFromVendors(category);
                    }}
                  >
                    Request Bids
                  </button>
                  <button 
                    className="remove-category-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomCategory(category.id);
                    }}
                    title="Remove category"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
              
              {selectedCategory === category.id && (
                <div className="vendor-list-vendor-manager">
                  <h3>{category.name} Vendors & Bids</h3>
                  
                  {/* Show bids first */}
                  {categoryBids.length > 0 && (
                    <div className="bids-section">
                      <h4>Received Bids ({categoryBids.length})</h4>
                      <div className="bids-grid">
                        {categoryBids.map(bid => (
                          <div key={bid.id} className="bid-display-wrapper">
                            {/* Bid Interest Rating and Notes */}
                            <div className="bid-client-controls">
                              <div className="bid-interest-rating">
                                <span className="interest-label">Your Interest:</span>
                                <div className="star-rating">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      className={`star-btn ${star <= (bid.interest_rating || 0) ? 'filled' : 'empty'}`}
                                      onClick={() => handleBidRating(bid.id, star)}
                                      title={getInterestLevelText(star)}
                                    >
                                      <i className="fas fa-star"></i>
                                    </button>
                                  ))}
                                </div>
                                <span className="rating-text">
                                  {getInterestLevelText(bid.interest_rating || 0)}
                                </span>
                              </div>
                              <button
                                className="bid-notes-btn"
                                onClick={() => openBidNotes(bid)}
                                title={bid.client_notes ? "View and edit notes" : "Add notes"}
                              >
                                <i className="fas fa-sticky-note"></i>
                                {bid.client_notes ? 'Show Notes' : 'Add Notes'}
                              </button>
                            </div>
                          
                            
                            <BidDisplay
                              bid={bid}
                              handleApprove={handleApprove}
                              handleDeny={handleDeny}
                              handleInterested={handleInterested}
                              handlePending={handlePending}
                              showActions={true}
                              showPaymentOptions={bid.status === 'approved'}
                              showReopen={false}
                              showInterested={bid.status === 'interested'}
                              showNotInterested={bid.status === 'denied'}
                              showPending={bid.status === 'pending'}
                              showApproved={bid.status === 'approved'}
                              onMessage={handleMessage}
                              onPayNow={handlePayNow}
                              onScheduleConsultation={handleScheduleConsultation}
                              currentUserId={currentUserId}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show manual vendors */}
                  {categoryVendors.length > 0 && (
                    <div className="vendors-section">
                      <h4>Manual Vendors ({categoryVendors.length})</h4>
                      <div className="vendors-grid">
                        {categoryVendors.map(vendor => (
                          <div key={vendor.id} className="vendor-card-vendor-manager">
                            <div className="vendor-header">
                              <div className="vendor-info">
                                <h4>{vendor.name}</h4>
                                <div className="vendor-contact-info">
                                  {parseContactInfo(vendor.contact_info).map((contact, index) => (
                                    <div key={index} className="contact-item">
                                      <i className={getContactIcon(contact.type)}></i>
                                      <span>{contact.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="vendor-status">
                                <span 
                                  className="status-badge"
                                  style={{ backgroundColor: getStatusColor(vendor.status) }}
                                >
                                  <i className={getStatusIcon(vendor.status)}></i>
                                  {vendor.status}
                                </span>
                              </div>
                            </div>
                            
                            {/* Pricing and Rating Row */}
                            {(vendor.pricing || vendor.rating || vendor.is_booked) && (
                              <div className="vendor-details">
                                {vendor.pricing && (
                                  <div className="vendor-pricing">
                                    <i className="fas fa-dollar-sign"></i>
                                    <span>{vendor.pricing}</span>
                                  </div>
                                )}
                                {vendor.rating && vendor.rating > 0 && (
                                  <div className="vendor-rating">
                                    <span className="interest-label">Interest:</span>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        className={`star-btn ${star <= vendor.rating ? 'filled' : 'empty'}`}
                                        onClick={() => updateVendorRating(vendor.id, star)}
                                        title={getInterestLevelText(star)}
                                      >
                                        <i className="fas fa-star"></i>
                                      </button>
                                    ))}
                                    <span className="rating-number">({vendor.rating}/5 - {getInterestLevelText(vendor.rating)})</span>
                                  </div>
                                )}
                                {(!vendor.rating || vendor.rating === 0) && (
                                  <div className="vendor-rating">
                                    <span className="interest-label">Interest:</span>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        className="star-btn empty"
                                        onClick={() => updateVendorRating(vendor.id, star)}
                                        title={getInterestLevelText(star)}
                                      >
                                        <i className="fas fa-star"></i>
                                      </button>
                                    ))}
                                    <span className="rating-number">(No rating)</span>
                                  </div>
                                )}
                                {vendor.is_booked && (
                                  <div className="vendor-booked">
                                    <i className="fas fa-check-circle"></i>
                                    <span>Booked</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {vendor.notes && (
                              <div className="vendor-notes">
                                <p>{vendor.notes}</p>
                              </div>
                            )}
                            
                            <div className="vendor-actions">
                              <select 
                                value={vendor.status}
                                onChange={(e) => updateVendorStatus(vendor.id, e.target.value)}
                                className="status-select"
                              >
                                <option value="pending">Pending</option>
                                <option value="contacted">Contacted</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="declined">Declined</option>
                              </select>
                              
                              <div className="vendor-action-buttons">
                                <button 
                                  className="edit-vendor-btn"
                                  onClick={() => {
                                    setEditingVendor(vendor);
                                    setShowEditVendor(true);
                                  }}
                                  title="Edit vendor"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                
                                <button 
                                  className="delete-vendor-btn"
                                  onClick={() => deleteVendor(vendor.id)}
                                  title="Delete vendor"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show message when no vendors or bids */}
                  {categoryVendors.length === 0 && categoryBids.length === 0 && (
                    <div className="no-vendors">
                      <p>No vendors or bids yet for this category.</p>
                      <button 
                        className="request-bids-btn-vendor-manager"
                        onClick={() => requestBidsFromVendors(category)}
                      >
                        Request Bids from Vendors
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAddVendor && (
        <div className="modal-overlay" onClick={() => setShowAddVendor(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Vendor</h3>
            <AddVendorForm 
              onSubmit={addVendor}
              onCancel={() => setShowAddVendor(false)}
              categories={vendorCategories}
            />
          </div>
        </div>
      )}

      {showEditVendor && editingVendor && (
        <div className="modal-overlay" onClick={() => setShowEditVendor(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Vendor</h3>
            <EditVendorForm 
              vendor={editingVendor}
              onSubmit={editVendor}
              onCancel={() => {
                setShowEditVendor(false);
                setEditingVendor(null);
              }}
              categories={vendorCategories}
            />
          </div>
        </div>
      )}

      {showCategoryManager && (
        <div className="modal-overlay" onClick={() => setShowCategoryManager(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Manage Categories</h3>
            <CategoryManager 
              onSubmit={addCustomCategory}
              onCancel={() => setShowCategoryManager(false)}
              customCategories={customCategories}
              onRemoveCategory={removeCustomCategory}
              onUnhideCategory={unhideCategory}
            />
          </div>
        </div>
      )}

      {/* Bid Notes Modal */}
      {showBidNotes && selectedBid && (
        <div className="modal-overlay" onClick={() => setShowBidNotes(false)}>
          <div className="modal-content bid-notes-modal" onClick={(e) => e.stopPropagation()}>
            <h3>View & Edit Bid Notes</h3>
            <div className="bid-notes-content">
              <div className="business-info-summary">
                <h4>{selectedBid.business_profiles?.business_name}</h4>
                <p className="bid-amount">${selectedBid.bid_amount}</p>
              </div>
              
              <div className="interest-rating-section">
                <label>Your Interest Level:</label>
                <div className="star-rating-large">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`star-btn-large ${star <= bidInterestRating ? 'filled' : 'empty'}`}
                      onClick={() => setBidInterestRating(star)}
                      title={getInterestLevelText(star)}
                    >
                      <i className="fas fa-star"></i>
                    </button>
                  ))}
                </div>
                <span className="rating-description">
                  {getInterestLevelText(bidInterestRating)}
                </span>
              </div>
              
              <div className="notes-section">
                <label htmlFor="bid-notes">Your Notes:</label>
                <textarea
                  id="bid-notes"
                  value={bidNotes}
                  onChange={(e) => setBidNotes(e.target.value)}
                  placeholder="Add your thoughts about this bid, questions to ask, pros/cons, etc..."
                  rows={6}
                  className="bid-notes-textarea"
                />
              </div>
              
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowBidNotes(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={saveBidNotes}
                >
                  Save Notes & Rating
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add Vendor Form Component
function AddVendorForm({ onSubmit, onCancel, categories }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    contact_info: [],
    notes: '',
    pricing: '',
    rating: 0,
    is_booked: false
  });

  const getInterestLevelText = (rating) => {
    switch (rating) {
      case 1: return 'Not Interested';
      case 2: return 'Low Interest';
      case 3: return 'Somewhat Interested';
      case 4: return 'Very Interested';
      case 5: return 'Highly Interested';
      default: return '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Vendor name is required');
      return;
    }
    
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    // Filter out empty contact info entries
    const validContactInfo = formData.contact_info.filter(contact => 
      contact.value && contact.value.trim() !== ''
    );

    // Convert contact_info array to a formatted string for database storage
    const contactInfoString = validContactInfo
      .map(contact => `${contact.type}: ${contact.value}`)
      .join(', ');
    
    onSubmit({
      ...formData,
      contact_info: contactInfoString
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleRatingChange = (rating) => {
    setFormData({
      ...formData,
      rating: rating
    });
  };

  const addContactInfo = () => {
    setFormData({
      ...formData,
      contact_info: [...formData.contact_info, { type: 'email', value: '' }]
    });
  };

  const removeContactInfo = (index) => {
    const updatedContacts = formData.contact_info.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      contact_info: updatedContacts
    });
  };

  const updateContactInfo = (index, field, value) => {
    const updatedContacts = formData.contact_info.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    );
    setFormData({
      ...formData,
      contact_info: updatedContacts
    });
  };

  const contactTypes = [
    { value: 'email', label: 'Email', icon: 'fas fa-envelope' },
    { value: 'phone', label: 'Phone', icon: 'fas fa-phone' },
    { value: 'website', label: 'Website', icon: 'fas fa-globe' },
    { value: 'instagram', label: 'Instagram', icon: 'fab fa-instagram' },
    { value: 'facebook', label: 'Facebook', icon: 'fab fa-facebook' },
    { value: 'twitter', label: 'Twitter', icon: 'fab fa-twitter' },
    { value: 'linkedin', label: 'LinkedIn', icon: 'fab fa-linkedin' },
    { value: 'other', label: 'Other', icon: 'fas fa-info-circle' }
  ];

  return (
    <form onSubmit={handleSubmit} className="add-vendor-form">
      <div className="form-group">
        <label htmlFor="name">Vendor Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Contact Information</label>
        <div className="contact-info-container">
          {formData.contact_info.length === 0 ? (
            <div className="no-contacts">
              <p>No contact information added yet.</p>
            </div>
          ) : (
            formData.contact_info.map((contact, index) => (
              <div key={index} className="contact-info-item">
                <div className="contact-type-select">
                  <select
                    value={contact.type}
                    onChange={(e) => updateContactInfo(index, 'type', e.target.value)}
                  >
                    {contactTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="contact-value-input">
                  <input
                    type="text"
                    value={contact.value}
                    onChange={(e) => updateContactInfo(index, 'value', e.target.value)}
                    placeholder={`Enter ${contact.type}...`}
                  />
                </div>
                <button
                  type="button"
                  className="remove-contact-btn"
                  onClick={() => removeContactInfo(index)}
                  title="Remove contact"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))
          )}
          <button
            type="button"
            className="add-contact-btn"
            onClick={addContactInfo}
          >
            <i className="fas fa-plus"></i>
            Add Contact Information
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="pricing">Pricing</label>
        <input
          type="text"
          id="pricing"
          name="pricing"
          value={formData.pricing}
          onChange={handleChange}
          placeholder="e.g., $2,500, $1,200-$1,800, or 'Contact for quote'"
        />
      </div>

      <div className="form-group">
        <label>Interest Level</label>
        <div className="rating-input">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`star-btn ${star <= formData.rating ? 'filled' : ''}`}
              onClick={() => handleRatingChange(star)}
            >
              <i className="fas fa-star"></i>
            </button>
          ))}
          <span className="rating-text">
            {formData.rating > 0 ? `${formData.rating}/5 - ${getInterestLevelText(formData.rating)}` : 'No rating'}
          </span>
        </div>
      </div>

      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="is_booked"
            checked={formData.is_booked}
            onChange={handleChange}
          />
          <span className="checkmark"></span>
          Already booked this vendor
        </label>
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any additional notes about this vendor"
          rows="3"
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="cancel-btn">
          Cancel
        </button>
        <button type="submit" className="submit-btn">
          Add Vendor
        </button>
      </div>
    </form>
  );
}

// Edit Vendor Form Component
function EditVendorForm({ vendor, onSubmit, onCancel, categories }) {
  const [formData, setFormData] = useState({
    name: vendor.name || '',
    category: vendor.category || '',
    contact_info: parseContactInfo(vendor.contact_info),
    notes: vendor.notes || '',
    pricing: vendor.pricing || '',
    rating: vendor.rating || 0,
    is_booked: vendor.is_booked || false
  });

  // Helper function to safely parse contact_info
  function parseContactInfo(contactInfo) {
    if (!contactInfo || typeof contactInfo !== 'string') {
      return [];
    }
    
    try {
      return contactInfo.split(', ').map(contact => {
        const parts = contact.split(': ');
        return {
          type: parts[0] || 'email',
          value: parts[1] || ''
        };
      }).filter(contact => contact.value.trim() !== '');
    } catch (error) {
      console.error('Error parsing contact info:', error);
      return [];
    }
  }

  const getInterestLevelText = (rating) => {
    switch (rating) {
      case 1: return 'Not Interested';
      case 2: return 'Low Interest';
      case 3: return 'Somewhat Interested';
      case 4: return 'Very Interested';
      case 5: return 'Highly Interested';
      default: return '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Vendor name is required');
      return;
    }
    
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    // Filter out empty contact info entries
    const validContactInfo = formData.contact_info.filter(contact => 
      contact.value && contact.value.trim() !== ''
    );

    // Convert contact_info array to a formatted string for database storage
    const contactInfoString = validContactInfo
      .map(contact => `${contact.type}: ${contact.value}`)
      .join(', ');
    
    onSubmit({
      ...formData,
      contact_info: contactInfoString
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleRatingChange = (rating) => {
    setFormData({
      ...formData,
      rating: rating
    });
  };

  const addContactInfo = () => {
    setFormData({
      ...formData,
      contact_info: [...formData.contact_info, { type: 'email', value: '' }]
    });
  };

  const removeContactInfo = (index) => {
    const updatedContacts = formData.contact_info.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      contact_info: updatedContacts
    });
  };

  const updateContactInfo = (index, field, value) => {
    const updatedContacts = formData.contact_info.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    );
    setFormData({
      ...formData,
      contact_info: updatedContacts
    });
  };

  const contactTypes = [
    { value: 'email', label: 'Email', icon: 'fas fa-envelope' },
    { value: 'phone', label: 'Phone', icon: 'fas fa-phone' },
    { value: 'website', label: 'Website', icon: 'fas fa-globe' },
    { value: 'instagram', label: 'Instagram', icon: 'fab fa-instagram' },
    { value: 'facebook', label: 'Facebook', icon: 'fab fa-facebook' },
    { value: 'twitter', label: 'Twitter', icon: 'fab fa-twitter' },
    { value: 'linkedin', label: 'LinkedIn', icon: 'fab fa-linkedin' },
    { value: 'other', label: 'Other', icon: 'fas fa-info-circle' }
  ];

  return (
    <form onSubmit={handleSubmit} className="edit-vendor-form">
      <div className="form-group">
        <label htmlFor="name">Vendor Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Contact Information</label>
        <div className="contact-info-container">
          {formData.contact_info.length === 0 ? (
            <div className="no-contacts">
              <p>No contact information added yet.</p>
            </div>
          ) : (
            formData.contact_info.map((contact, index) => (
              <div key={index} className="contact-info-item">
                <div className="contact-type-select">
                  <select
                    value={contact.type}
                    onChange={(e) => updateContactInfo(index, 'type', e.target.value)}
                  >
                    {contactTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="contact-value-input">
                  <input
                    type="text"
                    value={contact.value}
                    onChange={(e) => updateContactInfo(index, 'value', e.target.value)}
                    placeholder={`Enter ${contact.type}...`}
                  />
                </div>
                <button
                  type="button"
                  className="remove-contact-btn"
                  onClick={() => removeContactInfo(index)}
                  title="Remove contact"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))
          )}
          <button
            type="button"
            className="add-contact-btn"
            onClick={addContactInfo}
          >
            <i className="fas fa-plus"></i>
            Add Contact Information
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="pricing">Pricing</label>
        <input
          type="text"
          id="pricing"
          name="pricing"
          value={formData.pricing}
          onChange={handleChange}
          placeholder="e.g., $2,500, $1,200-$1,800, or 'Contact for quote'"
        />
      </div>

      <div className="form-group">
        <label>Interest Level</label>
        <div className="rating-input">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`star-btn ${star <= formData.rating ? 'filled' : ''}`}
              onClick={() => handleRatingChange(star)}
            >
              <i className="fas fa-star"></i>
            </button>
          ))}
          <span className="rating-text">
            {formData.rating > 0 ? `${formData.rating}/5 - ${getInterestLevelText(formData.rating)}` : 'No rating'}
          </span>
        </div>
      </div>

      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="is_booked"
            checked={formData.is_booked}
            onChange={handleChange}
          />
          <span className="checkmark"></span>
          Already booked this vendor
        </label>
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any additional notes about this vendor"
          rows="3"
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="cancel-btn">
          Cancel
        </button>
        <button type="submit" className="submit-btn">
          Update Vendor
        </button>
      </div>
    </form>
  );
}

// Category Manager Component
function CategoryManager({ onSubmit, onCancel, customCategories, onRemoveCategory, onUnhideCategory }) {
  const [formData, setFormData] = useState({
    name: '',
    icon: 'fas fa-tag',
    color: '#667eea'
  });

  const iconOptions = [
    { value: 'fas fa-tag', label: 'Tag' },
    { value: 'fas fa-star', label: 'Star' },
    { value: 'fas fa-heart', label: 'Heart' },
    { value: 'fas fa-gem', label: 'Gem' },
    { value: 'fas fa-crown', label: 'Crown' },
    { value: 'fas fa-trophy', label: 'Trophy' },
    { value: 'fas fa-medal', label: 'Medal' },
    { value: 'fas fa-award', label: 'Award' },
    { value: 'fas fa-certificate', label: 'Certificate' },
    { value: 'fas fa-badge', label: 'Badge' },
    { value: 'fas fa-ribbon', label: 'Ribbon' },
    { value: 'fas fa-flag', label: 'Flag' }
  ];

  const colorOptions = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a',
    '#a8edea', '#ffecd2', '#fc466b', '#ff9a9e', '#8b5cf6', '#06b6d4',
    '#10b981', '#f59e0b', '#ef4444', '#84cc16', '#f97316', '#ec4899'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="category-manager">
      <div className="add-category-section">
        <h4>Add New Category</h4>
        <form onSubmit={handleSubmit} className="add-category-form">
          <div className="form-group">
            <label htmlFor="name">Category Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Wedding Planner, Cake Baker"
              required
            />
          </div>

          <div className="form-group">
            <label>Icon</label>
            <div className="icon-selector">
              {iconOptions.map(icon => (
                <button
                  key={icon.value}
                  type="button"
                  className={`icon-option ${formData.icon === icon.value ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, icon: icon.value })}
                  title={icon.label}
                >
                  <i className={icon.value}></i>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-selector">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${formData.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color: color })}
                  title={color}
                ></button>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Add Category
            </button>
          </div>
        </form>
      </div>

      {customCategories.length > 0 && (
        <div className="custom-categories-section">
          <h4>Custom Categories</h4>
          <div className="custom-categories-list">
            {customCategories.filter(cat => cat.is_custom).map(category => (
              <div key={category.id || category.category_id} className="custom-category-item">
                <div className="category-preview">
                  <div className="category-icon" style={{ backgroundColor: category.color || category.category_color }}>
                    <i className={category.icon || category.category_icon}></i>
                  </div>
                  <span className="category-name">{category.name || category.category_name}</span>
                </div>
                <button
                  className="remove-category-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCategory(category.id || category.category_id);
                  }}
                  title="Remove category"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden Categories Section */}
      {customCategories.filter(cat => cat.is_hidden && !cat.is_custom).length > 0 && (
        <div className="hidden-categories-section">
          <h4>Hidden Categories</h4>
          <p className="section-description">These default categories are currently hidden. You can unhide them to make them visible again.</p>
          <div className="hidden-categories-list">
            {customCategories.filter(cat => cat.is_hidden && !cat.is_custom).map(category => (
              <div key={category.id || category.category_id} className="hidden-category-item">
                <div className="category-preview">
                  <div className="category-icon" style={{ backgroundColor: category.color || category.category_color }}>
                    <i className={category.icon || category.category_icon}></i>
                  </div>
                  <span className="category-name">{category.name || category.category_name}</span>
                  <span className="hidden-badge">Hidden</span>
                </div>
                <button
                  className="unhide-category-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnhideCategory(category.id || category.category_id);
                  }}
                  title="Unhide category"
                >
                  <i className="fas fa-eye"></i>
                  Unhide
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorManager; 