import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import MessagingView from './MessagingView';
import MobileChatList from './MobileChatList';
import ChatInterface from './ChatInterface';

export default function DashboardMessaging({ 
  currentUserId, 
  userType, 
  selectedChatId, 
  onChatSelect, 
  onBack 
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [businessName, setBusinessName] = useState("Business");

  console.log('DashboardMessaging received selectedChatId:', selectedChatId, 'type:', typeof selectedChatId);

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
      if (!selectedChatId) return;
      
      console.log('Fetching business name for selectedChatId:', selectedChatId);
      
      const table = userType === "individual" ? "business_profiles" : "individual_profiles";
      const nameColumn = userType === "individual" ? "business_name" : "first_name, last_name";

      const { data, error } = await supabase
        .from(table)
        .select(nameColumn)
        .eq("id", selectedChatId)
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
  }, [selectedChatId, userType]);

  // If a specific chat is selected, show the messaging view
  if (selectedChatId) {
    // Ensure we have a string ID, not an object
    const businessId = typeof selectedChatId === 'object' ? selectedChatId.id : selectedChatId;
    console.log('Passing businessId to MessagingView:', businessId, 'type:', typeof businessId);
    
    return (
      <MessagingView
        currentUserId={currentUserId}
        businessId={businessId}
        businessName={businessName}
        userType={userType}
        onBack={onBack}
        isDashboard={true}
      />
    );
  }

  // Otherwise show the chat list
  return isMobile ? (
    <MobileChatList 
      currentUserId={currentUserId} 
      userType={userType}
      onChatSelect={onChatSelect}
      isDashboard={true}
    />
  ) : (
    <ChatInterface 
      currentUserId={currentUserId} 
      userType={userType}
      onChatSelect={onChatSelect}
      isDashboard={true}
    />
  );
} 