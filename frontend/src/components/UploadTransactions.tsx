import { useRef, useState } from "react";
import Papa from "papaparse";
import { Paper, Typography } from "@mui/material";

interface ParsedTransaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  type: string;
  accountNumber: string;
  category?: string;
}

const transformParsed = (parsed: ParsedTransaction): Record<string, any> => ({
  externalId: parsed.id,
  amount: Number(parsed.amount),
  date: new Date(parsed.date).toISOString(),
  description: parsed.description,
  type: parsed.type,
  accountNumber: parsed.accountNumber,
  source: "bank",
});

export const UploadTransactions = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/csv") {
      processCSV(file);
    }
  };

  const processCSV = (file: File) => {
    setIsUploading(true);
    Papa.parse<ParsedTransaction>(file, {
      header: true,
      transformHeader: (header) => {
        switch (header.trim()) {
          case "Transaction ID":
            return "id";
          case "Amount":
            return "amount";
          case "Timestamp":
            return "date";
          case "Description":
            return "description";
          case "Transaction Type":
            return "type";
          case "Account Number":
            return "accountNumber";
          default:
            return header;
        }
      },
      skipEmptyLines: true,
      complete: async (results) => {
        for (const row of results.data) {
          const tx = transformParsed(row);

          try {
            const response = await fetch("/transactions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(tx),
            });

            if (!response.ok) {
              console.error("Failed to send transaction:", tx);
            } else {
              console.log("Sent:", tx);
            }
          } catch (err) {
            console.error("Network error:", err);
          }
        }

        setIsUploading(false);
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/csv") {
      processCSV(file);
    }
  };

  return (
    <Paper
      elevation={0}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      sx={{
        p: 4,
        textAlign: "center",
        border: "2px dashed grey",
        backgroundColor: isDragging ? "grey.100" : "background.paper",
        cursor: "pointer",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <Typography variant="h6">
        {isUploading
          ? "Uploading..."
          : isDragging
            ? "Drop your transactions.csv here"
            : "Click or drag & drop transactions.csv here"}
      </Typography>
    </Paper>
  );
};
