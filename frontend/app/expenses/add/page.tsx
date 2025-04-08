"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ExpenseForm } from "@/components/expense-form"
import { useAuth } from "@/components/auth-provider"

export default function AddExpensePage() {
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

  if (loading || pageLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Add Expense</h1>
      <ExpenseForm />
    </main>
  )
}

