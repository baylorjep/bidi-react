import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import "../../styles/BusinessBids.css";
import WithdrawConfirmationModal from "./WithdrawConfirmationModal";
import BidDisplayMini from "./BidDisplayMini";
import LoadingSpinner from "../../components/LoadingSpinner";

const BusinessBids = () => {
  const [bids, setBids] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [isFullScreen, setIsFullScreen] = useState(window.innerWidth > 1200);
  const filteredBids = bids.filter((bid) => 
    activeTab === "approved" 
      ? bid.status === "approved" || bid.status === "accepted"
      : activeTab === "pending"
        ? bid.status === "pending" || bid.status === "interested"
        : bid.status === activeTab
  );
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const getExpirationStatus = (expirationDate) => {
    if (!expirationDate) return { status: 'normal', text: 'No expiration' };
    
    const now = new Date();
    const expiration = new Date(expirationDate);
    const diffTime = expiration - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expired', text: 'Expired' };
    if (diffDays <= 1) return { status: 'urgent', text: 'Expires today' };
    if (diffDays <= 3) return { status: 'warning', text: `Expires in ${diffDays} days` };
    return { status: 'normal', text: `Expires in ${diffDays} days` };
  };

  useEffect(() => {
    const handleResize = () => {
      setIsFullScreen(window.innerWidth > 1200);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchBusinessBids = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error(
            "❌ Error fetching user:",
            userError || "No user found."
          );
          return;
        }

        const { data: businessBids, error: bidError } = await supabase
          .from("bids")
          .select("*")
          .eq("user_id", user.id)
          .or('hidden.is.false,hidden.is.null');

        if (bidError) {
          console.error("❌ Error fetching bids:", bidError);
          return;
        }

        if (!businessBids || businessBids.length === 0) {
          setBids([]);
          setRequests([]);
          return;
        }

        setBids(businessBids);

        const requestMap = {};
        businessBids.forEach((bid) => {
          // Handle both category-specific tables and the general requests table
          const categoryTable = bid.category === 'General' 
            ? 'requests' 
            : `${bid.category.toLowerCase().replace(/\s+/g, '_')}_requests`;
          if (!requestMap[categoryTable]) requestMap[categoryTable] = [];
          requestMap[categoryTable].push(bid.request_id);
        });

        let allRequests = [];
        for (const [table, ids] of Object.entries(requestMap)) {
          // Fetch requests from the appropriate table
          const { data: requestData, error: requestError } = await supabase
            .from(table)
            .select('*')
            .in("id", ids);

          if (requestError) {
            console.error(`❌ Error fetching from ${table}:`, requestError);
            continue;
          }

          // Fetch user contact information for each request
          const requestsWithContactInfo = await Promise.all(
            requestData.map(async (request) => {
              // Get the user ID based on the table type
              const userId = request.user_id || request.profile_id;
              
              if (!userId) {
                console.warn(`⚠️ No user ID found for request ${request.id}`);
                return request;
              }

              // Fetch email from profiles table
              const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("email")
                .eq("id", userId)
                .single();

              // Fetch phone from individual_profiles table
              const { data: individualProfileData, error: individualProfileError } = await supabase
                .from("individual_profiles")
                .select("phone, first_name, last_name")
                .eq("id", userId)
                .single();

              if (profileError) {
                console.error(`❌ Error fetching profile info for request ${request.id}:`, profileError);
              }
              if (individualProfileError) {
                console.error(`❌ Error fetching individual profile info for request ${request.id}:`, individualProfileError);
              }

              return {
                ...request,
                user_email: profileData?.email,
                user_phone: individualProfileData?.phone,
                user_first_name: individualProfileData?.first_name,
                user_last_name: individualProfileData?.last_name
              };
            })
          );

          allRequests = [...allRequests, ...requestsWithContactInfo];
        }

        setRequests(allRequests);
      } catch (error) {
        console.error(
          "❌ An error occurred while fetching business bids:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessBids();
  }, []);

  const handleRemoveBid = async (bidId) => {
    try {
      const { data, error } = await supabase
        .from("bids")
        .update({ hidden: true }) // Mark the bid as hidden
        .eq("id", bidId);

      if (error) {
        console.error("Error updating bid:", error);
      } else {
        // Update the local state to reflect the change immediately
        setBids((prevBids) => prevBids.filter((bid) => bid.id !== bidId));
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const openWithdrawModal = (bidId) => {
    console.log("Opening modal for bid ID:", bidId); // Debug log
    setSelectedBidId(bidId); // Set the bid ID to withdraw
    setShowWithdrawModal(true); // Show the modal
  };

  const closeWithdrawModal = () => {
    setSelectedBidId(null); // Clear the selected bid ID
    setShowWithdrawModal(false); // Hide the modal
  };

  const confirmWithdraw = () => {
    if (selectedBidId) {
      handleRemoveBid(selectedBidId); // Call the remove bid function
    }
    closeWithdrawModal(); // Close the modal
  };

  // Group bids by status
const pendingBids = bids.filter((bid) =>
  bid.status === "pending" || bid.status === "interested"
);

  const approvedBids = bids.filter((bid) => bid.status === "approved" || bid.status === "accepted");
  const deniedBids = bids.filter((bid) => bid.status === "denied");

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Invalid Date";
    }
  };

  const renderTabSelector = () => (
    <div className="status-tabs">
      {["pending", "approved", "denied"].map((status) => (
        <button
          key={status}
          className={`tab-button ${status} ${
            activeTab === status ? "active" : ""
          }`}
          onClick={() => setActiveTab(status)}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)} (
          {status === "approved" 
            ? bids.filter((bid) => bid.status === "approved" || bid.status === "accepted").length
            : bids.filter((bid) => bid.status === status).length})
        </button>
      ))}
    </div>
  );

  const renderMobileBids = () => (
    <div className="bids-grid-container">
      {filteredBids.length > 0 ? (
        <div className="request-grid">
          {filteredBids.map((bid) => {
            const request = requests.find((req) => req.id === bid.request_id);
            return (
              request && (
                <BidDisplayMini
                  key={bid.id}
                  bid={bid}
                  request={request}
                  onEditBid={(requestId, bidId) =>
                    navigate(`/edit-bid/${requestId}/${bidId}`)
                  }
                  openWithdrawModal={openWithdrawModal}
                />
              )
            );
          })}
        </div>
      ) : (
        <p className="no-bids-text">No {activeTab.toLowerCase()} bids.</p>
      )}
    </div>
  );

  // Function to render the job cards inside status sections
  const renderStatusSection = (status, title, colorClass, bidsList) => (
    <div className={`bids-status-column ${colorClass}`} key={status}>
      <div className="bids-status-header">
        <span>{title}</span>
        <span className={`status-number ${colorClass}`}>{bidsList.length}</span>
      </div>
      <div className={`status-underline ${colorClass}`}></div>
      <br />
      {bidsList.length > 0 ? (
        <div className="request-grid-container">
          <div className="request-grid">
            {bidsList.map((bid) => {
              const request = requests.find((req) => req.id === bid.request_id);
              return (
                request && (
                  <BidDisplayMini
                    key={bid.id}
                    bid={bid}
                    request={request}
                    onEditBid={(requestId, bidId) =>
                      navigate(`/edit-bid/${requestId}/${bidId}`)
                    }
                    openWithdrawModal={openWithdrawModal}
                  />
                )
              );
            })}
          </div>
        </div>
      ) : (
        <p className="no-bids-text">No {title.toLowerCase()} bids.</p>
      )}
    </div>
  );

  const renderBidCard = (bid) => {
    const expirationStatus = getExpirationStatus(bid.expiration_date);
    return (
      <BidDisplayMini
        key={bid.id}
        bid={{
          ...bid,
          expirationStatus: expirationStatus
        }}
        request={requests.find((req) => req.id === bid.request_id)}
        onEditBid={(requestId, bidId) => navigate(`/edit-bid/${requestId}/${bidId}`)}
        openWithdrawModal={openWithdrawModal}
      />
    );
  };

  // Contract upload handler
  const handleContractUpload = async (bid, file) => {
    if (!file) return;
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `contracts/bid-${bid.id}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('contracts').upload(filePath, file, { upsert: true });
      if (uploadError) {
        alert('Failed to upload contract: ' + uploadError.message);
        return;
      }
      // Get public URL
      const { data: urlData } = supabase.storage.from('contracts').getPublicUrl(filePath);
      const contractUrl = urlData?.publicUrl;
      // Update bid with contract_url
      const { error: updateError } = await supabase.from('bids').update({ contract_url: contractUrl }).eq('id', bid.id);
      if (updateError) {
        alert('Failed to update bid with contract URL: ' + updateError.message);
        return;
      }
      // Update local state
      setBids((prevBids) => prevBids.map((b) => b.id === bid.id ? { ...b, contract_url: contractUrl } : b));
      alert('Contract uploaded successfully!');
    } catch (err) {
      alert('Error uploading contract: ' + err.message);
    }
  };

  if (isLoading) {
    return <LoadingSpinner color="#9633eb" size={50} />;
  }

  return (
    <div className="business-bids-container">
      {/* Always Render Tab Selector */}
      <div className="bids-status-container">{renderTabSelector()}</div>

      {/* Render Bids */}
      <div className="bids-grid-container">
        {filteredBids.length > 0 ? (
          <div className="request-grid">
            {filteredBids.map((bid) => {
              const request = requests.find((req) => req.id === bid.request_id);
              return (
                request && (
                  <BidDisplayMini
                    key={bid.id}
                    bid={bid}
                    request={request}
                    onEditBid={(requestId, bidId) =>
                      navigate(`/edit-bid/${requestId}/${bidId}`)
                    }
                    openWithdrawModal={openWithdrawModal}
                    onContractUpload={handleContractUpload}
                  />
                )
              );
            })}
          </div>
        ) : (
          <p className="no-bids-text">No {activeTab.toLowerCase()} bids.</p>
        )}
      </div>

      {/* Withdraw Confirmation Modal */}
      {showWithdrawModal && (
        <WithdrawConfirmationModal
          show={showWithdrawModal}
          onClose={closeWithdrawModal}
          onConfirm={confirmWithdraw}
        />
      )}
    </div>
  );
};

export default BusinessBids;
