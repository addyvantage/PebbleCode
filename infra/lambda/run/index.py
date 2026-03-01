import json
import os
import subprocess
import sys
import tempfile
import time

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
}

STDOUT_MAX_CHARS = 16_000
STDERR_MAX_CHARS = 16_000
TIMEOUT_MIN_MS = 100
TIMEOUT_MAX_MS = 15_000


def respond(status_code: int, body: dict) -> dict:
    # IMPORTANT: never return 403 or 404 — CloudFront's global error response
    # would intercept those and serve index.html instead of the JSON body.
    return {
        'statusCode': status_code,
        'headers': CORS_HEADERS,
        'body': json.dumps(body),
    }


def truncate(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + '\n...[output truncated]'


def handler(event, context):
    method = (
        event.get('requestContext', {})
        .get('http', {})
        .get('method', 'POST')
        .upper()
    )

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if method != 'POST':
        return respond(400, {'error': 'Method not allowed. Use POST.'})

    raw_body = event.get('body') or ''
    try:
        body = json.loads(raw_body) if raw_body else {}
    except json.JSONDecodeError:
        return respond(400, {'error': 'Invalid JSON body.'})

    language = body.get('language', '')
    code = body.get('code', '')
    stdin_data = body.get('stdin', '')
    timeout_ms = body.get('timeoutMs', 5000)

    if not isinstance(language, str) or not language:
        return respond(400, {'error': 'Field "language" must be a non-empty string.'})

    if not isinstance(code, str) or not code.strip():
        return respond(400, {'error': 'Field "code" must be a non-empty string.'})

    if not isinstance(timeout_ms, (int, float)) or not (TIMEOUT_MIN_MS <= timeout_ms <= TIMEOUT_MAX_MS):
        timeout_ms = 5000

    if language.lower() != 'python':
        return respond(200, {
            'ok': False,
            'status': 'toolchain_unavailable',
            'exitCode': None,
            'stdout': '',
            'stderr': 'Only Python is supported in this environment.',
            'timedOut': False,
            'durationMs': 0,
        })

    timeout_s = timeout_ms / 1000.0
    start_ms = time.time() * 1000

    with tempfile.TemporaryDirectory() as tmpdir:
        script_path = os.path.join(tmpdir, 'script.py')
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(code)

        try:
            result = subprocess.run(
                [sys.executable, script_path],
                input=stdin_data if isinstance(stdin_data, str) else '',
                capture_output=True,
                text=True,
                timeout=timeout_s,
                cwd=tmpdir,
            )
            duration_ms = int(time.time() * 1000 - start_ms)
            stdout = truncate(result.stdout, STDOUT_MAX_CHARS)
            stderr = truncate(result.stderr, STDERR_MAX_CHARS)
            ok = result.returncode == 0
            return respond(200, {
                'ok': ok,
                'status': 'success' if ok else 'runtime_error',
                'exitCode': result.returncode,
                'stdout': stdout,
                'stderr': stderr,
                'timedOut': False,
                'durationMs': duration_ms,
            })

        except subprocess.TimeoutExpired:
            duration_ms = int(time.time() * 1000 - start_ms)
            return respond(200, {
                'ok': False,
                'status': 'timeout',
                'exitCode': None,
                'stdout': '',
                'stderr': f'Execution timed out after {timeout_ms:.0f}ms.',
                'timedOut': True,
                'durationMs': duration_ms,
            })

        except Exception as exc:
            return respond(200, {
                'ok': False,
                'status': 'internal_error',
                'exitCode': None,
                'stdout': '',
                'stderr': f'Runner error: {str(exc)}',
                'timedOut': False,
                'durationMs': 0,
            })
