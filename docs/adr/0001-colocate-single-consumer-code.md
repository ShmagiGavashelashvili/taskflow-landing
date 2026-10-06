# 1. Keep single-consumer code with its consumer

Status: accepted (2026-10-07)

## Context

An earlier refactor moved every constant, helper and hook out of component files into `constants/`, `lib/` and `hooks/`. In practice many of those had exactly one consumer (button class maps, avatar maps, mockup data, email validation), so understanding one module meant reading three or four files.

## Decision

Shared things live in the dedicated folders (`constants/`, `lib/`, `hooks/`, `context/`, `types/`). A constant, helper or type with a single consumer lives next to that consumer, private to its module. When a second consumer appears, move it to the shared folder.

Hooks stay in `hooks/` regardless: they are small, and a second caller is plausible.

## Consequences

- `constants/` holds site-wide values (`site.ts`) and values shared by several modules (`tones.ts`).
- Tests go through the owning module's interface instead of importing its internals.
- Architecture reviews should not re-propose moving single-consumer code back into shared folders.
