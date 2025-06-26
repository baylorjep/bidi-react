import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
import './WeddingTimeline.css';

function WeddingTimeline({ weddingData, onUpdate, compact }) {
  const [timelineItems, setTimelineItems] = useState({ dayOf: [], preparation: [] });
  const [checklistItems, setChecklistItems] = useState([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingChecklistItem, setIsAddingChecklistItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingChecklistItem, setEditingChecklistItem] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [activeTimeline, setActiveTimeline] = useState('dayOf'); // 'dayOf' or 'preparation'
  const [activePreparationView, setActivePreparationView] = useState('timeline'); // 'timeline' or 'checklist'
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
  const [newChecklistItem, setNewChecklistItem] = useState({
    title: '',
    description: '',
    category: 'planning',
    priority: 'medium',
    due_date: '',
    completed: false
  });
  const [checklistFilters, setChecklistFilters] = useState({
    selectedCategory: 'all',
    selectedPriority: 'all',
    searchTerm: '',
    sortBy: 'due_date',
    sortOrder: 'asc',
    showCompleted: true
  });
  const [expandedTimelineItems, setExpandedTimelineItems] = useState(new Set());
  const [isAddingSubChecklistItem, setIsAddingSubChecklistItem] = useState(false);
  const [editingSubChecklistItem, setEditingSubChecklistItem] = useState(null);
  const [selectedTimelineItemId, setSelectedTimelineItemId] = useState(null);
  const [newSubChecklistItem, setNewSubChecklistItem] = useState({
    title: '',
    description: '',
    category: 'planning',
    priority: 'medium',
    due_date: '',
    completed: false
  });
  const [showPrintModal, setShowPrintModal] = useState(false);

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

  // Checklist categories
  const checklistCategories = [
    { id: 'planning', name: 'Planning & Coordination', icon: 'fas fa-calendar-check', color: '#667eea' },
    { id: 'venue', name: 'Venue & Location', icon: 'fas fa-building', color: '#764ba2' },
    { id: 'vendors', name: 'Vendors & Services', icon: 'fas fa-handshake', color: '#f093fb' },
    { id: 'attire', name: 'Attire & Beauty', icon: 'fas fa-tshirt', color: '#4facfe' },
    { id: 'ceremony', name: 'Ceremony', icon: 'fas fa-church', color: '#43e97b' },
    { id: 'reception', name: 'Reception', icon: 'fas fa-glass-cheers', color: '#fa709a' },
    { id: 'guests', name: 'Guests & RSVPs', icon: 'fas fa-user-friends', color: '#a8edea' },
    { id: 'travel', name: 'Travel & Accommodation', icon: 'fas fa-plane', color: '#ffecd2' },
    { id: 'legal', name: 'Legal & Documentation', icon: 'fas fa-file-contract', color: '#fc466b' },
    { id: 'decor', name: 'Decor & Details', icon: 'fas fa-palette', color: '#ff9a9e' },
    { id: 'other', name: 'Other', icon: 'fas fa-ellipsis-h', color: '#ff6b6b' }
  ];

  const priorityOptions = [
    { id: 'high', name: 'High Priority', color: '#ef4444', icon: 'fas fa-exclamation-triangle' },
    { id: 'medium', name: 'Medium Priority', color: '#f59e0b', icon: 'fas fa-exclamation-circle' },
    { id: 'low', name: 'Low Priority', color: '#10b981', icon: 'fas fa-info-circle' }
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

  // Load checklist items
  useEffect(() => {
    if (weddingData?.id) {
      loadChecklistItems();
    }
  }, [weddingData?.id]);

  const loadChecklistItems = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_checklist_items')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setChecklistItems(data || []);
    } catch (error) {
      console.error('Error loading checklist items:', error);
      toast.error('Failed to load checklist items');
    }
  };

  // Checklist helper functions
  const addChecklistItem = async (itemData) => {
    try {
      if (!itemData.title || !itemData.category) {
        toast.error('Title and category are required');
        return;
      }

      const newItem = {
        wedding_id: weddingData.id,
        title: itemData.title,
        description: itemData.description || '',
        due_date: itemData.due_date || null,
        category: itemData.category,
        priority: itemData.priority || 'medium',
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('wedding_checklist_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;

      setChecklistItems([data, ...checklistItems]);
      setIsAddingChecklistItem(false);
      toast.success('Checklist item added successfully!');
    } catch (error) {
      console.error('Error adding checklist item:', error);
      toast.error('Failed to add checklist item');
    }
  };

  const updateChecklistItem = async (itemId, updates) => {
    try {
      // Only validate title and category if they are being updated
      if (updates.hasOwnProperty('title') && !updates.title) {
        toast.error('Title is required');
        return;
      }
      if (updates.hasOwnProperty('category') && !updates.category) {
        toast.error('Category is required');
        return;
      }

      const { data, error } = await supabase
        .from('wedding_checklist_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      setChecklistItems(checklistItems.map(item => 
        item.id === itemId ? data : item
      ));
      
      toast.success('Checklist item updated successfully!');
    } catch (error) {
      console.error('Error updating checklist item:', error);
      toast.error('Failed to update checklist item');
    }
  };

  const deleteChecklistItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('wedding_checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setChecklistItems(checklistItems.filter(item => item.id !== itemId));
      toast.success('Checklist item deleted successfully!');
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      toast.error('Failed to delete checklist item');
    }
  };

  const toggleChecklistItemCompletion = async (itemId, completed) => {
    await updateChecklistItem(itemId, { completed });
  };

  const getFilteredAndSortedChecklistItems = () => {
    let filtered = checklistItems;

    // Filter by category
    if (checklistFilters.selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === checklistFilters.selectedCategory);
    }

    // Filter by priority
    if (checklistFilters.selectedPriority !== 'all') {
      filtered = filtered.filter(item => item.priority === checklistFilters.selectedPriority);
    }

    // Filter by search term
    if (checklistFilters.searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(checklistFilters.searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(checklistFilters.searchTerm.toLowerCase())
      );
    }

    // Filter by completion status
    if (!checklistFilters.showCompleted) {
      filtered = filtered.filter(item => !item.completed);
    }

    // Sort items
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (checklistFilters.sortBy) {
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
          bValue = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a[checklistFilters.sortBy];
          bValue = b[checklistFilters.sortBy];
      }

      if (checklistFilters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return 'no-due-date';
    const daysUntil = getDaysUntilDue(dueDate);
    if (daysUntil < 0) return 'overdue';
    if (daysUntil === 0) return 'due-today';
    if (daysUntil <= 3) return 'due-soon';
    return 'due-later';
  };

  const getChecklistProgressStats = () => {
    const total = checklistItems.length;
    const completed = checklistItems.filter(item => item.completed).length;
    const overdue = checklistItems.filter(item => 
      item.due_date && !item.completed && getDaysUntilDue(item.due_date) < 0
    ).length;
    const urgent = checklistItems.filter(item => 
      item.due_date && !item.completed && getDaysUntilDue(item.due_date) <= 7 && getDaysUntilDue(item.due_date) >= 0
    ).length;

    return { total, completed, overdue, urgent };
  };

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
    
    // Set up colors for the PDF
    const colors = {
      primary: [242, 71, 209], // Pink
      secondary: [118, 75, 162], // Purple
      accent: [16, 185, 129], // Green
      warning: [245, 158, 11], // Orange
      danger: [239, 68, 68], // Red
      text: [30, 41, 59], // Dark gray
      lightGray: [203, 213, 225], // Light gray
      white: [255, 255, 255],
      background: [248, 250, 252] // Very light gray
    };

    // Helper functions (same as generatePDF)
    const drawRoundedRect = (x, y, width, height, radius, fillColor) => {
      doc.setFillColor(...fillColor);
      doc.roundedRect(x, y, width, height, radius, radius, 'F');
    };

    const drawTimelineConnector = (x, y, height) => {
      doc.setDrawColor(...colors.primary);
      doc.setLineWidth(2);
      doc.line(x, y, x, y + height);
    };

    const drawTimelineDot = (x, y, color) => {
      doc.setFillColor(...color);
      doc.circle(x, y, 3, 'F');
    };

    const wrapText = (text, maxWidth) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = doc.getTextWidth(currentLine + ' ' + word);
        if (width < maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ] : [0, 0, 0];
    };

    let pageNumber = 1;
    const pageHeight = 280;

    // Page 1: Cover Page
    // Background
    drawRoundedRect(0, 0, 210, 297, 0, colors.background);
    
    // Decorative elements
    drawRoundedRect(20, 40, 170, 120, 15, colors.white);
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(2);
    doc.roundedRect(20, 40, 170, 120, 15, 15, 'S');

    // Wedding title
    const weddingTitle = weddingData?.title || 'Our Wedding Day';
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text(weddingTitle, 105, 80, { align: 'center' });

    // Wedding date
    const weddingDate = weddingData?.date ? new Date(weddingData.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'TBD';
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.text);
    doc.text(weddingDate, 105, 100, { align: 'center' });

    // Decorative line
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(1);
    doc.line(60, 110, 150, 110);

    // Subtitle
    doc.setFontSize(14);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...colors.secondary);
    doc.text('Wedding Planning Guide', 105, 125, { align: 'center' });

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.text);
    doc.text('Generated by Bidi Wedding Planner', 105, 280, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 285, { align: 'center' });

    // Page 2: Wedding Details
    doc.addPage();
    pageNumber++;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('Wedding Details', 20, 25);

    // Wedding details box
    drawRoundedRect(15, 35, 180, 60, 8, colors.white);
    doc.setDrawColor(...colors.lightGray);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, 35, 180, 60, 8, 8, 'S');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.text);
    doc.text('Event Information', 25, 45);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
    
    const venue = weddingData?.venue || 'Venue TBD';
    const time = weddingData?.time || 'Time TBD';
    const guestCount = weddingData?.guest_count || 'TBD';
    
    doc.text(`📍 Venue: ${venue}`, 25, 55);
    doc.text(`🕐 Time: ${time}`, 25, 65);
    doc.text(`👥 Guest Count: ${guestCount}`, 25, 75);

    // Preparation Timeline Progress
    const prepItems = timelineItems.preparation || [];
    const completedPrep = prepItems.filter(item => item.completed).length;
    const totalPrep = prepItems.length;
    const prepPercentage = totalPrep > 0 ? Math.round((completedPrep / totalPrep) * 100) : 0;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.secondary);
    doc.text('Preparation Progress', 20, 115);

    // Progress bar
    drawRoundedRect(20, 125, 170, 15, 7, colors.lightGray);
    drawRoundedRect(20, 125, (170 * prepPercentage) / 100, 15, 7, colors.accent);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.white);
    doc.text(`${prepPercentage}% Complete`, 105, 135, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.text);
    doc.text(`${completedPrep} of ${totalPrep} preparation tasks completed`, 105, 150, { align: 'center' });

    // Page 3: Day-of Timeline
    doc.addPage();
    pageNumber++;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('Wedding Day Itinerary', 20, 25);

    let yPosition = 35;
    const dayOfItems = timelineItems.dayOf || [];

    dayOfItems.forEach((item, index) => {
      if (yPosition > pageHeight) {
        doc.addPage();
        pageNumber++;
        yPosition = 25;
        
        // Page header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primary);
        doc.text('Wedding Day Itinerary (continued)', 20, 15);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.text);
        doc.text(`Page ${pageNumber}`, 190, 15, { align: 'right' });
      }

      // Timeline item container
      const itemHeight = 35 + (item.description ? 12 : 0) + (item.location || item.responsible ? 8 : 0);
      drawRoundedRect(20, yPosition - 5, 170, itemHeight, 6, colors.white);
      doc.setDrawColor(...colors.lightGray);
      doc.setLineWidth(0.5);
      doc.roundedRect(20, yPosition - 5, 170, itemHeight, 6, 6, 'S');

      // Timeline connector
      drawTimelineConnector(30, yPosition - 5, itemHeight + 5);

      // Timeline dot with phase color
      const phaseColor = getPhaseColor(item.phase);
      const rgbColor = hexToRgb(phaseColor);
      drawTimelineDot(30, yPosition + 5, rgbColor);

      // Time
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...colors.primary);
      const time = formatTime(item.time);
      doc.text(time, 45, yPosition + 8);

      // Activity title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...colors.text);
      doc.text(item.activity, 45, yPosition + 18);

      // Duration badge
      if (item.duration > 0) {
        const durationText = `${item.duration} min`;
        const durationWidth = doc.getTextWidth(durationText);
        drawRoundedRect(150, yPosition + 2, durationWidth + 8, 12, 6, colors.accent);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.white);
        doc.text(durationText, 154, yPosition + 10);
      }

      // Description
      if (item.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...colors.text);
        const descLines = wrapText(item.description, 120);
        descLines.forEach((line, lineIndex) => {
          doc.text(line, 45, yPosition + 28 + (lineIndex * 5));
        });
        yPosition += descLines.length * 5;
      }

      // Location and Responsible
      if (item.location || item.responsible) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(...colors.text);
        let details = '';
        if (item.location) details += `📍 ${item.location}`;
        if (item.responsible) details += details ? ` | 👤 ${item.responsible}` : `👤 ${item.responsible}`;
        doc.text(details, 45, yPosition + 28);
      }

      yPosition += itemHeight + 10;
    });

    // Page 4: Preparation Timeline
    if (prepItems.length > 0) {
      doc.addPage();
      pageNumber++;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.secondary);
      doc.text('Preparation Timeline', 20, 25);

      yPosition = 35;

      prepItems.forEach((item, index) => {
        if (yPosition > pageHeight) {
          doc.addPage();
          pageNumber++;
          yPosition = 25;
          
          // Page header
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.secondary);
          doc.text('Preparation Timeline (continued)', 20, 15);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...colors.text);
          doc.text(`Page ${pageNumber}`, 190, 15, { align: 'right' });
        }

        // Timeline item container
        const itemHeight = 30 + (item.description ? 12 : 0) + (item.location || item.responsible ? 8 : 0);
        drawRoundedRect(20, yPosition - 5, 170, itemHeight, 6, colors.white);
        doc.setDrawColor(...colors.lightGray);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, yPosition - 5, 170, itemHeight, 6, 6, 'S');

        // Completion status
        if (item.completed) {
          drawRoundedRect(155, yPosition - 2, 30, 10, 5, colors.accent);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.white);
          doc.text('DONE', 170, yPosition + 3, { align: 'center' });
        }

        // Date
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...colors.secondary);
        doc.text(item.date || 'No date set', 25, yPosition + 8);

        // Activity title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...colors.text);
        doc.text(item.activity, 25, yPosition + 18);

        // Description
        if (item.description) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(...colors.text);
          const descLines = wrapText(item.description, 140);
          descLines.forEach((line, lineIndex) => {
            doc.text(line, 25, yPosition + 28 + (lineIndex * 5));
          });
          yPosition += descLines.length * 5;
        }

        // Location and Responsible
        if (item.location || item.responsible) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(...colors.text);
          let details = '';
          if (item.location) details += `📍 ${item.location}`;
          if (item.responsible) details += details ? ` | 👤 ${item.responsible}` : `👤 ${item.responsible}`;
          doc.text(details, 25, yPosition + 28);
        }

        yPosition += itemHeight + 10;
      });
    }

    // Page 5: Checklist Summary (if there are checklist items)
    const checklistItems = getFilteredAndSortedChecklistItems();
    if (checklistItems.length > 0) {
      doc.addPage();
      pageNumber++;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text('Wedding Checklist', 20, 25);

      // Progress summary
      const checklistStats = getChecklistProgressStats();
      const checklistPercentage = checklistStats.total > 0 ? Math.round((checklistStats.completed / checklistStats.total) * 100) : 0;

      drawRoundedRect(15, 35, 180, 25, 8, colors.white);
      doc.setDrawColor(...colors.lightGray);
      doc.setLineWidth(0.5);
      doc.roundedRect(15, 35, 180, 25, 8, 8, 'S');

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.text);
      doc.text('Checklist Progress', 25, 45);

      // Progress bar
      drawRoundedRect(25, 50, 150, 8, 4, colors.lightGray);
      drawRoundedRect(25, 50, (150 * checklistPercentage) / 100, 8, 4, colors.accent);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.text);
      doc.text(`${checklistStats.completed} of ${checklistStats.total} items completed`, 105, 65, { align: 'center' });

      yPosition = 75;

      // Show top priority items
      const highPriorityItems = checklistItems.filter(item => item.priority === 'high' && !item.completed).slice(0, 5);
      
      if (highPriorityItems.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.danger);
        doc.text('High Priority Items', 20, yPosition);
        yPosition += 15;

        highPriorityItems.forEach((item, index) => {
          if (yPosition > pageHeight) {
            doc.addPage();
            pageNumber++;
            yPosition = 25;
          }

          drawRoundedRect(20, yPosition - 3, 170, 15, 4, colors.white);
          doc.setDrawColor(...colors.danger);
          doc.setLineWidth(0.5);
          doc.roundedRect(20, yPosition - 3, 170, 15, 4, 4, 'S');

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.text);
          doc.text(item.title, 25, yPosition + 5);

          if (item.due_date) {
            const daysUntil = getDaysUntilDue(item.due_date);
            const dueText = daysUntil < 0 ? `Overdue by ${Math.abs(daysUntil)} days` : `Due in ${daysUntil} days`;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colors.danger);
            doc.text(dueText, 25, yPosition + 12);
          }

          yPosition += 20;
        });
      }
    }

    // Footer on last page
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.text);
    doc.text('Generated by Bidi Wedding Planner', 105, footerY, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, footerY + 5, { align: 'center' });

    // Save the PDF
    const fileName = `${weddingTitle.replace(/\s+/g, '_')}_Complete_Wedding_Guide.pdf`;
    doc.save(fileName);
  };

  const generateComprehensivePDF = () => {
    const { jsPDF } = require('jspdf');
    const doc = new jsPDF();
    
    // Set up colors for the PDF
    const colors = {
      primary: [242, 71, 209], // Pink
      secondary: [118, 75, 162], // Purple
      accent: [16, 185, 129], // Green
      warning: [245, 158, 11], // Orange
      danger: [239, 68, 68], // Red
      text: [30, 41, 59], // Dark gray
      lightGray: [203, 213, 225], // Light gray
      white: [255, 255, 255],
      background: [248, 250, 252] // Very light gray
    };

    // Helper functions (same as generatePDF)
    const drawRoundedRect = (x, y, width, height, radius, fillColor) => {
      doc.setFillColor(...fillColor);
      doc.roundedRect(x, y, width, height, radius, radius, 'F');
    };

    const drawTimelineConnector = (x, y, height) => {
      doc.setDrawColor(...colors.primary);
      doc.setLineWidth(2);
      doc.line(x, y, x, y + height);
    };

    const drawTimelineDot = (x, y, color) => {
      doc.setFillColor(...color);
      doc.circle(x, y, 3, 'F');
    };

    const wrapText = (text, maxWidth) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = doc.getTextWidth(currentLine + ' ' + word);
        if (width < maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ] : [0, 0, 0];
    };

    let pageNumber = 1;
    const pageHeight = 280;

    // Page 1: Cover Page
    // Background
    drawRoundedRect(0, 0, 210, 297, 0, colors.background);
    
    // Decorative elements
    drawRoundedRect(20, 40, 170, 120, 15, colors.white);
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(2);
    doc.roundedRect(20, 40, 170, 120, 15, 15, 'S');

    // Wedding title
    const weddingTitle = weddingData?.title || 'Our Wedding Day';
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text(weddingTitle, 105, 80, { align: 'center' });

    // Wedding date
    const weddingDate = weddingData?.date ? new Date(weddingData.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'TBD';
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.text);
    doc.text(weddingDate, 105, 100, { align: 'center' });

    // Decorative line
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(1);
    doc.line(60, 110, 150, 110);

    // Subtitle
    doc.setFontSize(14);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...colors.secondary);
    doc.text('Wedding Planning Guide', 105, 125, { align: 'center' });

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.text);
    doc.text('Generated by Bidi Wedding Planner', 105, 280, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 285, { align: 'center' });

    // Page 2: Wedding Details
    doc.addPage();
    pageNumber++;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('Wedding Details', 20, 25);

    // Wedding details box
    drawRoundedRect(15, 35, 180, 60, 8, colors.white);
    doc.setDrawColor(...colors.lightGray);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, 35, 180, 60, 8, 8, 'S');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.text);
    doc.text('Event Information', 25, 45);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
    
    const venue = weddingData?.venue || 'Venue TBD';
    const time = weddingData?.time || 'Time TBD';
    const guestCount = weddingData?.guest_count || 'TBD';
    
    doc.text(`📍 Venue: ${venue}`, 25, 55);
    doc.text(`🕐 Time: ${time}`, 25, 65);
    doc.text(`👥 Guest Count: ${guestCount}`, 25, 75);

    // Preparation Timeline Progress
    const prepItems = timelineItems.preparation || [];
    const completedPrep = prepItems.filter(item => item.completed).length;
    const totalPrep = prepItems.length;
    const prepPercentage = totalPrep > 0 ? Math.round((completedPrep / totalPrep) * 100) : 0;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.secondary);
    doc.text('Preparation Progress', 20, 115);

    // Progress bar
    drawRoundedRect(20, 125, 170, 15, 7, colors.lightGray);
    drawRoundedRect(20, 125, (170 * prepPercentage) / 100, 15, 7, colors.accent);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.white);
    doc.text(`${prepPercentage}% Complete`, 105, 135, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.text);
    doc.text(`${completedPrep} of ${totalPrep} preparation tasks completed`, 105, 150, { align: 'center' });

    // Page 3: Day-of Timeline
    doc.addPage();
    pageNumber++;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('Wedding Day Itinerary', 20, 25);

    let yPosition = 35;
    const dayOfItems = timelineItems.dayOf || [];

    dayOfItems.forEach((item, index) => {
      if (yPosition > pageHeight) {
        doc.addPage();
        pageNumber++;
        yPosition = 25;
        
        // Page header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primary);
        doc.text('Wedding Day Itinerary (continued)', 20, 15);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.text);
        doc.text(`Page ${pageNumber}`, 190, 15, { align: 'right' });
      }

      // Timeline item container
      const itemHeight = 35 + (item.description ? 12 : 0) + (item.location || item.responsible ? 8 : 0);
      drawRoundedRect(20, yPosition - 5, 170, itemHeight, 6, colors.white);
      doc.setDrawColor(...colors.lightGray);
      doc.setLineWidth(0.5);
      doc.roundedRect(20, yPosition - 5, 170, itemHeight, 6, 6, 'S');

      // Timeline connector
      drawTimelineConnector(30, yPosition - 5, itemHeight + 5);

      // Timeline dot with phase color
      const phaseColor = getPhaseColor(item.phase);
      const rgbColor = hexToRgb(phaseColor);
      drawTimelineDot(30, yPosition + 5, rgbColor);

      // Time
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...colors.primary);
      const time = formatTime(item.time);
      doc.text(time, 45, yPosition + 8);

      // Activity title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...colors.text);
      doc.text(item.activity, 45, yPosition + 18);

      // Duration badge
      if (item.duration > 0) {
        const durationText = `${item.duration} min`;
        const durationWidth = doc.getTextWidth(durationText);
        drawRoundedRect(150, yPosition + 2, durationWidth + 8, 12, 6, colors.accent);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.white);
        doc.text(durationText, 154, yPosition + 10);
      }

      // Description
      if (item.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...colors.text);
        const descLines = wrapText(item.description, 120);
        descLines.forEach((line, lineIndex) => {
          doc.text(line, 45, yPosition + 28 + (lineIndex * 5));
        });
        yPosition += descLines.length * 5;
      }

      // Location and Responsible
      if (item.location || item.responsible) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(...colors.text);
        let details = '';
        if (item.location) details += `📍 ${item.location}`;
        if (item.responsible) details += details ? ` | 👤 ${item.responsible}` : `👤 ${item.responsible}`;
        doc.text(details, 45, yPosition + 28);
      }

      yPosition += itemHeight + 10;
    });

    // Page 4: Preparation Timeline
    if (prepItems.length > 0) {
      doc.addPage();
      pageNumber++;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.secondary);
      doc.text('Preparation Timeline', 20, 25);

      yPosition = 35;

      prepItems.forEach((item, index) => {
        if (yPosition > pageHeight) {
          doc.addPage();
          pageNumber++;
          yPosition = 25;
          
          // Page header
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.secondary);
          doc.text('Preparation Timeline (continued)', 20, 15);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...colors.text);
          doc.text(`Page ${pageNumber}`, 190, 15, { align: 'right' });
        }

        // Timeline item container
        const itemHeight = 30 + (item.description ? 12 : 0) + (item.location || item.responsible ? 8 : 0);
        drawRoundedRect(20, yPosition - 5, 170, itemHeight, 6, colors.white);
        doc.setDrawColor(...colors.lightGray);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, yPosition - 5, 170, itemHeight, 6, 6, 'S');

        // Completion status
        if (item.completed) {
          drawRoundedRect(155, yPosition - 2, 30, 10, 5, colors.accent);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.white);
          doc.text('DONE', 170, yPosition + 3, { align: 'center' });
        }

        // Date
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...colors.secondary);
        doc.text(item.date || 'No date set', 25, yPosition + 8);

        // Activity title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...colors.text);
        doc.text(item.activity, 25, yPosition + 18);

        // Description
        if (item.description) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(...colors.text);
          const descLines = wrapText(item.description, 140);
          descLines.forEach((line, lineIndex) => {
            doc.text(line, 25, yPosition + 28 + (lineIndex * 5));
          });
          yPosition += descLines.length * 5;
        }

        // Location and Responsible
        if (item.location || item.responsible) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(...colors.text);
          let details = '';
          if (item.location) details += `📍 ${item.location}`;
          if (item.responsible) details += details ? ` | 👤 ${item.responsible}` : `👤 ${item.responsible}`;
          doc.text(details, 25, yPosition + 28);
        }

        yPosition += itemHeight + 10;
      });
    }

    // Page 5: Checklist Summary (if there are checklist items)
    const checklistItems = getFilteredAndSortedChecklistItems();
    if (checklistItems.length > 0) {
      doc.addPage();
      pageNumber++;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text('Wedding Checklist', 20, 25);

      // Progress summary
      const checklistStats = getChecklistProgressStats();
      const checklistPercentage = checklistStats.total > 0 ? Math.round((checklistStats.completed / checklistStats.total) * 100) : 0;

      drawRoundedRect(15, 35, 180, 25, 8, colors.white);
      doc.setDrawColor(...colors.lightGray);
      doc.setLineWidth(0.5);
      doc.roundedRect(15, 35, 180, 25, 8, 8, 'S');

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.text);
      doc.text('Checklist Progress', 25, 45);

      // Progress bar
      drawRoundedRect(25, 50, 150, 8, 4, colors.lightGray);
      drawRoundedRect(25, 50, (150 * checklistPercentage) / 100, 8, 4, colors.accent);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.text);
      doc.text(`${checklistStats.completed} of ${checklistStats.total} items completed`, 105, 65, { align: 'center' });

      yPosition = 75;

      // Show top priority items
      const highPriorityItems = checklistItems.filter(item => item.priority === 'high' && !item.completed).slice(0, 5);
      
      if (highPriorityItems.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.danger);
        doc.text('High Priority Items', 20, yPosition);
        yPosition += 15;

        highPriorityItems.forEach((item, index) => {
          if (yPosition > pageHeight) {
            doc.addPage();
            pageNumber++;
            yPosition = 25;
          }

          drawRoundedRect(20, yPosition - 3, 170, 15, 4, colors.white);
          doc.setDrawColor(...colors.danger);
          doc.setLineWidth(0.5);
          doc.roundedRect(20, yPosition - 3, 170, 15, 4, 4, 'S');

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.text);
          doc.text(item.title, 25, yPosition + 5);

          if (item.due_date) {
            const daysUntil = getDaysUntilDue(item.due_date);
            const dueText = daysUntil < 0 ? `Overdue by ${Math.abs(daysUntil)} days` : `Due in ${daysUntil} days`;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colors.danger);
            doc.text(dueText, 25, yPosition + 12);
          }

          yPosition += 20;
        });
      }
    }

    // Footer on last page
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.text);
    doc.text('Generated by Bidi Wedding Planner', 105, footerY, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, footerY + 5, { align: 'center' });

    // Save the PDF
    const fileName = `${weddingTitle.replace(/\s+/g, '_')}_Complete_Wedding_Guide.pdf`;
    doc.save(fileName);
  };

  const getCompletionStats = () => {
    const prepItems = timelineItems.preparation || [];
    const completed = prepItems.filter(item => item.completed).length;
    const total = prepItems.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  // Sub-checklist functions for timeline items
  const loadSubChecklistItems = async (timelineItemId) => {
    try {
      const { data, error } = await supabase
        .from('wedding_checklist_items')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .eq('parent_timeline_item_id', timelineItemId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error loading sub-checklist items:', error);
      toast.error('Failed to load sub-checklist items');
      return [];
    }
  };

  const addSubChecklistItem = async (timelineItemId, itemData) => {
    try {
      if (!itemData.title || !itemData.category) {
        toast.error('Title and category are required');
        return;
      }

      const newItem = {
        wedding_id: weddingData.id,
        parent_timeline_item_id: timelineItemId,
        title: itemData.title,
        description: itemData.description || '',
        due_date: itemData.due_date || null,
        category: itemData.category,
        priority: itemData.priority || 'medium',
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('wedding_checklist_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;

      // Update the timeline items to include the new sub-checklist item
      const updatedTimelineItems = { ...timelineItems };
      const timelineItem = updatedTimelineItems.preparation.find(item => item.id === timelineItemId);
      if (timelineItem) {
        if (!timelineItem.subChecklistItems) {
          timelineItem.subChecklistItems = [];
        }
        timelineItem.subChecklistItems.unshift(data);
        setTimelineItems(updatedTimelineItems);
      }

      setIsAddingSubChecklistItem(false);
      setSelectedTimelineItemId(null);
      toast.success('Sub-checklist item added successfully!');
    } catch (error) {
      console.error('Error adding sub-checklist item:', error);
      toast.error('Failed to add sub-checklist item');
    }
  };

  const updateSubChecklistItem = async (timelineItemId, subItemId, updates) => {
    try {
      // Only validate title and category if they are being updated
      if (updates.hasOwnProperty('title') && !updates.title) {
        toast.error('Title is required');
        return;
      }
      if (updates.hasOwnProperty('category') && !updates.category) {
        toast.error('Category is required');
        return;
      }

      const { data, error } = await supabase
        .from('wedding_checklist_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', subItemId)
        .select()
        .single();

      if (error) throw error;

      // Update the timeline items
      const updatedTimelineItems = { ...timelineItems };
      const timelineItem = updatedTimelineItems.preparation.find(item => item.id === timelineItemId);
      if (timelineItem && timelineItem.subChecklistItems) {
        timelineItem.subChecklistItems = timelineItem.subChecklistItems.map(item => 
          item.id === subItemId ? data : item
        );
        setTimelineItems(updatedTimelineItems);
      }

      toast.success('Sub-checklist item updated successfully!');
    } catch (error) {
      console.error('Error updating sub-checklist item:', error);
      toast.error('Failed to update sub-checklist item');
    }
  };

  const deleteSubChecklistItem = async (timelineItemId, subItemId) => {
    try {
      const { error } = await supabase
        .from('wedding_checklist_items')
        .delete()
        .eq('id', subItemId);

      if (error) throw error;

      // Update the timeline items
      const updatedTimelineItems = { ...timelineItems };
      const timelineItem = updatedTimelineItems.preparation.find(item => item.id === timelineItemId);
      if (timelineItem && timelineItem.subChecklistItems) {
        timelineItem.subChecklistItems = timelineItem.subChecklistItems.filter(item => item.id !== subItemId);
        setTimelineItems(updatedTimelineItems);
      }

      toast.success('Sub-checklist item deleted successfully!');
    } catch (error) {
      console.error('Error deleting sub-checklist item:', error);
      toast.error('Failed to delete sub-checklist item');
    }
  };

  const toggleSubChecklistItemCompletion = async (timelineItemId, subItemId, completed) => {
    await updateSubChecklistItem(timelineItemId, subItemId, { completed });
  };

  const toggleTimelineItemExpansion = async (timelineItemId) => {
    const newExpanded = new Set(expandedTimelineItems);
    
    if (newExpanded.has(timelineItemId)) {
      newExpanded.delete(timelineItemId);
    } else {
      newExpanded.add(timelineItemId);
      // Load sub-checklist items if not already loaded
      const timelineItem = timelineItems.preparation.find(item => item.id === timelineItemId);
      if (timelineItem && !timelineItem.subChecklistItems) {
        const subItems = await loadSubChecklistItems(timelineItemId);
        const updatedTimelineItems = { ...timelineItems };
        const item = updatedTimelineItems.preparation.find(item => item.id === timelineItemId);
        if (item) {
          item.subChecklistItems = subItems;
          setTimelineItems(updatedTimelineItems);
        }
      }
    }
    
    setExpandedTimelineItems(newExpanded);
  };

  const getTimelineItemProgress = (timelineItem) => {
    if (!timelineItem.subChecklistItems || timelineItem.subChecklistItems.length === 0) {
      return { total: 0, completed: 0, percentage: 0 };
    }
    
    const total = timelineItem.subChecklistItems.length;
    const completed = timelineItem.subChecklistItems.filter(item => item.completed).length;
    const percentage = Math.round((completed / total) * 100);
    
    return { total, completed, percentage };
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
                onClick={() => setShowPrintModal(true)}
                title="Print Wedding Documents"
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

      {/* Print Options Modal */}
      {showPrintModal && (
        <div className="share-modal-overlay">
          <div className="share-modal print-options-modal">
            <h3>Print Wedding Documents</h3>
            <p>Choose which document you'd like to generate:</p>
            
            <div className="print-options">
              <button 
                className="print-option"
                onClick={() => {
                  generatePDF();
                  setShowPrintModal(false);
                }}
              >
                <div className="print-option-icon">
                  <i className="fas fa-calendar-day"></i>
                </div>
                <div className="print-option-content">
                  <h4>Day-of Itinerary</h4>
                  <p>Simple, clean timeline of your wedding day events</p>
                  <span className="print-option-details">Perfect for sharing with vendors and wedding party</span>
                </div>
              </button>
              
              <button 
                className="print-option"
                onClick={() => {
                  generateComprehensivePDF();
                  setShowPrintModal(false);
                }}
              >
                <div className="print-option-icon">
                  <i className="fas fa-book-open"></i>
                </div>
                <div className="print-option-content">
                  <h4>Complete Wedding Guide</h4>
                  <p>Comprehensive document with all timelines, progress, and details</p>
                  <span className="print-option-details">Includes preparation timeline, checklist progress, and high-priority items</span>
                </div>
              </button>
            </div>
            
            <button 
              className="close-share-modal"
              onClick={() => setShowPrintModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preparation Progress Bar */}
      {activeTimeline === 'preparation' && (
        <div className="preparation-progress">
          <div className="progress-header">
            <h3>Preparation Timeline</h3>
            <div className="preparation-view-tabs">
              <button 
                className={`view-tab ${activePreparationView === 'timeline' ? 'active' : ''}`}
                onClick={() => setActivePreparationView('timeline')}
              >
                <i className="fas fa-calendar-alt"></i>
                Timeline
              </button>
              <button 
                className={`view-tab ${activePreparationView === 'checklist' ? 'active' : ''}`}
                onClick={() => setActivePreparationView('checklist')}
              >
                <i className="fas fa-tasks"></i>
                Checklist
              </button>
            </div>
          </div>
          
          {activePreparationView === 'timeline' && (
            <>
              {completionStats.total > 0 ? (
                <span className="progress-percentage">{completionStats.percentage}% Complete</span>
              ) : (
                <span className="progress-percentage">No tasks yet</span>
              )}
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
            </>
          )}
          
          {activePreparationView === 'checklist' && (
            <>
              {(() => {
                const checklistStats = getChecklistProgressStats();
                const checklistPercentage = checklistStats.total > 0 ? Math.round((checklistStats.completed / checklistStats.total) * 100) : 0;
                return (
                  <>
                    {checklistStats.total > 0 ? (
                      <span className="progress-percentage">{checklistPercentage}% Complete</span>
                    ) : (
                      <span className="progress-percentage">No checklist items yet</span>
                    )}
                    {checklistStats.total > 0 && (
                      <>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${checklistPercentage}%` }}
                          ></div>
                        </div>
                        <p className="progress-stats">
                          {checklistStats.completed} of {checklistStats.total} items completed
                        </p>
                        <div className="checklist-summary-stats">
                          <span className="stat-item">
                            <i className="fas fa-exclamation-triangle" style={{ color: '#ef4444' }}></i>
                            {checklistStats.urgent} Due Soon
                          </span>
                          <span className="stat-item">
                            <i className="fas fa-calendar-times" style={{ color: '#dc2626' }}></i>
                            {checklistStats.overdue} Overdue
                          </span>
                        </div>
                      </>
                    )}
                    {checklistStats.total === 0 && (
                      <p className="progress-stats">
                        Start adding checklist items to organize your wedding planning tasks
                      </p>
                    )}
                  </>
                );
              })()}
            </>
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
                className="cancel-btn-checklist"
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

      {/* Checklist Form Modal */}
      {isAddingChecklistItem && (
        <div className="timeline-form-overlay">
          <div className="timeline-form checklist-form">
            <h3>{editingChecklistItem ? 'Edit Checklist Item' : 'Add Checklist Item'}</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newChecklistItem.title.trim()) {
                toast.error('Please enter a title for the checklist item');
                return;
              }
              if (editingChecklistItem) {
                updateChecklistItem(editingChecklistItem.id, newChecklistItem);
                setEditingChecklistItem(null);
              } else {
                addChecklistItem(newChecklistItem);
              }
              setIsAddingChecklistItem(false);
              setNewChecklistItem({
                title: '',
                description: '',
                category: 'planning',
                priority: 'medium',
                due_date: '',
                completed: false
              });
            }}>
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  value={newChecklistItem.title}
                  onChange={(e) => setNewChecklistItem({...newChecklistItem, title: e.target.value})}
                  placeholder="Enter checklist item title"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={newChecklistItem.description}
                  onChange={(e) => setNewChecklistItem({...newChecklistItem, description: e.target.value})}
                  placeholder="Add any additional details or notes"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    value={newChecklistItem.category}
                    onChange={(e) => setNewChecklistItem({...newChecklistItem, category: e.target.value})}
                  >
                    {checklistCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    value={newChecklistItem.priority}
                    onChange={(e) => setNewChecklistItem({...newChecklistItem, priority: e.target.value})}
                  >
                    {priorityOptions.map(priority => (
                      <option key={priority.id} value={priority.id}>
                        {priority.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="due_date">Due Date</label>
                <input
                  type="date"
                  id="due_date"
                  value={newChecklistItem.due_date}
                  onChange={(e) => setNewChecklistItem({...newChecklistItem, due_date: e.target.value})}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn-checklist" 
                  onClick={() => {
                    setIsAddingChecklistItem(false);
                    setEditingChecklistItem(null);
                    setNewChecklistItem({
                      title: '',
                      description: '',
                      category: 'planning',
                      priority: 'medium',
                      due_date: '',
                      completed: false
                    });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingChecklistItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Checklist Form Modal */}
      {isAddingSubChecklistItem && (
        <div className="timeline-form-overlay">
          <div className="timeline-form checklist-form">
            <h3>{editingSubChecklistItem ? 'Edit Sub-Task' : 'Add Sub-Task'}</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newSubChecklistItem.title.trim()) {
                toast.error('Please enter a title for the sub-task');
                return;
              }
              if (editingSubChecklistItem) {
                updateSubChecklistItem(selectedTimelineItemId, editingSubChecklistItem.id, newSubChecklistItem);
                setEditingSubChecklistItem(null);
              } else {
                addSubChecklistItem(selectedTimelineItemId, newSubChecklistItem);
              }
              setIsAddingSubChecklistItem(false);
              setSelectedTimelineItemId(null);
              setNewSubChecklistItem({
                title: '',
                description: '',
                category: 'planning',
                priority: 'medium',
                due_date: '',
                completed: false
              });
            }}>
              <div className="form-group">
                <label htmlFor="sub-title">Title *</label>
                <input
                  type="text"
                  id="sub-title"
                  value={newSubChecklistItem.title}
                  onChange={(e) => setNewSubChecklistItem({...newSubChecklistItem, title: e.target.value})}
                  placeholder="Enter sub-task title"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="sub-description">Description</label>
                <textarea
                  id="sub-description"
                  value={newSubChecklistItem.description}
                  onChange={(e) => setNewSubChecklistItem({...newSubChecklistItem, description: e.target.value})}
                  placeholder="Add any additional details or notes"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sub-category">Category</label>
                  <select
                    id="sub-category"
                    value={newSubChecklistItem.category}
                    onChange={(e) => setNewSubChecklistItem({...newSubChecklistItem, category: e.target.value})}
                  >
                    {checklistCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="sub-priority">Priority</label>
                  <select
                    id="sub-priority"
                    value={newSubChecklistItem.priority}
                    onChange={(e) => setNewSubChecklistItem({...newSubChecklistItem, priority: e.target.value})}
                  >
                    {priorityOptions.map(priority => (
                      <option key={priority.id} value={priority.id}>
                        {priority.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="sub-due-date">Due Date</label>
                <input
                  type="date"
                  id="sub-due-date"
                  value={newSubChecklistItem.due_date}
                  onChange={(e) => setNewSubChecklistItem({...newSubChecklistItem, due_date: e.target.value})}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn-checklist" 
                  onClick={() => {
                    setIsAddingSubChecklistItem(false);
                    setEditingSubChecklistItem(null);
                    setSelectedTimelineItemId(null);
                    setNewSubChecklistItem({
                      title: '',
                      description: '',
                      category: 'planning',
                      priority: 'medium',
                      due_date: '',
                      completed: false
                    });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingSubChecklistItem ? 'Update Sub-Task' : 'Add Sub-Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="timeline-container">
        <div className={`timeline-container-header ${isHeaderVisible ? 'visible' : ''}`}>
          {activeTimeline === 'preparation' && activePreparationView === 'checklist' ? (
            <button 
              className="add-timeline-btn"
              onClick={() => setIsAddingChecklistItem(true)}
              title="Add Checklist Item"
            >
              Add Checklist Item
              <i className="fas fa-plus"></i>
            </button>
          ) : (
            <button 
              className="add-timeline-btn"
              onClick={() => setIsAddingItem(true)}
              title={`Add ${activeTimeline === 'dayOf' ? 'Day-of' : 'Preparation'} Timeline Item`}
            >
              Add 
              <i className="fas fa-plus"></i>
            </button>
          )}
        </div>
        
        {/* Checklist Filters */}
        {activeTimeline === 'preparation' && activePreparationView === 'checklist' && (
          <div className="checklist-filters">
            <div className="filter-group">
              <input
                type="text"
                placeholder="Search items..."
                value={checklistFilters.searchTerm}
                onChange={(e) => setChecklistFilters({...checklistFilters, searchTerm: e.target.value})}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <select 
                value={checklistFilters.selectedCategory} 
                onChange={(e) => setChecklistFilters({...checklistFilters, selectedCategory: e.target.value})}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                {checklistCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select 
                value={checklistFilters.selectedPriority} 
                onChange={(e) => setChecklistFilters({...checklistFilters, selectedPriority: e.target.value})}
                className="filter-select"
              >
                <option value="all">All Priorities</option>
                {priorityOptions.map(priority => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select 
                value={checklistFilters.sortBy} 
                onChange={(e) => setChecklistFilters({...checklistFilters, sortBy: e.target.value})}
                className="filter-select"
              >
                <option value="due_date">Sort by Due Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="title">Sort by Title</option>
                <option value="created_at">Sort by Created Date</option>
              </select>
            </div>

            <div className="filter-group">
              <button 
                className={`sort-order-btn ${checklistFilters.sortOrder === 'asc' ? 'active' : ''}`}
                onClick={() => setChecklistFilters({...checklistFilters, sortOrder: checklistFilters.sortOrder === 'asc' ? 'desc' : 'asc'})}
              >
                <i className={`fas fa-sort-${checklistFilters.sortOrder === 'asc' ? 'up' : 'down'}`}></i>
              </button>
            </div>

            <div className="filter-group">
              <label className="show-completed-label">
                <input
                  type="checkbox"
                  checked={checklistFilters.showCompleted}
                  onChange={(e) => setChecklistFilters({...checklistFilters, showCompleted: e.target.checked})}
                />
                Show Completed
              </label>
            </div>
          </div>
        )}
        
        {/* Timeline Items */}
        {activeTimeline === 'dayOf' || (activeTimeline === 'preparation' && activePreparationView === 'timeline') ? (
          currentItems.length === 0 ? (
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
              {currentItems.map((item, index) => {
                const isExpanded = expandedTimelineItems.has(item.id);
                const progress = getTimelineItemProgress(item);
                const hasSubItems = item.subChecklistItems && item.subChecklistItems.length > 0;
                
                return (
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
                          {activeTimeline === 'preparation' && (
                            <button 
                              className="expand-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTimelineItemExpansion(item.id);
                              }}
                              title={isExpanded ? "Collapse sub-tasks" : "Expand sub-tasks"}
                            >
                              <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
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

                      {/* Sub-checklist Progress Bar */}
                      {activeTimeline === 'preparation' && hasSubItems && (
                        <div className="sub-checklist-progress">
                          <div className="progress-header">
                            <span className="progress-label">Sub-tasks Progress</span>
                            <span className="progress-count">{progress.completed}/{progress.total}</span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${progress.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Sub-checklist Items */}
                      {activeTimeline === 'preparation' && isExpanded && (
                        <div className="sub-checklist-section">
                          <div className="sub-checklist-header">
                            <h4>Sub-tasks</h4>
                            <button 
                              className="add-sub-task-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTimelineItemId(item.id);
                                setIsAddingSubChecklistItem(true);
                              }}
                            >
                              <i className="fas fa-plus"></i>
                              Add Sub-task
                            </button>
                          </div>
                          
                          {hasSubItems ? (
                            <div className="sub-checklist-items">
                              {item.subChecklistItems.map(subItem => {
                                const category = checklistCategories.find(cat => cat.id === subItem.category);
                                const priority = priorityOptions.find(pri => pri.id === subItem.priority);
                                const daysUntil = getDaysUntilDue(subItem.due_date);
                                const dueStatus = getDueDateStatus(subItem.due_date);

                                const getDueDateText = () => {
                                  if (!subItem.due_date) return 'No due date';
                                  if (daysUntil < 0) return `Overdue by ${Math.abs(daysUntil)} days`;
                                  if (daysUntil === 0) return 'Due today';
                                  if (daysUntil === 1) return 'Due tomorrow';
                                  if (daysUntil <= 7) return `Due in ${daysUntil} days`;
                                  return `Due in ${daysUntil} days`;
                                };

                                return (
                                  <div key={subItem.id} className={`sub-checklist-item ${subItem.completed ? 'completed' : ''} ${dueStatus}`}>
                                    <div className="item-checkbox">
                                      <input
                                        type="checkbox"
                                        id={`sub-checklist-${subItem.id}`}
                                        checked={subItem.completed}
                                        onChange={(e) => toggleSubChecklistItemCompletion(item.id, subItem.id, e.target.checked)}
                                        className="custom-checkbox"
                                      />
                                      <label htmlFor={`sub-checklist-${subItem.id}`} className="checkbox-label-checklist"></label>
                                    </div>

                                    <div className="item-content">
                                      <div className="item-header">
                                        <h5 className={`item-title ${subItem.completed ? 'completed' : ''}`}>
                                          {subItem.title}
                                        </h5>
                                        <div className="item-meta">
                                          {category && (
                                            <span className="item-category" style={{ backgroundColor: category.color }}>
                                              <i className={category.icon}></i>
                                              {category.name}
                                            </span>
                                          )}
                                          {priority && (
                                            <span className="item-priority" style={{ color: priority.color }}>
                                              <i className={priority.icon}></i>
                                              {priority.name}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {subItem.description && (
                                        <p className="item-description">{subItem.description}</p>
                                      )}

                                      <div className="item-footer">
                                        {subItem.due_date && (
                                          <span className={`item-due-date ${dueStatus}`}>
                                            <i className="fas fa-calendar-day"></i>
                                            {getDueDateText()}
                                          </span>
                                        )}
                                        
                                        <div className="item-actions">
                                          <button 
                                            className="action-btn edit-btn"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingSubChecklistItem(subItem);
                                              setSelectedTimelineItemId(item.id);
                                              setNewSubChecklistItem({
                                                title: subItem.title,
                                                description: subItem.description || '',
                                                category: subItem.category,
                                                priority: subItem.priority,
                                                due_date: subItem.due_date || '',
                                                completed: subItem.completed || false
                                              });
                                              setIsAddingSubChecklistItem(true);
                                            }}
                                            title="Edit sub-task"
                                          >
                                            <i className="fas fa-edit"></i>
                                          </button>
                                          <button 
                                            className="action-btn delete-btn-checklist"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteSubChecklistItem(item.id, subItem.id);
                                            }}
                                            title="Delete sub-task"
                                          >
                                            <i className="fas fa-trash"></i>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="sub-checklist-empty">
                              <p>No sub-tasks yet. Add your first sub-task to break down this timeline item.</p>
                              <button 
                                className="add-first-sub-task-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTimelineItemId(item.id);
                                  setIsAddingSubChecklistItem(true);
                                }}
                              >
                                Add Your First Sub-task
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : null}
        
        {/* Checklist Items */}
        {activeTimeline === 'preparation' && activePreparationView === 'checklist' && (
          (() => {
            const filteredChecklistItems = getFilteredAndSortedChecklistItems();
            return filteredChecklistItems.length === 0 ? (
              <div className="checklist-empty">
                <i className="fas fa-clipboard-list"></i>
                <h3>No checklist items found</h3>
                <p>Add your first checklist item to get started!</p>
                <button 
                  className="add-first-item-btn"
                  onClick={() => setIsAddingChecklistItem(true)}
                >
                  Add Your First Item
                </button>
              </div>
            ) : (
              <div className="checklist-items">
                {filteredChecklistItems.map(item => {
                  const category = checklistCategories.find(cat => cat.id === item.category);
                  const priority = priorityOptions.find(pri => pri.id === item.priority);
                  const daysUntil = getDaysUntilDue(item.due_date);
                  const dueStatus = getDueDateStatus(item.due_date);

                  const getDueDateText = () => {
                    if (!item.due_date) return 'No due date';
                    if (daysUntil < 0) return `Overdue by ${Math.abs(daysUntil)} days`;
                    if (daysUntil === 0) return 'Due today';
                    if (daysUntil === 1) return 'Due tomorrow';
                    if (daysUntil <= 7) return `Due in ${daysUntil} days`;
                    return `Due in ${daysUntil} days`;
                  };

                  return (
                    <div key={item.id} className={`checklist-item ${item.completed ? 'completed' : ''} ${dueStatus}`}>
                      <div className="item-checkbox">
                        <input
                          type="checkbox"
                          id={`checklist-${item.id}`}
                          checked={item.completed}
                          onChange={(e) => toggleChecklistItemCompletion(item.id, e.target.checked)}
                          className="custom-checkbox"
                        />
                        <label htmlFor={`checklist-${item.id}`} className="checkbox-label-checklist"></label>
                      </div>

                      <div className="item-content">
                        <div className="item-header">
                          <h3 className={`item-title ${item.completed ? 'completed' : ''}`}>
                            {item.title}
                          </h3>
                          <div className="item-meta">
                            {category && (
                              <span className="item-category" style={{ backgroundColor: category.color }}>
                                <i className={category.icon}></i>
                                {category.name}
                              </span>
                            )}
                            {priority && (
                              <span className="item-priority" style={{ color: priority.color }}>
                                <i className={priority.icon}></i>
                                {priority.name}
                              </span>
                            )}
                          </div>
                        </div>

                        {item.description && (
                          <p className="item-description">{item.description}</p>
                        )}

                        <div className="item-footer">
                          {item.due_date && (
                            <span className={`item-due-date ${dueStatus}`}>
                              <i className="fas fa-calendar-day"></i>
                              {getDueDateText()}
                            </span>
                          )}
                          
                          <div className="item-actions">
                            <button 
                              className="action-btn edit-btn"
                              onClick={() => {
                                setEditingChecklistItem(item);
                                setNewChecklistItem({
                                  title: item.title,
                                  description: item.description || '',
                                  category: item.category,
                                  priority: item.priority,
                                  due_date: item.due_date || '',
                                  completed: item.completed || false
                                });
                                setIsAddingChecklistItem(true);
                              }}
                              title="Edit item"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className="action-btn delete-btn-checklist"
                              onClick={() => deleteChecklistItem(item.id)}
                              title="Delete item"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}

export default WeddingTimeline; 