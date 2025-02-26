import React, { useState } from "react";

const StripeDashboardButton = ({ accountId }) => {
  const [error, setError] = useState(null);

  const handleViewDashboard = async () => {
    try {
      const response = await fetch("https://bidi-express.vercel.app/create-login-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountId }), // Send the connected account ID
      });

      const data = await response.json();
      if (response.ok) {
        window.location.href = data.url; // Redirect to the Stripe dashboard
      } else {
        setError(data.error || "Unable to create login link");
      }
    } catch (err) {
      console.error("Error fetching login link:", err);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div>
      {error && <p>{error}</p>}
      <button className="btn-secondary flex-fill"  style={{fontWeight:'bold'}}onClick={handleViewDashboard}>Payment Dashboard</button>
    </div>
  );
};

export default StripeDashboardButton;