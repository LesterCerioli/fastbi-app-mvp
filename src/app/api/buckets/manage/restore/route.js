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

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const organizationName =
      searchParams.get('organization_name') || searchParams.get('org') || '';

    if (!organizationName || !organizationName.trim()) {
      return NextResponse.json(
        { error: 'Query param "organization_name" é obrigatório.' },
        { status: 400 }
      );
    }

    const buckets = await bucketService.listDeletedBucketsByOrganizationName(
      organizationName.trim()
    );

    return NextResponse.json({ buckets }, { status: 200 });
  } catch (err) {
    const message = err?.message || 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Falha ao listar buckets deletados', details: message },
      { status: 500 }
    );
  }
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

    let body = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Body inválido. Envie JSON.' },
        { status: 400 }
      );
    }

    const organizationName = (body.organization_name || '').toString();
    const name = (body.name || '').toString();

    if (!organizationName.trim()) {
      return NextResponse.json(
        { error: 'Campo "organization_name" é obrigatório.' },
        { status: 400 }
      );
    }
    if (!name.trim()) {
      return NextResponse.json(
        { error: 'Campo "name" é obrigatório.' },
        { status: 400 }
      );
    }

    const { bucket, error } = await bucketService.restoreBucketByName(
      organizationName.trim(),
      name.trim()
    );

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ bucket }, { status: 200 });
  } catch (err) {
    const message = err?.message || 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Falha ao restaurar bucket', details: message },
      { status: 500 }
    );
  }
}