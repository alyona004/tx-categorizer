let mockCreate: jest.Mock;

jest.mock('openai', () => {
  mockCreate = jest.fn();

  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

import { categorizeTransactionsBatch } from './categorizer';

const sampleTx = {
  externalId: 'TXN00001',
  source: 'bank',
  amount: 123.45,
  date: '2023-01-01T00:00:00Z',
  description: 'Test',
  type: 'debit',
  accountNumber: 'NL1234567890',
  id: 'abc-123',
  category: '',
};

describe('categorizeTransactionsBatch', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('not call OpenAI for empty input', async () => {
    const result = await categorizeTransactionsBatch([]);
    expect(result).toEqual([]);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('categorizes transactions', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              transactions: [
                {
                  id: 'abc-123',
                  category: 'Groceries',
                },
              ],
            }),
          },
        },
      ],
    });

    const result = await categorizeTransactionsBatch([sampleTx]);
    expect(result).toEqual([
      {
        ...sampleTx,
        category: 'Groceries',
      },
    ]);
  });
});
