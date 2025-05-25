import "./App.css";
import { Box } from "@mui/material";
import { TransactionsDashboard } from "./TransactionsDashboard.tsx";

function App() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: 4,
      }}
    >
      <TransactionsDashboard />
    </Box>
  );
}

export default App;
