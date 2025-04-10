"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarIcon, Search } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { categoriesApi } from "@/lib/api-client"

// Type for available category data
interface Category {
  id: number;
  name: string;
  description?: string | null;
  is_expense: boolean;
  parent_id?: number | null;
  user_id?: number | null;
  is_system: boolean;
  created_at: string;
  updated_at?: string | null;
  keywords?: any[];
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
  const hasInitialized = useRef(false);
  
  // State values
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch categories from the API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching categories from API...");
        
        // Check if we have a token
        const token = localStorage.getItem('token');
        console.log("Auth token available:", !!token);
        
        if (!token) {
          console.error("No authentication token available");
          setIsLoading(false);
          return;
        }
        
        // Try to get categories from API
        const data = await categoriesApi.list();
        console.log("API response:", data);
        
        if (Array.isArray(data) && data.length > 0) {
          console.log(`Successfully loaded ${data.length} categories from API`);
          setCategories(data as Category[]);
        } else {
          console.log("API returned empty or invalid data:", data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Initialize filters from URL once
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    const categoryId = searchParams.get("category");
    const searchQuery = searchParams.get("search");
    const dateParam = searchParams.get("date");
    
    if (categoryId) setSelectedCategory(categoryId);
    if (searchQuery) setSearchTerm(searchQuery);
    if (dateParam) setDate(new Date(dateParam));
    
    // Initial notification to parent component
    onFilterChange({
      category: categoryId || "",
      search: searchQuery || "",
      date: dateParam
    });
  }, [searchParams, onFilterChange]);
  
  // Memoize the filters object to avoid unnecessary rerenders
  const currentFilters = useMemo(() => ({
    category: selectedCategory === "all" ? "" : selectedCategory,
    search: searchTerm,
    date: date ? date.toISOString().split('T')[0] : null
  }), [selectedCategory, searchTerm, date]);
  
  // Stable handler for URL updates
  const updateUrl = useCallback((categoryVal: string, searchVal: string, dateVal?: Date) => {
    const params = new URLSearchParams();
    
    if (categoryVal && categoryVal !== "all") {
      params.set("category", categoryVal);
      
      // Add category name for display purposes if we have it
      const selectedCat = categories.find(c => c.id.toString() === categoryVal);
      if (selectedCat) {
        params.set("categoryName", encodeURIComponent(selectedCat.name));
      }
    }
    
    if (searchVal) {
      params.set("search", searchVal);
    }
    
    if (dateVal) {
      params.set("date", dateVal.toISOString().split('T')[0]);
    }
    
    const newUrl = `/expenses${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl);
  }, [router, categories]);
  
  // Handle category selection
  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value);
    
    // Update URL and notify parent component (after state is updated)
    setTimeout(() => {
      updateUrl(value, searchTerm, date);
      onFilterChange({
        category: value === "all" ? "" : value,
        search: searchTerm,
        date: date ? date.toISOString().split('T')[0] : null
      });
    }, 0);
  }, [searchTerm, date, updateUrl, onFilterChange]);
  
  // Handle search input
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);
  
  // Handle search submission
  const handleSearchSubmit = useCallback(() => {
    updateUrl(selectedCategory, searchTerm, date);
    onFilterChange(currentFilters);
  }, [selectedCategory, searchTerm, date, updateUrl, onFilterChange, currentFilters]);
  
  // Handle date selection
  const handleDateChange = useCallback((newDate: Date | undefined) => {
    setDate(newDate);
    
    // Update URL and notify parent component (after state is updated)
    setTimeout(() => {
      updateUrl(selectedCategory, searchTerm, newDate);
      onFilterChange({
        category: selectedCategory === "all" ? "" : selectedCategory,
        search: searchTerm,
        date: newDate ? newDate.toISOString().split('T')[0] : null
      });
    }, 0);
  }, [selectedCategory, searchTerm, updateUrl, onFilterChange]);
  
  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    setSelectedCategory("all");
    setSearchTerm("");
    setDate(undefined);
    
    // Update URL and notify parent component
    router.push("/expenses");
    onFilterChange({ category: "", search: "", date: null });
  }, [router, onFilterChange]);
  
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
              handleSearchSubmit();
            }
          }}
        />
      </div>

      <Select 
        value={selectedCategory} 
        onValueChange={handleCategoryChange}
        defaultValue="all"
        disabled={isLoading}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder={isLoading ? "Loading..." : "Category"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem key="all-categories" value="all">All Categories</SelectItem>
          {categories.map(category => (
            <SelectItem key={category.id.toString()} value={category.id.toString()}>
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

