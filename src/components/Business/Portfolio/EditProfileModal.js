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

      if (error) throw error;
      setProfilePic(data.photo_url);
    } catch (err) {
      console.error("Error fetching profile picture:", err);
      setProfilePic("/images/default.jpg"); // Set default if no profile picture exists
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
      const filePath = `${businessId}/${Date.now()}_${file.name}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('profile_photos')
          .insert({
            user_id: businessId,
            photo_url: publicUrl,
            photo_type: fileType,
            file_path: filePath // Add this line to save the file path
          });

        if (dbError) throw dbError;

      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    setUploading(false);
    fetchPortfolioImages(); // Refresh the images after upload
    fetchPortfolioVideos(); // Refresh the videos after upload
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

  return (
    isOpen && (
      <div className="edit-portfolio-modal">
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit {initialData.portfolio ? "Portfolio" : "Profile"}</h2>

            {/* Profile Picture Section - Only show with business_owner/story */}
            {!initialData.portfolio && initialData.business_owner && (
              <div className="profile-picture-container">
                <label>Profile Picture</label>
                <div className="profile-pic-wrapper">
                  <img 
                    src={profilePic || "/images/default.jpg"}
                    alt="Profile"
                    className="profile-pic"
                  />
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={profileFileInputRef} 
                    style={{ display: "none" }} 
                    onChange={(e) => handleFileChange(e, "profile")}
                  />
                  <button   
                    className="edit-profile-button" 
                    onClick={() => profileFileInputRef.current.click()}
                  >
                    Edit Profile Picture
                  </button>
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