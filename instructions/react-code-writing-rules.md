# React Feature Development Rules 2025

**State which rule you're applying in output.**

  

## Core Requirements (CRITICAL)

- **SOLID principles** - single responsibility, open/closed, interface segregation, dependency inversion (MOST CRUCIAL)

- **One component per file** - strict single responsibility

- **TypeScript strict mode** - NO `any` type, proper null handling

- **Functional components only** - no class components

- **Mobile-first design** - ALL UI must be mobile-friendly by default (CRITICAL)



## Component Limits (ENFORCE STRICTLY)

- **Component size** → if component handles multiple distinct responsibilities, split immediately

- **Props design** → if passing configuration arrays/objects (buttons={[...]}, config={{...}}), refactor to composition or context

- **useState limit** → if component manages multiple related data states, use useReducer or split component. UI-only states (isOpen, isHovered, isFocused) don't count.



## Component Types (MUST categorize each component)

1. **Page Components** (`/features/[x]/pages/`)
   - Only orchestration + layout
   - Max 50 lines render logic
   - Example: `UserDashboardPage.tsx`

2. **Container Components** (`/features/[x]/components/containers/`)
   - Only data fetching + hook calls
   - Max 30 lines render (just pass props down)
   - Example: `UserProfileContainer.tsx`

3. **Presentational Components**
   - Only receive props + render UI
   - No hooks except useState for UI state (example: dropdown open/closed)
   - Example: `UserCard.tsx`

**Naming Convention:**
- Pages: `[Feature]Page.tsx`
- Containers: `[Feature]Container.tsx`
- Presentational: `[Feature].tsx` or `[Feature]View.tsx`
- Booleans: is/has/should prefix (isActive, hasPermission, shouldRender)



## State Management Strategy

- **Local**: useState, useReducer

- **Shared (2-5 components)**: Context API

- **Medium apps**: Zustand

- **Enterprise**: Redux Toolkit

- **Server state**: TanStack Query



## Before Creating Components (MANDATORY)

- **Check existing first**: List `client/src/shared/components/ui/` and `client/src/shared/components/`

- **If working in a feature**: Also list that feature's `components/` directory

- **State what you found**: "Found Button, Card in /ui/ - reusing Button"

- **Decision**:
  - Exists in `/ui/` or `/shared/` → Reuse it
  - Exists in feature → Reuse it, evaluate if should move to `/shared/` (use judgment)
  - Doesn't exist → Use judgment to decide feature vs shared based on obvious reusability



## When to Extract Reusable Components

**Extract to `/client/src/shared/components/` when:**
- Pattern is used multiple times across different features
- Zero feature-specific logic
- Can be documented in isolation
- Clear benefit from centralization (not premature abstraction)

**Keep in `/client/src/features/[x]/components/` when:**
- Currently used only within single feature
- Contains feature-specific business rules
- Extraction adds indirection without clear benefit

**Use judgment:** Consider domain knowledge, obvious reusability patterns, and extraction cost.



## TypeScript Rules

- **Discriminated unions** for complex state

- **Type assertions only with validation**



## Shared Constants (Single Source of Truth)

Import from `@shared/constants/`—never hardcode values that exist there.

```typescript
// ✅ Named constant for comparisons | ❌ Array index (unclear)
if (user.role === ROLE.ADMIN)        if (user.role === ROLES[0])

// ✅ Array for iteration            | ❌ Hardcoded values
ROLES.map(r => <option>...)          ['Admin'].map(...)
```

**Rule**: Arrays (`.map()`), named objects (`===`). Never index arrays for named values.



## Date Handling (CRITICAL)

### Parse Immediately
Convert API date strings to Date objects in service layer:

```typescript
// ✅ Parse on entry
const data = await response.json();
return data.items.map(item => ({
  ...item,
  createdAt: new Date(item.createdAt) // Parse here
}));
```

### Display
Use `date-fns` or `date-fns-tz`, never `.toLocaleString()`:

```typescript
import { format } from 'date-fns';

// ✅ CORRECT
<span>{format(date, 'dd/MM/yyyy hh:mm a')}</span>

// ❌ WRONG - inconsistent formatting
<span>{date.toLocaleString()}</span>
```

### Send to API
Always use `.toISOString()` to ensure timezone information is preserved:

```typescript
// ✅ CORRECT - Full ISO 8601 with timezone (Z = UTC)
fetch(`/api?date=${date.toISOString()}`); // "2025-01-15T10:30:00.000Z"

// ❌ WRONG - Loses timezone information
fetch(`/api?date=${date.toString()}`);    // "Tue Jan 15 2025 10:30:00 GMT+0530"
fetch(`/api?date=${date.toLocaleDateString()}`); // "1/15/2025" (ambiguous)
```

**Critical**: Backend expects ISO 8601 format with timezone. Never send date-only strings like `"2025-01-15"` as they're interpreted as local time, causing timezone bugs.



## Error Handling (RFC 9457 Problem Details)

### API Error Structure
Backend returns RFC 9457 Problem Details format. Use the shared `ApiError` class:

```typescript
// API returns this structure (Content-Type: application/problem+json)
interface ProblemDetails {
  type: string;      // Error type URI
  title: string;     // Human-readable summary
  status: number;    // HTTP status code
  detail?: string;   // Specific error message
  errors?: Array<{   // Validation errors
    detail: string;  // Field error message
    pointer: string; // JSON Pointer (e.g., "/body/email")
  }>;
}
```

### Handling API Errors
```typescript
// ✅ CORRECT - Use shared ApiError class
import { ApiError } from '@/shared/services/api';

try {
  await createUser(data);
} catch (err) {
  if (err instanceof ApiError) {
    // General error message
    setError(err.detail || err.title);

    // Field-level errors (convert pointer to field name)
    if (err.errors) {
      const fieldErrors = err.errors.reduce((acc, e) => {
        const field = e.pointer.replace('/body/', '');
        acc[field] = e.detail;
        return acc;
      }, {} as Record<string, string>);
      setFieldErrors(fieldErrors);
    }
  }
}

// ❌ WRONG - Don't access non-standard properties
err.message           // Use err.detail or err.title
err.details[0].field  // Use err.errors[0].pointer (JSON Pointer format)
```

### Error Boundaries
- **Error boundaries** using react-error-boundary
- **Loading/error states** for all data fetching
- **useErrorBoundary** for async errors

### Display Patterns
- **General errors**: Display `error.detail` or `error.title` in alert banner
- **Field errors**: Display inline below form inputs (convert JSON Pointer to field name)
- **Toast notifications**: Use for non-blocking errors (e.g., failed background operations)



## Accessibility

- Icon-only buttons → `aria-label` required
- Form controls → `<label htmlFor>` or `aria-label`
- Semantic HTML → `<button>` for actions, `<Link>` for navigation, never `<div onClick>`
- Images → `alt` required (`alt=""` if decorative)
- Async updates (toasts) → `aria-live="polite"`



## Focus & Interaction

- Visible focus required → `focus-visible:ring-*`
- Never `outline-none` without `focus-visible:` replacement
- Use `focus-visible` not `focus` (avoids ring on click)



## Forms

- Set `autocomplete`, `name`, correct `type` (`email`/`tel`/`url`)
- Never block paste
- `spellCheck={false}` on emails/codes/usernames
- Errors inline; focus first error on submit
- Submit button enabled until request starts, spinner during



## Animation

- `transform`/`opacity` only (GPU-friendly)
- Never `transition-all` → use `transition-colors`, `transition-transform`
- Honor `motion-reduce:` prefix



## Typography

- `…` not `...`
- `tabular-nums` for number columns (prices, quantities, inventory)



## Content Handling

- `truncate` or `line-clamp-*` for long text
- `min-w-0` on flex children for truncation
- Always handle empty arrays → never render broken UI



## Performance

- Virtualize lists >50 items (`virtua`, `@tanstack/virtual`)
- No layout reads in render (`getBoundingClientRect`, `offsetHeight`)
- Images need `width`/`height`, `loading="lazy"` below fold



## Styling (shadcn/ui + Tailwind)

- **ALWAYS use `cn()` utility** when merging classes or accepting `className` props (from `@/lib/utils`)

- **Prefer design tokens** - use arbitrary values (w-[123px]) only when design specifically requires it, add comment explaining why



## Mobile-First & Responsive Design (CRITICAL)

**Every component MUST be mobile-friendly.**

- **Mobile-first breakpoints** - Start mobile, scale up: `w-full md:w-1/2 lg:w-1/3`

- **Touch targets** - Minimum 44×44px for all interactive elements

- **Responsive grids/flex** - `grid-cols-1 md:grid-cols-2`, `flex-col md:flex-row`

- **Scrollable wide content** - Wrap tables/wide elements in `overflow-x-auto`

- **Test at**: 375px (mobile), 768px (tablet), 1024px (desktop)



## Component API Design

**Prefer children/compound components over props:**

```typescript
// ❌ AVOID - Config props
<Modal showHeader title="Edit" onClose={fn} buttons={[...]}>

// ✅ PREFER - Composition
<Modal onClose={fn}>
  <Modal.Header>Edit</Modal.Header>
  <Modal.Body>{content}</Modal.Body>
  <Modal.Footer>
    <Button>Save</Button>
  </Modal.Footer>
</Modal>
```

Use compound components for related UI (Card, Modal, Tabs, Dropdown)



## Action Menu Pattern

**Use ActionMenu component** (`@/shared/components/ActionMenu`) for destructive/secondary actions:

```typescript
// ✅ CORRECT
<ActionMenu canDelete onDelete={handleDelete} />

// ❌ WRONG - exposed destructive button
<Button variant="destructive" onClick={handleDelete}>Delete</Button>
```



## TanStack Query Rules

- **Don't set per-query `staleTime`** – use the global default (10s). Only override for config/settings data that rarely changes and is already invalidated by mutations.
- **Don't fetch in `useEffect`** – use a query hook. TanStack Query deduplicates requests; raw fetches in effects fire twice in StrictMode.
- **Mutations must invalidate** – every mutation's `onSuccess` should invalidate affected query keys.



## Anti-Patterns (MUST AVOID)

- Array indices as keys
- Prop drilling >2 levels (use context)
- Mixed UI/business logic
- Fixed pixel widths without responsive
- Interactive elements <44px touch target
- `<div onClick>` (use `<button>`/`<Link>`)
- Icon buttons without `aria-label`
- Inputs without labels
- `outline-none` without `focus-visible:`
- `transition-all`
- Lists >50 items without virtualization
- `onPaste` + `preventDefault()`
- Missing `autocomplete` on inputs
- Wrong input `type`