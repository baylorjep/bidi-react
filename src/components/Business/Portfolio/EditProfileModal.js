import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../supabaseClient";
import { v4 as uuidv4 } from 'uuid';
import "../../../styles/EditProfileModal.css";

const EditProfileModal = ({ isOpen, onClose, businessId, initialData }) => {
  const [formData, setFormData] = useState(initialData || {}); // Store editable fields
  const [portfolioPics, setPortfolioPics] = useState([]);
  const [portfolioVideos, setPortfolioVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [newSpecialization, setNewSpecialization] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const profileFileInputRef = useRef(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {}); // Reset form when modal opens
      if (initialData.portfolio) {
        fetchPortfolioImages();
        fetchPortfolioVideos();
      }
      fetchProfilePicture(); // Fetch the current profile picture
    }
  }, [isOpen, initialData]);

  // 🔹 Fetch portfolio images if needed
  const fetchPortfolioImages = async () => {
    try {
      const { data, error } = await supabase
        .from("profile_photos")
        .select("photo_url")
        .eq("user_id", businessId)
        .eq("photo_type", "portfolio");

      if (error) throw error;
      setPortfolioPics(data.map(img => img.photo_url));
    } catch (err) {
      console.error("Error fetching portfolio images:", err);
    }
  };

  const fetchPortfolioVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("profile_photos")
        .select("photo_url")
        .eq("user_id", businessId)
        .eq("photo_type", "video");

      if (error) throw error;
      setPortfolioVideos(data.map(vid => vid.photo_url));
    } catch (err) {
      console.error("Error fetching portfolio videos:", err);
    }
  };

  // 🔹 Fetch the current profile picture
  const fetchProfilePicture = async () => {
    try {
      const { data, error } = await supabase
        .from("profile_photos")
        .select("photo_url")
        .eq("user_id", businessId)
        .eq("photo_type", "profile")
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No data found
          setProfilePic("/images/default.jpg");
          return;
        }
        throw error;
      }
      setProfilePic(data?.photo_url || "/images/default.jpg");
    } catch (err) {
      console.error("Error fetching profile picture:", err);
      setProfilePic("/images/default.jpg"); // Set default if error occurs
    }
  };

  // 🔹 Handle input changes dynamically
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 Handle saving data back to Supabase
  const handleSave = async () => {
    try {
      const updatedData = { ...formData };
      delete updatedData.portfolio; // Remove portfolio field if it exists

      if (Object.keys(updatedData).length > 0) {
        const { error } = await supabase
          .from("business_profiles")
          .update(updatedData)
          .eq("id", businessId);
          
        if (error) throw error;
      }
      onClose(); // Close modal after successful save
    } catch (error) {
      console.error("Error updating business data:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  // 🔹 Handle Portfolio Image Upload
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);

    for (const file of files) {
      const fileType = file.type.startsWith('video/') ? 'video' : 'portfolio';
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${businessId}/${fileName}`;

      try {
        // Initialize progress for this file
        setUploadProgress(prev => ({
          ...prev,
          [fileName]: 0
        }));

        // Create upload options with progress tracking
        const options = {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({
              ...prev,
              [fileName]: progress
            }));
          }
        };

        // Upload file with progress tracking
        const { error: uploadError, data } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: options.onUploadProgress
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath);

        // Save to database
        await supabase
          .from('profile_photos')
          .insert({
            user_id: businessId,
            photo_url: publicUrl,
            photo_type: fileType,
            file_path: filePath
          });

        // Set progress to 100% when complete
        setUploadProgress(prev => ({
          ...prev,
          [fileName]: 100
        }));

        // Remove progress after a short delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileName];
            return newProgress;
          });
        }, 1000);

      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Failed to upload ${file.name}. Please try again.`);
        
        // Remove progress bar on error
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileName];
          return newProgress;
        });
      }
    }

    setUploading(false);
    fetchPortfolioImages();
    fetchPortfolioVideos();
  };

  const handleUpload = async (file, type) => {
    if (!file) {
      alert(`Please select a ${type} picture first.`);
      return null;
    }

    type === "profile" ? setUploadingProfile(true) : setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${businessId}/${fileName}`;

      // Upload new picture
      const { error: uploadError } = await supabase
        .storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL of the uploaded image
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      const photoUrl = data.publicUrl;

      // Check if a profile picture already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profile_photos')
        .select("id")
        .eq("user_id", businessId)
        .eq("photo_type", type)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // If a profile picture exists, update it, otherwise insert a new one
      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('profile_photos')
          .update({ photo_url: photoUrl, file_path: filePath })
          .eq("id", existingProfile.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('profile_photos')
          .insert([
            {
              user_id: businessId,
              photo_url: photoUrl,
              file_path: filePath,
              photo_type: type
            }
          ]);

        if (insertError) throw insertError;
      }

      return photoUrl;
    } catch (error) {
      console.error(error);
      alert(`Failed to upload ${type} picture. Please try again.`);
      return null;
    } finally {
      type === "profile" ? setUploadingProfile(false) : setUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaUrl, type) => {
    try {
      const filePath = mediaUrl.split("/profile-photos/")[1];

      const { error: deleteDbError } = await supabase
        .from("profile_photos")
        .delete()
        .eq("user_id", businessId)
        .eq("photo_url", mediaUrl)
        .eq("photo_type", type);

      if (deleteDbError) throw deleteDbError;

      const { error: deleteStorageError } = await supabase
        .storage
        .from("profile-photos")
        .remove([filePath]);

      if (deleteStorageError) throw deleteStorageError;

      // Update UI based on media type
      if (type === 'video') {
        setPortfolioVideos(prev => prev.filter(vid => vid !== mediaUrl));
      } else {
        setPortfolioPics(prev => prev.filter(img => img !== mediaUrl));
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
  };

  const handleSpecializationAdd = () => {
    if (newSpecialization.trim() !== "") {
      setFormData({
        ...formData,
        specializations: [...(formData.specializations || []), newSpecialization.trim()]
      });
      setNewSpecialization("");
    }
  };

  const handleSpecializationRemove = (indexToRemove) => {
    setFormData({
      ...formData,
      specializations: formData.specializations.filter((_, index) => index !== indexToRemove)
    });
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingProfile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${businessId}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      // Update or insert into profile_photos table
      const { data: existingProfile } = await supabase
        .from('profile_photos')
        .select("id")
        .eq("user_id", businessId)
        .eq("photo_type", "profile")
        .single();

      if (existingProfile) {
        await supabase
          .from('profile_photos')
          .update({
            photo_url: publicUrl,
            file_path: filePath
          })
          .eq("id", existingProfile.id);
      } else {
        await supabase
          .from('profile_photos')
          .insert({
            user_id: businessId,
            photo_url: publicUrl,
            photo_type: "profile",
            file_path: filePath
          });
      }

      setProfilePic(publicUrl);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Failed to update profile picture. Please try again.");
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleRemoveProfilePic = async () => {
    try {
      // Get the current profile photo record
      const { data, error: fetchError } = await supabase
        .from('profile_photos')
        .select('file_path')
        .eq('user_id', businessId)
        .eq('photo_type', 'profile')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (data) {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('profile-photos')
          .remove([data.file_path]);

        if (storageError) throw storageError;

        // Delete from database
        const { error: dbError } = await supabase
          .from('profile_photos')
          .delete()
          .eq('user_id', businessId)
          .eq('photo_type', 'profile');

        if (dbError) throw dbError;
      }

      // Reset profile pic to default
      setProfilePic("/images/default.jpg");
    } catch (error) {
      console.error("Error removing profile picture:", error);
      alert("Failed to remove profile picture. Please try again.");
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

  return (
    isOpen && (
      <div className="edit-portfolio-modal">
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit {initialData.portfolio ? "Portfolio" : "Profile"}</h2>

            {/* Profile Picture Section - Move this above the form fields */}
            {!initialData.portfolio && (
              <div className="profile-picture-container">
                <label>Profile Picture</label>
                <div className="profile-pic-wrapper">
                  <img 
                    src={profilePic || "/images/default.jpg"}
                    alt="Profile"
                    className="profile-pic"
                  />
                  <div className="profile-pic-buttons">
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={profileFileInputRef} 
                      style={{ display: "none" }} 
                      onChange={handleProfilePicChange}
                    />
                    <button   
                      className="edit-profile-button" 
                      onClick={() => profileFileInputRef.current.click()}
                      disabled={uploadingProfile}
                    >
                      {uploadingProfile ? "Uploading..." : "Edit Profile Picture"}
                    </button>
                    {profilePic && profilePic !== "/images/default.jpg" && (
                      <button
                        className="remove-profile-button"
                        onClick={handleRemoveProfilePic}
                        disabled={uploadingProfile}
                      >
                        Remove Picture
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Form Fields (Non-Portfolio Data) */}
            {Object.keys(formData).length > 0 && !formData.portfolio && (
              <div>
                {Object.entries(formData).map(([key, value]) => (
                  <div key={key} className="modal-input-group">
                    <label>{key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</label>
                    {key === 'story' ? (
                      <div>
                        <textarea
                          name={key}
                          value={value || ""}
                          onChange={handleChange}
                          rows={6}
                          placeholder="Write about you, your business, your story..."
                          style={{ resize: 'vertical', minHeight: '150px' }}
                        />
                      </div>
                    ) : key === 'business_description' ? (
                      <div>
                        <input
                          type="text"
                          name={key}
                          value={value || ""}
                          onChange={handleChange}
                          maxLength={50}
                          placeholder="Brief description of your business"
                        />
                        <div className="character-count">
                          {50 - (value?.length || 0)} characters remaining
                        </div>
                      </div>
                    ) : key === 'specializations' ? (
                      <div className="specializations-container">
                        <div className="specializations-list">
                          {value?.map((specialty, index) => (
                            <div key={index} className="specialization-item">
                              {specialty}
                              <button
                                type="button"
                                className="remove-button"
                                onClick={() => handleSpecializationRemove(index)}
                              >
                                ✖
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="specialization-input">
                          <input
                            type="text"
                            placeholder="Add a specialization..."
                            value={newSpecialization}
                            onChange={(e) => setNewSpecialization(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSpecializationAdd();
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="add-button"
                            onClick={handleSpecializationAdd}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ) : key === 'business_address' ? (
                      <input
                        type="text"
                        name={key}
                        value={value || ""}
                        onChange={handleChange}
                        placeholder="Enter the areas you cover (e.g., Utah)"
                      />
                      
                    ) : (
                      <input
                        type="text"
                        name={key}
                        value={value || ""}
                        onChange={handleChange}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 🔹 Portfolio Images Section */}
            {initialData.portfolio && (
              <div>
                {/* Videos Section */}
                <h3>Videos</h3>
                <div className="portfolio-preview">
                  
                  {portfolioVideos.length > 0 ? (
                    portfolioVideos.map((video, index) => (
                      <div key={index} className="image-container">
                        <video 
                          src={video} 
                          className="portfolio-image" 
                          controls
                        />
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteMedia(video, 'video')}
                        >
                          ✖
                        </button>
                      </div>
                    ))
                  ) : (
                    <p>No videos yet.</p>
                  )}
                </div>

                {/* Images Section */}
                <h3>Images</h3>
                <div className="portfolio-preview">
                 
                  {portfolioPics.length > 0 ? (
                    portfolioPics.map((img, index) => (
                      <div key={index} className="image-container">
                        <img src={img} alt={`Portfolio ${index}`} className="portfolio-image" />
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteMedia(img, 'portfolio')}
                        >
                          ✖
                        </button>
                      </div>
                    ))
                  ) : (
                    <p>No images yet. Add some!</p>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*,video/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                  multiple // Allow multiple file selection
                />
                <button
                  className="upload-btn"
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Add Media"}
                </button>

                {/* Upload Progress */}
                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                  <div key={fileName} className="upload-progress-container">
                    <span>{fileName}</span>
                    <ProgressBar progress={progress} />
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="modal-actions">
              <button className="close-btn" onClick={onClose}>Cancel</button>
              <button className="save-btn" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default EditProfileModal;