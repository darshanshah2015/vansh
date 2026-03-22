# Backend Rules: Feature Development

> **Premise**: Standard TypeScript and Node.js best practices are assumed (async/await, immutability, strict equality, type safety, const by default, etc.). This document covers **project-specific architectural decisions only**—rules an AI agent cannot infer from codebase inspection alone.

---

## Guiding Principles

- **Simplicity Over Complexity**: Prefer the simplest solution. Avoid new abstractions unless truly necessary.
- **Single Responsibility**: Every function, class, and module must have exactly one reason to change.
- **Do not create new patterns when existing ones can be reused.**

---

## 1. Architecture Boundaries (CRITICAL)

### Database Schema Location
Database schemas are split by domain in `db/schema/` directory — one file per domain (e.g., `auth.schema.ts`, `rbac.schema.ts`), with `db/schema/index.ts` re-exporting everything. Services import from `@db` and perform queries directly.

### Layered Architecture
Every component follows: `controllers/` | `services/` | `routes/` | `validation/` | `constants/` (optional) | `errors/` (optional)

- **Controllers**: Thin coordinators that orchestrate services. No business logic. For complex workflows requiring many service calls, create a dedicated application service.
- **Services**: All business logic lives here. Must be HTTP-agnostic (no `req`, `res`, status codes). Return data or throw domain errors (see Section 5).
- **Routes**: Define endpoints with validation middleware.
- **Validation**: Input validation (Zod) in middleware, business validation in services.
- **Constants**: Domain-specific constants, enums, and configuration data (e.g., module definitions, default values).

### Transaction Rule
Create `db.transaction()` ONLY in services, NEVER in controllers.

```typescript
// ✅ CORRECT - Transaction in service
export async function createUserWithProfile(userData: UserData, profileData: ProfileData) {
  return await db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values(userData).returning();
    const [profile] = await tx.insert(profiles).values({ ...profileData, userId: user.id }).returning();
    return { user, profile };
  });
}

// ❌ WRONG - Transaction in controller
export async function create(req: Request, res: Response) {
  await db.transaction(async (tx) => { /* ... */ }); // NO!
}
```

---

## 2. Shared Constants (Single Source of Truth)

Define cross-layer values in `shared/constants/`. Import everywhere—never hardcode duplicates.

```typescript
// ✅ Named constant for comparisons | ❌ Array index (unclear)
if (user.role === ROLE.ADMIN)        if (user.role === ROLES[0])

// ✅ Array for iteration            | ❌ Hardcoded values
ROLES.map(r => ...)                  ['Admin', 'Editor'].map(...)
```

**Rule**: Arrays (`.map()`), named objects (`===`). Never index arrays for named values.

---

## 3. Component Organization

### Decision Framework: When to Create a New Component

**Scope**: Applies to backend only—deciding when to create `server/src/components/[domain]`.

**Checklist**: Answer these three questions:

1. **Is this a new, distinct business domain?**
   - YES: New area of business (e.g., `Invoicing` component)
   - NO: Extension of existing component (e.g., password reset → `Auth` component)

2. **Does it require new primary tables in `/db/schema.ts`?**
   - YES: Adds new primary business tables (e.g., `invoices` table)
   - NO: Operates on existing tables (adding columns ≠ new table)

3. **Is the logic highly cohesive and loosely coupled?**
   - YES: Internal logic is tightly related with minimal cross-component dependencies
   - NO: Logic is deeply intertwined with another component's internals

**Decision Rule**: If ≥2 answers are "Yes" → create new component. Otherwise → extend existing component.

**When in doubt**: Default to extending existing component and ask for clarification.

### Cross-Cutting Concerns: When to Use `/shared`

Use `server/src/shared/` for utilities called by 3+ components:
- Audit logging, email service, file uploads, notification service
- Caching, queue management, external API clients

**Note**: Shared services may still need tables in `/db/schema.ts` (e.g., `audit_logs`).

---

## 4. Services Must Be HTTP-Agnostic (CRITICAL)

**Rule**: Services MUST NOT use HTTP concepts (status codes, headers, `req`, `res`). Return plain data or throw domain errors.

```typescript
// ✅ CORRECT - Returns data, throws domain errors
import { EmailAlreadyExistsError } from '@server/shared/errors';

export async function registerUser(email: string, password: string): Promise<PublicUser> {
  const existingUser = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existingUser) throw new EmailAlreadyExistsError(email);

  const hashedPassword = await hashPassword(password);
  const [user] = await db.insert(users).values({ email, password: hashedPassword }).returning();
  return toPublicUser(user);
}

// ❌ WRONG - Knows about HTTP
export async function registerUser(req: Request) { // NO - receives req
  return { status: 409, data: null }; // NO - returns status codes
}
```

---

## 5. Validation Split (CRITICAL)

**Rule**: Distinguish between two types of validation:
- **Input Validation (Route Middleware)**: Validate data format/type using Zod schemas.
- **Business Validation (Services)**: Validate business rules and invariants. Throw domain errors when rules are violated (see Section 5).

```typescript
// ✅ CORRECT - Input validation in middleware
router.post('/users', validateBody(createUserSchema), usersController.create);

// ✅ CORRECT - Business validation in service
import { InsufficientFundsError } from '@server/shared/errors';

export async function transferMoney(fromId: string, toId: string, amount: number) {
  const account = await getAccount(fromId);

  if (account.balance < amount) {
    throw new InsufficientFundsError(amount, account.balance);
  }

  if (account.status === 'frozen') {
    throw new AccountFrozenError(fromId);
  }

  // ... perform transfer
}

// ❌ WRONG - Input validation in controller/service
export async function create(req: Request, res: Response) {
  const parsed = createUserSchema.parse(req.body); // NO! Use middleware
}
```

---

## 6. Error Handling (RFC 9457 Problem Details)

**Standard**: All API errors MUST follow [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html).

### Response Format (MANDATORY)
```typescript
// Content-Type: application/problem+json
interface ProblemDetails {
  type: string;      // URI: "https://api.colorfuture.com/errors/{error-type}"
  title: string;     // Human-readable summary (e.g., "Validation Error")
  status: number;    // HTTP status code in body (e.g., 400)
  detail?: string;   // Occurrence-specific explanation
  instance?: string; // URI for this specific occurrence (optional)
  errors?: Array<{   // For validation errors only
    detail: string;  // Field error message
    pointer: string; // JSON Pointer (e.g., "/body/email")
  }>;
}
```

**Example Response**:
```json
{
  "type": "https://api.colorfuture.com/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "The request contains invalid data",
  "errors": [
    { "detail": "Email is required", "pointer": "/body/email" }
  ]
}
```

### Domain Error Classes
**Location**:
- Shared errors: `server/src/shared/errors/`
- Component-specific: `server/src/components/[domain]/errors/`

**Error Type Format**: kebab-case `{resource}-{condition}` (e.g., `not-found`, `validation-error`, `conflict`)

```typescript
// ✅ CORRECT - Domain error in service (HTTP-agnostic)
import { UserNotFoundError } from '@server/shared/errors';

export async function getUser(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new UserNotFoundError(userId);
  return user;
}

// ❌ WRONG
throw new Error('User not found');      // NO - use domain error class
throw new ApiError(404, 'Not found');   // NO - services must not know HTTP
res.status(404).json({ error: '...' }); // NO - not RFC 9457 format
```

**Controller Error Handling**: Do NOT use try-catch in controllers—let errors propagate to error handling middleware. The middleware converts domain errors to RFC 9457 format.

---

## 7. Project-Specific Requirements

### OpenAPI Documentation (MANDATORY)
When you modify API endpoints, update `docs/openapi.yaml` AFTER implementing the code. Run `npm run docs:check` before committing to verify routes match the spec.

### Database Migrations
For any schema change, create a migration using `drizzle-kit generate`. Never modify the database manually.

### Password Hashing
Use `bcrypt` library to hash and compare passwords. Never store plaintext passwords.

### Logging
Use structured JSON logging with context (userId, requestId, timestamp). Never log sensitive data (passwords, tokens, PII).

**Example**: `logger.info('User registered', { userId: user.id, email: user.email, timestamp: new Date() });`

### Static Asset Serving (CRITICAL for SPAs)
Set `Cache-Control` headers to prevent stale JS after deployments:
- **`index.html`**: `no-cache, no-store, must-revalidate`
- **Hashed assets**: `public, max-age=31536000, immutable`

Apply to both `express.static()` and SPA fallback route. See `server/vite.ts` for implementation.

---

## 8. Database Operations (Drizzle + PostgreSQL)

### Migrations
Use `drizzle-kit generate` for all schema changes. Never manually modify the database.

### Query Patterns
```typescript
// ✅ Select specific columns
await db.select({ id: users.id, email: users.email }).from(users);

// ✅ Use joins instead of N+1 queries
await db.select().from(users).leftJoin(profiles, eq(users.id, profiles.userId));

// ✅ Batch operations for multiple inserts
await db.insert(users).values([
  { email: 'user1@example.com' },
  { email: 'user2@example.com' }
]);

// ✅ Always use .limit() for paginated queries
await db.select().from(users).limit(20);
```

### Pagination (MANDATORY)

ALL list endpoints MUST use page-based pagination. Query: `page` (default: 1), `limit` (default: 10, max: 100). Response: `{ [items], pagination: { page, limit, total, totalPages } }`.

```typescript
// Validation
page: z.coerce.number().int().min(1).default(1),
limit: z.coerce.number().int().min(1).max(100).default(10),

// Service
const offset = (page - 1) * limit;
const [items, total] = await Promise.all([
  db.select().from(table).limit(limit).offset(offset),
  db.select({ count: sql<number>`count(*)` }).from(table).then(r => Number(r[0]?.count ?? 0)),
]);
return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
```

### Indexing
Add compound indexes for multi-column WHERE clauses:

```typescript
// In schema
export const userStatusIndex = index('user_status_idx').on(users.status, users.createdAt);
```

### Connection Management
- Always use the shared `db` instance from `db/index.ts`
- Never manually close connections in application code
- Drizzle automatically uses prepared statements for security and performance

---

## 9. Timestamp Handling (CRITICAL)

### Schema Definition
Always use `timestamptz` with explicit configuration:

```typescript
// ✅ CORRECT
export const table = pgTable('table', {
  createdAt: timestamp('created_at', {
    withTimezone: true,  // Required: use timestamptz
    mode: 'date'         // Required: return Date objects
  }).notNull().defaultNow(),
});

// ❌ WRONG - plain timestamp loses timezone
createdAt: timestamp('created_at').notNull().defaultNow(),
```

### Date Validation
Use `z.coerce.date()` to auto-parse date strings with timezone:

```typescript
const schema = z.object({
  dateFrom: z.coerce.date().optional(), // Handles "2025-10-13T13:08:58Z"
});
```

### API Responses
Always use `.toISOString()`, never `.toString()` or `.toLocaleString()`:

```typescript
res.json({ createdAt: item.createdAt.toISOString() }); // ✅
res.json({ createdAt: item.createdAt.toString() }); // ❌ loses timezone
```

### SQL Date Comparisons

**Option 1: Drizzle Operators (Preferred for Simple Comparisons)**
When using `gte()`, `lte()`, `eq()` operators with `mode: 'date'` columns, pass Date objects directly:

```typescript
// ✅ CORRECT - Pass Date objects to operators
import { gte, lte } from 'drizzle-orm';

const dateFrom = new Date('2025-01-15T00:00:00Z');
conditions.push(gte(table.createdAt, dateFrom));
conditions.push(lte(table.createdAt, dateTo));
```

**Option 2: SQL Template (For Complex Queries)**
Use explicit casting when using `sql` templates:

```typescript
// ✅ CORRECT - Use ISO strings with explicit casting in sql templates
import { sql } from 'drizzle-orm';

conditions.push(sql`${table.createdAt}::timestamptz >= ${date.toISOString()}::timestamptz`);
```

**❌ WRONG - Don't mix approaches:**
```typescript
// ❌ Don't pass ISO strings to operators
conditions.push(gte(table.createdAt, date.toISOString())); // Error: toISOString is not a function

// ❌ Don't pass Date objects in sql templates without .toISOString()
sql`${table.createdAt} >= ${date}`; // Inconsistent serialization
```

---

## 10. API Response Caching (CRITICAL)

**Default**: All `/api/*` routes use `no-store`. Apply caching at **route level only**, never with path-based middleware.

```typescript
// ✅ Default: no caching on all API routes
app.use('/api', defaultNoCacheMiddleware); // Cache-Control: no-store

// ✅ Opt-in: cache specific reference-data routes only
router.get('/', cacheControl('private, max-age=300'), controller.list);

// ❌ WRONG - Path-based middleware caches ALL sub-routes
app.use('/api/locations', cacheControl('private, max-age=300'));
// ^ This also caches /api/locations/:id/deliveries (transactional data!)
```

**Cache**: Reference data only (regions, categories). **Never cache**: Transactional data.

---

## 11. Performance Best Practices

- **Limit Results**: Always use `.limit()` for paginated queries to prevent memory issues
- **Query Planning**: Use `EXPLAIN ANALYZE` in development to optimize slow queries
- **Batch Operations**: Use Drizzle's batch insert for multiple records
- **Proper Indexing**: Add indexes for frequently queried columns
- **Avoid N+1**: Use `.with()` or joins for relationships

---

## 12. Key Prohibitions

- **Do not use `any` type** without explicit justification
- **Do not use unsafe type assertions** (`as any`, `!`)
- **Never write synchronous, long-running code** that blocks the Node.js event loop
