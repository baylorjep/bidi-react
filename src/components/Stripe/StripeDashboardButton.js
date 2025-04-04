import React, { useState } from "react";
import paymentIcon from "../../assets/images/Icons/payment.svg";

const StripeDashboardButton = ({ accountId, onError, onSuccess }) => {
  const [error, setError] = useState(null);

  const handleViewDashboard = async () => {
    try {
      const response = await fetch("https://bidi-express.vercel.app/create-login-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountId }),
      });

      const data = await response.json();
      if (response.ok) {
        onSuccess && onSuccess();
        window.location.href = data.url;
      } else {
        setError(data.error || "Unable to create login link");
        onError && onError();
      }
    } catch (err) {
      console.error("Error fetching login link:", err);
      setError("An error occurred. Please try again.");
      onError && onError();
    }
  };

  return (
    <div className="d-flex flex-column gap-2">
      <button 
        className="btn-secondary flex-fill" 
        style={{fontWeight:'bold'}}
        onClick={handleViewDashboard}
      >
        Payment Dashboard
      </button>
      {error && <div className="text-danger">{error}</div>}
    </div>
  );
};

export default StripeDashboardButton;
