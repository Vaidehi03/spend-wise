"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ExpenseList } from "@/components/expense-list"
import { ExpenseFilters } from "@/components/expense-filters"
import { AddExpenseButton } from "@/components/add-expense-button"
import { useAuth } from "@/components/auth-provider"

interface FilterProps {
  category: string;
  search: string;
  date: string | null;
}

export default function ExpensesPage() {
  const { user, loading } = useAuth()
  const [pageLoading, setPageLoading] = useState(true)
  const router = useRouter()
  const redirectAttempted = useRef(false)
  const [activeFilters, setActiveFilters] = useState<FilterProps>({
    category: "",
    search: "",
    date: null
  })

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

  const handleFilterChange = (filters: FilterProps) => {
    setActiveFilters(filters);
  }

  if (loading || pageLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <main className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Expenses</h1>
        <AddExpenseButton />
      </div>

      <ExpenseFilters onFilterChange={handleFilterChange} />
      <ExpenseList />
    </main>
  )
}

