import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import "../../../styles/Gallery.css";
import ImageModal from "./ImageModal"; // Import the new ImageModal component

const Gallery = () => {
  const { businessId } = useParams();
  const [portfolioPics, setPortfolioPics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPortfolioImages = async () => {
      const { data, error } = await supabase
        .from("profile_photos")
        .select("photo_url")
        .eq("user_id", businessId)
        .eq("photo_type", "portfolio");

      if (error) {
        console.error("Error fetching portfolio images:", error);
      } else {
        setPortfolioPics(data.map(img => img.photo_url));
      }
      setLoading(false);
    };

    fetchPortfolioImages();
  }, [businessId]);

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseImageModal = () => {
    setSelectedImage(null);
  };

  if (loading) return <p>Loading gallery...</p>;

  return (
    <>
      <ImageModal
        isOpen={!!selectedImage}
        imageUrl={selectedImage}
        onClose={handleCloseImageModal}
      />

      <div className="gallery-container">
        <button className="back-button" onClick={() => navigate(-1)}>Back</button>
        <div className="gallery-grid">
          {portfolioPics.length > 0
            ? portfolioPics.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Portfolio ${index}`}
                  className="gallery-image"
                  onClick={() => handleImageClick(img)}
                />
              ))
            : <p>No images available</p>}
        </div>
      </div>
    </>
  );
};

export default Gallery;