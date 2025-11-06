# Fire Department Apparatus Dashboard

A web application for tracking which fire trucks are at which stations. View the
dashboard on any device to see the current location and status of all apparatus.
Changes made by anyone appear instantly on all screens.

## What It Does

- **See where apparatus are**: View all stations and their current apparatus on one screen
- **Know when things change**: Updates appear instantly on all devices when apparatus move
- **Works on any device**: Use on computers, tablets, or phones
- **Easy to update**: Drag-and-drop on computers, or tap and select on phones
- **Color coded**: Each apparatus type has its own color for quick identification
- **See what's available**: Reserve units show a striped pattern, out-of-service units are crossed out
- **Track home stations**: See when apparatus are away from their normal location
- **Light or dark display**: Choose the theme that works best for your environment
- **Save your data**: Export and import your station and apparatus information

## How to Use It

### Viewing the Dashboard

Anyone can view the dashboard without logging in. You'll see:
- All fire stations displayed as cards
- Each station shows which apparatus are currently there
- Apparatus display their ID and number (example: "E1 4527")
- Color coding shows the apparatus type:
  - Red = Fire engines
  - Green = Aid units
  - Blue = Medics
  - Yellow = AT units
  - Purple = Staff vehicles
  - Black = Utility vehicles
- Striped pattern = Reserve apparatus
- Crossed out = Out of service (OOS)
- Faded appearance = Apparatus that belongs to this station but is currently elsewhere

### Moving Apparatus (Login Required)

**On a computer**:
1. Click and hold on an apparatus
2. Drag it to a different station
3. Release to drop it there
4. The change saves automatically

**On a phone or tablet**:
1. Tap an apparatus
2. In the menu that opens, select the new station from "Current Station"
3. Tap "Save"

### Editing Apparatus Details (Login Required)

**On a computer**: Click an apparatus to open the editor

**On a phone or tablet**: Tap an apparatus to open the editor

In the editor you can change:
- **ID**: The unit identifier (E1, M3, AT102, etc.)
- **Type**: What kind of apparatus it is
- **Reserve**: Check this box for reserve units (adds striped pattern)
- **OOS**: Check this box for out-of-service units (adds strikethrough)
- **Home Station**: Where this apparatus normally belongs
- **Current Station**: Where it is right now
- **Notes**: Any additional information

### Managing Stations and Apparatus (Login Required)

Click the "Admin" button in the top-right corner to:

**Add or edit stations**:
1. Click the "Stations" tab
2. Click "Add Station" to create a new one, or click an existing station to edit it
3. You can rename stations or delete ones you don't need

**Add or edit apparatus**:
1. Click the "Apparatus" tab
2. Click "Add Apparatus" to add a new one, or click an existing apparatus to edit it
3. Fill in the details and click "Save"

**Backup your data**:
1. Click the "Data" tab
2. Click "Export JSON" to download a backup file
3. Save the file somewhere safe

**Restore from backup**:
1. Click the "Data" tab
2. Click "Import JSON" and select your backup file
3. Confirm that you want to replace the current data

## Installation

### Prerequisites
- [PocketBase](https://pocketbase.io/docs/) binary (download from official site)

### Installation

1. **Download PocketBase** for your platform from https://pocketbase.io/docs/

2. **Clone or download this repository**:
   ```bash
   git clone https://github.com/firecat53/bfd-apparatus
   cd BFD-apparatus/
   ```

3. **Start the server**:
   ```bash
   ./pocketbase serve --publicDir .
   ```

4. **Access the application**:
   - Dashboard: http://localhost:8090
   - PocketBase Admin: http://localhost:8090/_/

1. **Initial Setup**:
   - First time: Create an admin account via PocketBase admin panel
   - Import the database schema:
     - In the admin panel, go to Settings → Import collections
     - Upload the `pb_schema.json` file
     - Click "Review" and then "Confirm"
   - Create user accounts for dashboard access:
     - Go to Collections → users
     - Click "New record" to add users who can log in to the dashboard

---

## For Developers

The sections below are for developers and system administrators who want to
modify the code or deploy the application.

### Development

#### Tech Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: [PocketBase](https://pocketbase.io/) (Go-based backend with SQLite)
- **Database**: SQLite (via PocketBase)
- **Real-time**: PocketBase WebSocket subscriptions
- **PWA**: Service Worker with minimal pass-through strategy

#### Project Structure
```
dashboard/
├── index.html           # Main HTML with modal markup
├── app.js              # ~1800 lines of application logic
├── styles.css          # Theming and responsive styles
├── service-worker.js   # Minimal PWA service worker
├── manifest.json       # PWA manifest
├── pb_schema.json      # PocketBase database schema
├── pb_data/            # SQLite database (gitignored)
├── pb_migrations/      # Database migration scripts
├── icons/              # App icons and favicons
├── CLAUDE.md           # AI assistant development guide
└── README.md           # This file
```

#### Data Model

**Stations**:
```javascript
{
  stationId: "s12345",    // Internal ID
  name: "Station 1",      // Display name
  order: 0                // Display order (for drag-drop)
}
```

**Apparatus**:
```javascript
{
  apparatusNumber: "4527",      // Unique identifier (required)
  apparatusId: "E1",            // In-service ID (optional)
  apparatusType: "Fire",        // Fire|Aid|Medic|AT|Staff|Utility
  reserve: false,               // Reserve status flag
  oos: false,                   // Out-of-service status
  notes: "Ready reserve",       // Optional notes
  homeStationId: "s12345",      // Home station (optional)
  stationId: "s12345"           // Current location (optional)
}
```

#### Local Development

1. **Run the development server**:
   ```bash
   pocketbase serve --publicDir .
   ```

2. **Access endpoints**:
   - App: http://localhost:8090
   - Admin UI: http://localhost:8090/_/
   - API: http://localhost:8090/api/

3. **Make changes**: Edit HTML/CSS/JS files and refresh the browser

4. **Database changes**:
   - Modify schema via Admin UI or `pb_schema.json`
   - Migrations are auto-generated in `pb_migrations/`

#### Code Style
- 2-space indentation
- camelCase for JavaScript identifiers
- hyphen-case for CSS classes
- Prefer `const` over `let`
- Keep lines near 100 characters
- No automated linting/formatting (manual consistency)

#### Testing
- No automated test suite currently
- Manual testing required for:
  - Desktop drag-and-drop functionality
  - Touch interactions on mobile/tablet
  - Reserve apparatus behavior (checkbox, stripe pattern, ID clearing, sorting)
  - Real-time updates across multiple browser windows
  - Confirmation dialogs (delete, import)
  - Theme switching
  - Login/logout flows
- Test in both Chromium-based browsers (Chrome, Edge) and Firefox

### Deployment

#### Production Deployment

1. **Install PocketBase on your server**

2. **Copy application files** to server:
   ```bash
   scp -r ./* user@server:/path/to/app_code/
   ```

3. **Setup separate data directory**
   ```bash
   mkdir /var/lib/dashboard
   chown -R www-data /var/lib/dashboard 
   ```

4. **Configure production URL**:
   - Edit `app.js` line 6 to set your production domain

5. **Run PocketBase as a service**:
   ```ini
   # Example systemd service
   [Unit]
   Description=PocketBase Dashboard
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/path/to/dashboard
   ExecStart=/path/to/pocketbase serve --publicDir /path/to/app_code --dir /path/to/data_directory 
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

6. **Setup reverse proxy with Let's Encrypt** (out of scope for this README)

#### Environment Configuration

The app uses different backend URLs based on the environment:
- **Development**: `http://127.0.0.1:8090` (localhost detection)
- **Production**: Set in `app.js` line 6

To modify the production URL, edit `PB_URL` constant in `app.js`:
```javascript
const PB_URL = 'https://your-domain.com';
```

#### Initial Data Setup

After deployment:
1. Access the PocketBase admin panel
2. Import the database schema (Settings → Import collections → upload `pb_schema.json`)
3. Create user accounts for dashboard access (Collections → users → New record)
4. Use the dashboard Admin panel to add stations and apparatus
5. Or import existing data using the Data tab (JSON import)

### Contributing

#### Development Guidelines

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation and development guidelines.

**Key Implementation Notes**:
- Reserve apparatus logic is complex: ID auto-clearing, sorting, visual indicators
- Touch handling distinguishes taps from scrolls with movement thresholds
- Real-time subscriptions must handle reconnection on visibility/network changes
- Drag-and-drop disabled on actual mobile devices (not just touch-capable desktops)

**When adding features**:
1. Test in both desktop and mobile layouts
2. Consider authentication requirements
3. Update help modal and README if user-facing
4. Test real-time sync with multiple browser windows/versions
5. Verify data persistence and migration

#### Bug Reports

When reporting bugs, please include:
- Browser and version
- Device type (desktop/mobile/tablet)
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)

## License

MIT

## Contact

https://github.com/firecat53/BFD-apparatus/issues
