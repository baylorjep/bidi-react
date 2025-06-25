import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './EventDetails.css';

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
    primaryColor: '#ec4899',
    secondaryColor: '#8b5cf6',
    accentColor: '#f59e0b',
    neutralColor: '#6b7280',
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [moodBoardImages, setMoodBoardImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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
        primaryColor: weddingData.primary_color || '#ec4899',
        secondaryColor: weddingData.secondary_color || '#8b5cf6',
        accentColor: weddingData.accent_color || '#f59e0b',
        neutralColor: weddingData.neutral_color || '#6b7280',
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
      loadMoodBoardImages();
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
          id: item.id // Add database ID for deletion
        }));

        setMoodBoardImages(loadedImages);
      } else {
        setMoodBoardImages([]);
      }
    } catch (error) {
      console.error('Error loading mood board images:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleColorChange = (colorType, color) => {
    setFormData(prev => ({
      ...prev,
      [colorType]: color
    }));
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
          primary_color: formData.primaryColor,
          secondary_color: formData.secondaryColor,
          accent_color: formData.accentColor,
          neutral_color: formData.neutralColor,
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
          primary_color: formData.primaryColor,
          secondary_color: formData.secondaryColor,
          accent_color: formData.accentColor,
          neutral_color: formData.neutralColor,
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
          id: dbData.id
        });
      }

      setMoodBoardImages(prev => [...prev, ...uploadedImages]);
      setSaveMessage(`${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''} uploaded successfully!`);
      setTimeout(() => setSaveMessage(''), 3000);
      
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

  const hasUnsavedChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  const resetToOriginal = () => {
    setFormData(originalData);
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedImageIndex(0);
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
      <div className="color-palette-grid-wedding-details">
        <div className="color-item-wedding-details">
          <label>Primary Color</label>
          <div className="color-picker-container-wedding-details">
            <input
              type="color"
              value={formData.primaryColor}
              onChange={(e) => handleColorChange('primaryColor', e.target.value)}
              className="color-picker-wedding-details"
            />
            <input
              type="text"
              value={formData.primaryColor}
              onChange={(e) => handleColorChange('primaryColor', e.target.value)}
              className="color-hex-wedding-details"
              placeholder="#ec4899"
            />
          </div>
        </div>
        
        <div className="color-item-wedding-details">
          <label>Secondary Color</label>
          <div className="color-picker-container-wedding-details">
            <input
              type="color"
              value={formData.secondaryColor}
              onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
              className="color-picker-wedding-details"
            />
            <input
              type="text"
              value={formData.secondaryColor}
              onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
              className="color-hex-wedding-details"
              placeholder="#8b5cf6"
            />
          </div>
        </div>
        
        <div className="color-item-wedding-details">
          <label>Accent Color</label>
          <div className="color-picker-container-wedding-details">
            <input
              type="color"
              value={formData.accentColor}
              onChange={(e) => handleColorChange('accentColor', e.target.value)}
              className="color-picker-wedding-details"
            />
            <input
              type="text"
              value={formData.accentColor}
              onChange={(e) => handleColorChange('accentColor', e.target.value)}
              className="color-hex-wedding-details"
              placeholder="#f59e0b"
            />
          </div>
        </div>
        
        <div className="color-item-wedding-details">
          <label>Neutral Color</label>
          <div className="color-picker-container-wedding-details">
            <input
              type="color"
              value={formData.neutralColor}
              onChange={(e) => handleColorChange('neutralColor', e.target.value)}
              className="color-picker-wedding-details"
            />
            <input
              type="text"
              value={formData.neutralColor}
              onChange={(e) => handleColorChange('neutralColor', e.target.value)}
              className="color-hex-wedding-details"
              placeholder="#6b7280"
            />
          </div>
        </div>
      </div>
      
      <div className="color-preview-wedding-details">
        <h4>Color Preview</h4>
        <div className="color-swatch-wedding-details" style={{ backgroundColor: formData.primaryColor }}>
          <span>Primary</span>
        </div>
        <div className="color-swatch-wedding-details" style={{ backgroundColor: formData.secondaryColor }}>
          <span>Secondary</span>
        </div>
        <div className="color-swatch-wedding-details" style={{ backgroundColor: formData.accentColor }}>
          <span>Accent</span>
        </div>
        <div className="color-swatch-wedding-details" style={{ backgroundColor: formData.neutralColor }}>
          <span>Neutral</span>
        </div>
      </div>
    </div>
  );

  const renderMoodBoard = () => (
    <div className="details-section-wedding-details">
      <h3>Mood Board</h3>
      <p className="section-description-wedding-details">
        Upload inspiration images to create your wedding mood board. 
        <span className="upload-hint-wedding-details">
          <i className="fas fa-lightbulb"></i>
          Tip: You can drag and drop multiple images at once!
        </span>
      </p>
      
      <div className="upload-section-wedding-details">
        <label className="upload-area-wedding-details">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
          <div className="upload-content-wedding-details">
            {isUploading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>Uploading...</span>
              </>
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
      
      <div className="mood-board-grid-wedding-details">
        {moodBoardImages.map((image, index) => (
          <div key={index} className="mood-board-item-wedding-details">
            <img 
              src={image.url} 
              alt={image.name} 
              onClick={() => handleImageClick(index)}
              style={{ cursor: 'pointer' }}
            />
            <button 
              className="remove-image-wedding-details"
              onClick={() => removeImage(index)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        ))}
        
        {moodBoardImages.length === 0 && (
          <div className="empty-mood-board-wedding-details">
            <i className="fas fa-images"></i>
            <p>No inspiration images yet</p>
            <small>Upload images to create your mood board</small>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && moodBoardImages.length > 0 && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column'
          }}
        >
          <button 
            onClick={handleCloseImageModal}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '20px',
              cursor: 'pointer',
              zIndex: 10000
            }}
          >
            ×
          </button>
          <img 
            src={moodBoardImages[selectedImageIndex].url}
            alt={moodBoardImages[selectedImageIndex].name}
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
              objectFit: 'contain'
            }}
          />
        </div>
      )}
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
            Mood Board
          </button>
          <button 
            className={`tab-button-wedding-details ${activeTab === 'style' ? 'active' : ''}`}
            onClick={() => setActiveTab('style')}
          >
            <i className="fas fa-star"></i>
            Style Details
          </button>
        </div>

        <div className="tab-content-wedding-details">
          {activeTab === 'basic' && renderBasicInfo()}
          {activeTab === 'venue' && renderVenueInfo()}
          {activeTab === 'colors' && renderColorPalette()}
          {activeTab === 'moodboard' && renderMoodBoard()}
          {activeTab === 'style' && renderStyleDetails()}
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
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Saving...
                  </>
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
    </div>
  );
}

export default EventDetails; 