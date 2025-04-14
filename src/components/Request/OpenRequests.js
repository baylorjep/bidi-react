import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import RequestDisplayMini from "./RequestDisplayMini";
import "../../App.css";
import SearchBar from "../SearchBar/SearchBar";
import LoadingSpinner from "../../components/LoadingSpinner";

const BUSINESS_TYPE_MAPPING = {
  cake: ["cake"],
  "wedding planner/coordinator": ["wedding planner", "rental"],
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
};

function OpenRequests() {
  const [openRequests, setOpenRequests] = useState([]);
  const [openPhotoRequests, setOpenPhotoRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [userBids, setUserBids] = useState(new Set()); // Add this new state
  const [minimumPrice, setMinimumPrice] = useState(null);
  const [hiddenRequests, setHiddenRequests] = useState(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      } catch (err) {
        console.error("Error fetching business type:", err);
        setError("Error fetching business type.");
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchUserBusinessType();
  }, []);

  useEffect(() => {
    // Load hidden requests from localStorage
    const hidden = JSON.parse(localStorage.getItem("hiddenRequests") || "[]");
    setHiddenRequests(new Set(hidden));
  }, []);

  const hideRequest = (requestId) => {
    const newHiddenRequests = new Set(hiddenRequests);
    newHiddenRequests.add(requestId);
    setHiddenRequests(newHiddenRequests);
    localStorage.setItem(
      "hiddenRequests",
      JSON.stringify([...newHiddenRequests])
    );
  };

  const showRequest = (requestId) => {
    const newHiddenRequests = new Set(hiddenRequests);
    newHiddenRequests.delete(requestId);
    setHiddenRequests(newHiddenRequests);
    localStorage.setItem(
      "hiddenRequests",
      JSON.stringify([...newHiddenRequests])
    );
  };

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
    if (!businessType) return;

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
        ];

        // Check if current business type is in valid categories
        const isValidCategory = validCategories.includes(
          businessType.toLowerCase()
        );
        const isPhotoVideo = ["photography", "videography"].includes(
          businessType.toLowerCase()
        );

        if (isValidCategory) {
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
          } else {
            // Original logic for other categories
            const categoryInfo =
              SERVICE_CATEGORY_MAPPING[businessType.toLowerCase()];

            const [specificTableData, legacyRequestsData] = await Promise.all([
              supabase
                .from(categoryInfo.table)
                .select("*")
                .in("status", ["pending", "open"])
                .order("created_at", { ascending: false }),
              supabase
                .from("requests")
                .select("*")
                .eq("service_category", categoryInfo.legacy)
                .eq("open", true)
                .order("created_at", { ascending: false }),
            ]);

            console.log("Fetching requests for:", businessType);
            console.log("From specific table:", categoryInfo.table);
            console.log("Legacy category:", categoryInfo.legacy);
            console.log(
              "Specific table results:",
              specificTableData.data?.length
            );
            console.log(
              "Legacy table results:",
              legacyRequestsData.data?.length
            );

            const combinedRequests = [
              ...(specificTableData.data?.map((req) => ({
                ...req,
                table_name: categoryInfo.table,
                service_title:
                  req.title ||
                  req.event_title ||
                  `${req.event_type} ${businessType} Request`,
                service_category: categoryInfo.legacy,
              })) || []),
              ...(legacyRequestsData.data?.map((req) => ({
                ...req,
                table_name: "requests",
                service_title:
                  req.service_title || req.title || `${businessType} Request`,
                service_category: categoryInfo.legacy,
              })) || []),
            ];

            if (businessType.toLowerCase() === "photography") {
              setOpenPhotoRequests(combinedRequests);
              setOpenRequests([]);
            } else {
              setOpenRequests(combinedRequests);
              setOpenPhotoRequests([]);
            }
          }
        } else {
          // Fetch ALL requests when business type is not in valid categories
          const [
            photoData,
            djData,
            cateringData,
            beautyData,
            videoData,
            floristData,
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
              .from("requests")
              .select("*")
              .eq("open", true) // Keep using boolean for legacy table
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
            ...(legacyData.data || []),
          ];

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
  }, [businessType]);

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

  const sortByNewAndDate = (a, b) => {
    const aIsNew = isNew(a.created_at);
    const bIsNew = isNew(b.created_at);
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  };

  if (isLoading) {
    return <LoadingSpinner color="#9633eb" size={50} />;
  }

  return (
    <div>
      <h1 style={{ fontFamily: "Outfit", fontWeight: "bold" }}>
        Open Requests
      </h1>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          marginBottom: "20px",
        }}
      >
        <button
          className="toggle-hidden-button"
          onClick={() => setShowHidden(!showHidden)}
        >
          {showHidden ? "Show Active Requests" : "Show Hidden Requests"}
        </button>
      </div>

      <div className="request-grid-container">
        <div className="request-grid">
          {error && <p>Error: {error}</p>}

          {["photography", "videography"].includes(businessType?.toLowerCase())
            ? openPhotoRequests
                .filter((request) => !userBids.has(request.id))
                .filter((request) =>
                  showHidden
                    ? hiddenRequests.has(request.id)
                    : !hiddenRequests.has(request.id)
                )
                .filter(meetsMinimumPrice) // Add minimum price filter
                .sort(sortByNewAndDate)
                .map((request) => (
                  <RequestDisplayMini
                    key={`photo-video-${request.id}`}
                    request={request}
                    isPhotoRequest={request.service_category === "photography"}
                    onHide={() => hideRequest(request.id)}
                    onShow={() => showRequest(request.id)}
                    isHidden={hiddenRequests.has(request.id)}
                  />
                ))
            : openRequests
                .filter((request) => !userBids.has(request.id))
                .filter((request) =>
                  showHidden
                    ? hiddenRequests.has(request.id)
                    : !hiddenRequests.has(request.id)
                )
                .filter(meetsMinimumPrice) // Add minimum price filter
                .sort(sortByNewAndDate)
                .map((request) => (
                  <RequestDisplayMini
                    key={`regular-${request.id}`}
                    request={request}
                    isPhotoRequest={false}
                    onHide={() => hideRequest(request.id)}
                    onShow={() => showRequest(request.id)}
                    isHidden={hiddenRequests.has(request.id)}
                  />
                ))}

          {/* {openRequests.length === 0 && openPhotoRequests.length === 0 && (
            <div>
              <h2>No open requests found.</h2>
              <p>Please check again later.</p>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}

export default OpenRequests;
