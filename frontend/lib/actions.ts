"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

type ExpenseData = {
  amount: number
  date: Date
  category: string
  description: string
}

export async function createExpense(data: ExpenseData) {
  const session = await auth()

  if (!session) {
    throw new Error("Not authenticated")
  }

  // In a real app, you would save to a database
  // This is a mock implementation
  console.log("Creating expense:", data)

  // Revalidate the expenses page to show the new expense
  revalidatePath("/expenses")
  revalidatePath("/dashboard")

  return { success: true }
}

