import React, { useState, useEffect } from "react";
import { realtimeService } from "../services/realtime";
import api from "../services/api";
import useAuth from "../store/auth";

export default function AblyTest() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>("Not connected");
  const [messages, setMessages] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id.toString());
    }
  }, [user]);

  const addMessage = (message: string) => {
    setMessages((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const initializeAbly = async () => {
    try {
      addMessage("🔄 Initializing Ably...");
      await realtimeService.initialize();
      setStatus("Connected");
      addMessage("✅ Ably initialized successfully");
    } catch (error) {
      setStatus("Failed");
      addMessage(`❌ Ably initialization failed: ${error}`);
    }
  };

  const subscribeToUpdates = () => {
    try {
      addMessage("📡 Subscribing to user job updates...");
      realtimeService.subscribeToUserJobUpdates(userId, (data) => {
        addMessage(`📨 Received job update: ${JSON.stringify(data)}`);
      });

      addMessage("📡 Subscribing to job list updates...");
      realtimeService.subscribeToJobListUpdates(userId, (data) => {
        addMessage(`📨 Received job list update: ${JSON.stringify(data)}`);
      });

      addMessage("✅ Subscriptions set up");
    } catch (error) {
      addMessage(`❌ Subscription failed: ${error}`);
    }
  };

  const testBackendUpdate = async () => {
    try {
      addMessage("🧪 Testing backend update...");
      const response = await api.get("/jobs/test-update");
      addMessage(
        `✅ Backend test update sent: ${JSON.stringify(response.data)}`
      );

      // Wait a moment and then check if we received the update
      setTimeout(() => {
        addMessage("⏳ Checking if real-time update was received...");
      }, 2000);
    } catch (error) {
      addMessage(`❌ Backend test failed: ${error}`);
    }
  };

  const testManualSubscription = () => {
    try {
      addMessage("🔗 Testing manual subscription...");

      // Test subscribing to the specific channel that should receive updates
      const channelName = `user-${userId}-job-updates`;
      addMessage(`📡 Manually subscribing to channel: ${channelName}`);

      if (realtimeService.isInitialized()) {
        const ably = realtimeService.getAblyClient();
        const channel = ably.channels.get(channelName);
        channel.subscribe("job-status-update", (message: any) => {
          addMessage(
            `📨 Manual subscription received: ${JSON.stringify(message.data)}`
          );
        });
        addMessage("✅ Manual subscription set up");
      } else {
        addMessage("❌ Ably not initialized for manual test");
      }
    } catch (error) {
      addMessage(`❌ Manual subscription failed: ${error}`);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ably Real-time Test</h1>

      <div className="mb-4 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={initializeAbly}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Initialize Ably
          </button>

          <button
            onClick={subscribeToUpdates}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Subscribe to Updates
          </button>

          <button
            onClick={testBackendUpdate}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test Backend Update
          </button>

          <button
            onClick={testManualSubscription}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Test Manual Subscription
          </button>

          <button
            onClick={clearMessages}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Messages
          </button>
        </div>

        <div className="text-sm">
          <strong>Status:</strong> {status}
        </div>

        <div className="text-sm">
          <strong>User ID:</strong> {userId}
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded h-96 overflow-y-auto">
        <h2 className="font-bold mb-2">Messages:</h2>
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet...</p>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => (
              <div
                key={index}
                className="text-sm font-mono bg-white p-2 rounded border"
              >
                {message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
