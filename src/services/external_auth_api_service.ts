
interface GenerateTokenRequest {
  client_id: string;
  secret: string;
}


interface TokenResponse {
  client_id: string;
  
  expires_at: string;
  
  token: string;
}


interface ApiErrorResponse {
  error: string;
  details?: string;
}


import { validateClientCredentials, buildTokenRequest } from './credentials';

interface CachedToken {
  token: string;
  
  expires_at_ms: number;
}


const EXPIRATION_SAFETY_MARGIN_RATIO = 0.1;
const EXPIRATION_SAFETY_MARGIN_MIN_MS = 5_000; // 5 s
const EXPIRATION_SAFETY_MARGIN_MAX_MS = 30_000; // 30 s

const API_BASE_PATH = '/api/v1';


export class ExternalAuthApiService {
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly secret: string;
  
  private cachedToken: CachedToken | null = null;
  
  private inFlightTokenPromise: Promise<CachedToken> | null = null;

  constructor() {
    const baseUrl = process.env.EXTERNAL_GO_API_BASE_URL;
    const clientId = process.env.CLIENT_ID_1;
    const secret = process.env.SECRET_1;

    if (!baseUrl || !clientId || !secret) {
      throw new Error(
        'Variáveis de ambiente obrigatórias não configuradas: ' +
          'EXTERNAL_GO_API_BASE_URL, CLIENT_ID_1, SECRET_1'
      );
    }
    
    this.baseUrl = `${baseUrl.replace(/\/$/, '')}${API_BASE_PATH}`;
    this.clientId = clientId;
    this.secret = secret;
    
    const credentials = validateClientCredentials(this.clientId, this.secret);
    
    this.clientId = credentials.clientId;
    this.secret = credentials.secret;
  }
 

  private buildTokenRequest(): GenerateTokenRequest {
    return buildTokenRequest({
      clientId: this.clientId,
      secret: this.secret,
    });
  }

  private isCachedTokenValid(token: CachedToken | null): boolean {
    if (!token) return false;
    return Date.now() < token.expires_at_ms;
  }

  
  private calculateSafetyMarginMs(ttlMs: number): number {
    const proportional = Math.floor(ttlMs * EXPIRATION_SAFETY_MARGIN_RATIO);
    return Math.min(
      EXPIRATION_SAFETY_MARGIN_MAX_MS,
      Math.max(EXPIRATION_SAFETY_MARGIN_MIN_MS, proportional)
    );
  }

  
  private toTokenResponse(token: CachedToken): TokenResponse {
    return {
      client_id: this.clientId,
      token: token.token,
      expires_at: new Date(token.expires_at_ms).toISOString(),
    };
  }

  
  async getToken(): Promise<TokenResponse> {
    
    if (this.isCachedTokenValid(this.cachedToken)) {
      return this.toTokenResponse(this.cachedToken!);
    }
    
    if (this.inFlightTokenPromise) {
      const token = await this.inFlightTokenPromise;
      return this.toTokenResponse(token);
    }

    
    this.inFlightTokenPromise = this.fetchAndCacheToken();

    try {
      const token = await this.inFlightTokenPromise;
      return this.toTokenResponse(token);
    } finally {
      
      this.inFlightTokenPromise = null;
    }
  }

  
  async refreshToken(): Promise<TokenResponse> {
    this.cachedToken = null;
    return this.getToken();
  }
 

  private async fetchAndCacheToken(): Promise<CachedToken> {
    const url = `${this.baseUrl}/auth/token`;
    const payload: GenerateTokenRequest = this.buildTokenRequest();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    
    if (response.status !== 201) {
      let errorData: ApiErrorResponse | null = null;
      try {
        errorData = await response.json();
      } catch {
        /* resposta não é JSON */
      }

      throw new Error(
        `Falha ao obter token da API Go (${response.status}): ${
          errorData?.details || errorData?.error || response.statusText
        }`
      );
    }

    const data = (await response.json()) as TokenResponse;

    if (!data.token) {
      throw new Error('Resposta da API Go não contém o campo "token".');
    }
    if (!data.expires_at) {
      throw new Error('Resposta da API Go não contém o campo "expires_at".');
    }

    const expiresAtMs = Date.parse(data.expires_at);
    if (Number.isNaN(expiresAtMs)) {
      throw new Error(
        `Resposta da API Go contém "expires_at" inválido: ${data.expires_at}`
      );
    }

    const now = Date.now();
    const ttlMs = Math.max(0, expiresAtMs - now);
    const marginMs = this.calculateSafetyMarginMs(ttlMs);

    const cached: CachedToken = {
      token: data.token,
      expires_at_ms: now + Math.max(0, ttlMs - marginMs),
    };

    this.cachedToken = cached;
    return cached;
  }
}

export const externalAuthApiService = new ExternalAuthApiService();