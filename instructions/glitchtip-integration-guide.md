# Glitchtip Integration Guide

This guide documents how to integrate Glitchtip error tracking into a React + Express + TypeScript project hosted on Railway.

## Table of Contents

1. [Overview & Architecture](#overview--architecture)
2. [Prerequisites](#prerequisites)
3. [Step 1: Create Glitchtip Project](#step-1-create-glitchtip-project)
4. [Step 2: Install Dependencies](#step-2-install-dependencies)
5. [Step 3: Environment Variables](#step-3-environment-variables)
6. [Step 4: Backend Integration](#step-4-backend-integration)
7. [Step 5: Frontend Integration](#step-5-frontend-integration)
8. [Step 6: Build Configuration](#step-6-build-configuration)
9. [Step 7: Source Map Upload (Optional)](#step-7-source-map-upload-optional)
10. [Step 8: Verify Integration](#step-8-verify-integration)
11. [Step 9: Alerting & PagerDuty Integration](#step-9-alerting--pagerduty-integration)
12. [Troubleshooting](#troubleshooting)
13. [Reference](#reference)

---

## Overview & Architecture

### What is Glitchtip?

Glitchtip is an open-source, self-hosted error tracking service that is **Sentry-compatible**. This means:
- We use the official **Sentry SDK** (not a Glitchtip-specific SDK)
- Code is portable - can migrate to Sentry SaaS later without changes
- Self-hosted = no vendor lock-in, data stays on your infrastructure

### Why SDK v7?

**Critical:** Glitchtip (as of v5.x) doesn't fully support Sentry SDK v8+ OpenTelemetry-based tracing. Using v8+ results in:
- Performance transactions not appearing in dashboard
- Missing request timing data

SDK v7 uses traditional instrumentation that Glitchtip understands. Error tracking works on both versions, but **use v7 for full functionality**.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Your App                                │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React)              │  Backend (Express)             │
│  ┌─────────────────────────┐   │  ┌──────────────────────────┐  │
│  │ client/src/app/         │   │  │ server/instrument.ts     │  │
│  │   glitchtip.ts          │   │  │   - Must be first import │  │
│  │                         │   │  │   - Sentry.init()        │  │
│  │ Why first import?       │   │  │   - Express handlers     │  │
│  │ SDK must load before    │   │  │                          │  │
│  │ React to catch all      │   │  │ Why separate file?       │  │
│  │ errors including        │   │  │ SDK must instrument      │  │
│  │ module load failures    │   │  │ Express BEFORE it loads  │  │
│  └───────────┬─────────────┘   │  └───────────┬──────────────┘  │
│              │                 │              │                 │
│              ▼                 │              ▼                 │
│      @sentry/react v7         │       @sentry/node v7          │
└──────────────┬────────────────┴──────────────┬──────────────────┘
               │                               │
               └───────────────┬───────────────┘
                               ▼
                    ┌─────────────────────┐
                    │     Glitchtip       │
                    │  (Self-hosted)      │
                    ├─────────────────────┤
                    │  • Error tracking   │
                    │  • Performance      │
                    │  • Uptime monitors  │
                    │  • Webhooks ────────┼───► PagerDuty/Slack
                    └─────────────────────┘
```

### Why Two DSN Variables?

- `GLITCHTIP_DSN` - Backend (Node.js reads from `process.env`)
- `VITE_GLITCHTIP_DSN` - Frontend (Vite only exposes `VITE_` prefixed vars to browser)

They have the same value, but different names due to how environment variables work in each context.

---

## Prerequisites

- Glitchtip server deployed (Web + Worker + PostgreSQL + Redis)
- Access to Glitchtip dashboard
- Target app: React + Express + TypeScript + Vite
- Deployment platform: Railway (or similar with env var support)

---

## Step 1: Create Glitchtip Project

1. Log into Glitchtip dashboard
2. Go to **Projects** → **Create New Project**
3. Select **JavaScript** as platform
4. Name it descriptively (e.g., `myapp-production`, `myapp-staging`)
5. Copy the **DSN** from **Settings → Projects → Client Keys**

The DSN format: `https://<key>@<glitchtip-host>/<project-id>`

**Tip:** Create separate projects for staging and production to keep errors isolated.

---

## Step 2: Install Dependencies

**IMPORTANT:** Install at project root, not in `/client` directory.

```bash
# Core SDK - USE v7 for Glitchtip compatibility
npm install @sentry/react@^7.120.0 @sentry/node@^7.120.0

# Build tools
npm install -D @sentry/vite-plugin

# Optional: CLI for source map uploads
npm install -D @sentry/cli
```

### Why These Specific Packages?

| Package | Purpose |
|---------|---------|
| `@sentry/react` | Frontend SDK with React-specific integrations (ErrorBoundary, hooks) |
| `@sentry/node` | Backend SDK with Express middleware |
| `@sentry/vite-plugin` | Automatically uploads source maps during build |
| `@sentry/cli` | Manual source map upload script (for more control) |

---

## Step 3: Environment Variables

### 3.1 Update `.env.example`

```bash
# ===========================================
# Glitchtip/Sentry Error Tracking (Optional)
# ===========================================

# Get DSN from: Glitchtip → Projects → Your Project → Settings → Client Keys
# Same value for both - different names due to Vite's VITE_ prefix requirement
# GLITCHTIP_DSN=https://key@your-glitchtip.example.com/1
# VITE_GLITCHTIP_DSN=https://key@your-glitchtip.example.com/1

# Release version for source map matching
# Set during build/deploy. If not set, falls back to git commit SHA.
# RELEASE_VERSION=1.0.0
# VITE_RELEASE_VERSION=1.0.0

# ===========================================
# Source Map Upload (CI/CD builds only)
# ===========================================
# Required for uploading source maps to Glitchtip for readable stack traces

# SENTRY_URL=https://your-glitchtip.example.com  # REQUIRED for self-hosted
# SENTRY_AUTH_TOKEN=your-auth-token              # From Glitchtip → Settings → Auth Tokens
# SENTRY_ORG=your-organization-slug              # Your org slug in Glitchtip
# SENTRY_PROJECT=your-project-slug               # Your project slug
```

### 3.2 Update `server/src/shared/env.ts`

Add to your Zod schema:

```typescript
const envSchema = z.object({
  // ... existing fields ...

  // Glitchtip/Sentry error tracking (optional)
  // Why optional: App should work without error tracking configured
  GLITCHTIP_DSN: z.string().url().optional(),

  // Release version for source map matching
  // Why optional: Falls back to RAILWAY_GIT_COMMIT_SHA or undefined
  RELEASE_VERSION: z.string().optional(),
});
```

### 3.3 Add to Deployment Platform

In Railway (or your platform) service settings, add:

| Variable | Value | Required |
|----------|-------|----------|
| `GLITCHTIP_DSN` | Your DSN | Yes |
| `VITE_GLITCHTIP_DSN` | Same DSN | Yes |
| `RELEASE_VERSION` | Version string (optional) | No |
| `VITE_RELEASE_VERSION` | Same version (optional) | No |

**Note:** Railway automatically sets `RAILWAY_GIT_COMMIT_SHA` which we use as a fallback for release version.

---

## Step 4: Backend Integration

### 4.1 Create `server/instrument.ts`

**Why a separate file?** The Sentry SDK must initialize and instrument modules (like Express, HTTP) *before* they are imported. Putting initialization in a separate file that's imported first guarantees this order.

```typescript
/**
 * Sentry/Glitchtip instrumentation for Node.js
 *
 * CRITICAL: This file must be the FIRST import in server/index.ts
 *
 * Why? Sentry needs to "wrap" Express and HTTP modules before they load.
 * If Express loads first, Sentry can't instrument it for performance tracing.
 */

import * as Sentry from '@sentry/node';

// Read directly from process.env (not from env.ts to avoid import order issues)
const dsn = process.env.GLITCHTIP_DSN;
const nodeEnv = process.env.NODE_ENV || 'development';

// Release version priority: explicit > Railway git SHA > undefined
const release = process.env.RELEASE_VERSION || process.env.RAILWAY_GIT_COMMIT_SHA;

if (dsn) {
  Sentry.init({
    dsn,
    environment: nodeEnv,
    release,

    // Performance monitoring sample rate
    // 0.5 = 50% of requests get performance data
    // Why not 100%? Performance overhead and Glitchtip storage costs
    tracesSampleRate: nodeEnv === 'production' ? 0.5 : 0,

    // HTTP integration for tracing outbound requests
    // Why explicit? SDK v7 requires manual integration setup
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
    ],

    // Filter noisy errors that aren't actionable
    beforeSend(event, hint) {
      const error = hint.originalException;

      // AbortError = user cancelled request (e.g., navigated away)
      // Not a bug, just normal browser behavior
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }

      return event;
    },

    // Don't send events during tests
    enabled: nodeEnv !== 'test',
  });

  console.log(`[Sentry] Initialized for ${nodeEnv} (release: ${release || 'unknown'})`);
} else if (nodeEnv === 'production') {
  console.warn('[Sentry] DSN not configured, error tracking disabled');
}

// Re-export Sentry for use in index.ts
export { Sentry };
```

### 4.2 Modify `server/index.ts`

**At the very top of the file (MUST be first import):**

```typescript
// CRITICAL: Sentry must be imported FIRST before any other modules
// This allows it to instrument Express, HTTP, etc. for performance tracing
import { Sentry } from './instrument';

import express from 'express';
import helmet from 'helmet';
// ... rest of imports
```

**Add Sentry request handlers immediately after creating the Express app:**

```typescript
const app = express();

// Sentry request and tracing handlers - MUST be first middleware
// Why? They need to wrap the entire request lifecycle
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// ... rest of middleware (helmet, cors, etc.)
```

**Update Helmet CSP to allow Glitchtip connections:**

```typescript
import { env } from './src/shared/env';

app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: [
        "'self'",
        // Allow browser to send errors to Glitchtip
        // Why dynamic? DSN might not be set in all environments
        env.GLITCHTIP_DSN ? new URL(env.GLITCHTIP_DSN).origin : null,
      ].filter(Boolean) as string[],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
}));
```

**Add Sentry error handler BEFORE your custom errorHandler (near end of file):**

```typescript
// Error handling middleware - order matters!
// 1. Sentry captures the error and sends to Glitchtip
// 2. Your errorHandler formats the response for the client
app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);
```

**Update unhandled error handlers:**

```typescript
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
  if (reason instanceof Error) {
    Sentry.withScope((scope) => {
      scope.setExtra('type', 'unhandledRejection');
      Sentry.captureException(reason);
    });
  }
});

process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  Sentry.withScope((scope) => {
    scope.setExtra('type', 'uncaughtException');
    Sentry.captureException(error);
  });
  // Exit after uncaught exception - process is in undefined state
  process.exit(1);
});
```

---

## Step 5: Frontend Integration

### 5.1 Create `client/src/app/glitchtip.ts`

```typescript
/**
 * Glitchtip/Sentry error tracking for frontend
 *
 * CRITICAL: This file must be imported FIRST in main.tsx
 *
 * Why? To catch errors that occur during module loading (before React mounts).
 * If a component fails to import, we want to capture that error.
 */

import * as Sentry from '@sentry/react';

// Vite injects RAILWAY_GIT_COMMIT_SHA at build time (see vite.config.ts)
declare const __RAILWAY_GIT_COMMIT_SHA__: string;

const dsn = import.meta.env.VITE_GLITCHTIP_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,

    // Release version for source map matching
    // Priority: explicit env var > Railway git SHA > undefined
    release: import.meta.env.VITE_RELEASE_VERSION || __RAILWAY_GIT_COMMIT_SHA__ || undefined,

    // Performance monitoring - 50% of page loads
    tracesSampleRate: import.meta.env.PROD ? 0.5 : 0,

    // Browser-specific integrations
    integrations: [
      Sentry.browserTracingIntegration(),
    ],

    // Ignore common browser noise that isn't actionable
    ignoreErrors: [
      // Browser extensions and third-party scripts
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',

      // Network errors - usually user's connection, not our bug
      'Network request failed',
      'Failed to fetch',
      'Load failed',

      // Code splitting errors - usually deployment during user's session
      /Loading chunk \d+ failed/,
      /ChunkLoadError/,

      // User cancelled navigation
      'AbortError',
      'cancelled',  // Safari-specific
    ],

    beforeSend(event, hint) {
      const error = hint.originalException;

      // Skip AbortError (user cancelled)
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }

      // Skip 4xx API errors - these are expected (validation, auth, etc.)
      // We only want to track 5xx (server errors)
      if (
        error instanceof Error &&
        'status' in error &&
        typeof (error as { status: unknown }).status === 'number'
      ) {
        const status = (error as { status: number }).status;
        if (status >= 400 && status < 500) {
          return null;
        }
      }

      return event;
    },

    // Only send events in production
    // Why? Development errors are visible in console, no need to send to Glitchtip
    enabled: import.meta.env.PROD,
  });

  console.log(`[Glitchtip] Initialized for ${import.meta.env.MODE}`);
} else if (import.meta.env.PROD) {
  console.warn('[Glitchtip] DSN not configured, error tracking disabled');
}

/**
 * Set user context for error tracking
 * Call after login, clear after logout
 *
 * Why? Errors are more actionable when you know who experienced them
 */
export function setGlitchtipUser(user: {
  id: string;
  username: string;
  role: string;
} | null): void {
  if (!dsn) return;
  Sentry.setUser(user ? { id: user.id, username: user.username, role: user.role } : null);
}

/**
 * Manually capture an exception
 * Use for errors you catch but want to track
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!dsn) return;
  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

export { Sentry };
```

### 5.2 Modify `client/src/main.tsx`

**MUST be the first import:**

```typescript
// Initialize error tracking FIRST - before any code that might throw
import './app/glitchtip';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// ... rest of imports
```

### 5.3 Add User Context in Auth

In your auth context (e.g., `AuthContext.tsx`):

```typescript
import { setGlitchtipUser } from '../../app/glitchtip';

// In your login mutation's onSuccess:
onSuccess: (user) => {
  // ... existing login logic
  setGlitchtipUser({
    id: user.id,
    username: user.username,
    role: user.role,
  });
}

// In your logout mutation's onSuccess:
onSuccess: () => {
  // ... existing logout logic
  setGlitchtipUser(null);
}
```

---

## Step 6: Build Configuration

### 6.1 Update `vite.config.ts`

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    // Upload source maps to Glitchtip during build (if configured)
    // Why conditional? Source map upload requires auth tokens only available in CI/CD
    process.env.SENTRY_AUTH_TOKEN &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        sourcemaps: {
          // Delete source maps after upload - don't expose in production
          filesToDeleteAfterUpload: ["./dist/public/**/*.map"],
        },
      }),
  ].filter(Boolean),

  // Inject Railway's git commit SHA at build time
  // Why? Frontend can't read process.env at runtime, so we inject at build
  define: {
    __RAILWAY_GIT_COMMIT_SHA__: JSON.stringify(process.env.RAILWAY_GIT_COMMIT_SHA || ""),
  },

  resolve: {
    alias: {
      // ... your existing aliases
    },
  },

  root: path.resolve(__dirname, "client"),

  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    // Generate source maps for readable stack traces in Glitchtip
    sourcemap: true,
  },
});
```

### 6.2 Update `package.json` Build Script

Add `--sourcemap` to generate backend source maps:

```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts server/instrument.ts db/seed.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:vite --external:lightningcss --sourcemap && cp -r server/src/assets dist/assets"
  }
}
```

**Note:** Added `server/instrument.ts` to esbuild command.

### 6.3 Update `railway.json`

Add `libatomic1` - required by Sentry's native dependencies:

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "RAILPACK",
    "buildCommand": "npm run build",
    "aptPkgs": ["libatomic1"]
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
```

**Why libatomic1?** Sentry SDK includes native bindings that require this library on Linux. Without it, build fails with cryptic errors.

---

## Step 7: Source Map Upload (Optional)

Source maps convert minified production code back to readable TypeScript. Without them, stack traces show `main.js:1:12345` instead of `UserForm.tsx:42`.

### Option A: Automatic (via Vite Plugin)

Already configured in Step 6.1. Set these env vars in your CI/CD:

```bash
SENTRY_URL=https://your-glitchtip.example.com  # REQUIRED for self-hosted
SENTRY_AUTH_TOKEN=your-token                   # From Glitchtip → Settings → Auth Tokens
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

### Option B: Manual Script

Create `scripts/upload-sourcemaps.sh` for more control:

```bash
#!/bin/bash
#
# Upload source maps to Glitchtip for readable stack traces
#
# Required environment variables:
#   SENTRY_AUTH_TOKEN - API auth token from Glitchtip
#   SENTRY_ORG        - Organization slug
#   SENTRY_PROJECT    - Project slug
#   SENTRY_URL        - Glitchtip server URL (REQUIRED for self-hosted)
#
# Usage: ./scripts/upload-sourcemaps.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Validate required env vars
check_required_vars() {
    local missing=0
    for var in SENTRY_AUTH_TOKEN SENTRY_ORG SENTRY_PROJECT SENTRY_URL; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}Error: $var is not set${NC}"
            missing=1
        fi
    done
    if [ $missing -eq 1 ]; then
        echo ""
        echo "Required environment variables:"
        echo "  SENTRY_AUTH_TOKEN - Get from Glitchtip → Settings → Auth Tokens"
        echo "  SENTRY_ORG        - Your organization slug"
        echo "  SENTRY_PROJECT    - Your project slug"
        echo "  SENTRY_URL        - Your Glitchtip URL"
        exit 1
    fi
}

# Get release version
get_release_version() {
    if [ -n "$RELEASE_VERSION" ]; then
        echo "$RELEASE_VERSION"
    elif [ -n "$RAILWAY_GIT_COMMIT_SHA" ]; then
        echo "$RAILWAY_GIT_COMMIT_SHA"
    elif git rev-parse HEAD > /dev/null 2>&1; then
        git rev-parse --short HEAD
    else
        echo "unknown-$(date +%Y%m%d%H%M%S)"
    fi
}

main() {
    echo -e "${GREEN}=== Glitchtip Source Map Upload ===${NC}"
    check_required_vars

    RELEASE=$(get_release_version)
    echo -e "Release: ${YELLOW}${RELEASE}${NC}"

    if [ ! -d "dist" ]; then
        echo -e "${RED}Error: dist/ not found. Run 'npm run build' first.${NC}"
        exit 1
    fi

    export SENTRY_URL

    echo -e "${GREEN}Injecting debug IDs...${NC}"
    npx sentry-cli sourcemaps inject dist

    echo -e "${GREEN}Uploading source maps...${NC}"
    npx sentry-cli sourcemaps upload \
        --org "$SENTRY_ORG" \
        --project "$SENTRY_PROJECT" \
        --release "$RELEASE" \
        dist

    echo -e "${GREEN}Done! Source maps uploaded for release: $RELEASE${NC}"
}

main "$@"
```

Make executable: `chmod +x scripts/upload-sourcemaps.sh`

---

## Step 8: Verify Integration

### 8.1 Check Deployment Logs

After deployment, look for:

```
[Sentry] Initialized for production (release: abc1234)
```

If you see `DSN not configured`, check your environment variables.

### 8.2 Test Error Capture

**Option A: Manual test error**

Add temporarily to any component:

```typescript
import { captureException } from '../app/glitchtip';

// In a useEffect or button handler:
captureException(new Error('Test error from frontend'), { source: 'manual-test' });
```

**Option B: Trigger a real error**

```typescript
// This will throw and be captured automatically
const obj = null;
obj.foo(); // TypeError: Cannot read property 'foo' of null
```

### 8.3 Verify in Dashboard

1. Go to Glitchtip dashboard
2. Select your project
3. Check **Issues** tab - error should appear within 30 seconds
4. Click the error to see stack trace, user context, etc.

---

## Step 9: Alerting & PagerDuty Integration

Glitchtip supports alerting via email and webhooks. For PagerDuty integration:

### Email Alerts (Built-in)

1. Go to **Settings → Projects → Your Project**
2. Add **Alert Recipients** (email addresses)
3. Configure alert frequency (immediate, hourly digest, etc.)

### Webhook Integration (for PagerDuty, Slack, etc.)

Glitchtip can send webhooks on new issues. To integrate with PagerDuty:

**Option A: PagerDuty Events API v2**

1. In PagerDuty, create a new Service with "Events API v2" integration
2. Copy the Integration Key
3. Create a small webhook receiver that:
   - Receives Glitchtip webhook
   - Transforms to PagerDuty Events API format
   - Posts to PagerDuty

**Option B: PagerDuty Email Integration (Simpler)**

1. In PagerDuty, create a Service with Email integration
2. Get the service's email address
3. In Glitchtip, add that email as an Alert Recipient

### Uptime Monitoring

Glitchtip includes uptime monitoring with its own alerts:

1. Go to **Uptime Monitors**
2. Click **Create Monitor**
3. Configure:
   - Name: `MyApp - Production`
   - URL: `https://your-app.example.com/health`
   - Interval: 60 seconds
   - Expected Status: 200
4. Add alert recipients

Uptime alerts are separate from error alerts and will notify on downtime.

---

## Troubleshooting

### CSP Blocks Glitchtip Requests

**Symptom:** Browser console shows `Refused to connect to 'https://glitchtip...'`

**Solution:** Add Glitchtip origin to Helmet CSP `connectSrc` (see Step 4.2)

### Build Fails with libatomic1 Error

**Symptom:** `error while loading shared libraries: libatomic.so.1`

**Solution:** Add `aptPkgs: ["libatomic1"]` to `railway.json`

### No Errors in Dashboard

**Checklist:**
1. Is DSN correct? (check for typos)
2. Is Glitchtip Worker service running? (check Railway)
3. Is `enabled: true`? (check isn't being disabled)
4. Is error filtered by `ignoreErrors` or `beforeSend`?
5. Check browser Network tab - are requests being sent?

### Performance Data Missing (Transactions)

**Symptom:** Errors work but Performance tab is empty

**Cause:** Likely using SDK v8+ instead of v7

**Solution:** Downgrade to `@sentry/node@^7.120.0` and `@sentry/react@^7.120.0`

### "Express is not instrumented" Warning

**Symptom:** Log shows warning about Express not being instrumented

**Cause:** `instrument.ts` not imported first, or SDK v8 used

**Solution:**
1. Ensure `import { Sentry } from './instrument'` is the FIRST line in `server/index.ts`
2. Use SDK v7

### Stack Traces Show Minified Code

**Symptom:** Errors show `main.js:1:12345` instead of `UserForm.tsx:42`

**Solution:** Set up source map upload (Step 7)

---

## Reference

### Environment Variables Summary

| Variable | Location | Required | Description |
|----------|----------|----------|-------------|
| `GLITCHTIP_DSN` | Runtime | Yes | Backend DSN |
| `VITE_GLITCHTIP_DSN` | Build + Runtime | Yes | Frontend DSN (same value) |
| `RELEASE_VERSION` | Build | No | Explicit release version |
| `VITE_RELEASE_VERSION` | Build | No | Frontend release version |
| `SENTRY_URL` | Build (CI/CD) | For source maps | Glitchtip server URL |
| `SENTRY_AUTH_TOKEN` | Build (CI/CD) | For source maps | Auth token |
| `SENTRY_ORG` | Build (CI/CD) | For source maps | Organization slug |
| `SENTRY_PROJECT` | Build (CI/CD) | For source maps | Project slug |

### Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modify | Add SDK v7 dependencies |
| `railway.json` | Modify | Add libatomic1 |
| `.env.example` | Modify | Document all env vars |
| `server/src/shared/env.ts` | Modify | Add DSN + release validation |
| `server/instrument.ts` | Create | SDK init (must be first import) |
| `server/index.ts` | Modify | Import instrument, add handlers, CSP |
| `client/src/app/glitchtip.ts` | Create | Frontend SDK init |
| `client/src/main.tsx` | Modify | Import glitchtip first |
| `client/src/shared/context/AuthContext.tsx` | Modify | User context tracking |
| `vite.config.ts` | Modify | Source maps, Railway SHA injection |
| `scripts/upload-sourcemaps.sh` | Create (optional) | Manual source map upload |

### Quick Checklist

**Setup:**
- [ ] Created project in Glitchtip dashboard
- [ ] Copied DSN
- [ ] Installed SDK v7 packages (`@sentry/react@^7`, `@sentry/node@^7`)
- [ ] Installed `@sentry/vite-plugin`

**Backend:**
- [ ] Created `server/instrument.ts`
- [ ] `server/index.ts` imports instrument FIRST
- [ ] Added `Sentry.Handlers.requestHandler()` (after app creation)
- [ ] Added `Sentry.Handlers.tracingHandler()` (after requestHandler)
- [ ] Added Glitchtip to CSP `connectSrc`
- [ ] Added `Sentry.Handlers.errorHandler()` (before custom errorHandler)
- [ ] Added unhandled error handlers

**Frontend:**
- [ ] Created `client/src/app/glitchtip.ts`
- [ ] `main.tsx` imports glitchtip FIRST
- [ ] Added user context in AuthContext

**Build:**
- [ ] Added `sourcemap: true` to vite.config.ts
- [ ] Added `--sourcemap` to esbuild in package.json
- [ ] Added `instrument.ts` to esbuild entry points
- [ ] Added `__RAILWAY_GIT_COMMIT_SHA__` define in vite.config.ts
- [ ] Added `libatomic1` to railway.json

**Environment:**
- [ ] Added `GLITCHTIP_DSN` to deployment platform
- [ ] Added `VITE_GLITCHTIP_DSN` to deployment platform
- [ ] (Optional) Set up source map upload env vars

**Verification:**
- [ ] Deployed and checked logs for initialization message
- [ ] Sent test error
- [ ] Verified error appears in Glitchtip dashboard
- [ ] Stack trace shows readable code (if source maps configured)

**Glitchtip Dashboard:**
- [ ] Set event retention (e.g., 15 days)
- [ ] Set up uptime monitoring
- [ ] Configured alert recipients
