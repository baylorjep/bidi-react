import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import MessagingView from "./MessagingView";
import StartNewChatModal from "./StartNewChatModal";
import "../../styles/chat.css";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { formatTimestamp } from "../../utils/dateTimeUtils";

// Skeleton components for loading states
const ChatListSkeleton = () => (
  <li className="skeleton-chat-item">
    <div className="chat-list-item-content">
      <div className="chat-list-header">
        <div className="skeleton-chat-name"></div>
        <div className="skeleton-unseen-badge"></div>
      </div>
      <div className="chat-list-footer">
        <div className="skeleton-message-preview"></div>
        <div className="skeleton-message-time"></div>
      </div>
    </div>
  </li>
);

const ChatInterfaceSkeleton = () => (
  <div>
    <h1 style={{ fontFamily: "Outfit", fontWeight: "bold" }}>
      Messages
    </h1>
    <p className="text-muted mb-4" style={{ fontFamily: "Outfit", fontSize: "1rem", color: "gray", textAlign: "center" }}>
      Chat with your clients and vendors
    </p>
    <div className="chat-app-chat-interface">
      <aside className="chat-sidebar">
        <header>
          <span>Your Chats</span>
        </header>
        <ul>
          {Array.from({ length: 5 }).map((_, index) => (
            <ChatListSkeleton key={index} />
          ))}
        </ul>
      </aside>
      <main className="chat-main">
        <div className="skeleton-chat-placeholder">
          <div className="skeleton-placeholder-text"></div>
        </div>
      </main>
    </div>
  </div>
);

export default function ChatInterface({ initialChat }) {
  const [currentUserId, setCurrentUserId] = useState("");
  const [userType, setUserType] = useState("");
  const [chats, setChats] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [activeBusinessName, setActiveBusinessName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();
  const navigate = useNavigate();

  // Memoize the loading skeleton at the top level to avoid conditional hook calls
  const loadingSkeleton = useMemo(() => <ChatInterfaceSkeleton />, []);

  // Set active business from initialChat prop or navigation state
  useEffect(() => {
    if (initialChat) {
      setActiveBusiness(initialChat.id);
      setActiveBusinessName(initialChat.name);
      
      // Add to chats if not already present
      if (!chats.some(chat => chat.business_id === initialChat.id)) {
        setChats(prevChats => [...prevChats, {
          business_id: initialChat.id,
          business_name: initialChat.name,
          last_message: ""
        }]);
      }
    } else if (location.state?.businessId) {
      setActiveBusiness(location.state.businessId);
      setActiveBusinessName(location.state.businessName || "Business");
      
      // Add to chats if not already present
      if (!chats.some(chat => chat.business_id === location.state.businessId)) {
        setChats(prevChats => [...prevChats, {
          business_id: location.state.businessId,
          business_name: location.state.businessName || "Business",
          last_message: ""
        }]);
      }
    }
  }, [initialChat, location.state]);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      setIsMobile(newIsMobile);
      // If switching to mobile and we have an active chat, navigate to the chat view
      if (newIsMobile && activeBusiness) {
        navigate(`/messages/${activeBusiness}`, {
          state: { businessName: activeBusinessName }
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeBusiness, activeBusinessName, navigate]);

  // 1) Load current user & determine user type
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      // First check if user is a wedding planner
      const { data: weddingPlanner, error: weddingPlannerError } = await supabase
        .from("wedding_planner_profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!weddingPlannerError && weddingPlanner) {
        setUserType("business");
        return;
      }

      // Then check if user is an individual
      const { data: individual, error: individualError } = await supabase
        .from("individual_profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!individualError && individual) {
        setUserType("individual");
      } else {
        // If not individual or wedding planner, check business profiles
        const { data: business, error: businessError } = await supabase
          .from("business_profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!businessError && business) {
          setUserType("business");
        } else {
          // User has no profile - this will be handled by MissingProfileModal
          console.log("User has no profile yet - profile setup will be handled by MissingProfileModal");
          setUserType(null);
        }
      }
    })();
  }, []);

  // 2) Fetch chat history with unseen message tracking
  useEffect(() => {
    if (!currentUserId || !userType) return;

    (async () => {
      const { data: messages = [], error: messagesError } = await supabase
        .from("messages")
        .select("receiver_id, sender_id, message, created_at, seen, type")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        return;
      }

      const latestMap = {};
      const unseenCountMap = {};

      messages.forEach((msg) => {
        const otherId = msg.sender_id === currentUserId
          ? msg.receiver_id
          : msg.sender_id;

        // Track latest message
        if (!latestMap[otherId]) {
          latestMap[otherId] = msg;
        }

        // Count unseen messages - messages received by current user that haven't been seen
        if (msg.receiver_id === currentUserId && !msg.seen) {
          unseenCountMap[otherId] = (unseenCountMap[otherId] || 0) + 1;
        }
      });

      const otherIds = Object.keys(latestMap);
      if (otherIds.length === 0) return setChats([]);

      // Fetch profiles from all relevant tables
      const [businessProfiles, weddingPlannerProfiles, individualProfiles] = await Promise.all([
        supabase.from("business_profiles").select("id, business_name").in("id", otherIds),
        supabase.from("wedding_planner_profiles").select("id, business_name").in("id", otherIds),
        supabase.from("individual_profiles").select("id, first_name, last_name").in("id", otherIds)
      ]);

      // Combine all profiles
      const allProfiles = [
        ...(businessProfiles.data || []),
        ...(weddingPlannerProfiles.data || []),
        ...(individualProfiles.data || [])
      ];

      const formatted = allProfiles.map((p) => ({
        business_id: p.id,
        business_name:
          userType === "individual"
            ? p.business_name || "Business"
            : `${p.first_name || ""} ${p.last_name || ""}`.trim() || "User",
        last_message: latestMap[p.id]?.type === 'image'
          ? (latestMap[p.id]?.sender_id === currentUserId ? "You sent an image" : "Image")
          : latestMap[p.id]?.type === 'payment_request'
          ? (latestMap[p.id]?.sender_id === currentUserId ? "You sent a payment request" : "Payment request")
          : latestMap[p.id]?.message || "",
        unseen_count: unseenCountMap[p.id] || 0,
        last_message_time: latestMap[p.id]?.created_at
      }));

      // Sort chats by most recent message time (newest first)
      const sortedChats = formatted.sort((a, b) => {
        if (!a.last_message_time && !b.last_message_time) return 0;
        if (!a.last_message_time) return 1;
        if (!b.last_message_time) return -1;
        return new Date(b.last_message_time) - new Date(a.last_message_time);
      });

      setChats(sortedChats);
    })();
  }, [currentUserId, userType]);

  // Show skeleton loading while fetching data
  if (!currentUserId || !userType) {
    return loadingSkeleton;
  }

  const handleChatSelect = async (chat) => {
    setActiveBusiness(chat.business_id);
    setActiveBusinessName(chat.business_name);

    // Mark messages as seen when chat is opened
    const { error: updateError } = await supabase
      .from('messages')
      .update({ seen: true })
      .eq('sender_id', currentUserId)
      .eq('receiver_id', chat.business_id)
      .eq('seen', false);

    if (updateError) {
      console.error('Error marking messages as seen:', updateError);
    }

    // Update the chats list to reflect seen status
    setChats(prevChats => 
      prevChats.map(c => 
        c.business_id === chat.business_id 
          ? { ...c, unseen_count: 0 }
          : c
      )
    );

    if (isMobile) {
      navigate(`/messages/${chat.business_id}`, {
        state: { businessName: chat.business_name }
      });
    }
  };

  return (
    <div>
      <h1 style={{ fontFamily: "Outfit", fontWeight: "bold" }}>
        Messages
      </h1>
      <p className="text-muted mb-4" style={{ fontFamily: "Outfit", fontSize: "1rem", color: "gray", textAlign: "center" }}>Chat with your clients and vendors</p>
      <div className="chat-app-chat-interface">
        <aside className="chat-sidebar">
          <header>
            <span>Your Chats</span>
          </header>

          <ul>
            {chats.length === 0 ? (
              <div style={{
                padding: "2rem",
                textAlign: "center",
                color: "var(--bidi-muted)"
              }}>
                <div style={{ marginBottom: "1rem" }}>
                  No messages yet
                </div>
                <div style={{ fontSize: "0.9rem" }}>
                  Browse vendors to start conversations and get quotes
                </div>
              </div>
            ) : (
              chats.map((c) => (
                <li
                  key={c.business_id}
                  className={activeBusiness === c.business_id ? "active" : ""}
                  onClick={() => handleChatSelect(c)}
                >
                  <div className="chat-list-item-content">
                    <div className="chat-list-header">
                      <span className="chat-name">{c.business_name}</span>
                      {c.unseen_count > 0 && (
                        <span className="unseen-badge">{c.unseen_count}</span>
                      )}
                    </div>
                    <div className="chat-list-footer">
                      <div className="message-preview">{c.last_message}</div>
                      <div className="message-time" style={{ color: "black"}}>
                        {formatTimestamp(c.last_message_time, 'datetime')}
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </aside>

        <main className="chat-main">
          {chats.length === 0 ? (
            <div style={{ 
              display: "flex", 
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: "2rem",
              color: "var(--bidi-muted)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
                Welcome to Messages!
              </div>
              <div style={{ marginBottom: "2rem" }}>
                Find and connect with vendors to start your first conversation
              </div>
              <button
                onClick={() => {
                  const event = new CustomEvent('navigateToVendors');
                  window.dispatchEvent(event);
                }}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "var(--bidi-primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                Browse Vendors
              </button>
            </div>
          ) : activeBusiness ? (
            <MessagingView
              currentUserId={currentUserId}
              businessId={activeBusiness}
              businessName={activeBusinessName}
              userType={userType}
            />
          ) : (
            <div style={{ padding: "2rem", color: "var(--bidi-muted)" }}>
              Select a chat to start messaging
            </div>
          )}
        </main>

        {showModal && (
          <StartNewChatModal
            currentUserId={currentUserId}
            onClose={() => setShowModal(false)}
            onStartChat={(bizId) => handleChatSelect({ business_id: bizId, business_name: "New Chat" })}
          />
        )}
      </div>
    </div>
  );
}