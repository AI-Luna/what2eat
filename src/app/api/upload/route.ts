import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  console.log('[Upload API] Starting file upload...');

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('[Upload API] Error: No file provided in request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('[Upload API] File received:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`
    });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, '-');
    const filename = `${timestamp}-${originalName}`;

    console.log('[Upload API] Generated filename:', filename);

    // Define upload directory (public/uploads)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // Create uploads directory if it doesn't exist
    try {
      await mkdir(uploadDir, { recursive: true });
      console.log('[Upload API] Upload directory ready:', uploadDir);
    } catch {
      // Directory might already exist, which is fine
      console.log('[Upload API] Upload directory already exists');
    }

    // Save file
    const filePath = path.join(uploadDir, filename);
    console.log('[Upload API] Saving file to:', filePath);
    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/${filename}`;

    console.log('[Upload API] Upload successful!', {
      url: publicUrl,
      filename: filename
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename
    });

  } catch (error) {
    console.error('[Upload API] Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
