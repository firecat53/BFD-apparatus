# Repository Guidelines
This dashboard is a static SPA for managing fire department apparatus. Use this guide to keep contributions consistent.

## Project Structure & Module Organization
- `dashboard.html` contains the entire app (markup, styles, logic) for quick iteration.
- Data sits in `localStorage`; use a dedicated browser profile to keep demo data stable.

## Build, Test, and Development Commands
- `python3 -m http.server 8000` — serve the root and browse to `http://localhost:8000/dashboard.html` (or open the file directly via `xdg-open dashboard.html`).
- Use DevTools ▶ Application ▶ Local Storage to inspect or wipe fixtures while iterating.

## Coding Style & Naming Conventions
- Use 2-space indentation, camelCase identifiers, and keep lines near 100 chars.
- Default to `const` for stable bindings; reserve `let` for reassignment.
- CSS classes stay hyphen-case (e.g., `admin-btn`, `station-header`); apparatus colors derive from type-to-class mapping (`Fire → red`, …, `Utility → black`).

## Data Model
- Stations persist as `[{ stationId, name, order }]`; the `order` field tracks drag-reordered cards and is regenerated on every move or delete.
- Apparatus records persist as `[{ apparatusNumber, id, apparatusType, notes, homeStationId, stationId }]`, where the number is the primary key, `homeStationId` drives ghosts, and `stationId` can be blank for unassigned inventory.

## Testing Guidelines
- No automated suite exists; cover Chromium-based and Firefox browsers manually.
- Confirm desktop drag/drop for apparatus reassignment and station reordering, refreshing to verify persistence.
- On touch devices, tap-to-move via the edit modal and confirm ghosts remain; reset state with `localStorage.clear()` when needed.

## Commit & Pull Request Guidelines
- Use imperative Conventional Commit subjects (`feat: add apparatus filtering`)
  and keep bodies concise with bullet points for follow-up context.
- Reference related issue IDs when available and note any UI-affecting changes;
  include before/after screenshots for visual updates.
- PR descriptions should list testing done, manual browsers exercised, and any
  data-migration steps the reviewer must run.

## Feature Expectations
- Responsive grid tailored for large displays and touch layouts.
- Desktop drag/drop handles apparatus moves and station reordering; positions persist via `order`.
- Touch users tap an apparatus to pick a destination; ghosts remain at home stations.
- Admin tabs manage dozens of records with type-aware colors and duplicate-number checks.
- Data tab provides JSON export/import for backing up or restoring `stations` and `apparatus` records.
