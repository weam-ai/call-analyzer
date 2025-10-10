import { getSession } from '@/config/withSession'
import { ObjectId } from 'mongodb'

/**
 * User object type for standardized user data
 */
export type UserObject = {
  id: ObjectId;
  email: string;
  companyId: ObjectId;
}

/**
 * Extracts user information from session and returns a standardized user object
 * @returns Promise<UserObject | null> - Standardized user object or null if no session
 */
export async function getUserFromSession(): Promise<UserObject | null> {
  try {
    const session = await getSession();
    
    if (!session.user) {
      return null;
    }

    const user: UserObject = {
      id: new ObjectId(session.user._id),
      email: session.user.email,
      companyId: new ObjectId(session.user.companyId)
    };

    return user;
  } catch (error) {
    return null;
  }
}
