# Repository Guidelines

This dashboard is a static SPA for managing fire department apparatus. Use this
guide to keep contributions consistent.

## Project Structure & Module Organization
- `dashboard.html` contains the entire app (markup, styles, logic) for quick
  iteration.
- Data sits in `localStorage`; use a dedicated browser profile to keep demo data
  stable.

## Build, Test, and Development Commands
- `python3 -m http.server 8000` — serve the root and browse to
  `http://localhost:8000/dashboard.html` (or open the file directly via
  `xdg-open dashboard.html`).
- Use DevTools ▶ Application ▶ Local Storage to inspect or wipe fixtures while
  iterating.

## Coding Style & Naming Conventions
- Use 2-space indentation, camelCase identifiers, and keep lines near 100 chars.
- Default to `const` for stable bindings; reserve `let` for reassignment.
- CSS classes stay hyphen-case (e.g., `admin-btn`, `station-header`); apparatus
  colors derive from type-to-class mapping (`Fire → red`, …, `Utility → black`).

## Data Model
- Stations persist as `[{ stationId, name, order }]`; the `order` field tracks
  drag-reordered cards and is regenerated on every move or delete.
- Apparatus records persist as `[{ apparatusNumber, id, apparatusType, reserve,
  notes, homeStationId, stationId }]`, where the number is the primary key,
  `homeStationId` drives ghosts, `stationId` can be blank for unassigned
  inventory, and `reserve` is a boolean flag controlling reserve status.

## Reserve Apparatus Behavior
- Reserve status is controlled by an explicit checkbox in all apparatus editors
  (edit modal, apparatus adder, admin list).
- Reserve apparatus display a diagonal stripe pattern overlay regardless of their
  ID value.
- When a reserve apparatus is moved to its home station (via drag-and-drop or
  dropdown selection), its ID is automatically cleared.
- Manual edits to the ID field are always preserved, even when the apparatus is
  at its home station.
- Reserve apparatus are automatically sorted to the bottom within each station,
  sorted alphabetically by apparatus number.

## Confirmation Dialogs
- Destructive actions require confirmation before proceeding:
  - Deleting a station (only allowed if no apparatus are assigned)
  - Deleting an apparatus
  - Importing data (replaces all existing data)

## Testing Guidelines
- No automated suite exists; cover Chromium-based and Firefox browsers manually.
- Confirm desktop drag/drop for apparatus reassignment and station reordering,
  refreshing to verify persistence.
- On touch devices, tap-to-move via the edit modal and confirm ghosts remain;
  reset state with `localStorage.clear()` when needed.
- Test reserve apparatus behavior:
  - Check/uncheck the Reserve checkbox in all three locations (edit modal,
    apparatus adder, admin list).
  - Verify stripe pattern overlay appears/disappears correctly.
  - Confirm ID is automatically cleared when reserve apparatus is moved to home
    station via drag-and-drop or dropdown.
  - Verify manual ID edits are preserved even when apparatus is at home station.
  - Confirm reserve apparatus sort to the bottom within each station.
- Test confirmation dialogs appear for station deletion, apparatus deletion, and
  data import operations.

## Feature Expectations
- Responsive grid tailored for large displays and touch layouts.
- Desktop drag/drop handles apparatus moves and station reordering; positions
  persist via `order`.
- Touch users tap an apparatus to open the edit modal; ghosts remain at home
  stations.
- Admin tabs manage dozens of records with type-aware colors, duplicate-number
  checks, and reserve status controls.
- Reserve apparatus are visually distinguished with a diagonal stripe pattern
  and automatically sorted to the bottom within each station.
- Confirmation dialogs prevent accidental data loss during delete and import
  operations.
- Data tab provides JSON export/import for backing up or restoring `stations`
  and `apparatus` records; imports include automatic data migration.
