export interface Transaction {
  id: string;
  externalId: string;
  source: string;
  amount: number;
  date: string;
  description: string;
  type: string;
  accountNumber: string;
  category: string;
}
