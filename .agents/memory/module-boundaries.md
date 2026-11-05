---
name: Module boundaries
description: Scope rule for changes to AI Exam Survival modules.
---

When building a feature for one module, preserve the homepage, shared navigation, and previously completed modules unless the user explicitly asks to change them. This is especially important for the Study Planner when work is scoped to another module.

**Why:** The user has repeatedly asked that each sprint preserve existing pages and avoid modifying other modules.

**How to apply:** Keep edits focused on the requested page and its feature data; check the diff to confirm unrelated module files were not changed.
