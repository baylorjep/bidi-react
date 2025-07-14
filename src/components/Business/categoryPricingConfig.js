// Category-specific pricing configuration
export const categoryPricingConfig = {
  photography: {
    name: "Photography",
    icon: "📸",
    description: "Professional photography services",
    pricingModels: ["package", "hourly", "fixed"],
    defaultModel: "package",
    fields: {
      // Fields for hourly model
      hourly_rate: {
        label: "Hourly Rate ($)",
        type: "number",
        placeholder: "e.g., 150",
        min: 0,
        step: 0.01,
        description: "Your standard hourly rate for photography services",
        required: false,
        showFor: ["hourly"]
      },
      overtime_rate: {
        label: "Overtime Rate ($)",
        type: "number",
        placeholder: "e.g., 200",
        min: 0,
        step: 0.01,
        description: "Rate per hour after standard booking time",
        required: false,
        showFor: ["hourly"]
      },
      
      // Fields for fixed model
      base_price: {
        label: "Base Price ($)",
        type: "number",
        placeholder: "e.g., 800",
        min: 0,
        step: 0.01,
        description: "Your standard base price for photography services",
        required: false,
        showFor: ["fixed"]
      },
      
      // Fields for package model
      full_day_rate: {
        label: "Full Day Rate ($)",
        type: "number",
        placeholder: "e.g., 1200",
        min: 0,
        step: 0.01,
        description: "Rate for full day coverage (typically 8-10 hours)",
        required: false,
        showFor: ["package"]
      },
      half_day_rate: {
        label: "Half Day Rate ($)",
        type: "number",
        placeholder: "e.g., 600",
        min: 0,
        step: 0.01,
        description: "Rate for half day coverage (typically 4-5 hours)",
        required: false,
        showFor: ["package"]
      },
      
      // Common fields for all models
      photo_editing_rate: {
        label: "Photo Editing Rate ($)",
        type: "number",
        placeholder: "e.g., 25",
        min: 0,
        step: 0.01,
        description: "Cost per additional edited photo",
        required: false,
        showFor: ["package", "hourly", "fixed"]
      },
      rush_editing_fee: {
        label: "Rush Editing Fee ($)",
        type: "number",
        placeholder: "e.g., 100",
        min: 0,
        step: 0.01,
        description: "Additional fee for expedited photo delivery",
        required: false,
        showFor: ["package", "hourly", "fixed"]
      },
      // Package templates
      packageTemplates: [
        {
          name: "Engagement Session",
          defaultPrice: 300,
          defaultDuration: "2 hours",
          defaultFeatures: ["50 edited photos", "Online gallery", "Print release"],
          description: "Perfect for engagement announcements and save-the-dates"
        },
        {
          name: "Wedding Coverage",
          defaultPrice: 2500,
          defaultDuration: "8 hours",
          defaultFeatures: ["400+ edited photos", "Online gallery", "Print release", "Wedding album"],
          description: "Complete wedding day coverage"
        },
        {
          name: "Portrait Session",
          defaultPrice: 200,
          defaultDuration: "1 hour",
          defaultFeatures: ["25 edited photos", "Online gallery", "Print release"],
          description: "Professional portraits for individuals or families"
        }
      ],
      // Add-ons
      addons: [
        { name: "Additional Hour", type: "hourly", defaultPrice: 75 },
        { name: "Extra Edited Photos", type: "per_photo", defaultPrice: 5 },
        { name: "Wedding Album", type: "fixed", defaultPrice: 300 },
        { name: "Second Photographer", type: "fixed", defaultPrice: 500 },
        { name: "Drone Coverage", type: "fixed", defaultPrice: 200 }
      ]
    }
  },

  florist: {
    name: "Florist",
    icon: "🌸",
    description: "Wedding and event floral design",
    pricingModels: ["per_person", "package", "fixed"],
    defaultModel: "per_person",
    fields: {
      // Fields for per_person model
      per_person_rate: {
        label: "Per Person Rate ($)",
        type: "number",
        placeholder: "e.g., 25",
        min: 0,
        step: 0.01,
        description: "Cost per guest for floral arrangements",
        required: false,
        showFor: ["per_person"]
      },
      
      // Fields for fixed model
      base_price: {
        label: "Base Price ($)",
        type: "number",
        placeholder: "e.g., 500",
        min: 0,
        step: 0.01,
        description: "Your standard base price for floral services",
        required: false,
        showFor: ["fixed"]
      },
      
      // Fields for package model
      bridal_package_price: {
        label: "Bridal Package Price ($)",
        type: "number",
        placeholder: "e.g., 200",
        min: 0,
        step: 0.01,
        description: "Price for bridal bouquet and bridesmaid bouquets",
        required: false,
        showFor: ["package"]
      },
      ceremony_package_price: {
        label: "Ceremony Package Price ($)",
        type: "number",
        placeholder: "e.g., 300",
        min: 0,
        step: 0.01,
        description: "Price for ceremony arch and aisle decorations",
        required: false,
        showFor: ["package"]
      },
      
      // Common fields for all models
      setup_fee: {
        label: "Setup Fee ($)",
        type: "number",
        placeholder: "e.g., 150",
        min: 0,
        step: 0.01,
        description: "Fee for setting up floral arrangements on-site",
        required: false,
        showFor: ["per_person", "package", "fixed"]
      },
      delivery_fee: {
        label: "Delivery Fee ($)",
        type: "number",
        placeholder: "e.g., 75",
        min: 0,
        step: 0.01,
        description: "Fee for delivering flowers to venue",
        required: false,
        showFor: ["per_person", "package", "fixed"]
      },
      // Package templates
      packageTemplates: [
        {
          name: "Bridal Package",
          defaultPrice: 200,
          defaultFeatures: ["Bridal bouquet", "Bridesmaid bouquets", "Boutonnieres"],
          description: "Essential bridal party flowers"
        },
        {
          name: "Ceremony Package",
          defaultPrice: 300,
          defaultFeatures: ["Ceremony arch", "Aisle decorations", "Altar arrangements"],
          description: "Complete ceremony floral design"
        },
        {
          name: "Reception Package",
          defaultPrice: 400,
          defaultFeatures: ["Centerpieces", "Head table", "Cake flowers"],
          description: "Full reception floral design"
        }
      ],
      // Add-ons
      addons: [
        { name: "Additional Centerpieces", type: "per_piece", defaultPrice: 35 },
        { name: "Cake Flowers", type: "fixed", defaultPrice: 50 },
        { name: "Petals for Aisle", type: "per_bag", defaultPrice: 25 },
        { name: "Preserved Flowers", type: "multiplier", defaultPrice: 1.5 }
      ]
    }
  },

  dj: {
    name: "DJ",
    icon: "🎵",
    description: "Wedding and event entertainment",
    pricingModels: ["hourly", "package", "fixed"],
    defaultModel: "hourly",
    fields: {
      // Fields for hourly model
      hourly_rate: {
        label: "Hourly Rate ($)",
        type: "number",
        placeholder: "e.g., 125",
        min: 0,
        step: 0.01,
        description: "Your standard hourly rate for DJ services",
        required: false,
        showFor: ["hourly"]
      },
      overtime_rate: {
        label: "Overtime Rate ($)",
        type: "number",
        placeholder: "e.g., 150",
        min: 0,
        step: 0.01,
        description: "Rate per hour after standard booking time",
        required: false,
        showFor: ["hourly"]
      },
      
      // Fields for fixed model
      base_price: {
        label: "Base Price ($)",
        type: "number",
        placeholder: "e.g., 800",
        min: 0,
        step: 0.01,
        description: "Your standard base price for DJ services",
        required: false,
        showFor: ["fixed"]
      },
      
      // Fields for package model
      ceremony_only_price: {
        label: "Ceremony Only Price ($)",
        type: "number",
        placeholder: "e.g., 300",
        min: 0,
        step: 0.01,
        description: "Price for ceremony music only",
        required: false,
        showFor: ["package"]
      },
      reception_only_price: {
        label: "Reception Only Price ($)",
        type: "number",
        placeholder: "e.g., 800",
        min: 0,
        step: 0.01,
        description: "Price for reception entertainment only",
        required: false,
        showFor: ["package"]
      },
      full_day_price: {
        label: "Full Day Price ($)",
        type: "number",
        placeholder: "e.g., 1000",
        min: 0,
        step: 0.01,
        description: "Price for complete wedding day entertainment",
        required: false,
        showFor: ["package"]
      },
      // Equipment packages
      equipment_packages: {
        basic: {
          label: "Basic Package",
          price: 0,
          includes: ["Speakers", "Microphone", "Basic lighting"],
          description: "Essential equipment for small events"
        },
        premium: {
          label: "Premium Package",
          price: 200,
          includes: ["Professional speakers", "Wireless microphones", "LED lighting", "Fog machine"],
          description: "Enhanced equipment for larger events"
        },
        luxury: {
          label: "Luxury Package",
          price: 400,
          includes: ["Premium speakers", "Multiple microphones", "Full lighting show", "Video screens"],
          description: "Complete entertainment setup"
        }
      },
      // Travel zones
      travel_zones: [
        { miles: 25, fee: 0, label: "Local (0-25 miles)" },
        { miles: 50, fee: 50, label: "Regional (26-50 miles)" },
        { miles: 100, fee: 150, label: "Extended (51-100 miles)" }
      ],
      // Package templates
      packageTemplates: [
        {
          name: "Ceremony Only",
          defaultPrice: 300,
          defaultDuration: "2 hours",
          defaultFeatures: ["Ceremony music", "Microphone for officiant", "Basic setup"],
          description: "Music for ceremony only"
        },
        {
          name: "Reception Only",
          defaultPrice: 800,
          defaultDuration: "4 hours",
          defaultFeatures: ["Reception music", "MC services", "Lighting", "Equipment"],
          description: "Full reception entertainment"
        },
        {
          name: "Full Day",
          defaultPrice: 1000,
          defaultDuration: "6 hours",
          defaultFeatures: ["Ceremony & reception", "MC services", "Premium equipment", "Setup/teardown"],
          description: "Complete wedding day entertainment"
        }
      ],
      // Add-ons
      addons: [
        { name: "Additional Hour", type: "hourly", defaultPrice: 125 },
        { name: "Photo Booth", type: "fixed", defaultPrice: 300 },
        { name: "Uplighting", type: "fixed", defaultPrice: 200 },
        { name: "Ceremony Sound", type: "fixed", defaultPrice: 150 }
      ]
    }
  },

  catering: {
    name: "Catering",
    icon: "🍽️",
    description: "Wedding and event catering services",
    pricingModels: ["per_person", "package", "fixed"],
    defaultModel: "per_person",
    fields: {
      // Fields for per_person model
      per_person_rate: {
        label: "Per Person Rate ($)",
        type: "number",
        placeholder: "e.g., 35",
        min: 0,
        step: 0.01,
        description: "Cost per guest for catering services",
        required: false,
        showFor: ["per_person"]
      },
      
      // Fields for fixed model
      base_price: {
        label: "Base Price ($)",
        type: "number",
        placeholder: "e.g., 2000",
        min: 0,
        step: 0.01,
        description: "Your standard base price for catering services",
        required: false,
        showFor: ["fixed"]
      },
      
      // Fields for package model
      appetizers_only_price: {
        label: "Appetizers Only Price ($)",
        type: "number",
        placeholder: "e.g., 15",
        min: 0,
        step: 0.01,
        description: "Price per person for appetizers only",
        required: false,
        showFor: ["package"]
      },
      full_service_price: {
        label: "Full Service Price ($)",
        type: "number",
        placeholder: "e.g., 45",
        min: 0,
        step: 0.01,
        description: "Price per person for full catering service",
        required: false,
        showFor: ["package"]
      },
      premium_service_price: {
        label: "Premium Service Price ($)",
        type: "number",
        placeholder: "e.g., 65",
        min: 0,
        step: 0.01,
        description: "Price per person for premium catering service",
        required: false,
        showFor: ["package"]
      },
      
      // Common fields for all models
      kitchen_rental: {
        label: "Kitchen Rental Fee ($)",
        type: "number",
        placeholder: "e.g., 500",
        min: 0,
        step: 0.01,
        description: "Fee for kitchen facility rental",
        required: false,
        showFor: ["per_person", "package", "fixed"]
      },
      china_rental: {
        label: "China Rental per Person ($)",
        type: "number",
        placeholder: "e.g., 8",
        min: 0,
        step: 0.01,
        description: "Cost per person for china/glassware rental",
        required: false,
        showFor: ["per_person", "package", "fixed"]
      },
      // Package templates
      packageTemplates: [
        {
          name: "Appetizers Only",
          defaultPrice: 15,
          defaultFeatures: ["3 passed appetizers", "Display setup", "Service staff"],
          description: "Light appetizer service"
        },
        {
          name: "Full Service",
          defaultPrice: 45,
          defaultFeatures: ["Appetizers", "Main course", "Dessert", "Full service staff"],
          description: "Complete catering service"
        },
        {
          name: "Premium Service",
          defaultPrice: 65,
          defaultFeatures: ["Premium appetizers", "Multiple courses", "Premium desserts", "Premium service"],
          description: "Luxury catering experience"
        }
      ],
      // Add-ons
      addons: [
        { name: "Additional Appetizer", type: "per_person", defaultPrice: 3 },
        { name: "Premium Wine Service", type: "per_person", defaultPrice: 15 },
        { name: "Late Night Snacks", type: "per_person", defaultPrice: 8 },
        { name: "Cake Cutting", type: "fixed", defaultPrice: 50 }
      ]
    }
  },

  videography: {
    name: "Videography",
    icon: "🎬",
    description: "Professional video services",
    pricingModels: ["package", "hourly", "fixed"],
    defaultModel: "package",
    fields: {
      // Fields for hourly model
      hourly_rate: {
        label: "Hourly Rate ($)",
        type: "number",
        placeholder: "e.g., 200",
        min: 0,
        step: 0.01,
        description: "Your standard hourly rate for videography",
        required: false,
        showFor: ["hourly"]
      },
      
      // Fields for fixed model
      base_price: {
        label: "Base Price ($)",
        type: "number",
        placeholder: "e.g., 1200",
        min: 0,
        step: 0.01,
        description: "Your standard base price for videography services",
        required: false,
        showFor: ["fixed"]
      },
      
      // Fields for package model
      highlight_video_price: {
        label: "Highlight Video Price ($)",
        type: "number",
        placeholder: "e.g., 800",
        min: 0,
        step: 0.01,
        description: "Price for short highlight video",
        required: false,
        showFor: ["package"]
      },
      full_documentary_price: {
        label: "Full Documentary Price ($)",
        type: "number",
        placeholder: "e.g., 2000",
        min: 0,
        step: 0.01,
        description: "Price for complete wedding documentary",
        required: false,
        showFor: ["package"]
      },
      cinematic_package_price: {
        label: "Cinematic Package Price ($)",
        type: "number",
        placeholder: "e.g., 3500",
        min: 0,
        step: 0.01,
        description: "Price for premium cinematic experience",
        required: false,
        showFor: ["package"]
      },
      
      // Common fields for all models
      editing_rate: {
        label: "Editing Rate per Hour ($)",
        type: "number",
        placeholder: "e.g., 75",
        min: 0,
        step: 0.01,
        description: "Rate for video editing time",
        required: false,
        showFor: ["package", "hourly", "fixed"]
      },
      rush_editing_fee: {
        label: "Rush Editing Fee ($)",
        type: "number",
        placeholder: "e.g., 200",
        min: 0,
        step: 0.01,
        description: "Additional fee for expedited video delivery",
        required: false,
        showFor: ["package", "hourly", "fixed"]
      },
      // Package templates
      packageTemplates: [
        {
          name: "Highlight Video",
          defaultPrice: 800,
          defaultDuration: "4 hours",
          defaultFeatures: ["4 hours coverage", "3-5 minute highlight video", "Online delivery"],
          description: "Short highlight video of the day"
        },
        {
          name: "Full Documentary",
          defaultPrice: 2000,
          defaultDuration: "8 hours",
          defaultFeatures: ["Full day coverage", "10-15 minute documentary", "Ceremony & reception", "Online delivery"],
          description: "Complete wedding documentary"
        },
        {
          name: "Cinematic Package",
          defaultPrice: 3500,
          defaultDuration: "10 hours",
          defaultFeatures: ["Full day coverage", "Cinematic highlight", "Full documentary", "Drone footage", "Multiple cameras"],
          description: "Premium cinematic experience"
        }
      ],
      // Add-ons
      addons: [
        { name: "Additional Hour", type: "hourly", defaultPrice: 200 },
        { name: "Drone Footage", type: "fixed", defaultPrice: 300 },
        { name: "Second Camera", type: "fixed", defaultPrice: 400 },
        { name: "Same Day Edit", type: "fixed", defaultPrice: 500 },
        { name: "Extended Highlight", type: "fixed", defaultPrice: 200 }
      ]
    }
  },

  beauty: {
    name: "Beauty",
    icon: "💄",
    description: "Hair and makeup services",
    pricingModels: ["per_person", "package", "fixed"],
    defaultModel: "per_person",
    fields: {
      // Fields for per_person model
      per_person_rate: {
        label: "Per Person Rate ($)",
        type: "number",
        placeholder: "e.g., 150",
        min: 0,
        step: 0.01,
        description: "Cost per person for hair and makeup",
        required: false,
        showFor: ["per_person"]
      },
      
      // Fields for fixed model
      base_price: {
        label: "Base Price ($)",
        type: "number",
        placeholder: "e.g., 500",
        min: 0,
        step: 0.01,
        description: "Your standard base price for beauty services",
        required: false,
        showFor: ["fixed"]
      },
      
      // Fields for package model
      bridal_package_price: {
        label: "Bridal Package Price ($)",
        type: "number",
        placeholder: "e.g., 200",
        min: 0,
        step: 0.01,
        description: "Price for complete bridal beauty service",
        required: false,
        showFor: ["package"]
      },
      bridesmaid_package_price: {
        label: "Bridesmaid Package Price ($)",
        type: "number",
        placeholder: "e.g., 150",
        min: 0,
        step: 0.01,
        description: "Price for bridesmaid beauty services",
        required: false,
        showFor: ["package"]
      },
      
      // Common fields for all models
      hair_only_rate: {
        label: "Hair Only Rate ($)",
        type: "number",
        placeholder: "e.g., 100",
        min: 0,
        step: 0.01,
        description: "Rate for hair styling only",
        required: false,
        showFor: ["per_person", "package", "fixed"]
      },
      makeup_only_rate: {
        label: "Makeup Only Rate ($)",
        type: "number",
        placeholder: "e.g., 100",
        min: 0,
        step: 0.01,
        description: "Rate for makeup only",
        required: false,
        showFor: ["per_person", "package", "fixed"]
      },
      travel_fee: {
        label: "Travel Fee ($)",
        type: "number",
        placeholder: "e.g., 50",
        min: 0,
        step: 0.01,
        description: "Fee for traveling to venue/home",
        required: false,
        showFor: ["per_person", "package", "fixed"]
      },
      // Package templates
      packageTemplates: [
        {
          name: "Bridal Package",
          defaultPrice: 200,
          defaultFeatures: ["Hair styling", "Makeup application", "Touch-up kit"],
          description: "Complete bridal beauty service"
        },
        {
          name: "Bridesmaid Package",
          defaultPrice: 150,
          defaultFeatures: ["Hair styling", "Makeup application"],
          description: "Bridesmaid beauty services"
        },
        {
          name: "Mother of Bride",
          defaultPrice: 175,
          defaultFeatures: ["Hair styling", "Makeup application", "Consultation"],
          description: "Special service for mothers"
        }
      ],
      // Add-ons
      addons: [
        { name: "Additional Person", type: "per_person", defaultPrice: 150 },
        { name: "False Lashes", type: "fixed", defaultPrice: 25 },
        { name: "Hair Extensions", type: "fixed", defaultPrice: 50 },
        { name: "Touch-up Service", type: "fixed", defaultPrice: 75 }
      ]
    }
  }
};

// Helper functions
export const getCategoryConfig = (category) => {
  return categoryPricingConfig[category] || categoryPricingConfig.photography;
};

export const getPackageTemplates = (category) => {
  const config = getCategoryConfig(category);
  return config.fields.packageTemplates || [];
};

export const getAddons = (category) => {
  const config = getCategoryConfig(category);
  return config.fields.addons || [];
}; 