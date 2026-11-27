import {
  PaperAirplaneIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import chatApi from "../../api/chatApi";
import { useAuth } from "../../contexts/AuthContext";
import socketService from "../../services/socketService";

const ChatModal = ({ isOpen, onClose, mechanic, serviceRequestId = null }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState(null); // direct chat id (no service request)
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && mechanic) {
      initializeChat();
    }
    return () => {
      // Cleanup: leave socket room when modal closes
      if (chatId) {
        socketService.leaveRequest(chatId);
        socketService.off("new-message");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mechanic, serviceRequestId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const setupSocketListeners = (roomId) => {
    socketService.joinRequest(roomId);
    socketService.onNewMessage((data) => {
      const incomingRoom = data.chatId || data.requestId;
      if (incomingRoom === roomId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m._id && m._id === data._id)) return prev;
          return [...prev, data];
        });
      }
    });
  };

  const deleteChat = async () => {
    const id = chatId || serviceRequestId;
    if (!id) return;
    if (
      !window.confirm(
        "Are you sure you want to delete all messages in this chat? This cannot be undone.",
      )
    )
      return;
    try {
      await chatApi.deleteChat(id);
      setMessages([]);
      toast.success("Chat cleared successfully");
    } catch (err) {
      toast.error("Failed to delete chat");
    }
  };

  const initializeChat = async () => {
    try {
      setLoading(true);

      if (serviceRequestId) {
        // Tied to a real service request
        const response =
          await chatApi.getOrCreateConversation(serviceRequestId);
        if (response.success) {
          setMessages(response.data.messages || []);
          setupSocketListeners(serviceRequestId);
        }
      } else {
        // Pure direct chat — no service request at all
        const response = await chatApi.createDirectChat(mechanic._id);
        if (response.success) {
          const chat = response.data;
          setChatId(chat._id);
          setMessages(chat.messages || []);
          setupSocketListeners(chat._id);
        } else {
          toast.error("Could not start chat. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
      toast.error("Failed to load chat. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage("");

    // Optimistically add the message to UI
    const tempMsg = {
      _id: `temp-${Date.now()}`,
      sender: { _id: user.id, name: user.name },
      content,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      setSending(true);

      let response;
      if (chatId) {
        // Direct chat: use chatId-based endpoint (no service request)
        response = await chatApi.sendDirectMessage(chatId, {
          content,
          messageType: "text",
        });
        if (response.success) {
          // Replace temp with real message
          setMessages((prev) =>
            prev.map((m) => (m._id === tempMsg._id ? response.data : m)),
          );
          // Emit via socket for real-time delivery
          socketService.sendMessage(chatId, content, user.role);
        } else {
          throw new Error(response.message || "Failed to send");
        }
      } else if (serviceRequestId) {
        // Service-request chat
        response = await chatApi.sendMessage(serviceRequestId, {
          content,
          messageType: "text",
        });
        if (response.success) {
          setMessages((prev) =>
            prev.map((m) => (m._id === tempMsg._id ? response.data : m)),
          );
          socketService.sendMessage(serviceRequestId, content, user.role);
        } else {
          throw new Error(response.message || "Failed to send");
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
      // Remove the optimistic message on failure
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
    } finally {
      setSending(false);
    }
  };

  const isOwnMessage = (message) => {
    const senderId =
      message.sender?._id || message.sender?.id || message.sender;
    return senderId?.toString() === user.id?.toString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/70 p-4 backdrop-blur-sm">
      <div
        className="flex h-[min(600px,calc(100vh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline bg-primary-900 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {mechanic?.name?.charAt(0) || "M"}
              </span>
            </div>
            <div>
              <h3 id="chat-dialog-title" className="font-semibold text-white">
                Chat with {mechanic?.name}
              </h3>
              <p className="text-xs text-primary-100">
                {serviceRequestId ? "Service Request Chat" : "Direct Message"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={deleteChat}
              title="Delete chat history"
              className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 hover:text-danger-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              aria-label="Close chat dialog"
              className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 hover:text-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-surface p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">💬</div>
              <p className="font-medium text-secondary-500">No messages yet</p>
              <p className="mt-1 text-sm text-secondary-400">
                Be the first to say hello!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${isOwnMessage(message) ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-xs lg:max-w-md`}>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwnMessage(message)
                        ? "bg-primary-600 text-white rounded-br-sm"
                        : "rounded-bl-sm border border-hairline bg-white text-ink shadow-soft"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <div
                    className={`mt-1 flex items-center gap-1 text-xs text-secondary-400 ${
                      isOwnMessage(message) ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span>{message.sender?.name || "Unknown"}</span>
                    <span>•</span>
                    <span>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="rounded-b-2xl border-t border-hairline bg-white p-4">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="min-h-11 flex-1 rounded-full border border-hairline px-4 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 focus-visible:ring-offset-0 focus:border-primary-900 sm:min-h-10"
              disabled={sending || loading}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || loading}
              aria-label="Send message"
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-primary-900 px-4 py-2 text-white transition-colors hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10 sm:min-w-10"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
