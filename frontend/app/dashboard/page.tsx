"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ExpenseSummary } from "@/components/expense-summary"
import { RecentExpenses } from "@/components/recent-expenses"
import { ExpenseCategories } from "@/components/expense-categories"
import { AddExpenseButton } from "@/components/add-expense-button"
import { useAuth } from "@/components/auth-provider"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const [pageLoading, setPageLoading] = useState(true)
  const router = useRouter()
  const redirectAttempted = useRef(false)

  useEffect(() => {
    if (loading) return;

    if (user) {
      setPageLoading(false)
    } else if (!redirectAttempted.current) {
      // Only attempt redirect once
      redirectAttempted.current = true;
      router.push('/');
    }
  }, [loading, user, router])

  // Only show loading state during initial page load
  if (loading || pageLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <main className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <AddExpenseButton />
      </div>

      <ExpenseSummary />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentExpenses />
        <ExpenseCategories />
      </div>
    </main>
  )
}

