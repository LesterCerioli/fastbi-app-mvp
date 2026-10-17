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

export async function PATCH(request) {
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
    const newName =
      body.new_name !== undefined ? body.new_name.toString() : undefined;
    const newDescription =
      body.new_description !== undefined ? body.new_description : undefined;

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
    if (
      (newName === undefined || newName.trim() === '') &&
      newDescription === undefined
    ) {
      return NextResponse.json(
        { error: 'Informe "new_name" ou "new_description" para atualizar.' },
        { status: 400 }
      );
    }

    const { bucket, error } = await bucketService.updateBucketByName(
      organizationName,
      name,
      newName,
      newDescription
    );

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ bucket }, { status: 200 });
  } catch (err) {
    const message = err?.message || 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Falha ao atualizar bucket', details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
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

    const { bucket, error } = await bucketService.deleteBucketByName(
      organizationName,
      name
    );

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ bucket }, { status: 200 });
  } catch (err) {
    const message = err?.message || 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Falha ao deletar bucket', details: message },
      { status: 500 }
    );
  }
}