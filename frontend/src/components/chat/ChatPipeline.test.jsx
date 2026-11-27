import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import chatApi from "../../api/chatApi";
import socketService from "../../services/socketService";
import ChatInterface from "./ChatInterface";
import ChatMessage from "./ChatMessage";
import ChatModal from "./ChatModal";

let mockUser = { id: "user-1", name: "Alex Customer", role: "customer" };

jest.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

jest.mock("../../api/chatApi", () => ({
  __esModule: true,
  default: {
    getConversations: jest.fn(),
    getOrCreateConversation: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
    markAsRead: jest.fn(),
    createDirectChat: jest.fn(),
    sendDirectMessage: jest.fn(),
    deleteChat: jest.fn(),
    uploadAttachment: jest.fn(),
  },
}));

const mockListeners = new Map();
jest.mock("../../services/socketService", () => ({
  __esModule: true,
  default: {
    joinRequest: jest.fn(),
    leaveRequest: jest.fn(),
    onNewMessage: jest.fn(),
    onChatCleared: jest.fn(),
    off: jest.fn(),
    sendMessage: jest.fn(),
    __emit: (event, payload) => {
      const set = mockListeners.get(event);
      if (!set) return;
      for (const cb of set) cb(payload);
    },
    __clear: () => mockListeners.clear(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  socketService.__clear();
  socketService.onNewMessage.mockImplementation((cb) => {
    if (!mockListeners.has("new-message")) mockListeners.set("new-message", new Set());
    mockListeners.get("new-message").add(cb);
  });
  socketService.onChatCleared.mockImplementation((cb) => {
    if (!mockListeners.has("chat-cleared")) mockListeners.set("chat-cleared", new Set());
    mockListeners.get("chat-cleared").add(cb);
  });
  socketService.off.mockImplementation((event, cb) => {
    if (!cb) {
      mockListeners.delete(event);
    } else {
      mockListeners.get(event)?.delete(cb);
    }
  });
  mockUser = { id: "user-1", name: "Alex Customer", role: "customer" };
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
  chatApi.markAsRead.mockResolvedValue({ success: true, data: { readCount: 0 } });
});

test("ChatMessage handles user._id fallback and missing/string sender safely", () => {
  mockUser = { _id: "user-1", name: "Alex Customer", role: "customer" };
  const { container } = render(
    <ChatMessage
      message={{
        _id: "m1",
        sender: "user-1",
        content: "Hello",
        createdAt: "2026-11-27T10:00:00.000Z",
        isRead: true,
      }}
    />,
  );

  expect(screen.getByText("Hello")).toBeInTheDocument();
  expect(container.firstElementChild).toHaveClass("justify-end");
});

test("ChatInterface receives live socket messages without stale closure or duplicate sends", async () => {
  const conv = {
    _id: "chat-1",
    isDirectChat: false,
    serviceRequest: { _id: "req-1", issueType: "flat_tire", status: "assigned" },
    customer: { _id: "user-1", name: "Alex Customer" },
    mechanic: { _id: "mech-1", name: "Sam Mechanic" },
    messages: [],
    unreadCount: 0,
  };
  chatApi.getConversations.mockResolvedValue({ success: true, data: [conv] });
  chatApi.getMessages.mockResolvedValue({ success: true, data: { messages: [] } });
  chatApi.sendMessage.mockResolvedValue({
    success: true,
    data: {
      _id: "msg-1",
      sender: { _id: "user-1", name: "Alex Customer" },
      content: "On my way?",
      createdAt: "2026-11-27T10:01:00.000Z",
      isRead: false,
    },
  });

  render(
    <MemoryRouter>
      <ChatInterface />
    </MemoryRouter>,
  );

  await waitFor(() => expect(screen.getByText("Sam Mechanic")).toBeInTheDocument());
  fireEvent.click(screen.getByText("Sam Mechanic"));

  await waitFor(() => expect(socketService.joinRequest).toHaveBeenCalledWith("req-1"));

  // Send a message and confirm REST response + echo socket event deduplicate to 1 bubble
  fireEvent.change(screen.getByPlaceholderText("Type your message..."), {
    target: { value: "On my way?" },
  });
  fireEvent.submit(screen.getByRole("button", { name: /^send$/i }).closest("form"));

  await waitFor(() => expect(screen.getAllByText("On my way?")).toHaveLength(1));
  expect(socketService.sendMessage).not.toHaveBeenCalled();

  act(() => {
    socketService.__emit("new-message", {
      _id: "msg-1",
      chatId: "chat-1",
      requestId: "req-1",
      sender: { _id: "user-1", name: "Alex Customer" },
      content: "On my way?",
      createdAt: "2026-11-27T10:01:00.000Z",
    });
  });
  expect(screen.getAllByText("On my way?")).toHaveLength(1);

  // Incoming reply from mechanic arrives live after conversation selection
  act(() => {
    socketService.__emit("new-message", {
      _id: "msg-2",
      chatId: "chat-1",
      requestId: "req-1",
      sender: { _id: "mech-1", name: "Sam Mechanic" },
      content: "Yes, 5 mins away",
      createdAt: "2026-11-27T10:02:00.000Z",
    });
  });
  await waitFor(() =>
    expect(screen.getByText("Yes, 5 mins away")).toBeInTheDocument(),
  );
});

test("ChatInterface creates/opens conversation when requestId prop is absent from inbox", async () => {
  mockUser = { id: "mech-1", name: "Sam Mechanic", role: "mechanic" };
  const createdConv = {
    _id: "chat-new",
    serviceRequest: { _id: "req-99", issueType: "battery_dead", status: "assigned" },
    customer: { _id: "user-1", name: "Alex Customer" },
    mechanic: { _id: "mech-1", name: "Sam Mechanic" },
    messages: [],
  };

  chatApi.getConversations.mockResolvedValue({ success: true, data: [] });
  chatApi.getOrCreateConversation.mockResolvedValue({ success: true, data: createdConv });
  chatApi.getMessages.mockResolvedValue({ success: true, data: { messages: [] } });

  render(
    <MemoryRouter>
      <ChatInterface requestId="req-99" />
    </MemoryRouter>,
  );

  await waitFor(() =>
    expect(chatApi.getOrCreateConversation).toHaveBeenCalledWith("req-99"),
  );
  await waitFor(() =>
    expect(socketService.joinRequest).toHaveBeenCalledWith("req-99"),
  );
  expect(screen.getByText("Alex Customer")).toBeInTheDocument();
});

test("ChatInterface uploads image attachments and sends an image message", async () => {
  const conv = {
    _id: "chat-1",
    serviceRequest: { _id: "req-1", issueType: "flat_tire", status: "assigned" },
    customer: { _id: "user-1", name: "Alex Customer" },
    mechanic: { _id: "mech-1", name: "Sam Mechanic" },
    messages: [],
  };
  chatApi.getConversations.mockResolvedValue({ success: true, data: [conv] });
  chatApi.getMessages.mockResolvedValue({ success: true, data: { messages: [] } });
  chatApi.uploadAttachment.mockResolvedValue({
    success: true,
    data: {
      url: "http://localhost:4000/uploads/chat/tire.png",
      fileName: "tire.png",
      messageType: "image",
    },
  });
  chatApi.sendMessage.mockResolvedValue({
    success: true,
    data: {
      _id: "msg-img",
      sender: { _id: "user-1", name: "Alex Customer" },
      content: "tire.png",
      messageType: "image",
      fileUrl: "http://localhost:4000/uploads/chat/tire.png",
      createdAt: "2026-11-27T10:03:00.000Z",
      isRead: false,
    },
  });

  const { container } = render(
    <MemoryRouter>
      <ChatInterface />
    </MemoryRouter>,
  );

  await waitFor(() => expect(screen.getByText("Sam Mechanic")).toBeInTheDocument());
  fireEvent.click(screen.getByText("Sam Mechanic"));
  await waitFor(() => expect(chatApi.getMessages).toHaveBeenCalled());

  const fileInputs = container.querySelectorAll('input[type="file"]');
  const file = new File(["png"], "tire.png", { type: "image/png" });
  fireEvent.change(fileInputs[1], { target: { files: [file] } });

  await waitFor(() => expect(chatApi.uploadAttachment).toHaveBeenCalledWith(file));
  await waitFor(() =>
    expect(chatApi.sendMessage).toHaveBeenCalledWith("req-1", {
      content: "tire.png",
      messageType: "image",
      fileUrl: "http://localhost:4000/uploads/chat/tire.png",
    }),
  );
  expect(screen.getByAltText("Shared content")).toHaveAttribute(
    "src",
    "http://localhost:4000/uploads/chat/tire.png",
  );
});

test("ChatModal resets direct chatId when reopened with a serviceRequestId and leaves rooms on close", async () => {
  const mechanic = { _id: "mech-1", name: "Sam Mechanic" };
  chatApi.createDirectChat.mockResolvedValue({
    success: true,
    data: { _id: "direct-1", messages: [] },
  });
  chatApi.getOrCreateConversation.mockResolvedValue({
    success: true,
    data: { _id: "chat-req-2", messages: [] },
  });
  chatApi.sendMessage.mockResolvedValue({
    success: true,
    data: {
      _id: "msg-req-2",
      sender: { _id: "user-1", name: "Alex Customer" },
      content: "Checking ETA",
      createdAt: "2026-11-27T10:05:00.000Z",
    },
  });

  const { rerender } = render(
    <ChatModal isOpen={true} onClose={jest.fn()} mechanic={mechanic} />,
  );

  await waitFor(() => expect(socketService.joinRequest).toHaveBeenCalledWith("direct-1"));

  rerender(
    <ChatModal
      isOpen={true}
      onClose={jest.fn()}
      mechanic={mechanic}
      serviceRequestId="req-2"
    />,
  );

  await waitFor(() => expect(socketService.leaveRequest).toHaveBeenCalledWith("direct-1"));
  await waitFor(() => expect(socketService.joinRequest).toHaveBeenCalledWith("req-2"));

  fireEvent.change(screen.getByPlaceholderText("Type your message..."), {
    target: { value: "Checking ETA" },
  });
  fireEvent.submit(screen.getByRole("button", { name: "Send message" }).closest("form"));

  await waitFor(() =>
    expect(chatApi.sendMessage).toHaveBeenCalledWith("req-2", {
      content: "Checking ETA",
      messageType: "text",
    }),
  );
  expect(chatApi.sendDirectMessage).not.toHaveBeenCalled();
});
