import { Router } from 'express';
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
} from '../controllers/transactions';

const router = Router();

router.post('/', createTransaction);
router.get('/', getAllTransactions);
router.get('/:id', getTransactionById);

export default router;
