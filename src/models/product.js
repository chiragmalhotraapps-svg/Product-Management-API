const crypto = require('node:crypto');

let products = [];
const VALID_CATEGORIES = ['electronics', 'books', 'clothing', 'home', 'toys', 'Uncategorized'];

/**
 * Resets the in-memory store.
 */
const resetStore = () => {
  products = [];
};

/**
 * Creates a new product.
 * @param {Object} data - Product data.
 * @returns {Object} The created product.
 */
const create = (data) => {
  const { name, sku, price, category, stock, description } = data;

  if (!name) throw new Error('Product name is required');
  if (!sku) throw new Error('Product SKU is required');
  if (!/^[a-zA-Z0-9-]+$/.test(sku)) throw new Error('Invalid SKU format');
  if (price === undefined || price <= 0) throw new Error('Price must be greater than zero');

  if (products.find(p => p.sku === sku)) {
    throw new Error('Product with this SKU already exists');
  }

  const finalCategory = category || 'Uncategorized';
  if (!VALID_CATEGORIES.includes(finalCategory)) {
    throw new Error('Invalid category');
  }

  const product = {
    id: crypto.randomUUID(),
    name,
    sku,
    price,
    category: finalCategory,
    stock: stock || 0,
    description: description || '',
    status: 'active',
    archivedAt: null,
    createdAt: new Date(),
  };

  products.push(product);
  return product;
};

/**
 * Finds products based on filters.
 * @param {Object} filters - Filter criteria.
 */
const findAll = (filters = {}) => {
  if (filters.category && !VALID_CATEGORIES.includes(filters.category)) {
    throw new Error('Invalid category');
  }

  return products.filter(p => {
    if (p.archivedAt !== null) return false;

    if (filters.category && p.category !== filters.category) return false;
    if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
    if (filters.inStock === 'true' && p.stock <= 0) return false;
    if (filters.search) {
      const term = filters.search.toLowerCase();
      const matches = p.name.toLowerCase().includes(term) ||
                      p.description.toLowerCase().includes(term);
      if (!matches) return false;
    }
    return true;
  });
};

/**
 * Finds a product by ID.
 */
const findById = (id) => {
  const product = products.find(p => p.id === id);
  if (!product || product.archivedAt !== null) return null;
  return product;
};

/**
 * Finds a product by SKU.
 */
const findBySku = (sku) => {
  return products.find(p => p.sku === sku) || null;
};

/**
 * Updates a product.
 */
const update = (id, patch) => {
  const index = products.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Product not found');

  const product = products[index];
  if (product.archivedAt !== null) throw new Error('Cannot update an archived product');

  // Prevent overwriting protected fields
  const forbidden = ['id', 'createdAt', 'sku'];
  for (const key of forbidden) {
    if (patch[key] !== undefined) throw new Error(`Updating ${key} is not allowed`);
  }

  // Strip unknown fields and validate category if provided
  const allowedFields = ['name', 'price', 'category', 'stock', 'description', 'status'];
  const filteredPatch = {};
  for (const key of Object.keys(patch)) {
    if (allowedFields.includes(key)) {
      if (key === 'category' && !VALID_CATEGORIES.includes(patch[key])) {
        throw new Error('Invalid category');
      }
      filteredPatch[key] = patch[key];
    }
  }

  products[index] = { ...product, ...filteredPatch };
  return products[index];
};

/**
 * Soft deletes a product.
 */
const deleteProduct = (id) => {
  const product = products.find(p => p.id === id);
  if (!product) throw new Error('Product not found');

  product.archivedAt = new Date();
  product.status = 'archived';
  return product;
};

/**
 * Restores an archived product.
 */
const restore = (id) => {
  const product = products.find(p => p.id === id);
  if (!product) throw new Error('Product not found');
  if (product.archivedAt === null) throw new Error('Product is not archived');

  product.archivedAt = null;
  product.status = 'active';
  return product;
};

module.exports = {
  create,
  findAll,
  findById,
  findBySku,
  update,
  delete: deleteProduct,
  restore,
  resetStore,
  _products: () => products,
  VALID_CATEGORIES,
};
