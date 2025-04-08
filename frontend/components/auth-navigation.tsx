"use client"

import { useEffect, useRef } from 'react'
import { useAuth } from './auth-provider'
import { usePathname, useRouter } from 'next/navigation'

interface AuthNavigationProps {
  authenticated?: boolean;
  redirectTo: string;
}

/**
 * Component that handles direct navigation based on authentication state
 * @param authenticated When true, redirects if user is authenticated; when false, redirects if user is not authenticated
 * @param redirectTo The path to redirect to
 */
export function AuthNavigation({ authenticated = true, redirectTo }: AuthNavigationProps) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const navigatedRef = useRef(false)
  
  useEffect(() => {
    // Don't do anything while authentication is being checked
    if (loading) return;
    
    // Don't redirect if we're already on the target page
    if (pathname === redirectTo) return;
    
    // Prevent multiple redirects
    if (navigatedRef.current) return;
    
    const shouldRedirect = authenticated ? !!user : !user;
    
    if (shouldRedirect) {
      navigatedRef.current = true;
      router.push(redirectTo);
    }
  }, [user, loading, authenticated, redirectTo, pathname, router]);
  
  // This component doesn't render anything
  return null;
} 