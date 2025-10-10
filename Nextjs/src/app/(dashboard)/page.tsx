import { getSession } from '@/config/withSession'
import { AuthorizationMessage } from '@/components/features/auth/AuthorizationMessage'
import { HomeClient } from '@/components/shared/HomeClient'

export default async function Home() {
  // Get session directly on server side like sessiontracker does
  const session = await getSession()
  const isAuthenticated = !!session.user
  const user = session.user

  // If not authenticated, show authorization message
  if (!isAuthenticated) {
    return <AuthorizationMessage />
  }

  // Pass user data to client component
  return <HomeClient user={user} />
}

