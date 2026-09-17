import productModel from '../models/product.js';
import { catchAsync } from '../middleware/catchAsync.js';

export const getAllProducts = catchAsync(async (req, res, next) => {
  const filters = { ...req.query };

  if (filters.minPrice) {
    filters.minPrice = parseFloat(filters.minPrice);
  }
  if (filters.maxPrice) {
    filters.maxPrice = parseFloat(filters.maxPrice);
  }
  if (filters.inStock !== undefined) {
    filters.inStock = filters.inStock === 'true';
  }

  const products = productModel.findAll(filters);
  res.json({
    success: true,
    data: products,
    error: null,
  });
});

export const getProductById = catchAsync(async (req, res, next) => {
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
});

export const createProduct = catchAsync(async (req, res, next) => {
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
});

export const updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const product = productModel.findById(id);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

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
});

export const deleteProduct = catchAsync(async (req, res, next) => {
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
});
