/**
 * Profile Lambda — handles three routes:
 *
 *   GET  /api/profile        read (or auto-create) the caller's profile
 *   PUT  /api/profile        update username / bio / avatarKey
 *   POST /api/avatar/presign return a presigned S3 PUT URL for direct upload
 *
 * IMPORTANT: never return HTTP 403 or 404 — CloudFront's global error
 * responses remap those to 200 + index.html, so the client would receive
 * HTML instead of JSON. Use 401 for auth errors, 400 for bad input, 200
 * with an error body or 500 for unexpected failures.
 */

import {
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'

const REGION = process.env.AWS_REGION ?? 'ap-south-1'
const PROFILES_TABLE = process.env.PROFILES_TABLE_NAME ?? 'pebble-profiles'
const AVATARS_BUCKET = process.env.AVATARS_BUCKET_NAME ?? ''
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map(e => e.trim()).filter(Boolean)

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
const s3 = new S3Client({ region: REGION })

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
  'Content-Type': 'application/json',
}

function respond(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  // IMPORTANT: never return 403 or 404 — CloudFront remaps those to index.html.
  const safe = statusCode === 403 ? 401 : statusCode === 404 ? 200 : statusCode
  return { statusCode: safe, headers: CORS_HEADERS, body: JSON.stringify(body) }
}

// ── JWT helpers ──────────────────────────────────────────────────────────────

interface Identity { userId: string; email: string }

function extractIdentity(event: APIGatewayProxyEventV2): Identity | null {
  const auth = event.headers?.authorization ?? event.headers?.Authorization ?? ''
  if (!auth.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    ) as Record<string, unknown>
    const userId = payload['sub'] as string | undefined
    if (!userId) return null
    const email = (payload['email'] ?? payload['cognito:username'] ?? '') as string
    return { userId, email }
  } catch {
    return null
  }
}

// ── DynamoDB helpers ─────────────────────────────────────────────────────────

type ProfileItem = Record<string, unknown>

async function getOrCreateProfile(identity: Identity): Promise<ProfileItem> {
  const result = await ddb.send(new GetCommand({
    TableName: PROFILES_TABLE,
    Key: { userId: identity.userId },
  }))

  if (result.Item) return result.Item

  // Auto-create on first access
  const now = new Date().toISOString()
  const newProfile: ProfileItem = {
    userId: identity.userId,
    username: identity.email.split('@')[0],
    email: identity.email,
    bio: '',
    avatarUrl: null,
    avatarKey: null,
    role: ADMIN_EMAILS.includes(identity.email) ? 'admin' : 'user',
    createdAt: now,
    updatedAt: now,
  }
  await ddb.send(new PutCommand({ TableName: PROFILES_TABLE, Item: newProfile }))
  return newProfile
}

async function withAvatarUrl(item: ProfileItem): Promise<ProfileItem> {
  const key = item['avatarKey'] as string | null | undefined
  if (!key || !AVATARS_BUCKET) return item
  try {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: AVATARS_BUCKET, Key: key }),
      { expiresIn: 3600 },
    )
    return { ...item, avatarUrl: url }
  } catch {
    return item // non-fatal
  }
}

// ── Route handlers ───────────────────────────────────────────────────────────

async function handleGetProfile(identity: Identity): Promise<APIGatewayProxyResultV2> {
  const item = await getOrCreateProfile(identity)
  const withUrl = await withAvatarUrl(item)
  return respond(200, withUrl)
}

async function handlePutProfile(
  identity: Identity,
  body: string | null,
): Promise<APIGatewayProxyResultV2> {
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(body ?? '{}') as Record<string, unknown>
  } catch {
    return respond(400, { error: 'Invalid JSON body' })
  }

  const { username, bio, avatarKey } = parsed

  if (username !== undefined) {
    if (
      typeof username !== 'string' ||
      username.length < 3 ||
      username.length > 20 ||
      !/^[a-zA-Z0-9_]+$/.test(username)
    ) {
      return respond(400, { error: 'Username must be 3–20 chars, alphanumeric + underscore' })
    }
  }
  if (bio !== undefined && (typeof bio !== 'string' || bio.length > 160)) {
    return respond(400, { error: 'Bio must be 160 chars or less' })
  }

  const now = new Date().toISOString()
  const expressionParts: string[] = ['#updatedAt = :updatedAt']
  const names: Record<string, string> = { '#updatedAt': 'updatedAt' }
  const values: Record<string, unknown> = { ':updatedAt': now }

  if (username !== undefined) {
    expressionParts.push('#username = :username')
    names['#username'] = 'username'
    values[':username'] = username
  }
  if (bio !== undefined) {
    expressionParts.push('#bio = :bio')
    names['#bio'] = 'bio'
    values[':bio'] = bio
  }
  if (avatarKey !== undefined) {
    expressionParts.push('#avatarKey = :avatarKey')
    names['#avatarKey'] = 'avatarKey'
    values[':avatarKey'] = avatarKey
  }

  await ddb.send(new UpdateCommand({
    TableName: PROFILES_TABLE,
    Key: { userId: identity.userId },
    UpdateExpression: `SET ${expressionParts.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }))

  return respond(200, { ok: true })
}

async function handleAvatarPresign(
  identity: Identity,
  body: string | null,
): Promise<APIGatewayProxyResultV2> {
  if (!AVATARS_BUCKET) {
    return respond(500, { error: 'Avatar storage not configured (AVATARS_BUCKET_NAME missing)' })
  }

  let parsed: Record<string, unknown> = {}
  try { parsed = JSON.parse(body ?? '{}') as Record<string, unknown> } catch { /* ignore */ }

  const ext = ((parsed['fileExtension'] as string | undefined) ?? 'jpg').replace(/^\./, '')
  const key = `avatars/${identity.userId}/${Date.now()}.${ext}`

  // ContentType is intentionally NOT included in PutObjectCommand.
  // Including it locks the presigned-URL signature to that exact MIME value;
  // if the browser sends a slightly different Content-Type the PUT gets a
  // 403 SignatureDoesNotMatch. Omitting it lets S3 accept any Content-Type.
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: AVATARS_BUCKET, Key: key }),
    { expiresIn: 300 },
  )

  return respond(200, { uploadUrl, key })
}

// ── Main handler ─────────────────────────────────────────────────────────────

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method.toUpperCase()
  const path = event.requestContext.http.path

  // CORS preflight
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' }
  }

  const identity = extractIdentity(event)
  if (!identity) return respond(401, { error: 'Unauthorized' })

  try {
    if (method === 'GET' && path === '/api/profile') {
      return await handleGetProfile(identity)
    }
    if (method === 'PUT' && path === '/api/profile') {
      return await handlePutProfile(identity, event.body ?? null)
    }
    if (method === 'POST' && path === '/api/avatar/presign') {
      return await handleAvatarPresign(identity, event.body ?? null)
    }
    // No matching route — return 200 with error (NOT 404, see note above)
    return respond(200, { error: `No handler for ${method} ${path}` })
  } catch (err) {
    console.error('[profile-lambda] Unhandled error:', err)
    return respond(500, { error: 'Internal server error' })
  }
}
