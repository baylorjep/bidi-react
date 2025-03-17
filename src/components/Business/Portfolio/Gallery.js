import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import "../../../styles/Portfolio.css";

const Gallery = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase
        .from("profile_photos")
        .select("photo_url")
        .eq("user_id", businessId)
        .eq("photo_type", "portfolio");

      if (error) console.error("Error fetching gallery images:", error);
      else setImages(data.map(img => img.photo_url));

      setLoading(false);
    };

    fetchImages();
  }, [businessId]);

  if (loading) return <p>Loading images...</p>;

  return (
    <div className="gallery-container">
      <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
      <div className="gallery-grid">
        {images.map((img, index) => (
          <img key={index} src={img} alt={`Gallery ${index}`} className="gallery-image" />
        ))}
      </div>
    </div>
  );
};

export default Gallery;