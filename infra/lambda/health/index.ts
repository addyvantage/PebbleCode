import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Content-Type': 'application/json',
}

export const handler = async (_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      ok: true,
      ts: new Date().toISOString(),
      region: process.env.AWS_REGION ?? 'unknown',
      runtime: 'nodejs',
    }),
  }
}
