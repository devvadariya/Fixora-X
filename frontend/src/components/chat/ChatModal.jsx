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
  const activeRoomRef = useRef(null);
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !mechanic) {
      setChatId(null);
      setMessages([]);
      setNewMessage("");
      return undefined;
    }

    let cancelled = false;
    setChatId(null);
    setMessages([]);

    const handleNewMessage = (data) => {
      const roomId = activeRoomRef.current;
      if (!roomId) return;
      if (data.chatId === roomId || data.requestId === roomId) {
        setMessages((prev) => {
          if (data._id && prev.some((m) => m._id === data._id)) return prev;
          return [...prev, data];
        });
      }
    };

    const handleChatCleared = (data) => {
      const roomId = activeRoomRef.current;
      if (!roomId) return;
      if (data.chatId === roomId || data.requestId === roomId) {
        setMessages([]);
      }
    };

    const init = async () => {
      try {
        setLoading(true);
        if (serviceRequestId) {
          const response =
            await chatApi.getOrCreateConversation(serviceRequestId);
          if (cancelled) return;
          if (response.success) {
            setMessages(response.data.messages || []);
            activeRoomRef.current = serviceRequestId;
            socketService.joinRequest(serviceRequestId);
            socketService.onNewMessage(handleNewMessage);
            socketService.onChatCleared(handleChatCleared);
          }
        } else {
          const response = await chatApi.createDirectChat(mechanic._id);
          if (cancelled) return;
          if (response.success) {
            const chat = response.data;
            setChatId(chat._id);
            setMessages(chat.messages || []);
            activeRoomRef.current = chat._id;
            socketService.joinRequest(chat._id);
            socketService.onNewMessage(handleNewMessage);
            socketService.onChatCleared(handleChatCleared);
          } else {
            toast.error("Could not start chat. Please try again.");
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error initializing chat:", error);
          toast.error("Failed to load chat. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      socketService.off("new-message", handleNewMessage);
      socketService.off("chat-cleared", handleChatCleared);
      if (activeRoomRef.current) {
        socketService.leaveRequest(activeRoomRef.current);
        activeRoomRef.current = null;
      }
    };
  }, [isOpen, mechanic, serviceRequestId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const deleteChat = async () => {
    const id = serviceRequestId ? serviceRequestId : chatId;
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

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage("");

    // Optimistically add the message to UI
    const tempMsg = {
      _id: `temp-${Date.now()}`,
      sender: { _id: currentUserId, name: user?.name || "You" },
      content,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      setSending(true);
      const payload = { content, messageType: "text" };
      const response = serviceRequestId
        ? await chatApi.sendMessage(serviceRequestId, payload)
        : chatId
          ? await chatApi.sendDirectMessage(chatId, payload)
          : null;

      if (!response?.success) {
        throw new Error(response?.message || "Failed to send");
      }

      setMessages((prev) => {
        const replaced = prev.map((m) =>
          m._id === tempMsg._id ? response.data : m,
        );
        // Guard against duplicate if socket event arrived before REST response
        const seen = new Set();
        return replaced.filter((m) => {
          if (!m?._id) return true;
          if (seen.has(m._id)) return false;
          seen.add(m._id);
          return true;
        });
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
    } finally {
      setSending(false);
    }
  };

  const isOwnMessage = (message) => {
    const senderId =
      message?.sender?._id || message?.sender?.id || message?.sender;
    return Boolean(
      currentUserId &&
        senderId &&
        senderId.toString() === currentUserId.toString(),
    );
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
                    {message.messageType === "image" && message.fileUrl ? (
                      <div>
                        <img
                          src={message.fileUrl}
                          alt={message.content || "Shared attachment"}
                          className="max-w-full rounded-lg cursor-pointer"
                          onClick={() => window.open(message.fileUrl, "_blank")}
                        />
                        {message.content && (
                          <p className="mt-2 text-sm">{message.content}</p>
                        )}
                      </div>
                    ) : message.messageType === "file" && message.fileUrl ? (
                      <div className="space-y-1">
                        <p className="text-sm">{message.content}</p>
                        <a
                          href={message.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline"
                        >
                          View attachment
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
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
