import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/config/withSession'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.user) {
      return NextResponse.json({
        success: true,
        message: 'No user session found',
        data: {
          id: null,
          email: null,
          companyId: null
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: session.user._id,
        email: session.user.email,
        companyId: session.user.companyId
      }
    })
  } catch (error) {
    console.error('Error getting user session:', error)
    return NextResponse.json({
      success: true,
      message: 'Session not found',
      data: {
        id: null,
        email: null,
        companyId: null
      }
    })
  }
}
