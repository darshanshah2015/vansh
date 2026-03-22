# Task List: Vansh - Family Tree Application

**FRD Reference:** `tasks/0001-frd-vansh-family-tree.md`
**Coding Rules:** `instructions/node-code-writing-rules.md`, `instructions/react-code-writing-rules.md`

---

## Relevant Files

**Project Root:**
- `package.json` - Monorepo root with workspaces config
- `tsconfig.json` - Root TypeScript config (strict mode, ES2022)
- `drizzle.config.ts` - Drizzle ORM config for PostgreSQL
- `tailwind.config.js` - Tailwind config with Banyan theme colors
- `postcss.config.mjs` - PostCSS config
- `.prettierrc` - Prettier config (2 space, single quotes, trailing commas)
- `.eslintrc.js` - ESLint config with TypeScript and React
- `.eslintrc.js` - ESLint config

**Database (`db/`):**
- `db/index.ts` - Database client initialization (postgres + Drizzle)
- `db/seed.ts` - Database seeding (admin user, test data)
- `db/schema/index.ts` - Schema re-export barrel
- `db/schema/auth.schema.ts` - users, sessions, password_reset_tokens tables
- `db/schema/trees.schema.ts` - trees, tree_members tables
- `db/schema/persons.schema.ts` - persons, relationships tables
- `db/schema/claims.schema.ts` - claims table
- `db/schema/merge.schema.ts` - merge_proposals, merge_proposal_mappings tables
- `db/schema/audit.schema.ts` - audit_logs table
- `db/schema/notifications.schema.ts` - notifications table
- `db/schema/moderation.schema.ts` - deletion_requests table
- `db/schema/enums.ts` - PostgreSQL enum definitions
- `db/migrations/*.sql` - Generated SQL migrations

**Backend (`packages/server/`):**
- `packages/server/index.ts` - Express app entry point
- `packages/server/vite.ts` - Static asset serving with cache headers
- `packages/server/src/middleware/auth.middleware.ts` - requireAuth, requireAdmin middleware
- `packages/server/src/middleware/validate.middleware.ts` - Zod validation middleware
- `packages/server/src/middleware/error.middleware.ts` - RFC 9457 error handler
- `packages/server/src/middleware/rate-limit.middleware.ts` - Rate limiting
- `packages/server/src/middleware/sanitize.middleware.ts` - XSS input sanitization
- `packages/server/src/middleware/cache.middleware.ts` - Cache-Control middleware
- `packages/server/src/shared/errors/base.error.ts` - Base domain error class
- `packages/server/src/shared/errors/not-found.error.ts` - NotFoundError
- `packages/server/src/shared/errors/conflict.error.ts` - ConflictError
- `packages/server/src/shared/errors/unauthorized.error.ts` - UnauthorizedError
- `packages/server/src/shared/errors/forbidden.error.ts` - ForbiddenError
- `packages/server/src/shared/errors/validation.error.ts` - ValidationError
- `packages/server/src/shared/services/audit.service.ts` - Shared audit logging service
- `packages/server/src/shared/services/notification.service.ts` - Shared notification creation service
- `packages/server/src/shared/services/file.service.ts` - File upload/download service
- `packages/server/src/shared/services/matching.service.ts` - Person matching algorithm
- `packages/server/src/components/auth/controllers/auth.controller.ts` - Login, signup, logout, password reset
- `packages/server/src/components/auth/services/auth.service.ts` - Auth business logic (HTTP-agnostic)
- `packages/server/src/components/auth/routes/auth.routes.ts` - Auth endpoint definitions
- `packages/server/src/components/auth/validation/auth.validation.ts` - Auth Zod schemas
- `packages/server/src/components/auth/errors/auth.errors.ts` - Auth domain errors
- `packages/server/src/components/users/controllers/users.controller.ts` - User CRUD, profile, admin user management
- `packages/server/src/components/users/services/users.service.ts` - User business logic
- `packages/server/src/components/users/routes/users.routes.ts` - User endpoint definitions
- `packages/server/src/components/users/validation/users.validation.ts` - User Zod schemas
- `packages/server/src/components/trees/controllers/trees.controller.ts` - Tree CRUD, stats, activity
- `packages/server/src/components/trees/services/trees.service.ts` - Tree business logic
- `packages/server/src/components/trees/routes/trees.routes.ts` - Tree endpoint definitions
- `packages/server/src/components/trees/validation/trees.validation.ts` - Tree Zod schemas
- `packages/server/src/components/persons/controllers/persons.controller.ts` - Person CRUD, relationships
- `packages/server/src/components/persons/services/persons.service.ts` - Person business logic
- `packages/server/src/components/persons/services/relationship.service.ts` - Relationship logic + validation
- `packages/server/src/components/persons/routes/persons.routes.ts` - Person endpoint definitions
- `packages/server/src/components/persons/validation/persons.validation.ts` - Person Zod schemas
- `packages/server/src/components/claims/controllers/claims.controller.ts` - Claim CRUD, approve/reject
- `packages/server/src/components/claims/services/claims.service.ts` - Claim business logic + auto-approve
- `packages/server/src/components/claims/routes/claims.routes.ts` - Claim endpoint definitions
- `packages/server/src/components/claims/validation/claims.validation.ts` - Claim Zod schemas
- `packages/server/src/components/merge/controllers/merge.controller.ts` - Merge proposals, comparison
- `packages/server/src/components/merge/services/merge.service.ts` - Merge business logic
- `packages/server/src/components/merge/routes/merge.routes.ts` - Merge endpoint definitions
- `packages/server/src/components/merge/validation/merge.validation.ts` - Merge Zod schemas
- `packages/server/src/components/notifications/controllers/notifications.controller.ts` - Notification list, mark read
- `packages/server/src/components/notifications/services/notifications.service.ts` - Notification query logic
- `packages/server/src/components/notifications/routes/notifications.routes.ts` - Notification endpoints
- `packages/server/src/components/audit/controllers/audit.controller.ts` - Audit revert endpoint
- `packages/server/src/components/audit/services/audit-revert.service.ts` - Revert change business logic
- `packages/server/src/components/audit/routes/audit.routes.ts` - Audit endpoint definitions
- `packages/server/src/components/admin/controllers/admin.controller.ts` - Admin dashboard, verification queue, moderation
- `packages/server/src/components/admin/services/admin.service.ts` - Admin business logic
- `packages/server/src/components/admin/routes/admin.routes.ts` - Admin endpoint definitions
- `packages/server/src/components/admin/validation/admin.validation.ts` - Admin Zod schemas

**Frontend (`packages/web/`):**
- `packages/web/vite.config.ts` - Vite config with PWA plugin
- `packages/web/src/app/App.tsx` - Root app with router, providers, error boundaries
- `packages/web/src/app/routes.tsx` - Route definitions with lazy loading
- `packages/web/src/components/ui/*.tsx` - shadcn/ui components
- `packages/web/src/lib/utils.ts` - cn() utility
- `packages/web/src/shared/contexts/AuthContext.tsx` - Auth provider + useAuth hook
- `packages/web/src/styles/theme.css` - Banyan theme CSS custom properties
- `packages/web/src/shared/services/api.ts` - API client with ApiError class
- `packages/web/src/shared/components/Layout.tsx` - Authenticated layout (sidebar/header/bottom nav)
- `packages/web/src/shared/components/MobileBottomNav.tsx` - Fixed bottom nav for mobile
- `packages/web/src/shared/components/NotificationBell.tsx` - Header notification bell
- `packages/web/src/shared/components/ProtectedRoute.tsx` - Auth + role guard
- `packages/web/src/shared/components/InstallPrompt.tsx` - Smart PWA install banner
- `packages/web/src/shared/components/UpdatePrompt.tsx` - PWA update available prompt
- `packages/web/src/shared/components/OfflineFallback.tsx` - Offline page
- `packages/web/src/shared/hooks/useInstallPrompt.ts` - beforeinstallprompt hook
- `packages/web/src/features/landing/pages/LandingPage.tsx` - Public landing page
- `packages/web/src/features/auth/pages/LoginPage.tsx` - Login form
- `packages/web/src/features/auth/pages/SignupPage.tsx` - Signup form
- `packages/web/src/features/auth/pages/ForgotPasswordPage.tsx` - Password reset request
- `packages/web/src/features/auth/pages/ResetPasswordPage.tsx` - Set new password
- `packages/web/src/features/auth/components/containers/LoginFormContainer.tsx` - Login data fetching
- `packages/web/src/features/auth/components/containers/SignupFormContainer.tsx` - Signup data fetching
- `packages/web/src/features/auth/hooks/useAuth.ts` - Auth TanStack Query hooks
- `packages/web/src/features/onboarding/pages/OnboardingWizardPage.tsx` - Guided tree building wizard
- `packages/web/src/features/onboarding/components/WizardStepSelf.tsx` - Step 1: Add yourself
- `packages/web/src/features/onboarding/components/WizardStepParents.tsx` - Step 2: Add parents
- `packages/web/src/features/onboarding/components/WizardStepFamily.tsx` - Step 3: Spouse/siblings
- `packages/web/src/features/onboarding/components/WizardStepTreeName.tsx` - Step 4: Name tree
- `packages/web/src/features/onboarding/components/MatchResults.tsx` - Matching results display
- `packages/web/src/features/onboarding/components/WizardProgress.tsx` - Progress bar
- `packages/web/src/features/profile/pages/ProfilePage.tsx` - User profile + settings
- `packages/web/src/features/profile/components/ChangePasswordForm.tsx` - Change password
- `packages/web/src/features/profile/components/AadhaarUpload.tsx` - Aadhaar photo upload
- `packages/web/src/features/profile/components/VerificationStatus.tsx` - Verification badge/status
- `packages/web/src/features/trees/pages/TreeViewPage.tsx` - Interactive tree visualization
- `packages/web/src/features/trees/pages/TreeSearchPage.tsx` - Search with autocomplete
- `packages/web/src/features/trees/pages/TreeOverviewPage.tsx` - Tree overview + stats
- `packages/web/src/features/trees/components/containers/TreeVisualizationContainer.tsx` - Tree data fetching
- `packages/web/src/features/trees/components/TreeCanvas.tsx` - Tree graph rendering (D3/cytoscape)
- `packages/web/src/features/trees/components/TreeNode.tsx` - Individual node rendering
- `packages/web/src/features/trees/components/TreeControls.tsx` - View mode toggle, zoom controls
- `packages/web/src/features/trees/components/TreeStatsCard.tsx` - Statistics card
- `packages/web/src/features/trees/components/TreeActivityFeed.tsx` - Activity feed
- `packages/web/src/features/trees/components/TreeListView.tsx` - Accessible list/table alternative
- `packages/web/src/features/trees/components/SearchAutocomplete.tsx` - Typeahead search
- `packages/web/src/features/trees/components/SearchFilterChips.tsx` - Gotra/size filters
- `packages/web/src/features/trees/hooks/useTree.ts` - Tree TanStack Query hooks
- `packages/web/src/features/trees/hooks/useTreeSearch.ts` - Search hooks with debounce
- `packages/web/src/features/persons/components/PersonDetailDrawer.tsx` - Person detail side panel/drawer
- `packages/web/src/features/persons/components/RelationshipSlots.tsx` - Visual relationship slots
- `packages/web/src/features/persons/components/PersonMiniCard.tsx` - Mini card for slots
- `packages/web/src/features/persons/components/PersonTimeline.tsx` - Timeline tab
- `packages/web/src/features/persons/components/AddPersonForm.tsx` - Add/edit person form
- `packages/web/src/features/persons/hooks/usePerson.ts` - Person TanStack Query hooks
- `packages/web/src/features/claims/pages/ClaimReviewPage.tsx` - Review pending claims
- `packages/web/src/features/claims/components/ClaimRequestCard.tsx` - Individual claim card
- `packages/web/src/features/claims/hooks/useClaims.ts` - Claim TanStack Query hooks
- `packages/web/src/features/merge/pages/MergeProposalPage.tsx` - Merge review page
- `packages/web/src/features/merge/components/TreeComparisonView.tsx` - Side-by-side tree comparison
- `packages/web/src/features/merge/components/ConflictResolutionPanel.tsx` - Side-by-side conflict picker
- `packages/web/src/features/merge/components/MergeNodeMapper.tsx` - Drag-to-link node mapping
- `packages/web/src/features/merge/hooks/useMerge.ts` - Merge TanStack Query hooks
- `packages/web/src/features/notifications/components/NotificationPanel.tsx` - Notification dropdown
- `packages/web/src/features/notifications/components/NotificationGroup.tsx` - Grouped by tree
- `packages/web/src/features/notifications/hooks/useNotifications.ts` - Notification hooks
- `packages/web/src/features/admin/pages/AdminDashboardPage.tsx` - Admin dashboard
- `packages/web/src/features/admin/pages/AdminUsersPage.tsx` - User management table
- `packages/web/src/features/admin/pages/AdminVerificationPage.tsx` - Verification queue
- `packages/web/src/features/admin/pages/AdminTreesPage.tsx` - Tree oversight table
- `packages/web/src/features/admin/pages/AdminMergesPage.tsx` - Merge proposal oversight
- `packages/web/src/features/admin/pages/AdminDeletionsPage.tsx` - Deletion request queue
- `packages/web/src/features/admin/components/AdminSidebar.tsx` - Admin navigation
- `packages/web/src/features/admin/components/StatCard.tsx` - Dashboard stat card
- `packages/web/src/features/admin/hooks/useAdmin.ts` - Admin TanStack Query hooks

**Shared (`packages/shared/`):**
- `packages/shared/src/constants/roles.ts` - ROLE enum (user, admin)
- `packages/shared/src/constants/verification.ts` - Verification status enum
- `packages/shared/src/constants/relationships.ts` - Relationship type enum + labels
- `packages/shared/src/constants/claims.ts` - Claim status enum
- `packages/shared/src/constants/merge.ts` - Merge proposal status enum
- `packages/shared/src/constants/notifications.ts` - Notification type enum
- `packages/shared/src/types/auth.types.ts` - Auth shared types
- `packages/shared/src/types/tree.types.ts` - Tree shared types
- `packages/shared/src/types/person.types.ts` - Person shared types
- `packages/shared/src/types/claim.types.ts` - Claim shared types
- `packages/shared/src/types/merge.types.ts` - Merge shared types

**Docs:**
- `docs/openapi.yaml` - OpenAPI 3.0 specification

---

## Tasks

### Phase 1: Project Scaffolding & Infrastructure

- [x] 1.0 Initialize monorepo structure
  - [x] 1.1 Create root `package.json` with workspaces: `"packages/*"`, add dev dependencies (TypeScript 5.7, ESLint, Prettier, drizzle-kit, tsx, esbuild)
  - [x] 1.2 Create `packages/web/package.json` with React 18, Vite 6, Tailwind CSS 3.4, shadcn/ui (Radix UI), React Router DOM 7, TanStack React Query 5, React Hook Form, Zod, date-fns, Lucide icons, driver.js, clsx, tailwind-merge, class-variance-authority, react-error-boundary
  - [x] 1.3 Create `packages/server/package.json` with Express 4, Drizzle ORM, postgres driver, drizzle-zod, bcrypt, helmet, cors, cookie-parser, express-rate-limit, pino, pino-pretty, multer, zod
  - [x] 1.4 Create `packages/shared/package.json` with Zod
  - [x] 1.5 Create root `tsconfig.json` (strict mode, ES2022, path aliases: `@/*`, `@db/*`, `@shared/*`, `@server/*`)
  - [x] 1.6 Create `packages/web/tsconfig.json` extending root
  - [x] 1.7 Create `tailwind.config.js` with Banyan theme color tokens as CSS custom properties: primary (`#2E7D32`), secondary (`#E8F5E9`), accent (`#F9A825`), background (`#FAFAF5`), card (`#FFFFFF`), border (`#E0E4DD`), text-primary (`#1B2118`), text-muted (`#6B7A6B`), destructive (`#D32F2F`), warning (`#F57F17`). No dark mode. Animation extensions.
  - [x] 1.8 Create `postcss.config.mjs` with Tailwind and autoprefixer
  - [x] 1.9 Create `.prettierrc` (2 space, single quotes, trailing commas ES5, 100 char width)
  - [x] 1.10 Create `.eslintrc.js` with TypeScript support, React plugin, import ordering rules
  - [x] 1.11 Run `npm install` and verify workspace resolution

- [x] 2.0 Configure Vite & PWA
  - [x] 2.1 Create `packages/web/vite.config.ts` with React plugin, dev proxy `/api` -> localhost:3000, build output `../../dist/public`, path alias resolution
  - [x] 2.2 Add vite-plugin-pwa configuration: web app manifest (name: "Vansh", icons, theme color, standalone display), Workbox runtime caching (network-first for API, cache-first for static), offline fallback page
  - [x] 2.3 Create `packages/web/public/manifest.json` with app icons (192x192, 512x512), theme/background colors
  - [x] 2.4 Create `packages/web/src/shared/components/UpdatePrompt.tsx` - detect service worker update, show "Update Available" toast
  - [x] 2.5 Create `packages/web/src/shared/components/OfflineFallback.tsx` - meaningful offline page with Vansh branding
  - [x] 2.6 Verify PWA installability with Lighthouse check

- [x] 3.0 Database setup & core schemas
  - [x] 3.1 Create `db/index.ts` - postgres connection with pool (max 5), Pino logger for query debugging
  - [x] 3.2 Create `drizzle.config.ts` - PostgreSQL dialect, schema path `./db/schema`, migrations path `./db/migrations`, strict mode
  - [x] 3.3 Create `db/schema/enums.ts` - PostgreSQL enums: genderEnum, roleEnum, verificationStatusEnum, claimStatusEnum, mergeStatusEnum, relationshipTypeEnum (parent_child, spouse, step_parent_child, adoptive_parent_child, half_sibling — NOTE: in-law is derived at query time, not stored), auditActionEnum, deletionStatusEnum, treeMemberStatusEnum
  - [x] 3.4 Create `db/schema/auth.schema.ts` - `users` table (uuid PK, email unique, passwordHash, firstName, lastName, phone, role, verificationStatus, aadhaarPhotoKey, isActive, lastActiveAt, createdAt timestamptz with `{ withTimezone: true, mode: 'date' }`, updatedAt timestamptz), `sessions` table, `password_reset_tokens` table. Add indexes: email unique, role, verificationStatus, token unique
  - [x] 3.5 Create `db/schema/trees.schema.ts` - `trees` table (uuid PK, name, slug unique, createdById FK, memberCount, generationCount, createdAt timestamptz, updatedAt timestamptz), `tree_members` table (uuid PK, treeId FK, userId FK, joinedAt timestamptz, status enum). Add indexes: slug unique, (treeId, userId) unique compound
  - [x] 3.6 Create `db/schema/persons.schema.ts` - `persons` table (all fields per FRD REQ-PERSON-001, claimedByUserId nullable FK, createdAt/updatedAt timestamptz), `relationships` table (personId1/personId2 FKs, relationshipType enum, marriageDate/divorceDate nullable). Add indexes: treeId, (treeId, lastName) compound, (personId1, personId2) compound
  - [x] 3.7 Create `db/schema/claims.schema.ts` - `claims` table per FRD data model. Add indexes: personId, userId, status
  - [x] 3.8 Create `db/schema/merge.schema.ts` - `merge_proposals` and `merge_proposal_mappings` tables per FRD data model. Add indexes per FRD
  - [x] 3.9 Create `db/schema/audit.schema.ts` - `audit_logs` table with jsonb oldValue/newValue. Add indexes: (treeId, createdAt) compound
  - [x] 3.10 Create `db/schema/notifications.schema.ts` - `notifications` table with treeId (FK -> trees, nullable) for grouping. Add indexes: (userId, isRead) compound, (userId, treeId) compound
  - [x] 3.11 Create `db/schema/moderation.schema.ts` - `deletion_requests` table. Add indexes: status, treeId
  - [x] 3.12 Create `db/schema/index.ts` - barrel re-export of all schemas
  - [ ] 3.13 Run `drizzle-kit generate` to create initial migration
  - [ ] 3.14 Run migration against local PostgreSQL, verify all tables created with `psql` check

- [x] 4.0 Express server setup & middleware
  - [x] 4.1 Create `packages/server/index.ts` - Express app with helmet, cors (credentials: true), cookie-parser, JSON body parser, Pino request logging
  - [x] 4.2 Create `packages/server/src/middleware/error.middleware.ts` - global error handler converting domain errors to RFC 9457 Problem Details format (Content-Type: application/problem+json)
  - [x] 4.3 Create `packages/server/src/shared/errors/base.error.ts` - base DomainError class with type, title, status, detail properties
  - [x] 4.4 Create shared error classes: NotFoundError, ConflictError, UnauthorizedError, ForbiddenError, ValidationError (all extending DomainError)
  - [x] 4.5 Create `packages/server/src/middleware/validate.middleware.ts` - Zod schema validation middleware for body, query, params (returns RFC 9457 validation errors with JSON Pointer format `/body/fieldName`)
  - [x] 4.6 Create `packages/server/src/middleware/rate-limit.middleware.ts` - configurable rate limiter for auth endpoints
  - [x] 4.7 Create `packages/server/src/middleware/cache.middleware.ts` - default `no-store` for `/api/*`, configurable `cacheControl()` for route-level overrides
  - [x] 4.8 Create `packages/server/src/middleware/sanitize.middleware.ts` - input sanitization middleware to strip HTML/script tags from string inputs (XSS prevention). Apply to all POST/PATCH request bodies.
  - [x] 4.9 Create `packages/server/vite.ts` - static asset serving with `Cache-Control`: `no-cache` for index.html, `immutable` for hashed assets, SPA fallback route
  - [x] 4.10 Verify server starts with `npm run dev`, test error middleware with curl returning RFC 9457 format

- [x] 5.0 Frontend shell & shared infrastructure
  - [x] 5.1 Initialize shadcn/ui: create `packages/web/src/components/ui/` with Button, Input, Label, Card, Dialog, Drawer, Tabs, Badge, Avatar, Toast, Toaster, Select, Checkbox, Switch, Dropdown Menu, Tooltip, Skeleton
  - [x] 5.2 Create `packages/web/src/lib/utils.ts` with `cn()` utility (clsx + tailwind-merge)
  - [x] 5.3 Create `packages/web/src/shared/services/api.ts` - centralized fetch wrapper with credentials, ApiError class parsing RFC 9457 responses
  - [x] 5.4 Create `packages/web/src/styles/theme.css` - define Banyan theme CSS custom properties (all color tokens from Section 13 of FRD). Import in main entry point.
  - [x] 5.5 Create `packages/web/src/shared/components/Layout.tsx` - authenticated layout with header (logo, My Tree link, notification bell, profile dropdown), responsive sidebar for desktop/tablet
  - [x] 5.6 Create `packages/web/src/shared/components/MobileBottomNav.tsx` - fixed bottom nav (Home, My Tree, Search, Notifications, Profile) shown only < 768px, 44x44px touch targets, safe area padding, active route highlighting
  - [x] 5.7 Create `packages/web/src/shared/components/ProtectedRoute.tsx` - auth guard + optional role check (admin)
  - [x] 5.8 Create `packages/web/src/app/App.tsx` - React Router, TanStack QueryClientProvider (10s global staleTime), ErrorBoundary wrapping
  - [x] 5.9 Create `packages/web/src/app/routes.tsx` - route definitions with lazy loading: `/` (landing), `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/onboarding`, `/profile`, `/trees`, `/trees/:slug`, `/trees/:slug/overview`, `/claims/:id`, `/merge/:id`, `/admin/*`
  - [x] 5.10 Verify app renders at localhost:5173 with Banyan theme colors applied, mobile bottom nav visible at 375px, hidden at 768px+
  - [x] 5.11 Run `npm run check` to verify TypeScript compiles cleanly

- [x] 6.0 Shared constants & types
  - [x] 6.1 Create `packages/shared/src/constants/roles.ts` - `ROLE` object: `{ USER: 'user', ADMIN: 'admin' }` + `ROLES` array
  - [x] 6.2 Create `packages/shared/src/constants/verification.ts` - verification status enum + labels
  - [x] 6.3 Create `packages/shared/src/constants/relationships.ts` - relationship type enum, labels, line style config (solid/dashed/color per type)
  - [x] 6.4 Create `packages/shared/src/constants/claims.ts` - claim status enum + labels
  - [x] 6.5 Create `packages/shared/src/constants/merge.ts` - merge proposal status enum + labels
  - [x] 6.6 Create `packages/shared/src/constants/notifications.ts` - notification type enum + labels
  - [x] 6.7 Create shared type files: `auth.types.ts`, `tree.types.ts`, `person.types.ts`, `claim.types.ts`, `merge.types.ts`

- [x] 7.0 UI Testing - Phase 1 (depends: 2.0, 5.0)
  - [x] 7.1 Navigate to `/`, verify landing page placeholder renders
  - [x] 7.2 Verify mobile bottom nav appears at 375px, hidden at 768px+
  - [x] 7.3 Verify Banyan theme colors render correctly (green primary, gold accent, warm off-white background)
  - [x] 7.4 Verify offline fallback page appears when network disabled (PWA)
  - [x] 7.5 Navigate to `/login`, verify ProtectedRoute redirects unauthenticated users

---

### Phase 2: Authentication & User Profile

- [x] 8.0 Auth backend - signup, login, logout
  - [x] 8.1 Create `packages/server/src/components/auth/validation/auth.validation.ts` - Zod schemas: signupSchema (email, password min 8, firstName, lastName), loginSchema (email, password), forgotPasswordSchema (email), resetPasswordSchema (token, newPassword)
  - [x] 8.2 Create `packages/server/src/components/auth/errors/auth.errors.ts` - EmailAlreadyExistsError, InvalidCredentialsError, SessionExpiredError, InvalidResetTokenError
  - [x] 8.3 Create `packages/server/src/components/auth/services/auth.service.ts` (HTTP-agnostic): `signup()` - hash password with bcrypt, check email uniqueness, insert user, create session, return { user, sessionToken }. `login()` - verify credentials, create session. `logout()` - delete session. `createResetToken()` - generate crypto random token, store with 1hr expiry. `resetPassword()` - validate token, hash new password, mark token used. All throw domain errors, no req/res.
  - [x] 8.4 Create `packages/server/src/middleware/auth.middleware.ts` - `requireAuth`: read session token from cookie, validate in DB, check expiry, attach user to `req.user`. `requireAdmin`: check `req.user.role === ROLE.ADMIN`
  - [x] 8.5 Create `packages/server/src/components/auth/controllers/auth.controller.ts` - thin coordinator: call service, set/clear cookie, return response. No try-catch.
  - [x] 8.6 Create `packages/server/src/components/auth/routes/auth.routes.ts` - `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET /api/auth/me` (current user + permissions)
  - [x] 8.7 Apply rate limiting: 5 req/min on signup, login, forgot-password endpoints
  - [x] 8.8 Create `db/seed.ts` - seed admin user (email: admin@vansh.app, role: admin)
  - [x] 8.9 Verify all auth endpoints with curl tests: signup, login, me, logout, forgot-password, reset-password. Verify RFC 9457 errors for duplicate email, wrong password, expired token
  - [x] 8.10 Run `npm run check` to verify types

- [x] 9.0 Auth frontend - login, signup, forgot password
  - [x] 9.1 Create `packages/web/src/shared/contexts/AuthContext.tsx` - AuthProvider with TanStack Query for `/api/auth/me`, expose `useAuth()` hook returning { user, isLoading, isAuthenticated, login, signup, logout }
  - [x] 9.2 Create `packages/web/src/features/auth/pages/LoginPage.tsx` - mobile-first login form (React Hook Form + Zod), email/password inputs with proper `type`, `autocomplete`, `spellCheck={false}` on email, inline field errors from RFC 9457, submit button with spinner, link to signup and forgot-password
  - [x] 9.3 Create `packages/web/src/features/auth/pages/SignupPage.tsx` - signup form: firstName, lastName, email, password, confirm password. Same form rules as login. On success redirect to onboarding wizard
  - [x] 9.4 Create `packages/web/src/features/auth/pages/ForgotPasswordPage.tsx` - email input, submit generates token, display token/link in-app (no email service)
  - [x] 9.5 Create `packages/web/src/features/auth/pages/ResetPasswordPage.tsx` - token from URL param, new password + confirm, submit resets password, redirect to login
  - [x] 9.6 Update `routes.tsx` - redirect authenticated users from `/login`, `/signup` to `/` (dashboard). Redirect `/` to `/trees` for authenticated users
  - [x] 9.7 Run `npm run check` to verify types

- [x] 10.0 User profile & password change
  - [x] 10.1 Create `packages/server/src/components/users/services/users.service.ts` (HTTP-agnostic) - `getProfile()`, `updateProfile()` (audit log changes), `changePassword()` (verify current, hash new), `getUserById()`. Paginated `listUsers()` for admin.
  - [x] 10.2 Create `packages/server/src/components/users/controllers/users.controller.ts` - thin coordinators calling service
  - [x] 10.3 Create `packages/server/src/components/users/validation/users.validation.ts` - updateProfileSchema, changePasswordSchema, listUsersSchema (page, limit, search, role filter, verification filter)
  - [x] 10.4 Create `packages/server/src/components/users/routes/users.routes.ts` - `GET /api/users/profile`, `PATCH /api/users/profile`, `POST /api/users/change-password`, `GET /api/users` (admin, paginated), `GET /api/users/:id` (admin)
  - [x] 10.5 Create `packages/web/src/features/profile/pages/ProfilePage.tsx` - mobile-first profile page with tabs: Details, Security, Verification. Details tab: edit name/email/phone/photo. Security tab: change password form. Verification tab: Aadhaar upload + status display.
  - [x] 10.6 Create `packages/web/src/features/profile/components/ChangePasswordForm.tsx` - current password, new password, confirm new password. React Hook Form + Zod. Inline errors.
  - [x] 10.7 Verify profile update and password change with curl, verify audit log entry created
  - [x] 10.8 Run `npm run check` to verify types

- [x] 11.0 Aadhaar verification upload
  - [x] 11.1 Create `packages/server/src/shared/services/file.service.ts` - file upload to local filesystem (`uploads/` directory), generate unique file key, return key. File validation: JPG/PNG only, max 5MB. Aadhaar photos must be encrypted at rest (AES-256 encryption before writing to disk, decrypt on read). Serve Aadhaar files only to admin users; person photos are public.
  - [x] 11.2 Add to users service: `uploadAadhaar()` - save file, update user verificationStatus to `pending`, create notification for admins. `getAadhaarPhoto()` - admin only, return file stream.
  - [x] 11.3 Add routes: `POST /api/users/verification/upload` (multer middleware, auth required), `GET /api/users/:id/aadhaar` (admin only)
  - [x] 11.4 Create `packages/web/src/features/profile/components/AadhaarUpload.tsx` - drag-and-drop or click upload, file type/size validation client-side, preview thumbnail, upload progress, status display (unverified/pending/verified/rejected with reason)
  - [x] 11.5 Create `packages/web/src/features/profile/components/VerificationStatus.tsx` - badge showing current status, rejection reason if applicable
  - [x] 11.6 Verify upload flow with curl, verify file saved and user status updated to pending

- [x] 12.0 UI Testing - Phase 2 (depends: 8.0, 9.0, 10.0, 11.0)
  - [x] 12.1 Navigate to `/signup`, fill form, submit, verify redirect to onboarding
  - [x] 12.2 Navigate to `/login`, login with created user, verify redirect to dashboard
  - [x] 12.3 Test login with wrong password, verify RFC 9457 inline error
  - [x] 12.4 Navigate to `/profile`, update name, verify toast success
  - [x] 12.5 Change password, logout, login with new password
  - [x] 12.6 Upload Aadhaar photo, verify status changes to "pending"
  - [x] 12.7 Test all forms at 375px mobile viewport, verify responsive layout
  - [x] 12.8 Test forgot-password flow end-to-end

---

### Phase 3: Trees, Persons & Relationships

- [x] 13.0 Tree backend - CRUD, stats, search
  - [x]   - [x] 13.1 Create `packages/server/src/components/trees/services/trees.service.ts` (HTTP-agnostic) - `createTree()` (generate slug, add creator as tree_member), `getTreeBySlug()`, `updateTree()` (verified member check), `listTrees()` (paginated, searchable by name/gotra), `getTreeStats()` (member count, living/deceased, generation span, common gotra, oldest/youngest), `getTreeActivity()` (paginated audit logs for tree). All queries use specific column selects and joins (no N+1).
  - [x]   - [x] 13.2 Create `packages/server/src/components/trees/validation/trees.validation.ts` - createTreeSchema, updateTreeSchema, listTreesSchema (page, limit, search, gotra filter), getTreeBySlugSchema
  - [x]   - [x] 13.3 Create `packages/server/src/components/trees/controllers/trees.controller.ts` - thin coordinators
  - [x]   - [x] 13.4 Create `packages/server/src/components/trees/routes/trees.routes.ts` - `POST /api/trees`, `GET /api/trees` (paginated, public, rate-limited: 30 req/min on search), `GET /api/trees/:slug`, `PATCH /api/trees/:slug`, `GET /api/trees/:slug/stats`, `GET /api/trees/:slug/activity` (paginated), `GET /api/trees/:slug/members`
  - [x]   - [x] 13.5 Verify all tree endpoints with curl tests, verify pagination format `{ items, pagination: { page, limit, total, totalPages } }`

- [x] - [x] 14.0 Person backend - CRUD with audit logging
  - [x]   - [x] 14.1 Create `packages/server/src/shared/services/audit.service.ts` - `logChange()` accepting treeId, personId, userId, action, entityType, entityId, oldValue, newValue. Used by all services that modify data.
  - [x]   - [x] 14.1b Create `packages/server/src/shared/services/notification.service.ts` (HTTP-agnostic) - `createNotification()` accepting userId, treeId, type, title, message, linkUrl. Batch `createNotificationsForTreeMembers()` to notify all verified members of a tree. Moved here from Phase 5 because person/tree services need it for edit notifications (REQ-NOTIF-002).
  - [x]   - [x] 14.2 Create `packages/server/src/components/persons/services/persons.service.ts` (HTTP-agnostic) - `addPerson()` (verify user is verified tree member, insert person, audit log), `updatePerson()` (diff old/new values, audit log each changed field), `getPerson()` with relationships, `listPersonsByTree()` (paginated), `requestDeletion()` (create deletion_request, notify admins). Transactions in service only.
  - [x]   - [x] 14.3 Create `packages/server/src/components/persons/validation/persons.validation.ts` - createPersonSchema (all fields per FRD, firstName/lastName required, gender enum, dates as z.coerce.date()), updatePersonSchema (partial), deleteRequestSchema (reason required)
  - [x]   - [x] 14.4 Create `packages/server/src/components/persons/controllers/persons.controller.ts` - thin coordinators
  - [x]   - [x] 14.5 Create `packages/server/src/components/persons/routes/persons.routes.ts` - `POST /api/trees/:slug/persons`, `GET /api/trees/:slug/persons` (paginated), `GET /api/persons/:id`, `PATCH /api/persons/:id`, `POST /api/persons/:id/delete-request`, `GET /api/persons/:id/timeline` (audit logs + life events, paginated)
  - [x]   - [x] 14.6 Verify with curl: add person to tree, update person, verify audit log entries created

- [x] - [x] 15.0 Relationship backend - CRUD with validation
  - [x]   - [x] 15.1 Create `packages/server/src/components/persons/services/relationship.service.ts` (HTTP-agnostic) - `addRelationship()` (validate: no self-reference, no circular parents, no duplicate relationship, persons in same tree), `removeRelationship()`, `getRelationshipsForPerson()` (includes derived relationships), `deriveSiblings()` (compute siblings from shared parents), `deriveInLaws()` (compute in-law relationships from spouse+parent links at query time — not stored in DB). Circular parent chain detection via recursive CTE or iterative parent traversal.
  - [x]   - [x] 15.2 Add validation schemas for relationship: createRelationshipSchema (personId1, personId2, relationshipType enum, optional marriageDate/divorceDate as z.coerce.date())
  - [x]   - [x] 15.3 Add routes: `POST /api/trees/:slug/relationships`, `DELETE /api/relationships/:id`, `GET /api/persons/:id/relationships`
  - [x]   - [x] 15.4 Verify with curl: add parent-child, add spouse with marriage date, attempt circular relationship (expect RFC 9457 error), attempt self-reference (expect error)

- [x] - [x] 16.0 File upload for person photos
  - [x]   - [x] 16.1 Extend file.service.ts to handle person photo uploads (JPG/PNG/WebP, max 5MB)
  - [x]   - [x] 16.2 Add route: `POST /api/persons/:id/photo` (multer, verified member check), `GET /api/persons/:id/photo` (public)
  - [x]   - [x] 16.3 Verify photo upload and retrieval with curl

- [x] - [x] 17.0 Tree visualization frontend
  - [x]   - [x] 17.1 Select and install graph visualization library (D3.js with d3-hierarchy for tree layouts, or cytoscape.js for interactive graph). Decision: use D3.js for maximum control over radial/top-down/left-right layouts.
  - [x]   - [x] 17.2 Create `packages/web/src/features/trees/hooks/useTree.ts` - TanStack Query hooks: `useTree(slug)`, `useTreePersons(slug)`, `useTreeStats(slug)`, `useTreeActivity(slug)`, mutations for create/update tree. Parse dates on entry per react rules.
  - [x]   - [x] 17.3 Create `packages/web/src/features/trees/components/TreeCanvas.tsx` - D3-based tree rendering: accepts persons + relationships data, renders nodes + edges on SVG/canvas. Support zoom (d3-zoom) and pan with mouse/touch gestures. Implement three layout algorithms: radial (d3.tree with polar coordinates), top-down (d3.tree vertical), left-right (d3.tree horizontal).
  - [x]   - [x] 17.4 Create `packages/web/src/features/trees/components/TreeNode.tsx` - individual node: photo (or avatar with initials), full name, birth-death years, verified badge, deceased grayscale styling. 44x44px minimum touch target.
  - [x]   - [x] 17.5 Create `packages/web/src/features/trees/components/TreeControls.tsx` - view mode toggle (radial/top-down/left-right), zoom in/out/reset buttons, collapse/expand toggle. Mobile-first: floating controls overlay.
  - [x]   - [x] 17.6 Implement relationship line styling per FRD REQ-VIZ-008: solid for biological, dashed for step/adoptive, colored for spouse. Use shared constants for line config.
  - [x]   - [x] 17.7 Implement node click -> re-center animation (smooth transition to clicked node as focal point, especially in radial view)
  - [x]   - [x] 17.8 Implement branch collapse/expand: click expand icon on node to toggle subtree visibility
  - [x]   - [x] 17.9 Create `packages/web/src/features/trees/components/containers/TreeVisualizationContainer.tsx` - data fetching container, passes data to TreeCanvas. Loading: skeleton. Error: error boundary.
  - [x]   - [x] 17.10 Create `packages/web/src/features/trees/pages/TreeViewPage.tsx` - page component orchestrating TreeVisualizationContainer + PersonDetailDrawer + TreeControls. Responsive: full-screen tree on mobile with floating controls, side panel on desktop.
  - [x]   - [x] 17.11 Create `packages/web/src/features/trees/components/TreeListView.tsx` - accessible alternative table view: sortable columns (name, DOB, gotra, relationships), expandable rows for details. Virtualized if >50 rows. Toggle between tree/list view.
  - [x]   - [x] 17.12 Performance: test with 500+ mock nodes, implement progressive loading for large trees (render 3 generations initially, expand on demand)
  - [x]   - [x] 17.13 Run `npm run check` to verify types

- [x] - [x] 18.0 Person detail drawer & relationship slots
  - [x]   - [x] 18.1 Create `packages/web/src/features/persons/hooks/usePerson.ts` - TanStack Query hooks: `usePerson(id)`, `usePersonRelationships(id)`, `usePersonTimeline(id)`, mutations for add/update person, add/remove relationship. Parse dates on entry.
  - [x]   - [x] 18.2 Create `packages/web/src/features/persons/components/PersonMiniCard.tsx` - presentational: photo thumbnail (40x40), name, birth year. Clickable.
  - [x]   - [x] 18.3 Create `packages/web/src/features/persons/components/RelationshipSlots.tsx` - presentational: renders Father/Mother/Spouse/Children/Siblings sections. Filled slots show PersonMiniCard, empty slots show "Add [Type]" button. Relationship type icon/label per slot.
  - [x]   - [x] 18.4 Create `packages/web/src/features/persons/components/PersonTimeline.tsx` - vertical timeline with dots: life events (Born, Married, Children, Died) + audit events. Different colors for life vs audit. Scrollable, mobile-full-width.
  - [x]   - [x] 18.5 Create `packages/web/src/features/persons/components/PersonDetailDrawer.tsx` - Drawer on mobile (bottom sheet), side panel on desktop. Two tabs: "Details" (all person fields + RelationshipSlots) and "Timeline". Edit button for verified members. "This is me" claim button for unclaimed nodes.
  - [x]   - [x] 18.6 Create `packages/web/src/features/persons/components/AddPersonForm.tsx` - React Hook Form + Zod. Pre-filled relationship type when opened from a slot. All inputs: proper `type`, `autocomplete`, `name` attributes. Inline duplicate suggestions (debounced search as user types name). Photo upload optional. Mobile-first single column layout.
  - [x]   - [x] 18.7 Wire person drawer to tree node clicks in TreeViewPage
  - [x]   - [x] 18.8 Run `npm run check` to verify types

- [x] - [x] 19.0 Tree overview, stats & search
  - [x]   - [x] 19.1 Create `packages/web/src/features/trees/pages/TreeOverviewPage.tsx` - tree name, description, TreeStatsCard, verified members list, activity feed, "Join this tree" button, share URL copy button
  - [x]   - [x] 19.2 Create `packages/web/src/features/trees/components/TreeStatsCard.tsx` - presentational: total members, living/deceased, generation span, common gotra, oldest/youngest. Collapsible on mobile. Mini tree silhouette visualization.
  - [x]   - [x] 19.3 Create `packages/web/src/features/trees/components/TreeActivityFeed.tsx` - paginated list of recent changes. Each item: user avatar, action description, timestamp (date-fns format). Virtualize if >50 items.
  - [x]   - [x] 19.4 Create `packages/web/src/features/trees/hooks/useTreeSearch.ts` - debounced search hook (300ms), TanStack Query with search param
  - [x]   - [x] 19.5 Create `packages/web/src/features/trees/components/SearchAutocomplete.tsx` - typeahead input showing person names + tree names as user types. Visual distinction (icon/label) between person results and tree results.
  - [x]   - [x] 19.6 Create `packages/web/src/features/trees/components/SearchFilterChips.tsx` - filter by gotra (dropdown), tree size (small <50, medium 50-200, large 200+). Chips below search input.
  - [x]   - [x] 19.7 Create `packages/web/src/features/trees/pages/TreeSearchPage.tsx` - SearchAutocomplete + SearchFilterChips + results grid. Empty state: "Browse popular trees" with largest/most active. Recent searches from localStorage (max 5). Results as tree cards (name, member count, gotra, mini preview).
  - [x]   - [x] 19.8 Run `npm run check` to verify types

- [x] - [x] 20.0 UI Testing - Phase 3 (depends: 13.0-19.0)
  - [x]   - [x] 20.1 Create a tree, add 5+ persons with relationships, verify tree renders in all 3 views
  - [x]   - [x] 20.2 Click a tree node, verify person detail drawer opens with correct data and relationship slots
  - [x]   - [x] 20.3 Add a person from an empty relationship slot, verify pre-filled relationship type
  - [x]   - [x] 20.4 Test duplicate detection inline suggestions when adding a person
  - [x]   - [x] 20.5 Switch between tree view and list view, verify data consistency
  - [x]   - [x] 20.6 Navigate to tree overview, verify stats card shows correct counts
  - [x]   - [x] 20.7 Test tree search with autocomplete, filter by gotra
  - [x]   - [x] 20.8 Test person timeline tab shows chronological events
  - [x]   - [x] 20.9 Attempt to add circular relationship (A parent of B, B parent of A), verify error
  - [x]   - [x] 20.10 Test all views at 375px (mobile), 768px (tablet), 1024px (desktop)
  - [x]   - [x] 20.11 Copy share URL, open in incognito, verify public read-only view

---

### Phase 4: Landing Page, Onboarding Wizard & Tour

- [x] 21.0 Landing page
  - [x] 21.1 Create `packages/web/src/features/landing/pages/LandingPage.tsx` - mobile-first: hero section with app name "Vansh" + tagline "Preserve your family's legacy", feature highlights (3 cards: visual tree, collaboration, merging), CTA buttons (Sign Up primary, Browse Trees secondary), sample tree screenshot/illustration, login link in header. Responsive: single column mobile, multi-column desktop.
  - [x] 21.2 Add redirect logic: authenticated users visiting `/` -> `/trees` (or onboarding if no tree)
  - [x] 21.3 Run `npm run check`

- [x] 22.0 Onboarding wizard backend
  - [x] 22.1 Create `packages/server/src/shared/services/matching.service.ts` (HTTP-agnostic) - `findMatches(personData)`: fuzzy name match (Levenshtein or trigram), DOB exact match, gotra exact match, parent name overlap. Weighted scoring: name 30%, DOB 25%, gotra 20%, parent overlap 25%. Return matches above threshold with confidence score. Query persons table with indexed search.
  - [x] 22.2 Add route: `POST /api/matching/search` - accepts { firstName, lastName, dateOfBirth, gotra, parentNames[] }, returns matched persons with tree info and confidence scores. Rate limit: 10 req/min.
  - [x] 22.3 Add to trees service: `createTreeFromWizard()` - transaction: create tree, add person (self), add parent persons, add relationships, add user as tree_member. All in service-level transaction.
  - [x] 22.4 Verify matching endpoint with curl: add test data, search, verify weighted scoring

- [x] 23.0 Onboarding wizard frontend
  - [x] 23.1 Create `packages/web/src/features/onboarding/components/WizardProgress.tsx` - progress bar showing 4 steps, current step highlighted, step labels
  - [x] 23.2 Create `packages/web/src/features/onboarding/components/WizardStepSelf.tsx` - React Hook Form: firstName, lastName, gender, DOB (date picker), gotra, photo (optional). Mobile-first single column.
  - [x] 23.3 Create `packages/web/src/features/onboarding/components/WizardStepParents.tsx` - two cards side by side (stacked on mobile): Father (name, DOB optional), Mother (name, DOB optional). Skip button.
  - [x] 23.4 Create `packages/web/src/features/onboarding/components/WizardStepFamily.tsx` - optional: add spouse (name, DOB, marriage date), add siblings (dynamic list, add/remove). Skip button.
  - [x] 23.5 Create `packages/web/src/features/onboarding/components/WizardStepTreeName.tsx` - tree name input with auto-suggestion (e.g., "[LastName] Family"), submit button "Create My Tree"
  - [x] 23.6 Create `packages/web/src/features/onboarding/components/MatchResults.tsx` - display matched trees/persons: tree name, matched person details, confidence %. "This is me" confirm button, "Not me" dismiss button per match.
  - [x] 23.7 Create `packages/web/src/features/onboarding/pages/OnboardingWizardPage.tsx` - orchestrates wizard steps. After Step 2 calls matching API. If matches found, shows MatchResults before Step 3/4. On confirm match -> create claim. On no match -> proceed to Step 4 -> createTreeFromWizard. Save partial progress to localStorage. "Come back later" link.
  - [x] 23.8 Run `npm run check`

- [x] 24.0 Onboarding tour
  - [x] 24.1 Install and configure driver.js
  - [x] 24.2 Create tour configuration: 5 steps highlighting tree canvas, view controls, add person button, share link, profile/verification. Dismissible, shown once (localStorage flag).
  - [x] 24.3 Trigger tour after tree creation (redirect from wizard to tree view with `?tour=1` param)
  - [x] 24.4 Add "Help" / "?" button in header to re-trigger tour

- [x] 25.0 Smart PWA install prompt
  - [x] 25.1 Create `packages/web/src/shared/hooks/useInstallPrompt.ts` - capture `beforeinstallprompt` event, track visit count (localStorage), track if user has added first family member
  - [x] 25.2 Create `packages/web/src/shared/components/InstallPrompt.tsx` - banner: "Install Vansh for quick access to your family tree" with Install + Dismiss buttons. Show only on mobile/tablet, after 2nd visit or first family member added. Hide permanently after 2 dismissals (localStorage). Use `beforeinstallprompt` for native install.
  - [x] 25.3 Wire into Layout component, conditionally render

- [x] 26.0 UI Testing - Phase 4 (depends: 21.0-25.0)
  - [x] 26.1 Visit `/` as unauthenticated user, verify landing page renders with CTA
  - [x] 26.2 Click "Sign Up", complete signup, verify redirect to onboarding wizard
  - [x] 26.3 Complete wizard steps 1-4, verify tree created with persons and relationships
  - [x] 26.4 Verify onboarding tour appears after tree creation, dismiss it
  - [x] 26.5 Re-trigger tour from Help button
  - [x] 26.6 Test wizard with matching: seed a tree, signup new user with similar data, verify match suggestions appear after Step 2
  - [x] 26.7 Test "Skip" and "Come back later" in wizard
  - [x] 26.8 Test all wizard steps at 375px mobile viewport
  - [x] 26.9 Verify install prompt appears on 2nd mobile visit (simulate with localStorage)

---

### Phase 5: Claims & Notifications

- [x] 27.0 Claims backend
  - [x] 27.1 (notification.service.ts already created in 14.1b - verify treeId is passed for grouping)
  - [x] 27.2 Create `packages/server/src/components/claims/services/claims.service.ts` (HTTP-agnostic) - `createClaim()` (verify node unclaimed, no pending claim exists, set autoApproveAt to 7 days, notify tree members + admins), `approveClaim()` (update person claimedByUserId, add user to tree_members, notify claimant, audit log), `rejectClaim()` (notify claimant, audit log), `confirmAutoApprovedClaim()` (verified member confirms an auto-approved claim, removes "unconfirmed" tag by updating status from `auto_approved` to `approved`, audit log), `getClaimsByTree()` (paginated), `getClaimsByUser()`, `processAutoApprovals()` (scheduled: find claims past autoApproveAt, auto-approve, tag as unconfirmed). Check zero-active-members -> auto-approve immediately.
  - [x] 27.3 Create validation schemas: createClaimSchema, reviewClaimSchema (status: approved/rejected)
  - [x] 27.4 Create controllers and routes: `POST /api/persons/:id/claim`, `GET /api/trees/:slug/claims` (verified members), `PATCH /api/claims/:id` (approve/reject), `POST /api/claims/:id/confirm` (verified member confirms auto-approved claim, removes "unconfirmed" tag), `GET /api/claims/my` (user's own claims)
  - [x] 27.5 Verify with curl: create claim, approve claim, verify person.claimedByUserId updated, verify tree_members entry created, verify notifications created

- [x] 28.0 Notifications backend
  - [x] 28.1 Create `packages/server/src/components/notifications/services/notifications.service.ts` (HTTP-agnostic) - `getNotifications()` (paginated, grouped by treeId), `getUnreadCount()`, `markAsRead()` (single), `markAllAsRead()`, `markTreeGroupAsRead()` (all notifications for a tree)
  - [x] 28.2 Create controllers and routes: `GET /api/notifications` (paginated, auth required), `GET /api/notifications/unread-count`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/mark-all-read`, `POST /api/notifications/mark-tree-read` (body: treeId)
  - [x] 28.3 Verify with curl: list notifications, check unread count, mark read, mark all read

- [x] 29.0 Claims frontend
  - [x] 29.1 Create `packages/web/src/features/claims/hooks/useClaims.ts` - TanStack Query hooks: `useTreeClaims(slug)`, `useMyClaims()`, mutations for create/approve/reject claim. Invalidate tree + person queries on success.
  - [x] 29.2 Add "This is me" button to PersonDetailDrawer for unclaimed nodes (hide if already claimed or user has pending claim). On click -> create claim mutation -> toast "Claim submitted".
  - [x] 29.3 Create `packages/web/src/features/claims/components/ClaimRequestCard.tsx` - presentational: claimant info (name, email), claimed node info, date submitted, approve/reject buttons (for verified members). "Unconfirmed" badge for auto-approved claims with a "Confirm" button that verified members can click to remove the unconfirmed tag.
  - [x] 29.4 Create `packages/web/src/features/claims/pages/ClaimReviewPage.tsx` - list of pending claims for user's tree(s). ClaimRequestCard for each. Empty state if no pending claims.
  - [x] 29.5 Run `npm run check`

- [x] 30.0 Notifications frontend
  - [x] 30.1 Create `packages/web/src/features/notifications/hooks/useNotifications.ts` - TanStack Query hooks: `useNotifications()`, `useUnreadCount()` (poll every 30s or use staleTime), mutations for mark read/all read
  - [x] 30.2 Create `packages/web/src/features/notifications/components/NotificationGroup.tsx` - presentational: tree name header, expandable list of notification items. Each item: icon by type, title, message, timestamp (date-fns relative), link. Unread items have visual indicator.
  - [x] 30.3 Create `packages/web/src/features/notifications/components/NotificationPanel.tsx` - dropdown from bell icon. "Today" / "Earlier" time grouping. Grouped by tree (NotificationGroup). "Mark all as read" button. Empty state. Scrollable, max-height.
  - [x] 30.4 Create `packages/web/src/shared/components/NotificationBell.tsx` - bell icon with unread count badge (max "99+"). Opens NotificationPanel on click. Wire into Layout header + MobileBottomNav.
  - [x] 30.5 Run `npm run check`

- [x] 31.0 UI Testing - Phase 5 (depends: 27.0-30.0)
  - [x] 31.1 Browse a tree as non-member, click person node, verify "This is me" button appears
  - [x] 31.2 Submit a claim, verify toast and notification created for tree members
  - [x] 31.3 Login as tree member, verify notification bell shows unread count
  - [x] 31.4 Open notification panel, verify grouped by tree
  - [x] 31.5 Navigate to claim review, approve claim, verify claimant gets notification
  - [x] 31.6 Mark notifications as read, verify count updates
  - [x] 31.7 Test all at 375px mobile

---

### Phase 6: Admin Panel

- [x] 32.0 Admin backend
  - [x] 32.1 Create `packages/server/src/components/admin/services/admin.service.ts` (HTTP-agnostic) - `getDashboardStats()` (total users, trees, pending verifications/deletions/merges with trends), `getRecentActivity()` (last 20 audit logs platform-wide), `listVerificationRequests()` (paginated, sorted by submission date), `approveVerification()` (update user status, notify user), `rejectVerification()` (update status with reason, notify user), `listDeletionRequests()` (paginated), `approveDeletion()` (delete person + relationships in transaction, audit log, notify tree members), `rejectDeletion()` (notify requester), `resetUserPassword()` (generate temp password, return it, notify user), `deactivateUser()` (cancel pending claims, update tree_member status, audit log), `reactivateUser()`, `changeUserRole()`
  - [x] 32.2 Create admin validation schemas for all endpoints
  - [x] 32.3 Create `packages/server/src/components/admin/controllers/admin.controller.ts` - thin coordinators
  - [x] 32.4 Create `packages/server/src/components/admin/routes/admin.routes.ts` - all routes wrapped with `requireAdmin`: `GET /api/admin/dashboard`, `GET /api/admin/activity`, `GET /api/admin/verifications` (paginated), `PATCH /api/admin/verifications/:id` (approve/reject), `GET /api/admin/users` (paginated, searchable), `PATCH /api/admin/users/:id/role`, `POST /api/admin/users/:id/reset-password`, `PATCH /api/admin/users/:id/status` (activate/deactivate), `GET /api/admin/trees` (paginated), `GET /api/admin/deletions` (paginated), `PATCH /api/admin/deletions/:id` (approve/reject), `GET /api/admin/merges` (paginated)
  - [x] 32.5 Verify all admin endpoints with curl using admin session

- [x] 33.0 Admin frontend
  - [x] 33.1 Create `packages/web/src/features/admin/hooks/useAdmin.ts` - TanStack Query hooks for all admin endpoints. Mutations invalidate affected queries.
  - [x] 33.2 Create `packages/web/src/features/admin/components/AdminSidebar.tsx` - admin navigation: Dashboard, Users, Verifications, Trees, Deletions, Merges. Highlight active route. Badge counts for pending items.
  - [x] 33.3 Create `packages/web/src/features/admin/components/StatCard.tsx` - presentational: label, count, trend arrow (up/down), color accent
  - [x] 33.4 Create `packages/web/src/features/admin/pages/AdminDashboardPage.tsx` - grid of StatCards (users, trees, pending verifications/deletions/merges), recent activity feed (last 20 items). Responsive: 2-col mobile, 3-col desktop.
  - [x] 33.5 Create `packages/web/src/features/admin/pages/AdminUsersPage.tsx` - paginated searchable table (name, email, signup date, verification status, role, last active). Row actions: view details, change role (dialog), reset password (confirmation dialog + display temp password), deactivate/reactivate (confirmation dialog). Responsive: card layout on mobile, table on desktop. Wrap table in `overflow-x-auto`.
  - [x] 33.6 Create `packages/web/src/features/admin/pages/AdminVerificationPage.tsx` - queue of pending requests sorted by date. Each card: user profile info, uploaded Aadhaar photo (zoomable in dialog), associated tree node. Approve/reject buttons with optional reason input.
  - [x] 33.7 Create `packages/web/src/features/admin/pages/AdminTreesPage.tsx` - paginated table: tree name, member count, verified members, creation date. Click to view tree detail + audit log.
  - [x] 33.8 Create `packages/web/src/features/admin/pages/AdminDeletionsPage.tsx` - pending deletion requests: person info, tree info, requester, reason. Approve/reject buttons with confirmation.
  - [x] 33.9 Create `packages/web/src/features/admin/pages/AdminMergesPage.tsx` - pending merge proposals: tree A/B names, proposed by, date, status. Click to view merge detail.
  - [x] 33.10 Add admin routes to `routes.tsx` wrapped in ProtectedRoute with admin role check. Admin sidebar only visible for admin users (REQ-ADMIN-002).
  - [x] 33.11 Run `npm run check`

- [x] 34.0 UI Testing - Phase 6 (depends: 32.0, 33.0)
  - [x] 34.1 Login as admin, verify admin panel visible in navigation
  - [x] 34.2 Login as regular user, verify admin panel NOT visible
  - [x] 34.3 Admin dashboard: verify stat cards show correct counts
  - [x] 34.4 Admin users: search users, change role, verify role updated
  - [x] 34.5 Admin users: deactivate user with confirmation dialog
  - [x] 34.6 Admin users: reset password, verify temp password displayed
  - [x] 34.7 Admin verifications: view Aadhaar photo (zoomable), approve, verify user status changes
  - [x] 34.8 Admin verifications: reject with reason, verify user sees reason in notification
  - [x] 34.9 Admin deletions: approve deletion, verify person removed from tree
  - [x] 34.10 Test admin pages at 375px mobile, verify responsive table/card layouts

---

### Phase 7: Tree Merging & Conflict Resolution

- [x] 35.0 Merge backend
  - [x] 35.1 Extend matching.service.ts - `findDuplicatesAcrossTrees()`: when a person is added, search other trees for potential duplicates. Return matches with confidence scores.
  - [x] 35.2 Create `packages/server/src/components/merge/services/merge.service.ts` (HTTP-agnostic) - `createMergeProposal()` (validate different trees, create proposal + initial mappings, notify both trees' members), `addMapping()` (user maps personA to personB), `removeMapping()` (undo mapping), `autoDetectMappings()` (from confirmed mapping, find adjacent matches by relationship proximity), `setConflictResolution()` (pick value A/B/unknown for a field), `approveMerge()` (check if user is from tree A or B, set appropriate approval flag), `executeMerge()` (when both sides approved: transaction - merge persons, relationships, tree_members, update tree stats, audit log all changes, retain conflict values in audit), `getMergeProposal()` with all mappings and conflicts, `listMergeProposals()` (paginated)
  - [x] 35.3 Handle merge expiration: proposals with no activity for 30 days -> status `expired`
  - [x] 35.4 Create validation schemas, controllers, routes: `POST /api/merge`, `GET /api/merge/:id`, `POST /api/merge/:id/mappings`, `DELETE /api/merge/:id/mappings/:mappingId`, `PATCH /api/merge/:id/mappings/:mappingId/resolve`, `POST /api/merge/:id/approve`, `GET /api/trees/:slug/merge-proposals`
  - [x] 35.5 Add duplicate detection trigger: after person creation, if duplicates found, create notification "This person may already exist in [Tree Name]"
  - [x] 35.6 Verify with curl: create two overlapping trees, trigger merge proposal, add mappings, resolve conflicts, approve from both sides, verify trees merged

- [x] 36.0 Merge frontend
  - [x] 36.1 Create `packages/web/src/features/merge/hooks/useMerge.ts` - TanStack Query hooks for all merge endpoints
  - [x] 36.2 Create `packages/web/src/features/merge/components/TreeComparisonView.tsx` - two mini-trees side by side (stacked on mobile). Matched nodes highlighted: green (confirmed), yellow (auto-suggested), red (conflict). Summary panel: total matches, conflicts, unmatched.
  - [x] 36.3 Create `packages/web/src/features/merge/components/MergeNodeMapper.tsx` - drag-to-link on desktop (d3-drag or react-dnd), tap-to-link on mobile (select from A, then tap on B). Visual connection line drawn between mapped nodes.
  - [x] 36.4 Create `packages/web/src/features/merge/components/ConflictResolutionPanel.tsx` - for each conflict: field name, Tree A value, Tree B value, radio buttons to pick A/B/unknown. Color-coded.
  - [x] 36.5 Create `packages/web/src/features/merge/pages/MergeProposalPage.tsx` - orchestrates TreeComparisonView + MergeNodeMapper + ConflictResolutionPanel. Approve button (shows which tree the user represents). Status indicators for both-side approvals.
  - [x] 36.6 Add merge proposal creation flow: from duplicate notification, user clicks to see match detail, can initiate merge.
  - [x] 36.7 Run `npm run check`

- [x] 37.0 UI Testing - Phase 7 (depends: 35.0, 36.0)
  - [x] 37.1 Create two trees with overlapping persons, verify duplicate detection notification
  - [x] 37.2 Initiate merge from notification, verify comparison view shows both trees
  - [x] 37.3 Map nodes via drag-to-link (desktop) and tap-to-link (mobile)
  - [x] 37.4 Resolve a conflict, verify resolution saved
  - [x] 37.5 Approve from one side, verify waiting-for-other-side state
  - [x] 37.6 Approve from other side, verify trees merged into one
  - [x] 37.7 Verify merged tree has all persons from both trees
  - [x] 37.8 Test comparison view at 375px mobile (stacked layout)

---

### Phase 8: Audit Trail & Edit History

- [x] 38.0 Audit trail frontend
  - [x] 38.1 Create `packages/web/src/features/trees/components/AuditLogView.tsx` - paginated list of audit entries: user avatar, action description ("Rohan updated DOB for Priya Jain"), old->new values, timestamp (date-fns). Filter by action type, person, date range.
  - [x] 38.2 Add audit log tab to TreeOverviewPage (per-tree audit log)
  - [x] 38.3 Add audit entries to PersonTimeline (already created in 18.4, verify integration)
  - [x] 38.4 Implement revert action: "Revert this change" button on audit entries (for verified members). Confirmation dialog showing what will be restored. On confirm -> PATCH endpoint -> revert applied + new audit entry logged.
  - [x] 38.5 Add revert backend: create `packages/server/src/components/audit/` component with controller, service (HTTP-agnostic), route, validation. Service: `revertChange()` - load audit entry, verify user is verified tree member, apply oldValue to the entity, create new audit entry for the revert. Route: `POST /api/audit/:id/revert` with Zod validation. Controller: thin coordinator.
  - [x] 38.6 Run `npm run check`

- [x] 39.0 UI Testing - Phase 8 (depends: 38.0)
  - [x] 39.1 Edit a person's DOB, verify audit log shows old->new value
  - [x] 39.2 View audit log on tree overview, verify filtering works
  - [x] 39.3 Revert a change, verify value restored and revert logged
  - [x] 39.4 View person timeline, verify audit events integrated with life events

---

### Phase 9: Polish, Performance & Documentation

- [x] 40.0 My Tree quick access
  - [x] 40.1 Add "My Tree" logic: query user's tree_members to find active membership, link to `/trees/:slug` in header nav and mobile bottom nav. If no tree, link to `/onboarding`. Cache with TanStack Query.
  - [x] 40.2 Verify My Tree link works for users with/without trees

- [x] 41.0 Scheduled jobs
  - [x] 41.1 Create a simple scheduled task (setInterval or node-cron) in server: every hour, run `claims.service.processAutoApprovals()` to auto-approve claims past 7-day threshold
  - [x] 41.2 Create job for merge proposal: at 14 days with no response, notify requesting user that merge is still pending. At 30 days with no activity, mark proposal as `expired`.
  - [x] 41.3 Create job for session cleanup: every 6 hours, delete expired sessions from the sessions table
  - [x] 41.4 Verify with test: create claim, manually set autoApproveAt to past, run job, verify claim auto-approved

- [x] 42.0 OpenAPI documentation
  - [x] 42.1 Create `docs/openapi.yaml` documenting all API endpoints: auth, users, trees, persons, relationships, claims, merge, notifications, admin. Include request/response schemas, RFC 9457 error responses, pagination format.
  - [x] 42.2 Verify with `npm run docs:check` (if available) or manual review

- [x] 43.0 Performance optimization
  - [x] 43.1 Add database indexes: verify all FRD-specified indexes are in schema files and migrated
  - [x] 43.2 Tree visualization: verify 500+ node rendering performance, implement progressive loading if needed
  - [x] 43.3 Add image lazy loading (`loading="lazy"`) for all below-fold images (person photos in tree, search results)
  - [x] 43.4 Virtualize long lists: notifications panel, audit logs, search results (if >50 items)
  - [x] 43.5 Verify all list endpoints return paginated responses

- [x] 44.0 Final responsive & accessibility pass
  - [x] 44.1 Test every page at 375px, 768px, 1024px - fix any layout issues
  - [x] 44.2 Verify all forms: proper `type`, `autocomplete`, `name`, `spellCheck` attributes, inline errors, focus first error on submit
  - [x] 44.3 Verify all icon-only buttons have `aria-label`
  - [x] 44.4 Verify all images have `alt` attributes
  - [x] 44.5 Verify keyboard navigation through tree nodes
  - [x] 44.6 Verify `motion-reduce:` respected on animations
  - [x] 44.7 Verify 44x44px touch targets on all interactive elements
  - [x] 44.8 Verify tree list view works as screen reader alternative

- [x] 45.0 UI Testing - Phase 9 (depends: 40.0-44.0)
  - [x] 45.1 Full end-to-end: signup -> wizard -> tree created -> add members -> share link -> other user claims node -> approve -> merged member edits tree
  - [x] 45.2 Full admin flow: verify Aadhaar -> manage users -> approve deletions -> review merges
  - [x] 45.3 PWA: install app on mobile, use offline, verify update prompt on redeploy
  - [x] 45.4 Verify Banyan theme consistency across all pages (colors, badges, relationship lines match spec)
  - [x] 45.5 Performance: load tree with 500+ nodes, verify smooth interaction
  - [x] 45.6 Responsive: spot-check 5 key pages at all 3 breakpoints
