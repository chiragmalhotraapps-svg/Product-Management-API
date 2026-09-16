const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const productModel = require('../src/models/product');

describe('Product Model', () => {
  beforeEach(() => {
    productModel.resetStore();
  });

  describe('create()', () => {
    it('returns a product with all required fields including a uuid id', () => {
      const data = { name: 'Wireless Mouse', sku: 'W-MOUSE-01', price: 25.99 };
      const product = productModel.create(data);

      assert.ok(product.id);
      assert.match(product.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      assert.strictEqual(product.name, data.name);
      assert.strictEqual(product.sku, data.sku);
      assert.strictEqual(product.price, data.price);
      assert.ok(product.createdAt instanceof Date);
    });

    it('sets status to "active" and archivedAt to null by default', () => {
      const product = productModel.create({ name: 'Test', sku: 'T1', price: 10 });
      assert.strictEqual(product.status, 'active');
      assert.strictEqual(product.archivedAt, null);
    });

    it('throws if name is missing', () => {
      assert.throws(() => productModel.create({ sku: 'T1', price: 10 }), /Product name is required/);
    });

    it('throws if sku is missing', () => {
      assert.throws(() => productModel.create({ name: 'Test', price: 10 }), /Product SKU is required/);
    });

    it('throws if price is zero or negative', () => {
      assert.throws(() => productModel.create({ name: 'T', sku: 'T1', price: 0 }), /Price must be greater than zero/);
      assert.throws(() => productModel.create({ name: 'T', sku: 'T1', price: -5 }), /Price must be greater than zero/);
    });

    it('throws if a product with the same sku already exists', () => {
      productModel.create({ name: 'P1', sku: 'DUPE', price: 10 });
      assert.throws(() => productModel.create({ name: 'P2', sku: 'DUPE', price: 20 }), /Product with this SKU already exists/);
    });

    it('accepts stock = 0 on create', () => {
      const p = productModel.create({ name: 'P', sku: 'S', price: 10, stock: 0 });
      assert.strictEqual(p.stock, 0);
    });
  });

  describe('findAll()', () => {
    it('returns all non-archived products', () => {
      productModel.create({ name: 'P1', sku: 'S1', price: 10 });
      productModel.create({ name: 'P2', sku: 'S2', price: 20 });
      const p3 = productModel.create({ name: 'P3', sku: 'S3', price: 30 });
      productModel.delete(p3.id);

      const result = productModel.findAll({});
      assert.strictEqual(result.length, 2);
      assert.ok(!result.some(p => p.id === p3.id));
    });

    it('returns empty array when the store is empty', () => {
      assert.deepStrictEqual(productModel.findAll({}), []);
    });

    it('returns only products matching the category', () => {
      productModel.create({ name: 'P1', sku: 'S1', price: 10, category: 'electronics' });
      productModel.create({ name: 'P2', sku: 'S2', price: 20, category: 'books' });

      const result = productModel.findAll({ category: 'electronics' });
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].category, 'electronics');
    });

    it('throws if category is not in enum', () => {
      assert.throws(() => productModel.findAll({ category: 'unknown' }), /Invalid category/);
    });

    it('returns products with price within the range (inclusive)', () => {
      productModel.create({ name: 'P1', sku: 'S1', price: 10 });
      productModel.create({ name: 'P2', sku: 'S2', price: 20 });
      productModel.create({ name: 'P3', sku: 'S3', price: 30 });

      const result = productModel.findAll({ minPrice: 10, maxPrice: 20 });
      assert.strictEqual(result.length, 2);
      assert.ok(result.some(p => p.price === 10));
      assert.ok(result.some(p => p.price === 20));
    });

    it('returns only products with stock > 0 when inStock: "true"', () => {
      productModel.create({ name: 'P1', sku: 'S1', price: 10, stock: 5 });
      productModel.create({ name: 'P2', sku: 'S2', price: 20, stock: 0 });

      const result = productModel.findAll({ inStock: 'true' });
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].sku, 'S1');
    });

    it('returns products whose name or description contains the search term', () => {
      productModel.create({ name: 'Wireless Mouse', sku: 'S1', price: 10, description: 'Quiet click' });
      productModel.create({ name: 'Wired Keyboard', sku: 'S2', price: 20, description: 'Mechanical wireless' });
      productModel.create({ name: 'Desk Lamp', sku: 'S3', price: 30, description: 'LED light' });

      const result = productModel.findAll({ search: 'wireless' });
      assert.strictEqual(result.length, 2);
      assert.ok(result.some(p => p.name === 'Wireless Mouse'));
      assert.ok(result.some(p => p.description.includes('wireless')));
    });
  });

  describe('findById(id)', () => {
    it('returns the correct product', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10 });
      const found = productModel.findById(p.id);
      assert.deepStrictEqual(found, p);
    });

    it('returns null for unknown id', () => {
      assert.strictEqual(productModel.findById('unknown'), null);
    });

    it('returns null for an archived product id', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10 });
      productModel.delete(p.id);
      assert.strictEqual(productModel.findById(p.id), null);
    });
  });

  describe('findBySku(sku)', () => {
    it('returns the correct product', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10 });
      const found = productModel.findBySku('S1');
      assert.deepStrictEqual(found, p);
    });

    it('returns null for unknown sku', () => {
      assert.strictEqual(productModel.findBySku('unknown'), null);
    });
  });

  describe('update(id, patch)', () => {
    it('updates only the provided fields', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10 });
      const updated = productModel.update(p.id, { price: 15 });

      assert.strictEqual(updated.price, 15);
      assert.strictEqual(updated.name, 'P1');
      assert.strictEqual(updated.sku, 'S1');
    });

    it('strips unknown fields', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10 });
      const updated = productModel.update(p.id, { price: 15, unknownField: 'value' });
      assert.strictEqual(updated.unknownField, undefined);
    });

    it('does not allow overwriting id or createdAt', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10 });
      assert.throws(() => productModel.update(p.id, { id: 'new-id' }), /Updating id is not allowed/);
      assert.throws(() => productModel.update(p.id, { createdAt: new Date() }), /Updating createdAt is not allowed/);
    });

    it('throws if product is archived', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10 });
      productModel.delete(p.id);
      assert.throws(() => productModel.update(p.id, { price: 15 }), /Cannot update an archived product/);
    });
  });

  describe('delete(id)', () => {
    it('sets archivedAt (soft archive, record is kept)', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10 });
      const deleted = productModel.delete(p.id);

      assert.ok(deleted.archivedAt instanceof Date);
      assert.strictEqual(deleted.status, 'archived');
    });

    it('archived product excluded from findAll()', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10 });
      productModel.delete(p.id);
      const result = productModel.findAll({});
      assert.strictEqual(result.length, 0);
    });
  });

  describe('restore(id)', () => {
    it('clears archivedAt', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10 });
      productModel.delete(p.id);
      const restored = productModel.restore(p.id);

      assert.strictEqual(restored.archivedAt, null);
      assert.strictEqual(restored.status, 'active');
    });

    it('throws if product was not archived', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10 });
      assert.throws(() => productModel.restore(p.id), /Product is not archived/);
    });

    it('restored product reappears in findAll()', () => {
      const p = productModel.create({ name: 'P1', sku: 'S1', price: 10 });
      productModel.delete(p.id);
      productModel.restore(p.id);
      const result = productModel.findAll({});
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, p.id);
    });
  });
});
