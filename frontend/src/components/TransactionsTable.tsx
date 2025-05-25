import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Box } from "@mui/material";

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

export const TransactionsTable = ({
  transactions,
}: {
  transactions: Transaction[];
}) => {
  const columns: GridColDef[] = [
    { field: "externalId", headerName: "Transaction ID", width: 150 },
    { field: "amount", headerName: "Amount", width: 120 },
    { field: "date", headerName: "Date", width: 180 },
    { field: "description", headerName: "Description", width: 200 },
    { field: "type", headerName: "Type", width: 100 },
    { field: "accountNumber", headerName: "Account #", width: 160 },
    { field: "category", headerName: "Category", width: 160 },
  ];

  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
      <DataGrid
        rows={transactions}
        columns={columns}
        getRowId={(row) => row.id}
        sx={{ minWidth: "1200px" }}
      />
    </Box>
  );
};
