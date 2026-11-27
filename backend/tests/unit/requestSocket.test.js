const jwt = require('jsonwebtoken');
const initializeRequestSocket = require('../../src/socket/requestSocket');
const User = require('../../src/models/User');
const Chat = require('../../src/models/Chat');
const ServiceRequest = require('../../src/models/ServiceRequest');

jest.mock('../../src/models/User');
jest.mock('../../src/models/Chat');
jest.mock('../../src/models/ServiceRequest');

describe('requestSocket unit tests', () => {
  let middleware;
  let connectionHandler;
  let roomEmitter;
  let namespace;

  beforeEach(() => {
    jest.clearAllMocks();
    roomEmitter = { emit: jest.fn() };
    namespace = {
      use: jest.fn((fn) => {
        middleware = fn;
      }),
      on: jest.fn((event, fn) => {
        if (event === 'connection') connectionHandler = fn;
      }),
      to: jest.fn(() => roomEmitter),
      emit: jest.fn()
    };
    const mockIo = { of: jest.fn(() => namespace) };
    initializeRequestSocket(mockIo);
  });

  test('rejects socket connection without valid JWT token', async () => {
    const next = jest.fn();
    await middleware({ handshake: { auth: {} } }, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('authenticates socket user, joins personal room, and blocks unauthorized join_request', async () => {
    const token = jwt.sign({ id: 'user-1' }, process.env.JWT_SECRET);
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: 'user-1',
        name: 'Alex',
        role: 'customer',
        isActive: true
      })
    });

    const socketHandlers = {};
    const socket = {
      id: 'sock-1',
      handshake: { auth: { token } },
      join: jest.fn(),
      leave: jest.fn(),
      on: jest.fn((event, fn) => {
        socketHandlers[event] = fn;
      })
    };

    const next = jest.fn();
    await middleware(socket, next);
    expect(next).toHaveBeenCalledWith();
    expect(socket.user).toEqual({ id: 'user-1', name: 'Alex', role: 'customer' });

    connectionHandler(socket);
    expect(socket.join).toHaveBeenCalledWith('user_user-1');

    // Unauthorized chat room join should be denied
    Chat.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({ participants: ['other-user'] })
    });
    await socketHandlers.join_request({ requestId: 'chat-99' });
    expect(socket.join).not.toHaveBeenCalledWith('request_chat-99');

    // Authorized chat room join + send-message emits canonical payload with requestId & chatId
    Chat.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({ participants: ['user-1', 'mech-1'] })
    });
    await socketHandlers.join_request({ requestId: 'chat-1' });
    expect(socket.join).toHaveBeenCalledWith('request_chat-1');

    await socketHandlers['send-message']({
      requestId: 'chat-1',
      message: 'Live test'
    });
    expect(namespace.to).toHaveBeenCalledWith('request_chat-1');
    expect(roomEmitter.emit).toHaveBeenCalledWith(
      'new-message',
      expect.objectContaining({
        chatId: 'chat-1',
        requestId: 'chat-1',
        content: 'Live test',
        sender: { _id: 'user-1', name: 'Alex' }
      })
    );
  });
});
