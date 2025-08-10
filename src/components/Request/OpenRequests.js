import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import RequestDisplayMini from "./RequestDisplayMini";
import SlidingBidModal from "./SlidingBidModal";
import { Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
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

function OpenRequests({ onMessageClick }) {
  const navigate = useNavigate();
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
  const [user, setUser] = useState(null);
  const [isSlidingModalOpen, setIsSlidingModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [showStripeModal, setShowStripeModal] = useState(false);
  
  // New state for bid readiness assessment
  const [bidCounts, setBidCounts] = useState({});
  const [userSubmittedBids, setUserSubmittedBids] = useState(new Set());
  const [allBidsUnfiltered, setAllBidsUnfiltered] = useState([]);
  
  // Sorting state
  const [sortBy, setSortBy] = useState("newest");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth <= 480);

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
    const bidSet = new Set(bids.map((bid) => bid.request_id));
    setUserSubmittedBids(bidSet);
    return bidSet;
  };

  // New function to fetch bid counts for requests
  const fetchBidCounts = async () => {
    console.log('=== fetchBidCounts called ===');
    try {
      console.log('Fetching bid counts...');
      
      // First, let's check if there are any bids at all
      const { data: allBids, error: allBidsError } = await supabase
        .from("bids")
        .select("id, request_id, user_id, category, hidden")
        .limit(10);

      if (allBidsError) {
        console.error("Error fetching all bids:", allBidsError);
      } else {
        console.log('Sample of all bids in database:', allBids);
        console.log('Total bids in database:', allBids?.length || 0);
      }
      
      // Also check total count
      const { count: totalBidCount, error: countError } = await supabase
        .from("bids")
        .select("*", { count: 'exact', head: true });

      if (countError) {
        console.error("Error counting bids:", countError);
      } else {
        console.log('Total bids in database (count):', totalBidCount);
      }
      
      // First, let's get ALL bids without any filtering to see what's there
      const { data: allBidsUnfiltered, error: allBidsUnfilteredError } = await supabase
        .from("bids")
        .select("request_id, id, user_id, category, hidden")
        .limit(50);

      if (allBidsUnfilteredError) {
        console.error("Error fetching all bids (unfiltered):", allBidsUnfilteredError);
      } else {
        console.log('All bids (unfiltered):', allBidsUnfiltered);
        console.log('Total unfiltered bids:', allBidsUnfiltered?.length || 0);
        setAllBidsUnfiltered(allBidsUnfiltered || []);
      }

      const { data: bidCountsData, error } = await supabase
        .from("bids")
        .select("request_id, id, user_id, category, hidden")
        .not("hidden", "eq", true);

      if (error) {
        console.error("Error fetching bid counts:", error);
        return;
      }

      console.log('Raw bid data (not hidden):', bidCountsData);
      console.log('Total bids found:', bidCountsData?.length || 0);

      const counts = {};
      bidCountsData.forEach(bid => {
        const requestId = bid.request_id;
        if (requestId) {
          counts[requestId] = (counts[requestId] || 0) + 1;
        }
      });

      console.log('Processed bid counts:', counts);
      console.log('Unique request IDs with bids:', Object.keys(counts));
      setBidCounts(counts);
    } catch (error) {
      console.error("Error in fetchBidCounts:", error);
    }
  };

  // Helper function to calculate request urgency
  const calculateRequestUrgency = (request) => {
    if (!request.start_date) return null;
    
    const eventDate = new Date(request.start_date);
    const now = new Date();
    const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilEvent <= 7) return 'urgent';
    if (daysUntilEvent <= 30) return 'soon';
    return 'normal';
  };

  // Helper function to assess budget match
  const assessBudgetMatch = (request, businessProfile) => {
    if (!request.price_range || !businessProfile?.average_bid_amount) return null;
    
    const budget = parseFloat(request.price_range.replace(/[^0-9]/g, ''));
    const avgBid = parseFloat(businessProfile.average_bid_amount);
    
    if (budget >= avgBid * 1.5) return 'high';
    if (budget >= avgBid * 0.8) return 'medium';
    return 'low';
  };

  // Helper function to assess service match
  const assessServiceMatch = (request, businessCategories) => {
    if (!request.service_category || !businessCategories) return null;
    
    const requestCategory = request.service_category.toLowerCase();
    const hasExactMatch = businessCategories.some(cat => 
      cat.toLowerCase() === requestCategory
    );
    
    if (hasExactMatch) return 'perfect';
    
    // Check for related categories
    const relatedCategories = {
      'photography': ['videography'],
      'videography': ['photography'],
      'beauty': ['hair and makeup artist'],
      'hair and makeup artist': ['beauty']
    };
    
    const hasRelatedMatch = businessCategories.some(cat => {
      const related = relatedCategories[cat.toLowerCase()] || [];
      return related.includes(requestCategory);
    });
    
    if (hasRelatedMatch) return 'good';
    return 'partial';
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
      try {
        console.log('Fetching requests for business ID:', businessId);
        
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
        
        // Get all requests from different tables
        const [
          { data: regularRequests, error: regularError },
          { data: photoRequests, error: photoError },
          { data: djRequests, error: djError },
          { data: cateringRequests, error: cateringError },
          { data: beautyRequests, error: beautyError },
          { data: videoRequests, error: videoError },
          { data: floristRequests, error: floristError },
          { data: weddingPlanningRequests, error: weddingPlanningError }
        ] = await Promise.all([
          supabase.from('requests').select('*').eq('user_id', businessId),
          supabase.from('photography_requests').select('*').eq('profile_id', businessId),
          supabase.from('dj_requests').select('*').eq('user_id', businessId),
          supabase.from('catering_requests').select('*').eq('user_id', businessId),
          supabase.from('beauty_requests').select('*').eq('user_id', businessId),
          supabase.from('videography_requests').select('*').eq('user_id', businessId),
          supabase.from('florist_requests').select('*').eq('user_id', businessId),
          supabase.from('wedding_planning_requests').select('*').eq('user_id', businessId)
        ]);

        // Log the results for debugging
        console.log('Regular requests:', regularRequests?.length || 0);
        console.log('Photo requests:', photoRequests?.length || 0);
        console.log('DJ requests:', djRequests?.length || 0);
        console.log('Catering requests:', cateringRequests?.length || 0);
        console.log('Beauty requests:', beautyRequests?.length || 0);
        console.log('Video requests:', videoRequests?.length || 0);
        console.log('Florist requests:', floristRequests?.length || 0);
        console.log('Wedding planning requests:', weddingPlanningRequests?.length || 0);

        // Sample request IDs for debugging
        if (photoRequests?.length > 0) {
          console.log('Sample photo request IDs:', photoRequests.slice(0, 3).map(r => r.id));
        }
        if (cateringRequests?.length > 0) {
          console.log('Sample catering request IDs:', cateringRequests.slice(0, 3).map(r => r.id));
        }

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
          console.log('Total requests fetched:', allRequests.length);
          console.log('Sample request IDs:', allRequests.slice(0, 5).map(r => ({ id: r.id, type: r.service_category, title: r.service_title })));
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
    
    // Fetch vendor interests and bid counts after requests are loaded
    console.log('About to call fetchBidCounts, businessId:', businessId);
    if (businessId) {
      console.log('Calling fetchBidCounts...');
      fetchBidCounts();
    } else {
      console.log('No businessId, skipping fetchBidCounts');
    }
  }, [businessCategories, isAdmin, businessId]);

  // Add debugging to see when the component mounts and what the values are
  useEffect(() => {
    console.log('=== OpenRequests useEffect triggered ===');
    console.log('businessCategories:', businessCategories);
    console.log('isAdmin:', isAdmin);
    console.log('businessId:', businessId);
  }, [businessCategories, isAdmin, businessId]);

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

  // Enhanced sorting functions
  const sortRequests = (requests, sortBy, sortOrder) => {
    const sorted = [...requests].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "newest":
          comparison = new Date(b.created_at) - new Date(a.created_at);
          break;
        case "oldest":
          comparison = new Date(a.created_at) - new Date(b.created_at);
          break;
        case "budget_high":
          const budgetA = parseBudget(a.price_range || a.budget_range || '0');
          const budgetB = parseBudget(b.price_range || b.budget_range || '0');
          comparison = budgetB - budgetA;
          break;
        case "budget_low":
          const budgetA2 = parseBudget(a.price_range || a.budget_range || '0');
          const budgetB2 = parseBudget(b.price_range || b.budget_range || '0');
          comparison = budgetA2 - budgetB2;
          break;
        case "event_date_nearest":
          const dateA = new Date(a.start_date || a.event_date || '2099-12-31');
          const dateB = new Date(b.start_date || b.event_date || '2099-12-31');
          comparison = dateA - dateB;
          break;
        case "event_date_farthest":
          const dateA2 = new Date(a.start_date || a.event_date || '1970-01-01');
          const dateB2 = new Date(b.start_date || b.event_date || '1970-01-01');
          comparison = dateB2 - dateA2;
          break;
        case "location":
          const locationA = (a.venue_city || a.location || '').toLowerCase();
          const locationB = (b.venue_city || b.location || '').toLowerCase();
          comparison = locationA.localeCompare(locationB);
          break;
        case "urgency":
          const urgencyA = calculateRequestUrgency(a);
          const urgencyB = calculateRequestUrgency(b);
          const urgencyOrder = { 'urgent': 3, 'soon': 2, 'normal': 1, null: 0 };
          comparison = (urgencyOrder[urgencyB] || 0) - (urgencyOrder[urgencyA] || 0);
          break;
        case "bids":
          const bidsA = bidCounts[a.id] || 0;
          const bidsB = bidCounts[b.id] || 0;
          comparison = bidsA - bidsB;
          break;
        default:
          return sortByNewAndDate(a, b);
      }
      
      return sortOrder === "desc" ? comparison : -comparison;
    });
    
    return sorted;
  };

  // Helper function to filter requests by search term
  const filterRequestsBySearch = (requests, searchTerm) => {
    if (!searchTerm.trim()) return requests;
    
    const term = searchTerm.toLowerCase();
    return requests.filter(request => {
      const title = (request.service_title || request.title || request.event_title || '').toLowerCase();
      const location = (request.venue_city || request.location || '').toLowerCase();
      const description = (request.description || request.special_requests || '').toLowerCase();
      const category = (request.service_category || '').toLowerCase();
      
      return title.includes(term) || 
             location.includes(term) || 
             description.includes(term) ||
             category.includes(term);
    });
  };

  // Helper function to parse budget from string
  const parseBudget = (budgetString) => {
    if (!budgetString) return 0;
    const matches = budgetString.toString().match(/\d+/g);
    if (!matches) return 0;
    return parseInt(matches[0]) || 0;
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
        .eq('id', requestId);
      
      console.log('Update result:', { updateData, updateError });
      
      if (updateError) {
        console.error('Error updating hidden_by_vendor:', updateError);
        return false;
      }

      // If no error occurred, assume the update was successful
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
        // Check which state array contains this request
        const requestInPhotoArray = openPhotoRequests.some(req => req.id === requestId);
        const requestInMainArray = openRequests.some(req => req.id === requestId);
        
        console.log('Request location check:', { requestInPhotoArray, requestInMainArray, requestId });
        
        // Update the request's hidden_by_vendor property in the correct state array
        if (requestInPhotoArray) {
          console.log('Updating openPhotoRequests');
          setOpenPhotoRequests(prev => {
            return prev.map(req => {
              if (req.id === requestId) {
                const currentHidden = Array.isArray(req.hidden_by_vendor) ? req.hidden_by_vendor : [];
                return {
                  ...req,
                  hidden_by_vendor: [...currentHidden, businessId]
                };
              }
              return req;
            });
          });
        } else if (requestInMainArray) {
          console.log('Updating openRequests');
          setOpenRequests(prev => {
            return prev.map(req => {
              if (req.id === requestId) {
                const currentHidden = Array.isArray(req.hidden_by_vendor) ? req.hidden_by_vendor : [];
                return {
                  ...req,
                  hidden_by_vendor: [...currentHidden, businessId]
                };
              }
              return req;
            });
          });
        } else {
          console.error('Request not found in either state array:', requestId);
        }
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
      // Check which state array contains this request
      const requestInPhotoArray = openPhotoRequests.some(req => req.id === requestId);
      const requestInMainArray = openRequests.some(req => req.id === requestId);
      
      console.log('Request location check (show):', { requestInPhotoArray, requestInMainArray, requestId });
      
      // Update the request's hidden_by_vendor property in the correct state array
      if (requestInPhotoArray) {
        setOpenPhotoRequests(prev => {
          return prev.map(req => {
            if (req.id === requestId) {
              const currentHidden = Array.isArray(req.hidden_by_vendor) ? req.hidden_by_vendor : [];
              return {
                ...req,
                hidden_by_vendor: currentHidden.filter(id => id !== businessId)
              };
            }
            return req;
          });
        });
      } else if (requestInMainArray) {
        setOpenRequests(prev => {
          return prev.map(req => {
            if (req.id === requestId) {
              const currentHidden = Array.isArray(req.hidden_by_vendor) ? req.hidden_by_vendor : [];
              return {
                ...req,
                hidden_by_vendor: currentHidden.filter(id => id !== businessId)
              };
            }
            return req;
          });
        });
      } else {
        console.error('Request not found in either state array (show):', requestId);
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
      ? requests.filter(req => {
          const hiddenArray = Array.isArray(req.hidden_by_vendor) ? req.hidden_by_vendor : [];
          return hiddenArray.includes(businessId);
        })
      : requests.filter(req => {
          const hiddenArray = Array.isArray(req.hidden_by_vendor) ? req.hidden_by_vendor : [];
          return !hiddenArray.includes(businessId);
        });
    
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
    const cat = normalizeCategory(request.service_category || '');
    console.log('Service category (normalized):', cat);
    
    let table;
    switch (cat) {
      case "catering": table = "catering_requests"; break;
      case "videography": table = "videography_requests"; break;
      case "photography": table = "photography_requests"; break;
      case "dj": table = "dj_requests"; break;
      case "beauty": table = "beauty_requests"; break;
      case "florist": table = "florist_requests"; break;
      case "wedding planning": table = "wedding_planning_requests"; break;
      case "wedding planner": table = "wedding_planning_requests"; break;
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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsSmallMobile(window.innerWidth <= 480);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const meetsMinimumPrice = (request) => {
    // Extract price/budget from request
    const budget = parseFloat(request.price_range || request.budget_range || '0');
    
    // If there's no budget specified, return true to show the request
    if (!budget) return true;
    
    // Default minimum price if none is set
    const minimumPrice = 0;
    
    return budget >= minimumPrice;
  };

  const handleViewMore = async (requestId) => {
    // Check if user has Stripe account set up
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('stripe_account_id, Bidi_Plus')
        .eq('id', user.id)
        .single();

      const needsStripeSetup = !profile?.stripe_account_id && !profile?.Bidi_Plus;
      
      if (needsStripeSetup) {
        // Show Stripe setup modal instead of bid modal
        setShowStripeModal(true);
        return;
      }
    }
    
    setSelectedRequestId(requestId);
    setIsSlidingModalOpen(true);
  };

  const handleCloseSlidingModal = () => {
    setIsSlidingModalOpen(false);
    setSelectedRequestId(null);
  };

  if (isLoading) {
    return <LoadingSpinner color="#9633eb" size={50} />;
  }

  return (
    <>
      <style>
        {`
          .category-tabs::-webkit-scrollbar {
            display: none;
          }
          .requests-main-container {
            -webkit-overflow-scrolling: touch;
          }
        `}
      </style>
      <div className="requests-main-container" style={{
      padding: isMobile ? '10px' : '20px',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      <h1 style={{ 
        fontFamily: "Outfit", 
        fontWeight: "bold",
        fontSize: isSmallMobile ? '1.5rem' : '2rem',
        margin: isSmallMobile ? '10px 0 20px 0' : '20px 0',
        textAlign: 'center'
      }}>
        Open Requests
      </h1>
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        width: "100%", 
        marginBottom: isSmallMobile ? "15px" : "20px",
        padding: "0 10px"
      }}>
        <button
          className="toggle-hidden-button"
          onClick={() => setShowHidden((prev) => !prev)}
          style={{
            padding: isSmallMobile ? '8px 16px' : '10px 20px',
            fontSize: isSmallMobile ? '13px' : '14px',
            touchAction: 'manipulation'
          }}
        >
          {showHidden ? 
            (isSmallMobile ? "Show Active" : "Show Active Requests") : 
            (isSmallMobile ? "Show Hidden" : "Show Hidden Requests")
          }
        </button>
      </div>

      {/* Only show category tabs if user is not admin */}
      {!isAdmin && (
        <div 
          className="category-tabs" 
          style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '20px',
            overflowX: 'auto',
            padding: '0 15px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollBehavior: 'smooth'
          }}
        >
          <button
            className={`category-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '18px',
              backgroundColor: activeTab === 'all' ? '#9633eb' : '#f0f0f0',
              color: activeTab === 'all' ? 'white' : '#333',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              fontSize: '13px',
              fontWeight: '500',
              minWidth: 'fit-content',
              touchAction: 'manipulation'
            }}
          >
            All
          </button>
          {businessCategories.map(category => (
            <button
              key={category}
              className={`category-tab ${activeTab === category ? 'active' : ''}`}
              onClick={() => setActiveTab(category)}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '18px',
                backgroundColor: activeTab === category ? '#9633eb' : '#f0f0f0',
                color: activeTab === category ? 'white' : '#333',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                fontSize: '13px',
                fontWeight: '500',
                minWidth: 'fit-content',
                touchAction: 'manipulation'
              }}
            >
              {getCategoryDisplayName(category)}
            </button>
          ))}
        </div>
      )}

      {/* Search and Sorting Controls */}
      <div className="search-and-sort-container" style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '20px',
        flexDirection: 'column'
      }}>
        {/* Search Bar */}
        <div style={{ width: '100%' }}>
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Search requests..."
          />
        </div>
      </div>

      {/* Sorting Controls */}
      <div className="sorting-controls" style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '10px',
        marginBottom: '20px',
        padding: '12px 15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
        flexWrap: 'wrap',
        '@media (max-width: 768px)': {
          padding: '10px 12px',
          gap: '8px'
        }
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          flex: '1',
          minWidth: '200px'
        }}>
          <span style={{ 
            fontWeight: '600', 
            color: '#374151',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            display: !isSmallMobile ? 'block' : 'none'
          }}>
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              fontSize: '13px',
              cursor: 'pointer',
              flex: '1',
              minWidth: '140px',
              maxWidth: '200px'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="budget_high">Highest Budget</option>
            <option value="budget_low">Lowest Budget</option>
            <option value="event_date_nearest">Event Date (Nearest)</option>
            <option value="event_date_farthest">Event Date (Farthest)</option>
            <option value="location">Location (A-Z)</option>
            <option value="urgency">Most Urgent</option>
            <option value="bids">Fewest Bids</option>
          </select>
        </div>
        
        <button
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          style={{
            padding: '8px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            minWidth: '60px',
            justifyContent: 'center'
          }}
          title={`Currently sorting ${sortOrder === 'desc' ? 'descending' : 'ascending'}`}
        >
          <i className={`fas ${sortOrder === 'desc' ? 'fa-sort-amount-down' : 'fa-sort-amount-up'}`} 
             style={{ fontSize: '12px' }}></i>
          <span style={{ display: !isSmallMobile ? 'inline' : 'none' }}>
            {sortOrder === 'desc' ? 'Desc' : 'Asc'}
          </span>
        </button>
        
        <div style={{ 
          fontSize: '11px', 
          color: '#6b7280',
          whiteSpace: 'nowrap',
          alignSelf: 'center',
          minWidth: 'fit-content'
        }}>
          {(() => {
            const totalRequests = filterRequestsBySearch(
              filterRequestsByCategory(
                (() => {
                  const hasPhotoVideoCategory = businessCategories.some(cat => 
                    ["photography", "videography"].includes(normalizeCategory(cat))
                  );
                  return hasPhotoVideoCategory
                    ? filterRequestsByHidden(openPhotoRequests)
                    : filterRequestsByHidden(openRequests);
                })()
                  .filter((request) => !userSubmittedBids.has(request.id))
                  .filter(meetsMinimumPrice)
                  .filter(request => !isDatePassed(request))
                  .filter(request => isAdmin || hasMatchingCategory(request.service_category, businessCategories)),
                activeTab
              ),
              searchTerm
            ).length;
            return `${totalRequests} request${totalRequests !== 1 ? 's' : ''}${searchTerm ? ' (filtered)' : ''}`;
          })()}
        </div>
      </div>

      <div className="request-list-container" style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '0 5px' : '0 10px'
      }}>
        <div className="request-list" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isSmallMobile ? '6px' : '8px'
        }}>
          {error && <p>Error: {error}</p>}
          {sortRequests(
            filterRequestsBySearch(
              filterRequestsByCategory(
                (() => {
                  // Check if user has photo/video categories
                  const hasPhotoVideoCategory = businessCategories.some(cat => 
                    ["photography", "videography"].includes(normalizeCategory(cat))
                  );
                  
                  return hasPhotoVideoCategory
                    ? filterRequestsByHidden(openPhotoRequests)
                    : filterRequestsByHidden(openRequests);
                })()
                  .filter((request) => !userSubmittedBids.has(request.id))
                  .filter(meetsMinimumPrice)
                  .filter(request => !isDatePassed(request))
                  .filter(request => isAdmin || hasMatchingCategory(request.service_category, businessCategories)),
                activeTab
              ),
              searchTerm
            ),
            sortBy,
            sortOrder
          ).map((request) => {
            const bidCount = bidCounts[request.id] || 0;
            console.log(`Request ${request.id} (${request.event_title || request.title}) - bid count: ${bidCount}`);
            
            // If bid count is 0, let's check if this request ID exists in the unfiltered bids
            if (bidCount === 0 && allBidsUnfiltered) {
              const matchingBids = allBidsUnfiltered.filter(bid => bid.request_id === request.id);
              console.log(`Request ${request.id} - found ${matchingBids.length} bids in unfiltered data:`, matchingBids);
            }
            
            return (
              <RequestDisplayMini
                key={request.id}
                request={request}
                isPhotoRequest={request.service_category === "photography"}
                onHide={() => hideRequest(request.id, getTableName(request))}
                onShow={() => showRequest(request.id, getTableName(request))}
                isHidden={Array.isArray(request.hidden_by_vendor) ? request.hidden_by_vendor.includes(businessId) : false}
                currentVendorId={businessId}
                onMessageClick={onMessageClick}
                onViewMore={handleViewMore}

                hasSubmittedBid={userSubmittedBids.has(request.id)}
                requestUrgency={calculateRequestUrgency(request)}
                budgetMatch={assessBudgetMatch(request, { average_bid_amount: minimumPrice })}
                serviceMatch={assessServiceMatch(request, businessCategories)}
              />
            );
          })}
        </div>
      </div>

      {/* Sliding Bid Modal */}
      <SlidingBidModal
        isOpen={isSlidingModalOpen}
        onClose={handleCloseSlidingModal}
        requestId={selectedRequestId}
      />

      {/* Stripe Setup Modal */}
      <Modal show={showStripeModal} onHide={() => setShowStripeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Stripe Account Setup Required</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column align-items-center justify-content-center">
          <p className="text-center">
            To place bids and get paid for jobs you win, you'll need to set up a payment account. Bidi won't charge you to talk to users or bid — a small fee is only deducted after you've been paid.
          </p>
          <Button className="btn-secondary" onClick={() => navigate("/stripe-setup")}>Set Up Account</Button>
        </Modal.Body>
      </Modal>
      </div>
    </>
  );
}

export default OpenRequests;
