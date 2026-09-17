import { body, query, validationResult } from 'express-validator';

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const error = new Error(errors.array()[0].msg);
    error.statusCode = 400;
    next(error);
  };
};

const CATEGORIES = ['electronics', 'clothing', 'food', 'books', 'other'];
const STATUSES = ['active', 'inactive', 'discontinued'];

export const validateCreate = [
  body('name').notEmpty().withMessage('Name is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('category').optional().isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

export const validateUpdate = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('sku').optional().notEmpty().withMessage('SKU cannot be empty'),
  body('category').optional().isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

export const validateFilters = [
  query('category').optional().isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  query('status').optional().isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  query('minPrice').optional().isFloat().withMessage('minPrice must be a number'),
  query('maxPrice').optional().isFloat().withMessage('maxPrice must be a number'),
  query('inStock').optional().isBoolean().withMessage('inStock must be true or false'),
  query('search').optional().isString().withMessage('search must be a string'),
];
