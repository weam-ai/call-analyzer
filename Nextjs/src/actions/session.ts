'use server';

import { getSession } from '@/config/withSession';

export async function getSessionData() {
  try {
    const session = await getSession();
    
    if (!session.user) {
      // Return null values if no session
      return {
        success: false,
        data: {
          id: null,
          email: null,
          companyId: null
        },
        error: 'No user session found'
      };
    }

    return {
      success: true,
      data: {
        id: session.user._id,
        email: session.user.email,
        companyId: session.user.companyId
      }
    };
  } catch (error) {
    console.error('Error getting session data:', error);
    // Return null values on error
    return {
      success: false,
      data: {
        id: null,
        email: null,
        companyId: null
      },
      error: 'Failed to get session data'
    };
  }
}
