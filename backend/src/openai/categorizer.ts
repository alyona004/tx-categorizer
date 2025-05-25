import { OpenAI } from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { Transaction } from '../models/transaction';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

const VALID_CATEGORIES = [
  'Groceries',
  'Dining Out',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Housing',
  'Education',
  'Miscellaneous',
] as const;

const BATCH_CATEGORIZATION_SCHEMA = z.object({
  transactions: z.array(
    z.object({
      id: z.string(),
      category: z.enum(VALID_CATEGORIES),
    }),
  ),
});
const openai = new OpenAI();

export const categorizeTransactionsBatch = async (
  transactions: Transaction[],
): Promise<Transaction[]> => {
  if (transactions.length === 0) {
    return [];
  }

  const systemPrompt = `
You are a bank transaction classifier. Categorize each transaction into one of the following categories:\n${VALID_CATEGORIES.join(', ')}.`;

  const formatted = transactions
    .map((t) => `ID: ${t.id}, Description: ${t.description}, Amount: ${t.amount}, Type: ${t.type}`)
    .join('\n');

  const userPrompt = `Transactions:\n${formatted}`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: zodResponseFormat(BATCH_CATEGORIZATION_SCHEMA, 'transactions'),
  });

  const raw = response.choices[0].message?.content;

  if (!raw) {
    throw new Error('No response from OpenAI');
  }

  const parsed = BATCH_CATEGORIZATION_SCHEMA.parse(JSON.parse(raw));

  const categoryMap = new Map(parsed.transactions.map((row) => [row.id, row.category]));

  return transactions.map((t) => ({
    ...t,
    category: categoryMap.get(t.id) || ' Miscellaneous',
  }));
};
