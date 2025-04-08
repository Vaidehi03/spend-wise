"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { CategoryList } from "@/components/category-list"
import { AddCategoryForm } from "@/components/add-category-form"
import { useAuth } from "@/components/auth-provider"

export default function CategoriesPage() {
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
    <main className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Categories</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-medium mb-4">Add New Category</h2>
          <AddCategoryForm />
        </div>
        <div>
          <h2 className="text-xl font-medium mb-4">Existing Categories</h2>
          <CategoryList />
        </div>
      </div>
    </main>
  )
}

