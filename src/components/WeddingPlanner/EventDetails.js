import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import Settings from '../Settings/Settings';
import './EventDetails.css';
import LoadingSpinner from '../LoadingSpinner';

/**
 * EventDetails Component - Wedding Inspiration Hub
 * 
 * This component manages wedding details, color palettes, and photo organization.
 * 
 * Special Features:
 * - Couple Photos Category: Automatically created and protected category for couple photos
 *   - Used for RSVP page slideshow and wedding dashboard background
 *   - Cannot be deleted but photos can be added/removed
 *   - Marked with special_type: 'couple_photos' and is_default: true
 *   - Visual indicators (heart icon, pink styling) to show it's special
 * 
 * Photo Categories:
 * - Users can create custom categories for organizing their inspiration photos
 * - Couple photos category is automatically created for new wedding plans
 * - Protected categories (is_default: true) cannot be deleted
 */

function EventDetails({ weddingData, onUpdate }) {
  const [formData, setFormData] = useState({
    weddingTitle: '',
    weddingDate: '',
    venueName: '',
    venueAddress: '',
    weddingLocation: '',
    budget: '',
    guestCount: '',
    weddingStyle: '',
    colorScheme: '',
    status: 'planning',
    inspirationNotes: '',
    dressStyle: '',
    flowerPreferences: '',
    decorStyle: '',
    musicStyle: '',
    foodStyle: '',
    photographyStyle: '',
    season: '',
    timeOfDay: '',
    indoorOutdoor: '',
    guestExperience: ''
  });

  const [originalData, setOriginalData] = useState({});
  const [originalColors, setOriginalColors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [moodBoardImages, setMoodBoardImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showCouplePhotosInfo, setShowCouplePhotosInfo] = useState(true);
  const [showDefaultCategoriesInfo, setShowDefaultCategoriesInfo] = useState(true);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [customColors, setCustomColors] = useState([]);
  const [allColors, setAllColors] = useState([
    { id: 'primary', name: 'Primary', value: '#ec4899', isDefault: true },
    { id: 'secondary', name: 'Secondary', value: '#8b5cf6', isDefault: true },
    { id: 'accent', name: 'Accent', value: '#f59e0b', isDefault: true },
    { id: 'neutral', name: 'Neutral', value: '#6b7280', isDefault: true }
  ]);

  // Load existing wedding data
  useEffect(() => {
    if (weddingData) {
      const initialData = {
        weddingTitle: weddingData.wedding_title || '',
        weddingDate: weddingData.wedding_date || '',
        venueName: weddingData.venue_name || '',
        venueAddress: weddingData.venue_address || '',
        weddingLocation: weddingData.wedding_location || '',
        budget: weddingData.budget || '',
        guestCount: weddingData.guest_count || '',
        weddingStyle: weddingData.wedding_style || '',
        colorScheme: weddingData.color_scheme || '',
        status: weddingData.status || 'planning',
        inspirationNotes: weddingData.inspiration_notes || '',
        dressStyle: weddingData.dress_style || '',
        flowerPreferences: weddingData.flower_preferences || '',
        decorStyle: weddingData.decor_style || '',
        musicStyle: weddingData.music_style || '',
        foodStyle: weddingData.food_style || '',
        photographyStyle: weddingData.photography_style || '',
        season: weddingData.season || '',
        timeOfDay: weddingData.time_of_day || '',
        indoorOutdoor: weddingData.indoor_outdoor || '',
        guestExperience: weddingData.guest_experience || ''
      };
      
      setFormData(initialData);
      setOriginalData(initialData);
      setOriginalColors(weddingData.colors || []);
      
      // Load colors from database or use defaults
      const savedColors = weddingData.colors || [];
      if (savedColors.length > 0) {
        setAllColors(savedColors);
        setOriginalColors(savedColors);
      } else {
        // Use default colors if none saved, or load from old format
        const defaultColors = [
          { id: 'primary', name: 'Primary', value: weddingData.primary_color || '#ec4899', isDefault: true },
          { id: 'secondary', name: 'Secondary', value: weddingData.secondary_color || '#8b5cf6', isDefault: true },
          { id: 'accent', name: 'Accent', value: weddingData.accent_color || '#f59e0b', isDefault: true },
          { id: 'neutral', name: 'Neutral', value: weddingData.neutral_color || '#6b7280', isDefault: true }
        ];
        setAllColors(defaultColors);
        setOriginalColors(defaultColors);
      }
      
      loadMoodBoardImages();
      loadCategories();
    }
  }, [weddingData]);

  const loadMoodBoardImages = async () => {
    if (!weddingData?.id) return;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) return;

      // Load images from the database table
      const { data: moodBoardData, error: dbError } = await supabase
        .from('wedding_mood_board')
        .select('*')
        .eq('wedding_plan_id', weddingData.id)
        .order('uploaded_at', { ascending: false });

      if (dbError) {
        console.error('Error loading mood board from database:', dbError);
        return;
      }

      if (moodBoardData && moodBoardData.length > 0) {
        const loadedImages = moodBoardData.map(item => ({
          url: item.image_url,
          name: item.image_name,
          path: item.image_url, // Keep path for compatibility
          uploaded_at: item.uploaded_at,
          id: item.id, // Add database ID for deletion
          category_id: item.category_id
        }));

        setMoodBoardImages(loadedImages);
      } else {
        setMoodBoardImages([]);
      }
    } catch (error) {
      console.error('Error loading mood board images:', error);
    }
  };

  const loadCategories = async () => {
    if (!weddingData?.id) return;

    try {
      const { data: categoriesData, error } = await supabase
        .from('wedding_photo_categories')
        .select('*')
        .or(`is_default.eq.true,wedding_plan_id.eq.${weddingData.id}`)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      let categories = categoriesData || [];
      
      // Clean up duplicate couple photos categories
      await cleanupDuplicateCoupleCategories(categories);
      
      // Reload categories after cleanup
      const { data: cleanedCategoriesData, error: reloadError } = await supabase
        .from('wedding_photo_categories')
        .select('*')
        .or(`is_default.eq.true,wedding_plan_id.eq.${weddingData.id}`)
        .order('sort_order', { ascending: true });

      if (reloadError) throw reloadError;
      categories = cleanedCategoriesData || [];
      
      // Check if any couple photos category exists (more thorough check)
      const coupleCategory = categories.find(cat => 
        cat.name.toLowerCase().includes('couple') || 
        cat.name.toLowerCase().includes('couple photos') ||
        cat.special_type === 'couple_photos' ||
        cat.name.toLowerCase().includes('couple photos') ||
        cat.name.toLowerCase() === 'couple photos'
      );
      
      // If no couple category exists, create one
      if (!coupleCategory) {
        try {
          const { data: newCoupleCategory, error: createError } = await supabase
            .from('wedding_photo_categories')
            .insert({
              name: 'Couple Photos',
              wedding_plan_id: weddingData.id,
              color: '#ec4899', // Pink color for couple photos
              sort_order: 1, // Always first
              is_default: true, // Cannot be deleted
              special_type: 'couple_photos', // Special identifier
              description: 'Photos of the couple used for RSVP pages and wedding dashboard backgrounds'
            })
            .select()
            .single();

          if (createError) throw createError;
          
          // Add the new category to the beginning of the list
          categories = [newCoupleCategory, ...categories];
        } catch (createError) {
          console.error('Error creating couple photos category:', createError);
        }
      } else {
        // If couple category exists, ensure it has the correct properties
        if (!coupleCategory.special_type || coupleCategory.special_type !== 'couple_photos') {
          try {
            await supabase
              .from('wedding_photo_categories')
              .update({
                special_type: 'couple_photos',
                is_default: true,
                color: '#ec4899',
                sort_order: 1
              })
              .eq('id', coupleCategory.id);
            
            // Update the local category data
            categories = categories.map(cat => 
              cat.id === coupleCategory.id 
                ? { ...cat, special_type: 'couple_photos', is_default: true, color: '#ec4899', sort_order: 1 }
                : cat
            );
          } catch (updateError) {
            console.error('Error updating couple photos category:', updateError);
          }
        }
      }
      
      // If no other categories exist (only couple photos or no categories), create default categories
      const nonCoupleCategories = categories.filter(cat => 
        !cat.name.toLowerCase().includes('couple') && 
        !cat.name.toLowerCase().includes('couple photos') &&
        cat.special_type !== 'couple_photos'
      );
      
      // Only create default categories if there are NO non-couple categories at all
      if (nonCoupleCategories.length === 0) {
        const defaultCategories = [
          {
            name: 'Venue & Decor',
            color: '#3b82f6', // Blue
            sort_order: 2,
            description: 'Venue photos, decoration ideas, and setup inspiration'
          },
          {
            name: 'Flowers & Bouquets',
            color: '#10b981', // Green
            sort_order: 3,
            description: 'Flower arrangements, bouquets, and floral inspiration'
          },
          {
            name: 'Attire & Style',
            color: '#f59e0b', // Amber
            sort_order: 4,
            description: 'Dress inspiration, suit ideas, and fashion inspiration'
          },
          {
            name: 'Food & Cake',
            color: '#ef4444', // Red
            sort_order: 5,
            description: 'Catering ideas, cake designs, and food presentation'
          },
          {
            name: 'Photography Style',
            color: '#8b5cf6', // Purple
            sort_order: 6,
            description: 'Photography inspiration, poses, and style examples'
          },
          {
            name: 'Details & Accessories',
            color: '#06b6d4', // Cyan
            sort_order: 7,
            description: 'Small details, accessories, and finishing touches'
          }
        ];
        
        try {
          const defaultCategoryData = defaultCategories.map(cat => ({
            name: cat.name,
            wedding_plan_id: weddingData.id,
            color: cat.color,
            sort_order: cat.sort_order,
            is_default: false, // Can be deleted
            description: cat.description
          }));
          
          const { data: newDefaultCategories, error: createDefaultError } = await supabase
            .from('wedding_photo_categories')
            .insert(defaultCategoryData)
            .select();

          if (createDefaultError) throw createDefaultError;
          
          // Add the new default categories to the list
          categories = [...categories, ...newDefaultCategories];
          
          console.log(`Created ${newDefaultCategories.length} default categories for new inspiration board`);
        } catch (createDefaultError) {
          console.error('Error creating default categories:', createDefaultError);
        }
      }
      
      setCategories(categories);
      
      // Set couple photos category as default if it exists
      const coupleCat = categories.find(cat => 
        cat.name.toLowerCase().includes('couple') || 
        cat.name.toLowerCase().includes('couple photos') ||
        cat.special_type === 'couple_photos'
      );
      
      if (coupleCat) {
        setSelectedCategory(coupleCat.id);
      } else if (categories.length > 0) {
        setSelectedCategory(categories[0].id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Function to clean up duplicate couple photos categories
  const cleanupDuplicateCoupleCategories = async (categories) => {
    try {
      // Find all couple photos categories
      const coupleCategories = categories.filter(cat => 
        cat.name.toLowerCase().includes('couple') || 
        cat.name.toLowerCase().includes('couple photos') ||
        cat.special_type === 'couple_photos'
      );
      
      // If there are multiple couple categories, keep the first one and delete the rest
      if (coupleCategories.length > 1) {
        const [keepCategory, ...duplicateCategories] = coupleCategories;
        
        // Move photos from duplicate categories to the main couple category
        for (const duplicateCategory of duplicateCategories) {
          await supabase
            .from('wedding_mood_board')
            .update({ category_id: keepCategory.id })
            .eq('category_id', duplicateCategory.id);
          
          // Delete the duplicate category
          await supabase
            .from('wedding_photo_categories')
            .delete()
            .eq('id', duplicateCategory.id);
        }
        
        console.log(`Cleaned up ${duplicateCategories.length} duplicate couple photos categories`);
      }
    } catch (error) {
      console.error('Error cleaning up duplicate couple categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
    setAllColors(prev => prev.filter(color => color.id !== colorId));
  };

  const updateColorName = (colorId, newName) => {
    setAllColors(prev => 
      prev.map(color => 
        color.id === colorId ? { ...color, name: newName } : color
      )
    );
  };

  const handleSave = async () => {
    if (!weddingData?.id) {
      setSaveMessage('No wedding plan found. Please create a wedding plan first.');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      const { error } = await supabase
        .from('wedding_plans')
        .update({
          wedding_title: formData.weddingTitle,
          wedding_date: formData.weddingDate,
          venue_name: formData.venueName,
          venue_address: formData.venueAddress,
          wedding_location: formData.weddingLocation,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          guest_count: formData.guestCount ? parseInt(formData.guestCount) : null,
          wedding_style: formData.weddingStyle,
          color_scheme: formData.colorScheme,
          status: formData.status,
          colors: allColors,
          inspiration_notes: formData.inspirationNotes,
          dress_style: formData.dressStyle,
          flower_preferences: formData.flowerPreferences,
          decor_style: formData.decorStyle,
          music_style: formData.musicStyle,
          food_style: formData.foodStyle,
          photography_style: formData.photographyStyle,
          season: formData.season,
          time_of_day: formData.timeOfDay,
          indoor_outdoor: formData.indoorOutdoor,
          guest_experience: formData.guestExperience,
          updated_at: new Date().toISOString()
        })
        .eq('id', weddingData.id);

      if (error) throw error;

      setOriginalData(formData);
      setOriginalColors(allColors);
      setSaveMessage('Event details saved successfully!');
      
      if (onUpdate) {
        onUpdate({
          wedding_title: formData.weddingTitle,
          wedding_date: formData.weddingDate,
          venue_name: formData.venueName,
          venue_address: formData.venueAddress,
          wedding_location: formData.weddingLocation,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          guest_count: formData.guestCount ? parseInt(formData.guestCount) : null,
          wedding_style: formData.weddingStyle,
          color_scheme: formData.colorScheme,
          status: formData.status,
          colors: allColors,
          inspiration_notes: formData.inspirationNotes,
          dress_style: formData.dressStyle,
          flower_preferences: formData.flowerPreferences,
          decor_style: formData.decorStyle,
          music_style: formData.musicStyle,
          food_style: formData.foodStyle,
          photography_style: formData.photographyStyle,
          season: formData.season,
          time_of_day: formData.timeOfDay,
          indoor_outdoor: formData.indoorOutdoor,
          guest_experience: formData.guestExperience,
          updated_at: new Date().toISOString()
        });
      }

      setTimeout(() => setSaveMessage(''), 3000);

    } catch (error) {
      console.error('Error saving event details:', error);
      setSaveMessage('Error saving event details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const parseCurrency = (value) => {
    if (!value) return '';
    return value.replace(/[$,]/g, '');
  };

  const handleBudgetChange = (e) => {
    const rawValue = parseCurrency(e.target.value);
    setFormData(prev => ({
      ...prev,
      budget: rawValue
    }));
  };

  const getDaysUntilWedding = () => {
    if (!formData.weddingDate) return null;
    
    const weddingDate = new Date(formData.weddingDate);
    const today = new Date();
    const diffTime = weddingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Wedding has passed';
    if (diffDays === 0) return 'Today!';
    if (diffDays === 1) return 'Tomorrow!';
    return `${diffDays} days`;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setIsUploading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        throw new Error('You must be logged in to upload images');
      }

      const uploadedImages = [];
      
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Maximum size is 10MB`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${user.id}/${weddingData.id}/mood-board/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('wedding_planning_photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('wedding_planning_photos')
          .getPublicUrl(filePath);

        // Save to database
        const { data: dbData, error: dbError } = await supabase
          .from('wedding_mood_board')
          .insert([{
            wedding_plan_id: weddingData.id,
            image_url: publicUrl,
            image_name: file.name,
            category_id: selectedCategory,
            uploaded_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (dbError) {
          console.error('Database insert error:', dbError);
          // Clean up the uploaded file if database insert fails
          await supabase.storage
            .from('wedding_planning_photos')
            .remove([filePath]);
          throw new Error(`Failed to save image metadata: ${dbError.message}`);
        }

        uploadedImages.push({
          url: publicUrl,
          name: file.name,
          path: filePath,
          uploaded_at: new Date().toISOString(),
          id: dbData.id,
          category_id: selectedCategory
        });
      }

      setMoodBoardImages(prev => [...prev, ...uploadedImages]);
      setSaveMessage(`${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''} uploaded successfully!`);
      setTimeout(() => setSaveMessage(''), 3000);
      
      // Close the upload modal after successful upload
      setShowUploadModal(false);
      
    } catch (error) {
      console.error('Error uploading images:', error);
      setSaveMessage(`Error uploading images: ${error.message}`);
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = async (index) => {
    const imageToRemove = moodBoardImages[index];
    
    try {
      // Delete from database first
      if (imageToRemove.id) {
        const { error: dbError } = await supabase
          .from('wedding_mood_board')
          .delete()
          .eq('id', imageToRemove.id);

        if (dbError) {
          console.error('Database deletion error:', dbError);
          throw new Error('Failed to delete image from database');
        }
      }

      // Delete from storage
      if (imageToRemove.path) {
        const { error: storageError } = await supabase.storage
          .from('wedding_planning_photos')
          .remove([imageToRemove.path]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // Don't throw error here as the database record is already deleted
        }
      }

      setMoodBoardImages(prev => prev.filter((_, i) => i !== index));
      setSaveMessage('Image removed successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      
    } catch (error) {
      console.error('Error removing image:', error);
      setSaveMessage('Error removing image. Please try again.');
      setTimeout(() => setSaveMessage(''), 5000);
    }
  };

  // Bulk delete selected images
  const bulkDeleteImages = async () => {
    if (selectedPhotos.length === 0) return;
    
    if (!window.confirm(`Delete ${selectedPhotos.length} selected image${selectedPhotos.length > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Get the images to delete
      const imagesToDelete = moodBoardImages.filter(img => selectedPhotos.includes(img.id));
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('wedding_mood_board')
        .delete()
        .in('id', selectedPhotos);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw new Error('Failed to delete images from database');
      }

      // Delete from storage
      const pathsToDelete = imagesToDelete
        .filter(img => img.path)
        .map(img => img.path);

      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('wedding_planning_photos')
          .remove(pathsToDelete);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // Don't throw error here as the database records are already deleted
        }
      }

      // Update local state
      setMoodBoardImages(prev => prev.filter(img => !selectedPhotos.includes(img.id)));
      setSelectedPhotos([]);
      setSaveMessage(`${imagesToDelete.length} image${imagesToDelete.length > 1 ? 's' : ''} deleted successfully!`);
      setTimeout(() => setSaveMessage(''), 3000);
      
    } catch (error) {
      console.error('Error deleting images:', error);
      setSaveMessage('Error deleting images. Please try again.');
      setTimeout(() => setSaveMessage(''), 5000);
    }
  };

  // Bulk move selected images to a different category
  const bulkMoveImages = async (targetCategoryId) => {
    if (selectedPhotos.length === 0) return;

    try {
      // Update database
      const { error: dbError } = await supabase
        .from('wedding_mood_board')
        .update({ category_id: targetCategoryId })
        .in('id', selectedPhotos);

      if (dbError) {
        console.error('Database update error:', dbError);
        throw new Error('Failed to move images');
      }

      // Update local state
      setMoodBoardImages(prev => 
        prev.map(img => 
          selectedPhotos.includes(img.id) 
            ? { ...img, category_id: targetCategoryId }
            : img
        )
      );
      
      setSelectedPhotos([]);
      setShowMoveModal(false);
      
      const targetCategory = categories.find(cat => cat.id === targetCategoryId);
      setSaveMessage(`${selectedPhotos.length} image${selectedPhotos.length > 1 ? 's' : ''} moved to ${targetCategory?.name || 'selected category'}!`);
      setTimeout(() => setSaveMessage(''), 3000);
      
    } catch (error) {
      console.error('Error moving images:', error);
      setSaveMessage('Error moving images. Please try again.');
      setTimeout(() => setSaveMessage(''), 5000);
    }
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData) || JSON.stringify(allColors) !== JSON.stringify(originalColors);
  };

  const resetToOriginal = () => {
    setFormData(originalData);
    setAllColors(originalColors);
  };

  const handleImageClick = (photoId) => {
    setSelectedPhotos(prev => {
      if (prev.includes(photoId)) {
        // Remove from selection
        return prev.filter(id => id !== photoId);
      } else {
        // Add to selection
        return [...prev, photoId];
      }
    });
  };

  // Category management functions
  const createCategory = async (name) => {
    if (!weddingData?.id) return;

    try {
      const { data, error } = await supabase
        .from('wedding_photo_categories')
        .insert({
          name,
          wedding_plan_id: weddingData.id,
          color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
          sort_order: categories.length + 1
        })
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => [...prev, data]);
      setSelectedCategory(data.id);
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    }
  };

  const updateCategory = async (categoryId, newName) => {
    try {
      const { error } = await supabase
        .from('wedding_photo_categories')
        .update({ name: newName })
        .eq('id', categoryId);

      if (error) throw error;
      
      setCategories(prev => 
        prev.map(cat => 
          cat.id === categoryId ? { ...cat, name: newName } : cat
        )
      );
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    }
  };

  const deleteCategory = async (categoryId) => {
    try {
      // Find the category to check if it's the couple photos category
      const categoryToDelete = categories.find(cat => cat.id === categoryId);
      
      // Prevent deletion of couple photos category
      if (categoryToDelete && (
        categoryToDelete.name.toLowerCase().includes('couple') || 
        categoryToDelete.name.toLowerCase().includes('couple photos') ||
        categoryToDelete.special_type === 'couple_photos' ||
        categoryToDelete.is_default
      )) {
        alert('Cannot delete the Couple Photos category. This category is used for RSVP pages and wedding dashboard backgrounds.');
        return;
      }

      // Move photos to uncategorized (null category_id)
      const { error: updateError } = await supabase
        .from('wedding_mood_board')
        .update({ category_id: null })
        .eq('category_id', categoryId);

      if (updateError) throw updateError;

      // Delete the category
      const { error: deleteError } = await supabase
        .from('wedding_photo_categories')
        .delete()
        .eq('id', categoryId);

      if (deleteError) throw deleteError;
      
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setSelectedCategory(categories.find(cat => cat.id !== categoryId)?.id || null);
      loadMoodBoardImages(); // Refresh images to update category_id
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const daysUntilWedding = getDaysUntilWedding();

  const renderBasicInfo = () => (
    <div className="details-section-wedding-details">
      <h3>Basic Information</h3>
      <div className="form-grid-wedding-details">
        <div className="form-group-wedding-details">
          <label>Wedding Title</label>
          <input
            type="text"
            name="weddingTitle"
            value={formData.weddingTitle}
            onChange={handleInputChange}
            placeholder="e.g., Sarah & Michael's Wedding"
          />
        </div>
        
        <div className="form-group-wedding-details">
          <label>Wedding Date</label>
          <input
            type="date"
            name="weddingDate"
            value={formData.weddingDate}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="form-group-wedding-details">
          <label>Expected Guest Count</label>
          <input
            type="number"
            name="guestCount"
            value={formData.guestCount}
            onChange={handleInputChange}
            placeholder="150"
            min="1"
          />
        </div>
        
        <div className="form-group-wedding-details">
          <label>Budget</label>
          <input
            type="text"
            name="budget"
            value={formatCurrency(formData.budget)}
            onChange={handleBudgetChange}
            placeholder="$25,000"
          />
        </div>
        
        <div className="form-group-wedding-details">
          <label>Wedding Style</label>
          <select
            name="weddingStyle"
            value={formData.weddingStyle}
            onChange={handleInputChange}
          >
            <option value="">Select wedding style</option>
            <option value="Traditional">Traditional</option>
            <option value="Modern">Modern</option>
            <option value="Rustic">Rustic</option>
            <option value="Elegant">Elegant</option>
            <option value="Bohemian">Bohemian</option>
            <option value="Vintage">Vintage</option>
            <option value="Beach">Beach</option>
            <option value="Garden">Garden</option>
            <option value="Industrial">Industrial</option>
            <option value="Minimalist">Minimalist</option>
            <option value="Luxury">Luxury</option>
            <option value="Country">Country</option>
            <option value="Destination">Destination</option>
            <option value="Cultural">Cultural</option>
            <option value="Themed">Themed</option>
          </select>
        </div>
        
        <div className="form-group-wedding-details">
          <label>Color Scheme</label>
          <input
            type="text"
            name="colorScheme"
            value={formData.colorScheme}
            onChange={handleInputChange}
            placeholder="e.g., Blush Pink & Gold"
          />
        </div>
        
        <div className="form-group-wedding-details">
          <label>Planning Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="planning">Planning</option>
            <option value="booked">Booked</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="postponed">Postponed</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderVenueInfo = () => (
    <div className="details-section-wedding-details">
      <h3>Venue Information</h3>
      <div className="form-grid-wedding-details">
        <div className="form-group-wedding-details">
          <label>Venue Name</label>
          <input
            type="text"
            name="venueName"
            value={formData.venueName}
            onChange={handleInputChange}
            placeholder="e.g., Grand Hotel Ballroom"
          />
        </div>
        
        <div className="form-group-wedding-details">
          <label>Venue Address</label>
          <input
            type="text"
            name="venueAddress"
            value={formData.venueAddress}
            onChange={handleInputChange}
            placeholder="123 Main St, City, State"
          />
        </div>
        
        <div className="form-group-wedding-details">
          <label>Wedding Location</label>
          <input
            type="text"
            name="weddingLocation"
            value={formData.weddingLocation}
            onChange={handleInputChange}
            placeholder="e.g., Downtown, Beachfront, Mountain View"
          />
        </div>
      </div>
    </div>
  );

  const renderColorPalette = () => (
    <div className="details-section-wedding-details">
      <h3>Color Palette</h3>
      <p className="section-description-wedding-details">
        Click on any color swatch below to choose your wedding colors. You can add custom colors and remove any color from your palette.
      </p>
      
      <div className="color-palette-grid-wedding-details">
        {allColors.map((color) => (
          <div key={color.id} className="color-item-wedding-details">
            <label>{color.name}</label>
            <div 
              className="color-picker-container-wedding-details"
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
                className="color-picker-wedding-details"
                title="Click to choose color"
                style={{ display: 'none' }}
              />
              <div 
                className="color-display-wedding-details"
                style={{ backgroundColor: color.value }}
              ></div>
              <div className="color-info-wedding-details">
                <input
                  type="text"
                  value={color.name}
                  onChange={(e) => updateColorName(color.id, e.target.value)}
                  className="custom-color-name-wedding-details"
                  placeholder="Color name"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="color-hint-wedding-details">Click anywhere to change color</span>
              </div>
              <button
                className="remove-color-btn-wedding-details"
                onClick={(e) => {
                  e.stopPropagation();
                  removeColor(color.id);
                }}
                title="Remove this color"
                type="button"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Color Button */}
      <div className="add-color-section-wedding-details">
        <button 
          className="add-color-btn-wedding-details"
          onClick={addCustomColor}
          type="button"
        >
          <i className="fas fa-plus"></i>
          Add New Color
        </button>
      </div>
      
      {allColors.length === 0 && (
        <div className="no-colors-message-wedding-details">
          <i className="fas fa-palette"></i>
          <p>No colors in your palette yet</p>
          <small>Click "Add New Color" to start building your wedding color scheme</small>
        </div>
      )}
      
      <div className="color-preview-wedding-details">
        <h4>Color Preview</h4>
        <div className="color-swatches-container-wedding-details">
          {allColors.map((color) => (
            <div key={color.id} className="color-swatch-wedding-details" style={{ backgroundColor: color.value }}>
              <span>{color.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMoodBoard = () => (
    <div className="details-section-wedding-details">
      <div className="mood-board-header-wedding-details">
        <h3 style={{marginBottom: '0px', fontFamily:'Outfit', fontSize:'2rem'}}>Inspo Board</h3>
        <p className="section-description-wedding-details">
          Upload and organize inspiration images to create your wedding inspiration board. 
        </p>
      </div>
      
      <div className="integrated-photo-manager">
        <div className="photo-manager-info">
          {showCouplePhotosInfo && (
            <div className="info-card">
              <button 
                className="info-card-close-btn"
                onClick={() => setShowCouplePhotosInfo(false)}
                title="Hide this message"
              >
                <i className="fas fa-times"></i>
              </button>
              <i className="fas fa-heart" style={{ color: '#ec4899', fontSize: '1.2rem' }}></i>
              <div className="info-content">
                <h4>Couple Photos Category</h4>
                <p>
                  The "Couple Photos" category is automatically created and protected. 
                  Photos in this category are used for your RSVP page slideshow and 
                  wedding dashboard background. You cannot delete this category, but 
                  you can add, remove, or organize photos within it.
                </p>
              </div>
            </div>
          )}
          
          {/* Show info about default categories if they exist */}
          {showDefaultCategoriesInfo && categories.some(cat => 
            !cat.name.toLowerCase().includes('couple') && 
            !cat.name.toLowerCase().includes('couple photos') &&
            cat.special_type !== 'couple_photos' &&
            cat.is_default === false
          ) && (
            <div className="info-card default-categories-info">
              <button 
                className="info-card-close-btn"
                onClick={() => setShowDefaultCategoriesInfo(false)}
                title="Hide this message"
              >
                <i className="fas fa-times"></i>
              </button>
              <i className="fas fa-lightbulb" style={{ color: '#f59e0b', fontSize: '1.2rem' }}></i>
              <div className="info-content">
                <h4>Default Categories</h4>
                <p>
                  We've created some helpful default categories to get you started! 
                  You can rename, delete, or add new categories as needed. 
                  These categories are just suggestions to help organize your inspiration.
                </p>
              </div>
            </div>
          )}
          
          {/* Show Help button when both info cards are hidden */}
          {!showCouplePhotosInfo && !showDefaultCategoriesInfo && (
            <div className="show-help-container">
              <button 
                className="show-help-btn"
                onClick={() => {
                  setShowCouplePhotosInfo(true);
                  setShowDefaultCategoriesInfo(true);
                }}
                title="Show help information"
              >
                <i className="fas fa-question-circle"></i>
                <span>Show Help</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="photo-manager-layout">
          {/* Categories Sidebar */}
          <div className="categories-sidebar-integrated">
            <div className="categories-header-integrated">
              <h4>Categories</h4>
              <button 
                className="add-category-btn-integrated"
                onClick={() => {
                  const categoryName = prompt('Enter category name:');
                  if (categoryName && categoryName.trim()) {
                    createCategory(categoryName.trim());
                  }
                }}
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
            
            <div className="categories-list-integrated">
              {categories.map(category => {
                const isCoupleCategory = category.name.toLowerCase().includes('couple') || 
                  category.name.toLowerCase().includes('couple photos') ||
                  category.special_type === 'couple_photos';
                
                // Check if this is a default category (not couple photos, not user-created)
                const isDefaultCategory = !isCoupleCategory && !category.is_default && 
                  ['Venue & Decor', 'Flowers & Bouquets', 'Attire & Style', 'Food & Cake', 'Photography Style', 'Details & Accessories'].includes(category.name);
                
                return (
                  <div 
                    key={category.id}
                    className={`category-item-integrated ${selectedCategory === category.id ? 'active' : ''} ${isCoupleCategory ? 'couple-category' : ''} ${isDefaultCategory ? 'default-category' : ''}`}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSelectedPhotos([]); // Clear selections when switching categories
                    }}
                  >
                    <div className="category-color-integrated" style={{ backgroundColor: category.color || '#6366f1' }}></div>
                    <div className="category-info-integrated">
                      <span className="category-name-integrated">
                        {category.name}
                        {isCoupleCategory && (
                          <i className="fas fa-heart" style={{ marginLeft: '8px', color: '#ec4899', fontSize: '0.8rem' }} title="Special category for RSVP pages"></i>
                        )}
                        {isDefaultCategory && (
                          <i className="fas fa-lightbulb" style={{ marginLeft: '8px', color: '#f59e0b', fontSize: '0.8rem' }} title="Default category - can be deleted"></i>
                        )}
                      </span>
                      <span className="category-count-integrated">
                        {moodBoardImages.filter(img => img.category_id === category.id).length}
                        {isCoupleCategory && (
                          <span style={{ marginLeft: '4px', fontSize: '0.7rem', color: '#6b7280' }}>
                            (RSVP & Dashboard)
                          </span>
                        )}
                        {isDefaultCategory && (
                          <span style={{ marginLeft: '4px', fontSize: '0.7rem', color: '#6b7280' }}>
                            (Default)
                          </span>
                        )}
                      </span>
                    </div>
                    {!category.is_default && !isCoupleCategory && (
                      <div className="category-actions-integrated">
                        <button 
                          className="edit-btn-integrated"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newName = prompt('Enter new category name:', category.name);
                            if (newName && newName.trim()) {
                              updateCategory(category.id, newName.trim());
                            }
                          }}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="delete-btn-integrated"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete category "${category.name}"? Photos will be moved to "Uncategorized".`)) {
                              deleteCategory(category.id);
                            }
                          }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                    {isCoupleCategory && (
                      <div className="category-actions-integrated">
                        <span style={{ fontSize: '0.7rem', color: '#6b7280', fontStyle: 'italic' }}>
                          Protected
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Photos Section */}
          <div className="photos-section-integrated">
            <div className="photos-header-integrated">
              <div className="photos-header-left">
                <h4>
                  {categories.find(c => c.id === selectedCategory)?.name || 'All Photos'}
                </h4>
                {selectedPhotos.length > 0 && (
                  <span className="selection-count">
                    {selectedPhotos.length} selected
                  </span>
                )}
              </div>
              
              <div className="photos-header-right">
                {selectedPhotos.length > 0 ? (
                  <div className="bulk-actions">
                    <button 
                      className="bulk-move-btn"
                      onClick={() => setShowMoveModal(true)}
                      title="Move selected images to another category"
                    >
                      <i className="fas fa-folder-open"></i>
                      Move
                    </button>
                    <button 
                      className="bulk-delete-btn"
                      onClick={bulkDeleteImages}
                      title="Delete selected images"
                    >
                      <i className="fas fa-trash"></i>
                      Delete
                    </button>
                    <button 
                      className="clear-selection-btn-integrated"
                      onClick={() => setSelectedPhotos([])}
                    >
                      Clear Selection
                    </button>
                  </div>
                ) : (
                  <button 
                    className="upload-photos-btn-integrated"
                    onClick={() => setShowUploadModal(true)}
                  >
                    <i className="fas fa-cloud-upload-alt"></i>
                    Upload Photos
                  </button>
                )}
              </div>
            </div>

            {/* Photos Grid */}
            <div className="photos-grid-integrated">
              {moodBoardImages
                .filter(img => !selectedCategory || img.category_id === selectedCategory)
                .map((image, index) => (
                  <div 
                    key={index} 
                    className={`photo-item-integrated ${selectedPhotos.includes(image.id) ? 'selected' : ''}`}
                    onClick={(e) => {
                      // Don't trigger if clicking on checkbox or delete button
                      if (!e.target.closest('.photo-overlay-integrated') && !e.target.closest('.remove-image-integrated')) {
                        handleImageClick(image.id);
                      }
                    }}
                  >
                    <img 
                      src={image.url} 
                      alt={image.name} 
                      style={{ cursor: 'pointer' }}
                    />
                    <div className="photo-overlay-integrated">
                      <input 
                        type="checkbox" 
                        checked={selectedPhotos.includes(image.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleImageClick(image.id);
                        }}
                        title="Select this photo"
                      />
                    </div>
                    <button 
                      className="remove-image-integrated"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              
              {moodBoardImages.filter(img => !selectedCategory || img.category_id === selectedCategory).length === 0 && (
                <div className="no-photos-message-integrated">
                  <i className="fas fa-images"></i>
                  <p>No photos in this category</p>
                  <small>Click "Upload Photos" to get started</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStyleDetails = () => (
    <div className="details-section-wedding-details">
      <h3>Style Details</h3>
      <div className="form-grid-wedding-details">
        <div className="form-group-wedding-details">
          <label>Season</label>
          <select
            name="season"
            value={formData.season}
            onChange={handleInputChange}
          >
            <option value="">Select season</option>
            <option value="Spring">Spring</option>
            <option value="Summer">Summer</option>
            <option value="Fall">Fall</option>
            <option value="Winter">Winter</option>
          </select>
        </div>
        
        <div className="form-group-wedding-details">
          <label>Time of Day</label>
          <select
            name="timeOfDay"
            value={formData.timeOfDay}
            onChange={handleInputChange}
          >
            <option value="">Select time</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
            <option value="Sunset">Sunset</option>
            <option value="Night">Night</option>
          </select>
        </div>
        
        <div className="form-group-wedding-details">
          <label>Indoor/Outdoor</label>
          <select
            name="indoorOutdoor"
            value={formData.indoorOutdoor}
            onChange={handleInputChange}
          >
            <option value="">Select setting</option>
            <option value="Indoor">Indoor</option>
            <option value="Outdoor">Outdoor</option>
            <option value="Both">Both (Ceremony & Reception)</option>
            <option value="Tent">Tent</option>
          </select>
        </div>
        
        <div className="form-group-wedding-details">
          <label>Dress Style</label>
          <input
            type="text"
            name="dressStyle"
            value={formData.dressStyle}
            onChange={handleInputChange}
            placeholder="e.g., A-line, Mermaid, Ballgown"
          />
        </div>
        
        <div className="form-group-wedding-details">
          <label>Flower Preferences</label>
          <input
            type="text"
            name="flowerPreferences"
            value={formData.flowerPreferences}
            onChange={handleInputChange}
            placeholder="e.g., Roses, Peonies, Wildflowers"
          />
        </div>
        
        <div className="form-group-wedding-details">
          <label>Decor Style</label>
          <input
            type="text"
            name="decorStyle"
            value={formData.decorStyle}
            onChange={handleInputChange}
            placeholder="e.g., Minimalist, Vintage, Rustic"
          />
        </div>
        
        <div className="form-group-wedding-details">
          <label>Music Style</label>
          <input
            type="text"
            name="musicStyle"
            value={formData.musicStyle}
            onChange={handleInputChange}
            placeholder="e.g., Jazz, Pop, Classical"
          />
        </div>
        
        <div className="form-group-wedding-details">
          <label>Food Style</label>
          <input
            type="text"
            name="foodStyle"
            value={formData.foodStyle}
            onChange={handleInputChange}
            placeholder="e.g., Farm-to-table, Italian, BBQ"
          />
        </div>
        
        <div className="form-group-wedding-details">
          <label>Photography Style</label>
          <input
            type="text"
            name="photographyStyle"
            value={formData.photographyStyle}
            onChange={handleInputChange}
            placeholder="e.g., Documentary, Fine Art, Candid"
          />
        </div>
      </div>
      
      <div className="form-group-wedding-details full-width">
        <label>Guest Experience Vision</label>
        <textarea
          name="guestExperience"
          value={formData.guestExperience}
          onChange={handleInputChange}
          placeholder="Describe the experience you want your guests to have..."
          rows="4"
        />
      </div>
      
      <div className="form-group-wedding-details full-width">
        <label>Inspiration Notes</label>
        <textarea
          name="inspirationNotes"
          value={formData.inspirationNotes}
          onChange={handleInputChange}
          placeholder="Any additional inspiration, ideas, or notes about your wedding vision..."
          rows="6"
        />
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-tab-content">
      <Settings currentDashboard="wedding-planner" />
    </div>
  );

  return (
    <div className="event-details-wedding-details">
      <div className="event-details-header-wedding-details">
        <div className="header-content-wedding-details">
          <h2 style={{fontFamily:'Outfit', fontSize:'2rem'}}>Wedding Inspiration Hub</h2>
          <p style={{fontFamily:'Outfit', fontSize:'1rem'}}>Plan your perfect wedding vision</p>
        </div>
        
        {daysUntilWedding && (
          <div className="wedding-countdown-wedding-details">
            <i className="fas fa-heart"></i>
            <span>{daysUntilWedding}</span>
          </div>
        )}
      </div>

      {saveMessage && (
        <div className={`save-message-wedding-details ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
          <i className={`fas ${saveMessage.includes('Error') ? 'fa-exclamation-triangle' : 'fa-check-circle'}`}></i>
          {saveMessage}
        </div>
      )}

      <div className="event-details-content-wedding-details">
        <div className="inspiration-tabs-wedding-details">
          <button 
            className={`tab-button-wedding-details ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            <i className="fas fa-info-circle"></i>
            Basic Info
          </button>
          <button 
            className={`tab-button-wedding-details ${activeTab === 'venue' ? 'active' : ''}`}
            onClick={() => setActiveTab('venue')}
          >
            <i className="fas fa-map-marker-alt"></i>
            Venue
          </button>
          <button 
            className={`tab-button-wedding-details ${activeTab === 'colors' ? 'active' : ''}`}
            onClick={() => setActiveTab('colors')}
          >
            <i className="fas fa-palette"></i>
            Colors
          </button>
          <button 
            className={`tab-button-wedding-details ${activeTab === 'moodboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('moodboard')}
          >
            <i className="fas fa-images"></i>
            Inspiration Board
          </button>
          <button 
            className={`tab-button-wedding-details ${activeTab === 'style' ? 'active' : ''}`}
            onClick={() => setActiveTab('style')}
          >
            <i className="fas fa-star"></i>
            Style Details
          </button>
          <button 
            className={`tab-button-wedding-details ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <i className="fas fa-cog"></i>
            Settings
          </button>
        </div>

        <div className="tab-content-wedding-details">
          {activeTab === 'basic' && renderBasicInfo()}
          {activeTab === 'venue' && renderVenueInfo()}
          {activeTab === 'colors' && renderColorPalette()}
          {activeTab === 'moodboard' && renderMoodBoard()}
          {activeTab === 'style' && renderStyleDetails()}
          {activeTab === 'settings' && renderSettings()}
        </div>

        <div className="form-actions-wedding-details">
          {hasUnsavedChanges() && (
            <>
              <button 
                className="cancel-btn-wedding-details"
                onClick={resetToOriginal}
              >
                Cancel
              </button>
              <button 
                className="save-btn-wedding-details"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="d-flex align-items-center">
                    <LoadingSpinner variant="clip" color="white" size={16} />
                    <span className="ms-2">Saving...</span>
                  </div>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Save Changes
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Photo Upload Modal */}
      {showUploadModal && (
        <div className="upload-modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="upload-modal-content" onClick={e => e.stopPropagation()}>
            <div className="upload-modal-header">
              <h3>Upload Photos</h3>
              <button 
                className="upload-modal-close"
                onClick={() => setShowUploadModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="upload-modal-body">
              <div className="upload-category-selector">
                <label>Upload to category:</label>
                <select 
                  value={selectedCategory || ''} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Show special message for couple photos category */}
              {selectedCategory && categories.find(c => c.id === selectedCategory)?.special_type === 'couple_photos' && (
                <div className="upload-category-info">
                  <i className="fas fa-heart" style={{ color: '#ec4899' }}></i>
                  <div>
                    <strong>Couple Photos Category</strong>
                    <p>Photos uploaded here will be used for your RSVP page slideshow and wedding dashboard background.</p>
                  </div>
                </div>
              )}
              
              <label className="upload-modal-area">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    handleImageUpload(e);
                    // Don't close modal immediately - let it stay open during upload
                  }}
                  disabled={isUploading}
                />
                <div className="upload-modal-content-area">
                  {isUploading ? (
                    <div className="upload-loading-state">
                      <LoadingSpinner variant="ring" color="#ec4899" size={32} />
                      <span className="upload-loading-text">Uploading images...</span>
                      <small className="upload-loading-subtext">Please wait while your images are being processed</small>
                    </div>
                  ) : (
                    <>
                      <i className="fas fa-cloud-upload-alt"></i>
                      <span>Click to upload or drag images here</span>
                      <small>Supports JPG, PNG, GIF up to 10MB each</small>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Move Images Modal */}
      {showMoveModal && (
        <div className="upload-modal-overlay" onClick={() => setShowMoveModal(false)}>
          <div className="upload-modal-content move-modal" onClick={e => e.stopPropagation()}>
            <div className="upload-modal-header">
              <h3>Move Images</h3>
              <button 
                className="upload-modal-close"
                onClick={() => setShowMoveModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="upload-modal-body">
              <p className="move-modal-description">
                Move {selectedPhotos.length} selected image{selectedPhotos.length > 1 ? 's' : ''} to:
              </p>
              
              <div className="move-category-selector">
                <label>Select category:</label>
                <select 
                  id="move-category-select"
                  onChange={(e) => {
                    if (e.target.value) {
                      bulkMoveImages(e.target.value);
                    }
                  }}
                >
                  <option value="">Choose a category...</option>
                  {categories
                    .filter(category => category.id !== selectedCategory) // Don't show current category
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="move-modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowMoveModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDetails; 