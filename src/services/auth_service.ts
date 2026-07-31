import { Pool } from 'pg'
import jwt from 'jsonwebtoken'

let _pool: Pool | null = null

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    })
  }
  return _pool
}

function getClientCredentials(): Record<string, string> {
  const clientId = process.env.CLIENT_ID_1
  const secret = process.env.SECRET_1

  if (!clientId || !secret) {
    throw new Error('CLIENT_ID_1 and SECRET_1 must be set in environment')
  }

  return { [clientId]: secret }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters')
  }
  return secret
}

export async function generateToken(
  clientId: string,
  clientSecret: string,
): Promise<{ token: string; client_id: string; client_secret: string }> {
  const clientCredentials = getClientCredentials()
  const jwtSecret = getJwtSecret()

  const storedSecret = clientCredentials[clientId]
  if (!storedSecret || storedSecret !== clientSecret) {
    throw new Error('invalid client_id or secret')
  }

  const expiration = Math.floor(Date.now() / 1000) + 120

  const tokenString = jwt.sign(
    {
      client_id: clientId,
      exp: expiration,
    },
    jwtSecret,
    { algorithm: 'HS256' },
  )

  const result = await getPool().query(
    `INSERT INTO public.auth_tokens (client_id, jwt_token, expires_at) VALUES ($1, $2, TO_TIMESTAMP($3))`,
    [clientId, tokenString, expiration],
  )
  if (result.rowCount === 0) {
    throw new Error('failed to persist token')
  }

  return { token: tokenString, client_id: clientId, client_secret: clientSecret }
}

export async function validateToken(tokenString: string): Promise<void> {
  const jwtSecret = getJwtSecret()

  const result = await getPool().query(
    `SELECT EXISTS (SELECT 1 FROM public.auth_tokens WHERE jwt_token = $1 AND expires_at > NOW()) AS exists`,
    [tokenString],
  )

  if (!result.rows[0]?.exists) {
    throw new Error('token not found or expired')
  }

  const decoded = jwt.verify(tokenString, jwtSecret, { algorithms: ['HS256'] })
  if (!decoded || typeof decoded === 'string') {
    throw new Error('invalid token')
  }
}

export async function getValidToken(clientId: string): Promise<string | null> {
  const result = await getPool().query(
    `SELECT jwt_token FROM public.auth_tokens WHERE client_id = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
    [clientId],
  )

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0].jwt_token
}