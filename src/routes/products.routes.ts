import { Router } from 'express';
import { getProductByCode, searchProducts } from '../controllers/products.controller';

const router = Router();

router.get('/', searchProducts);
router.get('/:code', getProductByCode);

export default router;
