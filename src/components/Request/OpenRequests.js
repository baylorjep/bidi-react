import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import RequestDisplayMini from "./RequestDisplayMini";
import "../../App.css";
import "../../styles/OpenRequests.css";
import SearchBar from "../SearchBar/SearchBar";
import LoadingSpinner from "../../components/LoadingSpinner";

const BUSINESS_TYPE_MAPPING = {
  cake: ["cake"],
  "wedding planner/coordinator": ["wedding planning"],
  catering: ["catering"],
  florist: ["florist"],
  "hair and makeup artist": ["hair and makeup artist", "beauty"],
  photography: ["photo"],
  videography: ["photo"],
  dj: ["dj", "DJ"], // Add both lowercase and uppercase variations
  venue: ["venue"],
  "spray tan": ["spray tan"],
  beauty: ["beauty", "hair and makeup artist"],
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
  "wedding planner": { table: "wedding_planning_requests", legacy: "wedding planning" },
};

function OpenRequests() {
  const [openRequests, setOpenRequests] = useState([]);
  const [openPhotoRequests, setOpenPhotoRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [userBids, setUserBids] = useState(new Set()); // Add this new state
  const [minimumPrice, setMinimumPrice] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

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
      setIsLoading(true); // Start loading
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

        setBusinessType(profileData.business_category);
        setMinimumPrice(profileData.minimum_price);
        setBusinessId(userData.user.id); // Set businessId for later use
      } catch (err) {
        console.error("Error fetching business type:", err);
        setError("Error fetching business type.");
      } finally {
        setIsLoading(false); // Stop loading
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
    if (!businessType && !isAdmin) return;

    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        const validCategories = [
          "photography",
          "videography",
          "dj",
          "catering",
          "florist",
          "hair and makeup artist",
          "beauty",
          "wedding planner"
        ];

        // If user is admin, fetch all requests
        if (isAdmin) {
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
              service_category: "wedding planning",
            })) || []),
            ...(legacyData.data || []),
          ];

          setOpenRequests(allRequests);
          setOpenPhotoRequests([]);
          return;
        }

        // Check if current business type is in valid categories
        const isValidCategory = validCategories.includes(
          businessType.toLowerCase()
        );
        const isPhotoVideo = ["photography", "videography"].includes(
          businessType.toLowerCase()
        );

        if (!isValidCategory) {
          // If not a valid category and not admin, show no requests
          setOpenRequests([]);
          setOpenPhotoRequests([]);
          return;
        }

        if (isPhotoVideo) {
          // Fetch both photography and videography requests
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

            const combinedRequests = [
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

            setOpenPhotoRequests(combinedRequests);
            setOpenRequests([]);
        } else if (businessType.toLowerCase() === "wedding planner/coordinator") {
          // Fetch only wedding planning requests
          const [weddingPlanningData, legacyRequestsData] = await Promise.all([
            supabase
              .from("wedding_planning_requests")
              .select("*")
              .in("status", ["pending", "open"])
              .order("created_at", { ascending: false }),
            supabase
              .from("requests")
              .select("*")
              .eq("service_category", "wedding planning")
              .eq("open", true)
              .order("created_at", { ascending: false }),
          ]);

          const combinedRequests = [
            ...(weddingPlanningData.data?.map((req) => ({
              ...req,
              table_name: "wedding_planning_requests",
              service_title: req.event_title || "Wedding Planning Request",
              service_category: "wedding planning",
            })) || []),
            ...(legacyRequestsData.data?.map((req) => ({
              ...req,
              table_name: "requests",
              service_title: req.service_title || req.title || "Wedding Planning Request",
              service_category: "wedding planning",
            })) || []),
          ];

          setOpenRequests(combinedRequests);
          setOpenPhotoRequests([]);
        } else {
          // Handle other business types (catering, dj, etc.)
          const [categoryData, legacyRequestsData] = await Promise.all([
            supabase
              .from(`${businessType.toLowerCase()}_requests`)
              .select("*")
              .in("status", ["pending", "open"])
              .order("created_at", { ascending: false }),
            supabase
              .from("requests")
              .select("*")
              .eq("service_category", businessType.toLowerCase())
              .eq("open", true)
              .order("created_at", { ascending: false }),
          ]);

          const combinedRequests = [
            ...(categoryData.data?.map((req) => ({
              ...req,
              table_name: `${businessType.toLowerCase()}_requests`,
              service_title: req.title || req.event_title || `${businessType} Request`,
              service_category: businessType.toLowerCase(),
            })) || []),
            ...(legacyRequestsData.data?.map((req) => ({
              ...req,
              table_name: "requests",
              service_title: req.service_title || req.title || `${businessType} Request`,
              service_category: businessType.toLowerCase(),
            })) || []),
          ];

          setOpenRequests(combinedRequests);
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
  }, [businessType, isAdmin]);

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
        if (["photography", "videography"].includes(businessType?.toLowerCase())) {
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
        if (["photography", "videography"].includes(businessType?.toLowerCase())) {
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
      case "wedding planning": table = "wedding_planning_requests"; break;
      default: table = "requests";
    }
    console.log('Determined table for request:', table, request);
    return table;
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
      <div className="request-grid-container">
        <div className="request-grid">
          {error && <p>Error: {error}</p>}
          {(["photography", "videography"].includes(businessType?.toLowerCase())
            ? filterRequestsByHidden(openPhotoRequests)
            : filterRequestsByHidden(openRequests)
          )
            .filter((request) => !userBids.has(request.id))
            .filter(meetsMinimumPrice)
            .filter(request => !isDatePassed(request)) // Add the date filter
            .sort(sortByNewAndDate)
            .map((request) => (
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
