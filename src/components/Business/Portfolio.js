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

const Portfolio = () => {
  const { businessId } = useParams(); // Get business ID from URL
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setLoading(false);
    };

    fetchBusinessPortfolio();
  }, [businessId]);

  if (loading) return <p>Loading portfolio...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container">
      <h1>{business.business_name}</h1>
      <p>
        <strong>Category:</strong> {business.business_category}
      </p>
      {business.website && (
        <p>
          <strong>Website:</strong>{" "}
          <a href={business.website} target="_blank" rel="noopener noreferrer">
            {business.website}
          </a>
        </p>
      )}
      <p>
        <strong>Description:</strong>{" "}
        {business.description || "No description available"}
      </p>

      {/* Display portfolio images if available */}
      {business.portfolio_images && (
        <div className="portfolio-gallery">
          {business.portfolio_images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt="Portfolio"
              className="portfolio-image"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Portfolio;
