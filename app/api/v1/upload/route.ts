import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Generate a unique filename
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${timestamp}-${file.name}`

    // Upload file to storage bucket
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('medical-reports')
      .upload(fileName, file)

    if (storageError) {
      console.error('Error uploading to storage:', storageError)
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      )
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('medical-reports')
      .getPublicUrl(fileName)

    // Store file metadata in the uploads table
    const { data, error: dbError } = await supabase
      .from('uploads')
      .insert({
        file_url: fileName,
        file_name: file.name,
        file_type: file.type,
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('Error storing in database:', dbError)
      return NextResponse.json(
        { error: 'Failed to store file metadata' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: `/api/v1/files/${data.id}`,
      fileName: file.name,
      fileType: file.type
    })
  } catch (error) {
    console.error('Error in upload endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    )
  }
} 