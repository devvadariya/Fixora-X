import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.requestNamespace = null;
    this.userRoomId = null;
    this.mechanicArea = null;
    this.joinedRooms = new Set();
    this.namespaceListeners = new Map();
  }

  // Initialize socket connection
  init(token) {
    if (this.socket || this.requestNamespace) {
      this.disconnect({ preserveSubscriptions: true });
    }

    const socketUrl = process.env.REACT_APP_SOCKET_URL || "http://localhost:4000";

    // Connect to main socket
    this.socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      timeout: 20000,
    });

    // Connect to requests namespace
    this.requestNamespace = io(`${socketUrl}/requests`, {
      auth: { token },
      transports: ["websocket", "polling"],
      timeout: 20000,
    });

    this.setupEventListeners();
    this.reattachNamespaceListeners();
  }

  // Setup basic event listeners
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Main socket connection error:", error);
      this.isConnected = false;
    });

    this.socket.on("error", (error) => {
      console.error("Main socket error:", error);
    });

    if (this.requestNamespace) {
      this.requestNamespace.on("connect", () => {
        this.isConnected = true;
        this.rejoinTrackedRooms();
      });

      this.requestNamespace.on("disconnect", () => {
        this.isConnected = Boolean(this.socket?.connected);
      });

      this.requestNamespace.on("connect_error", (error) => {
        console.error("Request namespace connection error:", error);
      });
    }
  }

  rejoinTrackedRooms() {
    if (!this.requestNamespace?.connected) return;

    if (this.userRoomId) {
      this.requestNamespace.emit("join-user-room", this.userRoomId);
    }
    if (this.mechanicArea) {
      this.requestNamespace.emit(
        "join-mechanic-area",
        this.mechanicArea.mechanicId,
        this.mechanicArea.location,
      );
    }
    for (const roomId of this.joinedRooms) {
      this.requestNamespace.emit("join_request", { requestId: roomId });
    }
  }

  reattachNamespaceListeners() {
    if (!this.requestNamespace) return;
    for (const [event, callbacks] of this.namespaceListeners.entries()) {
      for (const callback of callbacks) {
        this.requestNamespace.off(event, callback);
        this.requestNamespace.on(event, callback);
      }
    }
  }

  // Join user to their personal room
  joinUserRoom(userId) {
    if (!userId) return;
    this.userRoomId = userId;
    if (this.requestNamespace && this.requestNamespace.connected) {
      this.requestNamespace.emit("join-user-room", userId);
    }
  }

  // Join mechanic to their service area
  joinMechanicArea(mechanicId, location) {
    if (!mechanicId || !location) return;
    this.mechanicArea = { mechanicId, location };
    if (this.requestNamespace && this.requestNamespace.connected) {
      this.requestNamespace.emit("join-mechanic-area", mechanicId, location);
    }
  }

  // Join a service request or chat room for real-time updates
  joinRequest(requestId) {
    if (!requestId) return;
    this.joinedRooms.add(requestId);
    if (this.requestNamespace && this.requestNamespace.connected) {
      this.requestNamespace.emit("join_request", { requestId });
    }
  }

  // Leave a service request or chat room
  leaveRequest(requestId) {
    if (!requestId) return;
    this.joinedRooms.delete(requestId);
    if (this.requestNamespace && this.requestNamespace.connected) {
      this.requestNamespace.emit("leave_request", { requestId });
    }
  }

  // Update location (for mechanics)
  updateLocation(location) {
    if (this.requestNamespace && this.requestNamespace.connected) {
      this.requestNamespace.emit("location-update", {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy || 10,
      });
    }
  }

  // Send chat message
  sendMessage(requestId, message, sender = "customer") {
    if (this.requestNamespace && this.requestNamespace.connected) {
      this.requestNamespace.emit("send-message", {
        requestId,
        message,
        sender,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Send emergency alert
  sendEmergencyAlert(requestId, alertType, location) {
    if (this.requestNamespace && this.requestNamespace.connected) {
      this.requestNamespace.emit("emergency-alert", {
        requestId,
        type: alertType,
        location,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Generic listener registration on /requests namespace
  on(event, callback) {
    if (!event || !callback) return;
    if (!this.namespaceListeners.has(event)) {
      this.namespaceListeners.set(event, new Set());
    }
    this.namespaceListeners.get(event).add(callback);

    if (this.requestNamespace) {
      this.requestNamespace.off(event, callback);
      this.requestNamespace.on(event, callback);
    }
  }

  // Listen for request updates
  onRequestUpdate(callback) {
    this.on("request_updated", callback);
  }

  // Listen for location updates
  onLocationUpdate(callback) {
    this.on("location_updated", callback);
  }

  // Listen for new messages
  onNewMessage(callback) {
    this.on("new-message", callback);
  }

  // Listen for cleared chats
  onChatCleared(callback) {
    this.on("chat-cleared", callback);
  }

  // Listen for emergency alerts
  onEmergencyAlert(callback) {
    this.on("emergency-alert", callback);
  }

  // Listen for mechanic assigned
  onMechanicAssigned(callback) {
    this.on("mechanic_assigned", callback);
  }

  // Listen for service started
  onServiceStarted(callback) {
    this.on("service_started", callback);
  }

  // Listen for service completed
  onServiceCompleted(callback) {
    this.on("service_completed", callback);
  }

  // Listen for new request available (for mechanics)
  onNewRequestAvailable(callback) {
    this.on("new-request-available", callback);
  }

  // Listen for request taken (for mechanics)
  onRequestTaken(callback) {
    this.on("request-taken", callback);
  }

  // Listen for request accepted (for customers)
  onRequestAccepted(callback) {
    this.on("request-accepted", callback);
  }

  // Remove event listeners (specific callback when provided)
  off(event, callback) {
    if (callback) {
      const callbacks = this.namespaceListeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.namespaceListeners.delete(event);
        }
      }
    } else {
      this.namespaceListeners.delete(event);
    }

    if (this.requestNamespace) {
      if (callback) {
        this.requestNamespace.off(event, callback);
      } else {
        this.requestNamespace.off(event);
      }
    }
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  // Disconnect socket
  disconnect({ preserveSubscriptions = false } = {}) {
    if (this.requestNamespace) {
      this.requestNamespace.disconnect();
      this.requestNamespace = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (!preserveSubscriptions) {
      this.userRoomId = null;
      this.mechanicArea = null;
      this.joinedRooms.clear();
      this.namespaceListeners.clear();
    }
    this.isConnected = false;
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }

  // Get socket instance (for custom events)
  getSocket() {
    return this.socket;
  }

  // Get request namespace instance
  getRequestNamespace() {
    return this.requestNamespace;
  }
}

const socketService = new SocketService();
export default socketService;
