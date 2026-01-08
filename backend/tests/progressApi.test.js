const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const HomeProgram = require('../models/HomeProgram');
const Progress = require('../models/Progress');

// Test data
let testUser, testTherapist, testProgram, testProgress, authToken, therapistToken;

describe('Progress Tracking API', () => {
  beforeAll(async () => {
    // Create test users
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      password: 'password123',
      role: 'child',
      isEmailVerified: true
    });

    testTherapist = await User.create({
      firstName: 'Test',
      lastName: 'Therapist',
      email: 'therapist@example.com',
      password: 'password123',
      role: 'therapist',
      isEmailVerified: true,
      assignedPatients: [testUser._id]
    });

    // Create test program
    testProgram = await HomeProgram.create({
      childId: testUser._id,
      assignedBy: testTherapist._id,
      title: 'Test Program',
      description: 'Test program for progress tracking',
      items: [{
        activityId: new mongoose.Types.ObjectId(),
        targetFrequencyPerWeek: 3,
        notes: 'Test activity'
      }],
      status: 'active'
    });

    // Get auth tokens
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'password123'
      });

    const therapistLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'therapist@example.com',
        password: 'password123'
      });

    authToken = userLogin.body.token;
    therapistToken = therapistLogin.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $in: ['testuser@example.com', 'therapist@example.com'] } });
    await HomeProgram.deleteMany({ title: 'Test Program' });
    await Progress.deleteMany({ userId: testUser._id });
    await mongoose.connection.close();
  });

  describe('POST /api/progress', () => {
    it('should create a new progress entry', async () => {
      const progressData = {
        programId: testProgram._id,
        progressPercentage: 75,
        completedTasks: ['Task 1', 'Task 2'],
        notes: 'Great progress!',
        milestone: 'three-quarters',
        score: 85,
        timeSpent: 45,
        difficulty: 'medium',
        mood: 'good',
        tags: ['math', 'concentration'],
        isPublic: false
      };

      const response = await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send(progressData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.progressPercentage).toBe(75);
      expect(response.body.data.milestone).toBe('three-quarters');
      expect(response.body.data.completedTasks).toEqual(['Task 1', 'Task 2']);

      testProgress = response.body.data;
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          progressPercentage: 50
          // Missing required programId
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should validate progress percentage range', async () => {
      const response = await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          programId: testProgram._id,
          progressPercentage: 150 // Invalid: > 100
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/progress/:userId', () => {
    it('should get user progress with pagination', async () => {
      const response = await request(app)
        .get(`/api/progress/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.progress).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
    });

    it('should filter by programId', async () => {
      const response = await request(app)
        .get(`/api/progress/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ programId: testProgram._id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.progress.length).toBeGreaterThan(0);
    });

    it('should deny access to unauthorized users', async () => {
      const unauthorizedUser = await User.create({
        firstName: 'Unauthorized',
        lastName: 'User',
        email: 'unauthorized@example.com',
        password: 'password123',
        role: 'child',
        isEmailVerified: true
      });

      const unauthorizedLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unauthorized@example.com',
          password: 'password123'
        });

      const response = await request(app)
        .get(`/api/progress/${testUser._id}`)
        .set('Authorization', `Bearer ${unauthorizedLogin.body.token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');

      // Clean up
      await User.deleteOne({ _id: unauthorizedUser._id });
    });
  });

  describe('GET /api/progress/:userId/:programId', () => {
    it('should get program-specific progress', async () => {
      const response = await request(app)
        .get(`/api/progress/${testUser._id}/${testProgram._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.program).toBeDefined();
      expect(response.body.data.program._id).toBe(testProgram._id.toString());
    });
  });

  describe('GET /api/progress/entry/:progressId', () => {
    it('should get single progress entry', async () => {
      const response = await request(app)
        .get(`/api/progress/entry/${testProgress._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testProgress._id.toString());
    });
  });

  describe('PUT /api/progress/:progressId', () => {
    it('should update progress entry', async () => {
      const updateData = {
        progressPercentage: 90,
        completedTasks: ['Task 1', 'Task 2', 'Task 3'],
        notes: 'Updated progress!',
        milestone: 'completed',
        score: 95
      };

      const response = await request(app)
        .put(`/api/progress/${testProgress._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.progressPercentage).toBe(90);
      expect(response.body.data.milestone).toBe('completed');
    });
  });

  describe('POST /api/progress/:progressId/review', () => {
    it('should allow therapist to review progress', async () => {
      const reviewData = {
        status: 'reviewed',
        reviewNotes: 'Excellent progress!'
      };

      const response = await request(app)
        .post(`/api/progress/${testProgress._id}/review`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .send(reviewData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('reviewed');
      expect(response.body.data.reviewNotes).toBe('Excellent progress!');
    });

    it('should deny review access to regular users', async () => {
      const response = await request(app)
        .post(`/api/progress/${testProgress._id}/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'reviewed' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only therapists and superusers can review progress');
    });
  });

  describe('DELETE /api/progress/:progressId', () => {
    it('should delete progress entry', async () => {
      const response = await request(app)
        .delete(`/api/progress/${testProgress._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should return 404 for non-existent progress', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/progress/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize XSS attempts in notes', async () => {
      const progressData = {
        programId: testProgram._id,
        progressPercentage: 50,
        notes: '<script>alert("xss")</script>Safe content',
        milestone: 'half'
      };

      const response = await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send(progressData)
        .expect(201);

      expect(response.body.data.notes).not.toContain('<script>');
      expect(response.body.data.notes).toContain('Safe content');
    });
  });

  describe('Milestone Validation', () => {
    it('should require customMilestone when milestone is custom', async () => {
      const response = await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          programId: testProgram._id,
          progressPercentage: 50,
          milestone: 'custom'
          // Missing customMilestone
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('customMilestone is required');
    });

    it('should not allow customMilestone when milestone is not custom', async () => {
      const response = await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          programId: testProgram._id,
          progressPercentage: 50,
          milestone: 'half',
          customMilestone: 'Some custom milestone'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('customMilestone should only be provided when milestone is "custom"');
    });
  });
});
