# Changelog

All notable changes to the TodoLane extension will be documented in this file.

## [1.0.0] - 2026-06-15

### 🚀 Initial Release

- **New Todo command** — multi-step creation with title, description (200-word limit), priority, and due date/time
- **Sidebar panel** — full tree view in the Activity Bar showing all todos
- **Priority system** — High 🔴 / Medium 🟡 / Low 🟢
- **Description field** — optional 200-word description per todo, visible in hover tooltip
- **Due date & time** — set specific deadlines with relative display (Today, Tomorrow)
- **Status tracking** — Pending ⬜ / Done ✅ / Cancelled ❌
- **Inline actions** — Edit, Mark Done, Cancel, Delete buttons on each todo
- **Reminder notifications** — VS Code warning popup when due time is reached
- **Filter options** — All / Pending / Done / Cancelled via view title menu
- **Smart sorting** — pending first (by priority, then due date), then done, then cancelled
- **Rich tooltips** — hover for full details including description and timestamps
- **Overdue indicators** — ⚠️ marker on past-due pending todos
- **Status bar button** — quick access to create a new todo
- **Local storage** — `.devbookmark/todos.json` with auto `.gitignore` entry
- **Zero dependencies** — only VS Code API + Node.js built-in modules
- **Custom icon** — unique, AI-generated icon with no copyright issues
