import express from 'express';
import * as productController from '../controllers/productController.js';
import { validate, validateCreate, validateUpdate, validateFilters } from '../validators/productValidator.js';

const router = express.Router();

router.get('/', validate(validateFilters), productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', validate(validateCreate), productController.createProduct);
router.patch('/:id', validate(validateUpdate), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

export default router;
