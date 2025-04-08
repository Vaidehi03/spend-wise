"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer } from "@/components/ui/chart"
import { Bar, BarChart, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { reportsApi } from "@/lib/api-client"

// Sample data as fallback if API data isn't available
const weeklyData = [
  { name: "Mon", amount: 40 },
  { name: "Tue", amount: 30 },
  { name: "Wed", amount: 60 },
  { name: "Thu", amount: 45 },
  { name: "Fri", amount: 80 },
  { name: "Sat", amount: 65 },
  { name: "Sun", amount: 15 },
]

const monthlyData = [
  { name: "Week 1", amount: 240 },
  { name: "Week 2", amount: 300 },
  { name: "Week 3", amount: 220 },
  { name: "Week 4", amount: 380 },
]

const yearlyData = [
  { name: "Jan", amount: 1200 },
  { name: "Feb", amount: 900 },
  { name: "Mar", amount: 1500 },
  { name: "Apr", amount: 1000 },
  { name: "May", amount: 800 },
  { name: "Jun", amount: 1300 },
  { name: "Jul", amount: 1100 },
  { name: "Aug", amount: 1400 },
  { name: "Sep", amount: 1600 },
  { name: "Oct", amount: 1000 },
  { name: "Nov", amount: 1200 },
  { name: "Dec", amount: 1800 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

type CategoryData = {
  category_id: number;
  category_name: string;
  amount: number;
}

type MonthlyReportResponse = {
  year: number;
  month: number | null;
  total_expense: number;
  total_income: number;
  net: number;
  categories: Array<{
    category_id: number | null;
    category_name: string;
    total_amount: number;
    transaction_count: number;
  }>;
}

type ExpenseChartProps = {
  period: "week" | "month" | "year";
  categoryData?: CategoryData[];
}

export function ExpenseChart({ period, categoryData }: ExpenseChartProps) {
  const [chartData, setChartData] = useState(weeklyData)
  const [timeData, setTimeData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const formatCategoryData = () => {
    // Format category data for pie chart if available
    if (categoryData && categoryData.length > 0) {
      return categoryData.map(cat => ({
        name: cat.category_name,
        value: cat.amount
      }));
    }
    
    // Fallback to sample data
    return [
      { name: "Food & Dining", value: 35 },
      { name: "Transportation", value: 15 },
      { name: "Entertainment", value: 10 },
      { name: "Utilities", value: 20 },
      { name: "Shopping", value: 20 },
    ];
  };

  useEffect(() => {
    const fetchTimeData = async () => {
      setLoading(true);
      try {
        let data: any[] = [];
        
        if (period === "year") {
          // Get monthly data for the current year
          const year = new Date().getFullYear();
          const response = await reportsApi.getMonthly(year) as MonthlyReportResponse;
          
          // Transform the data if available
          if (response && response.categories && response.categories.length > 0) {
            // We'll need to aggregate by month here
            // For now, use sample data
            data = yearlyData;
          } else {
            data = yearlyData;
          }
        } else if (period === "month") {
          // Use the monthly breakdown from the summary for the current month
          data = monthlyData; // Fallback to sample data for now
        } else {
          // For weekly data - use the current week days
          data = weeklyData; // Fallback to sample data for now
        }
        
        setTimeData(data);
      } catch (error) {
        console.error("Failed to fetch time data:", error);
        // Fallback to sample data
        if (period === "week") setTimeData(weeklyData);
        else if (period === "month") setTimeData(monthlyData);
        else setTimeData(yearlyData);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeData();
    
    // Also update chart data based on period
    if (period === "week") setChartData(weeklyData)
    else if (period === "month") setChartData(monthlyData)
    else setChartData(yearlyData)
  }, [period])

  const pieChartData = formatCategoryData();

  return (
    <Card>
      <CardContent className="p-0">
        <Tabs defaultValue="bar" className="p-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            <TabsTrigger value="pie">Pie Chart</TabsTrigger>
          </TabsList>
          <TabsContent value="bar" className="h-80">
            <ChartContainer>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`₹${value}`, 'Amount']}
                    labelFormatter={(label) => `Day: ${label}`}
                  />
                  <Bar dataKey="amount" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="pie" className="h-80">
            <ChartContainer>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

