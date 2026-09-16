const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { tasks } = require('../src/data/store');

describe('Tasks API Integration Tests', () => {
  beforeEach(() => {
    // Clear the in-memory store before each test
    tasks.length = 0;

    // Seed a task
    const seedTask = {
      id: 'test-task-1',
      title: 'Seed Task',
      description: 'Description 1',
      priority: 'high',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.push(seedTask);
  });

  describe('GET /tasks', () => {
    it('returns 200 and an array of tasks', async () => {
      const res = await request(app).get('/tasks');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body));
      assert.strictEqual(res.body.length, 1);
      assert.strictEqual(res.body[0].title, 'Seed Task');
    });
  });

  describe('GET /tasks/:id', () => {
    it('returns 200 with the correct task', async () => {
      const res = await request(app).get('/tasks/test-task-1');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.title, 'Seed Task');
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app).get('/tasks/unknown');
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, 'Task not found');
    });
  });

  describe('POST /tasks', () => {
    it('returns 201 and creates a task with a title', async () => {
      const payload = { title: 'New Task', description: 'New Desc', priority: 'low' };
      const res = await request(app).post('/tasks').send(payload);
      assert.strictEqual(res.status, 201);
      assert.ok(res.body.id);
      assert.strictEqual(res.body.title, 'New Task');
      assert.strictEqual(res.body.completed, false);
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app).post('/tasks').send({ description: 'No title' });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'title is required');
    });
  });

  describe('PUT /tasks/:id', () => {
    it('returns 200 and updates task fields', async () => {
      const res = await request(app).put('/tasks/test-task-1').send({
        title: 'Updated Title',
        completed: true
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.title, 'Updated Title');
      assert.strictEqual(res.body.completed, true);
      assert.strictEqual(res.body.priority, 'high'); // preserved
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app).put('/tasks/unknown').send({ title: 'Update' });
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, 'Task not found');
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('returns 204 and deletes the task', async () => {
      const res = await request(app).delete('/tasks/test-task-1');
      assert.strictEqual(res.status, 204);

      const getRes = await request(app).get('/tasks/test-task-1');
      assert.strictEqual(getRes.status, 404);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app).delete('/tasks/unknown');
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, 'Task not found');
    });
  });
});
