# AI Development Workflow

This doc explains how to use AI efficiently on this repo without making the
codebase harder for humans to understand.

## Operating Model

Use AI for:

- Reading epics and turning them into small implementation slices.
- Refactoring narrow seams.
- Writing tests around behavior before broad changes.
- Updating docs and status after code changes.
- Producing review summaries and risk notes.

Avoid using AI for:

- Large rewrites without a confirmed architecture decision.
- Inventing product decisions that are still open.
- Mixing unrelated changes into one commit.
- Treating model confidence as calibrated truth.

## Ideal AI Task Prompt

Good task prompts include:

- Files to read first.
- Product intent.
- Non-negotiable constraints.
- Desired scope of the first slice.
- Verification expectations.
- Whether to commit.

Example:

```text
Read AGENTS.md, docs/STATUS.md, and Epics/02_UI/epic.md.
Implement only the next safest UI slice.
Do not touch the processing pipeline unless necessary.
Before editing, tell me expected files and risks.
Run py_compile and relevant tests.
Do not commit until I ask.
```

## Planning Standard

Before editing, AI should answer:

- What files are expected to change?
- What behavior must be preserved?
- What is the smallest useful milestone?
- What are the main risks?
- What tests or checks will verify the change?

## Implementation Standard

- Prefer one clear seam over broad rewrites.
- Keep UI and backend/pipeline work separate unless the task requires both.
- Add docs when behavior, setup, or known limitations change.
- Record pending decisions in docs or epics.
- Keep README human-readable; put AI-heavy details in `AGENTS.md`, `docs/STATUS.md`, and this file.

## Review Standard

A final AI handoff should include:

- What changed.
- What did not change.
- Verification run.
- Known limitations.
- Suggested next steps.

## Commit Standard

Use focused commit messages:

```text
Document AI development workflow
Route extraction through AWS Bedrock
Add UI status shell
```

Before commit:

```bash
git status --short
git diff --stat
```

Stage only the intended files.

## Epic Maintenance

After each meaningful implementation slice:

- Update `docs/STATUS.md`.
- Update the relevant epic/task status.
- Add follow-up tasks for newly discovered work.
- Consolidate completed work into the epic summary instead of leaving stale open tasks.

