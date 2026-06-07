# Epics Backlog

This folder holds implementation-ready backlog items for AI-assisted development.

## Current Epic Status

| Epic | Status | Notes |
|---|---|---|
| `01_Bedrock` | Partial | Bedrock-only code path exists; live AWS validation, production auth, and ZDR verification remain. |
| `02_UI` | Partial | Tkinter shell is incremental; static web-style prototype and port task exist; reviewer correction workflow is not ready. |
| `03_Packaging` | Not started | Installer, auto-update, and code signing remain productization work. |
| `04_Tenant` | Not started | Office accounts, usage attribution, and shared billing model remain open. |
| `05_Architecture` | Pending decision | Desktop-direct Bedrock vs backend service still needs a product/architecture decision. |

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

## Cleanup Rule

When a task is completed:

- Mark it clearly in the task file or epic summary.
- Move newly discovered follow-up work into a new numbered task.
- Do not delete product context just because the first implementation slice landed.
- Keep `docs/STATUS.md` aligned with the epic state.
