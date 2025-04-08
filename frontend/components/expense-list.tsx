"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ExpenseItem } from "@/components/expense-item"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// Sample data - would be replaced with real data from API
const allExpenses = [
  {
    id: "1",
    amount: 42.99,
    date: new Date("2023-06-15"),
    category: { id: "1", name: "Food & Dining" },
    description: "Grocery shopping",
  },
  {
    id: "2",
    amount: 12.5,
    date: new Date("2023-06-14"),
    category: { id: "2", name: "Transportation" },
    description: "Uber ride",
  },
  {
    id: "3",
    amount: 8.99,
    date: new Date("2023-06-14"),
    category: { id: "3", name: "Entertainment" },
    description: "Movie ticket",
  },
  {
    id: "4",
    amount: 65.0,
    date: new Date("2023-06-13"),
    category: { id: "4", name: "Utilities" },
    description: "Electricity bill",
  },
  {
    id: "5",
    amount: 24.99,
    date: new Date("2023-06-12"),
    category: { id: "5", name: "Shopping" },
    description: "T-shirt",
  },
  {
    id: "6",
    amount: 35.5,
    date: new Date("2023-06-11"),
    category: { id: "1", name: "Food & Dining" },
    description: "Restaurant dinner",
  },
  {
    id: "7",
    amount: 9.99,
    date: new Date("2023-06-10"),
    category: { id: "3", name: "Entertainment" },
    description: "Music subscription",
  },
  {
    id: "8",
    amount: 45.0,
    date: new Date("2023-06-09"),
    category: { id: "6", name: "Healthcare" },
    description: "Pharmacy",
  },
]

interface FilterProps {
  category: string;
  search: string;
  date: string | null;
}

export function ExpenseList() {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1)
  const [filteredExpenses, setFilteredExpenses] = useState(allExpenses)
  const [activeFilters, setActiveFilters] = useState<FilterProps>({
    category: "",
    search: "",
    date: null
  })
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const itemsPerPage = 5

  // Apply filters when URL params change
  useEffect(() => {
    const categoryId = searchParams.get("category");
    const categoryNameParam = searchParams.get("categoryName");
    const searchQuery = searchParams.get("search");
    const dateParam = searchParams.get("date");

    if (categoryNameParam) {
      setCategoryName(decodeURIComponent(categoryNameParam));
    } else {
      setCategoryName(null);
    }

    setActiveFilters({
      category: categoryId || "",
      search: searchQuery || "",
      date: dateParam
    });

    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchParams]);

  // Filter expenses based on active filters
  useEffect(() => {
    let filtered = [...allExpenses];

    // Filter by category
    if (activeFilters.category) {
      filtered = filtered.filter(expense => 
        expense.category.id === activeFilters.category
      );
    }

    // Filter by search term
    if (activeFilters.search) {
      const searchLower = activeFilters.search.toLowerCase();
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(searchLower) ||
        expense.category.name.toLowerCase().includes(searchLower)
      );
    }

    // Filter by date
    if (activeFilters.date) {
      const filterDate = new Date(activeFilters.date);
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredExpenses(filtered);
  }, [activeFilters]);

  const handleFilterChange = (filters: FilterProps) => {
    setActiveFilters(filters);
  };

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage)

  return (
    <div className="space-y-4">
      {categoryName && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">
              Showing expenses for: {categoryName}
            </CardTitle>
            <CardDescription>
              Found {filteredExpenses.length} expenses in this category
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {currentItems.length > 0 ? (
        <>
          {currentItems.map((expense) => (
            <ExpenseItem key={expense.id} expense={expense} />
          ))}

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) setCurrentPage(currentPage - 1)
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }).map((_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage(index + 1)
                    }}
                    isActive={currentPage === index + 1}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No expenses found</CardTitle>
            <CardDescription>
              Try adjusting your filters or add a new expense
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}

