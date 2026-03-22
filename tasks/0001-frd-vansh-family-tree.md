# Feature Requirements Document: Vansh - Family Tree Application

**App Name:** Vansh
**Target Audience:** Jain community (initially), families wanting to preserve genealogy
**Tech Stack:** React 18 + Vite + shadcn/ui + Tailwind (frontend), Express + Drizzle ORM + PostgreSQL (backend), monorepo structure mirroring Pioneer project

---

## 1. Authentication & User Accounts

**[REQ-AUTH-001]** The system must allow users to sign up with email and password.
**[REQ-AUTH-002]** The system must allow users to log in with email and password.
**[REQ-AUTH-003]** The system must use session-based authentication with HTTP-only cookies (matching Pioneer's auth pattern).
**[REQ-AUTH-004]** The system must store passwords hashed with bcrypt.
**[REQ-AUTH-005]** The system must allow users to log out, invalidating their session.
**[REQ-AUTH-006]** The system must support two user roles: `user` (default) and `admin` (app-level).
**[REQ-AUTH-007]** The system must allow users to update their profile (name, email, phone, photo).
**[REQ-AUTH-008]** The system must support a "Forgot Password" flow: user enters email, receives a time-limited password reset token (stored in DB, expires in 1 hour), and can set a new password via a reset page. All in-app - no email service; the reset link/token is displayed in-app or via admin.
**[REQ-AUTH-009]** The system must allow users to change their password from their profile (requires current password confirmation).

---

## 2. Identity Verification (Aadhaar)

**[REQ-VERIFY-001]** The system must allow users to upload an Aadhaar photo for identity verification.
**[REQ-VERIFY-002]** The system must store uploaded Aadhaar photos securely (not publicly accessible).
**[REQ-VERIFY-003]** The system must track verification status per user: `unverified`, `pending`, `verified`, `rejected`.
**[REQ-VERIFY-004]** App admins must be able to view pending verification requests.
**[REQ-VERIFY-005]** App admins must be able to approve or reject verification requests with an optional reason.
**[REQ-VERIFY-006]** The system must notify users (in-app) when their verification status changes.
**[REQ-VERIFY-007]** Verified users must have a visible "verified" badge on their profile and tree node.

---

## 3. Person Management (Tree Nodes)

### Person Data Fields

**[REQ-PERSON-001]** Each person in the tree must have the following fields:
- `firstName` (required) - string
- `middleName` (optional) - string
- `lastName` (required) - string
- `gender` (required) - enum: `male`, `female`, `other`
- `dateOfBirth` (optional) - date
- `dateOfDeath` (optional) - date (marks person as deceased)
- `isAlive` (required) - boolean, derived from `dateOfDeath` being null
- `gotra` (optional) - string
- `phone` (optional) - string (for living members)
- `email` (optional) - string (for living members)
- `photo` (optional) - image upload
- `bio` (optional) - text, max 500 characters

**[REQ-PERSON-002]** The system must allow any verified tree member to add a new person to the tree.
**[REQ-PERSON-003]** The system must allow any verified tree member to edit person details. Edits to existing data must be logged in the audit trail.
**[REQ-PERSON-004]** Deleting a person from the tree must require app admin approval. The deletion request must be visible to admins with the requester's reason.
**[REQ-PERSON-005]** A person node can optionally be "claimed" by a signed-up user (linking their account to that tree node). See Section 6.

### Relationships

**[REQ-REL-001]** The system must support the following relationship types:
- Parent-Child (biological)
- Spouse (current, with optional marriage date)
- Step-Parent / Step-Child
- Adoptive Parent / Adoptive Child
- In-Law relationships (derived from spouse + parent links)
- Sibling (derived from shared parents, or explicitly added for half-siblings)

**[REQ-REL-002]** The system must allow adding relationships between any two people in the same tree.
**[REQ-REL-003]** The system must validate relationship consistency (e.g., a person cannot be their own parent, circular parent chains are not allowed).
**[REQ-REL-004]** The system must support multiple spouses (sequential marriages) with optional marriage/divorce dates.
**[REQ-REL-005]** Sibling relationships must be auto-derived when two people share at least one parent. Half-siblings must be explicitly addable.
**[REQ-REL-006]** In-law relationships must be auto-derived at query time (e.g., spouse's parent = in-law parent). In-laws are not stored as relationship records — they are computed from spouse + parent links when displaying the person detail drawer or tree view.

---

## 4. Family Tree Visualization

**[REQ-VIZ-001]** The system must render the family tree as a visually interactive, zoomable, and pannable graph.
**[REQ-VIZ-002]** The system must support three view modes, togglable by the user:
1. **Radial/Circular** (default) - current person at center, relatives radiating outward
2. **Top-Down** - ancestors at top, descendants below
3. **Left-to-Right** - horizontal hierarchy

**[REQ-VIZ-003]** Each tree node must display: person's photo (or avatar placeholder), full name, birth/death years, and a verified badge if the node is claimed by a verified user.
**[REQ-VIZ-004]** Clicking a tree node must open a detail panel/drawer showing all person fields and relationships.
**[REQ-VIZ-005]** The tree must support smooth animations when navigating between nodes or switching views.
**[REQ-VIZ-006]** The user must be able to "re-center" the tree on any person (making them the focal point in radial view).
**[REQ-VIZ-007]** The tree must be responsive and usable across all screen sizes:
- **Mobile (375px)**: Touch gestures for zoom/pan, drawer for person details, simplified node cards
- **Tablet (768px)**: Side panel for details, comfortable node spacing
- **Desktop (1024px+)**: Full visualization with side panel, hover tooltips on nodes
**[REQ-VIZ-008]** Relationship lines must visually distinguish relationship types (e.g., solid for biological, dashed for step/adoptive, different color for spouse).
**[REQ-VIZ-009]** The system should support collapsing/expanding branches to manage large trees.
**[REQ-VIZ-010]** The system must handle trees with 500+ nodes without significant performance degradation (use canvas/WebGL rendering or virtualization for large trees).
**[REQ-VIZ-011]** The tree visualization must have an alternative list/table view for accessibility (screen readers) and for users who prefer a flat view.

---

## 5. Tree Management

**[REQ-TREE-001]** When a user signs up and adds their first family member, a new tree is automatically created with the user as the first node.
**[REQ-TREE-002]** Each tree must have a name (e.g., "Jain Family of Indore") set by the creator, editable by any verified member.
**[REQ-TREE-003]** All trees are publicly viewable (anyone can browse). Only verified members can edit.
**[REQ-TREE-004]** The system must display a tree overview page showing: tree name, total members, total generations, list of verified members, and a "Join this tree" option.
**[REQ-TREE-005]** The system must provide a tree search page where users can search across all public trees by: tree name, member names, gotra.
**[REQ-TREE-006]** Each tree must have an activity feed showing recent changes (new members added, edits, claims).
**[REQ-TREE-007]** Each tree must have a unique, shareable URL (e.g., `/trees/:id` or `/trees/:slug`). Users can copy the link to share the tree with others.
**[REQ-TREE-008]** Logged-in users must have a "My Tree" quick-access link in the main navigation that takes them directly to the tree they are a verified member of. If they are not a member of any tree, it links to the onboarding flow.

---

## 6. Node Claiming & User Onboarding

### Onboarding Flow

**[REQ-CLAIM-001]** When a new user signs up, the system must prompt them to add basic family details: their own name, DOB, gotra, and at least one parent's name.
**[REQ-CLAIM-002]** As the user adds family details, the system must run background matching against existing trees using a weighted scoring algorithm:
- Name similarity (fuzzy match) - weight: 30%
- Date of birth match - weight: 25%
- Gotra match - weight: 20%
- Parent/spouse name overlap - weight: 25%

**[REQ-CLAIM-003]** If matches are found (score above threshold), the system must present them to the user: "We found a possible match in [Tree Name]. Is this you?"
**[REQ-CLAIM-004]** If the user confirms a match, a claim request is created (see claiming flow below).
**[REQ-CLAIM-005]** If no matches are found or the user declines all matches, a new tree is created with the user as the first member.

### Claiming Flow

**[REQ-CLAIM-006]** A signed-up user can request to claim an unclaimed node in any tree by clicking "This is me" on the node.
**[REQ-CLAIM-007]** Claim requests must be visible to all verified members of that tree and to app admins.
**[REQ-CLAIM-008]** Any single verified member of the tree can approve or reject the claim.
**[REQ-CLAIM-009]** App admins can approve or reject any claim in any tree.
**[REQ-CLAIM-010]** If no verified member responds within 7 days, the claim is auto-approved with a visible "unconfirmed" tag. The tag is removed once any verified member manually confirms.
**[REQ-CLAIM-011]** If the tree has zero active verified members, the claim is auto-approved immediately and the user becomes the first active verified member.
**[REQ-CLAIM-012]** A node can only be claimed by one user account. If a node is already claimed, the "This is me" option must not be shown.

---

## 7. Tree Merging & Conflict Resolution

### Duplicate Detection

**[REQ-MERGE-001]** As users add people to their tree, the system must suggest potential duplicates from other trees using the same matching algorithm (Section 6, REQ-CLAIM-002).
**[REQ-MERGE-002]** Suggestions must appear as non-blocking notifications: "This person may already exist in [Tree Name]."
**[REQ-MERGE-003]** Users can dismiss suggestions or initiate a merge proposal.

### Merge Proposal Flow

**[REQ-MERGE-004]** A merge proposal is created when a user links a person in their tree to a person in another tree ("These are the same person").
**[REQ-MERGE-005]** The merge proposal must display:
- Matched people (user-confirmed as same person)
- Auto-detected additional matches (system-suggested based on relationship proximity)
- Conflicts (differing data for the same person: different DOB, name spelling, etc.)

**[REQ-MERGE-006]** Conflicts must be displayed side-by-side with options:
- Pick value from Tree A
- Pick value from Tree B
- Mark as "unknown/disputed"

**[REQ-MERGE-007]** The merge proposal must be reviewable by any verified member from either tree.
**[REQ-MERGE-008]** A merge requires approval from at least one verified member from each tree.
**[REQ-MERGE-009]** If one side does not respond within 14 days, the system must:
- Notify the requesting user that the merge is pending
- Keep both trees independent (no forced merge)
- Allow the requesting user to continue building their own tree

**[REQ-MERGE-010]** When a merge is approved:
- The two trees become one tree
- All verified members from both trees retain their status
- Conflict resolutions are applied
- An audit log entry records the merge with details of what was merged and who approved

**[REQ-MERGE-011]** Merged data that had conflicts must retain both original values in the audit log for future reference.

---

## 8. Edit History & Audit Trail

**[REQ-AUDIT-001]** The system must log every data change with: who changed it, what was changed (old value, new value), and when.
**[REQ-AUDIT-002]** The audit log must be viewable per-person (all changes to this person's data) and per-tree (all changes in this tree).
**[REQ-AUDIT-003]** Any verified member must be able to view the audit log for their tree.
**[REQ-AUDIT-004]** App admins must be able to view audit logs for all trees.
**[REQ-AUDIT-005]** The system must support reverting a specific change (restoring the previous value). Reverts are themselves logged.
**[REQ-AUDIT-006]** The audit log must capture: person additions, person edits, relationship additions/removals, claim approvals/rejections, merge events, deletion requests.

---

## 9. Admin Panel (App-Level)

**[REQ-ADMIN-001]** The system must have an admin panel accessible only to users with the `admin` role.
**[REQ-ADMIN-002]** The admin panel must not be visible in the navigation for non-admin users.

### User Management

**[REQ-ADMIN-003]** Admins must be able to view all registered users in a paginated, searchable table with columns: name, email, signup date, verification status, role, last active.
**[REQ-ADMIN-004]** Admins must be able to view a user's profile details, their claimed node, and their tree membership.
**[REQ-ADMIN-005]** Admins must be able to change a user's role (user/admin).
**[REQ-ADMIN-006]** Admins must be able to deactivate/reactivate user accounts with a confirmation dialog.
**[REQ-ADMIN-007]** Admins must be able to reset a user's password (generates a temporary password displayed to the admin, who communicates it to the user).

### Verification Queue

**[REQ-ADMIN-008]** Admins must see a queue of pending Aadhaar verification requests, sorted by submission date.
**[REQ-ADMIN-009]** Each verification request must show: user's profile, uploaded Aadhaar photo (viewable/zoomable), the tree node they're associated with.
**[REQ-ADMIN-010]** Admins must be able to approve or reject with a reason. Rejection reasons must be visible to the user.

### Tree Oversight

**[REQ-ADMIN-011]** Admins must be able to view all trees in a paginated table: tree name, member count, verified member count, creation date.
**[REQ-ADMIN-012]** Admins must be able to view any tree's detail page and audit log.
**[REQ-ADMIN-013]** Admins must be able to approve or reject deletion requests for person nodes.
**[REQ-ADMIN-014]** Admins must be able to view and act on all pending merge proposals.

### Dashboard

**[REQ-ADMIN-015]** The admin panel must have a dashboard showing:
- Total users (with trend)
- Total trees
- Pending verifications count
- Pending deletion requests count
- Pending merge proposals count
- Recent activity feed (last 20 actions across the platform)

---

## 10. Notifications (In-App)

**[REQ-NOTIF-001]** The system must have an in-app notification system (bell icon with unread count).
**[REQ-NOTIF-002]** Notifications must be generated for:
- Verification status changes (approved/rejected)
- Claim requests on your tree (for verified members)
- Claim request outcomes (for the claimant)
- Merge proposals involving your tree
- Merge proposal outcomes
- Deletion requests on your tree (for verified members)
- Someone added/edited a person in your tree
- Password reset by admin

**[REQ-NOTIF-003]** Notifications must be markable as read (individually and "mark all as read").
**[REQ-NOTIF-004]** Each notification must link to the relevant page (e.g., claim request links to the claim review page).

---

## 11. Progressive Web App (PWA)

**[REQ-PWA-001]** The application must be a Progressive Web App, installable on mobile and desktop devices.
**[REQ-PWA-002]** The app must have a web app manifest with: app name ("Vansh"), icons (multiple sizes), theme color, background color, display mode (`standalone`).
**[REQ-PWA-003]** The app must use a service worker (via vite-plugin-pwa / Workbox) for:
- Caching static assets (JS, CSS, images) for offline shell loading
- Runtime caching for API responses (network-first strategy for data, cache-first for static assets)
**[REQ-PWA-004]** The app must show an "Update Available" prompt when a new version is deployed, allowing users to refresh.
**[REQ-PWA-005]** The app must display a meaningful offline fallback page when the user has no connectivity and no cached data.
**[REQ-PWA-006]** The app must be mobile-optimized: proper viewport meta tag, no horizontal scroll, touch-friendly interactions throughout.

---

## 12. Landing Page

**[REQ-LANDING-001]** The app must have a public landing page at `/` for unauthenticated users.
**[REQ-LANDING-002]** The landing page must include:
- App name and tagline (e.g., "Preserve your family's legacy")
- Brief feature highlights (visual tree, collaboration, merging)
- Call-to-action buttons: "Sign Up" and "Browse Trees"
- A sample/demo tree visualization or screenshot
- Login link in the header

**[REQ-LANDING-003]** Authenticated users visiting `/` must be redirected to their dashboard (My Tree or tree search if they have no tree).

---

## 13. Color Theme - Banyan (Earthy Greens)

**[REQ-THEME-001]** The app must use the "Banyan" color theme - earthy greens inspired by the banyan tree (symbol of roots, family, longevity):

| Token | Use | Value |
|-------|-----|-------|
| Primary | Buttons, links, nav highlights, active states | Deep forest green `#2E7D32` |
| Primary foreground | Text on primary backgrounds | White `#FFFFFF` |
| Secondary | Secondary buttons, subtle highlights, hover states | Soft sage `#E8F5E9` |
| Accent | Badges, CTAs, notifications, verified badge, spouse lines | Warm gold `#F9A825` |
| Background | Page background | Warm off-white `#FAFAF5` |
| Card / Surface | Cards, drawers, panels, modals | White `#FFFFFF` |
| Border | Dividers, input borders, card borders | Soft green-grey `#E0E4DD` |
| Text primary | Headings, body text | Dark charcoal `#1B2118` |
| Text muted | Secondary text, timestamps, placeholders | Muted olive `#6B7A6B` |
| Destructive | Delete actions, errors, rejected status | Red `#D32F2F` |
| Success | Confirmations, verified status | Primary green `#2E7D32` |
| Warning | Pending states, auto-approved claims | Amber `#F57F17` |

**[REQ-THEME-002]** Tree visualization relationship line colors:
- Biological parent-child: Primary green `#2E7D32` (solid)
- Spouse: Warm gold `#F9A825` (solid)
- Step/Adoptive: Blue-grey `#90A4AE` (dashed)
- Half-sibling: Blue-grey `#90A4AE` (dotted)

**[REQ-THEME-003]** Deceased person nodes must use `opacity-60` with desaturated/grayscale photo.
**[REQ-THEME-004]** All theme colors must be defined as CSS custom properties for consistency. No dark mode - single light theme only.
**[REQ-THEME-005]** The verified badge must use the accent gold color with a checkmark icon.

---

## 14. Guided Tree Building Wizard

**[REQ-WIZARD-001]** After signup, the system must present a step-by-step tree building wizard:
- **Step 1: "Add yourself"** - name, DOB, gender, gotra, photo (optional)
- **Step 2: "Add your parents"** - cards for father and mother with name + DOB fields
- **Step 3: "Add spouse / siblings"** - optional, skippable
- **Step 4: "Name your tree"** - tree name input with suggestion based on last name + city

**[REQ-WIZARD-002]** The wizard must show a progress bar at the top indicating current step.
**[REQ-WIZARD-003]** Each step must have a "Skip" option and a "Come back later" option that saves partial progress.
**[REQ-WIZARD-004]** The matching algorithm (REQ-CLAIM-002) must run after Step 2 (parents added) to maximize match quality.
**[REQ-WIZARD-005]** If matches are found, the wizard must pause and present them before proceeding to tree creation.
**[REQ-WIZARD-006]** The wizard must be mobile-first - single column, large touch targets, minimal scrolling per step.

---

## 15. Person Detail Drawer - Relationship Slots

**[REQ-SLOTS-001]** The person detail drawer/panel must display relationship slots visually:
- **Father**: show linked person mini-card, or an "Add Father" placeholder button
- **Mother**: show linked person mini-card, or an "Add Mother" placeholder button
- **Spouse(s)**: show linked person mini-card(s), plus "Add Spouse" button
- **Children**: show list of linked mini-cards, plus "Add Child" button
- **Siblings**: show list of linked mini-cards, plus "Add Sibling" button

**[REQ-SLOTS-002]** Each mini-card must show: photo thumbnail (or avatar), name, and birth year.
**[REQ-SLOTS-003]** Clicking a filled slot must navigate to / re-center the tree on that person.
**[REQ-SLOTS-004]** Clicking an empty "Add" slot must open the add-person form pre-filled with the correct relationship type.
**[REQ-SLOTS-005]** Relationship slots must visually indicate relationship type (icon or label: biological, step, adoptive).

---

## 16. Tree Statistics Card

**[REQ-STATS-001]** Each tree overview page must display a statistics card showing:
- Total members count
- Living vs deceased count
- Generation span (e.g., "5 generations, 1920s - present")
- Most common gotra (if multiple gotras exist in the tree)
- Oldest and youngest member names with birth years

**[REQ-STATS-002]** The statistics card must include a mini tree silhouette or sparkline visualization showing the tree's shape/density.
**[REQ-STATS-003]** Statistics must update in real-time as members are added/edited (invalidate via TanStack Query).
**[REQ-STATS-004]** On mobile, the statistics card must be collapsible to save screen space.

---

## 17. Smart PWA Install Prompt

**[REQ-INSTALL-001]** The app must show a custom "Add to Home Screen" banner on mobile/tablet devices.
**[REQ-INSTALL-002]** The banner must appear only after the user's 2nd visit or after they add their first family member (whichever comes first).
**[REQ-INSTALL-003]** The banner text: "Install Vansh for quick access to your family tree" with Install and Dismiss buttons.
**[REQ-INSTALL-004]** If dismissed twice, the banner must not appear again (tracked in localStorage).
**[REQ-INSTALL-005]** The banner must not appear on desktop devices.
**[REQ-INSTALL-006]** The banner must use the browser's `beforeinstallprompt` event for native install flow.

---

## 18. Search with Autocomplete & Filters

**[REQ-SEARCH-001]** The tree search page must have a typeahead/autocomplete input that shows results as the user types (debounced, 300ms).
**[REQ-SEARCH-002]** Autocomplete results must show both person names and tree names, visually distinguished (icon or label).
**[REQ-SEARCH-003]** The search page must display the user's recent searches (persisted in localStorage, max 5).
**[REQ-SEARCH-004]** The search page must have filter chips below the search input: filter by gotra, filter by tree size (small/medium/large).
**[REQ-SEARCH-005]** When no search query is entered, the page must show a curated "Browse popular trees" section showing the largest/most active trees.
**[REQ-SEARCH-006]** Search results must display as tree cards with: tree name, member count, top gotra(s), creation date, and a mini tree preview icon.

---

## 19. Notification Grouping

**[REQ-NOTIF-GROUP-001]** Notifications must be grouped by tree: e.g., "3 changes in Jain Family of Indore" with an expandable section showing individual items.
**[REQ-NOTIF-GROUP-002]** The notification panel must support a "Today" / "Earlier" time-based grouping within each tree group.
**[REQ-NOTIF-GROUP-003]** Grouped notifications must be collapsible/expandable. Marking a group as read marks all items within it.
**[REQ-NOTIF-GROUP-004]** The notification bell icon must show the total unread count (max display "99+").

---

## 20. Person Timeline View

**[REQ-TIMELINE-001]** Each person's detail drawer must have a "Timeline" tab alongside the default "Details" tab.
**[REQ-TIMELINE-002]** The timeline must show events in chronological order:
- Life events: Born, Married (with spouse name), Children born (with child names), Died
- Audit events: "Added to tree by [user] on [date]", "DOB updated by [user]", "Photo added by [user]"

**[REQ-TIMELINE-003]** The timeline must render as a vertical line with dots for each event and date labels.
**[REQ-TIMELINE-004]** Life events and audit events must be visually distinguishable (different colors or icons).
**[REQ-TIMELINE-005]** The timeline must be scrollable and work well on mobile (full-width, vertical layout).

---

## 21. Tree Comparison View (Merge Proposals)

**[REQ-COMPARE-001]** The merge proposal review page must include a visual tree comparison view showing both trees side by side.
**[REQ-COMPARE-002]** Matched nodes must be highlighted with color coding:
- Green: confirmed match (user-verified same person)
- Yellow: possible match (system-suggested)
- Red: conflict (differing data)

**[REQ-COMPARE-003]** Users must be able to drag-to-link: drag a node from Tree A to a node in Tree B to manually map them as the same person.
**[REQ-COMPARE-004]** On mobile, the comparison must switch to a stacked view (Tree A on top, Tree B below) with tap-to-link instead of drag.
**[REQ-COMPARE-005]** The comparison view must have a summary panel showing: total matches, conflicts, and unmatched nodes from each tree.

---

## 22. Onboarding Tour

**[REQ-TOUR-001]** First-time users must see a guided tour (using driver.js) after their tree is created, highlighting key UI elements.
**[REQ-TOUR-002]** The tour must have 4-5 steps max:
1. "This is your family tree - click any person to see their details"
2. "Use these buttons to switch between tree views"
3. "Click here to add a new family member"
4. "Share your tree with family using this link"
5. "Upload your Aadhaar to get verified" (points to profile)

**[REQ-TOUR-003]** The tour must be dismissible at any step ("Skip tour" button).
**[REQ-TOUR-004]** The tour must be shown only once per user (tracked in localStorage or user preferences).
**[REQ-TOUR-005]** The tour must be re-accessible from a "Help" or "?" button in the header.

---

## 23. Mobile Bottom Navigation

**[REQ-MOBNAV-001]** On mobile viewports (< 768px), the app must display a fixed bottom navigation bar replacing the hamburger menu for primary navigation.
**[REQ-MOBNAV-002]** The bottom nav must have 5 items:
1. Home (landing/dashboard)
2. My Tree (direct link to user's tree)
3. Search (tree search page)
4. Notifications (with unread badge)
5. Profile (user settings/profile)

**[REQ-MOBNAV-003]** The active route must be visually highlighted (filled icon + label vs outlined icon).
**[REQ-MOBNAV-004]** The bottom nav must not appear on tablet (>= 768px) or desktop - use sidebar/top navigation instead.
**[REQ-MOBNAV-005]** The bottom nav must have a safe area padding for devices with home indicators (iPhone notch area).
**[REQ-MOBNAV-006]** All bottom nav icons must meet 44x44px minimum touch target.

---

## User Experience & Design

### User Flow: New User Onboarding
1. User visits Vansh landing page - sees feature highlights and signup CTA
2. User signs up (email + password + name)
3. **Guided wizard begins**: Step 1 (add yourself), Step 2 (add parents), Step 3 (spouse/siblings), Step 4 (name tree)
4. After Step 2, system runs matching against existing trees
5. If match found: wizard pauses, user reviews and confirms or declines
6. If confirmed: claim request sent, user can browse tree while waiting
7. If no match / declined: new tree created from wizard data
8. **Onboarding tour** highlights key tree UI elements
9. User prompted to upload Aadhaar for verification (optional but encouraged)
10. After 2nd visit, **smart install prompt** appears on mobile

### User Flow: Adding Family Members
1. User opens person detail drawer and sees **relationship slots** (Father: _Add_, Mother: _Add_, etc.)
2. Clicks an empty slot - form opens pre-filled with correct relationship type
3. System checks for duplicates as user types (debounced, shows inline suggestions)
4. User submits - person added to tree, visible immediately
5. **Person timeline** updates with "Added by [user]" event

### User Flow: Tree Browsing (Public)
1. User (logged in or not) visits tree search page
2. Sees **recent searches** and **popular trees** before typing
3. Types in search - **autocomplete** shows results as they type
4. Can apply **filter chips** (gotra, tree size)
5. Results show tree cards with **statistics** (member count, generations, gotra)
6. Clicking a tree opens the interactive tree view (read-only for non-members)
7. User can copy the tree's shareable URL

### User Flow: Merge Review
1. User opens a merge proposal from notifications
2. **Tree comparison view** shows both trees side by side with color-coded matches
3. User reviews auto-detected matches (yellow), confirms or rejects each
4. User can **drag-to-link** unmatched nodes manually
5. Conflicts shown in red with side-by-side data comparison
6. User resolves conflicts and approves the merge

### UI States
- **Loading**: Skeleton loaders for tree rendering, spinner for data fetches
- **Empty**: Illustrated empty states ("Your tree is empty - start by adding yourself", "No search results found", popular trees shown when no query)
- **Error**: Toast notifications for transient errors, inline error messages for form validation, RFC 9457 field-level errors mapped to form inputs
- **Success**: Toast for successful actions (person added, claim submitted, etc.)
- **Offline**: Offline fallback page with cached shell

### Design System
- Follow Pioneer's shadcn/ui + Tailwind setup with CSS custom properties
- **Banyan theme** (Section 13): earthy greens, warm gold accent, warm off-white background. No dark mode.
- Mobile-first responsive design (critical for tree visualization)
- Color coding for relationship types: green (biological), gold (spouse), blue-grey dashed (step/adoptive)
- Verified badge: gold checkmark icon (accent color)
- Deceased persons: subtle visual distinction (grayscale photo with `opacity-60`, dates with dagger symbol)
- `cn()` utility for all class merging
- driver.js for onboarding tours

### Responsive Breakpoints (CRITICAL)
All pages and components must be tested at:
- **375px** (mobile) - single column layouts, bottom sheets / drawers for details, **fixed bottom navigation bar**, no hamburger menu
- **768px** (tablet) - two column where appropriate, side panel for tree details, top/sidebar navigation
- **1024px+** (desktop) - full layouts with sidebars, hover states, expanded navigation

### Accessibility
- Tree visualization must have an alternative list/table view for screen readers
- All interactive elements must meet 44x44px touch targets
- Form inputs must have proper labels (`<label htmlFor>`), `autocomplete`, and correct `type` attributes
- Keyboard navigation for tree nodes (arrow keys to traverse relationships)
- Icon-only buttons must have `aria-label`
- Semantic HTML: `<button>` for actions, `<Link>` for navigation, never `<div onClick>`
- Visible focus indicators via `focus-visible:ring-*`
- `aria-live="polite"` for toast notifications
- Images must have `alt` attributes
- `motion-reduce:` prefix honored for animations

---

## Technical Considerations

### Architecture (MANDATORY)

**Backend layered architecture** (per `node-code-writing-rules.md`):
Every backend component must follow: `controllers/` | `services/` | `routes/` | `validation/` | `constants/` (optional) | `errors/` (optional)
- Controllers: thin coordinators, no business logic, no try-catch (let errors propagate to middleware)
- Services: all business logic, HTTP-agnostic (no req/res/status codes), transactions only here
- Routes: endpoint definitions with Zod validation middleware
- Validation: input validation (Zod) in middleware, business validation in services
- Errors: domain error classes per component, shared errors in `server/src/shared/errors/`

**Frontend component architecture** (per `react-code-writing-rules.md`):
- Page Components (`/features/[x]/pages/`) - orchestration + layout only
- Container Components (`/features/[x]/components/containers/`) - data fetching + hooks
- Presentational Components - props + render only
- One component per file, functional components only, TypeScript strict mode
- TanStack Query for all server state (no useEffect fetching)
- React Hook Form + Zod for all forms
- Error boundaries (react-error-boundary) wrapping each feature

**Error handling**: All API errors must follow RFC 9457 Problem Details format. Frontend uses shared `ApiError` class for structured error handling with field-level error mapping.

**API response caching**: All `/api/*` routes default to `no-store`. Cache only reference data at route level.

**OpenAPI documentation**: All API endpoints must be documented in `docs/openapi.yaml`.

### Data Model (Core Tables)

**users** - App user accounts
- id (uuid, PK), email (unique), passwordHash, firstName, lastName, phone, role (enum: user/admin), verificationStatus (enum: unverified/pending/verified/rejected), aadhaarPhotoKey, isActive, lastActiveAt, createdAt (timestamptz), updatedAt (timestamptz)
- Indexes: email (unique), role, verificationStatus

**sessions** - Auth sessions
- id (uuid, PK), userId (FK -> users), token (unique), expiresAt (timestamptz), createdAt (timestamptz)
- Indexes: token (unique), userId, expiresAt

**password_reset_tokens** - Password reset flow
- id (uuid, PK), userId (FK -> users), token (unique), expiresAt (timestamptz), usedAt (timestamptz, nullable), createdAt (timestamptz)
- Indexes: token (unique), userId

**trees** - Family trees
- id (uuid, PK), name, slug (unique, URL-friendly), createdById (FK -> users), memberCount (denormalized), generationCount (denormalized), createdAt (timestamptz), updatedAt (timestamptz)
- Indexes: slug (unique), name (for search), createdById

**tree_members** - Verified members of a tree (junction table)
- id (uuid, PK), treeId (FK -> trees), userId (FK -> users), joinedAt (timestamptz), status (enum: active/inactive)
- Indexes: (treeId, userId) unique compound, treeId, userId

**persons** - People in trees (nodes)
- id (uuid, PK), treeId (FK -> trees), firstName, middleName, lastName, gender (enum: male/female/other), dateOfBirth (date), dateOfDeath (date, nullable), gotra, phone, email, photoKey, bio (text, max 500), claimedByUserId (FK -> users, nullable), createdAt (timestamptz), updatedAt (timestamptz)
- Indexes: treeId, claimedByUserId, (treeId, lastName) compound for search, gotra

**relationships** - Edges between persons
- id (uuid, PK), treeId (FK -> trees), personId1 (FK -> persons), personId2 (FK -> persons), relationshipType (enum: parent_child/spouse/step_parent_child/adoptive_parent_child/half_sibling), marriageDate (date, nullable), divorceDate (date, nullable), createdAt (timestamptz)
- Indexes: treeId, personId1, personId2, (personId1, personId2) compound, relationshipType

**claims** - Node claim requests
- id (uuid, PK), personId (FK -> persons), userId (FK -> users), status (enum: pending/approved/rejected/auto_approved), reviewedByUserId (FK -> users, nullable), reviewedAt (timestamptz, nullable), autoApproveAt (timestamptz), createdAt (timestamptz)
- Indexes: personId, userId, status

**merge_proposals** - Tree merge proposals
- id (uuid, PK), treeAId (FK -> trees), treeBId (FK -> trees), proposedByUserId (FK -> users), status (enum: pending/approved/rejected/expired), approvedByTreeAUserId (FK -> users, nullable), approvedByTreeBUserId (FK -> users, nullable), createdAt (timestamptz), resolvedAt (timestamptz, nullable)
- Indexes: treeAId, treeBId, status, proposedByUserId

**merge_proposal_mappings** - Person-to-person mappings in a merge
- id (uuid, PK), mergeProposalId (FK -> merge_proposals), personAId (FK -> persons), personBId (FK -> persons), confidence (enum: auto/confirmed), conflictResolutions (jsonb, nullable)
- Indexes: mergeProposalId

**audit_logs** - All data changes
- id (uuid, PK), treeId (FK -> trees, nullable), personId (FK -> persons, nullable), userId (FK -> users), action (enum: create/update/delete/claim_approve/claim_reject/merge/revert), entityType (string), entityId (uuid), oldValue (jsonb, nullable), newValue (jsonb, nullable), createdAt (timestamptz)
- Indexes: treeId, personId, userId, createdAt, (treeId, createdAt) compound

**notifications** - In-app notifications
- id (uuid, PK), userId (FK -> users), treeId (FK -> trees, nullable - for grouping), type (string), title, message, linkUrl, isRead (boolean, default false), createdAt (timestamptz)
- Indexes: (userId, isRead) compound, (userId, treeId) compound, userId, createdAt

**deletion_requests** - Person deletion requests
- id (uuid, PK), personId (FK -> persons), treeId (FK -> trees), requestedByUserId (FK -> users), reason (text), status (enum: pending/approved/rejected), reviewedByUserId (FK -> users, nullable), createdAt (timestamptz), resolvedAt (timestamptz, nullable)
- Indexes: status, treeId

### Database Rules (per `node-code-writing-rules.md`)
- All timestamps must use `timestamptz` with explicit `{ withTimezone: true, mode: 'date' }` config
- All date validation must use `z.coerce.date()`
- All API responses must use `.toISOString()` for dates
- All list endpoints must use page-based pagination: `{ page, limit, total, totalPages }`
- Migrations via `drizzle-kit generate` only - never modify DB manually
- Schemas split by domain in `db/schema/` with index re-export

### Integration Points
- File storage: Local filesystem or S3-compatible storage for Aadhaar photos and profile photos
- Tree visualization: D3.js or a dedicated graph library (e.g., react-flow, cytoscape.js, or d3-hierarchy)
- PWA: vite-plugin-pwa with Workbox for service worker generation

### Performance Requirements
- Tree rendering must be smooth for 500+ nodes (canvas/WebGL for large trees)
- Search must return results within 2 seconds
- Matching algorithm must run within 3 seconds per person added
- Lists >50 items must be virtualized (`@tanstack/virtual` or `virtua`)
- Images must have `width`/`height` and `loading="lazy"` below fold

### Security Considerations
- Aadhaar photos must be stored encrypted and only accessible to app admins
- Rate limiting on signup, login, search, and password reset endpoints
- Input sanitization on all user inputs (XSS prevention)
- Session expiration and rotation
- CORS configuration for API
- Aadhaar photos must never be served to non-admin users
- Password reset tokens: single-use, 1-hour expiry, cryptographically random
- Static asset serving: `index.html` with `no-cache, no-store, must-revalidate`; hashed assets with `public, max-age=31536000, immutable`
- Structured JSON logging (Pino) - never log passwords, tokens, or PII

### Dependencies
- Pioneer project patterns for monorepo setup, auth, RBAC, UI components
- Graph visualization library (to be selected during implementation)
- Image upload handling (multer or similar)
- vite-plugin-pwa for PWA support
- date-fns for date formatting (never `.toLocaleString()`)
- driver.js for onboarding tours (matching Pioneer's pattern)

---

## Edge Cases & Error Scenarios

1. **Circular Relationship Prevention**
   - Scenario: User tries to add Person A as both parent and child of Person B
   - Expected Behavior: System validates relationship graph and rejects with clear error message

2. **Duplicate Claim Attempt**
   - Scenario: Two users try to claim the same tree node
   - Expected Behavior: First claim is processed; second user sees "This node has a pending/approved claim"

3. **Merge with Conflicting Relationships**
   - Scenario: Tree A says Person X is parent of Person Y; Tree B says they're siblings
   - Expected Behavior: Flagged as a relationship conflict in merge proposal; users must resolve before merge can complete

4. **User Deactivation with Active Claims**
   - Scenario: Admin deactivates a user who has pending claims or is the only verified member of a tree
   - Expected Behavior: Pending claims are cancelled. If they were the only verified member, tree enters "no active members" state (next claimer auto-approves)

5. **Self-Referential Relationship**
   - Scenario: User tries to add a person as their own spouse/parent/child
   - Expected Behavior: System rejects with validation error

6. **Large Tree Performance**
   - Scenario: Tree has 1000+ members
   - Expected Behavior: Progressive loading - render visible portion first, load branches on expand. Consider virtualization.

7. **Aadhaar Upload Failures**
   - Scenario: File too large, wrong format, or upload interrupted
   - Error Message: "Please upload a clear photo of your Aadhaar card (JPG or PNG, max 5MB)"
   - Recovery: User can retry upload from their profile

8. **Merge Proposal Abandonment**
   - Scenario: A merge proposal has no activity from either side for 30+ days
   - Expected Behavior: System marks proposal as "expired". Either party can create a new proposal later.

9. **Tree with Zero Members**
   - Scenario: All persons in a tree are deleted (unlikely but possible via admin)
   - Expected Behavior: Tree is archived, not deleted. Can be restored by admin.

10. **Concurrent Edits**
    - Scenario: Two verified members edit the same person's data simultaneously
    - Expected Behavior: Last write wins, but both edits are logged in audit trail. No data loss - previous values preserved in history.

11. **Password Reset Token Reuse**
    - Scenario: User tries to use an already-used or expired password reset token
    - Expected Behavior: System rejects with "This reset link has expired or already been used. Please request a new one."

12. **PWA Stale Cache**
    - Scenario: User has the app installed and a new version is deployed
    - Expected Behavior: Service worker detects update, shows "Update Available" prompt. User taps to refresh and get latest version.

13. **Offline Tree Viewing**
    - Scenario: User opens installed PWA without internet
    - Expected Behavior: App shell loads from cache. If the tree was previously viewed, cached data is shown with an "offline" indicator. If no cached data, offline fallback page is shown.
