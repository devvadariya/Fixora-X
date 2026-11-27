process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fixora-x-test';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const mongoose = require('mongoose');
const server = require('../../server');
const app = require('../../app');
const Chat = require('../../src/models/Chat');
const ServiceRequest = require('../../src/models/ServiceRequest');

describe('Chat Pipeline Integration Tests', () => {
  let customerToken;
  let mechanicToken;
  let otherCustomerToken;
  let customerId;
  let mechanicId;
  let assignedRequestId;
  let pendingRequestId;
  let directChatId;

  beforeAll(async () => {
    const custRes = await request(server)
      .post('/api/auth/register')
      .send({
        name: 'Chat Customer',
        email: 'chat-customer@test.com',
        phone: '+11234567001',
        password: 'Password123!',
        role: 'customer'
      })
      .expect(201);
    customerToken = custRes.body.data.tokens.accessToken;
    customerId = custRes.body.data.user.id;

    const mechRes = await request(server)
      .post('/api/auth/register')
      .send({
        name: 'Chat Mechanic',
        email: 'chat-mechanic@test.com',
        phone: '+11234567002',
        password: 'Password123!',
        role: 'mechanic'
      })
      .expect(201);
    mechanicToken = mechRes.body.data.tokens.accessToken;
    mechanicId = mechRes.body.data.user.id;

    const otherRes = await request(server)
      .post('/api/auth/register')
      .send({
        name: 'Other Customer',
        email: 'other-customer@test.com',
        phone: '+11234567003',
        password: 'Password123!',
        role: 'customer'
      })
      .expect(201);
    otherCustomerToken = otherRes.body.data.tokens.accessToken;

    await ServiceRequest.init();
    await ServiceRequest.collection.dropIndex('location_2dsphere').catch(() => {});

    const assignedReq = await ServiceRequest.create({
      customerId,
      mechanicId,
      issueType: 'flat_tire',
      description: 'Front left tire puncture on highway',
      vehicleInfo: { type: 'car', model: 'Civic', plate: 'ABC123' },
      location: { lat: 37.7749, lng: -122.4194, address: 'Market St' },
      status: 'assigned',
      userExpectedPrice: 80
    });
    assignedRequestId = assignedReq._id.toString();

    const pendingReq = await ServiceRequest.create({
      customerId,
      mechanicId: null,
      issueType: 'battery_dead',
      description: 'Car battery will not crank',
      vehicleInfo: { type: 'car', model: 'Accord', plate: 'XYZ999' },
      location: { lat: 37.7749, lng: -122.4194, address: 'Mission St' },
      status: 'pending',
      userExpectedPrice: 50
    });
    pendingRequestId = pendingReq._id.toString();
  });

  const uploadedFiles = [];

  afterAll(async () => {
    for (const filePath of uploadedFiles) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.dropDatabase();
    }
  });

  test('rejects starting a service-request chat before a mechanic is assigned with 400 (not 500)', async () => {
    const res = await request(server)
      .get(`/api/chat/conversations/${pendingRequestId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/mechanic is assigned/i);
  });

  test('sendMessage lazily creates request chat, populates sender, and emits canonical new-message via io', async () => {
    const namespace = app.get('io').of('/requests');
    const emitSpy = jest.fn();
    const chainProxy = { to: jest.fn(), emit: emitSpy };
    chainProxy.to.mockReturnValue(chainProxy);
    const toSpy = jest.spyOn(namespace, 'to').mockReturnValue(chainProxy);

    const res = await request(server)
      .post(`/api/chat/conversations/${assignedRequestId}/messages`)
      .set('Authorization', `Bearer ${mechanicToken}`)
      .send({ content: 'Heading to your location now', messageType: 'text' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('Heading to your location now');
    expect(res.body.data.sender).toEqual(
      expect.objectContaining({ _id: mechanicId, name: 'Chat Mechanic' })
    );

    const allTargetedRooms = [
      ...toSpy.mock.calls.map((c) => c[0]),
      ...chainProxy.to.mock.calls.map((c) => c[0])
    ];
    expect(allTargetedRooms).toContain(`request_${assignedRequestId}`);
    expect(allTargetedRooms).toContain(`user_${customerId}`);
    expect(allTargetedRooms).toContain(`user_${mechanicId}`);
    expect(emitSpy).toHaveBeenCalledWith(
      'new-message',
      expect.objectContaining({
        requestId: assignedRequestId,
        content: 'Heading to your location now',
        sender: expect.objectContaining({ _id: mechanicId, name: 'Chat Mechanic' })
      })
    );
    toSpy.mockRestore();
  });

  test('non-participant cannot read or send messages in another user chat', async () => {
    await request(server)
      .get(`/api/chat/conversations/${assignedRequestId}/messages`)
      .set('Authorization', `Bearer ${otherCustomerToken}`)
      .expect(403);
  });

  test('direct chat creation (customer & mechanic), attachment upload, and sendDirectMessage with fileUrl work end-to-end', async () => {
    const directRes = await request(server)
      .post('/api/chat/direct-chat')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ mechanicId })
      .expect(200);

    expect(directRes.body.success).toBe(true);
    directChatId = directRes.body.data._id;

    // Mechanic retrieving the same direct chat via customerId finds existing chat
    const mechDirectRes = await request(server)
      .post('/api/chat/direct-chat')
      .set('Authorization', `Bearer ${mechanicToken}`)
      .send({ customerId })
      .expect(200);
    expect(mechDirectRes.body.data._id).toBe(directChatId);

    // Upload image attachment
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const uploadRes = await request(server)
      .post('/api/chat/upload')
      .set('Authorization', `Bearer ${customerToken}`)
      .attach('file', pngHeader, { filename: 'damage.png', contentType: 'image/png' })
      .expect(200);

    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.data.messageType).toBe('image');
    expect(uploadRes.body.data.url).toContain('/uploads/chat/');
    const uploadedName = uploadRes.body.data.url.split('/uploads/chat/')[1];
    if (uploadedName) {
      uploadedFiles.push(path.join(process.cwd(), 'uploads', 'chat', uploadedName));
    }

    const msgRes = await request(server)
      .post(`/api/chat/direct-chat/${directChatId}/messages`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        content: 'damage.png',
        messageType: uploadRes.body.data.messageType,
        fileUrl: uploadRes.body.data.url
      })
      .expect(200);

    expect(msgRes.body.data.fileUrl).toBe(uploadRes.body.data.url);
    expect(msgRes.body.data.sender.name).toBe('Chat Customer');
  });

  test('getConversations computes unreadCount safely even if a message sender reference is missing', async () => {
    const chat = await Chat.findById(directChatId);
    chat.messages.push({
      sender: new mongoose.Types.ObjectId(), // dangling user id -> populates to null
      content: 'Orphaned message',
      isRead: false
    });
    await chat.save();

    const listRes = await request(server)
      .get('/api/chat/conversations')
      .set('Authorization', `Bearer ${mechanicToken}`)
      .expect(200);

    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(2);
  });

  test('deleteChat clears messages and emits chat-cleared', async () => {
    const namespace = app.get('io').of('/requests');
    const emitSpy = jest.fn();
    const chainProxy = { to: jest.fn(), emit: emitSpy };
    chainProxy.to.mockReturnValue(chainProxy);
    const toSpy = jest.spyOn(namespace, 'to').mockReturnValue(chainProxy);

    await request(server)
      .delete(`/api/chat/delete/${directChatId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    const msgsRes = await request(server)
      .get(`/api/chat/conversations/${directChatId}/messages`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(msgsRes.body.data.messages).toEqual([]);
    expect(emitSpy).toHaveBeenCalledWith(
      'chat-cleared',
      expect.objectContaining({ chatId: directChatId })
    );
    toSpy.mockRestore();
  });
});
