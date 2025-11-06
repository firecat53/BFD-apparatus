# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Overview

Fire department apparatus tracking dashboard. Single-page application (SPA)
using vanilla JavaScript, PocketBase backend with SQLite database, and real-time
subscriptions for live updates across clients.

## Running the Application

```bash
pocketbase serve --publicDir .
```

- App: http://localhost:8090
- PocketBase Admin: http://localhost:8090/_/
- Production URL: https://bfd.firecat53.com (configured via PB_URL constant in app.js:2-6)

## Architecture

### File Structure

- `index.html` - Main HTML markup with modals (edit, admin, login, help)
- `styles.css` - CSS with light/dark theme support using CSS variables
- `app.js` - ~1800 lines of vanilla JavaScript application logic
- `service-worker.js` - Minimal PWA service worker (pass-through to network, no caching)
- `manifest.json` - PWA manifest for installability
- `pb_schema.json` - PocketBase schema with collections: users, apparatus, stations
- `pb_data/` - SQLite database directory (not in git)
- `pb_migrations/` - Database migration scripts

### Data Model

**Stations**: `{ stationId, name, order, _pbId }`
- `order` field controls display order (drag-drop updates this)
- PocketBase collections rules: read-only for all, authenticated write/update/delete

**Apparatus**: `{ apparatusNumber, id, apparatusType, reserve, oos, notes, homeStationId, stationId, _pbId }`
- `apparatusNumber` - unique identifier (e.g., "4527")
- `id` - in-service identifier (e.g., "E1", "AT102") - can be empty
- `apparatusType` - one of: Fire, Aid, Medic, AT, Staff, Utility
- `reserve` - boolean flag controlling reserve status and stripe pattern display
- `oos` - boolean for out-of-service status (displays strikethrough)
- `homeStationId` - station apparatus is assigned to
    - can be blank for unassigned
    - creates "ghost" when elsewhere
- `stationId` - current location
- `_pbId` - PocketBase record ID for API operations

### Key Features

**Reserve Apparatus Logic** (app.js:963-966, 1189-1199, 1510-1513):
- Controlled by explicit `reserve` checkbox (not inferred from ID)
- Displays diagonal stripe pattern overlay (`.reserve` class)
- When moved to home station via drag-drop or dropdown, ID automatically cleared
- Manual ID edits always preserved, even at home station
- Reserve apparatus auto-sort to bottom within each station

**Ghost System** (app.js:994, 1138-1157):
- Apparatus away from `homeStationId` leave a "ghost" button at home station
- Ghost buttons are non-interactive, styled with `.ghost` class

**Real-time Sync** (app.js:463-510):
- PocketBase real-time subscriptions on stations and apparatus collections
- Auto-resubscribe on page visibility change, focus, pageshow, and online events
- Handles network interruptions and page resume scenarios

**Drag-and-Drop** (desktop only, app.js:933-989):
- Disabled on touch devices (app.js:24-28 detects actual mobile/tablets)
- Station headers are draggable for reordering
- Apparatus boxes draggable between stations
- Touch users tap apparatus to open edit modal with dropdown for station selection

**Authentication** (app.js:109-202):
- PocketBase JWT auth with 2-year token duration (pb_schema.json:353)
- Login modal shown for unauthenticated users
- Admin features (add/edit/delete) require authentication
- Logout button in admin modal tab footers

**Theme Support** (app.js:68-96):
- Light/dark theme toggle in header
- CSS variables for theming (styles.css:1-56)
- Theme persisted to localStorage
- Dynamic theme-color meta tag update

### PocketBase API Integration

All database operations go through PocketBase REST API:
- `loadStationsFromPB()` / `saveStationToPB()` / `deleteStationFromPB()` (app.js:372-410)
- `loadApparatusFromPB()` / `saveApparatusToPB()` / `deleteApparatusFromPB()` (app.js:413-461)
- `apiRequest()` helper handles auth headers and error handling (app.js:347-369)
- Records use `_pbId` field to track PocketBase record IDs for updates/deletes

### Sorting

**Apparatus Sorting** (app.js:1272-1296):
- Primary: non-reserve first, reserve last
- Secondary: by apparatus type (Fire → Aid → Medic → AT → Staff → Utility)
- Tertiary: alphanumeric by apparatusNumber

**Station Sorting**:
- Display order: by `order` field (app.js:628)
- Admin selection lists: alphabetically by name (app.js:1266-1269)

### Modal Management

Four modals with body scroll locking (app.js:224-239):
- Edit Modal - quick apparatus edit from dashboard
- Admin Modal - tabbed interface (Apparatus, Stations, Data tabs)
- Login Modal - authentication
- Help Modal - user documentation

Escape key closes modals (app.js:303-333). Click backdrop to close.

### Touch Handling

Touch apparatus boxes (app.js:1034-1133):
- Distinguishes tap from scroll with thresholds (TOUCH_MOVE_THRESHOLD: 10px)
- Prevents edit modal on scroll gestures
- Single-finger tap opens edit modal

### Data Import/Export

Export (app.js:838-856):
- JSON format with `{ stations, apparatus, exportedAt }` structure
- Strips `_pbId` fields on export

Import (app.js:858-906):
- Confirmation dialog warns of data replacement
- Deletes all existing data before import
- Creates new PocketBase records (new `_pbId` values assigned)

## Common Tasks

When adding new apparatus types, update:
1. `APPARATUS_TYPES` array (app.js:10)
2. `TYPE_TO_CLASS` mapping (app.js:11-18)
3. PocketBase schema select values (pb_schema.json:823-830)

When modifying reserve behavior, check:
- Drag-drop handler (app.js:963-966)
- Edit modal dropdown handler (app.js:1189-1199)
- Admin edit form handler (app.js:1510-1513)
- Sorting logic (app.js:1275-1280)

## Testing

No automated test suite. Manual testing required:
- Test in Chromium-based and Firefox browsers
- Verify desktop drag-drop (apparatus moves, station reordering)
- Verify touch tap-to-edit on mobile/tablet
- Test reserve apparatus: checkbox in 3 locations (edit modal, apparatus adder,
  admin list), stripe pattern, auto-ID-clear, sorting
- Test confirmation dialogs (station delete, apparatus delete, data import)
- Test real-time updates with multiple browser windows
- Test offline/online transitions

## Code Style

- 2-space indentation
- camelCase for JavaScript identifiers
- hyphen-case for CSS classes (e.g., `admin-btn`, `station-header`)
- Lines kept near 100 chars
- Prefer `const` over `let`
- No automated linting/formatting tools configured
