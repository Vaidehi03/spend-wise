"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { reportsApi } from "@/lib/api-client"

type CategoryData = {
  category_id: number;
  category_name: string;
  amount: number;
};

type SummaryData = {
  total_expense: number;
  total_income: number;
  net_cashflow: number;
  transaction_count: number;
  top_expense_categories: CategoryData[];
  top_income_categories: CategoryData[];
  monthly_breakdown: Array<{
    month: string;
    expense: number;
    income: number;
    net: number;
  }>;
};

export function ExpenseCategories() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        // Get the last 30 days of expense data
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - 30);
        
        const data = await reportsApi.getSummary({
          start_date: startDate.toISOString().split('T')[0],
          end_date: now.toISOString().split('T')[0],
        }) as SummaryData;
        
        if (data.top_expense_categories && data.top_expense_categories.length > 0) {
          setCategories(data.top_expense_categories);
          setTotalExpense(data.total_expense);
        }
      } catch (err) {
        console.error("Failed to fetch category data:", err);
        setError("Failed to load category data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, []);

  // Handle category click to navigate to expenses with filter
  const handleCategoryClick = (categoryId: number, categoryName: string) => {
    router.push(`/expenses?category=${categoryId}&categoryName=${encodeURIComponent(categoryName)}`);
  };

  // Calculate percentage for each category
  const categoriesWithPercentage = categories.map(category => ({
    ...category,
    percentage: totalExpense > 0 ? Math.round((category.amount / totalExpense) * 100) : 0
  }));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
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
          <CardTitle>Expense by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-destructive">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {categoriesWithPercentage.length > 0 ? (
          <div className="space-y-4">
            {categoriesWithPercentage.map((category) => (
              <div 
                key={category.category_id} 
                className="space-y-2 cursor-pointer hover:bg-muted p-2 rounded-md transition-colors"
                onClick={() => handleCategoryClick(category.category_id, category.category_name)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category.category_name}</span>
                  <span className="text-sm text-muted-foreground">₹{category.amount.toFixed(2)}</span>
                </div>
                <Progress value={category.percentage} className="h-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No category data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}

