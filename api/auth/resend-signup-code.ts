import { CognitoIdentityProviderClient, ResendConfirmationCodeCommand } from '@aws-sdk/client-cognito-identity-provider'
import { COGNITO_CLIENT_ID, createSecretHash, normalizeEmail, resolveCognitoRegion } from '../_shared/auth.js'

export const config = {
  runtime: 'nodejs',
  maxDuration: 10,
}

type ApiRequest = {
  method?: string
  body?: {
    email?: unknown
  }
}

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => void }
  setHeader?: (name: string, value: string) => void
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST')
    res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' })
    return
  }

  const normalizedEmail = normalizeEmail(req.body?.email)
  if (!normalizedEmail) {
    res.status(400).json({ error: 'Email is required' })
    return
  }

  const awsRegion = resolveCognitoRegion()
  if (!awsRegion || !COGNITO_CLIENT_ID) {
    res.status(500).json({
      error: 'Verification resend is not configured. Set COGNITO_CLIENT_ID and AWS_REGION (or COGNITO_USER_POOL_ID).',
      code: 'AuthNotConfigured',
    })
    return
  }

  try {
    const cognito = new CognitoIdentityProviderClient({ region: awsRegion })
    const secretHash = createSecretHash(normalizedEmail)
    await cognito.send(new ResendConfirmationCodeCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: normalizedEmail,
      ...(secretHash ? { SecretHash: secretHash } : {}),
    }))
    res.status(200).json({ ok: true })
  } catch (error) {
    const err = error as { name?: string; message?: string }
    res.status(400).json({
      error: err?.message ?? 'Failed to resend code',
      code: err?.name ?? 'ResendFailed',
    })
  }
}
