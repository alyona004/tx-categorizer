import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '../models/transaction';
import { categorizeTransactionsBatch } from '../openai/categorizer';
import {
  findIdByExternalIdAndSource,
  insertTransactions,
  getTransactionById,
  getPaginatedTransactions,
} from '../repositories/transactionRepository';

const pendingTransactions: Transaction[] = [];

const FLUSH_INTERVAL_MS = 1000;
const BATCH_SIZE = 50;

interface AcceptTransactionResult {
  id: string;
  created: boolean;
}

export const acceptTransaction = async (
  tx: Partial<Transaction>,
): Promise<AcceptTransactionResult> => {
  const existingId = await findIdByExternalIdAndSource(tx.externalId, tx.source);

  if (existingId) {
    return {
      id: existingId,
      created: true,
    };
  }

  const newTx = {
    ...tx,
    id: uuidv4(),
    amount: Math.abs(tx.amount),
  } as Transaction;

  pendingTransactions.push(newTx);

  return {
    id: newTx.id,
    created: false,
  };
};

export const resetPendingTransactions = async () => {
  pendingTransactions.length = 0;
};

export const flushBatch = async () => {
  if (pendingTransactions.length === 0) return;

  const batch = pendingTransactions.splice(0, BATCH_SIZE);

  try {
    const categorized = await categorizeWithCache(batch);
    await insertTransactions(categorized);
  } catch (err) {
    console.error('Failed to flush transaction batch:', err);
    pendingTransactions.unshift(...batch);
  }
};

const categoryCache = new Map<string, string>();

const categorizeWithCache = async (batch: Transaction[]): Promise<Transaction[]> => {
  const cached: Transaction[] = [];
  const uncached: Transaction[] = [];

  for (const tx of batch) {
    const cachedCategory = categoryCache.get(tx.accountNumber);
    if (cachedCategory) {
      cached.push({ ...tx, category: cachedCategory });
    } else {
      uncached.push(tx);
    }
  }

  let newCategorized: Transaction[] = [];
  if (uncached.length > 0) {
    newCategorized = await categorizeTransactionsBatch(uncached);

    for (const tx of newCategorized) {
      categoryCache.set(tx.accountNumber, tx.category);
    }
  }

  console.log(
    `Flushed ${batch.length} transaction(s) | Cached: ${cached.length} | Sent to OpenAI: ${newCategorized.length}`,
  );

  return [...cached, ...newCategorized];
};

if (process.env.NODE_ENV !== 'test') {
  setInterval(flushBatch, FLUSH_INTERVAL_MS);
}

export const findTransactionById = async (id: string): Promise<Transaction | null> => {
  return await getTransactionById(id);
};

export const listTransactionsPaginated = async (
  limit: number,
  afterTimestamp?: string,
  afterId?: string,
): Promise<Transaction[]> => {
  return getPaginatedTransactions(limit, afterTimestamp, afterId);
};
