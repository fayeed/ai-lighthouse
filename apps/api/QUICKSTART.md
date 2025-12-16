# Quick Start Guide - API Security Features

## 🚀 Getting Started

### 1. Install Dependencies (Already Done)
```bash
cd apps/api
pnpm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
```

Edit `.env` and configure:
```bash
# Required
REDIS_URL=redis://localhost:6379

# Optional (for LLM features)
OPENROUTER_API_KEY=your-key-here

# Optional (customize security)
LOG_LEVEL=info
REQUEST_TIMEOUT_MS=120000
CORS_ORIGIN=http://localhost:3000
```

### 3. Start Redis (Required)
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or using local Redis
redis-server
```

### 4. Start the API Server
```bash
pnpm dev
```

You should see:
```
✓ Connected to Redis
✓ AI Lighthouse API started
  Port: 3001
  Environment: development
  Endpoints:
    - Health: http://localhost:3001/health
    - Audit: http://localhost:3001/api/audit
```

## 🧪 Testing the Features

### Test Health Checks
```bash
# Full health check
curl http://localhost:3001/health

# Liveness probe
curl http://localhost:3001/health/live

# Readiness probe
curl http://localhost:3001/health/ready
```

### Test Input Validation
```bash
# Valid request
curl -X POST http://localhost:3001/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Invalid URL (should fail)
curl -X POST http://localhost:3001/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "not-a-url"}'

# Blocked localhost (should fail)
curl -X POST http://localhost:3001/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:3000"}'
```

### Test Rate Limiting
```bash
# Run this script to hit rate limit
for i in {1..12}; do
  echo "Request $i"
  curl -X POST http://localhost:3001/api/audit \
    -H "Content-Type: application/json" \
    -d '{"url": "https://example.com"}'
  echo ""
done
# Should get 429 after 10 requests
```

### Test Abuse Detection
```bash
# Rapid-fire requests (trigger abuse detection)
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/audit \
    -H "Content-Type: application/json" \
    -d '{"url": "https://example.com"}' &
done
wait
# Should trigger suspicious activity warning
```

## 📋 Monitoring Logs

Logs are written to:
- **Console**: Real-time colorized output
- `logs/combined.log`: All logs in JSON format
- `logs/error.log`: Errors only

### View Logs
```bash
# Real-time console logs (already visible when running)
pnpm dev

# Tail combined logs
tail -f logs/combined.log | jq

# View error logs
cat logs/error.log | jq

# Search for security events
grep "security" logs/combined.log | jq

# Search for rate limits
grep "rate_limit" logs/combined.log | jq
```

## 🔍 Understanding Responses

### Successful Response (200)
```json
{
  "success": true,
  "url": "https://example.com",
  "timestamp": "2025-12-16T10:30:00.000Z",
  "data": {
    "auditReport": { ... },
    "aiReadiness": { ... }
  }
}
```

### Validation Error (400)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "url",
      "message": "Invalid URL format"
    }
  ]
}
```

### Rate Limited (429)
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 15 minutes.",
  "retryAfter": 900
}
```

### Abuse Detected (429)
```json
{
  "error": "Too many requests",
  "message": "Unusual activity detected. Please try again later.",
  "retryAfter": 3600
}
```

### Timeout (408)
```json
{
  "error": "Request timeout",
  "message": "The request took too long to process. Please try again."
}
```

## 🔧 Common Issues & Solutions

### Redis Connection Failed
```
Error: Redis Client Error
```
**Solution**: Make sure Redis is running
```bash
docker run -d -p 6379:6379 redis:alpine
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution**: Change port in `.env`
```bash
PORT=3002
```

### TypeScript Errors from Scanner Package
These are pre-existing and don't affect runtime since we use `tsx`.
The API code itself is properly typed.

## 📊 Checking Security Status

### View Active Rate Limits
```bash
# Connect to Redis
redis-cli

# List rate limit keys
KEYS rl:*

# Check specific IP's rate limit
GET rl:general:127.0.0.1
GET rl:llm:127.0.0.1

# Check abuse tracking
KEYS abuse:*
GET abuse:127.0.0.1:*
```

### Monitor Memory Usage
```bash
curl http://localhost:3001/health | jq '.checks.memory'
```

### Check Redis Health
```bash
curl http://localhost:3001/health | jq '.checks.redis'
```

## 🎯 Integration with Frontend

Update your web app's environment:
```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

The web app will now use the protected API with all security features.

## 📈 Production Deployment

When deploying to production:

1. **Set production environment**
   ```bash
   NODE_ENV=production
   ```

2. **Configure CORS** (restrict origins)
   ```bash
   CORS_ORIGIN=https://yourdomain.com
   ```

3. **Set up Redis** (use managed service)
   ```bash
   REDIS_URL=redis://your-redis-server:6379
   ```

4. **Adjust rate limits** (based on your needs)
   ```bash
   RATE_LIMIT_MAX_REQUESTS=20
   LLM_RATE_LIMIT_MAX_REQUESTS=10
   ```

5. **Set log level**
   ```bash
   LOG_LEVEL=warn  # Less verbose in production
   ```

6. **Set up monitoring**
   - Integrate with error tracking (Sentry)
   - Set up log aggregation (ELK, Datadog)
   - Configure alerts for rate limit hits

## ✅ Verification Checklist

- [ ] Redis is running and connected
- [ ] Health checks return 200
- [ ] Validation rejects invalid URLs
- [ ] Rate limiting triggers after 10 requests
- [ ] Abuse detection triggers on rapid requests
- [ ] Logs are being written to files
- [ ] Timeout works (test with slow endpoint)
- [ ] CORS headers are correct
- [ ] Error responses are properly formatted

## 🎓 Learn More

- [SECURITY.md](./SECURITY.md) - Detailed security documentation
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Complete feature list
- [README.md](./README.md) - API overview

## 🆘 Getting Help

If you encounter issues:

1. Check the logs: `logs/error.log`
2. Verify Redis is running: `redis-cli ping`
3. Test health endpoint: `curl localhost:3001/health`
4. Check environment variables: `cat .env`

Happy securing! 🔒
