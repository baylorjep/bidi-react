// this is where you will build in the component for the portfolio page

//1. Update BidDisplay.js (the component used to display a bid to users)(it's in the components/Bid directory )
// so that when users click the business name, they are taken to the business's portfolio page.

//2. Finish creating this component:  Portfolio.js,
// start with a basic view  that will show the portfolio page from a given business

//3. Update App.js (in the src directory) to handle the routing for the portfolio page.
// my guess is the best way to do this is by grabbing the associated business ID from the bid and passing it to the portfolio page

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient"; // Import Supabase client
import "../../styles/Portfolio.css";
import vendorProfile from "../../assets/images/tempVendorProfile.jpg";

const Portfolio = () => {
  const { businessId } = useParams(); // Get business ID from URL
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

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
        setProfileImage(data.profile_image || null);
      }
      setLoading(false);
    };

    fetchBusinessPortfolio();
  }, [businessId]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const filePath = `business_profiles/${businessId}/profile_image_${Date.now()}`;
    const { error } = await supabase.storage
      .from("profile_images") // Ensure this matches your Supabase storage bucket
      .upload(filePath, file);

    if (error) {
      console.error("Image upload failed:", error);
      return;
    }

    const publicUrl = supabase.storage
      .from("profile_images")
      .getPublicUrl(filePath).data.publicUrl;

    // Update the business profile with new image
    await supabase
      .from("business_profiles")
      .update({ profile_image: publicUrl })
      .eq("id", businessId);

    setProfileImage(publicUrl);
  };

  if (loading) return <p>Loading portfolio...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="portfolio-container">
      {/* Business Header */}
      <div className="business-header">
        {/* Business Info */}
        <div className="business-info">
          <h1 className="business-name">{business.business_name}</h1>
          <p className="business-location">
            📍 {business.business_address || "Location not available"}
          </p>
          <p className="business-price2">
            💲 Base Price: ${business.base_price || "100"}
          </p>
        </div>
      </div>

      {/* Meet the Vendor Section */}
      <div className="vendor-section">
        <h2>Meet the Vendor</h2>
        <div className="vendor-info">
          <div className="vendor-profile">
            <img src={vendorProfile} alt="Vendor" className="vendor-image" />
            <p className="vendor-name">MaryAnna</p>
            <p className="vendor-role">Owner</p>
          </div>
          <p className="vendor-description">
            We specialize in weddings, dances, and more. We love to help our
            customers feel comfortable and create beautiful moments they cherish
            forever.
          </p>
        </div>
      </div>

      {/* Selections Section */}
      <div className="selections-section">
        <h2>Selections</h2>
        <ul className="selections-list">
          <li>Bouquets</li>
          <li>Boutonnieres</li>
          <li>Centerpieces</li>
          <li>Corsages</li>
          <li>Flower Crowns</li>
          <li>Flower Baskets</li>
          <li>Plants</li>
          <li>Wedding Arch</li>
          <li>Setup</li>
          <li>Rental</li>
          <li>Delivery</li>
          <li>Clean up</li>
        </ul>
      </div>
    </div>
  );
};

export default Portfolio;
