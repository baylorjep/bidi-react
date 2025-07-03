import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './PublicRSVP.css';
import LoadingSpinner from '../components/LoadingSpinner';

function PublicRSVP() {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [weddingData, setWeddingData] = useState(null);
  const [couplePhotos, setCouplePhotos] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [lastUserActivity, setLastUserActivity] = useState(Date.now());
  const [rsvpForm, setRsvpForm] = useState({
    name: '',
    email: '',
    phone: '',
    rsvp_status: 'attending',
    dietary_restrictions: '',
    plus_one_attending: false,
    plus_one_name: '',
    plus_one_dietary: '',
    message: '',
    group_name: '',
    address: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // React Quill configuration
  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  const quillFormats = [
    'bold', 'italic', 'underline',
    'list', 'bullet'
  ];

  useEffect(() => {
    loadWeddingData();
  }, [linkId]);

  // Auto-advance slideshow
  useEffect(() => {
    if (couplePhotos.length <= 1) return;

    const interval = setInterval(() => {
      if (isAutoPlaying) {
        setCurrentPhotoIndex(prev => 
          prev === couplePhotos.length - 1 ? 0 : prev + 1
        );
      }
    }, 4000); // Change photo every 4 seconds

    return () => clearInterval(interval);
  }, [couplePhotos.length, isAutoPlaying]);

  // Resume auto-play after inactivity
  useEffect(() => {
    if (couplePhotos.length <= 1) return;

    const timeout = setTimeout(() => {
      setIsAutoPlaying(true);
    }, 5000); // Resume auto-play after 5 seconds of inactivity

    return () => clearTimeout(timeout);
  }, [lastUserActivity, couplePhotos.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (couplePhotos.length <= 1) return;
      
      if (e.key === 'ArrowLeft') {
        prevPhoto();
      } else if (e.key === 'ArrowRight') {
        nextPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [couplePhotos.length]);

  const loadWeddingData = async () => {
    try {
      setLoading(true);
      
      // First, get the RSVP link to find the wedding
      const { data: rsvpLink, error: linkError } = await supabase
        .from('wedding_rsvp_links')
        .select('*')
        .eq('link_id', linkId)
        .eq('is_active', true)
        .single();

      if (linkError || !rsvpLink) {
        toast.error('Invalid or inactive RSVP link');
        navigate('/');
        return;
      }

      // Get the wedding data
      const { data: wedding, error: weddingError } = await supabase
        .from('wedding_plans')
        .select('*')
        .eq('id', rsvpLink.wedding_id)
        .single();

      if (weddingError || !wedding) {
        toast.error('Wedding not found');
        navigate('/');
        return;
      }

      setWeddingData(wedding);
      
      // Load couple photos from mood board
      await loadCouplePhotos(wedding.id);
    } catch (error) {
      console.error('Error loading wedding data:', error);
      toast.error('Failed to load wedding information');
    } finally {
      setLoading(false);
    }
  };

  const loadCouplePhotos = async (weddingId) => {
    try {
      // First, try to find the dedicated couple photos category
      const { data: coupleCategory, error: categoryError } = await supabase
        .from('wedding_photo_categories')
        .select('*')
        .eq('wedding_plan_id', weddingId)
        .or(`name.ilike.%couple%,special_type.eq.couple_photos`)
        .single();

      if (categoryError && categoryError.code !== 'PGRST116') {
        console.error('Error loading couple category:', categoryError);
      }

      let query = supabase
        .from('wedding_mood_board')
        .select('*')
        .eq('wedding_plan_id', weddingId)
        .order('uploaded_at', { ascending: false });

      // If couple category exists, use photos from that category
      if (coupleCategory) {
        query = query.eq('category_id', coupleCategory.id);
      } else {
        // Fallback: try to find any category with "couple" in the name
        const { data: categories, error: categoriesError } = await supabase
          .from('wedding_photo_categories')
          .select('*')
          .eq('wedding_plan_id', weddingId)
          .ilike('name', '%couple%');

        if (!categoriesError && categories && categories.length > 0) {
          query = query.eq('category_id', categories[0].id);
        }
      }

      const { data: photos, error: photosError } = await query;

      if (photosError) {
        console.error('Error loading couple photos:', photosError);
        setCouplePhotos([]);
        return;
      }

      if (photos && photos.length > 0) {
        // Filter out any photos with invalid URLs and limit to first 6 photos
        const validPhotos = photos
          .filter(photo => photo.image_url && photo.image_url.trim() !== '')
          .slice(0, 6);
        setCouplePhotos(validPhotos);
      } else {
        // Final fallback: get any photos from the wedding
        const { data: fallbackPhotos, error: fallbackError } = await supabase
          .from('wedding_mood_board')
          .select('*')
          .eq('wedding_plan_id', weddingId)
          .order('uploaded_at', { ascending: false })
          .limit(6);

        if (!fallbackError && fallbackPhotos && fallbackPhotos.length > 0) {
          const validFallbackPhotos = fallbackPhotos
            .filter(photo => photo.image_url && photo.image_url.trim() !== '')
            .slice(0, 6);
          setCouplePhotos(validFallbackPhotos);
        } else {
          setCouplePhotos([]);
        }
      }
    } catch (error) {
      console.error('Error loading couple photos:', error);
      setCouplePhotos([]);
    }
  };

  const nextPhoto = () => {
    handleUserActivity();
    setCurrentPhotoIndex(prev => 
      prev === couplePhotos.length - 1 ? 0 : prev + 1
    );
  };

  const prevPhoto = () => {
    handleUserActivity();
    setCurrentPhotoIndex(prev => 
      prev === 0 ? couplePhotos.length - 1 : prev - 1
    );
  };

  const goToPhoto = (index) => {
    handleUserActivity();
    setCurrentPhotoIndex(index);
  };

  // Handle user activity - pause auto-play and update activity timestamp
  const handleUserActivity = () => {
    setIsAutoPlaying(false);
    setLastUserActivity(Date.now());
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextPhoto();
    } else if (isRightSwipe) {
      prevPhoto();
    }
  };

  const handleSubmitRSVP = async (e) => {
    e.preventDefault();
    
    if (!rsvpForm.name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    try {
      setSubmitting(true);

      // Check if guest already exists
      const { data: existingGuest } = await supabase
        .from('wedding_guests')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .eq('name', rsvpForm.name.trim())
        .single();

      let guestData;
      
      if (existingGuest) {
        // Update existing guest
        const updates = {
          email: rsvpForm.email,
          phone: rsvpForm.phone,
          rsvp_status: rsvpForm.rsvp_status,
          dietary_restrictions: rsvpForm.dietary_restrictions,
          plus_one: rsvpForm.plus_one_attending,
          plus_one_name: rsvpForm.plus_one_attending ? rsvpForm.plus_one_name : '',
          plus_one_dietary: rsvpForm.plus_one_attending ? rsvpForm.plus_one_dietary : '',
          notes: rsvpForm.message,
          group_name: rsvpForm.group_name,
          address: rsvpForm.address,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('wedding_guests')
          .update(updates)
          .eq('id', existingGuest.id);

        if (error) throw error;
        guestData = { ...existingGuest, ...updates };
      } else {
        // Create new guest
        const newGuest = {
          wedding_id: weddingData.id,
          name: rsvpForm.name.trim(),
          email: rsvpForm.email,
          phone: rsvpForm.phone,
          rsvp_status: rsvpForm.rsvp_status,
          dietary_restrictions: rsvpForm.dietary_restrictions,
          plus_one: rsvpForm.plus_one_attending,
          plus_one_name: rsvpForm.plus_one_attending ? rsvpForm.plus_one_name : '',
          plus_one_dietary: rsvpForm.plus_one_attending ? rsvpForm.plus_one_dietary : '',
          notes: rsvpForm.message,
          group_name: rsvpForm.group_name,
          address: rsvpForm.address,
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('wedding_guests')
          .insert([newGuest])
          .select()
          .single();

        if (error) throw error;
        guestData = data;
      }

      toast.success('RSVP submitted successfully!');
      
      // Reset form
      setRsvpForm({
        name: '',
        email: '',
        phone: '',
        rsvp_status: 'attending',
        dietary_restrictions: '',
        plus_one_attending: false,
        plus_one_name: '',
        plus_one_dietary: '',
        message: '',
        group_name: '',
        address: ''
      });

      // Show success message
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error submitting RSVP:', error);
      toast.error('Failed to submit RSVP');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="public-rsvp">
        <LoadingSpinner 
          variant="ring" 
          color="white" 
          text="Loading wedding information..." 
          fullScreen={true}
        />
      </div>
    );
  }

  if (!weddingData) {
    return (
      <div className="public-rsvp-error">
        <i className="fas fa-exclamation-triangle"></i>
        <h2>Invalid RSVP Link</h2>
        <p>The RSVP link you're trying to access is invalid or has expired.</p>
        <button onClick={() => navigate('/')} className="home-btn">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="public-rsvp">
      <div className="rsvp-header">
        <div className="wedding-info">
          <h1>{weddingData.wedding_title}</h1>
          <div className="wedding-details">
            <div className="detail-item">
              <i className="fas fa-calendar"></i>
              <span>{new Date(weddingData.wedding_date).toLocaleDateString()}</span>
            </div>
            {weddingData.wedding_location && (
              <div className="detail-item">
                <i className="fas fa-map-marker-alt"></i>
                <span>{weddingData.wedding_location}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Couple Photos Gallery */}
        {couplePhotos.length > 0 && (
          <div className="couple-photos-gallery">
            <div className="slideshow-header">
              <h3>Meet the Happy Couple</h3>
              {couplePhotos.length > 1 && (
                <div className="auto-play-indicator">
                  <i className={`fas ${isAutoPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                  <span>{isAutoPlaying ? 'Auto-playing' : 'Paused'}</span>
                </div>
              )}
            </div>
            <div className="slideshow-container"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {couplePhotos.map((photo, index) => (
                <div 
                  key={photo.id || index} 
                  className={`slide ${index === currentPhotoIndex ? 'active' : ''}`}
                >
                  <img 
                    src={photo.image_url} 
                    alt={photo.image_name || `Couple photo ${index + 1}`}
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <div 
                    className="photo-placeholder"
                    style={{ 
                      display: 'none',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      fontSize: '0.8rem',
                      fontWeight: '500'
                    }}
                  >
                    Photo
                  </div>
                </div>
              ))}
              
              {/* Navigation Arrows */}
              {couplePhotos.length > 1 && (
                <>
                  <button className="slide-nav prev" onClick={prevPhoto}>
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button className="slide-nav next" onClick={nextPhoto}>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </>
              )}
              
              {/* Dots Indicator */}
              {couplePhotos.length > 1 && (
                <div className="slide-dots">
                  {couplePhotos.map((_, index) => (
                    <button
                      key={index}
                      className={`dot ${index === currentPhotoIndex ? 'active' : ''}`}
                      onClick={() => goToPhoto(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rsvp-content">
        <div className="rsvp-form-container">
          <div className="rsvp-intro">
            <h2>RSVP for Our Wedding</h2>
            <p>Please fill out the form below to let us know if you'll be attending our special day!</p>
          </div>

          <form onSubmit={handleSubmitRSVP} className="rsvp-form">
            <div className="form-section">
              <h3>Your Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={rsvpForm.name}
                    onChange={(e) => setRsvpForm({...rsvpForm, name: e.target.value})}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={rsvpForm.email}
                    onChange={(e) => setRsvpForm({...rsvpForm, email: e.target.value})}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={rsvpForm.phone}
                    onChange={(e) => setRsvpForm({...rsvpForm, phone: e.target.value})}
                    placeholder="Your phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Group</label>
                  <select
                    value={rsvpForm.group_name}
                    onChange={(e) => setRsvpForm({...rsvpForm, group_name: e.target.value})}
                  >
                    <option value="">Select a group</option>
                    <option value="Family">Family</option>
                    <option value="Friends">Friends</option>
                    <option value="Colleagues">Colleagues</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Mailing Address</label>
                <textarea
                  value={rsvpForm.address}
                  onChange={(e) => setRsvpForm({...rsvpForm, address: e.target.value})}
                  placeholder="Your complete mailing address for wedding invitations"
                  rows="3"
                />
                <small className="form-help">We'll use this address to send you a wedding invitation</small>
              </div>
            </div>

            <div className="form-section">
              <h3>Will you attend?</h3>
              <div className="rsvp-options">
                <label className="rsvp-option">
                  <input
                    type="radio"
                    name="rsvp_status"
                    value="attending"
                    checked={rsvpForm.rsvp_status === 'attending'}
                    onChange={(e) => setRsvpForm({...rsvpForm, rsvp_status: e.target.value})}
                  />
                  <span className="option-content">
                    <i className="fas fa-check"></i>
                    <span>Yes, I will attend</span>
                  </span>
                </label>
                
                <label className="rsvp-option">
                  <input
                    type="radio"
                    name="rsvp_status"
                    value="declined"
                    checked={rsvpForm.rsvp_status === 'declined'}
                    onChange={(e) => setRsvpForm({...rsvpForm, rsvp_status: e.target.value})}
                  />
                  <span className="option-content">
                    <i className="fas fa-times"></i>
                    <span>No, I cannot attend</span>
                  </span>
                </label>

                <label className="rsvp-option">
                  <input
                    type="radio"
                    name="rsvp_status"
                    value="invitation_only"
                    checked={rsvpForm.rsvp_status === 'invitation_only'}
                    onChange={(e) => setRsvpForm({...rsvpForm, rsvp_status: e.target.value})}
                  />
                  <span className="option-content">
                    <i className="fas fa-envelope"></i>
                    <span>No, but I want an invitation</span>
                  </span>
                </label>
              </div>
            </div>

            {rsvpForm.rsvp_status === 'attending' && (
              <>
                <div className="form-section">
                  <h3>Dietary Restrictions</h3>
                  <p>Please let us know if you have any dietary restrictions or allergies:</p>
                  <ReactQuill
                    value={rsvpForm.dietary_restrictions}
                    onChange={(value) => setRsvpForm({...rsvpForm, dietary_restrictions: value})}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="e.g., Vegetarian, Gluten-free, Nut allergies, etc."
                  />
                </div>

                <div className="form-section">
                  <h3>Plus One Information</h3>
                  <div className="plus-one-section">
                    <label className="checkbox-label-public-rsvp">
                      <input
                        type="checkbox"
                        checked={rsvpForm.plus_one_attending}
                        onChange={(e) => setRsvpForm({...rsvpForm, plus_one_attending: e.target.checked})}
                      />
                      <span>I will be bringing a plus one</span>
                    </label>
                    
                    {rsvpForm.plus_one_attending && (
                      <div className="plus-one-details">
                        <div className="form-row">
                          <div className="form-group">
                            <label>Plus One's Name *</label>
                            <input
                              type="text"
                              value={rsvpForm.plus_one_name}
                              onChange={(e) => setRsvpForm({...rsvpForm, plus_one_name: e.target.value})}
                              placeholder="Plus one's full name"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Plus One's Dietary Restrictions</label>
                            <ReactQuill
                              value={rsvpForm.plus_one_dietary}
                              onChange={(value) => setRsvpForm({...rsvpForm, plus_one_dietary: value})}
                              modules={quillModules}
                              formats={quillFormats}
                              placeholder="e.g., Vegetarian, Gluten-free, etc."
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-section">
                  <h3>Message (Optional)</h3>
                  <p>Feel free to leave a message for the couple:</p>
                  <ReactQuill
                    value={rsvpForm.message}
                    onChange={(value) => setRsvpForm({...rsvpForm, message: value})}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Share your excitement, well wishes, or any other message..."
                  />
                </div>
              </>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit RSVP'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PublicRSVP; 