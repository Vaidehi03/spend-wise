"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ExpenseItem } from "@/components/expense-item"
import { transactionsApi } from "@/lib/api-client"

type Transaction = {
  id: number;
  amount: number;
  transaction_date: string;
  description: string;
  merchant: string;
  is_expense: boolean;
  category_id: number | null;
  category?: {
    id: number;
    name: string;
  };
};

export function RecentExpenses() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        setLoading(true);
        // Get the most recent transactions, limit to 5
        const data = await transactionsApi.list({
          limit: 5,
          is_expense: true
        }) as Transaction[];
        
        setTransactions(data);
      } catch (err) {
        console.error("Failed to fetch recent transactions:", err);
        setError("Failed to load recent expenses. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecentTransactions();
  }, []);

  // Format transaction data for the ExpenseItem component
  const formatTransactions = () => {
    return transactions.map(tx => ({
      id: tx.id.toString(),
      amount: tx.amount,
      date: new Date(tx.transaction_date),
      category: tx.category?.name || "Uncategorized",
      description: tx.description || tx.merchant || "Unknown"
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-pulse">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-destructive">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedTransactions = formatTransactions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {formattedTransactions.length > 0 ? (
            <div className="space-y-4">
              {formattedTransactions.map((expense) => (
                <ExpenseItem key={expense.id} expense={expense} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              No recent expenses found
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

