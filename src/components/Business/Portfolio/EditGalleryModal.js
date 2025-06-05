import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import '../../../styles/EditGalleryModal.css';

const EditGalleryModal = ({ isOpen, onClose, businessId, categories: initialCategories, onMediaUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState(initialCategories || []);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [mediaItems, setMediaItems] = useState([]);
  const fileInputRef = useRef(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragFeedback, setDragFeedback] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchMediaItems();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_categories')
        .select('*')
        .eq('business_id', businessId)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Failed to load categories');
    }
  };

  const fetchMediaItems = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_photos')
        .select('*, portfolio_categories(*)')
        .eq('user_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMediaItems(data || []);
    } catch (error) {
      console.error('Error fetching media items:', error);
      alert('Failed to load media items');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const { data, error } = await supabase
        .from('portfolio_categories')
        .insert({
          business_id: businessId,
          name: newCategory.trim(),
          display_order: categories.length
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      setNewCategory('');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) return;

    try {
      const { error } = await supabase
        .from('portfolio_categories')
        .update({ name: editCategoryName.trim() })
        .eq('id', editingCategory.id)
        .eq('business_id', businessId);

      if (error) throw error;

      setCategories(prev => 
        prev.map(cat => 
          cat.id === editingCategory.id 
            ? { ...cat, name: editCategoryName.trim() }
            : cat
        )
      );
      setEditingCategory(null);
      setEditCategoryName('');
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This will not delete the media items.')) return;

    try {
      const { error } = await supabase
        .from('portfolio_categories')
        .delete()
        .eq('id', categoryId)
        .eq('business_id', businessId);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      if (selectedCategory === categoryId) {
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const handleCategoryChange = async (mediaId, categoryId) => {
    try {
      const { error } = await supabase
        .from('profile_photos')
        .update({ category_id: categoryId })
        .eq('id', mediaId)
        .eq('user_id', businessId);

      if (error) throw error;

      setMediaItems(prev => 
        prev.map(item => 
          item.id === mediaId 
            ? { ...item, category_id: categoryId }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating media category:', error);
      alert('Failed to update category');
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    
    // Filter out invalid files
    const invalidFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/quicktime'];
      return !validTypes.includes(file.type);
    });

    if (invalidFiles.length > 0) {
      alert('Only JPG, PNG, and MP4 files are supported.');
      e.target.value = '';
      return;
    }

    setUploading(true);

    for (const file of files) {
      const fileType = file.type.startsWith('video/') ? 'video' : 'portfolio';
      const sanitizedFileName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
      
      const fileName = `${Date.now()}_${sanitizedFileName}`;
      const filePath = `${businessId}/${fileName}`;

      try {
        setUploadProgress(prev => ({
          ...prev,
          [fileName]: 0
        }));

        let fileToUpload = file;
        
        // Convert image to WebP if it's not a video
        if (fileType === 'portfolio') {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.src = URL.createObjectURL(file);
            
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const webpBlob = await new Promise((resolve) => {
              canvas.toBlob((blob) => {
                resolve(blob);
              }, 'image/webp', 0.8);
            });
            
            fileToUpload = webpBlob;
            URL.revokeObjectURL(img.src);
          } catch (error) {
            console.error('Error converting to WebP:', error);
            fileToUpload = file;
          }
        }

        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, fileToUpload, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (progress) => {
              const percentCompleted = Math.round((progress.loaded * 100) / progress.total);
              setUploadProgress(prev => ({
                ...prev,
                [fileName]: percentCompleted
              }));
            }
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath);

        const { error: insertError } = await supabase
          .from('profile_photos')
          .insert({
            user_id: businessId,
            photo_url: publicUrl,
            photo_type: fileType,
            file_path: filePath,
            category_id: selectedCategory
          });

        if (insertError) throw insertError;

        setUploadProgress(prev => ({
          ...prev,
          [fileName]: 100
        }));

        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileName];
            return newProgress;
          });
        }, 1000);

      } catch (error) {
        console.error('Error in upload process:', error);
        alert(`Failed to upload ${file.name}: ${error.message}`);
        
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileName];
          return newProgress;
        });
      }
    }

    setUploading(false);
    fetchMediaItems();
    onMediaUpdate();
  };

  const handleDeleteMedia = async (mediaId, mediaUrl) => {
    if (!window.confirm('Are you sure you want to delete this media?')) return;

    try {
      const filePath = mediaUrl.split("/profile-photos/")[1];

      const { error: deleteStorageError } = await supabase.storage
        .from("profile-photos")
        .remove([filePath]);

      if (deleteStorageError) throw deleteStorageError;

      const { error: deleteDbError } = await supabase
        .from("profile_photos")
        .delete()
        .eq("id", mediaId)
        .eq("user_id", businessId);

      if (deleteDbError) throw deleteDbError;

      setMediaItems(prev => prev.filter(item => item.id !== mediaId));
      onMediaUpdate();
    } catch (error) {
      console.error("Error deleting media:", error);
      alert("Failed to delete media. Please try again.");
    }
  };

  const ProgressBar = ({ progress }) => (
    <div className="upload-progress">
      <div 
        className="progress-bar" 
        style={{ 
          width: `${progress}%`,
          transition: 'width 0.3s ease-in-out'
        }}
      ></div>
      <span>{progress}%</span>
    </div>
  );

  const handleDragStart = (e, category) => {
    setDraggedItem(category);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', category.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetCategory) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetCategory.id) return;

    const draggedIndex = categories.findIndex(cat => cat.id === draggedItem.id);
    const targetIndex = categories.findIndex(cat => cat.id === targetCategory.id);
    
    const newCategories = [...categories];
    const [movedCategory] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, movedCategory);

    // Update display_order for all affected categories
    const updates = newCategories.map((category, index) => ({
      id: category.id,
      name: category.name,
      business_id: businessId,
      display_order: index,
      created_at: category.created_at,
      updated_at: new Date().toISOString()
    }));

    try {
      const { error } = await supabase
        .from('portfolio_categories')
        .upsert(updates, {
          onConflict: 'id'
        });

      if (error) throw error;

      setCategories(newCategories);
    } catch (error) {
      console.error('Error updating category order:', error);
      alert('Failed to update category order');
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleTouchStart = (e, mediaId) => {
    if (!e.target.closest('.drag-handle')) {
      return;
    }
    
    const touch = e.touches[0];
    const element = e.currentTarget;
    
    setTouchStartY(touch.clientY);
    setDraggedElement(element);
    element.classList.add('dragging');
    
    element.dataset.originalId = mediaId;
    element.dataset.initialY = element.getBoundingClientRect().top;
    
    setDragFeedback('Hold and drag to reorder');
    e.preventDefault();
  };

  const handleTouchMove = (e) => {
    if (!draggedElement) return;
    
    const touch = e.touches[0];
    const elements = Array.from(document.querySelectorAll('.media-item:not(.dragging)'));
    
    const deltaY = touch.clientY - touchStartY;
    draggedElement.style.transform = `translateY(${deltaY}px)`;
    
    elements.forEach(el => {
      el.classList.remove('drag-over-above', 'drag-over-below');
    });
    
    let closestElement = null;
    let closestDistance = Infinity;
    let isAbove = false;

    elements.forEach(el => {
      const box = el.getBoundingClientRect();
      const distance = Math.abs(touch.clientY - (box.top + box.height / 2));
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestElement = el;
        isAbove = touch.clientY < box.top + box.height / 2;
      }
    });
    
    if (closestElement) {
      if (isAbove) {
        closestElement.classList.add('drag-over-above');
        setDragFeedback('Release to place before');
      } else {
        closestElement.classList.add('drag-over-below');
        setDragFeedback('Release to place after');
      }
    }
    
    e.preventDefault();
  };

  const handleTouchEnd = async (e) => {
    if (!draggedElement) return;
    
    const dropTarget = document.querySelector('.drag-over-above, .drag-over-below');
    
    if (dropTarget) {
      const draggedId = draggedElement.dataset.originalId;
      const droppedId = dropTarget.dataset.mediaId;
      const dropAbove = dropTarget.classList.contains('drag-over-above');
      
      const draggedIndex = mediaItems.findIndex(item => item.id === draggedId);
      let droppedIndex = mediaItems.findIndex(item => item.id === droppedId);
      
      if (!dropAbove) droppedIndex += 1;
      
      const newItems = [...mediaItems];
      const [movedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(droppedIndex, 0, movedItem);
      
      setMediaItems(newItems);
      
      try {
        const updates = newItems.map((item, index) => ({
          id: item.id,
          display_order: index
        }));

        const { error } = await supabase
          .from('profile_photos')
          .upsert(updates, {
            onConflict: 'id'
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error updating order:', error);
        setMediaItems(mediaItems);
      }
    }
    
    draggedElement.style.transform = '';
    draggedElement.classList.remove('dragging');
    document.querySelectorAll('.drag-over-above, .drag-over-below').forEach(el => {
      el.classList.remove('drag-over-above', 'drag-over-below');
    });
    
    setDraggedElement(null);
    setTouchStartY(null);
    setDragFeedback(null);
  };

  const handleMouseDown = (e, mediaId) => {
    if (!e.target.closest('.drag-handle')) return;
    
    const element = e.currentTarget;
    setDraggedElement(element);
    element.classList.add('dragging');
    element.dataset.originalId = mediaId;
    element.dataset.initialX = element.getBoundingClientRect().left;
    element.dataset.initialY = element.getBoundingClientRect().top;
    setDragFeedback('Drag to reorder');
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!draggedElement) return;
    
    const elements = Array.from(document.querySelectorAll('.media-item:not(.dragging)'));
    const deltaX = e.clientX - draggedElement.getBoundingClientRect().left;
    const deltaY = e.clientY - draggedElement.getBoundingClientRect().top;
    draggedElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    
    elements.forEach(el => el.classList.remove('drag-over-above', 'drag-over-below'));
    
    let closestElement = null;
    let closestDistance = Infinity;
    let position = '';

    elements.forEach(el => {
      const box = el.getBoundingClientRect();
      const centerX = box.left + box.width / 2;
      const centerY = box.top + box.height / 2;
      const distanceX = Math.abs(e.clientX - centerX);
      const distanceY = Math.abs(e.clientY - centerY);
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestElement = el;
        position = distanceX > distanceY ? 
          (e.clientX < centerX ? 'above' : 'below') : 
          (e.clientY < centerY ? 'above' : 'below');
      }
    });
    
    if (closestElement) {
      closestElement.classList.add(`drag-over-${position}`);
      setDragFeedback(`Release to place ${position}`);
    }
  };

  const handleMouseUp = async (e) => {
    if (!draggedElement) return;
    
    const dropTarget = document.querySelector('.drag-over-above, .drag-over-below');
    if (dropTarget) {
      const draggedId = draggedElement.dataset.originalId;
      const droppedId = dropTarget.dataset.mediaId;
      const position = dropTarget.classList.contains('drag-over-above') ? 'above' : 'below';
      
      const draggedIndex = mediaItems.findIndex(item => item.id === draggedId);
      let droppedIndex = mediaItems.findIndex(item => item.id === droppedId);
      
      if (position === 'below') droppedIndex += 1;
      
      const newItems = [...mediaItems];
      const [movedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(droppedIndex, 0, movedItem);
      
      setMediaItems(newItems);
      
      try {
        const updates = newItems.map((item, index) => ({
          id: item.id,
          display_order: index
        }));

        const { error } = await supabase
          .from('profile_photos')
          .upsert(updates, {
            onConflict: 'id'
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error updating order:', error);
        setMediaItems(mediaItems);
      }
    }
    
    draggedElement.style.transform = '';
    draggedElement.classList.remove('dragging');
    document.querySelectorAll('.drag-over-above, .drag-over-below').forEach(el => {
      el.classList.remove('drag-over-above', 'drag-over-below');
    });
    
    setDraggedElement(null);
    setDragFeedback(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  if (!isOpen) return null;

  return (
    <div className="edit-gallery-modal">
      <div className="modal-overlay-gallery">
        <div className="modal-content-gallery">
          <h2>Edit Gallery</h2>
          
          <div className="category-management">
            <h3>Categories</h3>
            
            {/* Category List */}
            <div className="category-list">
              {categories.map(category => (
                <div 
                  key={category.id} 
                  className="category-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, category)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, category)}
                  onDragEnd={handleDragEnd}
                >
                  {editingCategory?.id === category.id ? (
                    <div className="category-edit">
                      <input
                        type="text"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        placeholder="Category name"
                      />
                      <button onClick={handleUpdateCategory}>Save</button>
                      <button onClick={() => {
                        setEditingCategory(null);
                        setEditCategoryName('');
                      }}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span>{category.name}</span>
                      <div className="category-actions">
                        <button onClick={() => {
                          setEditingCategory(category);
                          setEditCategoryName(category.name);
                        }}>Edit</button>
                        <button onClick={() => handleDeleteCategory(category.id)}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Category */}
            <div className="add-category">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name"
              />
              <button onClick={handleCreateCategory}>Add Category</button>
            </div>
          </div>

          <div className="category-selector">
            <label>Default Category for New Uploads:</label>
            <select 
              value={selectedCategory || ''} 
              onChange={(e) => setSelectedCategory(e.target.value || null)}
            >
              <option value="">Uncategorized</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="upload-section">
            <input
              type="file"
              accept="image/*,video/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
              multiple
            />
            <button
              className="upload-btn"
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Add Media"}
            </button>
          </div>

          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="upload-progress-container">
              <span>{fileName}</span>
              <ProgressBar progress={progress} />
            </div>
          ))}

          {/* Media Grid */}
          <div className="media-grid">
            <h3>Media Items</h3>
            <div className="media-items">
              {mediaItems.map(item => (
                <div 
                  key={item.id} 
                  className="media-item"
                  data-media-id={item.id}
                  onTouchStart={(e) => handleTouchStart(e, item.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={(e) => handleMouseDown(e, item.id)}
                >
                  <div className="media-preview-container">
                    {item.photo_type === 'video' ? (
                      <video 
                        src={item.photo_url} 
                        className="media-preview"
                        controls
                        playsInline
                      />
                    ) : (
                      <img 
                        src={item.photo_url} 
                        alt="Media preview" 
                        className="media-preview"
                      />
                    )}
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteMedia(item.id, item.photo_url)}
                      aria-label="Delete media"
                    >
                      ×
                    </button>
                    <div 
                      className="drag-handle" 
                      title="Drag to reorder"
                      aria-label="Drag to reorder"
                    >
                      ⋮⋮
                    </div>
                  </div>
                  <div className="media-actions">
                    <select
                      value={item.category_id || ''}
                      onChange={(e) => handleCategoryChange(item.id, e.target.value || null)}
                    >
                      <option value="">Uncategorized</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {dragFeedback && (
            <div className="drag-feedback">
              {dragFeedback}
            </div>
          )}

          <div className="modal-actions">
            <button 
              className="save-btn" 
              onClick={onClose}
              disabled={uploading}
            >
              Save Changes
            </button>
            <button 
              className="close-btn" 
              onClick={onClose}
              disabled={uploading}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditGalleryModal; 