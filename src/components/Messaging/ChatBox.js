import { useEffect, useState } from "react";
import { listenForMessages } from "../../utils/supabaseRealtime";


const ChatBox = ({ senderId, receiverId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const subscription = listenForMessages((message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      subscription.unsubscribe(); // Cleanup on unmount
    };
  }, []);

  const handleSend = async () => {
    if (!newMessage.trim()) return; // Prevent sending empty messages

    const response = await fetch("https://bidi-express.vercel.app/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        senderId,
        receiverId,
        message: newMessage,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Error sending message:", data.error);
      return;
    }

    setNewMessage(""); // Clear input after sending
  };

  return (
    <div>
      {messages.map((msg) => (
        <p key={msg.id}>{msg.message}</p>
      ))}
      <input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
};

export default ChatBox;

