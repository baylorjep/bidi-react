import React from "react";

function ReviewSummary({
  formData,
  calculateBidScore,
  couponCode,
  setCouponCode,
  couponMessage,
  appliedCoupon,
  couponLoading,
  handleApplyCoupon,
  earnedCoupon,
  handleEarnedCoupon,
}) {
  const { score } = calculateBidScore(formData);

  const renderDateInfo = () => {
    switch (formData.eventDetails.dateFlexibility) {
      case "specific":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="request-subtype">Date</div>
            <div className="request-info">
              {formData.eventDetails.startDate
                ? new Date(formData.eventDetails.startDate).toLocaleDateString()
                : "Not specified"}
            </div>
          </div>
        );
      case "range":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="request-subtype">Date Range</div>
            <div className="request-info">
              {`${
                formData.eventDetails.startDate
                  ? new Date(
                      formData.eventDetails.startDate
                    ).toLocaleDateString()
                  : "Not specified"
              } - ${
                formData.eventDetails.endDate
                  ? new Date(formData.eventDetails.endDate).toLocaleDateString()
                  : "Not specified"
              }`}
            </div>
          </div>
        );
      case "flexible":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="request-subtype">Date Preference</div>
            <div className="request-info">
              {formData.eventDetails.dateTimeframe === "3months" &&
                "Within 3 months"}
              {formData.eventDetails.dateTimeframe === "6months" &&
                "Within 6 months"}
              {formData.eventDetails.dateTimeframe === "1year" &&
                "Within 1 year"}
              {formData.eventDetails.dateTimeframe === "more" &&
                "More than 1 year"}
              {!formData.eventDetails.dateTimeframe && "Not specified"}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="event-summary-container" style={{ padding: "0" }}>
      {score >= 80 && !earnedCoupon && (
        <div className="coupon-earned-section">
          <h3>🎉 You've Earned a Reward!</h3>
          <p>
            For providing detailed information, you've earned a $25 coupon that
            will be automatically applied to your request.
          </p>
          <button
            className="apply-coupon-btn"
            onClick={() => {
              handleEarnedCoupon();
            }}
          >
            Apply $25 Coupon
          </button>
        </div>
      )}

      {earnedCoupon && (
        <div className="coupon-earned-section">
          <h3>✅ Coupon Applied!</h3>
          <p>Your $25 discount will be applied to your request.</p>
        </div>
      )}

      <div className="request-summary-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div className="request-subtype">Duration (in hours)</div>
          <div className="request-info">{formData.eventDetails.duration}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div className="request-subtype">Start Time</div>
          <div className="request-info">{formData.eventDetails.startTime}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div className="request-subtype">End Time</div>
          <div className="request-info">{formData.eventDetails.endTime}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div className="request-subtype">Second Photographer</div>
          <div className="request-info">
            {formData.eventDetails.secondPhotographer}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div className="request-subtype">Style Preferences</div>
          <div className="request-info">
            {Object.keys(formData.eventDetails.stylePreferences)
              .filter((key) => formData.eventDetails.stylePreferences[key])
              .join(", ")}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div className="request-subtype">Deliverables</div>
          <div className="request-info">
            {Object.keys(formData.eventDetails.deliverables)
              .filter((key) => formData.eventDetails.deliverables[key])
              .join(", ")}
          </div>
        </div>
      </div>

      {formData.eventDetails.additionalComments && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            alignItems: "flex-start",
          }}
        >
          <div className="request-subtype">Additional Comments</div>
          <div
            className="quill-content"
            dangerouslySetInnerHTML={{
              __html: formData.eventDetails.additionalComments,
            }}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginTop: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="custom-input-container" style={{ marginBottom: "0" }}>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter coupon code"
              className="custom-input"
              style={{
                backgroundColor: appliedCoupon ? "#f0fff0" : "white",
              }}
            />
            <label htmlFor="coupon" className="custom-label">
              Coupon
            </label>
          </div>
          <button
            onClick={handleApplyCoupon}
            className="request-form-back-and-foward-btn"
            style={{ padding: "8px 12px", fontSize: "16px" }}
            disabled={couponLoading}
          >
            {couponLoading ? "Loading..." : "Verify"}
          </button>
        </div>
        {couponMessage && (
          <div
            className={`coupon-message ${appliedCoupon ? "success" : "error"}`}
          >
            {couponMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewSummary;
