# Rule: Generating a Feature Requirements Document (FRD)

## Goal

To guide claude code (you) in creating a clear, actionable feature Requirements Document (FRD) in Markdown format from a feature request shared by the user. The FRD should be thorough but concise, suitable for you to understand and implement the feature with project context. Avoid bloat—scale the detail to match the feature complexity.

## Process

1.  **Receive Initial Prompt:** The user provides a brief description or request for a new feature or functionality.
2.  **Ask Clarifying Questions:** Before writing the FRD, you *must* ask clarifying questions to gather sufficient detail. The goal is to understand the "what" and "why" of the feature, not necessarily the "how" (which the developer will figure out). Always list questions in letter/number lists so the user can respond easily with selections.
3.  **Iterate on Answers:** If responses are vague or incomplete, ask follow-up questions to ensure clarity.
4.  **Generate FRD:** Based on the initial prompt and the user's answers, generate a FRD using the structure outlined below. Scale detail to feature complexity.
5.  **Review with User:** Present the FRD and ask if any sections need clarification or expansion.
6.  **Save FRD:** Save the finalized document as `[n]-frd-[feature-name].md` inside the `/tasks` directory. (Where `n` is a zero-padded 4-digit sequence starting from 0001, e.g., `0001-frd-user-authentication.md`, `0002-frd-dashboard.md`, etc.)

## Clarifying Questions Framework

Ask targeted questions based on the feature complexity. **DO NOT ask all questions**— think of the most relevant ones for the specific feature. Some examples:

### 1. Problem & Goals
*   What specific problem does this feature solve for users?
*   What is the primary goal we want to achieve?

### 2. Core Functionality
*   What are the 2-5 key actions users should be able to perform?
*   What is the primary user flow? (Step-by-step journey)
*   What data needs to be displayed, created, updated, or deleted?
*   Are there any real-time or interactive elements required?

### 3. User Stories & Scenarios
*   Could you provide 2-5 user stories using this format:
    - "As a [user type], I want to [action] so that [benefit]"
*   What are the most common use cases vs. edge cases?

### 4. Acceptance Criteria
*   How will we verify this feature works correctly?
*   What are the must-have behaviors for each user story?
### 5. Scope & Boundaries
*   What is explicitly OUT of scope for this feature? (Non-goals)
*   Should this be built in phases? If so, what's the MVP vs. future enhancements?
*   Are there any features this should NOT integrate with?

### 6. UI/UX & Design
*   Should this follow an existing design system or component library?
*   What are the key UI states? (loading, empty, error, success)
*   Any specific accessibility requirements (WCAG level, screen readers)?

### 7. Technical Constraints
*   Are there any known technical limitations or dependencies?
*   Should this integrate with existing systems/APIs/services?
*   Any performance requirements? (page load time, response time)
*   Any security or privacy considerations?

### 8. Edge Cases & Error Handling
*   What should happen if the user has no data?
*   What should happen if external services fail?
*   What are the validation rules for user inputs?
*   How should errors be communicated to users?

### 9. Dependencies & Assumptions
*   Does this depend on other features being completed first?
*   What assumptions are we making about user behavior or system state?
*   Are there any third-party integrations required?

## PRD Structure

The generated PRD should include these sections. **Scale the detail to the feature complexity**—simple features need brief sections, complex features need comprehensive detail. Omit sections that don't apply:

### Functional Requirements

List specific, testable functionalities using this format:

**[Category Name]**
1. **[REQ-001]** The system must [specific requirement]
2. **[REQ-002]** The system should [specific requirement]
3. **[REQ-003]** The system must [specific requirement]

**Requirements Writing Best Practices:**
- Use "must" for mandatory requirements.
- Each requirement should be atomic (test one thing)
- Use clear, active voice
- Be specific about behavior, not implementation
- Include validation rules, constraints, and limits
### User Experience & Design (optional - wherever applicable)

**User Flow:**
- Step-by-step description of the primary user journey

**UI States:**
- Loading state: [description]
- Empty state: [description]
- Error state: [description]
- Success state: [description]

**Design References:** (if applicable)
- Component library to use (e.g., shadcn/ui)
- Design system guidelines

**Accessibility:**
- [Specific requirements, e.g., WCAG 2.1 AA compliance]

### Technical Considerations (if applicable)

**Integration Points:**
*   [System/API/Service to integrate with]

**Data Model Changes:**
*   [New tables, fields, or schema changes needed]

**Performance Requirements:**
*   [Page load time, query response time, concurrent users]

**Security Considerations:**
*   [Authentication/authorization requirements]
*   [Data validation and sanitization needs]
*   [Privacy/compliance requirements]

**Dependencies:**
*   [Other features that must be completed first]
*   [Third-party services or libraries required]

### Edge Cases & Error Scenarios

List specific edge cases and how the system should handle them:

1. **[Edge Case Name]**
   - Scenario: [Description]
   - Expected Behavior: [How system should respond]

2. **[Error Scenario Name]**
   - Scenario: [Description]
   - Error Message: [Specific user-facing message]
   - Recovery: [How user can recover]
## Output Format

*   **Format:** Markdown (`.md`)
*   **Location:** `/tasks/`
*   **Filename:** `[n]-frd-[feature-name].md`
*   **Numbering:** Zero-padded 4-digit sequence (0001, 0002, etc.)
*   **prompt-save:** Save the original prompt in a similar sequence name `0001-prompt-[feature-name].md` under /prompts directory. Also save the clarifying questions and responses.
## Final Instructions

1. **Do NOT start implementing the FRD** - this document is for planning only
2. **Always ask clarifying questions first** - never skip this step
3. **Iterate on user responses** - ask follow-ups if answers are unclear
4. **Match detail to complexity** - simple features get simple FRDs, complex features get comprehensive FRDs
5. **Omit unnecessary sections** - if a section doesn't apply or adds no value, skip it
6. **Be concrete when needed** - include examples for complex requirements, skip for obvious ones
7. **Quality** - ensure clarity and completeness without bloat
