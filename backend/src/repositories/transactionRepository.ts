import { pool } from '../db/connection';
import { Transaction } from '../models/transaction';
import { string } from 'zod';

export const findIdByExternalIdAndSource = async (
  externalID: string,
  source: string,
): Promise<string | null> => {
  const result = await pool.query(
    `SELECT id FROM transactions WHERE external_id=$1 AND source=$2 LIMIT 1`,
    [externalID, source],
  );
  return result.rows[0]?.id || null;
};

export const insertTransactions = async (transactions: Transaction[]): Promise<void> => {
  if (transactions.length === 0) {
    return;
  }

  const values: any[] = [];
  const placeholders: string[] = [];

  transactions.forEach((tx, i) => {
    const offset = i * 9;
    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`,
    );
    values.push(
      tx.id,
      tx.externalId,
      tx.source,
      tx.amount,
      tx.date,
      tx.description,
      tx.type,
      tx.accountNumber,
      tx.category,
    );
  });

  const query = `
    INSERT INTO transactions (
      id, external_id, source, amount, timestamp, description, type, account_number, category
    )
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (id) DO NOTHING
  `;

  await pool.query(query, values);
};

export const getTransactionById = async (id: string): Promise<Transaction | null> => {
  const result = await pool.query(
    `
    SELECT id, external_id, source, amount, timestamp, description, type, account_number, category
    FROM transactions
    WHERE id = $1
    `,
    [id],
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    externalId: row.external_id,
    source: row.source,
    amount: Number(row.amount),
    date: row.timestamp,
    description: row.description,
    type: row.type,
    accountNumber: row.account_number,
    category: row.category,
  };
};

export const getPaginatedTransactions = async (
  limit: number,
  afterTimestamp?: string,
  afterId?: string,
): Promise<Transaction[]> => {
  let query: string;
  let params: any[] = [];

  if (afterTimestamp && afterId) {
    query = `
      SELECT id, external_id, source, amount, timestamp, description, type, account_number, category
      FROM transactions
      WHERE (timestamp, id) < ($1, $2)
      ORDER BY timestamp DESC, id DESC
      LIMIT $3
    `;
    params = [afterTimestamp, afterId, limit];
  } else {
    query = `
      SELECT id, external_id, source, amount, timestamp, description, type, account_number, category
      FROM transactions
      ORDER BY timestamp DESC, id DESC
      LIMIT $1
    `;
    params = [limit];
  }

  const result = await pool.query(query, params);

  return result.rows.map((row) => ({
    id: row.id,
    externalId: row.external_id,
    source: row.source,
    amount: Number(row.amount),
    date: row.timestamp,
    description: row.description,
    type: row.type,
    accountNumber: row.account_number,
    category: row.category,
  }));
};
