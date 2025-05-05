import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import MessagingView from "./MessagingView";
import StartNewChatModal from "./StartNewChatModal";
import "../../styles/chat.css";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

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

      // Determine if user is an individual or business
      const { data: individual } = await supabase
        .from("individual_profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (individual) {
        setUserType("individual");
      } else {
        setUserType("business");
      }
    })();
  }, []);

  // 2) Fetch chat history
  useEffect(() => {
    if (!currentUserId || !userType) return;

    (async () => {
      const { data: messages = [], error: messagesError } = await supabase
        .from("messages")
        .select("receiver_id, sender_id, message, created_at")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        return;
      }

      const latestMap = {};
      messages.forEach((msg) => {
        const otherId = msg.sender_id === currentUserId
          ? msg.receiver_id
          : msg.sender_id;
        if (!latestMap[otherId]) latestMap[otherId] = msg;
      });

      const otherIds = Object.keys(latestMap);
      if (otherIds.length === 0) return setChats([]);

      const otherTable = userType === "individual"
        ? "business_profiles"
        : "individual_profiles";

      const { data: profiles = [], error: profilesError } = await supabase
        .from(otherTable)
        .select(userType === "individual" ? "id, business_name" : "id, first_name, last_name")
        .in("id", otherIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
      }

      const formatted = profiles.map((p) => ({
        business_id: p.id,
        business_name:
          userType === "individual"
            ? p.business_name || "Business"
            : `${p.first_name || ""} ${p.last_name || ""}`.trim() || "User",
        last_message: latestMap[p.id]?.message || "",
      }));

      setChats(formatted);
    })();
  }, [currentUserId, userType]);

  const handleChatSelect = (chat) => {
    setActiveBusiness(chat.business_id);
    setActiveBusinessName(chat.business_name);
    if (isMobile) {
      navigate(`/messages/${chat.business_id}`, {
        state: { businessName: chat.business_name }
      });
    }
  };

  return (
    <div className="chat-app">
      <aside className="chat-sidebar">
        <header>
          <span>Your Chats</span>
        </header>

        <ul>
          {chats.map((c) => (
            <li
              key={c.business_id}
              className={activeBusiness === c.business_id ? "active" : ""}
              onClick={() => handleChatSelect(c)}
            >
              <div>{c.business_name}</div>
              <div className="message-time" style={{ color: "black" }}>{c.last_message}</div>
            </li>
          ))}
        </ul>
      </aside>

      <main className="chat-main">

        {activeBusiness ? (
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
  );
}