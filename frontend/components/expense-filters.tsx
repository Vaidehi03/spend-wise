"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarIcon, Search } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

// Type for available category data
interface Category {
  id: string;
  name: string;
}

interface FilterProps {
  category: string;
  search: string;
  date: string | null;
}

interface ExpenseFiltersProps {
  onFilterChange: (filters: FilterProps) => void;
}

export function ExpenseFilters({ onFilterChange }: ExpenseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [date, setDate] = useState<Date>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get categories from API
  useEffect(() => {
    // TODO: Replace with actual API call to get categories
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        // Simulate API call - replace with actual API
        const mockCategories: Category[] = [
          { id: "1", name: "Food & Dining" },
          { id: "2", name: "Transportation" },
          { id: "3", name: "Entertainment" },
          { id: "4", name: "Utilities" },
          { id: "5", name: "Shopping" },
        ];
        setCategories(mockCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Initialize filters from URL params
  useEffect(() => {
    const categoryId = searchParams.get("category");
    if (categoryId) {
      setSelectedCategory(categoryId);
    } else {
      setSelectedCategory("all"); // Default to "all" instead of empty string
    }

    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }

    const dateParam = searchParams.get("date");
    if (dateParam) {
      setDate(new Date(dateParam));
    }
  }, [searchParams]);

  // Apply filters when they change
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        category: selectedCategory === "all" ? "" : selectedCategory,
        search: searchTerm,
        date: date ? date.toISOString().split('T')[0] : null
      });
    }
  }, [selectedCategory, searchTerm, date, onFilterChange]);

  // Update URL with current filters
  const updateUrlParams = (filters: { category?: string, search?: string, date?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (filters.category) {
      params.set("category", filters.category);
    } else {
      params.delete("category");
    }
    
    if (filters.search) {
      params.set("search", filters.search);
    } else {
      params.delete("search");
    }
    
    if (filters.date) {
      params.set("date", filters.date);
    } else {
      params.delete("date");
    }
    
    router.push(`/expenses?${params.toString()}`);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    updateUrlParams({ 
      category: value === "all" ? "" : value, 
      search: searchTerm, 
      date: date?.toISOString().split('T')[0] 
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    updateUrlParams({ 
      category: selectedCategory, 
      search: searchTerm, 
      date: newDate?.toISOString().split('T')[0] 
    });
  };

  const handleResetFilters = () => {
    setSelectedCategory("all"); // Use "all" instead of empty string
    setSearchTerm("");
    setDate(undefined);
    router.push("/expenses");
    
    if (onFilterChange) {
      onFilterChange({ category: "", search: "", date: null });
    }
  };

  // Get category name from ID for display purposes
  const getCategoryName = (id: string) => {
    const category = categories.find(cat => cat.id === id);
    return category ? category.name : "All Categories";
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          type="search" 
          placeholder="Search expenses..." 
          className="pl-8" 
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateUrlParams({ category: selectedCategory, search: searchTerm, date: date?.toISOString().split('T')[0] });
            }
          }}
        />
      </div>

      <Select value={selectedCategory} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map(category => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn("w-full sm:w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Filter by date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar 
            mode="single" 
            selected={date} 
            onSelect={handleDateChange} 
            initialFocus 
          />
        </PopoverContent>
      </Popover>

      <Button variant="outline" className="w-full sm:w-auto" onClick={handleResetFilters}>
        Reset Filters
      </Button>
    </div>
  )
}

