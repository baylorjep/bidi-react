import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../supabaseClient';
import './WeddingInspiration.css';
import ImageModal from './Business/Portfolio/ImageModal';

const PHOTOS_PER_PAGE = 24;

const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768;

const WeddingInspiration = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState({});
  const [businessCategories, setBusinessCategories] = useState({});
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [userWeddingPlan, setUserWeddingPlan] = useState(null);
  const [userCategories, setUserCategories] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedPhotoToSave, setSelectedPhotoToSave] = useState(null);
  const [selectedSaveCategory, setSelectedSaveCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userPhotos, setUserPhotos] = useState([]);
  const [selectedSidebarCategory, setSelectedSidebarCategory] = useState(null);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(isMobile());
  const [activeOverlayPhoto, setActiveOverlayPhoto] = useState(null); // photo id or index
  const overlayTimeoutRef = React.useRef(null);
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);
  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]); // array of photo ids
  const [batchSaveModalOpen, setBatchSaveModalOpen] = useState(false);
  const [batchSaveCategory, setBatchSaveCategory] = useState("");
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  useEffect(() => {
    const fetchPhotos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profile_photos')
        .select('id, photo_url, file_path, photo_type, created_at, category_id, user_id')
        .not('photo_type', 'eq', 'profile');
      if (!error && data) {
        // Filter out videos
        const imageData = data.filter(photo => photo.photo_type !== 'video');
        setPhotos(imageData);
        // Fetch business names and categories for each user_id
        const userIds = [...new Set(imageData.map(photo => photo.user_id))];
        if (userIds.length > 0) {
          const { data: businessData, error: businessError } = await supabase
            .from('business_profiles')
            .select('id, business_name, business_category')
            .in('id', userIds);
          if (!businessError && businessData) {
            const businessMap = {};
            const categoryMap = {};
            let categoriesSet = new Set();
            businessData.forEach(biz => {
              businessMap[biz.id] = biz.business_name;
              // Normalize categories to array
              let cats = biz.business_category;
              if (cats && !Array.isArray(cats)) cats = [cats];
              categoryMap[biz.id] = cats || [];
              cats && cats.forEach(cat => categoriesSet.add(cat));
            });
            setBusinesses(businessMap);
            setBusinessCategories(categoryMap);
            setAllCategories(['All', ...Array.from(categoriesSet).filter(Boolean)]);
          }
        }
      }
      setLoading(false);
    };
    fetchPhotos();
  }, []);

  // Check if user is signed in and has a wedding plan
  useEffect(() => {
    const checkUserAndWeddingPlan = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setUser(currentUser);
          
          // Check if user has a wedding plan
          const { data: weddingPlan, error } = await supabase
            .from('wedding_plans')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
          
          if (!error && weddingPlan) {
            setUserWeddingPlan(weddingPlan);
            
            // Fetch user's wedding categories
            const { data: categoriesData, error: categoriesError } = await supabase
              .from('wedding_photo_categories')
              .select('*')
              .or(`is_default.eq.true,wedding_plan_id.eq.${weddingPlan.id}`)
              .order('sort_order', { ascending: true });
            
            if (!categoriesError && categoriesData) {
              setUserCategories(categoriesData);
            }

            // Fetch user's saved photos
            const { data: photosData, error: photosError } = await supabase
              .from('wedding_mood_board')
              .select('*')
              .eq('wedding_plan_id', weddingPlan.id)
              .order('uploaded_at', { ascending: false });
            
            if (!photosError && photosData) {
              setUserPhotos(photosData);
            }
          }
        }
      } catch (error) {
        console.error('Error checking user and wedding plan:', error);
      }
    };
    
    checkUserAndWeddingPlan();
  }, []);

  // Filter photos by selected category
  const filteredPhotos = selectedCategory === 'All'
    ? photos
    : photos.filter(photo => {
        const cats = businessCategories[photo.user_id] || [];
        if (selectedCategory === 'photography') {
          // Include both photography and videography for photography filter
          return cats.includes('photography') || cats.includes('videography');
        }
        if (selectedCategory === 'wedding planning') {
          // Match 'wedding planner/coordinator' for wedding planning
          return cats.includes('wedding planner/coordinator');
        }
        return cats.includes(selectedCategory);
      });

  // Only shuffle on initial load, not when switching categories
  const [shuffledPhotos, setShuffledPhotos] = useState([]);
  const [hasShuffled, setHasShuffled] = useState(false);

  useEffect(() => {
    if (!hasShuffled && filteredPhotos.length > 0) {
      let shuffled;
      if (selectedCategory === 'All') {
        // Separate catering and non-catering photos
        const cateringPhotos = filteredPhotos.filter(photo => {
          const cats = businessCategories[photo.user_id] || [];
          return cats.includes('catering');
        });
        const nonCateringPhotos = filteredPhotos.filter(photo => {
          const cats = businessCategories[photo.user_id] || [];
          return !cats.includes('catering');
        });
        
        // Shuffle each group separately, then combine with catering at the back
        const shuffledNonCatering = [...nonCateringPhotos].sort(() => Math.random() - 0.5);
        const shuffledCatering = [...cateringPhotos].sort(() => Math.random() - 0.5);
        shuffled = [...shuffledNonCatering, ...shuffledCatering];
      } else {
        // For specific categories, just shuffle normally
        shuffled = [...filteredPhotos].sort(() => Math.random() - 0.5);
      }
      setShuffledPhotos(shuffled);
      setHasShuffled(true);
    } else {
      // When switching categories, use the filtered photos in their original order
      setShuffledPhotos(filteredPhotos);
    }
  }, [selectedCategory, filteredPhotos, hasShuffled, businessCategories]);

  const totalPages = Math.ceil(shuffledPhotos.length / PHOTOS_PER_PAGE);
  const paginatedPhotos = shuffledPhotos.slice((page - 1) * PHOTOS_PER_PAGE, page * PHOTOS_PER_PAGE);

  // Prepare data for ImageModal
  const modalMedia = paginatedPhotos.map(photo => ({
    url: photo.photo_url || photo.file_path,
    type: 'image',
    user_id: photo.user_id,
    businessName: businesses[photo.user_id] || '',
  }));

  // Handle saving photo to wedding plan
  const handleSaveToWedding = (photo) => {
    if (!userWeddingPlan) {
      alert('You need to create a wedding plan first to save photos.');
      return;
    }
    setSelectedPhotoToSave(photo);
    setSelectedSaveCategory('');
    setShowSaveModal(true);
  };

  const savePhotoToWedding = async () => {
    if (!selectedPhotoToSave || !selectedSaveCategory) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('wedding_mood_board')
        .insert({
          wedding_plan_id: userWeddingPlan.id,
          image_url: selectedPhotoToSave.photo_url || selectedPhotoToSave.file_path,
          image_name: `Inspiration from ${businesses[selectedPhotoToSave.user_id] || 'Vendor'}`,
          category_id: selectedSaveCategory,
          uploaded_at: new Date().toISOString()
        });

      if (error) throw error;
      
      // Refresh user photos after saving
      const { data: photosData, error: photosError } = await supabase
        .from('wedding_mood_board')
        .select('*')
        .eq('wedding_plan_id', userWeddingPlan.id)
        .order('uploaded_at', { ascending: false });
      
      if (!photosError && photosData) {
        setUserPhotos(photosData);
      }
      
      setShowSaveModal(false);
      setSelectedPhotoToSave(null);
      setSelectedSaveCategory('');
      alert('Photo saved to your wedding inspiration board!');
    } catch (error) {
      console.error('Error saving photo:', error);
      alert('Error saving photo. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Get photos for a specific category
  const getPhotosForCategory = (categoryId) => {
    if (!categoryId) return userPhotos;
    return userPhotos.filter(photo => photo.category_id === categoryId);
  };

  // Get photo count for a category
  const getPhotoCountForCategory = (categoryId) => {
    return getPhotosForCategory(categoryId).length;
  };

  // Category management functions
  const createCategory = async (name) => {
    if (!userWeddingPlan?.id) return;

    try {
      const { data, error } = await supabase
        .from('wedding_photo_categories')
        .insert({
          name,
          wedding_plan_id: userWeddingPlan.id,
          color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
          sort_order: userCategories.length + 1
        })
        .select()
        .single();

      if (error) throw error;
      
      setUserCategories(prev => [...prev, data]);
      setSelectedSidebarCategory(data.id);
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
      
      setUserCategories(prev => 
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
      const categoryToDelete = userCategories.find(cat => cat.id === categoryId);
      
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
      
      setUserCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setSelectedSidebarCategory(userCategories.find(cat => cat.id !== categoryId)?.id || null);
      
      // Refresh user photos to update category_id
      const { data: photosData, error: photosError } = await supabase
        .from('wedding_mood_board')
        .select('*')
        .eq('wedding_plan_id', userWeddingPlan.id)
        .order('uploaded_at', { ascending: false });
      
      if (!photosError && photosData) {
        setUserPhotos(photosData);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  useEffect(() => {
    const handleResize = () => setMobile(isMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hide overlays when tapping outside (mobile only)
  useEffect(() => {
    if (!mobile || activeOverlayPhoto === null) return;
    const handleClick = (e) => {
      // Only hide if click is outside any .inspiration-img-wrapper
      if (!e.target.closest('.inspiration-img-wrapper')) {
        setActiveOverlayPhoto(null);
      }
    };
    document.addEventListener('touchstart', handleClick);
    return () => document.removeEventListener('touchstart', handleClick);
  }, [mobile, activeOverlayPhoto]);

  // Hide overlays after a timeout (mobile only)
  useEffect(() => {
    if (!mobile || activeOverlayPhoto === null) return;
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    overlayTimeoutRef.current = setTimeout(() => setActiveOverlayPhoto(null), 4000);
    return () => overlayTimeoutRef.current && clearTimeout(overlayTimeoutRef.current);
  }, [mobile, activeOverlayPhoto]);

  // Generate structured data for SEO
  const generateStructuredData = () => {
    return {
      "@context": "https://schema.org",
      "@type": "ImageGallery",
      "name": "Wedding Inspiration Gallery",
      "description": "Browse thousands of beautiful wedding photos from top vendors. Find inspiration for your wedding photography, flowers, venues, catering, and more. Save photos to your wedding planning board.",
      "url": window.location.href,
      "image": photos.length > 0 ? photos[0].photo_url || photos[0].file_path : null,
      "numberOfItems": photos.length,
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": photos.length,
        "itemListElement": photos.slice(0, 10).map((photo, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "ImageObject",
            "contentUrl": photo.photo_url || photo.file_path,
            "description": `Wedding inspiration photo from ${businesses[photo.user_id] || 'professional vendor'}`
          }
        }))
      }
    };
  };

  // Handle save button click (single)
  const handleSaveClick = (photo) => {
    if (!user) {
      setSignInPromptOpen(true);
    } else {
      handleSaveToWedding(photo);
    }
  };

  // Handle select/deselect photo
  const handleSelectPhoto = (photoId) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  // Handle batch save
  const handleBatchSave = () => {
    if (!user) {
      setSignInPromptOpen(true);
    } else {
      setBatchSaveModalOpen(true);
    }
  };

  // Actually save all selected photos to the chosen category
  const saveBatchPhotos = async () => {
    if (!batchSaveCategory || selectedPhotos.length === 0) return;
    setIsBatchSaving(true);
    try {
      const batch = paginatedPhotos.filter((photo) => selectedPhotos.includes(photo.id));
      const inserts = batch.map((photo) => ({
        wedding_plan_id: userWeddingPlan.id,
        image_url: photo.photo_url || photo.file_path,
        image_name: `Inspiration from ${businesses[photo.user_id] || 'Vendor'}`,
        category_id: batchSaveCategory,
        uploaded_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from('wedding_mood_board').insert(inserts);
      if (error) throw error;
      setBatchSaveModalOpen(false);
      setSelectedPhotos([]);
      setSelectionMode(false);
      setBatchSaveCategory("");
      alert('Photos saved to your wedding inspiration board!');
    } catch (error) {
      alert('Error saving photos. Please try again.');
    } finally {
      setIsBatchSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="wedding-inspiration-container">
        <h1 className="inspiration-title">Wedding Inspiration Gallery</h1>
        <div className="skeleton-masonry">
          {Array.from({ length: 12 }).map((_, i) => (
            <div className="skeleton-photo-card" key={i}></div>
          ))}
        </div>
      </div>
    );
  }

  // Define allowed categories and display names
  const allowedCategories = ['All', 'wedding planning', 'photography', 'florist', 'venue', 'catering', 'cake'];
  const categoryDisplayNames = {
    'All': 'All',
    'wedding planning': 'Wedding Planning',
    'photography': 'Photography',
    'florist': 'Florist',
    'venue': 'Venue',
    'catering': 'Catering',
    'cake': 'Cake',
  };
  let filteredCategories = allCategories.filter(cat => allowedCategories.includes(cat));
  // Ensure 'wedding planning' is always present
  if (!filteredCategories.includes('wedding planning')) {
    filteredCategories = ['wedding planning', ...filteredCategories];
  }

  // Count photos for each category
  const categoryPhotoCounts = {};
  allowedCategories.forEach(cat => {
    if (cat === 'All') {
      categoryPhotoCounts[cat] = photos.length;
    } else if (cat === 'photography') {
      // Photography includes both photography and videography
      categoryPhotoCounts[cat] = photos.filter(photo => {
        const cats = businessCategories[photo.user_id] || [];
        return cats.includes('photography') || cats.includes('videography');
      }).length;
    } else if (cat === 'wedding planning') {
      // Wedding planning matches 'wedding planner/coordinator'
      categoryPhotoCounts[cat] = photos.filter(photo => {
        const cats = businessCategories[photo.user_id] || [];
        return cats.includes('wedding planner/coordinator');
      }).length;
    } else {
      categoryPhotoCounts[cat] = photos.filter(photo => {
        const cats = businessCategories[photo.user_id] || [];
        return cats.includes(cat);
      }).length;
    }
  });

  // Sort by photo count (descending), keep 'All' first
  filteredCategories = [
    'All',
    ...filteredCategories
      .filter(cat => cat !== 'All')
      .sort((a, b) => (categoryPhotoCounts[b] || 0) - (categoryPhotoCounts[a] || 0))
  ];

  return (
    <>
      <Helmet>
        <title>Wedding Inspiration Gallery | Browse Beautiful Wedding Photos | Bidi</title>
        <meta name="description" content="Discover thousands of beautiful wedding photos from top vendors. Find inspiration for your wedding photography, flowers, venues, catering, and more. Save photos to your wedding planning board." />
        <meta name="keywords" content="wedding inspiration, wedding photos, wedding photography, wedding flowers, wedding venues, wedding catering, wedding planning, wedding ideas, bridal inspiration" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={window.location.href} />
        
        {/* Open Graph */}
        <meta property="og:title" content="Wedding Inspiration Gallery | Browse Beautiful Wedding Photos" />
        <meta property="og:description" content="Discover thousands of beautiful wedding photos from top vendors. Find inspiration for your wedding photography, flowers, venues, catering, and more." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content={photos.length > 0 ? photos[0].photo_url || photos[0].file_path : '/images/wedding-inspiration-og.jpg'} />
        <meta property="og:site_name" content="Bidi" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Wedding Inspiration Gallery | Browse Beautiful Wedding Photos" />
        <meta name="twitter:description" content="Discover thousands of beautiful wedding photos from top vendors. Find inspiration for your wedding photography, flowers, venues, catering, and more." />
        <meta name="twitter:image" content={photos.length > 0 ? photos[0].photo_url || photos[0].file_path : '/images/wedding-inspiration-og.jpg'} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(generateStructuredData())}
        </script>
      </Helmet>

      <div className="wedding-inspiration-container">
        {/* Sidebar Toggle Button */}
        {userWeddingPlan && (
          <button 
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle wedding planning sidebar"
          >
            <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-folder'}`}></i>
            {sidebarOpen ? 'Close My Wedding' : 'My Wedding'}
          </button>
        )}

        {/* Sidebar */}
        {userWeddingPlan && (
          <aside className={`inspiration-sidebar ${sidebarOpen ? 'open' : ''}`} role="complementary" aria-label="Wedding planning sidebar">
            <div className="sidebar-header">
              <h3>My Wedding Inspiration</h3>
              <button 
                className="sidebar-close-btn"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="sidebar-content">
              <div className="sidebar-categories">
                <div className="categories-header" onClick={() => setCategoriesExpanded(!categoriesExpanded)}>
                  <h4>Categories</h4>
                  <div className="categories-header-actions">
                    <button 
                      className="add-category-btn-sidebar"
                      onClick={(e) => {
                        e.stopPropagation();
                        const categoryName = prompt('Enter category name:');
                        if (categoryName && categoryName.trim()) {
                          createCategory(categoryName.trim());
                        }
                      }}
                      title="Add new category"
                      aria-label="Add new category"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                    <button className="accordion-toggle" aria-label="Toggle categories">
                      <i className={`fas fa-chevron-${categoriesExpanded ? 'up' : 'down'}`}></i>
                    </button>
                  </div>
                </div>
                <div className={`category-list ${categoriesExpanded ? 'expanded' : ''}`}>
                  <div 
                    className={`category-item-wedding-inspo ${!selectedSidebarCategory ? 'active' : ''}`}
                    onClick={() => setSelectedSidebarCategory(null)}
                    role="button"
                    tabIndex={0}
                    aria-label="Show all photos"
                  >
                    <span>All Photos</span>
                    <span className="photo-count">{userPhotos.length}</span>
                  </div>
                  {userCategories.map(category => {
                    const isCoupleCategory = category.name.toLowerCase().includes('couple') || 
                      category.name.toLowerCase().includes('couple photos') ||
                      category.special_type === 'couple_photos';
                    
                    return (
                      <div 
                        key={category.id}
                        className={`category-item-wedding-inspo ${selectedSidebarCategory === category.id ? 'active' : ''}`}
                        onClick={() => setSelectedSidebarCategory(category.id)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Show ${category.name} photos`}
                      >
                        <div className="category-info-wedding-inspo">
                          <div 
                            className="category-color" 
                            style={{ backgroundColor: category.color || '#6366f1' }}
                            aria-hidden="true"
                          ></div>
                          <span>{category.name}</span>
                          {isCoupleCategory && (
                            <i className="fas fa-heart" style={{ marginLeft: '8px', color: '#ec4899', fontSize: '0.8rem' }} title="Special category for RSVP pages" aria-hidden="true"></i>
                          )}
                        </div>
                        <div className="category-actions-sidebar">
                          <span className="photo-count">{getPhotoCountForCategory(category.id)}</span>
                          {!category.is_default && !isCoupleCategory && (
                            <div className="category-action-buttons">
                              <button 
                                className="edit-category-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newName = prompt('Enter new category name:', category.name);
                                  if (newName && newName.trim()) {
                                    updateCategory(category.id, newName.trim());
                                  }
                                }}
                                title="Edit category name"
                                aria-label={`Edit ${category.name} category`}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button 
                                className="delete-category-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Delete category "${category.name}"? Photos will be moved to "Uncategorized".`)) {
                                    deleteCategory(category.id);
                                  }
                                }}
                                title="Delete category"
                                aria-label={`Delete ${category.name} category`}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="sidebar-photos">
                <h4>
                  {selectedSidebarCategory 
                    ? userCategories.find(c => c.id === selectedSidebarCategory)?.name 
                    : 'All Photos'
                  }
                </h4>
                <div className="sidebar-photos-grid">
                  {getPhotosForCategory(selectedSidebarCategory).map((photo, index) => (
                    <div key={photo.id} className="sidebar-photo-item">
                      <img 
                        src={photo.image_url} 
                        alt={photo.image_name}
                        onClick={() => {
                          navigate('/wedding-planner?tab=moodboard');
                        }}
                        loading="lazy"
                      />
                    </div>
                  ))}
                  {getPhotosForCategory(selectedSidebarCategory).length === 0 && (
                    <div className="no-photos-message">
                      <i className="fas fa-images" aria-hidden="true"></i>
                      <p>No photos in this category</p>
                      <small>Save photos from the gallery to get started</small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}

        <main className={`inspiration-main-content ${sidebarOpen ? 'with-sidebar' : ''}`}>
          <header>
            <h1 className="inspiration-title">Wedding Inspiration Gallery</h1>
            <p className="inspiration-subtitle">Discover beautiful wedding photos from top vendors. Find inspiration for your special day.</p>

          </header>
          
          <nav className="inspiration-categories" role="navigation" aria-label="Filter by category">
            {filteredCategories.map(cat => (
              <button
                key={cat}
                className={`inspiration-category-btn${selectedCategory === cat ? ' active' : ''}`}
                onClick={() => { setSelectedCategory(cat); setPage(1); }}
                aria-label={`Filter by ${categoryDisplayNames[cat] || cat} category`}
                aria-pressed={selectedCategory === cat}
              >
                {categoryDisplayNames[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </nav>
          
          <section className="inspiration-masonry" aria-label="Wedding inspiration photos">
          {!selectionMode && (
              <button className="select-photos-btn" onClick={() => setSelectionMode(true)}>
                <i className="fas fa-check-square"></i> Select Photos
              </button>
            )}
            {selectionMode && (
              <button className="cancel-select-btn" onClick={() => { setSelectionMode(false); setSelectedPhotos([]); }}>
                Cancel
              </button>
            )}  
            {paginatedPhotos.map((photo, idx) => {
              const showOverlay = !mobile || activeOverlayPhoto === photo.id;
              const isSelected = selectedPhotos.includes(photo.id);
              return (
                <article className={`inspiration-item${selectionMode && isSelected ? ' selected' : ''}`} key={photo.id}>
                  <div
                    className="inspiration-img-wrapper"
                    onClick={e => {
                      if (selectionMode) {
                        handleSelectPhoto(photo.id);
                        return;
                      }
                      if (!mobile) {
                        setModalOpen(true); setModalIndex(idx);
                      } else {
                        if (activeOverlayPhoto === photo.id) {
                          setActiveOverlayPhoto(null);
                          setModalOpen(true); setModalIndex(idx);
                        } else {
                          setActiveOverlayPhoto(photo.id);
                        }
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View ${businesses[photo.user_id] || 'wedding'} photo`}
                  >
                    <img
                      src={photo.photo_url || photo.file_path}
                      alt={`Wedding inspiration photo from ${businesses[photo.user_id] || 'professional vendor'}`}
                      className="inspiration-img"
                      loading="lazy"
                    />
                    {/* Checkbox for selection mode */}
                    {selectionMode && (
                      <div className={`photo-checkbox${isSelected ? ' checked' : ''}`}
                        onClick={e => { e.stopPropagation(); handleSelectPhoto(photo.id); }}
                        role="checkbox"
                        aria-checked={isSelected}
                        tabIndex={0}
                        aria-label={isSelected ? 'Deselect photo' : 'Select photo'}
                      >
                        {isSelected ? <i className="fas fa-check-square"></i> : <i className="far fa-square"></i>}
                      </div>
                    )}
                    {/* Overlays: hover on desktop, tap-to-reveal on mobile */}
                    <div
                      className={`portfolio-tag${showOverlay ? ' always-visible' : ''}`}
                      style={mobile && !showOverlay ? { display: 'none' } : {}}
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/portfolio/${photo.user_id}/${encodeURIComponent(businesses[photo.user_id] || '')}`);
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${businesses[photo.user_id] || 'vendor'} portfolio`}
                    >
                      <i className="fas fa-tag" aria-hidden="true"></i>{' '}
                      {businesses[photo.user_id] || 'View Portfolio'}
                    </div>
                    {/* Save button always visible, but logic depends on sign-in */}
                    {!selectionMode && (
                      <div
                        className={`save-to-wedding-tag${showOverlay ? ' always-visible' : ''}`}
                        style={mobile && !showOverlay ? { display: 'none' } : {}}
                        onClick={e => {
                          e.stopPropagation();
                          handleSaveClick(photo);
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label="Save photo to wedding planning board"
                      >
                        <i className="fas fa-heart" aria-hidden="true"></i>{' '}
                        Save
                      </div>
                    )}
                    
                    {mobile && (
                      <button
                        className={`view-photo-btn${showOverlay ? ' always-visible' : ''}`}
                        style={mobile && !showOverlay ? { display: 'none' } : {}}
                        onClick={e => {
                          e.stopPropagation();
                          setActiveOverlayPhoto(null);
                          setModalOpen(true);
                          setModalIndex(idx);
                        }}
                        aria-label="View photo in full screen"
                      >
                        <i className="fas fa-eye" aria-hidden="true"></i> View
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
          {/* Always show pagination bar */}
          <nav className="inspiration-pagination" role="navigation" aria-label="Photo gallery pagination">
            <button
              className="inspiration-pagination-btn"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              aria-label="Go to previous page"
            >
              Previous
            </button>
            <span className="inspiration-pagination-info" aria-live="polite">
              Page {page} of {totalPages}
            </span>
            <button
              className="inspiration-pagination-btn"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              aria-label="Go to next page"
            >
              Next
            </button>
          </nav>
        </main>
        {/* Save Selected button (bottom center) - moved outside <main> */}
        {selectionMode && selectedPhotos.length > 0 && (
          <div className="save-selected-bar">
            <button className="save-selected-btn" onClick={handleBatchSave} disabled={isBatchSaving}>
              <i className="fas fa-heart"></i> Save Selected ({selectedPhotos.length})
            </button>
          </div>
        )}

        <ImageModal
          isOpen={modalOpen}
          mediaUrl={modalMedia[modalIndex]?.url}
          isVideo={false}
          onClose={() => setModalOpen(false)}
          categoryMedia={modalMedia}
          currentIndex={modalIndex}
          businessId={modalMedia[modalIndex]?.user_id}
        />

        {/* Save to Wedding Modal */}
        {showSaveModal && (
          <div className="save-modal-overlay" onClick={() => setShowSaveModal(false)} role="dialog" aria-modal="true" aria-labelledby="save-modal-title">
            <div className="save-modal-content" onClick={e => e.stopPropagation()}>
              <div className="save-modal-header">
                <h3 id="save-modal-title">Save to My Wedding</h3>
                <button 
                  className="save-modal-close"
                  onClick={() => setShowSaveModal(false)}
                  aria-label="Close save modal"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="save-modal-body">
                <div className="save-photo-preview">
                  <img 
                    src={selectedPhotoToSave?.photo_url || selectedPhotoToSave?.file_path} 
                    alt="Photo preview" 
                  />
                </div>
                
                <div className="save-category-selector">
                  <label htmlFor="save-category-select">Save to category:</label>
                  <select 
                    id="save-category-select"
                    value={selectedSaveCategory} 
                    onChange={(e) => setSelectedSaveCategory(e.target.value)}
                  >
                    <option value="">Choose a category...</option>
                    {userCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="save-modal-actions">
                  <button 
                    className="cancel-btn"
                    onClick={() => setShowSaveModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="save-btn"
                    onClick={savePhotoToWedding}
                    disabled={!selectedSaveCategory || isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Photo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Batch Save Modal */}
        {batchSaveModalOpen && (
          <div className="save-modal-overlay" onClick={() => setBatchSaveModalOpen(false)} role="dialog" aria-modal="true" aria-labelledby="batch-save-modal-title">
            <div className="save-modal-content" onClick={e => e.stopPropagation()}>
              <div className="save-modal-header">
                <h3 id="batch-save-modal-title">Save Selected Photos</h3>
                <button 
                  className="save-modal-close"
                  onClick={() => setBatchSaveModalOpen(false)}
                  aria-label="Close batch save modal"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="save-modal-body">
                <p>Save {selectedPhotos.length} photos to your wedding inspiration board.</p>
                <div className="save-category-selector">
                  <label htmlFor="batch-save-category-select">Save to category:</label>
                  <select
                    id="batch-save-category-select"
                    value={batchSaveCategory}
                    onChange={e => setBatchSaveCategory(e.target.value)}
                  >
                    <option value="">Choose a category...</option>
                    {userCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="save-modal-actions">
                  <button
                    className="cancel-btn"
                    onClick={() => setBatchSaveModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="save-btn"
                    onClick={saveBatchPhotos}
                    disabled={!batchSaveCategory || isBatchSaving}
                  >
                    {isBatchSaving ? 'Saving...' : 'Save Photos'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Sign In Prompt Modal */}
        {signInPromptOpen && (
          <div className="save-modal-overlay" onClick={() => setSignInPromptOpen(false)} role="dialog" aria-modal="true" aria-labelledby="signin-modal-title">
            <div className="save-modal-content" onClick={e => e.stopPropagation()}>
              <div className="save-modal-header">
                <h3 id="signin-modal-title">Sign In or Create an Account</h3>
                <button 
                  className="save-modal-close"
                  onClick={() => setSignInPromptOpen(false)}
                  aria-label="Close sign in modal"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="save-modal-body">
                <p>To save inspiration photos to your wedding board, please sign in or create a free account.</p>
                <div className="save-modal-actions">
                  <a href="/signin" className="save-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>Sign In</a>
                  <a href="/signup" className="save-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>Create Account</a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default WeddingInspiration;