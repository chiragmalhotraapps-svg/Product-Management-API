const crypto = require('node:crypto');

let products = [];
const VALID_CATEGORIES = ['electronics', 'books', 'clothing', 'home', 'toys', 'Uncategorized'];

/**
 * Resets the in-memory product store to an empty array.
 * @returns {void}
 */
const resetStore = () => {
  products = [];
};

/**
 * Creates a new product and adds it to the store.
 * @param {Object} data - Product details.
 * @param {string} data.name - Name of the product.
 * @param {string} data.sku - Unique Stock Keeping Unit identifier.
 * @param {number} data.price - Price of the product.
 * @param {string} [data.category] - Product category.
 * @param {number} [data.stock] - Initial stock quantity.
 * @param {string} [data.description] - Product description.
 * @returns {Object} The created product object.
 * @throws {Error} If name or SKU is missing.
 * @throws {Error} If SKU format is invalid.
 * @throws {Error} If price is not greater than zero.
 * @throws {Error} If a product with the given SKU already exists.
 * @throws {Error} If the provided category is invalid.
 * @note Ensures SKU uniqueness within the store.
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
 * Retrieves a list of active products based on filter criteria.
 * @param {Object} [filters={}] - Filters to apply.
 * @param {string} [filters.category] - Filter by category.
 * @param {number} [filters.minPrice] - Minimum price threshold.
 * @param {number} [filters.maxPrice] - Maximum price threshold.
 * @param {string} [filters.inStock] - Filter for products in stock ('true').
 * @param {string} [filters.search] - Search term for name or description.
 * @returns {Array<Object>} List of matching active products.
 * @throws {Error} If the provided category filter is invalid.
 * @note Only returns products that have not been soft-archived.
 */
const findAll = (filters = {}) => {
  if (filters.category && !VALID_CATEGORIES.includes(filters.category)) {
    throw new Error('Invalid category');
  }

  return products.filter(p => {
    const productStatus = p.archivedAt === null ? 'active' : 'archived';
    if (filters.status && productStatus !== filters.status) return false;
    if (!filters.status && p.archivedAt !== null) return false;

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
 * Retrieves a single active product by its unique ID.
 * @param {string} id - The unique product ID.
 * @returns {Object|null} The product object if found and active, otherwise null.
 * @note Returns null for soft-archived products.
 */
const findById = (id) => {
  const product = products.find(p => p.id === id);
  if (!product || product.archivedAt !== null) return null;
  return product;
};

/**
 * Retrieves a product by its unique SKU.
 * @param {string} sku - The product SKU.
 * @returns {Object|null} The product object if found, otherwise null.
 */
const findBySku = (sku) => {
  return products.find(p => p.sku === sku) || null;
};

/**
 * Updates the details of an existing active product.
 * @param {string} id - The unique product ID.
 * @param {Object} patch - The updates to apply.
 * @returns {Object} The updated product object.
 * @throws {Error} If the product is not found.
 * @throws {Error} If the product is soft-archived.
 * @throws {Error} If an attempt is made to update protected fields (id, createdAt, sku).
 * @throws {Error} If the provided category update is invalid.
 * @note Prevents modification of SKU to maintain data integrity.
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
 * Soft-archives a product by setting its archived date.
 * @param {string} id - The unique product ID.
 * @returns {Object} The archived product object.
 * @throws {Error} If the product is not found.
 * @note Implements soft-archive behaviour; data is preserved but marked as archived.
 */
const deleteProduct = (id) => {
  const product = products.find(p => p.id === id);
  if (!product) throw new Error('Product not found');

  product.archivedAt = new Date();
  product.status = 'archived';
  return product;
};

/**
 * Restores a soft-archived product to active status.
 * @param {string} id - The unique product ID.
 * @returns {Object} The restored product object.
 * @throws {Error} If the product is not found.
 * @throws {Error} If the product is not currently archived.
 */
const restore = (id) => {
  const product = products.find(p => p.id === id);
  if (!product) throw new Error('Product not found');
  if (product.archivedAt === null) throw new Error('Product is not archived');

  product.archivedAt = null;
  product.status = 'active';
  return product;
};

/**
 * Returns the raw in-memory product store.
 * @returns {Array<Object>} The list of all products.
 */
const _products = () => products;

module.exports = {
  create,
  findAll,
  findById,
  findBySku,
  update,
  delete: deleteProduct,
  restore,
  resetStore,
  _products,
  VALID_CATEGORIES,
};
