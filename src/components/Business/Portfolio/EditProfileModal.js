import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../supabaseClient";
import { v4 as uuidv4 } from 'uuid';
import "../../../styles/EditProfileModal.css";

const EditProfileModal = ({ isOpen, onClose, businessId, initialData }) => {
  const [formData, setFormData] = useState(initialData || {}); // Store editable fields
  const [portfolioPics, setPortfolioPics] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {}); // Reset form when modal opens
      if (initialData.portfolio) fetchPortfolioImages();
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

  // 🔹 Handle input changes dynamically
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 Handle saving data back to Supabase
  const handleSave = async () => {
    try {
      const updatedData = { ...formData };
      delete updatedData.portfolio; // Remove portfolio field from general updates

      if (Object.keys(updatedData).length > 0) {
        await supabase
          .from("business_profiles")
          .update(updatedData)
          .eq("id", businessId);
      }

      onClose(); // Close modal after saving
    } catch (error) {
      console.error("Error updating business data:", error);
    }
  };

  // 🔹 Handle Portfolio Image Upload
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${businessId}/${fileName}`;

        // 🔹 Upload image to Supabase storage
        const { error: uploadError } = await supabase
            .storage
            .from('profile-photos')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // 🔹 Retrieve public URL of uploaded image
        const { data } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(filePath);

        if (data.publicUrl) {
            setPortfolioPics(prevPics => [...prevPics, data.publicUrl]);

            // 🔹 Insert new portfolio image into the database
            const { error: insertError } = await supabase
                .from("profile_photos")
                .insert([
                    {
                        user_id: businessId,
                        photo_url: data.publicUrl,
                        file_path: filePath,
                        photo_type: "portfolio"
                    }
                ]);

            if (insertError) throw insertError;
        }
    } catch (error) {
        console.error("Error uploading image:", error);
    } finally {
        setUploading(false);
    }
};

const handleDeleteImage = async (imageUrl) => {
  try {
      // Extract file path from the URL
      const filePath = imageUrl.split("/profile-photos/")[1];

      // 🔹 Delete from database
      const { error: deleteDbError } = await supabase
          .from("profile_photos")
          .delete()
          .eq("user_id", businessId)
          .eq("photo_url", imageUrl)
          .eq("photo_type", "portfolio");

      if (deleteDbError) throw deleteDbError;

      // 🔹 Delete from Supabase Storage
      const { error: deleteStorageError } = await supabase
          .storage
          .from("profile-photos")
          .remove([filePath]);

      if (deleteStorageError) throw deleteStorageError;

      // 🔹 Remove from UI
      setPortfolioPics((prevPics) => prevPics.filter((img) => img !== imageUrl));
  } catch (error) {
      console.error("Error deleting image:", error);
  }
};

  return (
    isOpen && (
      <div className="edit-portfolio-modal">
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit {initialData.portfolio ? "Portfolio" : "Profile"}</h2>

            {/* 🔹 Dynamic Form Fields (Non-Portfolio Data) */}
            {Object.keys(formData).length > 0 && !formData.portfolio && (
              <div>
                {Object.entries(formData).map(([key, value]) => (
                  <div key={key} className="modal-input-group">
                    <label>{key.replace("_", " ")}</label>
                    <input
                      type="text"
                      name={key}
                      value={value || ""}
                      onChange={handleChange}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 🔹 Portfolio Images Section */}
            {initialData.portfolio && (
              <div>
                <div className="portfolio-preview">
                  {portfolioPics.length > 0 ? (
                    portfolioPics.map((img, index) => (
                      <div key={index} className="image-container">
                        <img src={img} alt={`Portfolio ${index}`} className="portfolio-image" />
                        <button className="delete-btn" onClick={() => handleDeleteImage(img)}>✖</button>
                      </div>
                    ))
                  ) : (
                    <p>No images yet. Add some!</p>
                  )}
                </div>

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
              </div>
            )}

            {/* 🔹 Action Buttons */}
            <div className="modal-actions">
              <button className="save-close-btn" onClick={onClose}>Save and Close</button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default EditProfileModal;