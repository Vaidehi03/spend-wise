"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExpenseChart } from "@/components/expense-chart"
import { reportsApi } from "@/lib/api-client"

type SummaryData = {
  total_expense: number;
  total_income: number;
  net_cashflow: number;
  transaction_count: number;
  top_expense_categories: Array<{
    category_id: number;
    category_name: string;
    amount: number;
  }>;
  top_income_categories: Array<{
    category_id: number;
    category_name: string;
    amount: number;
  }>;
  monthly_breakdown: Array<{
    month: string;
    expense: number;
    income: number;
    net: number;
  }>;
};

export function ExpenseSummary() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Calculate the start date based on the period
        const now = new Date();
        let startDate: Date;
        
        if (period === "week") {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
        } else if (period === "month") {
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
        } else { // year
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
        }
        
        const data = await reportsApi.getSummary({
          start_date: startDate.toISOString().split('T')[0],
          end_date: now.toISOString().split('T')[0],
        }) as SummaryData;
        
        setSummaryData(data);
      } catch (err) {
        console.error("Failed to fetch summary data:", err);
        setError("Failed to load expense summary. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [period]);

  const handlePeriodChange = (newPeriod: "week" | "month" | "year") => {
    setPeriod(newPeriod);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Summary</CardTitle>
          <CardDescription>Loading summary data...</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Summary</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex items-center justify-center">
          <div className="text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Summary</CardTitle>
        <CardDescription>Overview of your spending</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="week" onValueChange={(value) => handlePeriodChange(value as "week" | "month" | "year")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="year">This Year</TabsTrigger>
          </TabsList>
          <TabsContent value="week" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader className="p-4">
                  <CardDescription>Total Spent</CardDescription>
                  <CardTitle className="text-2xl">₹{summaryData?.total_expense.toFixed(2) || '0.00'}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="p-4">
                  <CardDescription>Transactions</CardDescription>
                  <CardTitle className="text-2xl">{summaryData?.transaction_count || 0}</CardTitle>
                </CardHeader>
              </Card>
            </div>
            <ExpenseChart period="week" categoryData={summaryData?.top_expense_categories} />
          </TabsContent>
          <TabsContent value="month" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader className="p-4">
                  <CardDescription>Total Spent</CardDescription>
                  <CardTitle className="text-2xl">₹{summaryData?.total_expense.toFixed(2) || '0.00'}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="p-4">
                  <CardDescription>Transactions</CardDescription>
                  <CardTitle className="text-2xl">{summaryData?.transaction_count || 0}</CardTitle>
                </CardHeader>
              </Card>
            </div>
            <ExpenseChart period="month" categoryData={summaryData?.top_expense_categories} />
          </TabsContent>
          <TabsContent value="year" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader className="p-4">
                  <CardDescription>Total Spent</CardDescription>
                  <CardTitle className="text-2xl">₹{summaryData?.total_expense.toFixed(2) || '0.00'}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="p-4">
                  <CardDescription>Transactions</CardDescription>
                  <CardTitle className="text-2xl">{summaryData?.transaction_count || 0}</CardTitle>
                </CardHeader>
              </Card>
            </div>
            <ExpenseChart period="year" categoryData={summaryData?.top_expense_categories} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

