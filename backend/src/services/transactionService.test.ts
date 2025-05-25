import { acceptTransaction, resetPendingTransactions, flushBatch } from './transactionService';
import * as repository from '../repositories/transactionRepository';
import { categorizeTransactionsBatch } from '../openai/categorizer';

jest.mock('../openai/categorizer', () => ({
  categorizeTransactionsBatch: jest.fn().mockResolvedValue([]),
}));

jest.mock('../repositories/transactionRepository');

const mockFind = repository.findIdByExternalIdAndSource as jest.Mock;
const mockInsert = repository.insertTransactions as jest.Mock;
const mockCategorize = categorizeTransactionsBatch as jest.Mock;

const sampleTx = {
  externalId: 'TXN00001',
  source: 'bank',
  amount: 123.45,
  date: '2023-01-01T00:00:00Z',
  description: 'Test',
  type: 'debit',
  accountNumber: 'NL1234567890',
  id: '',
  category: '',
};

describe('acceptTransaction', () => {
  beforeEach(() => {
    resetPendingTransactions();
    mockFind.mockReset();
  });

  it('generate uuid for new transaction', async () => {
    mockFind.mockResolvedValue(null);

    const result = await acceptTransaction(sampleTx);
    expect(result.created).toBeFalsy();
    expect(result.id).toBeTruthy();
  });

  it('reuse ID if transaction already exists', async () => {
    mockFind.mockResolvedValue('old-uuid');

    const result = await acceptTransaction(sampleTx);
    expect(result.created).toBeTruthy();
    expect(result.id).toEqual('old-uuid');
  });
});

describe('flushBatch', () => {
  beforeEach(() => {
    resetPendingTransactions();
    mockFind.mockReset();
    mockCategorize.mockReset();
    mockInsert.mockReset();
  });

  it('should call openAI for new transaction', async () => {
    mockCategorize.mockResolvedValue([
      {
        ...sampleTx,
        category: 'Miscellaneous',
      },
    ]);

    await acceptTransaction(sampleTx);
    await flushBatch();

    expect(mockCategorize).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });
  it('should categorize from cache for same account number', async () => {
    await acceptTransaction(sampleTx);
    await flushBatch();
    expect(mockCategorize).toHaveBeenCalledTimes(0);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });
});
