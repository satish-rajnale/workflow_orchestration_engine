import * as Ably from "ably";
import api from "./api";

class RealtimeService {
  private ably: Ably.Realtime | null = null;
  private channels: Map<string, any> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  async initialize(): Promise<void> {
    try {
      // Get Ably token from backend
      const response = await api.get("/jobs/token");
      const tokenRequest = response.data;

      console.log("🔑 Received Ably token:", tokenRequest);

      // Initialize Ably with token
      this.ably = new Ably.Realtime({
        authCallback: async (tokenParams, callback) => {
          return callback(null, tokenRequest);
        },
      });
      console.log("🔑 Ably initialized", this.ably);

      // // Add connection state listeners
      // this.ably.connection.on("connecting", () => {
      //   console.log("🔄 Ably: Connecting...");
      // });

      // this.ably.connection.on("connected", () => {
      //   console.log("✅ Ably: Connected successfully!");
      // });

      // this.ably.connection.on("disconnected", () => {
      //   console.log("🔌 Ably: Disconnected");
      // });

      // this.ably.connection.on("failed", (error: any) => {
      //   console.error("❌ Ably: Connection failed:", error);
      // });

      // Wait for connection to be established
      console.log("⏳ Waiting for Ably connection...");
      await this.ably.connection.once("connected");
      console.log("✅ Ably real-time service initialized and connected");
    } catch (error) {
      console.error("❌ Failed to initialize Ably:", error);
      throw error;
    }
  }

  subscribeToJobUpdates(jobId: string, callback: (data: any) => void): void {
    if (!this.ably) {
      console.error("Ably not initialized");
      return;
    }

    const channelName = `job-updates-${jobId}`;

    // Get or create channel
    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = this.ably.channels.get(channelName);
      this.channels.set(channelName, channel);
    }

    // Subscribe to job status updates
    channel.subscribe("job-status-update", (message: any) => {
      console.log(`📡 Received job update for ${jobId}:`, message.data);
      callback(message.data);
    });

    // Store callback for cleanup
    if (!this.listeners.has(channelName)) {
      this.listeners.set(channelName, new Set());
    }
    this.listeners.get(channelName)!.add(callback);

    console.log(`📡 Subscribed to job updates for ${jobId}`);
  }

  subscribeToUserJobUpdates(
    userId: string,
    callback: (data: any) => void
  ): void {
    if (!this.ably) {
      console.error("Ably not initialized");
      return;
    }

    const channelName = `user-${userId}-job-updates`;

    // Get or create channel
    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = this.ably.channels.get(channelName);
      this.channels.set(channelName, channel);
    }

    // Subscribe to job status updates
    console.log(
      `📡 Setting up subscription to channel: ${channelName} for event: job-status-update`
    );
    channel.subscribe("job-status-update", (message: any) => {
      console.log(
        `📨 Received user job update on ${channelName}:`,
        message.data
      );
      callback(message.data);
    });

    // Store callback for cleanup
    if (!this.listeners.has(channelName)) {
      this.listeners.set(channelName, new Set());
    }
    this.listeners.get(channelName)!.add(callback);

    console.log(`📡 Subscribed to user job updates for ${userId}`);
  }

  subscribeToJobListUpdates(
    userId: string,
    callback: (data: any) => void
  ): void {
    if (!this.ably) {
      console.error("Ably not initialized");
      return;
    }

    const channelName = `user-${userId}-job-list`;

    // Get or create channel
    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = this.ably.channels.get(channelName);
      this.channels.set(channelName, channel);
    }

    // Subscribe to job list updates
    channel.subscribe("job-list-update", (message: any) => {
      console.log(`📡 Received job list update:`, message.data);
      callback(message.data);
    });

    // Store callback for cleanup
    if (!this.listeners.has(channelName)) {
      this.listeners.set(channelName, new Set());
    }
    this.listeners.get(channelName)!.add(callback);

    console.log(`📡 Subscribed to job list updates for ${userId}`);
  }

  unsubscribeFromJobUpdates(
    jobId: string,
    callback?: (data: any) => void
  ): void {
    const channelName = `job-updates-${jobId}`;
    this.unsubscribeFromChannel(channelName, callback);
  }

  unsubscribeFromUserJobUpdates(
    userId: string,
    callback?: (data: any) => void
  ): void {
    const channelName = `user-${userId}-job-updates`;
    this.unsubscribeFromChannel(channelName, callback);
  }

  unsubscribeFromJobListUpdates(
    userId: string,
    callback?: (data: any) => void
  ): void {
    const channelName = `user-${userId}-job-list`;
    this.unsubscribeFromChannel(channelName, callback);
  }

  private unsubscribeFromChannel(
    channelName: string,
    callback?: (data: any) => void
  ): void {
    const channel = this.channels.get(channelName);
    if (!channel) return;

    if (callback) {
      // Remove specific callback
      const listeners = this.listeners.get(channelName);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(channelName);
          channel.unsubscribe();
          this.channels.delete(channelName);
        }
      }
    } else {
      // Remove all listeners for this channel
      channel.unsubscribe();
      this.channels.delete(channelName);
      this.listeners.delete(channelName);
    }

    console.log(`📡 Unsubscribed from ${channelName}`);
  }

  disconnect(): void {
    if (this.ably) {
      this.ably.close();
      this.ably = null;
      this.channels.clear();
      this.listeners.clear();
      console.log("📡 Ably real-time service disconnected");
    }
  }

  // Public method to check if Ably is initialized
  isInitialized(): boolean {
    return this.ably !== null;
  }

  // Public method to get Ably client for testing
  getAblyClient(): any {
    return this.ably;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
