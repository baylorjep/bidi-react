import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import MessagingView from "./MessagingView";
import MobileChatList from "./MobileChatList";
import ChatInterface from "./ChatInterface";

export default function MessagingViewWrapper({ currentUserId, userType }) {
  const { businessId } = useParams();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [businessName, setBusinessName] = useState("Business");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchBusinessName = async () => {
      const table = userType === "individual" ? "business_profiles" : "individual_profiles";
      const nameColumn = userType === "individual" ? "business_name" : "first_name, last_name";

      const { data, error } = await supabase
        .from(table)
        .select(nameColumn)
        .eq("id", businessId)
        .single();

      if (error) {
        console.error("Error fetching business name:", error);
      } else {
        const name =
          userType === "individual"
            ? data.business_name
            : `${data.first_name} ${data.last_name}`;
        setBusinessName(name || "Unknown");
      }
    };

    fetchBusinessName();
  }, [businessId, userType]);

  // If no businessId is provided, show the chat list
  if (!businessId) {
    return isMobile ? (
      <MobileChatList currentUserId={currentUserId} userType={userType} />
    ) : (
      <ChatInterface currentUserId={currentUserId} userType={userType} />
    );
  }

  // If businessId is 0, show the chat list
  if (businessId === "0") {
    return <MobileChatList currentUserId={currentUserId} userType={userType} />;
  }

  // Otherwise show the messaging view
  return (
    <MessagingView
      currentUserId={currentUserId}
      businessId={businessId}
      businessName={businessName}
      userType={userType}
      onBack={() => {
        if (location.state?.fromDashboard) {
          navigate('/individual-dashboard');
        } else {
          navigate('/messages/0');
        }
      }}
    />
  );
}