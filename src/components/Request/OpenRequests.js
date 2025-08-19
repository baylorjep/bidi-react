import React, { useState, useEffect, useCallback } from "react";
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
  },
  venue: { table: "requests", legacy: "venue" }
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
  
  // New state for bid readiness assessment
  const [bidCounts, setBidCounts] = useState({});
  const [userSubmittedBids, setUserSubmittedBids] = useState(new Set());
  const [allBidsUnfiltered, setAllBidsUnfiltered] = useState([]);
  
  // Sorting state
  const [sortBy, setSortBy] = useState("newest");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(20); // Process 20 requests at a time
  const [totalPages, setTotalPages] = useState(1);
  
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
    // Use string comparison to handle type mismatches
    const bidSet = new Set(bids.map((bid) => String(bid.request_id)));
    setUserSubmittedBids(bidSet);
    return bidSet;
  };

  // New function to fetch bid counts for requests
  const fetchBidCounts = async () => {
    console.log('=== fetchBidCounts called ===');
    console.log('Current openRequests length:', openRequests.length);
    console.log('Current openPhotoRequests length:', openPhotoRequests.length);
    console.log('Current bidCounts state:', bidCounts);
    
    try {
      console.log('Fetching bid counts...');
      
      // Get ALL bids without any filtering to see what's there
      const { data: allBidsData, error: allBidsError } = await supabase
        .from("bids")
        .select("request_id, id, user_id, category");

      if (allBidsError) {
        console.error("Error fetching all bids:", allBidsError);
        return;
      }

      console.log('All bids data:', allBidsData);
      console.log('Total bids found:', allBidsData?.length || 0);

      // Process the bid counts
      const counts = {};
      if (allBidsData && allBidsData.length > 0) {
        allBidsData.forEach(bid => {
          const requestId = bid.request_id;
          if (requestId) {
            // Log the data types for debugging
            console.log(`Bid ${bid.id}: request_id = ${requestId} (type: ${typeof requestId})`);
            // Use string comparison to handle type mismatches
            const stringRequestId = String(requestId);
            counts[stringRequestId] = (counts[stringRequestId] || 0) + 1;
          }
        });
      }

      console.log('Processed bid counts:', counts);
      console.log('Unique request IDs with bids:', Object.keys(counts));
      console.log('Sample counts:', Object.entries(counts).slice(0, 5));
      
      // Check if any of our current requests have bids
      const allRequestIds = [...openRequests, ...openPhotoRequests].map(r => String(r.id));
      console.log('All current request IDs:', allRequestIds);
      
      const requestsWithBids = allRequestIds.filter(reqId => counts[reqId]);
      const requestsWithoutBids = allRequestIds.filter(reqId => !counts[reqId]);
      
      console.log('Requests WITH bids:', requestsWithBids);
      console.log('Requests WITHOUT bids:', requestsWithoutBids);
      console.log('Bid counts for current requests:', allRequestIds.map(reqId => ({
        requestId: reqId,
        bidCount: counts[reqId] || 0
      })));
      
      setBidCounts(counts);
      setAllBidsUnfiltered(allBidsData || []);
      
      // Debug bid counting after setting state
      setTimeout(() => {
        if (openRequests.length > 0 || openPhotoRequests.length > 0) {
          
        }
      }, 100);
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
          "wedding planner/coordinator",
          "venue"
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
          
          // Debug: Show the actual request IDs and their types
          if (allRequests.length > 0) {
            console.log('=== REQUEST ID DEBUGGING ===');
            allRequests.slice(0, 10).forEach((req, index) => {
              console.log(`Request ${index + 1}:`, {
                id: req.id,
                id_type: typeof req.id,
                service_category: req.service_category,
                title: req.service_title || req.event_title
              });
            });
          }
          
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
        
        // Debug: Show the actual request IDs and their types for non-admin users
        if (allRequests.length > 0) {
          console.log('=== NON-ADMIN REQUEST ID DEBUGGING ===');
          allRequests.slice(0, 10).forEach((req, index) => {
            console.log(`Request ${index + 1}:`, {
              id: req.id,
              id_type: typeof req.id,
              service_category: req.service_category,
              title: req.service_title || req.event_title,
              table_name: req.table_name
            });
          });
        }
        
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

    // Fetch requests first, then bid counts to ensure proper order
    fetchRequests().then(() => {
      // Always fetch bid counts - they're needed for all users including admins
      console.log('About to call fetchBidCounts, businessId:', businessId);
      console.log('Calling fetchBidCounts...');
      fetchBidCounts();
    });
  }, [businessCategories, isAdmin, businessId]);

  // Add debugging to see when the component mounts and what the values are
  useEffect(() => {
    console.log('=== OpenRequests useEffect triggered ===');
    console.log('businessCategories:', businessCategories);
    console.log('isAdmin:', isAdmin);
    console.log('businessId:', businessId);
  }, [businessCategories, isAdmin, businessId]);

  // Add a separate effect to fetch bid counts when requests change
  useEffect(() => {
    if ((openRequests.length > 0 || openPhotoRequests.length > 0) && Object.keys(bidCounts).length === 0) {
      console.log('Requests loaded, fetching bid counts...');
      console.log('Sample request IDs:', [
        ...openRequests.slice(0, 3).map(r => ({ id: r.id, type: typeof r.id, table: r.table_name })),
        ...openPhotoRequests.slice(0, 3).map(r => ({ id: r.id, type: typeof r.id, table: r.table_name }))
      ]);
      fetchBidCounts();
    }
  }, [openRequests, openPhotoRequests, bidCounts]);

  // Force re-render when bid counts change to update the UI
  useEffect(() => {
    if (Object.keys(bidCounts).length > 0) {
      console.log('Bid counts updated, forcing re-render...');
      console.log('Updated bid counts:', bidCounts);
      // This will trigger a re-render of the component with updated bid counts
    }
  }, [bidCounts]);



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
        if (!hidden.includes(String(businessId))) {
          hidden.push(String(businessId));
          console.log('Added businessId to hidden array');
        }
      } else {
        hidden = hidden.filter(id => id !== String(businessId));
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
                  hidden_by_vendor: [...currentHidden, String(businessId)]
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
                  hidden_by_vendor: [...currentHidden, String(businessId)]
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
                hidden_by_vendor: currentHidden.filter(id => id !== String(businessId))
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
                hidden_by_vendor: currentHidden.filter(id => id !== String(businessId))
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
          return hiddenArray.includes(String(businessId));
        })
      : requests.filter(req => {
          const hiddenArray = Array.isArray(req.hidden_by_vendor) ? req.hidden_by_vendor : [];
          return !hiddenArray.includes(String(businessId));
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
      case "venue": table = "requests"; break;
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
      case "venue": return "Venue";
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
    console.log('=== handleViewMore called ===');
    console.log('requestId:', requestId);
    console.log('requestId type:', typeof requestId);
  
    
    console.log('Setting selectedRequestId to:', requestId);
    setSelectedRequestId(requestId);
    setIsSlidingModalOpen(true);
  };

  const handleCloseSlidingModal = () => {
    setIsSlidingModalOpen(false);
    setSelectedRequestId(null);
  };

  // Helper function to get paginated requests
  const getPaginatedRequests = (requests) => {
    const startIndex = (currentPage - 1) * requestsPerPage;
    const endIndex = startIndex + requestsPerPage;
    return requests.slice(startIndex, endIndex);
  };

  // Calculate total pages when requests change
  useEffect(() => {
    const allRequests = [...openRequests, ...openPhotoRequests];
    const filteredRequests = filterRequestsBySearch(
      filterRequestsByCategory(
        (() => {
          const hasPhotoVideoCategory = businessCategories.some(cat => 
            ["photography", "videography"].includes(normalizeCategory(cat))
          );
          
          return hasPhotoVideoCategory
            ? filterRequestsByHidden(openPhotoRequests)
            : filterRequestsByHidden(openRequests);
        })()
          .filter((request) => !userSubmittedBids.has(String(request.id)))
          .filter(meetsMinimumPrice)
          .filter(request => !isDatePassed(request))
          .filter(request => isAdmin || hasMatchingCategory(request.service_category, businessCategories)),
        activeTab
      ),
      searchTerm
    );
    
    const total = Math.ceil(filteredRequests.length / requestsPerPage);
    setTotalPages(total);
    
    // Reset to first page if current page is out of bounds
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [openRequests, openPhotoRequests, currentPage, activeTab, searchTerm, businessCategories, isAdmin, userSubmittedBids]);

  // Handle page changes
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, businessCategories]);

  // Function to render requests with proper bid counts
  const renderRequests = () => {
    if (Object.keys(bidCounts).length === 0) {
      return null;
    }

    // Get all filtered and sorted requests first
    const allFilteredRequests = sortRequests(
      filterRequestsBySearch(
        filterRequestsByCategory(
          (() => {
            const hasPhotoVideoCategory = businessCategories.some(cat => 
              ["photography", "videography"].includes(normalizeCategory(cat))
            );
            
            return hasPhotoVideoCategory
              ? filterRequestsByHidden(openPhotoRequests)
              : filterRequestsByHidden(openRequests);
          })()
            .filter((request) => !userSubmittedBids.has(String(request.id)))
            .filter(meetsMinimumPrice)
            .filter(request => !isDatePassed(request))
            .filter(request => isAdmin || hasMatchingCategory(request.service_category, businessCategories)),
          activeTab
        ),
        searchTerm
      ),
      sortBy,
      sortOrder
    );
    
    // Get only the current page's requests
    const currentPageRequests = getPaginatedRequests(allFilteredRequests);
    
    // console.log(`=== RENDERING PAGE ${currentPage} ===`);
    // console.log(`Total filtered requests: ${allFilteredRequests.length}`);
    // console.log(`Current page requests: ${currentPageRequests.length}`);
    // console.log(`Requests per page: ${requestsPerPage}`);
    // console.log(`Total pages: ${totalPages}`);
    
    return currentPageRequests.map((request) => {
      // Use string comparison to handle type mismatches
      const stringRequestId = String(request.id);
      const bidCount = bidCounts[stringRequestId] || 0;
      
      // Create a new request object with the bid count attached
      const requestWithBidCount = {
        ...request,
        bid_count: bidCount,
        has_bids: bidCount > 0  // Ensure has_bids matches the actual bid count
      };
      
      return (
        <RequestDisplayMini
          key={request.id}
          request={requestWithBidCount}
          isPhotoRequest={request.service_category === "photography"}
          onHide={() => hideRequest(request.id, getTableName(request))}
          onShow={() => showRequest(request.id, getTableName(request))}
          isHidden={Array.isArray(request.hidden_by_vendor) ? request.hidden_by_vendor.includes(String(businessId)) : false}
          currentVendorId={businessId}
          onMessageClick={onMessageClick}
          onViewMore={handleViewMore}

          hasSubmittedBid={userSubmittedBids.has(String(request.id))}
          requestUrgency={calculateRequestUrgency(request)}
          budgetMatch={assessBudgetMatch(request, { average_bid_amount: minimumPrice })}
          serviceMatch={assessServiceMatch(request, businessCategories)}
        />
      );
    });
  };

  // Function to mark requests as seen when they come into view
  const markRequestAsSeenOnScroll = useCallback(async (requestId) => {
    if (!businessId) return;

    try {
      // Find the request in our state
      const request = [...openRequests, ...openPhotoRequests].find(req => req.id === requestId);
      if (!request) return;

      // Check if already seen
      const hasSeen = Array.isArray(request.has_seen) && request.has_seen.includes(businessId);
      if (hasSeen) return;

      const tableName = getTableName(request);
      
      // Update the has_seen field
      const { error } = await supabase
        .from(tableName)
        .update({ 
          has_seen: supabase.sql`COALESCE(has_seen, '[]'::jsonb) || '["${businessId}"]'::jsonb` 
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error marking request as seen on scroll:', error);
      } else {
        // Update local state
        const updateState = (prevRequests) => 
          prevRequests.map(req => 
            req.id === requestId 
              ? { ...req, has_seen: [...(req.has_seen || []), businessId] }
              : req
          );

        if (openPhotoRequests.some(req => req.id === requestId)) {
          setOpenPhotoRequests(updateState);
        } else {
          setOpenRequests(updateState);
        }
      }
    } catch (error) {
      console.error('Error marking request as seen on scroll:', error);
    }
  }, [businessId, openRequests, openPhotoRequests]);

  // Function to mark requests as seen by the current vendor
  const markRequestsAsSeen = useCallback(async (requests) => {
    if (!businessId || !requests || requests.length === 0) return;

    try {
      // Group requests by table name for efficient updates
      const requestsByTable = {};
      
      requests.forEach(request => {
        const tableName = getTableName(request);
        if (!requestsByTable[tableName]) {
          requestsByTable[tableName] = [];
        }
        requestsByTable[tableName].push(request.id);
      });

      // Update each table's has_seen field
      for (const [tableName, requestIds] of Object.entries(requestsByTable)) {
        try {
          // Update has_seen to include current user's ID for all requests in this table
          const { error } = await supabase
            .from(tableName)
            .update({ 
              has_seen: supabase.sql`COALESCE(has_seen, '[]'::jsonb) || '["${businessId}"]'::jsonb` 
            })
            .in('id', requestIds)
            .not("hidden_by_vendor", "cs.{${businessId}}")
            .or(`has_seen.is.null,not(has_seen.cs.{${businessId}})`)
            .eq("status", "open");

          if (error) {
            console.error(`Error updating ${tableName} has_seen:`, error);
          }
        } catch (error) {
          console.error(`Error updating ${tableName}:`, error);
        }
      }

      // Update local state to reflect that requests have been seen
      const updatedRequests = requests.map(request => ({
        ...request,
        has_seen: Array.isArray(request.has_seen) 
          ? [...request.has_seen, businessId]
          : [businessId]
      }));

      // Update the appropriate state array
      if (openPhotoRequests.some(req => req.id === requests[0].id)) {
        setOpenPhotoRequests(prev => 
          prev.map(req => {
            const updated = updatedRequests.find(u => u.id === req.id);
            return updated || req;
          })
        );
      } else {
        setOpenRequests(prev => 
          prev.map(req => {
            const updated = updatedRequests.find(u => u.id === req.id);
            return updated || req;
          })
        );
      }

    } catch (error) {
      console.error("Error marking requests as seen:", error);
    }
  }, [businessId, openRequests, openPhotoRequests]);

  // Set up Intersection Observer to mark requests as seen when they come into view
  useEffect(() => {
    if (!businessId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const requestId = entry.target.getAttribute('data-request-id');
            if (requestId) {
              markRequestAsSeenOnScroll(requestId);
            }
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '50px' // Start observing 50px before the element comes into view
      }
    );

    // Observe all request elements
    const requestElements = document.querySelectorAll('[data-request-id]');
    requestElements.forEach((element) => observer.observe(element));

    return () => {
      requestElements.forEach((element) => observer.unobserve(element));
      observer.disconnect();
    };
  }, [businessId, openRequests, openPhotoRequests, markRequestAsSeenOnScroll]);

  // Mark requests as seen when they're displayed
  useEffect(() => {
    if (businessId && (openRequests.length > 0 || openPhotoRequests.length > 0)) {
      // Get the current page's requests that are visible
      const allFilteredRequests = filterRequestsBySearch(
        filterRequestsByCategory(
          (() => {
            const hasPhotoVideoCategory = businessCategories.some(cat => 
              ["photography", "videography"].includes(normalizeCategory(cat))
            );
            
            return hasPhotoVideoCategory
              ? filterRequestsByHidden(openPhotoRequests)
              : filterRequestsByHidden(openRequests);
          })()
            .filter((request) => !userSubmittedBids.has(String(request.id)))
            .filter(meetsMinimumPrice)
            .filter(request => !isDatePassed(request))
            .filter(request => isAdmin || hasMatchingCategory(request.service_category, businessCategories)),
          activeTab
        ),
        searchTerm
      );
      
      const currentPageRequests = getPaginatedRequests(allFilteredRequests);
      
      // Mark only the current page's requests as seen
      if (currentPageRequests.length > 0) {
        markRequestsAsSeen(currentPageRequests);
      }
    }
  }, [currentPage, activeTab, searchTerm, businessCategories, businessId, openRequests, openPhotoRequests, userSubmittedBids, isAdmin, markRequestsAsSeen]);

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
        
        {/* Debug button removed - issue has been fixed */}
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
                  .filter((request) => !userSubmittedBids.has(String(request.id)))
                  .filter(meetsMinimumPrice)
                  .filter(request => !isDatePassed(request))
                  .filter(request => isAdmin || hasMatchingCategory(request.service_category, businessCategories)),
                activeTab
              ),
              searchTerm
            ).length;
            
            const startIndex = (currentPage - 1) * requestsPerPage + 1;
            const endIndex = Math.min(currentPage * requestsPerPage, totalRequests);
            
            return `${startIndex}-${endIndex} of ${totalRequests} request${totalRequests !== 1 ? 's' : ''}${searchTerm ? ' (filtered)' : ''}${totalPages > 1 ? ` • Page ${currentPage} of ${totalPages}` : ''}`;
          })()}
        </div>
      </div>

      <div className="request-list-container" style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '0 5px' : '0 10px'
      }}>
        {/* Show loading message if bid counts aren't ready yet */}
        {Object.keys(bidCounts).length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            color: '#666',
            fontSize: '14px'
          }}>
            Loading bid counts...
          </div>
        )}
        
        <div className="request-list" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isSmallMobile ? '6px' : '8px'
        }}>
          {error && <p>Error: {error}</p>}
          {/* Render requests using the dedicated function */}
          {renderRequests()}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          border: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
              color: currentPage === 1 ? '#9ca3af' : '#374151',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <i className="fas fa-chevron-left" style={{ fontSize: '12px' }}></i>
            Previous
          </button>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#374151'
          }}>
            <span>Page</span>
            <span style={{ fontWeight: '600' }}>{currentPage}</span>
            <span>of</span>
            <span style={{ fontWeight: '600' }}>{totalPages}</span>
          </div>
          
          {/* Page Jump Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px'
          }}>
            <span>Go to:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value=""
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  handlePageChange(page);
                  e.target.value = '';
                }
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    handlePageChange(page);
                    e.target.value = '';
                  }
                }
              }}
              style={{
                width: '50px',
                padding: '4px 6px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                textAlign: 'center'
              }}
              placeholder="Page #"
            />
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'white',
              color: currentPage === totalPages ? '#9ca3af' : '#374151',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Next
            <i className="fas fa-chevron-right" style={{ fontSize: '12px' }}></i>
          </button>
        </div>
      )}

      {/* Sliding Bid Modal */}
      <SlidingBidModal
        isOpen={isSlidingModalOpen}
        onClose={handleCloseSlidingModal}
        requestId={selectedRequestId}
      />
      {isSlidingModalOpen && (
        <div style={{ display: 'none' }}>
          {console.log('=== Modal opened with selectedRequestId ===', selectedRequestId)}
        </div>
      )}
      </div>
    </>
  );
}

export default OpenRequests;
