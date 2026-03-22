# Rule: Generate Task List from FRD

## Goal

Create a detailed, actionable task breakdown from a Feature Requirements Document (FRD) that serves as the implementation roadmap.

## Output

- **Location:** `/tasks/tasks-[frd-name].md`
- **Format:** Markdown checklist with numbered parent/sub-tasks

## Process

1. **Read FRD:** Analyze functional requirements and other sections of the FRD
2. **Assess Codebase:** Identify existing architecture, patterns, components, conventions and utilities that can be leveraged or need modification. This wasn't exhaustive list. Use your judgement in assessment.
3. **Create Parent Tasks:** Define high-level tasks required to implement the all the requirements in the FRD. Use your judgement on how many high-level tasks to use. Ultrathink strongly.
4. **Break Down Sub-tasks:** For each parent task, create specific smaller, actionable sub-tasks necessary to complete the parent task. Ensure sub-tasks logically follow from the parent task, cover the implementation details implied by the FRD, and consider existing codebase patterns where relevant without being constrained by them.
5. **Identify Relevant Files:** Based on the tasks and FRD, identify potential files that will need to be created or modified. List these under the `Relevant Files` section.
6. **Save:** Write to `/tasks/tasks-[frd-name].md` matching the base FRD filename
7. **Validate Against Coding Rules:** After generating all tasks, review and update them to ensure compliance with project coding standards:
   - Read `instructions/node-code-writing-rules.md` for backend tasks
   - Read `instructions/react-code-writing-rules.md` for frontend tasks
   - Update tasks to explicitly incorporate relevant rules (e.g., "Create service with HTTP-agnostic design", "Add timestamptz with explicit config", "Use mobile-first responsive design")
   - Ensure tasks follow architectural boundaries (controllers → services → routes pattern, validation split, etc.)
   - Add sub-tasks for rule compliance where missing (e.g., pagination requirements, RFC 9457 error handling, business timezone handling)
   - Remove or modify tasks that would violate rules (e.g., tasks suggesting transactions in controllers, HTTP concepts in services)

## Testing Strategy

**Inline Tests (within implementation tasks):**
- API tests using `curl` commands
- Database verification queries
- TypeScript type checking (`npm run check`)
- Unit tests without browser

**UI Tests (dedicated parent tasks after each phase):**
- Consolidate Playwright MCP tests into dedicated parent tasks
- Place UI test task at the END of each phase (not only at the very end)
- This catches issues early before they compound across phases
- Agent keeps browser session open across all subtasks in a UI test task

**Why phase-based UI testing:**
- Fixing 2 broken components after Phase 1 is cheaper than fixing 10 after Phase 4
- Implementation context is fresh when UI tests run immediately after
- Natural batching alignment with `run-tasks.sh` phase grouping

## Required Format

**Note:** Adapt all file paths and names based on the actual FRD requirements and existing codebase structure. The examples below illustrate the monorepo pattern—replace component/feature names accordingly.

```markdown
## Relevant Files

**Backend (if applicable):**
- `server/src/components/[domain]/controllers/[feature].controller.ts` - Controller for [feature] endpoints
- `server/src/components/[domain]/services/[feature].service.ts` - Business logic for [feature]
- `server/src/components/[domain]/models/[feature].model.ts` - Drizzle schema definitions
- `server/src/components/[domain]/validation/[feature].validation.ts` - Zod validation schemas

**Frontend (if applicable):**
- `client/src/features/[feature]/components/[Component].tsx` - React components
- `client/src/features/[feature]/hooks/use[Feature].ts` - TanStack Query hooks
- `client/src/features/[feature]/types/[feature].types.ts` - Feature-specific types

**Shared (if applicable):**
- `shared/types/[domain].types.ts` - Shared TypeScript types across frontend/backend

## Tasks

### Phase 1: [Phase Name]

- [ ] 1.0 [Implementation Task]
  - [ ] 1.1 [Sub-task]
  - [ ] 1.2 [Sub-task]
  - [ ] 1.3 Verify API with curl test
- [ ] 2.0 [Implementation Task]
  - [ ] 2.1 [Sub-task]
  - [ ] 2.2 Run `npm run check` to verify types
- [ ] 3.0 UI Testing - Phase 1 (depends: 1.0, 2.0)
  - [ ] 3.1 Navigate to [page], verify [component] renders
  - [ ] 3.2 Test [user action], confirm [expected result]
  - [ ] 3.3 Test [validation/error state]
  - [ ] 3.4 Test [end-to-end flow within phase]

### Phase 2: [Phase Name]

- [ ] 4.0 [Implementation Task]
  - [ ] 4.1 [Sub-task]
  - [ ] 4.2 Verify with curl test
- [ ] 5.0 [Implementation Task]
  - [ ] 5.1 [Sub-task]
- [ ] 6.0 UI Testing - Phase 2 (depends: 4.0, 5.0)
  - [ ] 6.1 [UI test subtasks...]
```

## Guidelines

- Sub-tasks must be implementation-ready (not just documentation)
- Consider existing codebase patterns but don't be constrained by them
- Each sub-task should be completable in one focused session
- Include technical details: file paths, component names, endpoint routes when known
- Keep curl/type-check tests inline with implementation tasks
- Consolidate Playwright UI tests into dedicated parent tasks at end of each phase
- UI test tasks must use `(depends: X.0, Y.0)` notation to indicate what they test
- Each phase should have its own UI test task—don't defer all UI testing to the end
