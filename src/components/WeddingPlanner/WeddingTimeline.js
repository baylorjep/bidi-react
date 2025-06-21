import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './WeddingTimeline.css';

function WeddingTimeline({ weddingData, onUpdate, compact }) {
  const [timelineItems, setTimelineItems] = useState({ dayOf: [], preparation: [] });
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [activeTimeline, setActiveTimeline] = useState('dayOf'); // 'dayOf' or 'preparation'
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareError, setShareError] = useState('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [newItem, setNewItem] = useState({
    time: '',
    activity: '',
    description: '',
    phase: 'ceremony',
    duration: 60,
    responsible: '',
    location: '',
    date: '',
    completed: false,
    dateType: 'relative',
    specificDate: ''
  });

  // Timeline phases for day-of
  const dayOfPhases = [
    { id: 'ceremony', name: 'Ceremony', color: '#ec4899', icon: 'fas fa-church' },
    { id: 'cocktail', name: 'Cocktail Hour', color: '#8b5cf6', icon: 'fas fa-glass-martini-alt' },
    { id: 'reception', name: 'Reception', color: '#10b981', icon: 'fas fa-champagne-glasses' }, 
    { id: 'dinner', name: 'Dinner', color: '#f59e0b', icon: 'fas fa-utensils' },
    { id: 'dancing', name: 'Dancing', color: '#ef4444', icon: 'fas fa-music' },
    { id: 'sendoff', name: 'Send-off', color: '#6366f1', icon: 'fas fa-star' }
  ];

  // Timeline phases for preparation  
  const preparationPhases = [
    { id: 'planning', name: 'Planning', color: '#fbbf24', icon: 'fas fa-clipboard-list' },
    { id: 'booking', name: 'Booking', color: '#8b5cf6', icon: 'fas fa-calendar-check' },
    { id: 'shopping', name: 'Shopping', color: '#ec4899', icon: 'fas fa-shopping-bag' },
    { id: 'meetings', name: 'Meetings', color: '#10b981', icon: 'fas fa-handshake' },
    { id: 'rehearsal', name: 'Rehearsal', color: '#f59e0b', icon: 'fas fa-theater-masks' },
    { id: 'final', name: 'Final Prep', color: '#ef4444', icon: 'fas fa-magic' }
  ];

  // Load timeline items from database
  useEffect(() => {
    const loadTimelineItems = async () => {
      if (!weddingData?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('wedding_timeline_items')
          .select('*')
          .eq('wedding_id', weddingData.id)
          .order('due_date', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // Convert database items to our format
          const dayOfItems = data.filter(item => item.category === 'dayOf').map(item => {
            // Parse title to extract time and activity
            const titleParts = item.title.split(' ');
            const time = titleParts[0] && titleParts[0].includes(':') ? titleParts[0] : '';
            const activity = time ? titleParts.slice(1).join(' ') : item.title;
            
            return {
              id: item.id,
              time: time,
              activity: activity,
              description: item.description || '',
              phase: item.priority || 'ceremony',
              duration: 60,
              responsible: item.responsible || '',
              location: item.location || '',
              date: '',
              completed: item.completed || false
            };
          });

          const preparationItems = data.filter(item => item.category === 'preparation').map(item => {
            // Use display_date if available, otherwise fall back to formatting due_date
            let displayDate = '';
            if (item.display_date) {
              displayDate = item.display_date;
            } else if (item.due_date) {
              displayDate = formatDateForDisplay(item.due_date);
            }
            
            return {
              id: item.id,
              time: '',
              activity: item.title,
              description: item.description || '',
              phase: item.priority || 'planning',
              duration: 0,
              responsible: item.responsible || '',
              location: item.location || '',
              date: displayDate,
              completed: item.completed || false
            };
          });

          setTimelineItems({ 
            dayOf: dayOfItems.sort((a, b) => a.time.localeCompare(b.time)), 
            preparation: preparationItems.sort((a, b) => {
              const months = ['12 months before', '10 months before', '8 months before', '6 months before', '4 months before', '2 months before', '1 month before', '1 week before', '1 day before', 'Wedding Day'];
              return months.indexOf(a.date) - months.indexOf(b.date);
            })
          });
        } else {
          // Only create default timelines if there are no existing items
          // Check if there are any timeline items for this wedding
          const { data: existingData, error: existingError } = await supabase
            .from('wedding_timeline_items')
            .select('id')
            .eq('wedding_id', weddingData.id)
            .limit(1);

          if (existingError) throw existingError;

          // Only create defaults if there are truly no items
          if (!existingData || existingData.length === 0) {
            await setDefaultTimelines();
          } else {
            // Set empty timeline if no items found but some exist (shouldn't happen, but just in case)
            setTimelineItems({ dayOf: [], preparation: [] });
          }
        }
      } catch (error) {
        console.error('Error loading timeline items:', error);
        // Don't create default timelines on error, just set empty state
        setTimelineItems({ dayOf: [], preparation: [] });
      }
    };

    loadTimelineItems();
  }, [weddingData?.id]);

  // Helper function to format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const weddingDate = weddingData?.date ? new Date(weddingData.date) : null;
    
    if (!weddingDate) return dateString;
    
    // Calculate months difference
    const monthsDiff = (weddingDate.getFullYear() - date.getFullYear()) * 12 + 
                      (weddingDate.getMonth() - date.getMonth());
    
    // Calculate days difference for closer dates
    const diffTime = weddingDate.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Handle exact matches for common relative dates
    if (diffDays === 0) return 'Wedding Day';
    if (diffDays === 1) return '1 day before';
    if (diffDays >= 6 && diffDays <= 8) return '1 week before';
    if (monthsDiff === 1) return '1 month before';
    if (monthsDiff === 2) return '2 months before';
    if (monthsDiff === 4) return '4 months before';
    if (monthsDiff === 6) return '6 months before';
    if (monthsDiff === 8) return '8 months before';
    if (monthsDiff === 10) return '10 months before';
    if (monthsDiff === 12) return '12 months before';
    
    // If no exact match, return a more flexible format
    if (monthsDiff > 0) {
      return `${monthsDiff} month${monthsDiff > 1 ? 's' : ''} before`;
    } else if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} before`;
    }
    
    // If it's a future date, format it nicely
    if (diffDays < 0) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    
    return dateString;
  };

  // Scroll detection for sticky header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = 50; // Minimum scroll distance to trigger
      
      // Show header when scrolling up or when at the top
      if (currentScrollY < lastScrollY - scrollThreshold || currentScrollY < 100) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY + scrollThreshold) {
        // Hide header when scrolling down and not at the top
        setIsHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const setDefaultTimelines = async () => {
    const defaultDayOf = [
      { time: '13:00', activity: 'Ceremony Setup', description: 'Venue preparation and guest arrival', phase: 'ceremony', duration: 60, responsible: 'Wedding Coordinator', location: 'Ceremony Venue', date: '', completed: false },
      { time: '14:00', activity: 'Wedding Ceremony', description: 'The main event begins', phase: 'ceremony', duration: 60, responsible: 'Officiant', location: 'Ceremony Venue', date: '', completed: false },
      { time: '15:00', activity: 'Cocktail Hour', description: 'Guests enjoy drinks and appetizers', phase: 'cocktail', duration: 60, responsible: 'Catering Staff', location: 'Cocktail Area', date: '', completed: false },
      { time: '16:00', activity: 'Reception Begins', description: 'Grand entrance and first dance', phase: 'reception', duration: 30, responsible: 'DJ/Band', location: 'Reception Hall', date: '', completed: false },
      { time: '16:30', activity: 'Dinner Service', description: 'Plated dinner or buffet service', phase: 'dinner', duration: 90, responsible: 'Catering Staff', location: 'Reception Hall', date: '', completed: false },
      { time: '18:00', activity: 'Dancing & Celebration', description: 'Open dance floor and party', phase: 'dancing', duration: 180, responsible: 'DJ/Band', location: 'Reception Hall', date: '', completed: false },
      { time: '21:00', activity: 'Wedding Send-off', description: 'Grand exit and farewell', phase: 'sendoff', duration: 30, responsible: 'All Guests', location: 'Venue Exit', date: '', completed: false }
    ];

    const defaultPreparation = [
      { time: '', activity: 'Book Venue', description: 'Secure ceremony and reception venues', phase: 'booking', duration: 0, responsible: 'Couple', location: 'Various Venues', date: '12 months before', completed: false },
      { time: '', activity: 'Hire Vendors', description: 'Photographer, caterer, DJ, florist', phase: 'booking', duration: 0, responsible: 'Couple', location: 'Various', date: '10 months before', completed: false },
      { time: '', activity: 'Dress Shopping', description: 'Bride and bridesmaid dresses', phase: 'shopping', duration: 0, responsible: 'Bride & Bridal Party', location: 'Bridal Shops', date: '8 months before', completed: false },
      { time: '', activity: 'Wedding Rings', description: 'Purchase wedding bands', phase: 'shopping', duration: 0, responsible: 'Couple', location: 'Jewelry Store', date: '6 months before', completed: false },
      { time: '', activity: 'Vendor Meetings', description: 'Finalize details with all vendors', phase: 'meetings', duration: 0, responsible: 'Couple', location: 'Various', date: '2 months before', completed: false },
      { time: '', activity: 'Wedding Rehearsal', description: 'Practice ceremony and dinner', phase: 'rehearsal', duration: 120, responsible: 'Wedding Party', location: 'Venue', date: '1 day before', completed: false },
      { time: '', activity: 'Final Preparations', description: 'Last-minute details and setup', phase: 'final', duration: 0, responsible: 'Wedding Coordinator', location: 'Venue', date: 'Wedding Day', completed: false }
    ];

    try {
      // Save default day-of items to database
      const dayOfItems = [];
      for (const item of defaultDayOf) {
        const dbItem = {
          wedding_id: weddingData.id,
          title: `${item.time} ${item.activity}`,
          description: item.description,
          due_date: weddingData.date,
          completed: item.completed,
          category: 'dayOf',
          priority: item.phase,
          location: item.location,
          responsible: item.responsible
        };

        const { data, error } = await supabase
          .from('wedding_timeline_items')
          .insert(dbItem)
          .select()
          .single();

        if (error) throw error;

        dayOfItems.push({
          id: data.id,
          ...item
        });
      }

      // Save default preparation items to database
      const preparationItems = [];
      for (const item of defaultPreparation) {
        const dbItem = {
          wedding_id: weddingData.id,
          title: item.activity,
          description: item.description,
          due_date: convertDateToActualDate(item.date),
          completed: item.completed,
          category: 'preparation',
          priority: item.phase,
          location: item.location,
          responsible: item.responsible,
          display_date: item.date
        };

        const { data, error } = await supabase
          .from('wedding_timeline_items')
          .insert(dbItem)
          .select()
          .single();

        if (error) throw error;

        preparationItems.push({
          id: data.id,
          ...item,
          date: item.date // Ensure the date field is set for display
        });
      }

      setTimelineItems({ 
        dayOf: dayOfItems.sort((a, b) => a.time.localeCompare(b.time)), 
        preparation: preparationItems.sort((a, b) => {
          const months = ['12 months before', '10 months before', '8 months before', '6 months before', '4 months before', '2 months before', '1 month before', '1 week before', '1 day before', 'Wedding Day'];
          return months.indexOf(a.date) - months.indexOf(b.date);
        })
      });
    } catch (error) {
      console.error('Error creating default timeline items:', error);
      alert('Failed to create default timeline. Please try again.');
    }
  };

  const handleAddItem = async () => {
    if (!newItem.activity) return;
    
    try {
      // Determine the due date based on date type
      let dueDate;
      if (activeTimeline === 'dayOf') {
        dueDate = weddingData.date;
      } else {
        // For preparation timeline
        if (newItem.dateType === 'relative') {
          dueDate = convertDateToActualDate(newItem.date);
        } else {
          dueDate = newItem.specificDate;
        }
      }

      // Prepare the item for database
      const dbItem = {
        wedding_id: weddingData.id,
        title: activeTimeline === 'dayOf' ? `${newItem.time} ${newItem.activity}` : newItem.activity,
        description: newItem.description,
        due_date: dueDate,
        completed: newItem.completed,
        category: activeTimeline,
        priority: newItem.phase,
        location: newItem.location || '',
        responsible: newItem.responsible || '',
        display_date: activeTimeline === 'preparation' ? 
          (newItem.dateType === 'relative' ? newItem.date : formatDateForDisplay(newItem.specificDate)) : 
          null
      };

      // Insert into database
      const { data, error } = await supabase
        .from('wedding_timeline_items')
        .insert(dbItem)
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const item = {
        id: data.id,
        ...newItem,
        // For display purposes, use the display_date if available
        date: activeTimeline === 'preparation' ? 
          (newItem.dateType === 'relative' ? newItem.date : formatDateForDisplay(newItem.specificDate)) : 
          newItem.date
      };
      
      const currentItems = timelineItems[activeTimeline];
      const updatedItems = [...currentItems, item];
      
      if (activeTimeline === 'dayOf') {
        updatedItems.sort((a, b) => a.time.localeCompare(b.time));
      } else {
        // For preparation timeline, sort by date
        updatedItems.sort((a, b) => {
          const months = ['12 months before', '10 months before', '8 months before', '6 months before', '4 months before', '2 months before', '1 month before', '1 week before', '1 day before', 'Wedding Day'];
          return months.indexOf(a.date) - months.indexOf(b.date);
        });
      }
      
      setTimelineItems({
        ...timelineItems,
        [activeTimeline]: updatedItems
      });
      
      setIsAddingItem(false);
      setNewItem({
        time: '',
        activity: '',
        description: '',
        phase: activeTimeline === 'dayOf' ? 'ceremony' : 'planning',
        duration: 60,
        responsible: '',
        location: '',
        date: '',
        dateType: 'relative',
        specificDate: '',
        completed: false
      });
    } catch (error) {
      console.error('Error adding timeline item:', error);
      alert('Failed to add timeline item. Please try again.');
    }
  };

  // Helper function to convert relative dates to actual dates
  const convertDateToActualDate = (relativeDate) => {
    if (!weddingData?.date) return null;
    
    const weddingDate = new Date(weddingData.date);
    const months = {
      '12 months before': 365,
      '10 months before': 300,
      '8 months before': 240,
      '6 months before': 180,
      '4 months before': 120,
      '2 months before': 60,
      '1 month before': 30,
      '1 week before': 7,
      '1 day before': 1,
      'Wedding Day': 0
    };
    
    const daysToSubtract = months[relativeDate] || 0;
    const targetDate = new Date(weddingDate);
    targetDate.setDate(targetDate.getDate() - daysToSubtract);
    
    return targetDate.toISOString().split('T')[0];
  };

  const handleEditItem = (item) => {
    // Determine if this is a relative date or specific date
    let dateType = 'relative';
    let specificDate = '';
    let date = item.date;
    
    if (activeTimeline === 'preparation') {
      // Check if the date is a relative date (contains "before" or "Wedding Day")
      if (item.date && (item.date.includes('before') || item.date === 'Wedding Day')) {
        dateType = 'relative';
        date = item.date;
      } else {
        // It's a specific date, try to parse it
        dateType = 'specific';
        specificDate = item.date || '';
        date = '';
      }
    }
    
    setEditingItem(item);
    setNewItem({
      time: item.time || '',
      activity: item.activity || '',
      description: item.description || '',
      phase: item.phase || (activeTimeline === 'dayOf' ? 'ceremony' : 'planning'),
      duration: item.duration || 60,
      responsible: item.responsible || '',
      location: item.location || '',
      date: date,
      dateType: dateType,
      specificDate: specificDate,
      completed: item.completed || false
    });
    setIsAddingItem(true);
  };

  const handleUpdateItem = async () => {
    if (!newItem.activity) return;
    
    try {
      // Determine the due date based on date type
      let dueDate;
      if (activeTimeline === 'dayOf') {
        dueDate = weddingData.date;
      } else {
        // For preparation timeline
        if (newItem.dateType === 'relative') {
          dueDate = convertDateToActualDate(newItem.date);
        } else {
          dueDate = newItem.specificDate;
        }
      }

      // Prepare the item for database
      const dbItem = {
        title: activeTimeline === 'dayOf' ? `${newItem.time} ${newItem.activity}` : newItem.activity,
        description: newItem.description,
        due_date: dueDate,
        completed: newItem.completed,
        priority: newItem.phase,
        location: newItem.location || '',
        responsible: newItem.responsible || '',
        display_date: activeTimeline === 'preparation' ? 
          (newItem.dateType === 'relative' ? newItem.date : formatDateForDisplay(newItem.specificDate)) : 
          null
      };

      // Check if this is a database record (UUID) or local default item (numeric ID)
      const isDatabaseRecord = typeof editingItem.id === 'string' && editingItem.id.length > 10;
      
      if (isDatabaseRecord) {
        // Update in database
        const { error } = await supabase
          .from('wedding_timeline_items')
          .update(dbItem)
          .eq('id', editingItem.id);

        if (error) throw error;
      }

      // Update local state
      const currentItems = timelineItems[activeTimeline];
      const updatedItems = currentItems.map(item => 
        item.id === editingItem.id 
          ? {
              ...item,
              ...newItem,
              // For display purposes, use the appropriate date format
              date: activeTimeline === 'preparation' ? 
                (newItem.dateType === 'relative' ? newItem.date : formatDateForDisplay(newItem.specificDate)) : 
                newItem.date
            }
          : item
      );
      
      if (activeTimeline === 'dayOf') {
        updatedItems.sort((a, b) => a.time.localeCompare(b.time));
      } else {
        // For preparation timeline, sort by date
        updatedItems.sort((a, b) => {
          const months = ['12 months before', '10 months before', '8 months before', '6 months before', '4 months before', '2 months before', '1 month before', '1 week before', '1 day before', 'Wedding Day'];
          return months.indexOf(a.date) - months.indexOf(b.date);
        });
      }
      
      setTimelineItems({
        ...timelineItems,
        [activeTimeline]: updatedItems
      });
      
      setIsAddingItem(false);
      setEditingItem(null);
      setNewItem({
        time: '',
        activity: '',
        description: '',
        phase: activeTimeline === 'dayOf' ? 'ceremony' : 'planning',
        duration: 60,
        responsible: '',
        location: '',
        date: '',
        dateType: 'relative',
        specificDate: '',
        completed: false
      });
    } catch (error) {
      console.error('Error updating timeline item:', error);
      alert('Failed to update timeline item. Please try again.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      // Check if this is a database record (UUID) or local default item (numeric ID)
      const isDatabaseRecord = typeof itemId === 'string' && itemId.length > 10;
      
      if (isDatabaseRecord) {
        // Delete from database only if it's a database record
        const { error } = await supabase
          .from('wedding_timeline_items')
          .delete()
          .eq('id', itemId);

        if (error) throw error;
      }

      // Update local state (remove from both database and local items)
      const currentItems = timelineItems[activeTimeline];
      const updatedItems = currentItems.filter(item => item.id !== itemId);
      
      setTimelineItems({
        ...timelineItems,
        [activeTimeline]: updatedItems
      });
      
    } catch (error) {
      console.error('Error deleting timeline item:', error);
      alert('Failed to delete timeline item. Please try again.');
    }
  };

  const getPhaseColor = (phaseId) => {
    const phases = activeTimeline === 'dayOf' ? dayOfPhases : preparationPhases;
    const phase = phases.find(p => p.id === phaseId);
    return phase ? phase.color : '#6b7280';
  };

  const getPhaseIcon = (phaseId) => {
    const phases = activeTimeline === 'dayOf' ? dayOfPhases : preparationPhases;
    const phase = phases.find(p => p.id === phaseId);
    return phase ? phase.icon : 'fas fa-calendar-check';
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleCardClick = (itemId) => {
    if (window.innerWidth <= 768) {
      setActiveCard(activeCard === itemId ? null : itemId);
    }
  };

  const toggleCompletion = async (itemId) => {
    const currentItems = timelineItems[activeTimeline];
    const item = currentItems.find(item => item.id === itemId);
    if (!item) return;
    
    const updatedItem = { ...item, completed: !item.completed };
    
    // Check if this is a database record (UUID) or local default item (numeric ID)
    const isDatabaseRecord = typeof itemId === 'string' && itemId.length > 10;
    
    if (isDatabaseRecord) {
      try {
        // Update in database only if it's a database record
        const { error } = await supabase
          .from('wedding_timeline_items')
          .update({ completed: updatedItem.completed })
          .eq('id', itemId);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating completion status:', error);
        return; // Don't update local state if database update fails
      }
    }
    
    // Update local state
    const updatedItems = currentItems.map(item => 
      item.id === itemId ? updatedItem : item
    );
    
    setTimelineItems({
      ...timelineItems,
      [activeTimeline]: updatedItems
    });
  };

  const generateShareLink = async () => {
    setIsGeneratingLink(true);
    setShareError('');
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        setShareError('Please sign in to share your timeline');
        setIsGeneratingLink(false);
        return;
      }

      // Create a unique share ID
      const shareId = `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store the timeline data in a shared timeline table
      const { data: shareData, error: shareError } = await supabase
        .from('shared_timelines')
        .insert({
          share_id: shareId,
          user_id: user.id,
          wedding_id: weddingData?.id || null,
          timeline_data: timelineItems,
          wedding_title: weddingData?.title || 'Our Wedding',
          wedding_date: weddingData?.date || null,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .select()
        .single();

      if (shareError) throw shareError;

      // Generate the share link
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/shared-timeline/${shareId}`;
      setShareLink(link);
      setShowShareModal(true);
      
    } catch (error) {
      console.error('Error generating share link:', error);
      setShareError('Failed to generate share link. Please try again.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard!');
    }
  };

  const shareViaWhatsApp = () => {
    const text = `Check out our wedding timeline: ${shareLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareViaMessenger = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const subject = 'Our Wedding Timeline';
    const body = `Hi! I wanted to share our wedding timeline with you. You can view it here: ${shareLink}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
  };

  const generatePDF = () => {
    const { jsPDF } = require('jspdf');
    const doc = new jsPDF();
    
    // Add wedding title
    const weddingTitle = weddingData?.title || 'Our Wedding Day';
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(weddingTitle, 105, 20, { align: 'center' });
    
    // Add wedding date
    const weddingDate = weddingData?.date ? new Date(weddingData.date).toLocaleDateString() : 'TBD';
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${weddingDate}`, 105, 30, { align: 'center' });
    
    // Add timeline items
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Wedding Day Itinerary', 20, 50);
    
    let yPosition = 65;
    const dayOfItems = timelineItems.dayOf || [];
    
    dayOfItems.forEach((item, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Time
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      const time = formatTime(item.time);
      doc.text(time, 20, yPosition);
      
      // Activity
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(item.activity, 60, yPosition);
      
      // Duration
      if (item.duration > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`(${item.duration} min)`, 150, yPosition);
      }
      
      yPosition += 8;
      
      // Description
      if (item.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(item.description, 60, yPosition);
        yPosition += 6;
      }
      
      // Location and Responsible
      if (item.location || item.responsible) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        let details = '';
        if (item.location) details += `📍 ${item.location}`;
        if (item.responsible) details += details ? ` | 👤 ${item.responsible}` : `👤 ${item.responsible}`;
        doc.text(details, 60, yPosition);
        yPosition += 6;
      }
      
      yPosition += 8;
    });
    
    // Save the PDF
    const fileName = `${weddingTitle.replace(/\s+/g, '_')}_Itinerary.pdf`;
    doc.save(fileName);
  };

  const getCompletionStats = () => {
    const prepItems = timelineItems.preparation || [];
    const completed = prepItems.filter(item => item.completed).length;
    const total = prepItems.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  if (compact) {
    const currentItems = timelineItems[activeTimeline] || [];
    return (
      <div className="timeline-compact">
        <h3>Wedding Timeline</h3>
        <div className="timeline-compact-list">
          {currentItems.slice(0, 5).map((item, index) => (
            <div key={item.id} className="timeline-compact-item">
              <span className="timeline-time">
                {activeTimeline === 'dayOf' ? formatTime(item.time) : item.date}
              </span>
              <span className="timeline-activity">{item.activity}</span>
            </div>
          ))}
          {currentItems.length > 5 && (
            <div className="timeline-more">+{currentItems.length - 5} more events</div>
          )}
        </div>
      </div>
    );
  }

  const currentItems = timelineItems[activeTimeline] || [];
  const currentPhases = activeTimeline === 'dayOf' ? dayOfPhases : preparationPhases;
  const completionStats = getCompletionStats();

  return (
    <div className="wedding-timeline">
      <div className="timeline-header">
        <div className="timeline-header-content">
          <div className="timeline-title-section">
            <h2 style={{fontFamily:'Outfit', fontSize:'2rem'}}>Wedding Timeline</h2>
            <p style={{fontFamily:'Outfit', fontSize:'1rem'}}>Plan your perfect wedding journey</p>
          </div>
          
          <div className="timeline-action-buttons">
            {activeTimeline === 'dayOf' && (
              <button 
                className="action-btn print-btn"
                onClick={generatePDF}
                title="Print Day-of Itinerary"
              >
                <i className="fas fa-print"></i>
              </button>
            )}
            
            <button 
              className="action-btn share-btn"
              onClick={generateShareLink}
              title="Share Timeline"
            >
              <i className="fas fa-share-alt"></i>
            </button>
          </div>
        </div>
        
        <div className="timeline-tabs-container">
          <div className="timeline-tabs">
            <button 
              className={`timeline-tab ${activeTimeline === 'dayOf' ? 'active' : ''}`}
              onClick={() => setActiveTimeline('dayOf')}
            >
              <i className="fas fa-calendar-day"></i>
              <div className="tab-content">
                <span className="tab-title">Day of Wedding</span>
                <span className="tab-description">Ceremony, reception & celebration schedule</span>
              </div>
            </button>
            <button 
              className={`timeline-tab ${activeTimeline === 'preparation' ? 'active' : ''}`}
              onClick={() => setActiveTimeline('preparation')}
            >
              <i className="fas fa-tasks"></i>
              <div className="tab-content">
                <span className="tab-title">Preparation Timeline</span>
                <span className="tab-description">Planning tasks & vendor coordination</span>
                {activeTimeline === 'preparation' && (
                  <span className="completion-badge">
                    {completionStats.completed}/{completionStats.total}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="share-modal-overlay">
          <div className="share-modal">
            <h3>Share Your Timeline</h3>
            <p>Share this link with your wedding party, vendors, or family to collaborate on your timeline:</p>
            
            {shareError && (
              <div className="share-error">
                <i className="fas fa-exclamation-triangle"></i>
                {shareError}
              </div>
            )}
            
            {isGeneratingLink ? (
              <div className="share-loading">
                <div className="loading-spinner"></div>
                <p>Generating your share link...</p>
              </div>
            ) : (
              <>
                <div className="share-link-container">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="share-link-input"
                    placeholder="Share link will appear here..."
                  />
                  <button 
                    className="copy-link-btn"
                    onClick={copyToClipboard}
                    disabled={!shareLink}
                  >
                    <i className="fas fa-copy"></i>
                    Copy
                  </button>
                </div>
                
                <div className="share-options">
                  <button className="share-option" onClick={shareViaWhatsApp}>
                    <i className="fab fa-whatsapp"></i>
                    WhatsApp
                  </button>
                  <button className="share-option" onClick={shareViaMessenger}>
                    <i className="fab fa-facebook-messenger"></i>
                    Messenger
                  </button>
                  <button className="share-option" onClick={shareViaEmail}>
                    <i className="fas fa-envelope"></i>
                    Email
                  </button>
                </div>
                
                <div className="share-info">
                  <p><i className="fas fa-info-circle"></i> This link will expire in 30 days</p>
                  <p><i className="fas fa-users"></i> Anyone with the link can view your timeline</p>
                </div>
              </>
            )}
            
            <button 
              className="close-share-modal"
              onClick={() => {
                setShowShareModal(false);
                setShareError('');
                setShareLink('');
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Preparation Progress Bar */}
      {activeTimeline === 'preparation' && (
        <div className="preparation-progress">
          <div className="progress-header">
            <h3>Preparation Timeline</h3>
            {completionStats.total > 0 ? (
              <span className="progress-percentage">{completionStats.percentage}% Complete</span>
            ) : (
              <span className="progress-percentage">No tasks yet</span>
            )}
          </div>
          {completionStats.total > 0 && (
            <>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${completionStats.percentage}%` }}
                ></div>
              </div>
              <p className="progress-stats">
                {completionStats.completed} of {completionStats.total} tasks completed
              </p>
            </>
          )}
          {completionStats.total === 0 && (
            <p className="progress-stats">
              Start adding preparation tasks to track your wedding planning progress
            </p>
          )}
        </div>
      )}

      {isAddingItem && (
        <div className="timeline-form-overlay">
          <div className="timeline-form">
            <h3>{editingItem ? 'Edit Timeline Item' : 'Add Timeline Item'}</h3>
            
            {activeTimeline === 'dayOf' ? (
              <div className="form-row">
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={newItem.time}
                    onChange={(e) => setNewItem({...newItem, time: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    value={newItem.duration}
                    onChange={(e) => setNewItem({...newItem, duration: parseInt(e.target.value)})}
                    min="15"
                    max="480"
                  />
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label>Date Type</label>
                <select
                  value={newItem.dateType || 'relative'}
                  onChange={(e) => setNewItem({...newItem, dateType: e.target.value})}
                >
                  <option value="relative">Relative to Wedding Day</option>
                  <option value="specific">Specific Date</option>
                </select>
              </div>
            )}

            {activeTimeline === 'preparation' && (
              <div className="form-group">
                <label>When</label>
                {newItem.dateType === 'relative' ? (
                  <select
                    value={newItem.date}
                    onChange={(e) => setNewItem({...newItem, date: e.target.value})}
                  >
                    <option value="">Select timing</option>
                    <option value="12 months before">12 months before</option>
                    <option value="10 months before">10 months before</option>
                    <option value="8 months before">8 months before</option>
                    <option value="6 months before">6 months before</option>
                    <option value="4 months before">4 months before</option>
                    <option value="2 months before">2 months before</option>
                    <option value="1 month before">1 month before</option>
                    <option value="1 week before">1 week before</option>
                    <option value="1 day before">1 day before</option>
                    <option value="Wedding Day">Wedding Day</option>
                  </select>
                ) : (
                  <input
                    type="date"
                    value={newItem.specificDate || ''}
                    onChange={(e) => setNewItem({...newItem, specificDate: e.target.value})}
                  />
                )}
              </div>
            )}

            <div className="form-group">
              <label>Activity</label>
              <input
                type="text"
                value={newItem.activity}
                onChange={(e) => setNewItem({...newItem, activity: e.target.value})}
                placeholder={activeTimeline === 'dayOf' ? "e.g., Wedding Ceremony" : "e.g., Book Venue"}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                placeholder="Brief description of the activity"
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phase</label>
                <select
                  value={newItem.phase}
                  onChange={(e) => setNewItem({...newItem, phase: e.target.value})}
                >
                  {currentPhases.map(phase => (
                    <option key={phase.id} value={phase.id}>
                      {phase.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={newItem.location}
                  onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                  placeholder="e.g., Main Hall"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Responsible Person/Team</label>
              <input
                type="text"
                value={newItem.responsible}
                onChange={(e) => setNewItem({...newItem, responsible: e.target.value})}
                placeholder="e.g., Wedding Coordinator"
              />
            </div>

            <div className="form-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setIsAddingItem(false);
                  setEditingItem(null);
                  setNewItem({
                    time: '',
                    activity: '',
                    description: '',
                    phase: activeTimeline === 'dayOf' ? 'ceremony' : 'planning',
                    duration: 60,
                    responsible: '',
                    location: '',
                    date: '',
                    completed: false,
                    dateType: 'relative',
                    specificDate: ''
                  });
                }}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={editingItem ? handleUpdateItem : handleAddItem}
              >
                {editingItem ? 'Update' : 'Add'} Item
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="timeline-container">
        <div className={`timeline-container-header ${isHeaderVisible ? 'visible' : ''}`}>
          <button 
            className="add-timeline-btn"
            onClick={() => setIsAddingItem(true)}
            title={`Add ${activeTimeline === 'dayOf' ? 'Day-of' : 'Preparation'} Timeline Item`}
          >
            Add 
            <i className="fas fa-plus"></i>
          </button>
        </div>
        
        {currentItems.length === 0 ? (
          <div className="timeline-empty">
            <i className="fas fa-clock"></i>
            <h3>No {activeTimeline === 'dayOf' ? 'day-of' : 'preparation'} timeline items yet</h3>
            <p>Start building your perfect wedding {activeTimeline === 'dayOf' ? 'day schedule' : 'preparation timeline'}</p>
            <button 
              className="create-timeline-btn"
              onClick={async () => await setDefaultTimelines()}
            >
              Use Default Timeline
            </button>
          </div>
        ) : (
          <div className="timeline-list">
            {currentItems.map((item, index) => (
              <div key={item.id} className="timeline-item">
                <div className="timeline-marker" style={{ backgroundColor: getPhaseColor(item.phase) }}>
                  <i className={`timeline-icon ${getPhaseIcon(item.phase)}`}></i>
                </div>
                
                <div 
                  className={`timeline-content ${activeCard === item.id ? 'active' : ''} ${item.completed ? 'completed' : ''}`}
                  onClick={() => handleCardClick(item.id)}
                >
                  <div className="timeline-header">
                    <div className="timeline-time">
                      <span className="time">
                        {activeTimeline === 'dayOf' ? formatTime(item.time) : (item.date || 'No date set')}
                      </span>
                      {activeTimeline === 'dayOf' && item.duration > 0 && (
                        <span className="duration">({item.duration} min)</span>
                      )}
                    </div>
                    <div className="timeline-actions">
                      {activeTimeline === 'preparation' && (
                        <button 
                          className={`completion-btn ${item.completed ? 'completed' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompletion(item.id);
                          }}
                        >
                          <i className={`fas ${item.completed ? 'fa-check-circle' : 'fa-circle'}`}></i>
                        </button>
                      )}
                      <button 
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditItem(item);
                        }}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="delete-btn-timeline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="timeline-activity">{item.activity}</h3>
                  
                  {item.description && (
                    <p className="timeline-description">{item.description}</p>
                  )}
                  
                  <div className="timeline-details">
                    {item.location && (
                      <div className="timeline-detail">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{item.location}</span>
                      </div>
                    )}
                    {item.responsible && (
                      <div className="timeline-detail">
                        <i className="fas fa-user"></i>
                        <span>{item.responsible}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WeddingTimeline; 