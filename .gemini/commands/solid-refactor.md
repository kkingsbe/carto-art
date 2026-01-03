# /solid-refactor

## Command Description
Analyze the codebase to identify complex, multi-purpose files that violate SOLID principles, then generate a comprehensive refactoring plan.

---

## Agent Instructions

### Phase 1: Codebase Discovery

1. **Map the project structure**
   - Identify the primary language(s) and framework(s) in use
   - Locate source directories (e.g., `src/`, `lib/`, `app/`)
   - Note the existing architectural patterns (MVC, layered, modular, etc.)

2. **Gather file metrics** for each source file:
   - Lines of code (LOC)
   - Number of classes/functions/methods
   - Number of imports/dependencies
   - Cyclomatic complexity (if tooling available)
   - Number of public exports

### Phase 2: Complexity Analysis

Score each file on these violation indicators:

| Indicator | What to Look For |
|-----------|------------------|
| **Size** | Files > 300 LOC or > 10 functions |
| **Mixed Concerns** | Files handling UI + business logic + data access |
| **God Classes** | Classes with > 7 methods or > 5 dependencies |
| **Feature Envy** | Methods that use other classes' data more than their own |
| **Shotgun Surgery** | Single changes requiring edits across many files |
| **Divergent Change** | Files modified for unrelated reasons |

### Phase 3: SOLID Violation Mapping

For each complex file identified, categorize violations:

#### S - Single Responsibility Principle
- Does this file/class have more than one reason to change?
- List each distinct responsibility found

#### O - Open/Closed Principle  
- Are there switch statements or if-else chains based on type?
- Is behavior extended via modification rather than extension?

#### L - Liskov Substitution Principle
- Do subclasses override methods in ways that break parent contracts?
- Are there type checks followed by different behavior?

#### I - Interface Segregation Principle
- Are interfaces/abstract classes forcing implementations to include unused methods?
- Do consumers depend on methods they don't use?

#### D - Dependency Inversion Principle
- Do high-level modules import low-level modules directly?
- Are concrete implementations hardcoded rather than injected?

### Phase 4: Generate Refactoring Plan

Structure the output as follows:

```markdown
# SOLID Refactoring Plan for [Project Name]

## Executive Summary
- Total files analyzed: X
- High-complexity files identified: Y  
- Estimated refactoring effort: [hours/days]

## Priority Matrix

| File | LOC | Violations | Impact | Effort | Priority |
|------|-----|------------|--------|--------|----------|
| ... | ... | S, O, D | High | Medium | P1 |

## Detailed Refactoring Recommendations

### [Filename] - Priority [P1/P2/P3]

**Current State:**
- Brief description of what the file does
- List of identified responsibilities

**Violations:**
- [S] Description of SRP violation
- [O] Description of OCP violation
- etc.

**Proposed Changes:**

1. **Extract [NewClassName/NewFileName]**
   - Move: [list of functions/methods]
   - Rationale: [why this improves SOLID compliance]

2. **Introduce [InterfaceName]**
   - Abstract: [what behavior]
   - Implementors: [list of concrete classes]

3. **Inject [DependencyName]**
   - Replace: [hardcoded dependency]
   - With: [injected abstraction]

**Before/After Sketch:**
```
// Before
class GodClass {
  handleAuth() { }
  validateData() { }
  saveToDb() { }
  sendEmail() { }
}

// After
class AuthService { }
class DataValidator { }
class UserRepository { }
class NotificationService { }
```

**Migration Steps:**
1. Step-by-step instructions
2. With test checkpoints
3. And rollback considerations

### [Next File...]

## Dependency Graph Changes
- Visual or textual representation of how module dependencies will change

## Testing Strategy
- What tests need to be added/modified
- How to verify behavior preservation

## Implementation Phases
- Phase 1: [Low-risk extractions]
- Phase 2: [Interface introductions]  
- Phase 3: [Dependency injection refactors]
- Phase 4: [Cross-cutting concerns]

## Risk Assessment
- Breaking change risks
- Performance considerations
- Team knowledge requirements
```

### Phase 5: Validation Checklist

Before finalizing the plan, verify:

- [ ] Each extraction has a clear single responsibility
- [ ] No circular dependencies introduced
- [ ] Abstractions are stable (unlikely to change)
- [ ] Concrete implementations are volatile (easy to swap)
- [ ] Interface contracts are minimal and cohesive
- [ ] High-level policy doesn't depend on low-level detail

---

## Usage Examples

```
/solid-refactor
/solid-refactor --focus=services
/solid-refactor --max-files=10
/solid-refactor --skip-tests
```

## Output Formats

The agent should offer to output the plan as:
- Markdown document (default)
- GitHub issues (one per high-priority file)
- Jira tickets (if integration available)
- Architecture Decision Records (ADRs)