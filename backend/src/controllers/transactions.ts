import { Request, Response } from 'express';
import { z } from 'zod';
import { extendZodWithOpenApi } from 'zod-openapi';
import { Transaction } from '../models/transaction';
import {
  acceptTransaction,
  findTransactionById,
  listTransactionsPaginated,
} from '../services/transactionService';

extendZodWithOpenApi(z);

export const TransactionInput = z
  .object({
    externalId: z.string(),
    amount: z.number(),
    date: z.string(),
    description: z.string(),
    type: z.string(),
    accountNumber: z.string(),
    source: z.string().optional(),
  })
  .openapi({
    title: 'Transaction request',
    description: 'Request to create a new transaction',
  });

export const createTransaction = async (req: Request, res: Response) => {
  const parseResult = TransactionInput.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid request body',
      issues: parseResult.error.format(),
    });

    return;
  }

  const tx = parseResult.data;

  try {
    const newTx: Partial<Transaction> = {
      externalId: tx.externalId,
      source: tx.source || 'bank',
      amount: tx.amount,
      date: new Date(tx.date).toISOString(),
      description: tx.description,
      type: tx.type,
      accountNumber: tx.accountNumber,
    };

    const result = await acceptTransaction(newTx);

    res.status(result.created ? 201 : 200).json({
      id: result.id,
    });
  } catch (error: any) {
    console.error('Failed to process transaction:', error);
    res.status(500).json({ error: error });
  }
};

const MAX_LIMIT = 100;

const encodeCursor = (timestamp: string, id: string): string => {
  return Buffer.from(JSON.stringify({ timestamp, id })).toString('base64url');
};

const decodeCursor = (cursor: string): { timestamp: string; id: string } => {
  return JSON.parse(Buffer.from(cursor, 'base64url').toString());
};

export const getAllTransactions = async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, MAX_LIMIT);
  const after = req.query.after as string;

  let afterTimestamp: string;
  let afterId: string;

  if (after) {
    try {
      const decoded = decodeCursor(after);
      afterTimestamp = decoded.timestamp;
      afterId = decoded.id;
    } catch (e) {
      res.status(400).json({ error: 'Invalid cursor format' });
      return;
    }
  }

  try {
    const items = await listTransactionsPaginated(limit, afterTimestamp, afterId);

    let next: string;
    if (items.length === limit) {
      const last = items[items.length - 1];
      next = encodeCursor(last.date, last.id);
    }

    res.json({ items, next });
  } catch (err) {
    console.error('Failed to fetch paginated transactions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTransactionById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const transaction = await findTransactionById(id);

  if (!transaction) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }

  res.status(200).json(transaction);
};
