# AI Lighthouse API

Express backend API for AI Lighthouse scanner.

## Features

- ✅ Synchronous and asynchronous audit modes
- ✅ LLM integration support (Ollama)
- ✅ CORS enabled for frontend integration
- ✅ Job status tracking for long-running audits
- ✅ Comprehensive error handling

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

The API will run on `http://localhost:3001`

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

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## Frontend Integration

Update your Next.js app to call this API:

```typescript
const response = await fetch('http://localhost:3001/api/audit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' })
});
```
