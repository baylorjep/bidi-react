import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import "../../styles/BusinessBids.css";
import WithdrawConfirmationModal from "./WithdrawConfirmationModal";
import BidDisplayRow from "./BidDisplayRow";
import LoadingSpinner from "../../components/LoadingSpinner";
import ChatInterface from "../Messaging/ChatInterface";
import MessagingView from "../Messaging/MessagingView";

const BusinessBids = ({ setActiveSection }) => {
  const [bids, setBids] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isFullScreen, setIsFullScreen] = useState(window.innerWidth > 1200);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc' = newest first, 'asc' = oldest first
  const [sortType, setSortType] = useState('date'); // 'date', 'amount', 'eventDate', 'bidDate', 'status'
  const filteredBids = bids
    .filter((bid) => {
      switch (activeTab) {
        case "all":
          return true;
        case "ai_generated":
          return bid.is_ai_generated === true;
        case "approved":
          return (bid.status === "approved" || bid.status === "accepted") && bid.status !== "paid";
        case "pending":
          return bid.status === "pending" || bid.status === "interested";
        case "fully_paid":
          return bid.status === "paid" && bid.payment_type === "full";
        case "down_payment":
          return bid.status === "paid" && bid.payment_type === "down_payment";
        case "denied":
          return bid.status === "denied";
        default:
          return bid.status === activeTab;
      }
    })
    .filter((bid) => {
      if (!searchQuery) return true;
      const request = requests.find((req) => req.id === bid.request_id);
      const title = request?.title || request?.service_title || request?.event_title || "";
      const clientName = `${request?.user_first_name || ''} ${request?.user_last_name || ''}`.toLowerCase();
      return (
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clientName.includes(searchQuery.toLowerCase())
      );
    });
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
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchBusinessBids = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !currentUser) {
          console.error(
            "❌ Error fetching user:",
            userError || "No user found."
          );
          return;
        }
        setUser(currentUser);

        const { data: businessBids, error: bidError } = await supabase
          .from("bids")
          .select("*")
          .eq("user_id", currentUser.id)
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

  const approvedBids = bids.filter((bid) => 
    (bid.status === "approved" || bid.status === "accepted") && bid.status !== "paid"
  );
  const deniedBids = bids.filter((bid) => bid.status === "denied");
  const fullyPaidBids = bids.filter((bid) => 
    bid.status === "paid" && bid.payment_type === "full"
  );
  const downPaymentPaidBids = bids.filter((bid) => 
    bid.status === "paid" && bid.payment_type === "down_payment"
  );

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Invalid Date";
    }
  };

  const handleEditBid = (requestId, bidId) => {
    navigate(`/edit-bid/${requestId}/${bidId}`);
  };

  const renderTabSelector = () => {
    const getTabCount = (status) => {
      switch (status) {
        case 'all':
          return bids.length;
        case 'ai_generated':
          return bids.filter((bid) => bid.is_ai_generated === true).length;
        case 'fully_paid':
          return fullyPaidBids.length;
        case 'down_payment':
          return downPaymentPaidBids.length;
        case 'approved':
          return bids.filter((bid) => bid.status === "approved" || bid.status === "accepted").length;
        default:
          return bids.filter((bid) => bid.status === status).length;
      }
    };

    return (
      <div className="status-tabs">
        {["all", "ai_generated", "pending", "approved", "fully_paid", "down_payment", "denied"].map((status) => {
          const displayText = status === 'ai_generated' ? 'AI Generated' : status.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          return (
            <button
              key={status}
              className={`tab-button ${status} ${activeTab === status ? "active" : ""}`}
              onClick={() => setActiveTab(status)}
            >
              {displayText} ({getTabCount(status)})
            </button>
          );
        })}
      </div>
    );
  };

  const getFollowUpStatus = (bid) => {
    if (!bid.created_at) return { canFollowUp: false, message: 'Invalid bid date' };
    
    const bidCreatedAt = new Date(bid.created_at);
    const now = new Date();
    const hoursSinceBid = (now - bidCreatedAt) / (1000 * 60 * 60);
    
    // Can't follow up within first 24 hours
    if (hoursSinceBid < 24) {
      const remainingHours = Math.ceil(24 - hoursSinceBid);
      return { 
        canFollowUp: false, 
        message: `Can follow up in ${remainingHours}h`,
        status: 'waiting'
      };
    }
    
    // Check if already followed up recently
    if (bid.followed_up) {
      const lastFollowUp = new Date(bid.updated_at);
      const daysSinceLastFollowUp = (now - lastFollowUp) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastFollowUp < 7) {
        const remainingDays = Math.ceil(7 - daysSinceLastFollowUp);
        return { 
          canFollowUp: false, 
          message: `Can follow up in ${remainingDays}d`,
          status: 'recent'
        };
      }
    }
    
    return { 
      canFollowUp: true, 
      message: 'Ready to follow up',
      status: 'ready'
    };
  };

  const renderBidsTable = () => (
    <div className="bids-table-container">
      {/* Table Header */}
      <div className="bids-table-header" style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px',
        background: '#f8f9fa',
        borderBottom: '2px solid #ececf0',
        fontWeight: 600,
        fontSize: '0.9rem',
        color: '#6b6b7a'
      }}>
        <div style={{ flex: 2 }}>Request</div>
        <div style={{ flex: 1, textAlign: 'center' }}>Bid Amount</div>
        <div style={{ flex: 1, textAlign: 'center' }}>Status</div>
        <div style={{ flex: 1, textAlign: 'center' }}>Follow-up</div>
        <div style={{ flex: 1, textAlign: 'center' }}>Actions</div>
      </div>

      {/* Table Body */}
      <div className="bids-table-body">
        {filteredBids.length > 0 ? (
          filteredBids.map((bid) => {
            const request = requests.find((req) => req.id === bid.request_id);
            const followUpStatus = getFollowUpStatus(bid);
            return (
              request && (
                <BidDisplayRow
                  key={bid.id}
                  bid={bid}
                  request={request}
                  bidDate={bid.created_at}
                  followUpStatus={followUpStatus}
                  onEditBid={handleEditBid}
                  openWithdrawModal={openWithdrawModal}
                  onContractUpload={handleContractUpload}
                  onContractView={handleContractView}
                  onFollowUp={handleFollowUp}
                  onMessageClick={(userId, preset) => handleMessageClick(userId, preset)}
                  onViewRequest={handleViewRequest}
                />
              )
            );
          })
        ) : (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#6b6b7a',
            fontSize: '1.1rem'
          }}>
            No {activeTab.toLowerCase()} bids.
          </div>
        )}
      </div>
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
                  <BidDisplayRow
                    key={bid.id}
                    bid={bid}
                    request={request}
                    bidDate={bid.created_at}
                    onEditBid={handleEditBid}
                    openWithdrawModal={openWithdrawModal}
                    onContractUpload={handleContractUpload}
                    onContractView={handleContractView}
                    onFollowUp={handleFollowUp}
                    onMessageClick={(userId, preset) => handleMessageClick(userId, preset)}
                    onViewRequest={handleViewRequest}
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
      <BidDisplayRow
        key={bid.id}
        bid={{
          ...bid,
          expirationStatus: expirationStatus
        }}
        request={requests.find((req) => req.id === bid.request_id)}
        bidDate={bid.created_at}
        onEditBid={handleEditBid}
        openWithdrawModal={openWithdrawModal}
        onContractUpload={handleContractUpload}
        onContractView={handleContractView}
        onFollowUp={handleFollowUp}
        onMessageClick={(userId, preset) => handleMessageClick(userId, preset)}
        onViewRequest={handleViewRequest}
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

  const handleMessageClick = (userId, preset = null) => {
    // Find the request to get user information
    const request = requests.find(req => req.user_id === userId || req.profile_id === userId);
    if (request) {
      setSelectedChat({ 
        id: userId, 
        name: `${request.user_first_name || ''} ${request.user_last_name || ''}`.trim() || 'Client',
        preset 
      });
      setShowChatModal(true);
    }
  };

  // Contract view handler
  const handleContractView = (bid) => {
    if (bid.contract_url) {
      window.open(bid.contract_url, '_blank');
    } else {
      console.warn('No contract URL available for bid:', bid.id);
    }
  };

  const handleFollowUp = async (bid) => {
    try {
      // Check if 24 hours have passed since the bid was created
      const bidCreatedAt = new Date(bid.created_at);
      const now = new Date();
      const hoursSinceBid = (now - bidCreatedAt) / (1000 * 60 * 60);
      
      if (hoursSinceBid < 24) {
        const remainingHours = Math.ceil(24 - hoursSinceBid);
        alert(`You can follow up in ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}. Please wait at least 24 hours after placing your bid before following up.`);
        return;
      }

      // Check if already followed up recently (within 7 days)
      if (bid.followed_up) {
        const lastFollowUp = new Date(bid.updated_at);
        const daysSinceLastFollowUp = (now - lastFollowUp) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLastFollowUp < 7) {
          const remainingDays = Math.ceil(7 - daysSinceLastFollowUp);
          alert(`You can follow up again in ${remainingDays} day${remainingDays !== 1 ? 's' : ''}. Please wait at least 7 days between follow-ups.`);
          return;
        }
      }

      // Mark the bid as followed up in the database
      const { error } = await supabase
        .from('bids')
        .update({ 
          followed_up: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', bid.id);

      if (error) throw error;

      // Update local state to reflect the change
      setBids(prevBids => 
        prevBids.map(b => 
          b.id === bid.id ? { 
            ...b, 
            followed_up: true,
            updated_at: new Date().toISOString()
          } : b
        )
      );

      // Find the request to get the correct user ID and open messenger
      const request = requests.find(req => req.id === bid.request_id);
      if (request) {
        // Just open the messenger without a preset message
        handleMessageClick(request.user_id || request.profile_id);
      }
    } catch (error) {
      console.error('Error sending follow-up:', error);
      alert('Error sending follow-up. Please try again.');
    }
  };

  const handleMessage = (bid) => {
    // Find the request to get the correct user ID
    const request = requests.find(req => req.id === bid.request_id);
    if (request) {
      handleMessageClick(request.user_id || request.profile_id);
    }
  };

  const handleViewRequest = (bid) => {
    // Navigate to request details
    navigate(`/requests/${bid.request_id}`, {
      state: {
        requestId: bid.request_id,
        userId: bid.user_id
      }
    });
  };

  if (isLoading) {
    return <LoadingSpinner color="#9633eb" size={50} />;
  }

  return (
    <div className="business-bids-container">
      <h1 style={{ fontFamily: "Outfit", fontWeight: "bold" }}>
        Your Bids
      </h1>
      <p className="text-muted mb-4" style={{ fontFamily: "Outfit", fontSize: "1rem", color: "gray", textAlign: "center" }}>View and manage your bids for client requests</p>
      {/* Tab Selector */}
      {renderTabSelector()}

      {/* Search and Sort Controls */}
      <div className="bids-controls" style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '0 1rem'
      }}>
        {/* Search Bar */}
        <div style={{ flex: 1, minWidth: '250px' }}>
          <input
            type="text"
            placeholder="Search bids by request title or client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              background: '#fff'
            }}
          />
        </div>

        {/* Sort Type Dropdown */}
        <select
          value={sortType}
          onChange={e => setSortType(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: '#fff',
            fontSize: '14px',
            fontWeight: '500',
            minWidth: '140px',
            cursor: 'pointer'
          }}
        >
          <option value="date">Date</option>
          <option value="amount">Bid Amount</option>
          <option value="status">Status</option>
        </select>

        {/* Sort Toggle */}
        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          style={{
            padding: '12px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <i className={`fas fa-sort-${sortOrder === 'desc' ? 'down' : 'up'}`}></i>
          {sortOrder === 'desc' 
            ? (sortType === 'date' ? 'Newest First' : sortType === 'amount' ? 'High to Low' : 'Most Viewed')
            : (sortType === 'date' ? 'Oldest First' : sortType === 'amount' ? 'Low to High' : 'Least Viewed')
          }
        </button>
      </div>

      {/* Bids Table */}
      {filteredBids.length > 0 ? (
        <div className="bids-table-container">
          {/* Table Header */}
          <div className="bids-table-header" style={{
            display: 'flex',
            padding: '16px 20px',
            background: '#f8f9fa',
            borderBottom: '1px solid #e2e8f0',
            fontWeight: '600',
            fontSize: '14px',
            color: '#374151',
            userSelect: 'none'
          }}>
            <div style={{ flex: 2 }}>Request</div>
            <div
              style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}
              onClick={() => {
                if (sortType === 'eventDate') {
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortType('eventDate');
                  setSortOrder('desc');
                }
              }}
            >
              Event Date
              {sortType === 'eventDate' && (
                <span style={{ marginLeft: 4 }}>{sortOrder === 'desc' ? '▼' : '▲'}</span>
              )}
            </div>
            <div
              style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}
              onClick={() => {
                if (sortType === 'bidDate') {
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortType('bidDate');
                  setSortOrder('desc');
                }
              }}
            >
              Bid Date
              {sortType === 'bidDate' && (
                <span style={{ marginLeft: 4 }}>{sortOrder === 'desc' ? '▼' : '▲'}</span>
              )}
            </div>
            <div
              style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}
              onClick={() => {
                if (sortType === 'amount') {
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortType('amount');
                  setSortOrder('desc');
                }
              }}
            >
              Bid Amount
              {sortType === 'amount' && (
                <span style={{ marginLeft: 4 }}>{sortOrder === 'desc' ? '▼' : '▲'}</span>
              )}
            </div>
            <div
              style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}
              onClick={() => {
                if (sortType === 'status') {
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortType('status');
                  setSortOrder('desc');
                }
              }}
            >
              Status
              {sortType === 'status' && (
                <span style={{ marginLeft: 4 }}>{sortOrder === 'desc' ? '▼' : '▲'}</span>
              )}
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>Follow-up</div>
            <div style={{ flex: 1, textAlign: 'center' }}>Actions</div>
          </div>

          {/* Bids Rows */}
          {filteredBids
            .slice() // copy before sort
            .sort((a, b) => {
              let aValue, bValue;
              if (sortType === 'eventDate') {
                const getEventDate = (req) => req?.start_date || req?.date_preference || req?.event_date || req?.created_at || null;
                aValue = getEventDate(requests.find((req) => req.id === a.request_id));
                bValue = getEventDate(requests.find((req) => req.id === b.request_id));
                aValue = aValue ? new Date(aValue) : new Date(0);
                bValue = bValue ? new Date(bValue) : new Date(0);
              } else if (sortType === 'bidDate') {
                aValue = a.created_at ? new Date(a.created_at) : new Date(0);
                bValue = b.created_at ? new Date(b.created_at) : new Date(0);
              } else if (sortType === 'amount') {
                aValue = parseFloat(a.bid_amount) || 0;
                bValue = parseFloat(b.bid_amount) || 0;
              } else if (sortType === 'status') {
                // Status sorting: viewed first, then by status type, then by date
                                  const getStatusPriority = (bid) => {
                    // Highest priority for paid bids
                    if (bid.status === 'paid') {
                      if (bid.payment_type === 'full') return 1;  // Fully paid
                      if (bid.payment_type === 'down_payment') return 2;  // Down payment paid
                    }
                    
                    const statusOrder = {
                      'approved': 3,
                      'accepted': 3,
                      'interested': 4,
                      'pending': 5,
                      'denied': 6
                    };
                    
                    // Combine viewed status and bid status for priority
                    const viewedPriority = bid.viewed ? 0 : 1;
                    const statusPriority = statusOrder[bid.status] || 7;
                    return viewedPriority * 10 + statusPriority;
                  };
                aValue = getStatusPriority(a);
                bValue = getStatusPriority(b);
                // If status priority is the same, sort by date
                if (aValue === bValue) {
                  aValue = a.created_at ? new Date(a.created_at) : new Date(0);
                  bValue = b.created_at ? new Date(b.created_at) : new Date(0);
                }
              } else {
                // default to bid date
                aValue = a.created_at ? new Date(a.created_at) : new Date(0);
                bValue = b.created_at ? new Date(b.created_at) : new Date(0);
              }
              if (sortOrder === 'desc') {
                return bValue - aValue;
              } else {
                return aValue - bValue;
              }
            })
            .map((bid) => {
              const request = requests.find((req) => req.id === bid.request_id);
              const followUpStatus = getFollowUpStatus(bid);
              return (
                <BidDisplayRow
                  key={bid.id}
                  bid={bid}
                  request={request}
                  bidDate={bid.created_at}
                  followUpStatus={followUpStatus}
                  onEditBid={handleEditBid}
                  openWithdrawModal={openWithdrawModal}
                  onContractUpload={handleContractUpload}
                  onContractView={handleContractView}
                  onFollowUp={handleFollowUp}
                  onMessageClick={(userId, preset) => handleMessageClick(userId, preset)}
                  onViewRequest={handleViewRequest}
                />
              );
            })}
        </div>
      ) : (
        <div className="no-bids" style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#6b7280'
        }}>
          <i className="fas fa-inbox" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
          <h3 style={{ marginBottom: '8px', color: '#374151' }}>No bids found</h3>
          <p>
            {searchQuery 
              ? `No bids match "${searchQuery}"` 
              : activeTab === 'all' 
                ? 'You haven\'t placed any bids yet.' 
                : `No ${activeTab} bids found.`
            }
          </p>
          {/* Add sign-up encouragement */}
          {activeTab === 'all' && !searchQuery && (
            <div className="signup-encouragement">
              <h4>
                <i className="fas fa-rocket" style={{ marginRight: '8px' }}></i>
                Ready to grow your business?
              </h4>
              <p>
                Start bidding on client requests and expand your customer base. Our platform connects you with clients actively seeking your services.
              </p>
              <button 
                className="signup-button"
                onClick={() => navigate('/requests')}
              >
                Browse Requests
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <WithdrawConfirmationModal
        show={showWithdrawModal}
        onHide={() => setShowWithdrawModal(false)}
        onConfirm={confirmWithdraw}
        bidToWithdraw={selectedBidId}
      />

      {showChatModal && selectedChat && (
        <div className="chat-modal-overlay" onClick={() => setShowChatModal(false)}>
          <div className="chat-modal" onClick={e => e.stopPropagation()}>
            <button 
              className="chat-modal-close" 
              onClick={() => setShowChatModal(false)}
            >
              ×
            </button>
            {isMobile ? (
              <MessagingView
                currentUserId={user?.id}
                businessId={selectedChat.id}
                onBack={() => setShowChatModal(false)}
              />
            ) : (
              <div className="chat-modal">
                <ChatInterface 
                  currentUserId={user?.id}
                  userType="business"
                  initialChat={selectedChat}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessBids;
