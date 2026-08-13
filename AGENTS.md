# Repository working rules

## Roadmap discipline

`ROADMAP.md` is the source of truth for work in this repository. For **every change**—code, tests, configuration, documentation, tooling, or operational policy—follow this process:

1. Before editing, locate the related roadmap item. If none exists, add a small, scoped checklist item to the appropriate milestone (or add a new milestone only when necessary).
2. In the same pull request, update the roadmap:
   - Mark a finished checklist item `[x]`.
   - Mark active or blocked work in its milestone status and record the reason.
   - Add a session-log entry with the PR, completed work, next concrete action, and decisions/blockers.
3. Include the roadmap item or milestone in the PR description.
4. Do not mark an item complete until its stated acceptance criteria and relevant validation have passed.

For a change that does not advance a delivery milestone (for example, a typo or maintenance-only change), still add a session-log entry. This preserves a complete multi-session audit trail without inventing product scope.

## Pull request completion

- When a work item is finished and its validation passes, commit and push the scoped changes, then create a GitHub pull request marked ready for review.
- Do not leave completed work only in the local worktree or as a draft pull request unless the user explicitly requests that state.

## Scope and safety

- Keep one pull request focused on one roadmap item or a tightly related slice.
- Preserve optional integrations and provider/framework boundaries unless the roadmap explicitly calls for changing them.
- Keep secrets server-side and out of configuration committed to the repository.
