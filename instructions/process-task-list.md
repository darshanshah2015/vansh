# Task List Protocol

Guidelines for tracking FRD implementation progress in markdown task lists.

## Execution Rules

**CRITICAL: One parent task at a time.** NEVER start the next parent task until ALL subtasks under the current parent are complete and committed. Pause at logical checkpoints for user verification.

**Completion sequence (MUST follow exactly):**
1. Finish subtask → **immediately** mark `[x]`
2. ALL subtasks `[x]` → clean temp files → `git add .` → commit with:
   - Conventional format (`feat:`, `fix:`, `refactor:`)
   - Parent task summary
   - Key changes
   - Task/FRD reference
3. After commit → mark parent `[x]`

**DO NOT mark parent `[x]` until commit is complete.**

## Maintenance

**After each work session:**
- Add newly discovered tasks
- **MUST update** "Relevant Files" section with ALL created/modified files and one-line descriptions

**Before each work session:**
- Verify which parent task is active
- Identify next subtask