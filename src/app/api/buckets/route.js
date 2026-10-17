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
        { error: 'Header Authorization com Bearer token é obrigatório.' },
        { status: 401 }
      );
    }

    try {
      await validateToken(token);
    } catch (err) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado', details: err?.message },
        { status: 401 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    let name = '';
    let description = null;
    let organizationName = '';
    let file = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = formData.get('name')?.toString() || '';
      description = formData.get('description')?.toString() || null;
      organizationName = formData.get('organization_name')?.toString() || '';

      const fileEntry = formData.get('file');
      if (fileEntry && typeof fileEntry === 'object' && 'arrayBuffer' in fileEntry) {
        file = fileEntry;
      }
    } else {
      let body = {};
      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          { error: 'Body inválido. Envie JSON ou multipart/form-data.' },
          { status: 400 }
        );
      }
      name = body.name || '';
      description = body.description ?? null;
      organizationName = body.organization_name || '';
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Campo "name" é obrigatório.' },
        { status: 400 }
      );
    }

    if (!organizationName || !organizationName.trim()) {
      return NextResponse.json(
        { error: 'Campo "organization_name" é obrigatório.' },
        { status: 400 }
      );
    }
    
    const { bucket, error } = await bucketService.createBucket(
      name.trim(),
      description,
      file || undefined,
      organizationName.trim()
    );

    if (error) {
      const isCreated = bucket && bucket.id;
      return NextResponse.json(
        { error, bucket: isCreated ? bucket : undefined },
        { status: isCreated ? 207 : 400 }
      );
    }

    return NextResponse.json({ bucket }, { status: 201 });
  } catch (err) {
    const message = err?.message || 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Falha ao criar bucket', details: message },
      { status: 500 }
    );
  }
}