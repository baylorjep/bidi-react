import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import MessagingView from "./MessagingView";

export default function MessagingViewWrapper({ currentUserId, userType }) {
  const { businessId } = useParams();
  const [businessName, setBusinessName] = useState("Business");

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

  return (
    <MessagingView
      currentUserId={currentUserId}
      businessId={businessId}
      businessName={businessName}
    />
  );
}