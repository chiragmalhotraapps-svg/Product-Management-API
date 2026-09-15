import { v4 as uuidv4 } from 'uuid';

class ProductModel {
  constructor() {
    this.products = new Map();
  }

  findAll(filters = {}) {
    let result = Array.from(this.products.values());

    if (filters.category) {
      result = result.filter(p => p.category === filters.category);
    }
    if (filters.status) {
      result = result.filter(p => p.status === filters.status);
    }

    return result;
  }

  findById(id) {
    return this.products.get(id);
  }

  findBySku(sku) {
    return Array.from(this.products.values()).find(p => p.sku === sku);
  }

  create(data) {
    const product = {
      id: uuidv4(),
      name: data.name,
      sku: data.sku,
      description: data.description || '',
      category: data.category || 'other',
      price: data.price,
      stock: data.stock,
      status: data.status || 'active',
      createdAt: new Date(),
    };

    this.products.set(product.id, product);
    return product;
  }

  update(id, patch) {
    const product = this.products.get(id);
    if (!product) return null;

    const updatedProduct = { ...product, ...patch, id }; // Ensure id is not changed
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  delete(id) {
    const exists = this.products.has(id);
    if (exists) {
      this.products.delete(id);
    }
    return exists;
  }
}

export default new ProductModel();
