import { getSession } from '@/config/withSession'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Optional: Add dashboard-specific logic here
  // For now, just pass through children
  return <>{children}</>
}

