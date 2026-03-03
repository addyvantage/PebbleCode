import { SignatureV4 } from '@aws-sdk/signature-v4'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { Sha256 } from '@aws-crypto/sha256-js'

const APPSYNC_ENDPOINT = process.env.APPSYNC_ENDPOINT!
const REGION = process.env.REGION!

const GRAPHQL_QUERY = `
mutation PublishMentalStateUpdate(
  $userId: ID!
  $timestamp: String!
  $recoveryEffectiveness: Float
  $timeToRecover: Float
  $autonomyDelta: Float
  $guidanceRelianceDelta: Float
  $breakpointIncrement: Int
  $streakDelta: Int
) {
  publishMentalStateUpdate(
    userId: $userId
    timestamp: $timestamp
    recoveryEffectiveness: $recoveryEffectiveness
    timeToRecover: $timeToRecover
    autonomyDelta: $autonomyDelta
    guidanceRelianceDelta: $guidanceRelianceDelta
    breakpointIncrement: $breakpointIncrement
    streakDelta: $streakDelta
  ) {
    userId
    timestamp
    recoveryEffectiveness
    timeToRecover
    autonomyDelta
    guidanceRelianceDelta
    breakpointIncrement
    streakDelta
  }
}
`

export const handler = async (event: any) => {
    for (const record of event.Records) {
        if (record.eventName !== 'INSERT') continue

        const newImage = record.dynamodb.NewImage
        if (!newImage) continue

        // Extract raw types from DDB Stream format
        const variables = {
            userId: newImage.userId?.S,
            timestamp: newImage.timestamp?.S,
            recoveryEffectiveness: parseFloat(newImage.recoveryEffectiveness?.N || '0'),
            timeToRecover: parseFloat(newImage.timeToRecover?.N || '0'),
            autonomyDelta: parseFloat(newImage.autonomyDelta?.N || '0'),
            guidanceRelianceDelta: parseFloat(newImage.guidanceRelianceDelta?.N || '0'),
            breakpointIncrement: parseInt(newImage.breakpointIncrement?.N || '0', 10),
            streakDelta: parseInt(newImage.streakDelta?.N || '0', 10),
        }

        if (!variables.userId || !variables.timestamp) continue

        const url = new URL(APPSYNC_ENDPOINT)
        const request = new Request(url.href, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'host': url.hostname,
            },
            body: JSON.stringify({
                query: GRAPHQL_QUERY,
                variables,
            }),
        })

        const signer = new SignatureV4({
            credentials: defaultProvider(),
            region: REGION,
            service: 'appsync',
            sha256: Sha256,
        })

        try {
            const signedRequest = await signer.sign(request)
            const res = await fetch(signedRequest)
            const resBody = await res.text()
            if (!res.ok) {
                console.error('AppSync publish failed:', res.status, resBody)
            } else {
                console.log('AppSync publish success:', resBody)
            }
        } catch (err) {
            console.error('Error signing/sending AppSync request:', err)
        }
    }
}
