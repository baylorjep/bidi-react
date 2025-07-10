# AI Pricing Setup System Documentation

## Overview

The AI Pricing Setup system is a crucial component that ensures the AI bidder generates accurate, business-specific bids based on actual pricing rules rather than making up pricing. This system captures comprehensive pricing information from businesses before they begin AI training.

## Problem Solved

**Previous Issue**: The AI was generating bids with made-up pricing rules, leading to inaccurate bids that didn't reflect the business's actual pricing structure.

**Solution**: A comprehensive pricing setup flow that captures the business's exact pricing rules before AI training begins.

## Frontend Implementation

### 1. PricingSetup Component
**Location**: `src/components/Business/PricingSetup.js`
**CSS**: `src/components/Business/PricingSetup.css`

**Features**:
- Multi-step form (3 steps) for comprehensive pricing capture
- Category-specific pricing rules
- Beautiful, modern UI with progress indicators
- Automatic navigation between business categories
- Validation and error handling

**Steps**:
1. **Basic Pricing**: Min/max prices, pricing model, base rates, travel fees
2. **Category Specific**: Wedding premiums, rush fees, guest limits, add-ons
3. **Communication**: Default messages, blocklist keywords, additional notes

### 2. Database Schema Updates
**Migration File**: `supabase/pricing_rules_migration.sql`

**New Columns Added**:
```sql
-- Core pricing
base_price DECIMAL(10,2)
per_person_rate DECIMAL(10,2)
wedding_premium DECIMAL(5,2) -- Percentage
rush_fee_percentage DECIMAL(5,2) -- Percentage
deposit_percentage DECIMAL(5,2) -- Percentage

-- Limits and constraints
minimum_guests INTEGER
maximum_guests INTEGER
accept_unknowns BOOLEAN

-- Advanced pricing rules (JSONB)
duration_multipliers JSONB DEFAULT '{}'
service_addons JSONB DEFAULT '{}'
seasonal_pricing JSONB DEFAULT '{}'
group_discounts JSONB DEFAULT '{}'
package_discounts JSONB DEFAULT '{}'
custom_pricing_rules JSONB DEFAULT '[]'
```

### 3. Integration with AutobidTrainer
**Location**: `src/pages/Dashboard/AutobidTrainer.js`

**Changes Made**:
- Added pricing rules check before training begins
- Redirects to `/pricing-setup` if pricing rules are missing
- Ensures all business categories have pricing rules before AI training

## Backend Requirements

### 1. Database Migration
Run the migration file: `supabase/pricing_rules_migration.sql`

### 2. API Updates Needed

#### A. Generate Sample Bid API
**Current**: `POST /api/autobid/generate-sample-bid`

**Required Changes**:
1. **Read pricing rules** from `business_pricing_rules` table
2. **Apply pricing rules** instead of making up pricing
3. **Support `insert_to_database` flag** to prevent double insertion

**New Logic**:
```javascript
// 1. Fetch business pricing rules
const pricingRules = await getBusinessPricingRules(business_id, category);

// 2. Calculate bid based on actual pricing rules
const bidAmount = calculateBidAmount(sample_request, pricingRules);

// 3. Only insert if insert_to_database is true
if (insert_to_database !== false) {
  await insertBidToDatabase(bidData);
}
```

#### B. Training Feedback API
**Current**: `POST /api/autobid/training-feedback`

**Required Changes**:
1. **Always insert AI bid** when feedback is provided
2. **Store feedback** for future AI learning
3. **Update training progress** in database

### 3. Pricing Calculation Logic

#### Base Price Calculation
```javascript
function calculateBasePrice(request, pricingRules) {
  let basePrice = pricingRules.base_price || 0;
  
  // Apply pricing model
  switch (pricingRules.pricing_model) {
    case 'hourly':
      basePrice = pricingRules.hourly_rate * request.duration;
      break;
    case 'per_person':
      basePrice = pricingRules.per_person_rate * request.guest_count;
      break;
    case 'fixed':
      basePrice = pricingRules.base_price;
      break;
  }
  
  return basePrice;
}
```

#### Wedding Premium
```javascript
function applyWeddingPremium(basePrice, request, pricingRules) {
  if (request.event_type?.toLowerCase() === 'wedding' && pricingRules.wedding_premium) {
    return basePrice * (1 + pricingRules.wedding_premium / 100);
  }
  return basePrice;
}
```

#### Duration Multipliers
```javascript
function applyDurationMultipliers(basePrice, request, pricingRules) {
  const duration = request.duration || 1;
  const multipliers = pricingRules.duration_multipliers || {};
  
  // Apply duration-based multipliers
  for (const [durationRange, multiplier] of Object.entries(multipliers)) {
    const [min, max] = durationRange.split('-').map(Number);
    if (duration >= min && duration <= max) {
      return basePrice * multiplier;
    }
  }
  
  return basePrice;
}
```

#### Travel Fees
```javascript
function calculateTravelFee(request, pricingRules) {
  if (!pricingRules.travel_fee_per_mile || !request.location) {
    return 0;
  }
  
  // Calculate distance from business location to event location
  const distance = calculateDistance(businessLocation, request.location);
  return distance * pricingRules.travel_fee_per_mile;
}
```

#### Rush Fees
```javascript
function applyRushFee(basePrice, request, pricingRules) {
  const daysUntilEvent = calculateDaysUntilEvent(request.start_date);
  
  if (daysUntilEvent <= 7 && pricingRules.rush_fee_percentage) {
    return basePrice * (1 + pricingRules.rush_fee_percentage / 100);
  }
  
  return basePrice;
}
```

### 4. Complete Bid Calculation Function
```javascript
function calculateAccurateBid(request, pricingRules) {
  // Start with base price
  let bidAmount = calculateBasePrice(request, pricingRules);
  
  // Apply all pricing rules
  bidAmount = applyWeddingPremium(bidAmount, request, pricingRules);
  bidAmount = applyDurationMultipliers(bidAmount, request, pricingRules);
  bidAmount = applyRushFee(bidAmount, request, pricingRules);
  
  // Add travel fees
  const travelFee = calculateTravelFee(request, pricingRules);
  bidAmount += travelFee;
  
  // Apply bid aggressiveness
  bidAmount = applyBidAggressiveness(bidAmount, pricingRules.bid_aggressiveness);
  
  // Ensure within min/max bounds
  bidAmount = Math.max(pricingRules.min_price || 0, bidAmount);
  bidAmount = Math.min(pricingRules.max_price || Infinity, bidAmount);
  
  return Math.round(bidAmount);
}
```

## User Flow

1. **Business accesses AutobidTrainer**
2. **System checks for pricing rules**
3. **If missing**: Redirect to `/pricing-setup`
4. **Business completes pricing setup** for all categories
5. **System redirects back to AutobidTrainer**
6. **AI training begins** with accurate pricing rules

## Benefits

1. **Accurate Bids**: AI generates bids based on actual business pricing
2. **Consistent Pricing**: No more random or inconsistent bid amounts
3. **Business Control**: Businesses set their own pricing rules
4. **Better Training**: AI learns from real pricing feedback
5. **Professional Results**: Bids reflect actual business capabilities

## Testing Checklist

- [ ] Pricing setup form works for all business categories
- [ ] Database migration runs successfully
- [ ] Pricing rules are saved correctly
- [ ] AutobidTrainer redirects to pricing setup when needed
- [ ] AI generates bids using actual pricing rules
- [ ] No more double submissions
- [ ] Feedback is properly stored and applied

## Next Steps for Backend

1. **Run the database migration**
2. **Update the generate-sample-bid API** to use pricing rules
3. **Update the training-feedback API** to handle bid insertion
4. **Test with real business pricing data**
5. **Monitor AI bid accuracy improvements**

## Files Modified

### Frontend
- `src/components/Business/PricingSetup.js` (NEW)
- `src/components/Business/PricingSetup.css` (NEW)
- `src/pages/Dashboard/AutobidTrainer.js` (MODIFIED)
- `src/App.js` (MODIFIED)

### Database
- `supabase/pricing_rules_migration.sql` (NEW)

### Documentation
- `PRICING_SETUP_DOCUMENTATION.md` (NEW) 