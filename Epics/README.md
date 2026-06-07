# Epics Backlog

This folder holds implementation-ready backlog items for AI-assisted development.

## Format

Each epic lives in its own folder with:
- `epic.md` for the overall objective, scope, and decisions
- numbered task/story files for implementation items

## Reading Order

1. Start with `epic.md` in the epic folder.
2. Work task files in numeric order.
3. Treat the `Open Questions` section as blocking only when the task explicitly depends on it.

## Conventions

- Use the current repository architecture unless the epic explicitly calls for change.
- Preserve current behavior unless a task says otherwise.
- Prefer small, reversible implementation steps.
- When a task says `Decision Pending`, do not invent the missing detail. Capture it in the implementation notes or ask the user.
