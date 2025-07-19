import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner';
import { getCategoryConfig, getPackageTemplates, getAddons } from './categoryPricingConfig';
import { toast } from 'react-toastify';
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
    pricing_model: 'fixed', // fixed, hourly, per_person, package, custom
    hourly_rate: '',
    base_price: '',
    per_person_rate: '',
    travel_fee_per_mile: '',
    bid_aggressiveness: 'balanced', // conservative, balanced, aggressive
    blocklist_keywords: [],
    default_message: '',
    additional_comments: '',
    
    // Core autobidding fields
    base_category_rates: {},
    seasonal_pricing: {},
    travel_config: {},
    platform_markup: '',
    consultation_required: false,
    dealbreakers: [],
    style_preferences: [],
    
    // Category-specific pricing
    wedding_premium: '',
    service_addons: {},
    seasonal_pricing: {},
    rush_fee_percentage: '',
    deposit_percentage: '',
    
    // Advanced pricing rules
    minimum_guests: '',
    maximum_guests: '',
    group_discounts: {},
    package_discounts: {},
    custom_pricing_rules: [],
    
    // Photography-specific
    full_day_rate: '',
    half_day_rate: '',
    photo_editing_rate: '',
    rush_editing_fee: '',
    
    // Florist-specific
    flower_tiers: {},
    setup_fee: '',
    delivery_fee: '',
    
    // DJ-specific
    overtime_rate: '',
    equipment_packages: {},
    
    // Catering-specific
    menu_tiers: {},
    service_staff: {},
    kitchen_rental: '',
    china_rental: '',
    
    // Videography-specific
    editing_rate: '',
    
    // Beauty-specific
    hair_only_rate: '',
    makeup_only_rate: '',
    travel_fee: '',
    
    // New category-specific fields
    bridal_package_price: '',
    ceremony_package_price: '',
    ceremony_only_price: '',
    reception_only_price: '',
    full_day_price: '',
    appetizers_only_price: '',
    full_service_price: '',
    premium_service_price: '',
    highlight_video_price: '',
    full_documentary_price: '',
    cinematic_package_price: '',
    bridesmaid_package_price: ''
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
  const [existingPackages, setExistingPackages] = useState([]);

  const navigate = useNavigate();

  // Update page title based on current step
  useEffect(() => {
    let title = 'Set Pricing - Bidi';
    
    if (currentCategory) {
      const categoryConfig = getCategoryConfig(currentCategory);
      const stepNames = ['Basic Pricing', 'Category Specific', 'Autobid Setup', 'Communication'];
      const currentStepName = stepNames[currentStep] || 'Set Pricing';
      title = `${currentStepName} - ${categoryConfig.name} - Bidi`;
    }
    
    document.title = title;
  }, [currentCategory, currentStep]);

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

        // Fetch existing packages from business_packages table
        const { data: packagesData, error: packagesError } = await supabase
          .from('business_packages')
          .select('*')
          .eq('business_id', currentUser.id)
          .order('created_at', { ascending: true });

        if (packagesError) {
          console.error('Error fetching packages:', packagesError);
        } else {
          setExistingPackages(packagesData || []);
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
  const handleAddPackage = async () => {
    if (!newPackage.name || !newPackage.price) {
      alert('Please enter at least a package name and price');
      return;
    }

    try {
      // Save to business_packages table
      const packageData = {
        business_id: user.id,
        name: newPackage.name,
        price: parseFloat(newPackage.price),
        description: newPackage.description || '',
        features: newPackage.features.filter(f => f.trim() !== ''),
        image_url: null // Can be added later
      };

      const { data: savedPackage, error } = await supabase
        .from('business_packages')
        .insert([packageData])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setExistingPackages(prev => [...prev, savedPackage]);

      // Reset form
      setNewPackage({
        name: '',
        price: '',
        description: '',
        duration: '',
        features: []
      });
      setShowPackageForm(false);

      toast.success('Package added successfully!');
    } catch (error) {
      console.error('Error adding package:', error);
      toast.error('Failed to add package. Please try again.');
    }
  };

  const handleRemovePackage = async (packageId) => {
    try {
      // Remove from database
      const { error } = await supabase
        .from('business_packages')
        .delete()
        .eq('id', packageId);

      if (error) throw error;

      // Remove from local state
      setExistingPackages(prev => prev.filter(pkg => pkg.id !== packageId));

      toast.success('Package removed successfully!');
    } catch (error) {
      console.error('Error removing package:', error);
      toast.error('Failed to remove package. Please try again.');
    }
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
        blocklist_keywords: existing.blocklist_keywords || [],
        default_message: existing.default_message || '',
        additional_comments: existing.additional_comments || '',
        wedding_premium: existing.wedding_premium?.toString() || '',
        service_addons: existing.service_addons || {},
        seasonal_pricing: existing.seasonal_pricing || {},
        rush_fee_percentage: existing.rush_fee_percentage?.toString() || '',
        deposit_percentage: existing.deposit_percentage?.toString() || '',
        minimum_guests: existing.minimum_guests?.toString() || '',
        maximum_guests: existing.maximum_guests?.toString() || '',
        group_discounts: existing.group_discounts || {},
        package_discounts: existing.package_discounts || {},
        custom_pricing_rules: existing.custom_pricing_rules || [],
        
        // Category-specific fields
        full_day_rate: existing.full_day_rate?.toString() || '',
        half_day_rate: existing.half_day_rate?.toString() || '',
        photo_editing_rate: existing.photo_editing_rate?.toString() || '',
        rush_editing_fee: existing.rush_editing_fee?.toString() || '',
        flower_tiers: existing.flower_tiers || {},
        setup_fee: existing.setup_fee?.toString() || '',
        delivery_fee: existing.delivery_fee?.toString() || '',
        overtime_rate: existing.overtime_rate?.toString() || '',
        equipment_packages: existing.equipment_packages || {},
        menu_tiers: existing.menu_tiers || {},
        service_staff: existing.service_staff || {},
        kitchen_rental: existing.kitchen_rental?.toString() || '',
        china_rental: existing.china_rental?.toString() || '',
        editing_rate: existing.editing_rate?.toString() || '',
        hair_only_rate: existing.hair_only_rate?.toString() || '',
        makeup_only_rate: existing.makeup_only_rate?.toString() || '',
        travel_fee: existing.travel_fee?.toString() || '',
        
        // New category-specific fields
        bridal_package_price: existing.bridal_package_price?.toString() || '',
        ceremony_package_price: existing.ceremony_package_price?.toString() || '',
        ceremony_only_price: existing.ceremony_only_price?.toString() || '',
        reception_only_price: existing.reception_only_price?.toString() || '',
        full_day_price: existing.full_day_price?.toString() || '',
        appetizers_only_price: existing.appetizers_only_price?.toString() || '',
        full_service_price: existing.full_service_price?.toString() || '',
        premium_service_price: existing.premium_service_price?.toString() || '',
        highlight_video_price: existing.highlight_video_price?.toString() || '',
        full_documentary_price: existing.full_documentary_price?.toString() || '',
        cinematic_package_price: existing.cinematic_package_price?.toString() || '',
        bridesmaid_package_price: existing.bridesmaid_package_price?.toString() || ''
      });
    } else {
      // Reset to empty state for new category
      const categoryConfig = getCategoryConfig(category);
      setPricingData(prev => ({
        ...prev,
        pricing_model: categoryConfig.defaultModel,
        // Reset all numeric fields to empty strings
        hourly_rate: '',
        base_price: '',
        per_person_rate: '',
        travel_fee_per_mile: '',
        wedding_premium: '',
        rush_fee_percentage: '',
        deposit_percentage: '',
        minimum_guests: '',
        maximum_guests: '',
        full_day_rate: '',
        half_day_rate: '',
        photo_editing_rate: '',
        rush_editing_fee: '',
        setup_fee: '',
        delivery_fee: '',
        overtime_rate: '',
        kitchen_rental: '',
        china_rental: '',
        editing_rate: '',
        hair_only_rate: '',
        makeup_only_rate: '',
        travel_fee: '',
        
        // New category-specific fields
        bridal_package_price: '',
        ceremony_package_price: '',
        ceremony_only_price: '',
        reception_only_price: '',
        full_day_price: '',
        appetizers_only_price: '',
        full_service_price: '',
        premium_service_price: '',
        highlight_video_price: '',
        full_documentary_price: '',
        cinematic_package_price: '',
        bridesmaid_package_price: ''
      }));
    }
    setCurrentStep(0);
  };

  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
    loadExistingPricingForCategory(category);
  };

  const handleSavePricing = async () => {
    setIsSaving(true);
    try {
      // Clean numeric fields - convert empty strings to null
      const cleanedData = {
        ...pricingData,
        // Basic fields
        hourly_rate: pricingData.hourly_rate === '' ? null : parseFloat(pricingData.hourly_rate),
        base_price: pricingData.base_price === '' ? null : parseFloat(pricingData.base_price),
        per_person_rate: pricingData.per_person_rate === '' ? null : parseFloat(pricingData.per_person_rate),
        travel_fee_per_mile: pricingData.travel_fee_per_mile === '' ? null : parseFloat(pricingData.travel_fee_per_mile),
        wedding_premium: pricingData.wedding_premium === '' ? null : parseFloat(pricingData.wedding_premium),
        rush_fee_percentage: pricingData.rush_fee_percentage === '' ? null : parseFloat(pricingData.rush_fee_percentage),
        deposit_percentage: pricingData.deposit_percentage === '' ? null : parseFloat(pricingData.deposit_percentage),
        minimum_guests: pricingData.minimum_guests === '' ? null : parseInt(pricingData.minimum_guests),
        maximum_guests: pricingData.maximum_guests === '' ? null : parseInt(pricingData.maximum_guests),
        
        // Photography-specific fields
        full_day_rate: pricingData.full_day_rate === '' ? null : parseFloat(pricingData.full_day_rate),
        half_day_rate: pricingData.half_day_rate === '' ? null : parseFloat(pricingData.half_day_rate),
        photo_editing_rate: pricingData.photo_editing_rate === '' ? null : parseFloat(pricingData.photo_editing_rate),
        rush_editing_fee: pricingData.rush_editing_fee === '' ? null : parseFloat(pricingData.rush_editing_fee),
        
        // Florist-specific fields
        setup_fee: pricingData.setup_fee === '' ? null : parseFloat(pricingData.setup_fee),
        delivery_fee: pricingData.delivery_fee === '' ? null : parseFloat(pricingData.delivery_fee),
        
        // DJ-specific fields
        overtime_rate: pricingData.overtime_rate === '' ? null : parseFloat(pricingData.overtime_rate),
        
        // Catering-specific fields
        kitchen_rental: pricingData.kitchen_rental === '' ? null : parseFloat(pricingData.kitchen_rental),
        china_rental: pricingData.china_rental === '' ? null : parseFloat(pricingData.china_rental),
        
        // Videography-specific fields
        editing_rate: pricingData.editing_rate === '' ? null : parseFloat(pricingData.editing_rate),
        
        // Beauty-specific fields
        hair_only_rate: pricingData.hair_only_rate === '' ? null : parseFloat(pricingData.hair_only_rate),
        makeup_only_rate: pricingData.makeup_only_rate === '' ? null : parseFloat(pricingData.makeup_only_rate),
        travel_fee: pricingData.travel_fee === '' ? null : parseFloat(pricingData.travel_fee),
        
        // New category-specific fields
        bridal_package_price: pricingData.bridal_package_price === '' ? null : parseFloat(pricingData.bridal_package_price),
        ceremony_package_price: pricingData.ceremony_package_price === '' ? null : parseFloat(pricingData.ceremony_package_price),
        ceremony_only_price: pricingData.ceremony_only_price === '' ? null : parseFloat(pricingData.ceremony_only_price),
        reception_only_price: pricingData.reception_only_price === '' ? null : parseFloat(pricingData.reception_only_price),
        full_day_price: pricingData.full_day_price === '' ? null : parseFloat(pricingData.full_day_price),
        appetizers_only_price: pricingData.appetizers_only_price === '' ? null : parseFloat(pricingData.appetizers_only_price),
        full_service_price: pricingData.full_service_price === '' ? null : parseFloat(pricingData.full_service_price),
        premium_service_price: pricingData.premium_service_price === '' ? null : parseFloat(pricingData.premium_service_price),
        highlight_video_price: pricingData.highlight_video_price === '' ? null : parseFloat(pricingData.highlight_video_price),
        full_documentary_price: pricingData.full_documentary_price === '' ? null : parseFloat(pricingData.full_documentary_price),
        cinematic_package_price: pricingData.cinematic_package_price === '' ? null : parseFloat(pricingData.cinematic_package_price),
        bridesmaid_package_price: pricingData.bridesmaid_package_price === '' ? null : parseFloat(pricingData.bridesmaid_package_price)
      };

      const pricingRule = {
        business_id: user.id,
        category: currentCategory,
        ...cleanedData,
        created_at: new Date().toISOString()
      };

      // Check if pricing rule already exists
      const { data: existing } = await supabase
        .from('business_pricing_rules')
        .select('id')
        .eq('business_id', user.id)
        .eq('category', currentCategory)
        .single();

      let result;
      if (existing) {
        // Update existing rule
        result = await supabase
          .from('business_pricing_rules')
          .update(pricingRule)
          .eq('id', existing.id);
      } else {
        // Insert new rule
        result = await supabase
          .from('business_pricing_rules')
          .insert([pricingRule]);
      }

      if (result.error) {
        throw result.error;
      }

      // Update local state
      setExistingPricingRules(prev => ({
        ...prev,
        [currentCategory]: pricingRule
      }));

      // Check if all categories are complete
      const completedCategories = Object.keys(existingPricingRules).length + 1;
      const allCategories = businessCategories.length;

      if (completedCategories >= allCategories) {
        // All categories complete, redirect to Bidi AI trainer
        navigate('/autobid-trainer');
      } else {
        // Move to next incomplete category
        const nextCategory = businessCategories.find(cat => !existingPricingRules[cat]);
        if (nextCategory) {
          handleCategoryChange(nextCategory);
        }
      }

    } catch (error) {
      console.error('Error saving pricing rules:', error);
      alert('Error saving pricing rules. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderBasicPricingStep = () => {
    const categoryConfig = getCategoryConfig(currentCategory);
    const categoryFields = categoryConfig.fields;
    

    
    return (
      <div className="pricing-step">
        <div className="step-header">
          <div className="step-icon">{categoryConfig.icon}</div>
          <div>
            <h3>{categoryConfig.name} Pricing Structure</h3>
            <p>Set up your fundamental pricing model and rates for {categoryConfig.name.toLowerCase()} services</p>
          </div>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Pricing Model</label>
            <select
              value={pricingData.pricing_model}
              onChange={(e) => handleInputChange('pricing_model', e.target.value)}
            >
              {categoryConfig.pricingModels.map(model => (
                <option key={model} value={model}>
                  {model === 'fixed' ? 'Fixed Price' : 
                   model === 'hourly' ? 'Hourly Rate' : 
                   model === 'per_person' ? 'Per Person' : 
                   model === 'package' ? 'Package Based' : 'Custom'}
                </option>
              ))}
            </select>
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

          {/* Category-specific basic fields */}
          {Object.entries(categoryFields)
            .filter(([fieldKey, fieldConfig]) => 
              typeof fieldConfig === 'object' && 
              fieldConfig.type === 'number' && 
              !['seasonal_pricing', 'flower_tiers', 'equipment_packages', 'menu_tiers', 'service_staff', 'travel_zones'].includes(fieldKey)
            )
            .filter(([fieldKey, fieldConfig]) => {
              // Check if this field should be shown for the current pricing model
              const shouldShow = !fieldConfig.showFor || fieldConfig.showFor.includes(pricingData.pricing_model);
              return shouldShow;
            })
            .sort(([aKey, aConfig], [bKey, bConfig]) => {
              // Sort base_price first, then hourly_rate, then others
              if (aKey === 'base_price') return -1;
              if (bKey === 'base_price') return 1;
              if (aKey === 'hourly_rate') return -1;
              if (bKey === 'hourly_rate') return 1;
              return 0;
            })
            .map(([fieldKey, fieldConfig]) => (
              <div key={fieldKey} className="form-group">
                <label>{fieldConfig.label}</label>
                <input
                  type={fieldConfig.type}
                  value={pricingData[fieldKey] || ''}
                  onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                  placeholder={fieldConfig.placeholder}
                  min={fieldConfig.min}
                  max={fieldConfig.max}
                  step={fieldConfig.step}
                />
                {fieldConfig.description && (
                  <small>{fieldConfig.description}</small>
                )}
              </div>
            ))}

          <div className="form-group">
            <label>Travel Fee per Mile ($)</label>
            <input
              type="number"
              value={pricingData.travel_fee_per_mile}
              onChange={(e) => handleInputChange('travel_fee_per_mile', e.target.value)}
              placeholder="e.g., 2.50"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Package Builder */}
        <div className="package-builder">
          <div className="section-header">
            <h4>Pricing Packages</h4>
            <p>Create custom packages for your {categoryConfig.name.toLowerCase()} services</p>
          </div>
          
          {existingPackages.length > 0 && (
            <div className="packages-grid">
              <div className="packages-header">
                <h5>Your Existing Packages</h5>
                <p>These packages are already displayed on your portfolio</p>
              </div>
              {existingPackages.map((pkg) => (
                <div key={pkg.id} className="package-card">
                  {pkg.image_url && (
                    <div className="package-image">
                      <img src={pkg.image_url} alt={pkg.name} />
                    </div>
                  )}
                  <div className="package-header">
                    <h5>{pkg.name}</h5>
                    <span className="package-price">${pkg.price}</span>
                  </div>
                  {pkg.description && (
                    <div 
                      className="package-description"
                      dangerouslySetInnerHTML={{ __html: pkg.description }}
                    />
                  )}
                  {pkg.features && pkg.features.length > 0 && (
                    <ul className="package-features">
                      {pkg.features.map((feature, index) => (
                        <li key={index}>✓ {feature}</li>
                      ))}
                    </ul>
                  )}
                  <button 
                    className="remove-package-btn"
                    onClick={() => handleRemovePackage(pkg.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {!showPackageForm ? (
            <button 
              className="add-package-btn"
              onClick={() => setShowPackageForm(true)}
            >
              <span>+</span>
              <span>Add New Package</span>
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
                    placeholder="e.g., Basic Package"
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
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={newPackage.description}
                    onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the package"
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
              </div>

              <div className="form-group">
                <label>Features</label>
                <div className="features-container">
                  {newPackage.features.map((feature, index) => (
                    <div key={index} className="feature-input">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        placeholder={`Feature ${index + 1}`}
                      />
                      <button 
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="remove-feature-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={handleAddFeature}
                    className="add-feature-btn"
                  >
                    + Add Feature
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button"
                  onClick={handleAddPackage}
                  className="save-package-btn"
                >
                  Save Package
                </button>
                <button 
                  type="button"
                  onClick={() => setShowPackageForm(false)}
                  className="cancel-package-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCategorySpecificStep = () => {
    const categoryConfig = getCategoryConfig(currentCategory);
    const categoryFields = categoryConfig.fields;
    
    return (
      <div className="pricing-step">
        <div className="step-header">
          <div className="step-icon">{categoryConfig.icon}</div>
          <div>
            <h3>{categoryConfig.name} Specific Pricing</h3>
            <p>Set pricing rules specific to {categoryConfig.name.toLowerCase()} services</p>
          </div>
        </div>
        
        <div className="form-grid">
          {/* Seasonal Pricing (Florist) */}
          {categoryFields.seasonal_pricing && (
            <div className="form-group">
              <label>Seasonal Pricing Multipliers</label>
              <div className="seasonal-pricing-grid">
                {Object.entries(categoryFields.seasonal_pricing).map(([season, config]) => (
                  <div key={season} className="seasonal-item">
                    <label>{config.label}</label>
                    <input
                      type="number"
                      value={pricingData.seasonal_pricing?.[season] || config.default}
                      onChange={(e) => handleInputChange('seasonal_pricing', {
                        ...pricingData.seasonal_pricing,
                        [season]: parseFloat(e.target.value)
                      })}
                      placeholder={config.default.toString()}
                      min="0.5"
                      max="3"
                      step="0.1"
                    />
                    <small>{config.description}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flower Tiers (Florist) */}
          {categoryFields.flower_tiers && (
            <div className="form-group">
              <label>Flower Tier Multipliers</label>
              <div className="flower-tiers-grid">
                {Object.entries(categoryFields.flower_tiers).map(([tier, config]) => (
                  <div key={tier} className="flower-tier-item">
                    <label>{config.label}</label>
                    <input
                      type="number"
                      value={pricingData.flower_tiers?.[tier] || config.multiplier}
                      onChange={(e) => handleInputChange('flower_tiers', {
                        ...pricingData.flower_tiers,
                        [tier]: parseFloat(e.target.value)
                      })}
                      placeholder={config.multiplier.toString()}
                      min="0.5"
                      max="3"
                      step="0.1"
                    />
                    <small>{config.description}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipment Packages (DJ) */}
          {categoryFields.equipment_packages && (
            <div className="form-group">
              <label>Equipment Package Pricing</label>
              <div className="equipment-packages-grid">
                {Object.entries(categoryFields.equipment_packages).map(([pkg, config]) => (
                  <div key={pkg} className="equipment-package-item">
                    <label>{config.label}</label>
                    <input
                      type="number"
                      value={pricingData.equipment_packages?.[pkg]?.price || config.price}
                      onChange={(e) => handleInputChange('equipment_packages', {
                        ...pricingData.equipment_packages,
                        [pkg]: {
                          ...config,
                          price: parseFloat(e.target.value)
                        }
                      })}
                      placeholder={config.price.toString()}
                      min="0"
                      step="0.01"
                    />
                    <small>{config.description}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Menu Tiers (Catering) */}
          {categoryFields.menu_tiers && (
            <div className="form-group">
              <label>Menu Service Multipliers</label>
              <div className="menu-tiers-grid">
                {Object.entries(categoryFields.menu_tiers).map(([tier, config]) => (
                  <div key={tier} className="menu-tier-item">
                    <label>{config.label}</label>
                    <input
                      type="number"
                      value={pricingData.menu_tiers?.[tier] || config.multiplier}
                      onChange={(e) => handleInputChange('menu_tiers', {
                        ...pricingData.menu_tiers,
                        [tier]: parseFloat(e.target.value)
                      })}
                      placeholder={config.multiplier.toString()}
                      min="0.5"
                      max="3"
                      step="0.1"
                    />
                    <small>{config.description}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Staff (Catering) */}
          {categoryFields.service_staff && (
            <div className="form-group">
              <label>Service Staff Configuration</label>
              <div className="service-staff-grid">
                <div className="form-group">
                  <label>{categoryFields.service_staff.ratio.label}</label>
                  <input
                    type="number"
                    value={pricingData.service_staff?.ratio || categoryFields.service_staff.ratio.default}
                    onChange={(e) => handleInputChange('service_staff', {
                      ...pricingData.service_staff,
                      ratio: parseInt(e.target.value)
                    })}
                    placeholder={categoryFields.service_staff.ratio.default.toString()}
                    min={categoryFields.service_staff.ratio.min}
                    max={categoryFields.service_staff.ratio.max}
                  />
                  <small>{categoryFields.service_staff.ratio.description}</small>
                </div>
                <div className="form-group">
                  <label>{categoryFields.service_staff.rate_per_server.label}</label>
                  <input
                    type="number"
                    value={pricingData.service_staff?.rate_per_server || categoryFields.service_staff.rate_per_server.default}
                    onChange={(e) => handleInputChange('service_staff', {
                      ...pricingData.service_staff,
                      rate_per_server: parseFloat(e.target.value)
                    })}
                    placeholder={categoryFields.service_staff.rate_per_server.default.toString()}
                    min="0"
                    step="0.01"
                  />
                  <small>{categoryFields.service_staff.rate_per_server.description}</small>
                </div>
              </div>
            </div>
          )}

          {/* Universal fields */}
          <div className="form-group">
            <label>Rush Fee (%)</label>
            <input
              type="number"
              value={pricingData.rush_fee_percentage}
              onChange={(e) => handleInputChange('rush_fee_percentage', e.target.value)}
              placeholder="e.g., 15"
              min="0"
              max="100"
            />
            <small>Additional fee for last-minute bookings</small>
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

          {/* Guest-dependent fields (only show for relevant categories) */}
          {(currentCategory === 'florist' || currentCategory === 'catering') && (
            <>
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


            </>
          )}
        </div>
      </div>
    );
  };

  const renderAutobidStep = () => {
    const categoryConfig = getCategoryConfig(currentCategory);
    const autobidConfig = categoryConfig.autobidConfig;
    
    if (!autobidConfig) {
      return (
        <div className="pricing-step">
          <div className="step-header">
            <div className="step-icon">🤖</div>
            <div>
              <h3>Autobid Setup</h3>
              <p>Configure how Bidi AI should generate bids for you</p>
            </div>
          </div>
          <p>Autobid configuration not available for this category yet.</p>
        </div>
      );
    }

    return (
      <div className="pricing-step">
        <div className="step-header">
          <div className="step-icon">🤖</div>
          <div>
            <h3>Autobid Setup</h3>
            <p>Configure how Bidi AI should generate bids for you</p>
          </div>
        </div>
        
        {/* Base Category Rates */}
        <div className="form-group">
          <label>Base Category Rates</label>
          <div className="rates-grid">
            {Object.entries(autobidConfig.baseCategoryRates).map(([key, config]) => (
              <div key={key} className="rate-item">
                <label>{config.label}</label>
                <input
                  type="number"
                  value={pricingData.base_category_rates[key] || config.default}
                  onChange={(e) => handleInputChange('base_category_rates', {
                    ...pricingData.base_category_rates,
                    [key]: parseFloat(e.target.value)
                  })}
                  placeholder={config.default.toString()}
                  min="0"
                  step="0.01"
                />
                {config.description && <small>{config.description}</small>}
                
                {/* Show hourly rate field if config has hourlyRate */}
                {config.hourlyRate && (
                  <div className="hourly-rate-field">
                    <label>{config.label.replace('Base Price', 'Hourly Rate')}</label>
                    <input
                      type="number"
                      value={pricingData.base_category_rates[`${key}_hourly`] || config.hourlyRate}
                      onChange={(e) => handleInputChange('base_category_rates', {
                        ...pricingData.base_category_rates,
                        [`${key}_hourly`]: parseFloat(e.target.value)
                      })}
                      placeholder={config.hourlyRate.toString()}
                      min="0"
                      step="0.01"
                    />
                    <small>Hourly rate for this service type</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Seasonal Pricing */}
        {autobidConfig.seasonalPricing && (
          <div className="form-group">
            <label>Seasonal Pricing Multipliers</label>
            <div className="seasonal-grid">
              {Object.entries(autobidConfig.seasonalPricing).map(([season, config]) => (
                <div key={season} className="seasonal-item">
                  <label>{config.label}</label>
                  <input
                    type="number"
                    value={pricingData.seasonal_pricing[season] || config.default}
                    onChange={(e) => handleInputChange('seasonal_pricing', {
                      ...pricingData.seasonal_pricing,
                      [season]: parseFloat(e.target.value)
                    })}
                    placeholder={config.default.toString()}
                    min="0.5"
                    max="3"
                    step="0.1"
                  />
                  <small>Applied to {config.months.map(m => new Date(2024, m-1).toLocaleString('default', { month: 'long' })).join(', ')}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Travel Configuration */}
        {autobidConfig.travelConfig && (
          <div className="form-group">
            <label>Travel Configuration</label>
            <div className="travel-grid">
              {Object.entries(autobidConfig.travelConfig).map(([key, config]) => (
                <div key={key} className="travel-item">
                  {typeof config === 'object' ? (
                    <>
                      <label>{config.label}</label>
                      <input
                        type="number"
                        value={pricingData.travel_config[key] || config.default}
                        onChange={(e) => handleInputChange('travel_config', {
                          ...pricingData.travel_config,
                          [key]: parseFloat(e.target.value)
                        })}
                        placeholder={config.default.toString()}
                        min="0"
                        step="0.01"
                      />
                    </>
                  ) : (
                    <div className="travel-warning">
                      <span>⚠️ {config}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Platform Markup */}
        <div className="form-group">
          <label>{autobidConfig.platformMarkup.label}</label>
          <input
            type="number"
            value={pricingData.platform_markup}
            onChange={(e) => handleInputChange('platform_markup', e.target.value)}
            placeholder={autobidConfig.platformMarkup.default.toString()}
            min="0"
            max="50"
            step="0.1"
          />
          <small>Percentage added to cover Bidi platform fees</small>
        </div>

        {/* Consultation Required */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={pricingData.consultation_required}
              onChange={(e) => handleInputChange('consultation_required', e.target.checked)}
            />
            <span>Require consultation call before final quote</span>
          </label>
          <small>When checked, bids will include a note about scheduling a consultation</small>
        </div>

        {/* Dealbreakers */}
        <div className="form-group">
          <label>Dealbreakers</label>
          <div className="dealbreakers-list">
            {autobidConfig.dealbreakers.map((dealbreaker, index) => (
              <div key={index} className="dealbreaker-item">
                <span>❌ {dealbreaker}</span>
              </div>
            ))}
          </div>
          <small>These are automatically applied to your profile</small>
        </div>

        {/* Style Preferences (for DJs) */}
        {autobidConfig.stylePreferences && (
          <div className="form-group">
            <label>Style Preferences</label>
            <div className="style-preferences">
              {autobidConfig.stylePreferences.map((style, index) => (
                <span key={index} className="style-tag">{style}</span>
              ))}
            </div>
            <small>These help match you with appropriate requests</small>
          </div>
        )}
      </div>
    );
  };

  const renderCommunicationStep = () => (
    <div className="pricing-step">
      <div className="step-header">
        <div className="step-icon">💬</div>
        <div>
          <h3>Communication & Preferences</h3>
          <p>Set your default message and communication preferences</p>
        </div>
      </div>
      
      <div className="form-group">
        <label>Default Message Template</label>
        <textarea
          value={pricingData.default_message}
          onChange={(e) => handleInputChange('default_message', e.target.value)}
          placeholder="Enter your default message that will be included with bids..."
          rows="6"
        />
        <small>Use {'${amount}'} to include the bid amount in your message</small>
      </div>

      <div className="form-group">
        <label>Additional Comments</label>
        <textarea
          value={pricingData.additional_comments}
          onChange={(e) => handleInputChange('additional_comments', e.target.value)}
          placeholder="Any additional pricing notes or special considerations..."
          rows="4"
        />
      </div>

      <div className="form-group">
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
      { component: renderAutobidStep, title: 'Autobid Setup' },
      { component: renderCommunicationStep, title: 'Communication' }
    ];

    return steps[currentStep]?.component() || null;
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
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

  // Calculate progress
  const completedCategories = Object.keys(existingPricingRules).length;
  const totalCategories = businessCategories.length;
  const overallProgress = (completedCategories / totalCategories) * 100;

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
      {/* Header */}
      <div className="pricing-setup-header">
        <div className="header-content">
          <button 
            className="back-button"
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h1>Bidi AI Pricing Setup</h1>
          <p>Configure your pricing rules to train Bidi AI to generate accurate bids</p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="overall-progress">
        <div className="progress-info">
          <h3>Overall Progress</h3>
          <span className="progress-count">{completedCategories} of {totalCategories} categories complete</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="category-navigation">
        {businessCategories.map((category, index) => (
          <button
            key={category}
            className={`category-card ${category === currentCategory ? 'active' : ''} ${existingPricingRules[category] ? 'completed' : ''}`}
            onClick={() => handleCategoryChange(category)}
          >
            <div className="category-icon">
              {existingPricingRules[category] ? (
                <span className="check-icon">✓</span>
              ) : (
                <span className="category-number">{index + 1}</span>
              )}
            </div>
            <span className="category-name">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
          </button>
        ))}
      </div>

      {/* Current Category Content */}
      <div className="category-content">
        <div className="category-header">
          <div className="category-info">
            <h2>Setting up pricing for: <span className="category-highlight">{currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}</span></h2>
            {existingPricingRules[currentCategory] && (
              <div className="category-status">
                <span className="status-icon">✓</span>
                <span>Pricing rules saved</span>
              </div>
            )}
          </div>
        </div>



        {/* Step Content */}
        <div className="step-content">
          {renderSteps()}
        </div>

        {/* Step Actions */}
        <div className="step-actions">
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
            {isSaving ? 'Saving...' : currentStep === 3 ? 'Save & Continue' : 'Next'}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="pricing-info">
        <div className="info-content">
          <h4>Why is this important?</h4>
          <p>
            Bidi AI needs to understand your exact pricing structure to generate accurate bids. 
            This includes your base rates, multipliers, and special considerations. 
            The more detailed your pricing rules, the more accurate the Bidi AI-generated bids will be.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingSetup; 