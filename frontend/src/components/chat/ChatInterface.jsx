import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import chatApi from "../../api/chatApi";
import { useAuth } from "../../contexts/AuthContext";
import socketService from "../../services/socketService";
import ChatMessage from "./ChatMessage";
import ConversationList from "./ConversationList";

const getRoomId = (conversation) =>
  conversation?.serviceRequest?._id || conversation?._id || null;

const appendUniqueMessage = (prevMessages, incoming) => {
  if (!incoming) return prevMessages;
  if (incoming._id && prevMessages.some((m) => m._id === incoming._id)) {
    return prevMessages;
  }
  return [...prevMessages, incoming];
};

const ChatInterface = ({ requestId = null }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const selectedConversationRef = useRef(null);
  const activeRoomRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id;

  selectedConversationRef.current = selectedConversation;

  const fetchConversations = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const response = await chatApi.getConversations();
      if (response.success) {
        setConversations(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      if (!silent) toast.error("Failed to load conversations");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(
    async (roomId) => {
      try {
        setLoadingMessages(true);
        const response = await chatApi.getMessages(roomId);
        if (response.success) {
          setMessages(response.data.messages || []);
          fetchConversations({ silent: true });
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
      } finally {
        setLoadingMessages(false);
      }
    },
    [fetchConversations],
  );

  const handleConversationSelect = useCallback((conversation) => {
    const prevRoom = activeRoomRef.current;
    const nextRoom = getRoomId(conversation);

    if (prevRoom && prevRoom !== nextRoom) {
      socketService.leaveRequest(prevRoom);
    }

    activeRoomRef.current = nextRoom;
    setSelectedConversation(conversation);
    setMessages([]);

    if (nextRoom) {
      socketService.joinRequest(nextRoom);
    }
  }, []);

  useEffect(() => {
    fetchConversations();

    const handleNewMessage = (data) => {
      const activeConv = selectedConversationRef.current;
      const activeRoom = getRoomId(activeConv);
      const matchesActive =
        activeConv &&
        (data.requestId === activeRoom ||
          data.chatId === activeRoom ||
          data.chatId === activeConv._id);

      if (matchesActive) {
        setMessages((prev) => appendUniqueMessage(prev, data));
        const senderId = data?.sender?._id || data?.sender?.id || data?.sender;
        if (
          currentUserId &&
          senderId &&
          senderId.toString() !== currentUserId.toString()
        ) {
          chatApi.markAsRead(activeRoom).catch(() => {});
        }
      }

      fetchConversations({ silent: true });
    };

    const handleChatCleared = (data) => {
      const activeConv = selectedConversationRef.current;
      const activeRoom = getRoomId(activeConv);
      if (
        activeConv &&
        (data.requestId === activeRoom ||
          data.chatId === activeRoom ||
          data.chatId === activeConv._id)
      ) {
        setMessages([]);
      }
      fetchConversations({ silent: true });
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onChatCleared(handleChatCleared);

    return () => {
      socketService.off("new-message", handleNewMessage);
      socketService.off("chat-cleared", handleChatCleared);
      if (activeRoomRef.current) {
        socketService.leaveRequest(activeRoomRef.current);
        activeRoomRef.current = null;
      }
    };
  }, [currentUserId, fetchConversations]);

  // Auto-select or create conversation when requestId is provided in URL
  useEffect(() => {
    if (!requestId) return undefined;

    const currentActiveRoom = getRoomId(selectedConversationRef.current);
    if (
      currentActiveRoom === requestId ||
      selectedConversationRef.current?._id === requestId
    ) {
      return undefined;
    }

    const existing = conversations.find(
      (conv) =>
        conv.serviceRequest?._id === requestId || conv._id === requestId,
    );
    if (existing) {
      handleConversationSelect(existing);
      return undefined;
    }

    let cancelled = false;
    chatApi
      .getOrCreateConversation(requestId)
      .then((response) => {
        if (cancelled || !response?.success || !response.data) return;
        const createdChat = response.data;
        setConversations((prev) =>
          prev.some((c) => c._id === createdChat._id)
            ? prev
            : [createdChat, ...prev],
        );
        handleConversationSelect(createdChat);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to open conversation for requestId:", error);
          toast.error(error?.message || "Could not open chat for this request");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requestId, conversations, handleConversationSelect]);

  useEffect(() => {
    const roomId = getRoomId(selectedConversation);
    if (roomId) {
      fetchMessages(roomId);
    }
  }, [selectedConversation, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendPayloadMessage = async (messageData) => {
    if (!selectedConversation) return;
    const roomId = getRoomId(selectedConversation);
    const isDirectChat =
      Boolean(selectedConversation.isDirectChat) ||
      !selectedConversation.serviceRequest;

    try {
      setSending(true);
      const response = isDirectChat
        ? await chatApi.sendDirectMessage(selectedConversation._id, messageData)
        : await chatApi.sendMessage(roomId, messageData);

      if (response.success) {
        setMessages((prev) => appendUniqueMessage(prev, response.data));
        fetchConversations({ silent: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error?.message || "Failed to send message");
      return false;
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const ok = await sendPayloadMessage({
      content: newMessage.trim(),
      messageType: "text",
    });
    if (ok) {
      setNewMessage("");
    }
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedConversation) return;

    try {
      setUploading(true);
      const uploadResponse = await chatApi.uploadAttachment(file);
      if (!uploadResponse?.success || !uploadResponse.data?.url) {
        throw new Error(uploadResponse?.message || "Failed to upload file");
      }

      const { url, fileName, messageType } = uploadResponse.data;
      const caption = newMessage.trim() || fileName || "Attachment";
      const ok = await sendPayloadMessage({
        content: caption,
        messageType,
        fileUrl: url,
      });
      if (ok && newMessage.trim()) {
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error uploading attachment:", error);
      toast.error(error?.message || "Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  };

  const getOtherParticipant = () => {
    if (!selectedConversation) return null;
    if (user?.role === "customer") {
      return selectedConversation.mechanic;
    }
    return selectedConversation.customer;
  };

  const handleDeleteChat = async () => {
    if (!selectedConversation) return;
    const roomId = getRoomId(selectedConversation);
    if (
      !window.confirm(
        "Delete all messages in this chat? This cannot be undone.",
      )
    )
      return;
    try {
      await chatApi.deleteChat(roomId);
      setMessages([]);
      fetchConversations({ silent: true });
      toast.success("Chat cleared");
    } catch (err) {
      toast.error("Failed to delete chat");
    }
  };

  const getServiceRequestTitle = (serviceRequest) => {
    if (!serviceRequest) return "Unknown Request";

    const issueTypes = {
      flat_tire: "Flat Tire",
      battery_dead: "Dead Battery",
      fuel_empty: "Out of Fuel",
      engine_trouble: "Engine Trouble",
      accident: "Accident",
      key_locked: "Keys Locked",
      overheating: "Overheating",
      brake_failure: "Brake Failure",
      transmission_issue: "Transmission Issue",
      other: "Other Issue",
    };

    return issueTypes[serviceRequest.issueType] || "Service Request";
  };

  return (
    <div className="flex h-full bg-white rounded-lg shadow-sm border">
      {/* Conversation List */}
      <div
        className={`${
          selectedConversation ? "hidden md:block" : "block"
        } w-full md:w-1/3 border-r border-hairline p-4 overflow-y-auto`}
      >
        <h2 className="text-lg font-semibold text-ink mb-4">
          Conversations
        </h2>
        <ConversationList
          conversations={conversations}
          loading={loading}
          onConversationSelect={handleConversationSelect}
          selectedConversationId={selectedConversation?._id}
        />
      </div>

      {/* Chat Area */}
      <div
        className={`${
          selectedConversation ? "flex" : "hidden md:flex"
        } flex-1 flex-col min-w-0`}
      >
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-hairline bg-surface">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleConversationSelect(null)}
                    aria-label="Back to conversations"
                    className="md:hidden p-1.5 rounded-lg text-secondary-600 hover:bg-white"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-ink truncate">
                      {getOtherParticipant()?.name || "Unknown User"}
                    </h3>
                    <p className="text-sm text-secondary-500 truncate">
                      {selectedConversation.serviceRequest
                        ? getServiceRequestTitle(
                            selectedConversation.serviceRequest,
                          )
                        : "Direct Message"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-secondary-500">
                    Status:{" "}
                    {selectedConversation.serviceRequest?.status || "Active"}
                  </span>
                  <button
                    type="button"
                    onClick={handleDeleteChat}
                    title="Delete chat history"
                    className="p-1.5 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-secondary-500">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatMessage key={message._id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-hairline">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.doc,.docx,image/*"
                className="hidden"
                onChange={handleFileSelected}
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelected}
              />
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full rounded-lg border border-hairline pl-4 pr-16 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 focus-visible:ring-offset-0 focus:border-primary-900"
                    disabled={sending || uploading}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || uploading}
                      className="p-1 text-secondary-400 hover:text-secondary-600 disabled:opacity-50"
                      title="Attach file"
                      aria-label="Attach file"
                    >
                      <PaperClipIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={sending || uploading}
                      className="p-1 text-secondary-400 hover:text-secondary-600 disabled:opacity-50"
                      title="Send image"
                      aria-label="Send image"
                    >
                      <PhotoIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending || uploading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  {uploading ? "Uploading..." : sending ? "Sending..." : "Send"}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-secondary-500 text-lg">
                Select a conversation to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
