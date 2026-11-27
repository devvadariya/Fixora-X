const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../config/logger');

const isChatParticipant = (chat, userId) =>
  chat.participants.some((participant) => participant.toString() === userId.toString());

const findChatByIdentifier = async (identifier) => {
  if (!mongoose.Types.ObjectId.isValid(identifier)) {
    return null;
  }

  let chat = await Chat.findOne({ serviceRequest: identifier, isActive: true });
  if (!chat) {
    chat = await Chat.findOne({ _id: identifier, isActive: true });
  }
  return chat;
};

const formatChatSocketPayload = (chat, savedMessage, fallbackUser) => {
  const chatId = chat._id.toString();
  const requestId = chat.serviceRequest ? chat.serviceRequest.toString() : chatId;
  const senderId = (savedMessage.sender?._id || savedMessage.sender || fallbackUser.id).toString();
  const senderName = savedMessage.sender?.name || fallbackUser.name;
  return {
    _id: savedMessage._id.toString(),
    chatId,
    requestId,
    sender: { _id: senderId, name: senderName },
    content: savedMessage.content,
    messageType: savedMessage.messageType || 'text',
    fileUrl: savedMessage.fileUrl || null,
    isRead: Boolean(savedMessage.isRead),
    createdAt: savedMessage.createdAt
  };
};

const emitToChatParticipants = (req, chat, event, payload) => {
  const io = req.app.get('io');
  if (!io) return;

  const requestNamespace = io.of('/requests');
  const roomTargets = new Set([`request_${chat._id.toString()}`]);
  if (chat.serviceRequest) {
    roomTargets.add(`request_${chat.serviceRequest.toString()}`);
  }
  for (const participant of chat.participants) {
    if (participant) {
      roomTargets.add(`user_${participant.toString()}`);
    }
  }

  let emitter = requestNamespace;
  for (const room of roomTargets) {
    emitter = emitter.to(room);
  }
  emitter.emit(event, payload);
};

const persistAndBroadcastMessage = async ({ req, chat, content, messageType = 'text', fileUrl = null }) => {
  const userId = req.user.id;
  const message = await chat.addMessage(userId, content.trim(), messageType, fileUrl || null);
  const populatedChat = await Chat.findById(chat._id).populate('messages.sender', 'name');
  const savedMessage = populatedChat?.messages?.id(message._id) || message;

  const socketPayload = formatChatSocketPayload(chat, savedMessage, req.user);
  emitToChatParticipants(req, chat, 'new-message', socketPayload);
  return savedMessage;
};

const resolveOrCreateRequestChat = async (serviceRequestId, userId, populate = false) => {
  if (!mongoose.Types.ObjectId.isValid(serviceRequestId)) {
    return { status: 400, message: 'Invalid conversation identifier' };
  }

  // First check if this identifier actually refers to an existing direct chat or request chat
  const existingDirect = await Chat.findOne({
    _id: serviceRequestId,
    isDirectChat: true,
    isActive: true
  });
  if (existingDirect) {
    if (!isChatParticipant(existingDirect, userId)) {
      return { status: 403, message: 'Access denied' };
    }
    if (populate) {
      await existingDirect.populate([
        { path: 'customer', select: 'name email phone' },
        { path: 'mechanic', select: 'name email phone' },
        { path: 'messages.sender', select: 'name' }
      ]);
    }
    return { chat: existingDirect };
  }

  const serviceRequest = await ServiceRequest.findById(serviceRequestId);
  if (!serviceRequest) {
    return { status: 404, message: 'Service request not found' };
  }

  const customerId = serviceRequest.customerId || serviceRequest.customer;
  const mechanicId = serviceRequest.mechanicId || serviceRequest.mechanic;
  const isCustomer = customerId?.toString() === userId.toString();
  const isMechanic = mechanicId?.toString() === userId.toString();

  if (!isCustomer && !isMechanic) {
    return { status: 403, message: 'Access denied' };
  }

  if (!mechanicId) {
    return { status: 400, message: 'Chat is available once a mechanic is assigned to this request' };
  }

  let chat = await Chat.findOne({
    serviceRequest: serviceRequestId,
    isActive: true
  });

  if (!chat) {
    chat = new Chat({
      participants: [customerId, mechanicId].filter(Boolean),
      serviceRequest: serviceRequestId,
      customer: customerId,
      mechanic: mechanicId,
      messages: []
    });
    await chat.save();
  }

  if (populate) {
    chat = await Chat.findById(chat._id)
      .populate('customer', 'name email phone')
      .populate('mechanic', 'name email phone')
      .populate('serviceRequest', 'issueType description status')
      .populate('messages.sender', 'name');
  }

  return { chat };
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         sender:
 *           type: string
 *           description: User ID of the message sender
 *         content:
 *           type: string
 *           description: Message content
 *         messageType:
 *           type: string
 *           enum: [text, image, file]
 *           description: Type of message
 *         fileUrl:
 *           type: string
 *           description: URL of attached file (if any)
 *         isRead:
 *           type: boolean
 *           description: Whether the message has been read
 *         createdAt:
 *           type: string
 *           format: date-time
 *     Chat:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *         serviceRequest:
 *           type: string
 *         messages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Message'
 *         customer:
 *           type: string
 *         mechanic:
 *           type: string
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: Get user's chat conversations
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chat conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Chat'
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    logger.info('Getting conversations for user:', { userId, userRole: req.user.role });
    
    const conversations = await Chat.find({
      participants: userId,
      isActive: true
    })
    .populate('customer', 'name email phone')
    .populate('mechanic', 'name email phone')
    .populate('serviceRequest', 'issueType description status')
    .populate('messages.sender', 'name')
    .sort({ updatedAt: -1 });

    logger.info('Found conversations:', { 
      count: conversations.length,
      conversationIds: conversations.map(c => c._id)
    });

    // Add unread count for each conversation
    const conversationsWithUnreadCount = conversations.map(chat => {
      const unreadCount = chat.messages.filter(msg => {
        const senderId = msg.sender?._id || msg.sender;
        return !msg.isRead && senderId && senderId.toString() !== userId.toString();
      }).length;
      
      return {
        ...chat.toObject(),
        unreadCount
      };
    });

    logger.info('Conversations retrieved successfully', { 
      userId, 
      conversationCount: conversationsWithUnreadCount.length 
    });
    
    return sendSuccessResponse(res, 200, 'Conversations retrieved successfully', conversationsWithUnreadCount);
  } catch (error) {
    logger.error('Error getting conversations:', error);
    return sendErrorResponse(res, 500, 'Failed to get conversations');
  }
};

/**
 * @swagger
 * /api/chat/conversations/{serviceRequestId}:
 *   get:
 *     summary: Get or create chat conversation for a service request
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceRequestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat conversation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Chat'
 */
const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceRequestId } = req.params;

    const result = await resolveOrCreateRequestChat(serviceRequestId, userId, true);
    if (result.status) {
      return sendErrorResponse(res, result.status, result.message);
    }

    const { chat } = result;
    await chat.markAsRead(userId);

    logger.info('Chat conversation retrieved/created successfully', {
      userId,
      serviceRequestId,
      chatId: chat._id
    });

    return sendSuccessResponse(res, 200, 'Chat conversation retrieved successfully', chat);
  } catch (error) {
    logger.error('Error getting/creating chat conversation:', error);
    return sendErrorResponse(res, 500, 'Failed to get chat conversation');
  }
};

/**
 * @swagger
 * /api/chat/conversations/{serviceRequestId}/messages:
 *   post:
 *     summary: Send a message in a chat conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceRequestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 required: true
 *               messageType:
 *                 type: string
 *                 enum: [text, image, file]
 *                 default: text
 *               fileUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 */
const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceRequestId } = req.params;
    const { content, messageType = 'text', fileUrl } = req.body;

    if (!content || content.trim().length === 0) {
      return sendErrorResponse(res, 400, 'Message content is required');
    }

    const result = await resolveOrCreateRequestChat(serviceRequestId, userId, false);
    if (result.status) {
      return sendErrorResponse(res, result.status, result.message);
    }

    const savedMessage = await persistAndBroadcastMessage({
      req,
      chat: result.chat,
      content,
      messageType,
      fileUrl
    });

    logger.info('Message sent successfully', {
      userId,
      serviceRequestId,
      messageId: savedMessage._id
    });

    return sendSuccessResponse(res, 200, 'Message sent successfully', savedMessage);
  } catch (error) {
    logger.error('Error sending message:', error);
    return sendErrorResponse(res, 500, 'Failed to send message');
  }
};

/**
 * @swagger
 * /api/chat/conversations/{serviceRequestId}/messages:
 *   get:
 *     summary: Get messages from a chat conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceRequestId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 */
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceRequestId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get chat conversation — try by serviceRequestId first, fall back to chatId (for direct chats)
    const chat = await findChatByIdentifier(serviceRequestId);

    if (!chat) {
      return sendErrorResponse(res, 404, 'Chat conversation not found');
    }

    // Verify user is a participant (use .toString() for ObjectId comparison)
    if (!isChatParticipant(chat, userId)) {
      return sendErrorResponse(res, 403, 'Access denied');
    }

    // Mark messages as read
    await chat.markAsRead(userId);

    // Get messages with pagination
    const messages = await Chat.aggregate([
      { $match: { _id: chat._id } },
      { $unwind: '$messages' },
      { $sort: { 'messages.createdAt': -1 } },
      { $skip: skip },
      { $limit: limit },
      { $sort: { 'messages.createdAt': 1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'messages.sender',
          foreignField: '_id',
          as: 'senderInfo'
        }
      },
      {
        $addFields: {
          'messages.sender': { $arrayElemAt: ['$senderInfo', 0] }
        }
      },
      { $project: { messages: 1 } }
    ]);

    const totalMessages = chat.messages.length;
    const totalPages = Math.ceil(totalMessages / limit);

    const response = {
      messages: messages.map(m => m.messages),
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: totalPages
      }
    };

    logger.info('Messages retrieved successfully', { 
      userId, 
      serviceRequestId, 
      page, 
      limit 
    });

    return sendSuccessResponse(res, 200, 'Messages retrieved successfully', response);
  } catch (error) {
    logger.error('Error getting messages:', error);
    return sendErrorResponse(res, 500, 'Failed to get messages');
  }
};

/**
 * @swagger
 * /api/chat/direct-chat:
 *   post:
 *     summary: Create a direct chat conversation with a mechanic
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mechanicId:
 *                 type: string
 *                 required: true
 *               serviceRequestData:
 *                 type: object
 *                 properties:
 *                   issueType:
 *                     type: string
 *                   description:
 *                     type: string
 *                   location:
 *                     type: object
 *                   vehicleInfo:
 *                     type: object
 *     responses:
 *       200:
 *         description: Direct chat created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Chat'
 */
const createDirectChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mechanicId, customerId } = req.body;

    let resolvedCustomerId;
    let resolvedMechanicId;

    if (req.user.role === 'mechanic') {
      if (!customerId) {
        return sendErrorResponse(res, 400, 'Customer ID is required');
      }
      const customer = await User.findOne({ _id: customerId, role: 'customer', isActive: true });
      if (!customer) {
        return sendErrorResponse(res, 404, 'Customer not found or inactive');
      }
      resolvedCustomerId = customerId;
      resolvedMechanicId = userId;
    } else {
      if (!mechanicId) {
        return sendErrorResponse(res, 400, 'Mechanic ID is required');
      }
      const mechanic = await User.findOne({ _id: mechanicId, role: 'mechanic', isActive: true });
      if (!mechanic) {
        return sendErrorResponse(res, 404, 'Mechanic not found or inactive');
      }
      resolvedCustomerId = userId;
      resolvedMechanicId = mechanicId;
    }

    // Find existing direct chat between this customer and mechanic (NO service request)
    let chat = await Chat.findOne({
      customer: resolvedCustomerId,
      mechanic: resolvedMechanicId,
      isDirectChat: true,
      isActive: true
    })
      .populate('customer', 'name email phone')
      .populate('mechanic', 'name email phone')
      .populate('messages.sender', 'name');

    if (!chat) {
      // Create a brand-new direct-only chat (no ServiceRequest document at all)
      const newChat = new Chat({
        participants: [resolvedCustomerId, resolvedMechanicId],
        serviceRequest: null,
        isDirectChat: true,
        customer: resolvedCustomerId,
        mechanic: resolvedMechanicId,
        messages: []
      });
      await newChat.save();

      chat = await Chat.findById(newChat._id)
        .populate('customer', 'name email phone')
        .populate('mechanic', 'name email phone')
        .populate('messages.sender', 'name');
    } else {
      await chat.markAsRead(userId);
    }

    logger.info('Direct chat ready', {
      userId,
      customerId: resolvedCustomerId,
      mechanicId: resolvedMechanicId,
      chatId: chat._id
    });
    return sendSuccessResponse(res, 200, 'Direct chat ready', chat);
  } catch (error) {
    logger.error('Error creating direct chat:', error);
    return sendErrorResponse(res, 500, 'Failed to create direct chat');
  }
};

// Send a message in a direct chat keyed by chatId
const sendDirectMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { content, messageType = 'text', fileUrl } = req.body;

    if (!content || !content.trim()) {
      return sendErrorResponse(res, 400, 'Message content is required');
    }

    const chat = await findChatByIdentifier(chatId);
    if (!chat) {
      return sendErrorResponse(res, 404, 'Chat not found');
    }

    if (!isChatParticipant(chat, userId)) {
      return sendErrorResponse(res, 403, 'Access denied');
    }

    const savedMessage = await persistAndBroadcastMessage({
      req,
      chat,
      content,
      messageType,
      fileUrl
    });

    logger.info('Direct message sent', { userId, chatId, messageId: savedMessage._id });
    return sendSuccessResponse(res, 200, 'Message sent successfully', savedMessage);
  } catch (error) {
    logger.error('Error sending direct message:', error);
    return sendErrorResponse(res, 500, 'Failed to send message');
  }
};

/**
 * @swagger
 * /api/chat/conversations/{serviceRequestId}/read:
 *   post:
 *     summary: Mark messages as read in a chat conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceRequestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     readCount:
 *                       type: integer
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceRequestId } = req.params;

    const chat = await findChatByIdentifier(serviceRequestId);
    if (!chat) {
      return sendErrorResponse(res, 404, 'Chat conversation not found');
    }

    if (!isChatParticipant(chat, userId)) {
      return sendErrorResponse(res, 403, 'Access denied');
    }

    const readCount = await chat.markAsRead(userId);

    logger.info('Messages marked as read', { userId, serviceRequestId, readCount });
    return sendSuccessResponse(res, 200, 'Messages marked as read successfully', { readCount });
  } catch (error) {
    logger.error('Error marking messages as read:', error);
    return sendErrorResponse(res, 500, 'Failed to mark messages as read');
  }
};

// Delete/clear a chat conversation (soft-delete all messages)
const deleteChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;

    const chat = await findChatByIdentifier(chatId);
    if (!chat) {
      return sendErrorResponse(res, 404, 'Chat not found');
    }

    if (!isChatParticipant(chat, userId)) {
      return sendErrorResponse(res, 403, 'Access denied');
    }

    // Clear all messages from the chat
    chat.messages = [];
    chat.lastMessage = undefined;
    await chat.save();

    emitToChatParticipants(req, chat, 'chat-cleared', {
      chatId: chat._id.toString(),
      requestId: chat.serviceRequest ? chat.serviceRequest.toString() : chat._id.toString()
    });

    logger.info('Chat messages deleted', { userId, chatId });
    return sendSuccessResponse(res, 200, 'Chat cleared successfully', {});
  } catch (error) {
    logger.error('Error deleting chat:', error);
    return sendErrorResponse(res, 500, 'Failed to delete chat');
  }
};

const uploadChatAttachment = async (req, res) => {
  try {
    if (!req.file || !req.file.url) {
      return sendErrorResponse(res, 400, 'No attachment file provided');
    }

    const rawUrl = req.file.url;
    const fileUrl = rawUrl.startsWith('/')
      ? `${req.protocol}://${req.get('host')}${rawUrl}`
      : rawUrl;
    const messageType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';

    return sendSuccessResponse(res, 200, 'Attachment uploaded successfully', {
      url: fileUrl,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      messageType
    });
  } catch (error) {
    logger.error('Error uploading chat attachment:', error);
    return sendErrorResponse(res, 500, 'Failed to upload attachment');
  }
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  sendMessage,
  getMessages,
  markAsRead,
  createDirectChat,
  sendDirectMessage,
  deleteChat,
  uploadChatAttachment
};
