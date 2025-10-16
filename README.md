# Repository Guidelines

This dashboard is a single page application for managing fire department
apparatus. Use this guide to keep contributions consistent.

## Feature Expectations
- Responsive grid tailored for large displays and touch/mobile layouts.
- Desktop drag/drop handles apparatus moves and station reordering; positions
  persist via `order`.
- Touch users tap an apparatus to open the edit modal to move or edit apparatus.
- Admin tabs manage records with type-aware colors, duplicate-number checks, and
  reserve status controls.
- Reserve apparatus:
    * Controlled by an explicit checkbox in all apparatus editors (edit modal,
      apparatus adder, admin list).
    * Reserve apparatus display a diagonal stripe pattern overlay regardless of
      their ID value.
    * When a reserve apparatus is moved to its home station (via drag-and-drop
      or dropdown selection), its ID is automatically cleared.
    * Manual edits to the ID field are always preserved, even when the apparatus
      is at its home station.
    * Reserve apparatus are automatically sorted to the bottom within each
      station, sorted alphabetically by apparatus number.
- Confirmation dialogs prevent accidental data loss during delete and import
  operations.
- Data tab provides JSON export/import for backing up or restoring `stations`
  and `apparatus` records; imports include automatic data migration.

## Project Structure & Module Organization
- `index.html` contains the markup, `styles.css` for CSS rules, and `app.js` for
  the bulk of the Javascript logic.
- [PocketBase](https://pocketbase.io/) is used for an sqlite backend and server.

## Data Model
- Stations persist as `[{ stationId, name, order }]`; the `order` field tracks
  drag-reordered cards and is regenerated on every move or delete.
- Apparatus records persist as `[{ apparatusNumber, apparatusId, apparatusType,
  reserve, notes, homeStationId, stationId }]`, where `apparatusNumber` is a
  unique value, `homeStationId` drives ghosts, `stationId` can be blank for
  unassigned inventory, and `reserve` is a boolean flag controlling reserve
  status.

## Build, Test, and Development Commands
* `pocketbase serve --publicDir . --dir db/`
* Access app at `http://localhost:8090` and PocketBase admin page at
  `http://localhost:8090/_/`

## Coding Style & Naming Conventions
- Use 2-space indentation, camelCase identifiers, and keep lines near 100 chars.
- Default to `const` for stable bindings; reserve `let` for reassignment.
- CSS classes stay hyphen-case (e.g., `admin-btn`, `station-header`); apparatus
  colors derive from type-to-class mapping (`Fire → red`, …, `Utility → black`).

## Testing Guidelines
- No automated suite exists; cover Chromium-based and Firefox browsers manually.
- Confirm desktop drag/drop for apparatus reassignment and station reordering,
  refreshing to verify persistence.
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
