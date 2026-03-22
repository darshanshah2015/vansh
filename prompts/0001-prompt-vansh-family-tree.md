# Prompt: Vansh - Family Tree App

## Original Request
User wants to build a webapp called "Vansh" where users can sign up and add their family tree. Focused on the Jain community initially.

## Clarifying Questions & Responses

### Round 1

**Q: Target audience?**
A: Families wanting to preserve history - focused on Jain Community for now.

**Q: Personal or collaborative?**
A: Multiple users can collaborate, multiple trees possible.

**Q: Relationship types?**
A: Full - all relations possible (parent, child, spouse, sibling, step/adoptive, in-laws, custom).

**Q: Person data fields?**
A: Name, DOB, DOD, Gender, Photo, Phone, Email, Gotra. Native place dropped.

**Q: Visual tree?**
A: Visually interactive, elegant view with multiple views (radial centered as default, top-down, left-right).

**Q: Multiple trees?**
A: One tree per family, multiple users collaborate. Trees can be merged when overlap discovered.

**Q: GEDCOM, search, sharing, media?**
A: Future features, not for initial build.

**Q: Tech stack?**
A: Follow Pioneer project patterns (React + Vite + shadcn/ui + Tailwind, Express + Drizzle + PostgreSQL). Follow react-code-writing-rules.md and node-code-writing-rules.md.

**Q: Auth methods?**
A: Simple email + password signup/login.

### Round 2

**Q: Gotra/Jain-specific fields?**
A: Gotra should be a separate field. Native place dropped.

**Q: Claiming approach (invite vs search)?**
A: No single admin for a tree. Users can sign up without invite. System should detect if they're already in a tree via matching.

**Q: Edit permissions?**
A: Need to discuss - user asked for suggestion.

### Round 3

**Q: Verification method?**
A: Keep admin-based verification for now. User uploads Aadhaar photo, app admin manually approves and verifies user.

**Q: Tree editing model?**
A: Trees stabilize over time. Adding new people goes through immediately. Edits to existing data logged. Deletions need admin approval. Full edit history.

**Q: Approval bottleneck?**
A: Any verified member can approve claims. Auto-approve after 7 days timeout. Zero-active-member trees allow auto-join.

**Q: Privacy/visibility?**
A: All public for now.

**Q: Scope - MVP or full?**
A: Full app. May execute in phases but plan the entire thing.

**Q: Admin panel?**
A: Yes - user management module visible only to app admins. Follow Pioneer's admin patterns.

**Q: App name?**
A: Vansh
