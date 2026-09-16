const productModel = require('../models/product');

const getProducts = (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      inStock: req.query.inStock,
      search: req.query.search,
    };

    if (req.query.minPrice && isNaN(parseFloat(req.query.minPrice))) {
      return res.status(422).json({ error: 'minPrice must be a number' });
    }
    if (req.query.maxPrice && isNaN(parseFloat(req.query.maxPrice))) {
      return res.status(422).json({ error: 'maxPrice must be a number' });
    }

    const products = productModel.findAll(filters);
    res.json(products);
  } catch (error) {
    if (error.message === 'Invalid category') {
      return res.status(422).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProductById = (req, res) => {
  const product = productModel.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
};

const createProduct = (req, res) => {
  try {
    const product = productModel.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('greater than zero') || error.message.includes('Invalid SKU format')) {
      return res.status(422).json({ error: error.message });
    }
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProduct = (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body cannot be empty' });
  }

  try {
    const product = productModel.update(req.params.id, req.body);
    res.json(product);
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('archived product')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('not allowed')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteProduct = (req, res) => {
  try {
    productModel.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const restoreProduct = (req, res) => {
  try {
    const product = productModel.restore(req.params.id);
    res.json(product);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('not archived')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
};
