"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AddExpenseButton() {
  return (
    <Button asChild>
      <Link href="/expenses/add">
        <Plus className="h-4 w-4 mr-2" />
        Add Expense
      </Link>
    </Button>
  )
}

