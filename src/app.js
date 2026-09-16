const express = require('express');
const taskRoutes = require('./routes/tasks');
const productRoutes = require('./routes/products');

const app = express();

app.use(express.json());
app.use('/tasks', taskRoutes);
app.use('/products', productRoutes);

module.exports = app;
