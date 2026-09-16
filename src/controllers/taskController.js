const { v4: uuidv4 } = require('uuid');
const { tasks, findById } = require('../data/store');

const getAllTasks = async (_req, res) => {
  res.json(tasks);
};

const getTask = async (req, res) => {
  const task = findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
};

const createTask = async (req, res) => {
  const { title, description = '', priority = 'medium' } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const now = new Date().toISOString();
  const task = { id: uuidv4(), title, description, priority, completed: false, createdAt: now, updatedAt: now };
  tasks.push(task);
  res.status(201).json(task);
};

const updateTask = async (req, res) => {
  const task = findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { title, description, completed, priority } = req.body;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (completed !== undefined) task.completed = completed;
  if (priority !== undefined) task.priority = priority;
  task.updatedAt = new Date().toISOString();

  res.json(task);
};

const deleteTask = async (req, res) => {
  const index = tasks.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });

  tasks.splice(index, 1);
  res.status(204).send();
};

module.exports = { getAllTasks, getTask, createTask, updateTask, deleteTask };
