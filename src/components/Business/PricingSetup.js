import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner';
import './PricingSetup.css';

const PricingSetup = () => {
  const [user, setUser] = useState(null);
  const [businessCategories, setBusinessCategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingPricingRules, setExistingPricingRules] = useState({});
  
  // Pricing form state
  const [pricingData, setPricingData] = useState({
    pricing_model: 'fixed', // fixed, hourly, per_person, custom
    hourly_rate: '',
    base_price: '',
    per_person_rate: '',
    travel_fee_per_mile: '',
    bid_aggressiveness: 'balanced', // conservative, balanced, aggressive
    accept_unknowns: true,
    blocklist_keywords: [],
    default_message: '',
    additional_comments: '',
    pricing_packages: [], // Array of package objects
    
    // Category-specific pricing
    wedding_premium: '',
    duration_multipliers: {},
    service_addons: {},
    seasonal_pricing: {},
    rush_fee_percentage: '',
    deposit_percentage: '',
    
    // Advanced pricing rules
    minimum_guests: '',
    maximum_guests: '',
    group_discounts: {},
    package_discounts: {},
    custom_pricing_rules: []
  });

  // Package builder state
  const [newPackage, setNewPackage] = useState({
    name: '',
    price: '',
    description: '',
    duration: '',
    features: []
  });
  const [showPackageForm, setShowPackageForm] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndCategories = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          navigate('/login');
          return;
        }
        setUser(currentUser);

        // Get business categories
        const { data: businessProfile } = await supabase
          .from('business_profiles')
          .select('business_category')
          .eq('id', currentUser.id)
          .single();

        let userCategories = [];
        if (businessProfile?.business_category) {
          if (Array.isArray(businessProfile.business_category)) {
            userCategories = businessProfile.business_category.filter(cat => cat !== 'other');
          } else {
            userCategories = [businessProfile.business_category];
          }
        }

        if (userCategories.length === 0) {
          userCategories = ['photography']; // Default fallback
        }

        setBusinessCategories(userCategories);
        setCurrentCategory(userCategories[0]);

        // Fetch existing pricing rules
        const { data: existingRules } = await supabase
          .from('business_pricing_rules')
          .select('*')
          .eq('business_id', currentUser.id);

        if (existingRules) {
          const rulesByCategory = {};
          existingRules.forEach(rule => {
            rulesByCategory[rule.category] = rule;
          });
          setExistingPricingRules(rulesByCategory);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsLoading(false);
      }
    };

    fetchUserAndCategories();
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setPricingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, value) => {
    setPricingData(prev => ({
      ...prev,
      [field]: Array.isArray(value) ? value : value.split(',').map(item => item.trim())
    }));
  };

  // Package management functions
  const handleAddPackage = () => {
    if (!newPackage.name || !newPackage.price) {
      alert('Please enter at least a package name and price');
      return;
    }

    const packageToAdd = {
      id: Date.now(), // Simple unique ID
      name: newPackage.name,
      price: parseFloat(newPackage.price),
      description: newPackage.description,
      duration: newPackage.duration,
      features: newPackage.features.filter(f => f.trim() !== '')
    };

    setPricingData(prev => ({
      ...prev,
      pricing_packages: [...prev.pricing_packages, packageToAdd]
    }));

    // Reset form
    setNewPackage({
      name: '',
      price: '',
      description: '',
      duration: '',
      features: []
    });
    setShowPackageForm(false);
  };

  const handleRemovePackage = (packageId) => {
    setPricingData(prev => ({
      ...prev,
      pricing_packages: prev.pricing_packages.filter(pkg => pkg.id !== packageId)
    }));
  };

  const handleAddFeature = () => {
    setNewPackage(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const handleFeatureChange = (index, value) => {
    setNewPackage(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const handleRemoveFeature = (index) => {
    setNewPackage(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const loadExistingPricingForCategory = (category) => {
    const existing = existingPricingRules[category];
    if (existing) {
      setPricingData({
        pricing_model: existing.pricing_model || 'fixed',
        hourly_rate: existing.hourly_rate?.toString() || '',
        base_price: existing.base_price?.toString() || '',
        per_person_rate: existing.per_person_rate?.toString() || '',
        travel_fee_per_mile: existing.travel_fee_per_mile?.toString() || '',
        bid_aggressiveness: existing.bid_aggressiveness || 'balanced',
        accept_unknowns: existing.accept_unknowns ?? true,
        blocklist_keywords: existing.blocklist_keywords || [],
        default_message: existing.default_message || '',
        additional_comments: existing.additional_comments || '',
        pricing_packages: existing.pricing_packages || [],
        wedding_premium: existing.wedding_premium?.toString() || '',
        duration_multipliers: existing.duration_multipliers || {},
        service_addons: existing.service_addons || {},
        seasonal_pricing: existing.seasonal_pricing || {},
        rush_fee_percentage: existing.rush_fee_percentage?.toString() || '',
        deposit_percentage: existing.deposit_percentage?.toString() || '',
        minimum_guests: existing.minimum_guests?.toString() || '',
        maximum_guests: existing.maximum_guests?.toString() || '',
        group_discounts: existing.group_discounts || {},
        package_discounts: existing.package_discounts || {},
        custom_pricing_rules: existing.custom_pricing_rules || []
      });
    } else {
      // Reset to defaults for new category
      setPricingData({
        pricing_model: 'fixed',
        hourly_rate: '',
        base_price: '',
        per_person_rate: '',
        travel_fee_per_mile: '',
        bid_aggressiveness: 'balanced',
        accept_unknowns: true,
        blocklist_keywords: [],
        default_message: '',
        additional_comments: '',
        pricing_packages: [],
        wedding_premium: '',
        duration_multipliers: {},
        service_addons: {},
        seasonal_pricing: {},
        rush_fee_percentage: '',
        deposit_percentage: '',
        minimum_guests: '',
        maximum_guests: '',
        group_discounts: {},
        package_discounts: {},
        custom_pricing_rules: []
      });
    }
  };

  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
    loadExistingPricingForCategory(category);
    setCurrentStep(0);
  };

  const handleSavePricing = async () => {
    if (!user || !currentCategory) return;

    setIsSaving(true);
    try {
      const pricingDataToSave = {
        business_id: user.id,
        category: currentCategory,
        pricing_model: pricingData.pricing_model,
        hourly_rate: parseFloat(pricingData.hourly_rate) || null,
        base_price: parseFloat(pricingData.base_price) || null,
        per_person_rate: parseFloat(pricingData.per_person_rate) || null,
        travel_fee_per_mile: parseFloat(pricingData.travel_fee_per_mile) || null,
        bid_aggressiveness: pricingData.bid_aggressiveness,
        accept_unknowns: pricingData.accept_unknowns,
        blocklist_keywords: pricingData.blocklist_keywords,
        default_message: pricingData.default_message,
        additional_comments: pricingData.additional_comments,
        additional_notes: pricingData.additional_comments, // Also save to additional_notes field
        pricing_packages: pricingData.pricing_packages,
        wedding_premium: parseFloat(pricingData.wedding_premium) || null,
        duration_multipliers: pricingData.duration_multipliers,
        service_addons: pricingData.service_addons,
        seasonal_pricing: pricingData.seasonal_pricing,
        rush_fee_percentage: parseFloat(pricingData.rush_fee_percentage) || null,
        deposit_percentage: parseFloat(pricingData.deposit_percentage) || null,
        minimum_guests: parseInt(pricingData.minimum_guests) || null,
        maximum_guests: parseInt(pricingData.maximum_guests) || null,
        group_discounts: pricingData.group_discounts,
        package_discounts: pricingData.package_discounts,
        custom_pricing_rules: pricingData.custom_pricing_rules
      };

      // Check if pricing rule already exists for this category
      const existing = existingPricingRules[currentCategory];
      
      if (existing) {
        // Update existing rule
        const { error } = await supabase
          .from('business_pricing_rules')
          .update(pricingDataToSave)
          .eq('business_id', user.id)
          .eq('category', currentCategory);

        if (error) throw error;
      } else {
        // Insert new rule
        const { error } = await supabase
          .from('business_pricing_rules')
          .insert(pricingDataToSave);

        if (error) throw error;
      }

      // Update local state
      setExistingPricingRules(prev => ({
        ...prev,
        [currentCategory]: pricingDataToSave
      }));

      // Move to next category or complete
      const currentIndex = businessCategories.indexOf(currentCategory);
      if (currentIndex < businessCategories.length - 1) {
        const nextCategory = businessCategories[currentIndex + 1];
        handleCategoryChange(nextCategory);
        // Show success message for this category
        alert(`${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} pricing saved! Moving to next category...`);
      } else {
        // All categories complete
        alert('All pricing rules saved! Redirecting to AI training...');
        navigate('/autobid-trainer');
      }

    } catch (error) {
      console.error('Error saving pricing rules:', error);
      alert('Error saving pricing rules. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderBasicPricingStep = () => (
    <div className="pricing-step">
      <h3>Basic Pricing Information</h3>
      <p className="step-description">Set your fundamental pricing structure for {currentCategory} services. This helps the AI understand your pricing model.</p>
      
      <div className="form-grid">
        <div className="form-group">
          <label>Base Price ($)</label>
          <input
            type="number"
            value={pricingData.base_price}
            onChange={(e) => handleInputChange('base_price', e.target.value)}
            placeholder="e.g., 500"
            min="0"
          />
          <small>Your base price for this service (starting point for calculations)</small>
        </div>

        <div className="form-group full-width">
          <label>Pricing Packages</label>
          <div className="packages-container">
            {pricingData.pricing_packages.length > 0 && (
              <div className="packages-list">
                {pricingData.pricing_packages.map((pkg, index) => (
                  <div key={pkg.id} className="package-item">
                    <div className="package-header">
                      <h4>{pkg.name} - ${pkg.price}</h4>
                      <button 
                        type="button" 
                        className="remove-package-btn"
                        onClick={() => handleRemovePackage(pkg.id)}
                      >
                        ×
                      </button>
                    </div>
                    {pkg.description && <p className="package-description">{pkg.description}</p>}
                    {pkg.duration && <p className="package-duration">Duration: {pkg.duration}</p>}
                    {pkg.features.length > 0 && (
                      <ul className="package-features">
                        {pkg.features.map((feature, i) => (
                          <li key={i}>{feature}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {!showPackageForm ? (
              <button 
                type="button" 
                className="add-package-btn"
                onClick={() => setShowPackageForm(true)}
              >
                + Add Package
              </button>
            ) : (
              <div className="package-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Package Name</label>
                    <input
                      type="text"
                      value={newPackage.name}
                      onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Basic, Premium, Deluxe"
                    />
                  </div>
                  <div className="form-group">
                    <label>Price ($)</label>
                    <input
                      type="number"
                      value={newPackage.price}
                      onChange={(e) => setNewPackage(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="e.g., 500"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <input
                      type="text"
                      value={newPackage.duration}
                      onChange={(e) => setNewPackage(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 4 hours, Full day"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      value={newPackage.description}
                      onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of what's included"
                      rows="2"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Features</label>
                    <div className="features-list">
                      {newPackage.features.map((feature, index) => (
                        <div key={index} className="feature-input">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                            placeholder="e.g., 100 edited photos"
                          />
                          <button 
                            type="button" 
                            className="remove-feature-btn"
                            onClick={() => handleRemoveFeature(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button" 
                        className="add-feature-btn"
                        onClick={handleAddFeature}
                      >
                        + Add Feature
                      </button>
                    </div>
                  </div>
                </div>
                <div className="package-form-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowPackageForm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn-primary"
                    onClick={handleAddPackage}
                  >
                    Add Package
                  </button>
                </div>
              </div>
            )}
          </div>
          <small>Add your main pricing packages to help the AI understand your pricing structure</small>
        </div>

        <div className="form-group">
          <label>Pricing Model</label>
          <select
            value={pricingData.pricing_model}
            onChange={(e) => handleInputChange('pricing_model', e.target.value)}
          >
            <option value="fixed">Fixed Price</option>
            <option value="hourly">Hourly Rate</option>
            <option value="per_person">Per Person</option>
            <option value="custom">Custom Formula</option>
          </select>
        </div>

        {pricingData.pricing_model === 'hourly' && (
          <div className="form-group">
            <label>Hourly Rate ($)</label>
            <input
              type="number"
              value={pricingData.hourly_rate}
              onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
              placeholder="e.g., 150"
              min="0"
            />
          </div>
        )}

        {pricingData.pricing_model === 'per_person' && (
          <div className="form-group">
            <label>Per Person Rate ($)</label>
            <input
              type="number"
              value={pricingData.per_person_rate}
              onChange={(e) => handleInputChange('per_person_rate', e.target.value)}
              placeholder="e.g., 25"
              min="0"
            />
          </div>
        )}

        <div className="form-group">
          <label>Base Price ($)</label>
          <input
            type="number"
            value={pricingData.base_price}
            onChange={(e) => handleInputChange('base_price', e.target.value)}
            placeholder="e.g., 100"
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Travel Fee per Mile ($)</label>
          <input
            type="number"
            value={pricingData.travel_fee_per_mile}
            onChange={(e) => handleInputChange('travel_fee_per_mile', e.target.value)}
            placeholder="e.g., 0.50"
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label>Bid Aggressiveness</label>
          <select
            value={pricingData.bid_aggressiveness}
            onChange={(e) => handleInputChange('bid_aggressiveness', e.target.value)}
          >
            <option value="conservative">Conservative (Higher prices)</option>
            <option value="balanced">Balanced (Market rates)</option>
            <option value="aggressive">Aggressive (Lower prices)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderCategorySpecificStep = () => (
    <div className="pricing-step">
      <h3>Category-Specific Pricing</h3>
      <p className="step-description">Set pricing rules specific to {currentCategory} services. These help the AI adjust pricing based on event details.</p>
      
      <div className="form-grid">
        <div className="form-group">
          <label>Wedding Premium (%)</label>
          <input
            type="number"
            value={pricingData.wedding_premium}
            onChange={(e) => handleInputChange('wedding_premium', e.target.value)}
            placeholder="e.g., 20"
            min="0"
            max="100"
          />
          <small>Additional percentage for wedding events</small>
        </div>

        <div className="form-group">
          <label>Rush Fee (%)</label>
          <input
            type="number"
            value={pricingData.rush_fee_percentage}
            onChange={(e) => handleInputChange('rush_fee_percentage', e.target.value)}
            placeholder="e.g., 25"
            min="0"
            max="100"
          />
          <small>Additional percentage for last-minute bookings</small>
        </div>

        <div className="form-group">
          <label>Deposit Percentage (%)</label>
          <input
            type="number"
            value={pricingData.deposit_percentage}
            onChange={(e) => handleInputChange('deposit_percentage', e.target.value)}
            placeholder="e.g., 25"
            min="0"
            max="100"
          />
          <small>Required deposit to secure booking</small>
        </div>

        <div className="form-group">
          <label>Minimum Guests</label>
          <input
            type="number"
            value={pricingData.minimum_guests}
            onChange={(e) => handleInputChange('minimum_guests', e.target.value)}
            placeholder="e.g., 10"
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Maximum Guests</label>
          <input
            type="number"
            value={pricingData.maximum_guests}
            onChange={(e) => handleInputChange('maximum_guests', e.target.value)}
            placeholder="e.g., 200"
            min="0"
          />
        </div>

        <div className="form-group full-width">
          <label>Accept Unknown Guest Counts</label>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="accept_unknowns"
              checked={pricingData.accept_unknowns}
              onChange={(e) => handleInputChange('accept_unknowns', e.target.checked)}
            />
            <label htmlFor="accept_unknowns">Accept requests with unknown guest counts</label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCommunicationStep = () => (
    <div className="pricing-step">
      <h3>Communication & Preferences</h3>
      <p className="step-description">Set your default message and communication preferences. This helps the AI craft personalized responses.</p>
      
      <div className="form-group full-width">
        <label>Default Message Template</label>
        <textarea
          value={pricingData.default_message}
          onChange={(e) => handleInputChange('default_message', e.target.value)}
          placeholder="Enter your default message that will be included with bids..."
          rows="6"
        />
        <small>Use {'${amount}'} to include the bid amount in your message</small>
      </div>

      <div className="form-group full-width">
        <label>Additional Comments</label>
        <textarea
          value={pricingData.additional_comments}
          onChange={(e) => handleInputChange('additional_comments', e.target.value)}
          placeholder="Any additional pricing notes or special considerations..."
          rows="4"
        />
      </div>

      <div className="form-group full-width">
        <label>Blocklist Keywords</label>
        <input
          type="text"
          value={pricingData.blocklist_keywords.join(', ')}
          onChange={(e) => handleArrayChange('blocklist_keywords', e.target.value)}
          placeholder="Enter keywords separated by commas (e.g., budget, cheap, low-cost)"
        />
        <small>Requests containing these keywords will be automatically declined</small>
      </div>
    </div>
  );

  const renderSteps = () => {
    const steps = [
      { component: renderBasicPricingStep, title: 'Basic Pricing' },
      { component: renderCategorySpecificStep, title: 'Category Specific' },
      { component: renderCommunicationStep, title: 'Communication' }
    ];

    return steps[currentStep]?.component() || null;
  };

  const handleNextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSavePricing();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="pricing-setup-container">
        <div className="loading-container">
          <LoadingSpinner color="#9633eb" size={50} />
          <p>Loading pricing setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-setup-container">
      <div className="pricing-setup-header">
        <h1>AI Pricing Setup</h1>
        <p>Configure your pricing rules to train the AI to generate accurate bids</p>
      </div>

      <div className="category-progress">
        <h3>Pricing Setup Progress</h3>
        <div className="category-list">
          {businessCategories.map((category, index) => (
            <div 
              key={category} 
              className={`category-item ${category === currentCategory ? 'active' : ''} ${existingPricingRules[category] ? 'completed' : ''}`}
            >
              <div className="category-number">{index + 1}</div>
              <div className="category-info">
                <div className="category-name">{category.charAt(0).toUpperCase() + category.slice(1)}</div>
                <div className="category-status">
                  {existingPricingRules[category] ? '✓ Completed' : 'Pending'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="current-category-header">
        <h2>Setting up pricing for: <span className="category-highlight">{currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}</span></h2>
        <p>Each business category needs separate pricing rules. Complete the setup for all categories to begin AI training.</p>
      </div>

      <div className="progress-indicator">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentStep + 1) / 3) * 100}%` }}
          ></div>
        </div>
        <span className="progress-text">Step {currentStep + 1} of 3</span>
      </div>

      <div className="pricing-content">
        {renderSteps()}
      </div>

      <div className="pricing-actions">
        {currentStep > 0 && (
          <button 
            className="btn-secondary" 
            onClick={handlePrevStep}
            disabled={isSaving}
          >
            Previous
          </button>
        )}
        
        <button 
          className="btn-primary" 
          onClick={handleNextStep}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : currentStep === 2 ? 'Save & Continue' : 'Next'}
        </button>
      </div>

      <div className="pricing-info">
        <h4>Why is this important?</h4>
        <p>
          The AI needs to understand your exact pricing structure to generate accurate bids. 
          This includes your base rates, multipliers, and special considerations. 
          The more detailed your pricing rules, the more accurate the AI-generated bids will be.
        </p>
      </div>
    </div>
  );
};

export default PricingSetup; 