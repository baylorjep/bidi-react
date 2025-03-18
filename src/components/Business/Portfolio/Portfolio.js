import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import "../../../styles/Portfolio.css";
import EditProfileModal from "./EditProfileModal"; // Import modal component

const Portfolio = () => {
  const { businessId } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolioPics, setPortfolioPics] = useState([]);
  const [profileImage, setProfileImage] = useState("/images/default.jpg");
  const [isOwner, setIsOwner] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editFields, setEditFields] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBusinessData = async () => {
      const { data: businessData, error: businessError } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", businessId)
        .single();
      if (businessError) console.error("Error fetching business:", businessError);
      else setBusiness(businessData);

      const { data: profileData, error: profileError } = await supabase
        .from("profile_photos")
        .select("photo_url")
        .eq("user_id", businessId)
        .eq("photo_type", "profile")
        .single();
      if (profileData) setProfileImage(profileData.photo_url);
      else if (profileError) console.error("Error fetching profile image:", profileError);

      const { data: portfolioData, error: portfolioError } = await supabase
        .from("profile_photos")
        .select("photo_url")
        .eq("user_id", businessId)
        .eq("photo_type", "portfolio");
      if (portfolioError) console.error("Error fetching portfolio images:", portfolioError);
      else setPortfolioPics(portfolioData.map(img => img.photo_url));

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!userError && user && user.id === businessId) {
        setIsOwner(true);
      }

      setLoading(false);
    };

    fetchBusinessData();
  }, [businessId]);

  const openEditModal = (fields) => {
    setEditFields(fields);
    setModalOpen(true);
  };

  if (loading) return <p>Loading portfolio...</p>;
  if (!business) return <p>Error: Business not found.</p>;

  return (
    <>
      <EditProfileModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        businessId={businessId}
        initialData={editFields}
      />

      <div className="portfolio-container">

        {/* 🔹 SECTION 1: Portfolio Images & Business Info */}
        <div className="section-container">
          <div className="portfolio-header">
            <h2> </h2>
            {isOwner && (
              <button className="edit-icon" onClick={() => openEditModal({ portfolio: portfolioPics })}>
                ✎
              </button>
            )}
          </div>
          <div className="portfolio-layout">
            <img 
              src={portfolioPics.length > 0 ? portfolioPics[0] : "/images/portfolio.jpeg"} 
              alt="Main Portfolio" 
              className="main-portfolio-image" 
            />
            <div className="portfolio-grid">
              {portfolioPics.length > 0
                ? portfolioPics.slice(1, 5).map((img, index) => (
                    <img key={index} src={img} alt={`Portfolio ${index}`} className="portfolio-image" />
                  ))
                : Array.from({ length: 4 }).map((_, index) => (
                    <img key={index} src="/images/portfolio.jpeg" alt={`Default ${index}`} className="portfolio-image" />
                  ))}
              {portfolioPics.length > 5 && (
                <button className="see-all-button" onClick={() => navigate(`/portfolio/${businessId}/gallery`)}>
                  + See All
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="section-container">
          {isOwner && (
            <button className="edit-icon" onClick={() => openEditModal({
              business_name: business.business_name,
              business_description: business.business_description
            })}>
              ✎
            </button>
          )}
          <div className="business-header">
            <h1 className="business-name">{business.business_name}</h1>
            <p className="business-description">{business.business_description || "No description available"}</p>
          </div>
        </div>

        <div className="section-divider"></div>

        {/* 🔹 SECTION 2: Location & Price */}
        <div className="section-container">
          {isOwner && (
            <button className="edit-icon" onClick={() => openEditModal({
              business_address: business.business_address,
              minimum_price: business.minimum_price
            })}>
              ✎
            </button>
          )}
          <div className="business-details">
            <div className="business-detail">
              <p className="detail-title">Location</p>
              <div className="detail-content">
                <i className="fa-solid fa-location-dot detail-icon"></i>
                <p className="detail-text">{business.business_address || "Location not available"}</p>
              </div>
            </div>

            <div className="business-detail">
              <p className="detail-title">Base Price</p>
              <div className="detail-content">
                <i className="fa-solid fa-dollar-sign detail-icon"></i>
                <p className="detail-text">{business.minimum_price || "Pricing Not Yet Set"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="section-divider"></div>

        {/* 🔹 SECTION 3: Specialties */}
        {business.specializations && business.specializations.length > 0 && (
          <div className="section-container">
            {isOwner && (
              <button className="edit-icon" onClick={() => openEditModal({
                specializations: business.specializations
              })}>
                ✎
              </button>
            )}
            <h2 className="section-header">Specialties</h2>
            <div className="specialties-section">
              {business.specializations.map((specialty, index) => (
                <span key={index} className="specialty-item">• {specialty}</span>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default Portfolio;