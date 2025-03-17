import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import "../../../styles/Portfolio.css";

const Portfolio = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolioPics, setPortfolioPics] = useState([]);
  const [profileImage, setProfileImage] = useState("/images/default.jpg");

  useEffect(() => {
    const fetchBusinessData = async () => {
      // Fetch business info
      const { data: businessData, error: businessError } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", businessId)
        .single();
      if (businessError) console.error("Error fetching business:", businessError);
      else setBusiness(businessData);

      // Fetch profile image
      const { data: profileData, error: profileError } = await supabase
        .from("profile_photos")
        .select("photo_url")
        .eq("user_id", businessId)
        .eq("photo_type", "profile")
        .single();
      if (profileData) setProfileImage(profileData.photo_url);
      else if (profileError) console.error("Error fetching profile image:", profileError);

      // Fetch portfolio images
      const { data: portfolioData, error: portfolioError } = await supabase
        .from("profile_photos")
        .select("photo_url")
        .eq("user_id", businessId)
        .eq("photo_type", "portfolio");
      if (portfolioError) console.error("Error fetching portfolio images:", portfolioError);
      else setPortfolioPics(portfolioData.map(img => img.photo_url));

      setLoading(false);
    };

    fetchBusinessData();
  }, [businessId]);

  if (loading) return <p>Loading portfolio...</p>;
  if (!business) return <p>Error: Business not found.</p>;

  return (
    <div className="portfolio-container">

      {/* 🔹 SECTION 1: Photos & Business Info */}
      <div className="portfolio-layout">
        <img src={portfolioPics[0]} alt="Main Portfolio" className="main-portfolio-image" />
        <div className="portfolio-grid">
          {portfolioPics.slice(1, 5).map((img, index) => (
            <img key={index} src={img} alt={`Portfolio ${index}`} className="portfolio-image" />
          ))}
          {portfolioPics.length > 5 && (
            <button className="see-all-button" onClick={() => navigate(`/portfolio/${businessId}/gallery`)}>
              + See All
            </button>
          )}
        </div>
      </div>

      <div className="business-header">
        <h1 className="business-name">{business.business_name}</h1>
        <p className="business-description">{business.business_description || "No description available"}</p>
      </div>

      <div className="section-divider"></div>

      {/* 🔹 SECTION 2: Location & Price */}
      <div className="business-details">
        {/* Location */}
        <div className="business-detail">
          <p className="detail-title">Location</p>
          <div className="detail-content">
            <i className="fa-solid fa-location-dot detail-icon"></i>
            <p className="detail-text">{business.business_address || "Location not available"}</p>
          </div>
        </div>

        {/* Price */}
        <div className="business-detail">
          <p className="detail-title">Price Range</p>
          <div className="detail-content">
            <i className="fa-solid fa-dollar-sign detail-icon"></i>
            <p className="detail-text">${business.minimum_price || "Pricing Not Yet Set"}</p>
          </div>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* 🔹 SECTION 3: Meet the Vendor */}
      <h2 className="section-header">Meet the Vendor</h2>
      <div className="vendor-section">
        <img src={profileImage} alt="Vendor" className="vendor-image" />
        <div className="vendor-info">
          <p className="vendor-name">{business.business_name}</p>
          <p className="vendor-category">{business.business_category || "Category not set"}</p>
        </div>
        <p className="vendor-story">{business.story || "No story available"}</p>
      </div>

      <div className="section-divider"></div>

      {/* 🔹 SECTION 4: Specialties */}
      {business.specializations && business.specializations.length > 0 && (
        <>
          <h2 className="section-header">Specialties</h2>
          <div className="specialties-section">
            {business.specializations.map((specialty, index) => (
              <span key={index} className="specialty-item">• {specialty}</span>
            ))}
          </div>
          <div className="section-divider"></div>
        </>
      )}

    </div>
  );
};

export default Portfolio;