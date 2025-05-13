import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import RequestDisplayMini from "./RequestDisplayMini";
import "../../App.css";
import "../../styles/OpenRequests.css";
import SearchBar from "../SearchBar/SearchBar";
import LoadingSpinner from "../../components/LoadingSpinner";

const BUSINESS_TYPE_MAPPING = {
  "cake": ["cake"],
  "wedding planner/coordinator": ["Wedding Planning"],
  "catering": ["catering"],
  "florist": ["florist"],
  "hair and makeup artist": ["hair and makeup artist", "beauty"],
  "photography": ["photo"],
  "videography": ["photo"],
  "dj": ["dj", "DJ"],
  "venue": ["venue"],
  "spray tan": ["spray tan"],
  "beauty": ["beauty", "hair and makeup artist"]
};

const SERVICE_CATEGORY_MAPPING = {
  photography: { table: "photography_requests", legacy: "photography" },
  dj: { table: "dj_requests", legacy: "dj" },
  catering: { table: "catering_requests", legacy: "catering" },
  "hair and makeup artist": {
    table: "beauty_requests",
    legacy: "hair and makeup artist",
  },
  beauty: { table: "beauty_requests", legacy: "hair and makeup artist" },
  videography: { table: "videography_requests", legacy: "videography" },
  florist: { table: "florist_requests", legacy: "florist" },
  "wedding planner/coordinator": { 
    table: "wedding_planning_requests", 
    legacy: "wedding planning" 
  }
};

// Helper function to normalize category names
const normalizeCategory = (category) => {
  return category.toLowerCase().trim();
};

// Helper function to check if a category matches any of the business categories
const hasMatchingCategory = (requestCategory, businessCategories) => {
  if (!requestCategory || !businessCategories) return false;
  
  const normalizedRequestCategory = normalizeCategory(requestCategory);
  return businessCategories.some(category => {
    const normalizedCategory = normalizeCategory(category);
    // Check direct match
    if (normalizedCategory === normalizedRequestCategory) return true;
    
    // Check mappings
    const mappings = BUSINESS_TYPE_MAPPING[normalizedCategory] || [];
    return mappings.some(mapping => 
      normalizeCategory(mapping) === normalizedRequestCategory
    );
  });
};

function OpenRequests() {
  const [openRequests, setOpenRequests] = useState([]);
  const [openPhotoRequests, setOpenPhotoRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [businessCategories, setBusinessCategories] = useState([]);
  const [userBids, setUserBids] = useState(new Set());
  const [minimumPrice, setMinimumPrice] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Add this new function to fetch user's bids
  const fetchUserBids = async (userId) => {
    const { data: bids, error } = await supabase
      .from("bids")
      .select("request_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user bids:", error);
      return;
    }

    // Create a Set of request_ids that the user has already bid on
    return new Set(bids.map((bid) => bid.request_id));
  };

  useEffect(() => {
    const fetchUserBusinessType = async () => {
      setIsLoading(true);
      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData) {
          setError("Error fetching user information.");
          console.error(userError);
          return;
        }

        const userBidsSet = await fetchUserBids(userData.user.id);
        setUserBids(userBidsSet);

        // Check if user is admin
        const { data: adminData, error: adminError } = await supabase
          .from("business_profiles")
          .select("is_admin")
          .eq("id", userData.user.id)
          .single();

        if (!adminError && adminData) {
          setIsAdmin(adminData.is_admin);
        }

        const { data: profileData, error: profileError } = await supabase
          .from("business_profiles")
          .select("business_category, minimum_price")
          .eq("id", userData.user.id)
          .single();

        if (profileError || !profileData) {
          setError("Error fetching business profile.");
          console.error(profileError);
          return;
        }

        // Handle both array and string formats for backward compatibility
        const categories = Array.isArray(profileData.business_category) 
          ? profileData.business_category 
          : [profileData.business_category];
        
        setBusinessCategories(categories);
        setMinimumPrice(profileData.minimum_price);
        setBusinessId(userData.user.id);
      } catch (err) {
        console.error("Error fetching business type:", err);
        setError("Error fetching business type.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserBusinessType();
  }, []);

  const isNew = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    return diffInDays < 7;
  };

  const checkPromotion = (createdAt) => {
    if (!createdAt) return null;

    const created = new Date(createdAt);
    const specialDates = [new Date("2025-01-11"), new Date("2025-01-25")];

    const isSpecialDate = specialDates.some(
      (date) =>
        created.getFullYear() === date.getFullYear() &&
        created.getMonth() === date.getMonth() &&
        created.getDate() === date.getDate()
    );

    if (!isSpecialDate) return null;

    const now = new Date();
    const diffInMinutes = Math.floor((now - created) / (1000 * 60));

    if (diffInMinutes <= 30) return "Only Pay 6%";
    if (diffInMinutes <= 60) return "Only Pay 7%";
    return null;
  };

  useEffect(() => {
    if (businessCategories.length === 0 && !isAdmin) return;

    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        console.log('Business Categories:', businessCategories);
        console.log('Is Admin:', isAdmin);

        const validCategories = [
          "photography",
          "videography",
          "dj",
          "catering",
          "florist",
          "hair and makeup artist",
          "beauty",
          "wedding planner/coordinator"
        ];

        // If user is admin, fetch all requests
        if (isAdmin) {
          console.log('Fetching as admin');
          const [
            photoData,
            djData,
            cateringData,
            beautyData,
            videoData,
            floristData,
            weddingPlanningData,
            legacyData,
          ] = await Promise.all([
            supabase
              .from("photography_requests")
              .select("*")
              .in("status", ["pending", "open"])
              .order("created_at", { ascending: false }),
            supabase
              .from("dj_requests")
              .select("*")
              .in("status", ["pending", "open"])
              .order("created_at", { ascending: false }),
            supabase
              .from("catering_requests")
              .select("*")
              .in("status", ["pending", "open"])
              .order("created_at", { ascending: false }),
            supabase
              .from("beauty_requests")
              .select("*")
              .in("status", ["pending", "open"])
              .order("created_at", { ascending: false }),
            supabase
              .from("videography_requests")
              .select("*")
              .in("status", ["pending", "open"])
              .order("created_at", { ascending: false }),
            supabase
              .from("florist_requests")
              .select("*")
              .in("status", ["pending", "open"])
              .order("created_at", { ascending: false }),
            supabase
              .from("wedding_planning_requests")
              .select("*")
              .in("status", ["pending", "open"])
              .order("created_at", { ascending: false }),
            supabase
              .from("requests")
              .select("*")
              .eq("open", true)
              .order("created_at", { ascending: false }),
          ]);

          console.log('Wedding Planning Data:', weddingPlanningData);

          const allRequests = [
            ...(photoData.data?.map((req) => ({
              ...req,
              table_name: "photography_requests",
              service_title: req.event_title || "Photography Request",
              service_category: "photography",
            })) || []),
            ...(djData.data?.map((req) => ({
              ...req,
              table_name: "dj_requests",
              service_title: req.title || "DJ Request",
              service_category: "dj",
            })) || []),
            ...(cateringData.data?.map((req) => ({
              ...req,
              table_name: "catering_requests",
              service_title: req.title || "Catering Request",
              service_category: "catering",
            })) || []),
            ...(beautyData.data?.map((req) => ({
              ...req,
              table_name: "beauty_requests",
              service_title: req.title || "Beauty Request",
              service_category: "beauty",
            })) || []),
            ...(videoData.data?.map((req) => ({
              ...req,
              table_name: "videography_requests",
              service_title: req.title || "Videography Request",
              service_category: "videography",
            })) || []),
            ...(floristData.data?.map((req) => ({
              ...req,
              table_name: "florist_requests",
              service_title: req.title || "Florist Request",
              service_category: "florist",
            })) || []),
            ...(weddingPlanningData.data?.map((req) => ({
              ...req,
              table_name: "wedding_planning_requests",
              service_title: req.event_title || "Wedding Planning Request",
              service_category: "Wedding Planning",
            })) || []),
            ...(legacyData.data || []),
          ];

          console.log('All Requests:', allRequests);
          setOpenRequests(allRequests);
          setOpenPhotoRequests([]);
          return;
        }

        // Check if any of the business categories are valid
        const hasValidCategory = businessCategories.some(category => {
          const normalized = normalizeCategory(category);
          console.log('Checking category:', category, 'normalized:', normalized);
          return validCategories.includes(normalized);
        });

        console.log('Has Valid Category:', hasValidCategory);

        if (!hasValidCategory) {
          setOpenRequests([]);
          setOpenPhotoRequests([]);
          return;
        }

        // Separate photo/video categories from other categories
        const photoVideoCategories = businessCategories.filter(category => 
          ["photography", "videography"].includes(normalizeCategory(category))
        );
        const otherCategories = businessCategories.filter(category => 
          !["photography", "videography"].includes(normalizeCategory(category))
        );

        // Fetch photo/video requests if applicable
        let photoVideoRequests = [];
        if (photoVideoCategories.length > 0) {
          const [photoTableData, videoTableData, legacyRequestsData] =
            await Promise.all([
              supabase
                .from("photography_requests")
                .select("*")
                .in("status", ["pending", "open"])
                .order("created_at", { ascending: false }),
              supabase
                .from("videography_requests")
                .select("*")
                .in("status", ["pending", "open"])
                .order("created_at", { ascending: false }),
              supabase
                .from("requests")
                .select("*")
                .in("service_category", ["photography", "videography"])
                .eq("open", true)
                .order("created_at", { ascending: false }),
            ]);

          photoVideoRequests = [
            ...(photoTableData.data?.map((req) => ({
              ...req,
              table_name: "photography_requests",
              service_title:
                req.title || req.event_title || "Photography Request",
              service_category: "photography",
            })) || []),
            ...(videoTableData.data?.map((req) => ({
              ...req,
              table_name: "videography_requests",
              service_title:
                req.title || req.event_title || "Videography Request",
              service_category: "videography",
            })) || []),
            ...(legacyRequestsData.data?.map((req) => ({
              ...req,
              table_name: "requests",
              service_title:
                req.service_title ||
                req.title ||
                `${req.service_category} Request`,
            })) || []),
          ];
        }

        // Fetch other category requests
        let otherRequests = [];
        if (otherCategories.length > 0) {
          const categoryPromises = otherCategories.map(async (category) => {
            const normalizedCategory = normalizeCategory(category);
            const serviceMapping = SERVICE_CATEGORY_MAPPING[normalizedCategory];
            
            if (!serviceMapping) return [];

            const [categoryData, legacyRequestsData] = await Promise.all([
              supabase
                .from(serviceMapping.table)
                .select("*")
                .in("status", ["pending", "open"])
                .order("created_at", { ascending: false }),
              supabase
                .from("requests")
                .select("*")
                .eq("service_category", serviceMapping.legacy)
                .eq("open", true)
                .order("created_at", { ascending: false }),
            ]);

            return [
              ...(categoryData.data?.map((req) => ({
                ...req,
                table_name: serviceMapping.table,
                service_title: req.title || req.event_title || `${category} Request`,
                service_category: normalizedCategory,
              })) || []),
              ...(legacyRequestsData.data?.map((req) => ({
                ...req,
                table_name: "requests",
                service_title: req.service_title || req.title || `${category} Request`,
                service_category: normalizedCategory,
              })) || []),
            ];
          });

          const allCategoryRequests = await Promise.all(categoryPromises);
          otherRequests = allCategoryRequests.flat();
        }

        // Combine all requests
        const allRequests = [...photoVideoRequests, ...otherRequests];
        
        // Set the appropriate state based on whether we have photo/video categories
        if (photoVideoCategories.length > 0) {
          setOpenPhotoRequests(allRequests);
          setOpenRequests([]);
        } else {
          setOpenRequests(allRequests);
          setOpenPhotoRequests([]);
        }

      } catch (error) {
        console.error("Error in fetchRequests:", error);
        setError(`Error fetching requests: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [businessCategories, isAdmin]);

  const meetsMinimumPrice = (request) => {
    if (!minimumPrice) return true; // If no minimum price set, show all requests

    // Handle different price range formats
    let budget = request.price_range || request.budget;
    if (!budget) return true; // If no budget specified, show the request

    console.log("Processing budget:", budget); // Debug log

    // Convert price range string to minimum value
    if (typeof budget === "string") {
      // Remove any spaces, dollar signs, and convert to lowercase
      budget = budget.toLowerCase().replace(/\s+/g, "").replace(/\$/g, "");

      // Handle format like "0-1000" or "500-1000"
      if (budget.includes("-")) {
        const [min, max] = budget.split("-");
        // Use the maximum value for comparison
        const maxBudget = parseInt(max);
        console.log("Range format detected:", budget, "max value:", maxBudget); // Debug log
        return !isNaN(maxBudget) && maxBudget >= minimumPrice;
      }

      // Handle single number or other formats
      const numbers = budget.match(/\d+/);
      if (numbers) {
        const budgetValue = parseInt(numbers[0]);
        console.log(
          "Single number format detected:",
          budget,
          "value:",
          budgetValue
        ); // Debug log
        return !isNaN(budgetValue) && budgetValue >= minimumPrice;
      }
    }

    // Handle numeric budget values
    if (typeof budget === "number") {
      console.log("Numeric budget:", budget); // Debug log
      return budget >= minimumPrice;
    }

    return true; // Default to showing the request if format is unknown
  };

  // Add new function to check if a request's date has passed
  const isDatePassed = (request) => {
    // If date is flexible or a range, don't hide
    if (request.date_flexibility === 'flexible' || request.date_flexibility === 'range') {
      return false;
    }

    // For specific dates, check if the date has passed
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    // Check start_date for specific date requests
    if (request.start_date) {
      const startDate = new Date(request.start_date);
      startDate.setHours(0, 0, 0, 0);
      return startDate < today;
    }

    // If no date is specified, don't hide
    return false;
  };

  const sortByNewAndDate = (a, b) => {
    const aIsNew = isNew(a.created_at);
    const bIsNew = isNew(b.created_at);
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  };

  // Helper to update hidden_by_vendor in the DB
  async function updateHiddenByVendor(requestId, tableName, businessId, hide) {
    console.log('updateHiddenByVendor called with:', {
      requestId,
      tableName,
      businessId,
      hide
    });

    try {
      // First, verify the table exists and we can access it
      const { data: tableCheck, error: tableError } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error(`Error accessing table ${tableName}:`, tableError);
        return false;
      }

      // Fetch the latest array from Supabase
      const { data, error } = await supabase
        .from(tableName)
        .select('hidden_by_vendor, id')
        .eq('id', requestId)
        .single();
      
      console.log('Fetched data from Supabase:', { data, error });
      
      if (error) {
        console.error('Error fetching hidden_by_vendor:', error);
        return false;
      }

      if (!data) {
        console.error('No data returned from Supabase for request:', requestId);
        return false;
      }

      let hidden = Array.isArray(data.hidden_by_vendor) ? data.hidden_by_vendor : [];
      console.log('Current hidden array:', hidden);
      
      if (hide) {
        if (!hidden.includes(businessId)) {
          hidden.push(businessId);
          console.log('Added businessId to hidden array');
        }
      } else {
        hidden = hidden.filter(id => id !== businessId);
        console.log('Removed businessId from hidden array');
      }
      console.log('Updated hidden array:', hidden);
      
      // Perform the update - only update hidden_by_vendor
      const { data: updateData, error: updateError } = await supabase
        .from(tableName)
        .update({ hidden_by_vendor: hidden })
        .eq('id', requestId)
        .select();
      
      console.log('Update result:', { updateData, updateError });
      
      if (updateError) {
        console.error('Error updating hidden_by_vendor:', updateError);
        return false;
      }

      if (!updateData || updateData.length === 0) {
        console.error('No data returned after update');
        return false;
      }

      console.log('Successfully updated hidden_by_vendor');
      return true;
    } catch (error) {
      console.error('Unexpected error in updateHiddenByVendor:', error);
      return false;
    }
  }

  const hideRequest = async (requestId, tableName) => {
    console.log('hideRequest called with:', { requestId, tableName, businessId });
    
    if (!businessId) {
      console.error('No businessId available');
      return;
    }

    try {
      // Update DB first
      const success = await updateHiddenByVendor(requestId, tableName, businessId, true);
      console.log('Database update result:', { success });
      
      if (success) {
        // Only update UI after successful DB update
        if (["photography", "videography"].includes(businessCategories?.some(c => c.toLowerCase()) || '')) {
          console.log('Updating openPhotoRequests');
          setOpenPhotoRequests(prev => {
            const filtered = prev.filter(req => req.id !== requestId);
            console.log('Previous photo requests count:', prev.length);
            console.log('New photo requests count:', filtered.length);
            return filtered;
          });
        } else {
          console.log('Updating openRequests');
          setOpenRequests(prev => {
            const filtered = prev.filter(req => req.id !== requestId);
            console.log('Previous requests count:', prev.length);
            console.log('New requests count:', filtered.length);
            return filtered;
          });
        }

        // Force a re-render
        setShowHidden(prev => !prev);
        setTimeout(() => setShowHidden(prev => !prev), 0);
      } else {
        console.error('Failed to update hidden_by_vendor in database');
      }
    } catch (error) {
      console.error('Error in hideRequest:', error);
    }
  };

  const showRequest = async (requestId, tableName) => {
    if (!businessId) return;
    const success = await updateHiddenByVendor(requestId, tableName, businessId, false);
    if (success) {
      // Fetch the updated request from Supabase and update local state
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', requestId)
        .single();
      if (!error && data) {
        if (["photography", "videography"].includes(businessCategories?.some(c => c.toLowerCase()) || '')) {
          setOpenPhotoRequests(prev => {
            // If not already present, add it
            if (!prev.some(r => r.id === requestId)) {
              return [...prev, data];
            }
            // Otherwise, update it
            return prev.map(r => r.id === requestId ? data : r);
          });
        } else {
          setOpenRequests(prev => {
            if (!prev.some(r => r.id === requestId)) {
              return [...prev, data];
            }
            return prev.map(r => r.id === requestId ? data : r);
          });
        }
      }
    }
  };

  // Helper to filter requests by hidden status
  const filterRequestsByHidden = (requests) => {
    console.log('Filtering requests by hidden status:', {
      showHidden,
      businessId,
      requestCount: requests.length,
      requests: requests.map(r => ({ id: r.id, hidden: r.hidden_by_vendor }))
    });
    
    const filtered = showHidden
      ? requests.filter(req => req.hidden_by_vendor?.includes(businessId))
      : requests.filter(req => !req.hidden_by_vendor?.includes(businessId));
    
    console.log('Filtered requests:', {
      count: filtered.length,
      ids: filtered.map(r => r.id)
    });
    return filtered;
  };

  // Helper to get the correct table name for a request
  const getTableName = (request) => {
    console.log('Getting table name for request:', {
      table_name: request.table_name,
      service_category: request.service_category,
      request_id: request.id
    });
    
    if (request.table_name) {
      console.log('Using table_name from request:', request.table_name, request);
      return request.table_name;
    }
    const cat = (request.service_category || '').toLowerCase();
    console.log('Service category (lowercase):', cat);
    
    let table;
    switch (cat) {
      case "catering": table = "catering_requests"; break;
      case "videography": table = "videography_requests"; break;
      case "photography": table = "photography_requests"; break;
      case "dj": table = "dj_requests"; break;
      case "beauty": table = "beauty_requests"; break;
      case "florist": table = "florist_requests"; break;
      case "Wedding Planning": table = "wedding_planning_requests"; break;
      default: table = "requests";
    }
    console.log('Determined table for request:', table, request);
    return table;
  };

  // Add this new function to filter requests by category
  const filterRequestsByCategory = (requests, category) => {
    // If user is admin, show all requests without category filtering
    if (isAdmin) return requests;
    
    if (category === "all") return requests;
    return requests.filter(request => 
      normalizeCategory(request.service_category) === normalizeCategory(category)
    );
  };

  // Add this new function to get the display name for a category
  const getCategoryDisplayName = (category) => {
    const normalized = normalizeCategory(category);
    switch (normalized) {
      case "photography": return "Photography";
      case "videography": return "Videography";
      case "dj": return "DJ";
      case "catering": return "Catering";
      case "florist": return "Florist";
      case "hair and makeup artist": return "Hair & Makeup";
      case "beauty": return "Beauty";
      case "wedding planning": return "Wedding Planning";
      case "wedding planner": return "Wedding Planning";
      default: return category;
    }
  };

  if (isLoading) {
    return <LoadingSpinner color="#9633eb" size={50} />;
  }

  return (
    <div className="requests-main-container">
      <h1 style={{ fontFamily: "Outfit", fontWeight: "bold" }}>
        Open Requests
      </h1>
      <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "20px" }}>
        <button
          className="toggle-hidden-button"
          onClick={() => setShowHidden((prev) => !prev)}
        >
          {showHidden ? "Show Active Requests" : "Show Hidden Requests"}
        </button>
      </div>

      {/* Only show category tabs if user is not admin */}
      {!isAdmin && (
        <div className="category-tabs" style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '20px',
          overflowX: 'auto',
          padding: '0 10px'
        }}>
          <button
            className={`category-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '20px',
              backgroundColor: activeTab === 'all' ? '#9633eb' : '#f0f0f0',
              color: activeTab === 'all' ? 'white' : '#333',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            All Requests
          </button>
          {businessCategories.map(category => (
            <button
              key={category}
              className={`category-tab ${activeTab === category ? 'active' : ''}`}
              onClick={() => setActiveTab(category)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '20px',
                backgroundColor: activeTab === category ? '#9633eb' : '#f0f0f0',
                color: activeTab === category ? 'white' : '#333',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {getCategoryDisplayName(category)}
            </button>
          ))}
        </div>
      )}

      <div className="request-grid-container">
        <div className="request-grid">
          {error && <p>Error: {error}</p>}
          {filterRequestsByCategory(
            (businessCategories.some(cat => 
              ["photography", "videography"].includes(normalizeCategory(cat))
            )
              ? filterRequestsByHidden(openPhotoRequests)
              : filterRequestsByHidden(openRequests)
            )
              .filter((request) => !userBids.has(request.id))
              .filter(meetsMinimumPrice)
              .filter(request => !isDatePassed(request))
              .filter(request => isAdmin || hasMatchingCategory(request.service_category, businessCategories))
              .sort(sortByNewAndDate),
            activeTab
          ).map((request) => (
            <RequestDisplayMini
              key={request.id}
              request={request}
              isPhotoRequest={request.service_category === "photography"}
              onHide={() => hideRequest(request.id, getTableName(request))}
              onShow={() => showRequest(request.id, getTableName(request))}
              isHidden={request.hidden_by_vendor?.includes(businessId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default OpenRequests;
