// Category-specific pricing configuration
export const categoryPricingConfig = {
  photography: {
    name: "Photography",
    icon: "📸",
    description: "Professional photography services",
    pricingModels: ["package", "hourly", "fixed"],
    defaultModel: "package",
    fields: {
      // Basic pricing
      hourly_rate: {
        label: "Hourly Rate ($)",
        type: "number",
        placeholder: "e.g., 150",
        min: 0,
        step: 0.01,
        description: "Your standard hourly rate for photography services",
        required: false
      },
      full_day_rate: {
        label: "Full Day Rate ($)",
        type: "number",
        placeholder: "e.g., 1200",
        min: 0,
        step: 0.01,
        description: "Rate for full day coverage (typically 8-10 hours)",
        required: false
      },
      half_day_rate: {
        label: "Half Day Rate ($)",
        type: "number",
        placeholder: "e.g., 600",
        min: 0,
        step: 0.01,
        description: "Rate for half day coverage (typically 4-5 hours)",
        required: false
      },
      photo_editing_rate: {
        label: "Photo Editing Rate ($)",
        type: "number",
        placeholder: "e.g., 25",
        min: 0,
        step: 0.01,
        description: "Cost per additional edited photo",
        required: false
      },
      rush_editing_fee: {
        label: "Rush Editing Fee ($)",
        type: "number",
        placeholder: "e.g., 100",
        min: 0,
        step: 0.01,
        description: "Additional fee for expedited photo delivery",
        required: false
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
    },
    defaultPricing: {
      hourly_rate: 150,
      full_day_rate: 1200,
      half_day_rate: 600,
      photo_editing_rate: 25,
      rush_editing_fee: 100,
      wedding_premium: 0, // Photography doesn't typically have wedding premiums
      rush_fee_percentage: 25,
      deposit_percentage: 30
    }
  },

  florist: {
    name: "Florist",
    icon: "🌸",
    description: "Wedding and event floral design",
    pricingModels: ["per_person", "package", "fixed"],
    defaultModel: "per_person",
    fields: {
      // Basic pricing
      per_person_rate: {
        label: "Per Person Rate ($)",
        type: "number",
        placeholder: "e.g., 25",
        min: 0,
        step: 0.01,
        description: "Cost per guest for floral arrangements",
        required: true
      },
      // Seasonal pricing
      seasonal_pricing: {
        spring: { label: "Spring Multiplier", default: 1.2, description: "20% premium for spring weddings" },
        summer: { label: "Summer Multiplier", default: 1.0, description: "Standard pricing for summer" },
        fall: { label: "Fall Multiplier", default: 1.1, description: "10% premium for fall weddings" },
        winter: { label: "Winter Multiplier", default: 1.3, description: "30% premium for winter weddings" }
      },
      // Flower tiers
      flower_tiers: {
        standard: { label: "Standard Flowers", multiplier: 1.0, description: "Common flowers (roses, carnations)" },
        premium: { label: "Premium Flowers", multiplier: 1.4, description: "Premium flowers (peonies, garden roses)" },
        luxury: { label: "Luxury Flowers", multiplier: 2.0, description: "Luxury flowers (orchids, imported blooms)" }
      },
      // Service fees
      setup_fee: {
        label: "Setup Fee ($)",
        type: "number",
        placeholder: "e.g., 150",
        min: 0,
        step: 0.01,
        description: "Fee for setting up floral arrangements on-site",
        required: false
      },
      delivery_fee: {
        label: "Delivery Fee ($)",
        type: "number",
        placeholder: "e.g., 75",
        min: 0,
        step: 0.01,
        description: "Fee for delivering flowers to venue",
        required: false
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
    },
    defaultPricing: {
      per_person_rate: 25,
      setup_fee: 150,
      delivery_fee: 75,
      wedding_premium: 0, // Built into per-person rate
      rush_fee_percentage: 20,
      deposit_percentage: 50
    }
  },

  dj: {
    name: "DJ",
    icon: "🎵",
    description: "Wedding and event entertainment",
    pricingModels: ["hourly", "package", "fixed"],
    defaultModel: "hourly",
    fields: {
      // Basic pricing
      hourly_rate: {
        label: "Hourly Rate ($)",
        type: "number",
        placeholder: "e.g., 125",
        min: 0,
        step: 0.01,
        description: "Your standard hourly rate for DJ services",
        required: true
      },
      overtime_rate: {
        label: "Overtime Rate ($)",
        type: "number",
        placeholder: "e.g., 150",
        min: 0,
        step: 0.01,
        description: "Rate per hour after standard booking time",
        required: false
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
    },
    defaultPricing: {
      hourly_rate: 125,
      overtime_rate: 150,
      wedding_premium: 0, // Built into hourly rate
      rush_fee_percentage: 30,
      deposit_percentage: 25
    }
  },

  catering: {
    name: "Catering",
    icon: "🍽️",
    description: "Wedding and event catering services",
    pricingModels: ["per_person", "package", "fixed"],
    defaultModel: "per_person",
    fields: {
      // Basic pricing
      per_person_rate: {
        label: "Per Person Rate ($)",
        type: "number",
        placeholder: "e.g., 35",
        min: 0,
        step: 0.01,
        description: "Cost per guest for catering services",
        required: true
      },
      // Menu tiers
      menu_tiers: {
        buffet: {
          label: "Buffet Service",
          multiplier: 1.0,
          description: "Self-serve buffet style"
        },
        plated: {
          label: "Plated Service",
          multiplier: 1.3,
          description: "Served plated meals"
        },
        family_style: {
          label: "Family Style",
          multiplier: 1.1,
          description: "Large platters for sharing"
        }
      },
      // Service staff
      service_staff: {
        ratio: {
          label: "Staff to Guest Ratio",
          type: "number",
          placeholder: "e.g., 20",
          min: 10,
          max: 50,
          description: "Number of guests per server (typically 15-25)",
          default: 20
        },
        rate_per_server: {
          label: "Server Rate per Hour ($)",
          type: "number",
          placeholder: "e.g., 25",
          min: 0,
          step: 0.01,
          description: "Hourly rate for service staff",
          default: 25
        }
      },
      // Additional fees
      kitchen_rental: {
        label: "Kitchen Rental Fee ($)",
        type: "number",
        placeholder: "e.g., 500",
        min: 0,
        step: 0.01,
        description: "Fee for kitchen facility rental",
        required: false
      },
      china_rental: {
        label: "China Rental per Person ($)",
        type: "number",
        placeholder: "e.g., 8",
        min: 0,
        step: 0.01,
        description: "Cost per person for china/glassware rental",
        required: false
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
    },
    defaultPricing: {
      per_person_rate: 35,
      kitchen_rental: 500,
      china_rental: 8,
      wedding_premium: 0, // Built into per-person rate
      rush_fee_percentage: 25,
      deposit_percentage: 40
    }
  },

  videography: {
    name: "Videography",
    icon: "🎬",
    description: "Professional video services",
    pricingModels: ["package", "hourly", "fixed"],
    defaultModel: "package",
    fields: {
      // Basic pricing
      hourly_rate: {
        label: "Hourly Rate ($)",
        type: "number",
        placeholder: "e.g., 200",
        min: 0,
        step: 0.01,
        description: "Your standard hourly rate for videography",
        required: false
      },
      full_day_rate: {
        label: "Full Day Rate ($)",
        type: "number",
        placeholder: "e.g., 1500",
        min: 0,
        step: 0.01,
        description: "Rate for full day coverage",
        required: false
      },
      editing_rate: {
        label: "Editing Rate per Hour ($)",
        type: "number",
        placeholder: "e.g., 75",
        min: 0,
        step: 0.01,
        description: "Rate for video editing time",
        required: false
      },
      rush_editing_fee: {
        label: "Rush Editing Fee ($)",
        type: "number",
        placeholder: "e.g., 200",
        min: 0,
        step: 0.01,
        description: "Additional fee for expedited video delivery",
        required: false
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
    },
    defaultPricing: {
      hourly_rate: 200,
      full_day_rate: 1500,
      editing_rate: 75,
      rush_editing_fee: 200,
      wedding_premium: 0,
      rush_fee_percentage: 30,
      deposit_percentage: 30
    }
  },

  beauty: {
    name: "Beauty",
    icon: "💄",
    description: "Hair and makeup services",
    pricingModels: ["per_person", "package", "fixed"],
    defaultModel: "per_person",
    fields: {
      // Basic pricing
      per_person_rate: {
        label: "Per Person Rate ($)",
        type: "number",
        placeholder: "e.g., 150",
        min: 0,
        step: 0.01,
        description: "Cost per person for hair and makeup",
        required: true
      },
      hair_only_rate: {
        label: "Hair Only Rate ($)",
        type: "number",
        placeholder: "e.g., 100",
        min: 0,
        step: 0.01,
        description: "Rate for hair styling only",
        required: false
      },
      makeup_only_rate: {
        label: "Makeup Only Rate ($)",
        type: "number",
        placeholder: "e.g., 100",
        min: 0,
        step: 0.01,
        description: "Rate for makeup only",
        required: false
      },
      travel_fee: {
        label: "Travel Fee ($)",
        type: "number",
        placeholder: "e.g., 50",
        min: 0,
        step: 0.01,
        description: "Fee for traveling to venue/home",
        required: false
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
    },
    defaultPricing: {
      per_person_rate: 150,
      hair_only_rate: 100,
      makeup_only_rate: 100,
      travel_fee: 50,
      wedding_premium: 0,
      rush_fee_percentage: 20,
      deposit_percentage: 25
    }
  }
};

// Helper functions
export const getCategoryConfig = (category) => {
  return categoryPricingConfig[category] || categoryPricingConfig.photography;
};

export const getDefaultPricing = (category) => {
  const config = getCategoryConfig(category);
  return config.defaultPricing;
};

export const getPackageTemplates = (category) => {
  const config = getCategoryConfig(category);
  return config.fields.packageTemplates || [];
};

export const getAddons = (category) => {
  const config = getCategoryConfig(category);
  return config.fields.addons || [];
}; 