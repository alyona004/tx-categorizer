import { useEffect, useState } from "react";
import { TransactionsTable } from "./components/TransactionsTable";
import { TransactionsTreeMap } from "./components/TransactionsTreeMap";
import { UploadTransactions } from "./components/UploadTransactions";

interface Transaction {
  id: string;
  externalId: string;
  amount: number;
  date: string;
  description: string;
  type: string;
  accountNumber: string;
  source: string;
  category: string;
}

export const TransactionsDashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchAllTransactions = async (): Promise<Transaction[]> => {
    let all: Transaction[] = [];
    let next: string | undefined = undefined;

    try {
      do {
        const url = new URL("/transactions", window.location.origin);
        url.searchParams.set("limit", "100");

        if (next) {
          url.searchParams.set("after", next);
        }

        const res = await fetch(url.toString());
        const data = await res.json();

        all = [...all, ...(data.items || [])];
        next = data.next;
      } while (next);

      return all;
    } catch (err) {
      console.error("Failed to fetch all transactions:", err);

      return [];
    }
  };

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      const latest = await fetchAllTransactions();

      if (!cancelled && latest.length !== transactions.length) {
        setTransactions(latest);
      }

      if (!cancelled) {
        setTimeout(poll, 3000); // 🕒 safe and sequential
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [transactions.length]);

  return (
    <>
      <UploadTransactions />
      <TransactionsTreeMap transactions={transactions} />
      <TransactionsTable transactions={transactions} />
    </>
  );
};
