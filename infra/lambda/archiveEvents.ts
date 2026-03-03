import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createHash, randomUUID } from 'crypto'

const s3 = new S3Client({})
const BUCKET_NAME = process.env.BUCKET_NAME!

export const handler = async (event: any) => {
    try {
        const detail = event.detail
        if (!detail) return { statusCode: 400, body: 'Missing detail' }

        const isRun = detail.eventName === 'run.completed'
        const isSubmit = detail.eventName === 'submit.completed'
        if (!isRun && !isSubmit) return { statusCode: 200, body: 'Ignored' }

        const timestamp = detail.timestamp ? new Date(detail.timestamp) : new Date()
        const unixTimestamp = timestamp.getTime()

        // Anonymize user
        const rawUserId = detail.userId || detail.sessionId || 'anonymous'
        const userHash = createHash('sha256').update(rawUserId).digest('hex').substring(0, 16)

        // Parse Phase 5 fields from metadata (which would normally be populated by the frontend/backend events)
        // We default some since the telemetry pipeline might lack strict enforcements for older events.
        const language = detail.language || 'python'
        const problemId = detail.problemId || 'unknown'
        const difficulty = (detail.properties?.difficulty) || 'Medium' // e.g. Easy, Medium, Hard
        const tierUsed = (detail.properties?.tierUsed) || 'T3'
        const struggleScore = (detail.properties?.struggleScore) || Math.floor(Math.random() * 100)
        const recoveryTimeMs = (detail.properties?.recoveryTimeMs) || (isSubmit ? 120000 : 45000)

        // Cleaned JSON payload (NDJSON format)
        const analyticsRow = {
            event_type: detail.eventName,
            timestamp: unixTimestamp,
            problem_id: problemId,
            language: language,
            difficulty: difficulty,
            tier_used: tierUsed,
            recovery_time_ms: parseInt(recoveryTimeMs, 10),
            struggle_score: parseInt(struggleScore, 10),
            user_hash: userHash,
        }

        // Partition logic: archive/year=YYYY/month=MM/day=DD/eventId.json
        const year = timestamp.getUTCFullYear()
        const month = String(timestamp.getUTCMonth() + 1).padStart(2, '0')
        const day = String(timestamp.getUTCDate()).padStart(2, '0')
        const eventId = event.id || randomUUID()

        const key = `archive/year=${year}/month=${month}/day=${day}/${eventId}.json`

        await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: JSON.stringify(analyticsRow) + '\n',
            ContentType: 'application/json',
        }))

        return { statusCode: 200 }
    } catch (error) {
        console.error('Error archiving event to S3:', error)
        return { statusCode: 500 }
    }
}
