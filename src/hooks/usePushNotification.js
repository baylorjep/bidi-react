import { supabase } from "../supabaseClient"; // Adjust to your actual import

const NEXT_VAPID_PUBLIC_KEY =
  "BG_u0hlVgNQWYcwc97N9ijcWo3fyOdPinEH98LklTADLow26SPhkkQTZ0nDUBS9O0gxWwpKRxeZYd3ZWXy2VWiE";

// Function to convert base64 URL to Uint8Array (needed for applicationServerKey)
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// The function to subscribe the user to push notifications
export const subscribeToPush = async () => {
  const permission = await Notification.requestPermission();
  console.log("Permission result:", permission);
  if (permission !== "granted") return;

  const sw = await navigator.serviceWorker.ready;

  let subscription = await sw.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
    console.log("Unsubscribed from previous push subscription.");
  }

  const applicationServerKey = urlBase64ToUint8Array(NEXT_VAPID_PUBLIC_KEY);

  subscription = await sw.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  console.log("New push subscription:", subscription);

  // 🔸 Get the user ID from the auth session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user_id = session?.user?.id;

  if (!user_id) {
    console.error("No user ID found — user must be logged in.");
    return;
  }

  // Send the subscription and user_id to your backend
  await fetch("/api/save-subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, subscription }),
  });
};
