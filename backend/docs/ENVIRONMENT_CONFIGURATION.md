# Environment Configuration Guide

This document provides comprehensive information about environment variables used in the Claims Management System.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Variables Reference](#environment-variables-reference)
3. [Environment-Specific Configuration](#environment-specific-configuration)
4. [Production Deployment Checklist](#production-deployment-checklist)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Copy the Example File

```bash
cd backend
cp .env.example .env
```

### 2. Edit Required Variables

At minimum, you must set:
- `DATABASE_URL` - Your PostgreSQL connection string
- `SESSION_SECRET` - A secure random string (32+ characters)

### 3. Generate Secure Secrets

```bash
# Generate SESSION_SECRET
openssl rand -base64 32
```

---

## Environment Variables Reference

### Application Environment

#### `NODE_ENV`
- **Type:** String
- **Options:** `development`, `production`, `test`
- **Default:** `development`
- **Description:** Determines the application environment
- **Impact:**
  - `production`: Enables file logging, stricter security, optimizations
  - `development`: Console-only logging, relaxed CORS, verbose errors
  - `test`: Minimal logging, test-specific configurations

#### `PORT`
- **Type:** Number
- **Default:** `3000`
- **Description:** Port the HTTP server listens on
- **Validation:** Must be a valid port number (1-65535)

---

### Database Configuration

#### `DATABASE_URL` ⚠️ REQUIRED
- **Type:** String (URI)
- **Format:** `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA`
- **Example (Dev):** `postgresql://cms_user:cms_password@localhost:5432/cms_dev?schema=public`
- **Example (Prod):** `postgresql://user:pass@db.example.com:5432/cms_prod?schema=public&sslmode=require`
- **Description:** PostgreSQL connection string
- **Security Notes:**
  - Use strong passwords (16+ characters)
  - Enable SSL in production (`sslmode=require`)
  - Use connection pooling for production
  - Never commit credentials to version control

---

### Session Configuration

#### `SESSION_SECRET` ⚠️ REQUIRED
- **Type:** String
- **Minimum Length:** 32 characters
- **Example:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- **Description:** Secret key for session encryption and signing
- **Generation:** `openssl rand -base64 32`
- **Security Notes:**
  - Must be unique per environment
  - Change immediately if compromised
  - Store securely (e.g., AWS Secrets Manager, Azure Key Vault)
  - Never use default values in production

---

### Logging Configuration

#### `LOG_LEVEL`
- **Type:** String
- **Options:** `error`, `warn`, `info`, `http`, `debug`
- **Default:** `info`
- **Description:** Minimum log level to output
- **Recommendations:**
  - **Production:** `info` or `warn`
  - **Development:** `debug`
  - **Testing:** `error`

#### `ENABLE_FILE_LOGGING`
- **Type:** String (boolean)
- **Options:** `true`, `false`
- **Default:** `false` (auto-enabled in production)
- **Description:** Enable file-based logging to `logs/` directory
- **Log Retention:**
  - Error logs: 14 days
  - Combined logs: 14 days
  - Audit logs: 90 days

---

### CORS Configuration

#### `CORS_ORIGINS`
- **Type:** String (comma-separated list)
- **Default:** `http://localhost:5173,http://localhost:5174`
- **Example (Prod):** `https://app.example.com,https://admin.example.com`
- **Description:** Allowed origins for Cross-Origin Resource Sharing
- **Security Notes:**
  - Only list trusted domains
  - Never use `*` in production
  - Include protocol (http/https)
  - No trailing slashes

---

### Rate Limiting Configuration

#### `RATE_LIMIT_WINDOW_MS`
- **Type:** Number (milliseconds)
- **Default:** `900000` (15 minutes)
- **Description:** Time window for rate limiting
- **Recommendations:** 10-15 minutes for most APIs

#### `RATE_LIMIT_MAX_REQUESTS`
- **Type:** Number (integer)
- **Default:** `100`
- **Description:** Maximum requests per IP per window
- **Recommendations:**
  - **Light traffic:** 50-100
  - **Medium traffic:** 100-200
  - **High traffic:** 200-500

#### `AUTH_RATE_LIMIT_MAX`
- **Type:** Number (integer)
- **Default:** `5`
- **Description:** Maximum failed authentication attempts per window
- **Security Notes:**
  - Keep low (3-5) to prevent brute force attacks
  - Failed attempts are logged for monitoring

---

### Security Configuration

#### `ENABLE_HELMET`
- **Type:** String (boolean)
- **Options:** `true`, `false`
- **Default:** `true`
- **Description:** Enable Helmet security headers
- **Headers Set:**
  - Content-Security-Policy
  - Strict-Transport-Security
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection

---

### Optional: External Services

#### `SENTRY_DSN`
- **Type:** String (URI)
- **Optional:** Yes
- **Example:** `https://key@sentry.io/project-id`
- **Description:** Sentry error tracking integration
- **When to Use:** Production error monitoring and alerting

#### `REDIS_URL`
- **Type:** String (URI)
- **Optional:** Yes
- **Example:** `redis://localhost:6379`
- **Description:** Redis connection for session storage
- **When to Use:** Production scaling (replaces PostgreSQL session store)

---

## Environment-Specific Configuration

### Development Environment

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://cms_user:cms_password@localhost:5432/cms_dev?schema=public
SESSION_SECRET=dev-secret-min-32-characters-long
LOG_LEVEL=debug
ENABLE_FILE_LOGGING=false
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

**Characteristics:**
- Verbose logging (debug level)
- Console-only logs
- Relaxed security for development speed
- Local database and services

---

### Production Environment

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@prod-db.example.com:5432/cms_prod?schema=public&sslmode=require
SESSION_SECRET=<SECURE_64_CHAR_RANDOM_STRING>
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
CORS_ORIGINS=https://app.example.com,https://admin.example.com
RATE_LIMIT_MAX_REQUESTS=200
AUTH_RATE_LIMIT_MAX=3
SENTRY_DSN=https://key@sentry.io/project-id
REDIS_URL=redis://redis.example.com:6379
```

**Characteristics:**
- Minimal logging (info/warn)
- File-based logs with rotation
- Strict security settings
- SSL-enabled database connections
- Error tracking and monitoring
- Scalable session storage

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] All secrets generated and stored securely
- [ ] `SESSION_SECRET` is unique and 32+ characters
- [ ] `DATABASE_URL` uses production database (not localhost)
- [ ] Database SSL is enabled (`sslmode=require`)
- [ ] `NODE_ENV` is set to `production`
- [ ] `CORS_ORIGINS` only includes production domains
- [ ] `LOG_LEVEL` is `info` or `warn` (not `debug`)
- [ ] Rate limiting values are appropriate for expected traffic
- [ ] `.env` file is not committed to git
- [ ] `.env` file has restricted permissions (`chmod 600 .env`)

### Security Verification

- [ ] Database credentials follow least-privilege principle
- [ ] Session secret is stored in secrets manager (not plaintext)
- [ ] All endpoints have rate limiting enabled
- [ ] HTTPS is enforced (check `secure` cookie flag)
- [ ] Helmet security headers are enabled
- [ ] CORS is configured for specific origins only
- [ ] Input validation is active on all routes
- [ ] Audit logging is enabled and monitored

### Monitoring Setup

- [ ] Error tracking configured (Sentry or equivalent)
- [ ] Log aggregation configured (CloudWatch, Datadog, etc.)
- [ ] Alerts configured for critical errors
- [ ] Disk space monitoring for log files
- [ ] Database connection pool monitoring
- [ ] Rate limit violation alerts

---

## Security Best Practices

### 1. Secrets Management

**❌ DON'T:**
```env
SESSION_SECRET=change-me-in-production
DATABASE_URL=postgresql://admin:admin@localhost:5432/db
```

**✅ DO:**
- Use AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault
- Rotate secrets regularly (every 90 days)
- Use different secrets per environment
- Generate secrets with high entropy (64+ bytes)

### 2. Database Security

**Best Practices:**
- Create a dedicated database user (not superuser)
- Grant only necessary permissions (SELECT, INSERT, UPDATE, DELETE)
- Enable SSL/TLS for connections
- Use connection pooling
- Implement database backups and point-in-time recovery

### 3. Environment Isolation

**Environments:**
1. **Development** - Local machines, frequent changes
2. **Staging** - Pre-production testing, mirrors production
3. **Production** - Live system, stable and monitored

**Rules:**
- Never mix environment credentials
- Use separate databases per environment
- Test configuration changes in staging first

---

## Troubleshooting

### Server Won't Start

**Error:** `❌ Environment variable validation failed`

**Solution:** Check validation error messages. Common issues:
- Missing required variables (DATABASE_URL, SESSION_SECRET)
- Invalid format (DATABASE_URL must be a valid URI)
- SESSION_SECRET too short (minimum 32 characters)

**Fix:**
```bash
# Validate your .env file
cat .env

# Compare with .env.example
diff .env .env.example
```

---

### Database Connection Fails

**Error:** `Error: connect ECONNREFUSED`

**Possible Causes:**
1. DATABASE_URL is incorrect
2. PostgreSQL is not running
3. Firewall blocking connection
4. Wrong host/port

**Debug Steps:**
```bash
# Test database connection manually
psql "postgresql://user:pass@host:port/db"

# Check if PostgreSQL is running
sudo systemctl status postgresql

# Verify DATABASE_URL format
echo $DATABASE_URL
```

---

### Session Issues

**Error:** `Session validation failed`

**Possible Causes:**
1. SESSION_SECRET changed (invalidates existing sessions)
2. SESSION_SECRET too short
3. Session store unavailable

**Fix:**
```bash
# Generate new SESSION_SECRET
openssl rand -base64 32

# Update .env file
# Restart server
npm run dev
```

---

### Rate Limiting Too Strict

**Issue:** Legitimate users getting rate limited

**Solution:** Adjust rate limit values:
```env
# Increase limits
RATE_LIMIT_MAX_REQUESTS=200
RATE_LIMIT_WINDOW_MS=600000  # 10 minutes
```

**Monitor:** Check logs for rate limit violations:
```bash
grep "Rate limit exceeded" logs/combined-*.log
```

---

## Additional Resources

- [Prisma Environment Variables](https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-monorepo)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [OWASP Configuration Guide](https://cheatsheetseries.owasp.org/cheatsheets/Configuration_Cheat_Sheet.html)
- [12-Factor App Configuration](https://12factor.net/config)

---

**Last Updated:** October 2025
