const { Router } = require('express');
const { getAllTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');

const router = Router();

router.get('/', getAllTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
