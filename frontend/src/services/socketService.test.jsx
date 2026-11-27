import { io } from "socket.io-client";
import socketService from "./socketService";

jest.mock("socket.io-client", () => ({
  io: jest.fn(),
}));

const createSocketMock = () => {
  const handlers = new Map();
  return {
    connected: false,
    emit: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn((event, cb) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event).add(cb);
    }),
    off: jest.fn((event, cb) => {
      if (!cb) {
        handlers.delete(event);
      } else {
        handlers.get(event)?.delete(cb);
      }
    }),
    __trigger: (event, ...args) => {
      const set = handlers.get(event);
      if (!set) return;
      for (const cb of set) cb(...args);
    },
  };
};

beforeEach(() => {
  io.mockImplementation(() => createSocketMock());
});

afterEach(() => {
  socketService.disconnect();
  jest.clearAllMocks();
});

test("queues joinRequest & listeners until connect and removes only targeted callback on off()", () => {
  const earlyCb = jest.fn();
  const secondCb = jest.fn();

  // Registered before init() and before connect fires
  socketService.joinUserRoom("u1");
  socketService.joinRequest("room-1");
  socketService.onNewMessage(earlyCb);
  socketService.onNewMessage(secondCb);

  socketService.init("jwt-token");
  expect(io).toHaveBeenCalledTimes(2);

  const reqNs = socketService.getRequestNamespace();
  reqNs.connected = true;
  reqNs.__trigger("connect");

  expect(reqNs.emit).toHaveBeenCalledWith("join-user-room", "u1");
  expect(reqNs.emit).toHaveBeenCalledWith("join_request", { requestId: "room-1" });

  reqNs.__trigger("new-message", { content: "hi" });
  expect(earlyCb).toHaveBeenCalledWith({ content: "hi" });
  expect(secondCb).toHaveBeenCalledWith({ content: "hi" });

  // Removing earlyCb leaves secondCb intact
  socketService.off("new-message", earlyCb);
  reqNs.__trigger("new-message", { content: "hi2" });
  expect(earlyCb).toHaveBeenCalledTimes(1);
  expect(secondCb).toHaveBeenCalledTimes(2);
});
