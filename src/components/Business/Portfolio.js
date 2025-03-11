// this is where you will build in the component for the portfolio page

//1. Update BidDisplay.js (the component used to display a bid to users)(it's in the components/Bid directory ) 
// so that when users click the business name, they are taken to the business's portfolio page.

//2. Finish creating this component:  Portfolio.js,
// start with a basic view  that will show the portfolio page from a given business

//3. Update App.js (in the src directory) to handle the routing for the portfolio page.
// my guess is the best way to do this is by grabbing the associated business ID from the bid and passing it to the portfolio page

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "../../styles/Portfolio.css";


const Portfolio = () => {
  const { businessId } = useParams(); 
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileImage, setProfileImage] = useState("/images/default.jpg");
  const [portfolioPic, setPortfolioPic] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchBusinessPortfolio = async () => {
      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", businessId)
        .single();

      if (error) {
        setError("Failed to load business portfolio");
        console.error(error);
      } else {
        setBusiness(data);
      }

      const { data: profilePicData, error: profilePicError } = await supabase
        .from("profile_photos")
        .select("photo_url")
        .eq("user_id", businessId)
        .eq("photo_type", "profile")
        .single();

      if (profilePicData) {
        setProfileImage(profilePicData.photo_url);
      } else if (profilePicError) {
        console.error("Error fetching profile picture:", profilePicError);
      }

      const { data: portfolioData, error: portfolioError } = await supabase
        .from("profile_photos")
        .select("photo_url")
        .eq("user_id", businessId)
        .eq("photo_type", "portfolio");

      if (portfolioError) {
        console.error("Error fetching portfolio images:", portfolioError);
      } else {
        setPortfolioPic(portfolioData.map(img => img.photo_url));
      }

      setLoading(false);
    };

    fetchBusinessPortfolio();
  }, [businessId]);

  if (loading) return <p>Loading portfolio...</p>;
  if (error) return <p>{error}</p>;

  const visibleImages = showAll ? portfolioPic : portfolioPic.slice(0, 4);

  return (
    <div className="portfolio-container">
      {/* 🔹 Portfolio Images Grid (With Overlay Button) */}
      {portfolioPic.length > 0 && (
        <div className="portfolio-grid">
          {visibleImages.map((img, index) => (
            <div key={index} className="portfolio-image-wrapper">
              <img src={img} alt={`Portfolio ${index}`} className="portfolio-image" />
              {!showAll && index === 3 && portfolioPic.length > 4 && (
                <button className="see-all-button" onClick={() => setShowAll(true)}>
                  + See All
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 🔹 "Hide" Button when viewing all */}
      {showAll && (
        <button className="see-all-toggle" onClick={() => setShowAll(false)}>
          Hide
        </button>
      )}

      {/* 🔹 Business Header */}
      <div className="business-header">
        <h1 className="business-name">{business.business_name}</h1>
        <h3 className="business-oneliner">
          {business.business_description || "No description available"}
        </h3>
      </div>
      {/*<PortfolioBidDisplay businessId={businessId} /> */}
      <div className="section-divider"></div>

      <div className="business-details">
  <div className="business-detail">
    <img
      src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='31' height='31' viewBox='0 0 31 31' fill='none'%3E%3Cpath d='M23.5712 17.3208C22.5559 19.3779 21.1816 21.4289 19.7736 23.2695C18.3701 25.1042 16.9617 26.6926 15.9024 27.8234C15.7616 27.9737 15.6272 28.1157 15.5 28.2489C15.3728 28.1157 15.2384 27.9737 15.0976 27.8234C14.0383 26.6926 12.6299 25.1042 11.2264 23.2695C9.81836 21.4289 8.4441 19.3779 7.42882 17.3208C6.40306 15.2425 5.8125 13.2949 5.8125 11.625C5.8125 6.27474 10.1497 1.9375 15.5 1.9375C20.8503 1.9375 25.1875 6.27474 25.1875 11.625C25.1875 13.2949 24.5969 15.2425 23.5712 17.3208ZM15.5 31C15.5 31 27.125 19.9828 27.125 11.625C27.125 5.20469 21.9203 0 15.5 0C9.07969 0 3.875 5.20469 3.875 11.625C3.875 19.9828 15.5 31 15.5 31Z' fill='black'/%3E%3Cpath d='M15.5 15.5C13.3599 15.5 11.625 13.7651 11.625 11.625C11.625 9.4849 13.3599 7.75 15.5 7.75C17.6401 7.75 19.375 9.4849 19.375 11.625C19.375 13.7651 17.6401 15.5 15.5 15.5ZM15.5 17.4375C18.7102 17.4375 21.3125 14.8352 21.3125 11.625C21.3125 8.41484 18.7102 5.8125 15.5 5.8125C12.2898 5.8125 9.6875 8.41484 9.6875 11.625C9.6875 14.8352 12.2898 17.4375 15.5 17.4375Z' fill='black'/%3E%3C/svg%3E"
      alt="Location Icon"
      className="detail-icon location-icon"
    />
    <div>
      <p className="detail-title">Location</p>
      <p className="detail-text">{business.business_address || "Location not available"}</p>
    </div>
  </div>

  <div className="business-detail">
  <svg
  xmlns="http://www.w3.org/2000/svg"
  width="19"
  height="19"
  viewBox="0 0 19 19"
  fill="none"
  className="detail-icon price-icon"
>
  <path d="M4.75 12.8028C4.92553 14.7824 6.54662 16.1864 9.01439 16.3682V17.8125H10.2534V16.3682C12.9484 16.1561 14.6211 14.6612 14.6211 12.4493C14.6211 10.5605 13.4956 9.4697 11.1105 8.85358L10.2534 8.63138V4.11657C11.5854 4.24787 12.4837 4.96499 12.7109 6.03562H14.4559C14.2597 4.13677 12.6283 2.77324 10.2534 2.62173V1.1875H9.01439V2.65204C6.71183 2.92474 5.13204 4.39938 5.13204 6.39923C5.13204 8.12637 6.27816 9.3485 8.29162 9.86361L9.01439 10.0555V14.843C7.65144 14.641 6.71183 13.8936 6.48467 12.8028H4.75ZM8.77691 8.24757C7.53786 7.93446 6.87703 7.26785 6.87703 6.32852C6.87703 5.2074 7.71339 4.37918 9.01439 4.15697V8.30817L8.77691 8.24757ZM10.6665 10.4696C12.1946 10.8534 12.8658 11.4897 12.8658 12.5705C12.8658 13.8734 11.8849 14.742 10.2534 14.8733V10.3686L10.6665 10.4696Z" fill="black"/>
</svg>
    <div>
      <p className="detail-title">Price Range</p>
      <p className="detail-text">Base Price: ${business.base_price || "1000"}</p>
    </div>
  </div>
</div>

<div className="section-divider"></div>

      {/* 🔹 Meet the Vendor Section */}
        <div className="vendor-section">
          <h2 className="vendor-title">Meet the Vendor</h2>
          <div className="vendor-info">
            <div className="vendor-profile">
              <img src={profileImage} alt="Vendor" className="vendor-image" />
              <p className="vendor-name">{business.business_owner_name || "Vendor"}</p>
              <p className="vendor-role">Owner</p>
            </div>
            <p className="vendor-description">
              {business.business_description || "No description available"}
            </p>
          </div>
          {/*<button className="message-vendor-button">
            <span className="message-vendor-button-text">Message the Vendor</span>
      </button>*/}
        </div>

       {/*  <div className="section-divider"></div> */}

        {/* 🔹 Specialties Section */}{/* 
        <div className="specialties-section">
          <h2 className="specialties-title">Specialties</h2>
          <ul className="specialties-list">
            {[
              "Bouquets",
              "Boutonnieres",
              "Centerpieces",
              "Corsages",
              "Flower Crowns",
              "Flower Baskets",
              "Plants",
              "Wedding Arch",
              "Setup",
              "Rental",
              "Delivery",
              "Clean up",
            ].map((specialty, index) => (
              <li key={index} className="specialty-item">
                <span className="bullet-point">•</span> {specialty}
              </li>
            ))}
          </ul>
        </div>
        */}
    </div>
  );
};

export default Portfolio;