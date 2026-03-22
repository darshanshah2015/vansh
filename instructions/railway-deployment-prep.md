# Railway Production Deployment - Agent Instructions

**Objective**: Prepare a full-stack Node.js project for automatic deployment on Railway.com

## Pre-Execution Checks

1. **Identify Project Type**:
   - Check for `package.json` in root
   - Identify if monorepo (frontend + backend in one repo)
   - Identify database ORM: Drizzle, Prisma, TypeORM, etc.
   - Check for existing build scripts

## Critical Rule: Build vs Runtime

**NEVER run database operations during build phase. Database is only available at runtime.**

```
BUILD TIME (isolated container):
  ✅ npm install
  ✅ Compile TypeScript
  ✅ Build frontend assets
  ❌ Database connections
  ❌ Migrations
  ❌ Database seeds

RUNTIME (has DATABASE_URL):
  ✅ Run migrations
  ✅ Start server
  ✅ Database queries
```

## Step 1: Environment Variable Validation

**File**: `server/src/shared/env.ts` (or equivalent)

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000), // Railway provides PORT
  DATABASE_URL: z.string().url(), // Required

  // Frontend vars (VITE_ prefix for Vite, NEXT_PUBLIC_ for Next.js)
  VITE_API_BASE_URL: z.string().url().optional(),

  // Add all required env vars here
});

export const env = envSchema.parse(process.env);
```

**Action**: Update env schema with ALL required variables including AWS, Stripe, etc.

## Step 2: Package.json Configuration

### 2.1 Scripts (CRITICAL)

```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts ...",
    "start": "npm run db:migrate && NODE_ENV=production node dist/index.js",
    "db:migrate": "drizzle-kit migrate"
  }
}
```

**Rules**:
- ❌ NO `postbuild` for migrations (database unavailable)
- ✅ Run migrations in `start` command BEFORE server starts
- ✅ Use `&&` to ensure migrations complete before server starts

### 2.2 Dependencies

**Move to Production Dependencies**:
- `drizzle-kit` (if using Drizzle ORM)
- `prisma` (if using Prisma)
- Any tool needed for runtime migrations

**Check**: `devDependencies` should NOT include migration tools

## Step 3: Railway Configuration Files

### 3.1 Create `railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 3.2 Create `.railwayignore`

```
# Development
.git/
.github/
.vscode/
.idea/
*.md
!README.md

# Build artifacts (regenerated)
dist/
build/
node_modules/

# Testing & docs
coverage/
.storybook/
**/*.test.ts
**/*.test.tsx

# Environment (set via Railway dashboard)
.env
.env.*

# Logs & misc
*.log
logs/
.DS_Store
.cache/
.temp/
```

### 3.3 Create `.env.example`

```env
# Database (use Railway variable reference)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Application
NODE_ENV=production

# Server Port (Local development only)
# Railway automatically provides PORT - DO NOT set in Railway dashboard
PORT=3000

# Frontend (update with actual Railway domain)
VITE_API_BASE_URL=https://your-app.up.railway.app

# Add all required env vars with placeholders
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

## Step 4: Verify .gitignore

**Ensure these are ignored**:
```
.env
.env.*
node_modules/
dist/
build/
```

## Step 5: Database Migration Setup

### For Drizzle ORM:

**Verify `drizzle.config.ts`**:
```typescript
export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### For Prisma:

Update `start` script:
```json
"start": "npx prisma migrate deploy && node dist/index.js"
```

## Step 6: Server Configuration Check

**Verify server listens on**:
```typescript
server.listen(env.PORT, '0.0.0.0', () => {
  // Railway requires 0.0.0.0, not localhost
});
```

## Step 7: Git Commit

```bash
git add railway.json .railwayignore .env.example package.json server/src/shared/env.ts
git commit -m "feat: Add Railway deployment configuration"
```

## Step 8: Railway Environment Variables Checklist

**Provide user with this checklist**:

```
Required in Railway Dashboard > Variables:

✓ DATABASE_URL=${{Postgres.DATABASE_URL}}
✓ NODE_ENV=production
✓ VITE_API_BASE_URL=https://[your-domain].up.railway.app
✓ [All AWS/API keys from .env.example]

NOTE: DO NOT set PORT - Railway provides this automatically
```

## Troubleshooting Decision Tree

```
Build fails?
├─ "ENOTFOUND postgres.railway.internal"
│  └─ Migration running at BUILD time → Move to START command
├─ "Cannot find module"
│  └─ Missing production dependency → Check package.json
└─ TypeScript errors
   └─ Run `npm run check` locally first

Runtime fails?
├─ "Invalid environment variable"
│  └─ Check Railway dashboard Variables tab
├─ "Connection refused"
│  └─ Server not listening on 0.0.0.0
└─ Migrations not running
   └─ Check start command runs db:migrate first
```

## ORM-Specific Migration Commands

| ORM | Move to dependencies | Start command |
|-----|---------------------|---------------|
| Drizzle | `drizzle-kit` | `npm run db:migrate && node dist/index.js` |
| Prisma | `prisma` | `npx prisma migrate deploy && node dist/index.js` |
| TypeORM | `typeorm` | `npx typeorm migration:run && node dist/index.js` |
| Sequelize | `sequelize-cli` | `npx sequelize-cli db:migrate && node dist/index.js` |

## Validation Checklist

Before marking task complete:

- [ ] `railway.json` exists
- [ ] `.railwayignore` exists
- [ ] `.env.example` exists with ALL required vars
- [ ] `.gitignore` excludes `.env`
- [ ] `package.json` start script runs migrations BEFORE server
- [ ] Migration tool in `dependencies` (not `devDependencies`)
- [ ] Environment variables validated in code
- [ ] Server listens on `0.0.0.0`
- [ ] NO database operations in build scripts
- [ ] Changes committed to git

## Post-Deployment Steps (Inform User)

1. Connect GitHub repo to Railway
2. Add PostgreSQL service in Railway
3. Set environment variables in Railway dashboard
4. Push to trigger deployment
5. Migrations run automatically at runtime
6. Monitor Railway logs for successful deployment

---

**Key Insight**: Railway build = isolated container without database. Always separate build-time operations from runtime database operations.
