"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon, Plus } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const formSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.date(),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  newCategory: z.string().optional(),
})

const predefinedCategories = [
  "Food & Dining",
  "Transportation",
  "Entertainment",
  "Utilities",
  "Shopping",
  "Housing",
  "Healthcare",
  "Personal Care",
  "Education",
  "Travel",
  "Other",
]

export function ExpenseForm() {
  const { toast } = useToast()
  const router = useRouter()
  const [isNewCategory, setIsNewCategory] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      date: new Date(),
      category: "",
      description: "",
      newCategory: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const category = isNewCategory ? values.newCategory : values.category

      // Mock API call - in a real app, this would be an API call
      // In this demo, we'll just show a success message

      toast({
        title: "Expense added",
        description: "Your expense has been added successfully.",
      })

      // Use Next.js router for navigation
      router.push('/expenses');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">₹</span>
                  <Input type="number" step="0.01" placeholder="0.00" className="pl-7" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <FormLabel>Category</FormLabel>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  New Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                </DialogHeader>
                <FormField
                  control={form.control}
                  name="newCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter category name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (form.getValues("newCategory")) {
                      setIsNewCategory(true)
                      setIsDialogOpen(false)
                    }
                  }}
                >
                  Add Category
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          {isNewCategory ? (
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <span>{form.getValues("newCategory")}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  setIsNewCategory(false)
                  form.setValue("newCategory", "")
                }}
              >
                Change
              </Button>
            </div>
          ) : (
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {predefinedCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Add details about this expense" {...field} />
              </FormControl>
              <FormDescription>Add any additional information about this expense.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Save Expense
        </Button>
      </form>
    </Form>
  )
}

