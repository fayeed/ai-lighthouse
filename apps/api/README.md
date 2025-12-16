# AI Lighthouse API

Express backend API for AI Lighthouse website auditing with enterprise-grade security.

## ✨ Features

### Core Functionality
- ✅ Synchronous and asynchronous audit modes
- ✅ LLM integration support (OpenRouter, OpenAI, Anthropic, Gemini, Ollama)
- ✅ Comprehensive website analysis (AI readiness, SEO, accessibility)
- ✅ Job status tracking for long-running audits

### 🔒 Security & Protection (NEW!)
- ✅ **Input validation** with Zod schemas
- ✅ **Structured logging** with Winston
- ✅ **Request timeout protection** (120s default)
- ✅ **Comprehensive health checks** (liveness, readiness)
- ✅ **Multi-tier rate limiting** (general + LLM-specific)
- ✅ **Abuse detection system** (pattern analysis, fingerprinting)
- ✅ **SSRF protection** (blocks internal IPs, metadata endpoints)
- ✅ **Graceful error handling** with detailed responses

### 🛡️ No Authentication Required
The API uses defense-in-depth security without requiring user sign-in:
- Rate limiting prevents abuse
- Behavioral pattern detection blocks malicious actors
- Input validation prevents injection attacks
- Request fingerprinting tracks suspicious activity

📖 See [SECURITY.md](./SECURITY.md) for detailed security documentation

## Prerequisites

- Node.js 18+
- Redis server (required for rate limiting and abuse detection)
- pnpm package manager

## Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions.

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env and configure REDIS_URL

# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Start development server
pnpm dev
```

The API will run on `http://localhost:3001`

## 📊 Health Monitoring

### Health Check Endpoints

- `GET /health` - Comprehensive health check (Redis, memory, API status)
- `GET /health/live` - Liveness probe (for container orchestration)
- `GET /health/ready` - Readiness probe (for load balancers)

Example:
```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-16T...",
  "uptime": 3600,
  "checks": {
    "redis": { "status": "up", "responseTime": 5 },
    "memory": { "status": "ok", "percentage": 45 },
    "api": { "status": "up", "version": "1.0.0" }
  }
}
```

## API Endpoints

### POST /api/audit

Start a new website audit.

**Request Body:**
```json
{
  "url": "https://example.com",
  "enableLLM": false,
  "llmProvider": "ollama",
  "llmModel": "qwen2.5:0.5b",
  "llmBaseUrl": "http://localhost:11434",
  "maxIssues": 20,
  "minImpactScore": 5,
  "async": false
}
```

**Synchronous Response (async: false):**
```json
{
  "success": true,
  "url": "https://example.com",
  "timestamp": "2025-12-08T...",
  "data": {
    "auditReport": {...},
    "aiReadiness": {...},
    "scanResult": {...}
  }
}
```

**Asynchronous Response (async: true):**
```json
{
  "jobId": "1234567890-abc123",
  "status": "started",
  "checkUrl": "/api/audit/1234567890-abc123"
}
```

### GET /api/audit/:jobId

Check the status of an asynchronous audit job.

**Response:**
```json
{
  "status": "completed",
  "progress": 100,
  "data": {...}
}
```

Status can be: `running`, `completed`, or `failed`.

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-08T..."
}
```

## Environment Variables

- `PORT` - Server port (default: 3002)
- `NODE_ENV` - Environment (development/production)
- `REDIS_URL` - Redis connection URL (default: redis://localhost:6379)
- `OPENROUTER_API_KEY` - API key for OpenRouter LLM provider (optional)

## Rate Limiting

The API implements two-tier rate limiting using Redis:

1. **General API Rate Limit**: 10 requests per 15 minutes per IP
2. **LLM-Enabled Rate Limit**: 5 requests per hour per IP (only when `enableLLM: true`)

Rate limit errors return HTTP 429 with retry information.

## Frontend Integration

Update your Next.js app to call this API:

```typescript
const response = await fetch('http://localhost:3001/api/audit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' })
});
```
