import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../supabaseClient";
import { v4 as uuidv4 } from 'uuid';
import "../../../styles/EditProfileModal.css";

const EditProfileModal = ({ isOpen, onClose, businessId }) => {
  const [portfolioPics, setPortfolioPics] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchPortfolioImages();
    }
  }, [isOpen]);

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

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${businessId}/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      if (data.publicUrl) {
        setPortfolioPics(prevPics => [...prevPics, data.publicUrl]);

        await supabase.from("profile_photos").insert([
          { user_id: businessId, photo_url: data.publicUrl, photo_type: "portfolio" }
        ]);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (imageUrl) => {
    const updatedImages = portfolioPics.filter(img => img !== imageUrl);
    setPortfolioPics(updatedImages);

    const filePath = imageUrl.split('/profile-photos/')[1];

    try {
      await supabase
        .from("profile_photos")
        .delete()
        .eq("user_id", businessId)
        .eq("photo_url", imageUrl)
        .eq("photo_type", "portfolio");

      const { error } = await supabase
        .storage
        .from("profile-photos")
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  return (
    isOpen && (
        <div className="edit-portfolio-modal">
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Edit Portfolio</h2>

          {/* Display Portfolio Images */}
          <div className="portfolio-preview">
            {portfolioPics.length > 0 ? (
              portfolioPics.map((img, index) => (
                <div key={index} className="image-container">
                  <img src={img} alt={`Portfolio ${index}`} className="portfolio-image" />
                  <button className="remove-btn" onClick={() => removeImage(img)}>✖</button>
                </div>
              ))
            ) : (
              <p>No images yet. Add some!</p>
            )}
          </div>

          {/* Upload New Image */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Add Image"}
          </button>

          {/* Close Button */}
          <div className="modal-actions">
            <button className="close-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
      </div>
    )
  );
};

export default EditProfileModal;