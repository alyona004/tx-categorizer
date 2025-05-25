import { getAllTransactions } from './transactions';
import * as service from '../services/transactionService';

jest.mock('../services/transactionService');
jest.mock('../openai/categorizer', () => ({
  categorizeTransactionsBatch: jest.fn().mockResolvedValue([]),
}));

const mockList = service.listTransactionsPaginated as jest.Mock;

const createRes = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { status, json } as any;
};

const sampleTx = {
  externalId: 'TXN00001',
  source: 'bank',
  amount: 123.45,
  date: '2023-01-01T00:00:00Z',
  description: 'Test',
  type: 'debit',
  accountNumber: 'NL1234567890',
  id: 'abc-123',
  category: 'Shopping',
};

describe('getAllTransactions', () => {
  it('returns transactions', async () => {
    const req = { query: {} } as any;
    const res = createRes();

    mockList.mockResolvedValue([sampleTx]);

    await getAllTransactions(req, res);

    expect(mockList).toHaveBeenCalledWith(20, undefined, undefined);
    expect(res.json).toHaveBeenCalledWith({
      items: [sampleTx],
    });
  });
  it('uses cursor', async () => {
    const cursor = Buffer.from(
      JSON.stringify({
        timestamp: '2024-01-01T00:00:00Z',
        id: 'abc',
      }),
    ).toString('base64url');

    const req = { query: { after: cursor } } as any;
    const res = createRes();

    mockList.mockResolvedValue([sampleTx]);

    await getAllTransactions(req, res);

    expect(mockList).toHaveBeenCalledWith(20, '2024-01-01T00:00:00Z', 'abc');
    expect(res.json).toHaveBeenCalledWith({
      items: [sampleTx],
    });
  });
  it('returns cursor if page is full', async () => {
    const transactions = new Array(20).fill(0).map((_, i) => ({
      ...sampleTx,
      id: `tx-${i}`,
      date: `2024-01-01T00:00:00Z`,
    }));

    const req = { query: {} } as any;
    const res = createRes();

    mockList.mockResolvedValue(transactions);

    await getAllTransactions(req, res);

    expect(mockList).toHaveBeenCalledWith(20, undefined, undefined);
    expect(res.json).toHaveBeenCalledWith({
      items: transactions,
      next: Buffer.from(
        JSON.stringify({
          timestamp: '2024-01-01T00:00:00Z',
          id: 'tx-19',
        }),
      ).toString('base64url'),
    });
  });
});
