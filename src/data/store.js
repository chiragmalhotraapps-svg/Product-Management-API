const tasks = [];

const findById = (id) => tasks.find((t) => t.id === id);

module.exports = { tasks, findById };
