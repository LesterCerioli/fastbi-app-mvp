// /src/app/api/external_auth_api/route.js
import { NextResponse } from 'next/server';
import { externalAuthApiService } from '@/services/external_auth_api_service';

// Garante execução dinâmica (sem cache do Next.js)
export const dynamic = 'force-dynamic';

// Runtime Node.js — necessário para acesso a process.env server-side
export const runtime = 'nodejs';

/**
 * POST /api/external_auth_api
 *
 * BFF (Backend For Frontend): faz proxy server-side para o endpoint
 * POST /api/v1/auth/token da API Go, evitando expor CLIENT_ID e SECRET
 * ao browser.
 *
 * O serviço `externalAuthApiService` cuida de:
 *  - Cache em memória do token (TTL derivado de `expires_at`).
 *  - Deduplicação de chamadas concorrentes (single-flight).
 *  - Renovação proativa antes de expirar.
 *  - Contrato fiel ao docs.go (201, { token, client_id, expires_at }).
 */
export async function POST() {
  try {
    const tokenData = await externalAuthApiService.getToken();

    return NextResponse.json(
      {
        success: true,
        // Campos fiéis ao controllers.TokenResponse do docs.go
        token: tokenData.token,
        client_id: tokenData.client_id,
        expires_at: tokenData.expires_at,
      },
      {
        status: 200,
        headers: {
          // Nunca cachear token no browser, CDN ou proxies intermediários
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('[external_auth_api] Erro ao obter token:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Falha ao obter token da API externa.',
        // Em produção, evite expor detalhes do erro
        ...(process.env.NODE_ENV !== 'production' && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 502 }
    );
  }
}

/**
 * PUT /api/external_auth_api
 *
 * Força a renovação do token ignorando o cache em memória.
 * Útil quando a API Go retorna 401 (token revogado no servidor).
 */
export async function PUT() {
  try {
    const tokenData = await externalAuthApiService.refreshToken();

    return NextResponse.json(
      {
        success: true,
        token: tokenData.token,
        client_id: tokenData.client_id,
        expires_at: tokenData.expires_at,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('[external_auth_api] Erro ao renovar token:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Falha ao renovar token da API externa.',
        ...(process.env.NODE_ENV !== 'production' && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 502 }
    );
  }
}

/**
 * GET /api/external_auth_api
 * Método não permitido para este recurso.
 */
export async function GET() {
  return NextResponse.json(
    { message: 'Use POST para obter um token, PUT para forçar renovação.' },
    { status: 405, headers: { Allow: 'POST, PUT' } }
  );
}