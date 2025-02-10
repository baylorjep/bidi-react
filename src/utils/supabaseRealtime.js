import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

export const listenForMessages = (callback) => {
  return supabase
    .channel("realtime:messages")
    .on("INSERT", { schema: "public", table: "messages" }, (payload) => {
      console.log("New message received:", payload.new);
      callback(payload.new); // Send new messages to the UI
    })
    .subscribe();
};
