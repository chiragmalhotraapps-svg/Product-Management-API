import productModel from '../models/product.js';

const validateProduct = (data) => {
  const { name, sku, category, price, stock } = data;

  if (!name || !sku) {
    const error = new Error('Name and SKU are required');
    error.statusCode = 400;
    throw error;
  }

  const validCategories = ['electronics', 'clothing', 'food', 'books', 'other'];
  if (category && !validCategories.includes(category)) {
    const error = new Error(`Category must be one of: ${validCategories.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  if (price !== undefined && (typeof price !== 'number' || price <= 0)) {
    const error = new Error('Price must be a positive number');
    error.statusCode = 400;
    throw error;
  }

  if (stock !== undefined && (typeof stock !== 'number' || stock < 0 || !Number.isInteger(stock))) {
    const error = new Error('Stock must be a non-negative integer');
    error.statusCode = 400;
    throw error;
  }

  return true;
};

export const getAllProducts = (req, res, next) => {
  try {
    const products = productModel.findAll(req.query);
    res.json({
      success: true,
      data: products,
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

export const getProductById = (req, res, next) => {
  try {
    const product = productModel.findById(req.params.id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    res.json({
      success: true,
      data: product,
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct = (req, res, next) => {
  try {
    validateProduct(req.body);

    if (productModel.findBySku(req.body.sku)) {
      const error = new Error('SKU must be unique');
      error.statusCode = 400;
      throw error;
    }

    const product = productModel.create(req.body);
    res.status(201).json({
      success: true,
      data: product,
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = (req, res, next) => {
  try {
    const { id } = req.params;
    const product = productModel.findById(id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    validateProduct(req.body);

    // If SKU is being updated, check for uniqueness
    if (req.body.sku && req.body.sku !== product.sku) {
      if (productModel.findBySku(req.body.sku)) {
        const error = new Error('SKU must be unique');
        error.statusCode = 400;
        throw error;
      }
    }

    const updatedProduct = productModel.update(id, req.body);
    res.json({
      success: true,
      data: updatedProduct,
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = productModel.delete(id);
    if (!deleted) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    res.json({
      success: true,
      data: null,
      error: null,
    });
  } catch (err) {
    next(err);
  }
};
