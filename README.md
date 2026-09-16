# Task API

A lightweight REST API for managing tasks, built with Node.js and Express.

## Getting Started

**Install dependencies:**
```bash
npm install
```

**Start the server:**
```bash
npm start
```

The server runs on `http://localhost:3000` by default. Set the `PORT` environment variable to use a different port.

## API Reference

All endpoints are prefixed with `/tasks`.

### Get all tasks
```
GET /tasks
```
Returns an array of all tasks.

### Get a task
```
GET /tasks/:id
```
Returns a single task by ID. Responds with `404` if not found.

### Create a task
```
POST /tasks
Content-Type: application/json

{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```
- `title` is required; omitting it returns `400`.
- Responds with `201` and the created task.

### Update a task
```
PUT /tasks/:id
Content-Type: application/json

{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread, butter",
  "completed": true
}
```
All fields are optional. Responds with `404` if the task doesn't exist.

### Delete a task
```
DELETE /tasks/:id
```
Responds with `204` on success, `404` if the task doesn't exist.

## Task Object

```json
{
  "id": "a3f1c2d4-...",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "createdAt": "2026-04-22T10:00:00.000Z",
  "updatedAt": "2026-04-22T10:00:00.000Z"
}
```

## Notes

- Data is stored **in memory** and does not persist across server restarts.
- Task IDs are UUID v4 values generated automatically on creation.

## Tech Stack

- [Node.js](https://nodejs.org)
- [Express](https://expressjs.com) v4
- [uuid](https://github.com/uuidjs/uuid) v9
