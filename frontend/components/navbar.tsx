"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, Home, LogOut, Menu, Package, PieChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/components/auth-provider"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  // Don't render the navbar on the home/login page
  if (pathname === "/") return null

  const handleSignOut = async () => {
    try {
      await logout()
      // Use router for navigation instead of direct location change
      router.push('/');
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-semibold text-lg">
          Spend Wise
        </Link>

        <div className="hidden md:flex items-center space-x-1">
          <NavLinks />
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Spend Wise</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-4 mt-4">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

function NavLinks() {
  const pathname = usePathname()

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/expenses", label: "Expenses", icon: Package },
    { href: "/categories", label: "Categories", icon: PieChart },
    { href: "/reports", label: "Reports", icon: BarChart3 },
  ]

  return (
    <>
      {links.map((link) => {
        const Icon = link.icon
        const isActive = pathname === link.href

        return (
          <Button
            key={link.href}
            variant={isActive ? "default" : "ghost"}
            asChild
            className="md:w-auto w-full justify-start"
          >
            <Link href={link.href}>
              <Icon className="h-4 w-4 mr-2" />
              {link.label}
            </Link>
          </Button>
        )
      })}
    </>
  )
}

