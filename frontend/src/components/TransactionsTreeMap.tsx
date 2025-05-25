import { ResponsiveContainer, Treemap } from "recharts";
import { Paper, Typography, Box } from "@mui/material";

interface Transaction {
  id: string;
  amount: number;
  category: string;
}

const categoryColors: Record<string, string> = {
  Groceries: "#F4A261",
  Healthcare: "#E76F51",
  Transportation: "#2A9D8F",
  Shopping: "#264653",
  Miscellaneous: "#A8DADC",
  Utilities: "#A29BFE",
  Housing: "#81B29A",
  Entertainment: "#F2C94C",
  Uncategorized: "#BDBDBD",
  Default: "#8884d8",
};

const getColor = (category: string): string =>
  categoryColors[category] || categoryColors.Default;

export const TransactionsTreeMap = ({
  transactions,
}: {
  transactions: Transaction[];
}) => {
  const grouped = transactions.reduce<Record<string, number>>((acc, tx) => {
    const category = tx.category;
    acc[category] = (acc[category] || 0) + tx.amount;
    return acc;
  }, {});

  const data = Object.entries(grouped).map(([name, amount]) => ({
    name,
    amount: Math.abs(amount),
  }));

  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <Paper elevation={0}>
      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={4}>
        <Box flex={2} minWidth={0}>
          <ResponsiveContainer width="100%" height={400}>
            <Treemap
              data={data}
              dataKey="amount"
              nameKey="name"
              stroke="#fff"
              fill="#8884d8"
              isAnimationActive={false}
              content={
                <CustomTreemapContent
                  x={0}
                  y={0}
                  width={0}
                  height={0}
                  name={""}
                />
              }
            />
          </ResponsiveContainer>
        </Box>

        <Box
          flex={1}
          minWidth={200}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            <strong>Total: € {total.toFixed(2)}</strong>
          </Typography>

          <Box display="flex" flexDirection="column">
            {data.map(({ name, amount }) => (
              <Box key={name} display="flex" alignItems="center" mr={2} mb={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: getColor(name),
                    borderRadius: 1,
                    mr: 1,
                  }}
                />
                <Typography variant="body2">
                  {name}: € {amount.toFixed(2)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

interface TreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
}

const CustomTreemapContent = (props: TreemapContentProps) => {
  const { x, y, width, height, name } = props;

  if (typeof name !== "string") {
    return null;
  }

  const fontSize = width < 70 ? 9 : 12;
  const shortName = width < 70 ? name.slice(0, 6) + "…" : name;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={getColor(name)}
        stroke="#none"
      />
      <text
        x={x + 4}
        y={y + 18}
        fill="#fff"
        fontSize={fontSize}
        fontWeight="bold"
      >
        {shortName}
      </text>
    </g>
  );
};
