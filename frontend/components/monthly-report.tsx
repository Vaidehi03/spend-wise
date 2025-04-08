"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExpenseChart } from "@/components/expense-chart"
import { ExpenseCategories } from "@/components/expense-categories"

export function MonthlyReport() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending</CardTitle>
          <CardDescription>View your monthly spending patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseChart period="month" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseCategories />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ExpenseChart period="year" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

