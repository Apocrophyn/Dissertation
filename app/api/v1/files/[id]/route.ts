import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    // Get file metadata from database
    const { data: fileData, error: dbError } = await supabase
      .from('uploads')
      .select('file_url, file_type, file_name')
      .eq('id', params.id)
      .single()

    if (dbError || !fileData) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Download file from storage
    const { data: fileBytes, error: downloadError } = await supabase
      .storage
      .from('medical-reports')
      .download(fileData.file_url)

    if (downloadError) {
      console.error('Error downloading file:', downloadError)
      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      )
    }

    // Create response with proper headers
    return new NextResponse(fileBytes, {
      headers: {
        'Content-Type': fileData.file_type,
        'Content-Disposition': `inline; filename="${fileData.file_name}"`,
      },
    })
  } catch (error) {
    console.error('Error retrieving file:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve file' },
      { status: 500 }
    )
  }
} 