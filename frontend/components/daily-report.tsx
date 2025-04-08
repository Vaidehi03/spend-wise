"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExpenseChart } from "@/components/expense-chart"
import { ExpenseList } from "@/components/expense-list"

export function DailyReport() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily Spending</CardTitle>
          <CardDescription>View your daily spending patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseChart period="week" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today's Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseList />
        </CardContent>
      </Card>
    </div>
  )
}

