const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const productModel = require('../src/models/product');

describe('Products API Integration Tests', () => {
  beforeEach(() => {
    productModel.resetStore();
    // Seed products
    productModel.create({
      name: 'Wireless Headphones',
      sku: 'ELEC-001',
      price: 99.99,
      category: 'electronics',
      stock: 10,
      description: 'High quality wireless sound'
    });
    productModel.create({
      name: 'Hardcover Novel',
      sku: 'BOOK-001',
      price: 19.99,
      category: 'books',
      stock: 0,
      description: 'A gripping mystery story'
    });
  });

  describe('GET /products', () => {
    it('returns 200 and an array', async () => {
      const res = await request(app).get('/products');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body));
    });

    it('returns only non-archived products', async () => {
      const p = productModel.create({ name: 'Ghost', sku: 'GHOST', price: 1, category: 'electronics' });
      productModel.delete(p.id);

      const res = await request(app).get('/products');
      assert.ok(!res.body.some(prod => prod.id === p.id));
    });

    it('returns only matching products for ?category=electronics', async () => {
      const res = await request(app).get('/products?category=electronics');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.length, 1);
      assert.strictEqual(res.body[0].category, 'electronics');
    });

    it('returns 422 for ?category=unknown', async () => {
      const res = await request(app).get('/products?category=unknown');
      assert.strictEqual(res.status, 422);
      assert.strictEqual(res.body.error, 'Invalid category');
    });

    it('filters correctly by ?minPrice and ?maxPrice', async () => {
      const res = await request(app).get('/products?minPrice=15&maxPrice=25');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.length, 1);
      assert.strictEqual(res.body[0].sku, 'BOOK-001');
    });

    it('returns 422 for non-numeric ?minPrice', async () => {
      const res = await request(app).get('/products?minPrice=abc');
      assert.strictEqual(res.status, 422);
      assert.strictEqual(res.body.error, 'minPrice must be a number');
    });

    it('returns 422 for non-numeric ?maxPrice', async () => {
      const res = await request(app).get('/products?maxPrice=abc');
      assert.strictEqual(res.status, 422);
      assert.strictEqual(res.body.error, 'maxPrice must be a number');
    });

    it('returns products with stock > 0 for ?inStock=true', async () => {
      const res = await request(app).get('/products?inStock=true');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.length, 1);
      assert.strictEqual(res.body[0].sku, 'ELEC-001');
    });

    it('matches on name and description for ?search=<term>', async () => {
      const resName = await request(app).get('/products?search=Wireless');
      assert.strictEqual(resName.body.length, 1);
      assert.strictEqual(resName.body[0].sku, 'ELEC-001');

      const resDesc = await request(app).get('/products?search=mystery');
      assert.strictEqual(resDesc.body.length, 1);
      assert.strictEqual(resDesc.body[0].sku, 'BOOK-001');
    });
  });

  describe('GET /products/:id', () => {
    it('returns 200 with the correct product', async () => {
      const p = productModel.findBySku('ELEC-001');
      const res = await request(app).get(`/products/${p.id}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.sku, 'ELEC-001');
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app).get('/products/unknown-id');
      assert.strictEqual(res.status, 404);
    });

    it('returns 404 for an archived product id', async () => {
      const p = productModel.create({ name: 'Temp', sku: 'TEMP', price: 10 });
      productModel.delete(p.id);
      const res = await request(app).get(`/products/${p.id}`);
      assert.strictEqual(res.status, 404);
    });
  });

  describe('POST /products', () => {
    it('returns 201 with the created product including id and createdAt', async () => {
      const payload = { name: 'New Gadget', sku: 'GADG-001', price: 49.99 };
      const res = await request(app).post('/products').send(payload);
      assert.strictEqual(res.status, 201);
      assert.ok(res.body.id);
      assert.ok(res.body.createdAt);
    });

    it('returns 422 when name is missing', async () => {
      const res = await request(app).post('/products').send({ sku: 'S1', price: 10 });
      assert.strictEqual(res.status, 422);
    });

    it('returns 422 when sku format is invalid', async () => {
      const res = await request(app).post('/products').send({ name: 'N', sku: '!!!', price: 10 });
      assert.strictEqual(res.status, 422);
    });

    it('returns 422 when price is zero or negative', async () => {
      const resZero = await request(app).post('/products').send({ name: 'N', sku: 'S0', price: 0 });
      assert.strictEqual(resZero.status, 422);

      const resNeg = await request(app).post('/products').send({ name: 'N', sku: 'S-1', price: -10 });
      assert.strictEqual(resNeg.status, 422);
    });

    it('returns 201 when stock is 0', async () => {
      const res = await request(app).post('/products').send({ name: 'Out of Stock', sku: 'OOS-01', price: 10, stock: 0 });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.stock, 0);
    });

    it('returns 409 when sku already exists', async () => {
      const res = await request(app).post('/products').send({ name: 'D', sku: 'ELEC-001', price: 10 });
      assert.strictEqual(res.status, 409);
    });

    it('only allows one success for concurrent POSTs with same SKU', async () => {
      const payload = { name: 'Concurrent', sku: 'CONC-01', price: 10 };
      const results = await Promise.all([
        request(app).post('/products').send(payload),
        request(app).post('/products').send(payload),
        request(app).post('/products').send(payload),
      ]);

      const successes = results.filter(r => r.status === 201);
      const conflicts = results.filter(r => r.status === 409);

      assert.strictEqual(successes.length, 1);
      assert.strictEqual(conflicts.length, 2);
    });
  });

  describe('PATCH /products/:id', () => {
    it('returns 200 with only the patched fields changed', async () => {
      const p = productModel.findBySku('ELEC-001');
      const res = await request(app).patch(`/products/${p.id}`).send({ price: 89.99 });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.price, 89.99);
      assert.strictEqual(res.body.name, 'Wireless Headphones');
    });

    it('strips unknown fields', async () => {
      const p = productModel.findBySku('ELEC-001');
      const res = await request(app).patch(`/products/${p.id}`).send({ price: 89.99, hacker: 'true' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.hacker, undefined);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app).patch('/products/unknown').send({ price: 10 });
      assert.strictEqual(res.status, 404);
    });

    it('returns 400 when the body is empty', async () => {
      const p = productModel.findBySku('ELEC-001');
      const res = await request(app).patch(`/products/${p.id}`).send({});
      assert.strictEqual(res.status, 400);
    });

    it('does not allow updating sku or id', async () => {
      const p = productModel.findBySku('ELEC-001');
      const resId = await request(app).patch(`/products/${p.id}`).send({ id: 'new-id' });
      assert.strictEqual(resId.status, 400);

      const resSku = await request(app).patch(`/products/${p.id}`).send({ sku: 'NEW-SKU' });
      assert.strictEqual(resSku.status, 400);
    });

    it('returns 404 for an archived product', async () => {
      const p = productModel.create({ name: 'A', sku: 'A1', price: 10 });
      productModel.delete(p.id);
      const res = await request(app).patch(`/products/${p.id}`).send({ price: 20 });
      assert.strictEqual(res.status, 404);
    });
  });

  describe('DELETE /products/:id', () => {
    it('returns 204', async () => {
      const p = productModel.findBySku('ELEC-001');
      const res = await request(app).delete(`/products/${p.id}`);
      assert.strictEqual(res.status, 204);
    });

    it('subsequent GET /products/:id returns 404', async () => {
      const p = productModel.findBySku('BOOK-001');
      await request(app).delete(`/products/${p.id}`);
      const res = await request(app).get(`/products/${p.id}`);
      assert.strictEqual(res.status, 404);
    });
  });

  describe('DELETE /products/:id/restore', () => {
    it('returns 200 and product reappears in GET /products', async () => {
      const p = productModel.findBySku('ELEC-001');
      await request(app).delete(`/products/${p.id}`);

      const res = await request(app).delete(`/products/${p.id}/restore`);
      assert.strictEqual(res.status, 200);

      const list = await request(app).get('/products');
      assert.ok(list.body.some(prod => prod.id === p.id));
    });

    it('returns 404 or 400 for a product that was never archived', async () => {
      const p = productModel.findBySku('BOOK-001');
      const res = await request(app).delete(`/products/${p.id}/restore`);
      // Model throws 'Product is not archived', controller returns 500 currently.
      // Let's check and fix the controller to return 400.
      assert.strictEqual(res.status, 400);
    });
  });
});
