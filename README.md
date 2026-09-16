# Product Management API

A lightweight, in-memory REST API built with Node.js and Express for managing a product catalog. This service provides essential product lifecycle operations including creation, filtering, updating, and soft-archiving, making it ideal for demonstration purposes or as a foundation for a more complex inventory system.

## Prerequisites

Before getting started, ensure you have the following installed:
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd product-management-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Server

Start the application using the start script:
```bash
npm start
```
The server will start by default on `http://localhost:3000`.

## Running Tests

The project includes a comprehensive test suite to ensure stability.

- **Run all tests**:
  ```bash
  npm test
  ```
- **Run tests with coverage report**:
  ```bash
  npm run test:coverage
  ```

## API Endpoints

All endpoints are prefixed with `/products`.

| Method | Path | Description | Example curl |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | List all active products | `curl http://localhost:3000/products` |
| `GET` | `/products/:id` | Get a product by ID | `curl http://localhost:3000/products/123` |
| `POST` | `/products` | Create a new product | `curl -X POST -H "Content-Type: application/json" -d '{"name":"Gaming Mouse", "sku":"GM-101", "price":59.99, "category":"electronics", "stock":50, "description":"High-precision optical mouse"}' http://localhost:3000/products` |
| `PATCH` | `/products/:id` | Update a product | `curl -X PATCH -H "Content-Type: application/json" -d '{"price":49.99, "stock":45}' http://localhost:3000/products/123` |
| `DELETE` | `/products/:id` | Soft-archive a product | `curl -X DELETE http://localhost:3000/products/123` |
| `POST` | `/products/:id/restore` | Restore an archived product | `curl -X POST http://localhost:3000/products/123/restore` |
| `DELETE` | `/products/reset` | Reset the in-memory store | `curl -X DELETE http://localhost:3000/products/reset` |

## Query Parameters for `GET /products`

Use these parameters to filter the product list.

| Parameter | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `status` | `string` | Filter by status (active, archived) | `?status=archived` |
| `category` | `string` | Filter by category (electronics, books, etc.) | `?category=electronics` |
| `minPrice` | `number` | Minimum price threshold | `?minPrice=10` |
| `maxPrice` | `number` | Maximum price threshold | `?maxPrice=100` |
| `inStock` | `boolean` | Show only products with stock > 0 | `?inStock=true` |
| `search` | `string` | Search name or description (case-insensitive) | `?search=mouse` |

## Product Schema

| Field | Type | Req (Input) | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | No | Unique identifier (auto-generated) |
| `name` | `string` | Yes | Display name of the product |
| `sku` | `string` | Yes | Unique Stock Keeping Unit (Alphanumeric & dashes) |
| `price` | `number` | Yes | Price per unit (Must be > 0) |
| `category` | `string` | No | electronics, books, clothing, home, toys, or Uncategorized |
| `stock` | `number` | No | Quantity available in inventory |
| `description` | `string` | No | Detailed product description |
| `status` | `string` | No | active or archived |
| `createdAt` | `date` | No | ISO timestamp of creation |
| `archivedAt` | `date` | No | ISO timestamp of archiving |

## Project Folder Structure

```text
product-management-api/
├── src/
│   ├── controllers/    # Request handlers and business logic
│   ├── models/         # Data models and in-memory store logic
│   ├── routes/          # Express route definitions
│   ├── app.js           # Express app configuration
│   └── server.js        # Entry point to start the server
├── tests/               # Unit and integration tests
├── .gitignore
├── package.json
└── README.md
```

## Environment Variables

The following environment variables can be configured:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | The port the server listens on |
| `NODE_ENV` | `development` | Environment mode (development, production, test) |

## Contributing

Contributions are welcome! Please fork the repository, create a feature branch, and submit a pull request. Ensure that all new features include corresponding tests and follow the project's coding style.

## License

This project is licensed under the [MIT License](LICENSE).
