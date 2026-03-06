import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { PROFILES_TABLE, normalizeUsername, resolveCognitoRegion, usernameClaimKey } from '../_shared/auth.js'

export const config = {
  runtime: 'nodejs',
  maxDuration: 10,
}

type ApiRequest = {
  method?: string
  query?: {
    username?: unknown
  }
}

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => void }
  setHeader?: (name: string, value: string) => void
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method && req.method !== 'GET') {
    res.setHeader?.('Allow', 'GET')
    res.status(405).json({ ok: false, error: 'Method not allowed. Use GET.' })
    return
  }

  const normalized = normalizeUsername(req.query?.username)
  if (!normalized) {
    res.status(200).json({ available: false, reason: 'invalid' })
    return
  }

  const awsRegion = resolveCognitoRegion()
  if (!awsRegion) {
    res.status(500).json({
      error: 'Username availability is not configured.',
      code: 'AuthNotConfigured',
    })
    return
  }

  try {
    const usernameLower = normalized.toLowerCase()
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: awsRegion }))
    const claim = await ddb.send(new GetCommand({
      TableName: PROFILES_TABLE,
      Key: { userId: usernameClaimKey(usernameLower) },
    }))
    const available = !claim.Item
    res.status(200).json({ available, ...(available ? {} : { reason: 'taken' }) })
  } catch (error) {
    const err = error as { message?: string }
    res.status(500).json({
      error: err?.message ?? 'Failed to check username availability',
      code: 'UsernameAvailabilityFailed',
    })
  }
}
