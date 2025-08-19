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

// ... existing code ...
const handleFileChange = async (e) => {
  const files = Array.from(e.target.files);
  
  // Filter out invalid files
  const invalidFiles = files.filter(file => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'video/mp4', 'video/quicktime'];
    return !validTypes.includes(file.type);
  });

  if (invalidFiles.length > 0) {
    alert('Only JPG, PNG, WebP, and MP4 files are supported.');
    e.target.value = '';
    return;
  }
// ... existing code ...

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

  if (!isOpen) return null;

  return (
    <div className="edit-gallery-modal">
      <div className="modal-overlay-gallery">
        <div className="modal-content-gallery">
          <button 
            className="modal-close-x"
            onClick={onClose}
            aria-label="Close modal"
            style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', zIndex: 10 }}
          >
            ×
          </button>
          <h2>Edit Gallery</h2>
          
          <div className="category-management">
            <h3>Categories</h3>
            
            {/* Category List */}
            <div className="category-list">
              {categories.map(category => (
                <div 
                  key={category.id} 
                  className="category-item"
                >
                  <span>{category.name}</span>
                  <div className="category-actions">
                    <button onClick={() => {
                      setEditingCategory(category);
                      setEditCategoryName(category.name);
                    }}>Edit</button>
                    <button onClick={() => handleDeleteCategory(category.id)}>Delete</button>
                  </div>
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

          <div className="modal-actions" style={{ marginTop: 0, marginBottom: '1rem' }}>
            <button 
              className="save-btn" 
              onClick={onClose}
              disabled={uploading}
            >
              Save Changes
            </button>
          </div>

          {/* Media Grid */}
          <div className="media-grid">
            <h3>Media Items</h3>
            <div className="media-items">
              {mediaItems.map(item => (
                <div 
                  key={item.id} 
                  className="media-item"
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
                      ✖
                    </button>
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

          <div className="modal-actions">
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