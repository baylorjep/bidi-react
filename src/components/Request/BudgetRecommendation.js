import React, { useEffect } from "react";

function BudgetRecommendation({ formData, setFormData }) {
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      commonDetails: {
        ...prev.commonDetails,
        [field]: value,
      },
    }));
  };

  // Add this helper function near your other helper functions
  const getPriceQualityDescription = (preference) => {
    switch (preference) {
      case "1":
        return (
          <div className="preference-detail">
            <p>👉 Focus on finding photographers within your budget</p>
            <p>👉 May need to be flexible with style and experience</p>
            <p>👉 Good for those with strict budget constraints</p>
          </div>
        );
      case "2":
        return (
          <div className="preference-detail">
            <p>👉 Balance between quality and cost</p>
            <p>👉 Mix of experienced and emerging photographers</p>
            <p>👉 Best for most situations</p>
          </div>
        );
      case "3":
        return (
          <div className="preference-detail">
            <p>👉 Priority on portfolio quality and experience</p>
            <p>👉 Access to top-tier photographers</p>
            <p>👉 Ideal for those seeking premium results</p>
          </div>
        );
      default:
        return null;
    }
  };

  const analyzeEventDetails = (eventDetails, eventType) => {
    let basePrice = 0;
    let factors = [];

    // Base price by event type
    if (eventType?.toLowerCase() === "wedding") {
      basePrice = 2000;
    } else {
      basePrice = 500;
    }

    // Duration factor
    if (!eventDetails.durationUnknown && eventDetails.duration) {
      const hours = parseInt(eventDetails.duration);
      if (hours > 4) {
        basePrice += (hours - 4) * 200;
        factors.push(`${hours} hours of coverage`);
      }
    }

    // Second photographer
    if (eventDetails.secondPhotographer === "yes") {
      basePrice += 500;
      factors.push("Second photographer");
    }

    // Deliverables analysis
    const deliverablesPricing = {
      weddingAlbum: { price: 500, label: "Wedding album" },
      prints: { price: 300, label: "Professional prints" },
      rawFiles: { price: 200, label: "RAW files" },
      engagement: { price: 400, label: "Engagement session" },
    };

    Object.entries(eventDetails.deliverables || {}).forEach(
      ([key, selected]) => {
        if (selected && deliverablesPricing[key]) {
          basePrice += deliverablesPricing[key].price;
          factors.push(deliverablesPricing[key].label);
        }
      }
    );

    // Wedding-specific factors
    if (eventType?.toLowerCase() === "wedding") {
      const weddingDetails = eventDetails.weddingDetails || {};
      let coveragePoints = 0;

      if (weddingDetails.preCeremony) coveragePoints++;
      if (weddingDetails.ceremony) coveragePoints++;
      if (weddingDetails.luncheon) coveragePoints++;
      if (weddingDetails.reception) coveragePoints++;

      if (coveragePoints > 2) {
        basePrice += (coveragePoints - 2) * 300;
        factors.push(`Coverage for ${coveragePoints} events`);
      }
    }

    // Group size factor
    if (!eventDetails.numPeopleUnknown && eventDetails.numPeople) {
      const people = parseInt(eventDetails.numPeople);
      if (people > 50) {
        basePrice += 200;
        factors.push("Large group (50+ people)");
      }
    }

    // Round to nearest price bracket
    const brackets = [1000, 2000, 3000, 4000, 5000];
    const suggestedRange = brackets.find((b) => basePrice <= b) || "5000+";

    return {
      suggestedRange:
        suggestedRange === 5000
          ? "5000+"
          : `${suggestedRange - 1000}-${suggestedRange}`,
      factors,
      basePrice,
    };
  };

  const getBudgetRecommendation = (preference, eventType, eventDetails) => {
    const analysis = analyzeEventDetails(eventDetails, eventType);
    const baseRecommendation = analysis.suggestedRange;

    // Adjust based on price-quality preference
    let adjustedRange = baseRecommendation;
    if (preference === "1") {
      const currentMin = parseInt(baseRecommendation.split("-")[0]);
      adjustedRange =
        currentMin <= 1000 ? "0-1000" : `${currentMin - 1000}-${currentMin}`;
    } else if (preference === "3") {
      const currentMax = baseRecommendation.includes("+")
        ? 6000
        : parseInt(baseRecommendation.split("-")[1]);
      adjustedRange =
        currentMax >= 5000 ? "5000+" : `${currentMax}-${currentMax + 1000}`;
    }

    return {
      [preference]: {
        range: adjustedRange,
        message: `Recommended Budget Range: $${adjustedRange}`,
        analysis: {
          basePrice: analysis.basePrice,
          factors: analysis.factors,
        },
      },
    };
  };

  const getBudgetInsights = (priceRange, eventType) => {
    const insights = {
      wedding: {
        "0-1000": {
          quality: "Basic coverage with limited editing",
          experience: "Newer photographers building their portfolio",
          bids: "May receive fewer bids from experienced photographers",
          hours: "Typically 2-4 hours of coverage",
          warning: "This budget may limit your options significantly",
        },
        "1000-2000": {
          quality: "Standard coverage with professional editing",
          experience: "Mix of emerging and established photographers",
          bids: "Expect moderate number of bids",
          hours: "Usually 4-6 hours of coverage",
          warning: null,
        },
        "2000-3000": {
          quality: "High-quality coverage with detailed editing",
          experience: "Experienced photographers with strong portfolios",
          bids: "Should receive numerous quality bids",
          hours: "Generally 6-8 hours of coverage",
          warning: null,
        },
        "3000-4000": {
          quality: "Premium coverage with extensive editing",
          experience: "Very experienced professionals",
          bids: "Will attract top-tier photographers",
          hours: "Full day coverage (8-10 hours)",
          warning: null,
        },
        "4000-5000": {
          quality: "Luxury service with artistic direction",
          experience: "Top professionals with extensive experience",
          bids: "Will attract premium service providers",
          hours: "Full day coverage with additional services",
          warning: null,
        },
        "5000+": {
          quality: "Elite service with complete customization",
          experience: "Industry-leading photographers",
          bids: "Will attract the most exclusive photographers",
          hours: "Unlimited coverage with premium add-ons",
          warning: null,
        },
      },
      default: {
        "0-1000": {
          quality: "Basic professional coverage",
          experience: "Newer photographers building their portfolio",
          bids: "May receive fewer bids",
          hours: "1-2 hours of coverage",
          warning: null,
        },
        "1000-2000": {
          quality: "Standard professional coverage",
          experience: "Mix of emerging and established photographers",
          bids: "Expect moderate number of bids",
          hours: "2-3 hours of coverage",
          warning: null,
        },
        "2000-3000": {
          quality: "Premium coverage with detailed editing",
          experience: "Experienced photographers",
          bids: "Will attract experienced professionals",
          hours: "3-4 hours of coverage",
          warning: null,
        },
        "3000+": {
          quality: "Luxury service with full customization",
          experience: "Top professionals",
          bids: "Will attract premium service providers",
          hours: "Extended coverage with add-ons",
          warning: null,
        },
      },
    };

    const rangeData = insights[eventType?.toLowerCase()] || insights.default;
    const insight = rangeData[priceRange];

    if (!insight) {
      return (
        <div className="budget-insight-details">
          <div className="insight-warning">
            ⚠️ No insights available for the selected budget range or event
            type.
          </div>
        </div>
      );
    }

    return (
      <div className="budget-insight-details">
        <div className="insight-item">
          <span className="insight-icon">📸</span>
          <span className="insight-text">{insight.quality}</span>
        </div>
        <div className="insight-item">
          <span className="insight-icon">👤</span>
          <span className="insight-text">{insight.experience}</span>
        </div>
        <div className="insight-item">
          <span className="insight-icon">🕒</span>
          <span className="insight-text">{insight.hours}</span>
        </div>
        <div className="insight-item">
          <span className="insight-icon">📊</span>
          <span className="insight-text">{insight.bids}</span>
        </div>
        {insight.warning && (
          <div className="insight-warning">⚠️ {insight.warning}</div>
        )}
      </div>
    );
  };

  const preloadBudgetData = () => {
    const priceQualityPreference =
      formData.commonDetails.priceQualityPreference || "2"; // Default to "Balanced"
    const recommendation = getBudgetRecommendation(
      priceQualityPreference,
      formData.commonDetails.eventType,
      formData.commonDetails
    );

    handleInputChange("priceQualityPreference", priceQualityPreference);
    handleInputChange(
      "overallBudget",
      recommendation[priceQualityPreference].range
    );
  };

  useEffect(() => {
    preloadBudgetData(); // Preload budget data when the component mounts
  }, []);

  return (
    <div className="form-grid">
      {/* Slider and Budget Recommendation */}
      <div className="price-quality-slider-container">
        <h3 className="slider-header">What matters most to you?</h3>
        <div className="slider-labels">
          <span>Budget Conscious</span>
          <span>Balanced</span>
          <span>Quality Focused</span>
        </div>
        <input
          type="range"
          min="1"
          max="3"
          step="1"
          value={formData.commonDetails.priceQualityPreference || "2"}
          onChange={(e) => {
            const newPreference = e.target.value;
            const recommendation = getBudgetRecommendation(
              newPreference,
              formData.commonDetails.eventType,
              formData.commonDetails
            );
            handleInputChange("priceQualityPreference", newPreference);
            handleInputChange(
              "overallBudget",
              recommendation[newPreference].range
            );
          }}
          className="price-quality-slider"
        />
        <div className="preference-description">
          {getPriceQualityDescription(
            formData.commonDetails.priceQualityPreference
          )}
        </div>
      </div>

      {/* Overall Budget */}
      <div className="budget-range-selector">
        <div className="custom-input-container">
          <select
            name="overallBudget"
            value={formData.commonDetails.overallBudget || ""}
            onChange={(e) => {
              handleInputChange("overallBudget", e.target.value);
            }}
            className="custom-input"
          >
            <option value="">Select Overall Budget Range</option>
            <option value="0-1000">$0 - $1,000</option>
            <option value="1000-2000">$1,000 - $2,000</option>
            <option value="2000-3000">$2,000 - $3,000</option>
            <option value="3000-4000">$3,000 - $4,000</option>
            <option value="4000-5000">$4,000 - $5,000</option>
            <option value="5000+">$5,000+</option>
          </select>
          <label htmlFor="overallBudget" className="custom-label">
            Overall Budget
          </label>
        </div>
      </div>

      {/* Individual Budgets */}
      {formData.commonDetails.overallBudget &&
        formData.selectedRequests.map((requestType, index) => (
          <div key={index} className="custom-input-container required">
            <select
              name={`budget-${requestType}`}
              value={
                formData.commonDetails.individualBudgets?.[requestType] || ""
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  commonDetails: {
                    ...prev.commonDetails,
                    individualBudgets: {
                      ...prev.commonDetails.individualBudgets,
                      [requestType]: e.target.value,
                    },
                  },
                }))
              }
              className="custom-input"
            >
              <option value="">Select Budget for {requestType}</option>
              <option value="0-1000">$0 - $1,000</option>
              <option value="1000-2000">$1,000 - $2,000</option>
              <option value="2000-3000">$2,000 - $3,000</option>
              <option value="3000-4000">$3,000 - $4,000</option>
              <option value="4000-5000">$4,000 - $5,000</option>
              <option value="5000+">$5,000+</option>
            </select>
            <label htmlFor={`budget-${requestType}`} className="custom-label">
              Budget for {requestType}
            </label>
          </div>
        ))}

      {/* Budget Insights */}
      {formData.commonDetails.overallBudget && (
        <div className="budget-insights">
          <div className="budget-insight-header">
            What to expect in this budget range:
          </div>
          {getBudgetInsights(
            formData.commonDetails.overallBudget,
            formData.commonDetails.eventType
          )}
        </div>
      )}
    </div>
  );
}

export default BudgetRecommendation;
