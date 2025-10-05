import { NextRequest, NextResponse } from 'next/server'

/**
 * GET - Callback test endpoint
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const allParams: Record<string, string> = {}
  
  for (const [key, value] of searchParams.entries()) {
    allParams[key] = value
  }

  console.log('🧪 Callback test endpoint called:', {
    method: 'GET',
    url: request.url,
    params: allParams,
    timestamp: new Date().toISOString()
  })

  return NextResponse.json({
    success: true,
    message: 'Callback test endpoint working',
    method: 'GET',
    params: allParams,
    timestamp: new Date().toISOString()
  })
}

/**
 * POST - Callback test endpoint  
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const allParams: Record<string, string> = {}
  
  for (const [key, value] of formData.entries()) {
    allParams[key] = value as string
  }

  console.log('🧪 Callback test endpoint called:', {
    method: 'POST',
    url: request.url,
    params: allParams,
    timestamp: new Date().toISOString()
  })

  return NextResponse.json({
    success: true,
    message: 'Callback test endpoint working',
    method: 'POST',
    params: allParams,
    timestamp: new Date().toISOString()
  })
} 