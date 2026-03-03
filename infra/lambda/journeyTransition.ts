import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE_NAME = process.env.TABLE_NAME!

// Phase order for progression
const PHASE_ORDER = [
    'START_SESSION',
    'WARM_UP',
    'PRACTICE_BLOCK',
    'CHALLENGE_PROBLEM',
    'RECOVERY_PHASE',
    'REFLECTION',
    'COMPLETE',
]

function nextPhase(current: string): string {
    const idx = PHASE_ORDER.indexOf(current)
    return idx >= 0 && idx < PHASE_ORDER.length - 1
        ? PHASE_ORDER[idx + 1]
        : 'COMPLETE'
}

function recommendDifficulty(autonomyScore: number, struggleScore: number): string {
    if (autonomyScore >= 80 && struggleScore < 30) return 'Hard'
    if (autonomyScore >= 50 && struggleScore < 60) return 'Medium'
    return 'Easy'
}

function evaluateTransition(input: {
    currentPhase: string
    recoveryTimeMs: number
    struggleScore: number
    autonomyScore: number
    prevRecoveryTimeMs?: number
    prevStruggleScore?: number
}): { shouldAdvance: boolean; newPhase: string } {
    const { currentPhase, recoveryTimeMs, struggleScore, autonomyScore, prevRecoveryTimeMs, prevStruggleScore } = input

    // Always advance from START_SESSION and WARM_UP
    if (currentPhase === 'START_SESSION' || currentPhase === 'WARM_UP') {
        return { shouldAdvance: true, newPhase: nextPhase(currentPhase) }
    }

    // Recovery phase: advance only when recovery time improves
    if (currentPhase === 'RECOVERY_PHASE') {
        const recovered = prevRecoveryTimeMs !== undefined && recoveryTimeMs < prevRecoveryTimeMs * 0.85
        return { shouldAdvance: recovered, newPhase: recovered ? nextPhase(currentPhase) : currentPhase }
    }

    // Practice/Challenge: advance when autonomy improves and struggle drops
    const autonomyImproved = autonomyScore >= 60
    const struggleResolved = prevStruggleScore !== undefined
        ? struggleScore < prevStruggleScore * 0.8
        : struggleScore < 50

    const advance = autonomyImproved && struggleResolved
    return { shouldAdvance: advance, newPhase: advance ? nextPhase(currentPhase) : currentPhase }
}

export const handler = async (event: any) => {
    const {
        userId = 'anonymous',
        journeyId = 'default',
        problemId,
        recoveryTimeMs = 120000,
        struggleScore = 50,
        autonomyScore = 50,
    } = event

    // Fetch existing journey state
    const existing = await client.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { userId, journeyId },
    }))

    const item = existing.Item
    const currentPhase = item?.currentPhase ?? 'START_SESSION'
    const prevRecoveryTimeMs = item?.recoveryTimeMs
    const prevStruggleScore = item?.struggleScore

    const { shouldAdvance, newPhase } = evaluateTransition({
        currentPhase,
        recoveryTimeMs,
        struggleScore,
        autonomyScore,
        prevRecoveryTimeMs,
        prevStruggleScore,
    })

    const updatedPhase = shouldAdvance ? newPhase : currentPhase
    const recommendedNextDifficulty = recommendDifficulty(autonomyScore, struggleScore)
    const journeyConfidence = Math.min(100, Math.round(autonomyScore * 0.6 + (100 - struggleScore) * 0.4))

    await client.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            userId,
            journeyId,
            currentPhase: updatedPhase,
            lastTransitionAt: new Date().toISOString(),
            lastProblemId: problemId ?? item?.lastProblemId,
            autonomyScore,
            struggleScore,
            recoveryTimeMs,
            recommendedNextDifficulty,
            journeyConfidence,
            streakImpact: shouldAdvance ? 1 : 0,
            ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
        },
    }))

    return {
        currentPhase: updatedPhase,
        previousPhase: currentPhase,
        didAdvance: shouldAdvance,
        recommendedNextDifficulty,
        journeyConfidence,
        userId,
        journeyId,
    }
}
