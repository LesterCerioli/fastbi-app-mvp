import { NextResponse } from 'next/server';
import { bucketService } from '@/services/buckets/bucket_service';
import { validateToken } from '@/services/auth_service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extractBearerToken(request) {
  const authHeader = request.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}


export async function POST(request) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Header Authorization with Bearer token is required.' },
        { status: 401 }
      );
    }
    try {
      await validateToken(token);
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid token or expired', details: err?.message },
        { status: 401 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Send multipart/form-data.' }, { status: 400 });
    }

    const formData = await request.formData();
    const organizationName = formData.get('organization_name')?.toString() || '';
    const name = formData.get('name')?.toString() || '';

    const fileEntry = formData.get('file');
    let file = null;
    if (fileEntry && typeof fileEntry === 'object' && 'arrayBuffer' in fileEntry) {
      file = fileEntry;
    }

    if (!organizationName.trim()) {
      return NextResponse.json({ error: 'Field "organization_name" is required.' }, { status: 400 });
    }
    if (!name.trim()) {
      return NextResponse.json({ error: 'Field "name" is required.' }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: 'Field "file" is required.' }, { status: 400 });
    }

    const { bucket, error } = await bucketService.uploadFileToBucketByName(
      organizationName.trim(),
      name.trim(),
      file
    );

    if (error) {
      const hasBucket = bucket && bucket.id;
      return NextResponse.json(
        { error, bucket: hasBucket ? bucket : undefined },
        { status: hasBucket ? 207 : 400 }
      );
    }

    return NextResponse.json({ bucket }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to upload', details: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}