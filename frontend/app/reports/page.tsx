"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DailyReport } from "@/components/daily-report"
import { MonthlyReport } from "@/components/monthly-report"
import { useAuth } from "@/components/auth-provider"

export default function ReportsPage() {
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
      <h1 className="text-2xl font-bold">Reports</h1>

      <Tabs defaultValue="daily">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="mt-6">
          <DailyReport />
        </TabsContent>
        <TabsContent value="monthly" className="mt-6">
          <MonthlyReport />
        </TabsContent>
      </Tabs>
    </main>
  )
}

