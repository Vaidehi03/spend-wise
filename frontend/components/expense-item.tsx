"use client"

import { format } from "date-fns"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

type Expense = {
  id: string
  amount: number
  date: Date
  category: {
    id: string
    name: string
  }
  description: string
}

type ExpenseItemProps = {
  expense: Expense
}

export function ExpenseItem({ expense }: ExpenseItemProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">₹{expense.amount.toFixed(2)}</span>
              <Badge variant="outline">{expense.category.name}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{expense.description}</p>
            <p className="text-xs text-muted-foreground">{format(expense.date, "MMM d, yyyy")}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

