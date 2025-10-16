// PocketBase Configuration
const PB_URL = (window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.protocol === 'file:')
  ? 'http://127.0.0.1:8090'
  : 'http://192.168.200.104:8090'; // TODO Update for production (domain name)

const STATION_KEY = "stations";
const APPARATUS_KEY = "apparatus";
const TYPE_TO_CLASS = {
  Fire: "red",
  Aid: "green",
  Medic: "blue",
  AT: "yellow",
  Staff: "purple",
  Utility: "black"
};
const APPARATUS_TYPES = Object.keys(TYPE_TO_CLASS);
const DEFAULT_TYPE = "Utility";

let editingNumber = null;
let draggingApparatus = null;
let draggingStation = null;
const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
const adminModalEl = document.getElementById("adminModal");
const editModalEl = document.getElementById("editModal");
const editModalTitle = document.getElementById("editModalTitle");
const editIdInput = document.getElementById("editId");
const editTypeSelect = document.getElementById("editType");
const editReserveCheckbox = document.getElementById("editReserve");
const editHomeSelect = document.getElementById("editHomeStation");
const editStationSelect = document.getElementById("editStation");
const editNotesInput = document.getElementById("editNotes");
const stationListEl = document.getElementById("stationList");
const apparatusListEl = document.getElementById("apparatusList");
const stationAdderRow = document.getElementById("stationAdder");
const stationAdderNameInput = document.getElementById("stationAdderName");
const stationAdderConfirmBtn = document.getElementById("stationAdderConfirm");
const stationAdderCancelBtn = document.getElementById("stationAdderCancel");
const stationShowAdderBtn = document.getElementById("stationShowAdder");
const apparatusAdderRow = document.getElementById("apparatusAdder");
const apparatusAdderNumberInput = document.getElementById("apparatusAdderNumber");
const apparatusAdderIdInput = document.getElementById("apparatusAdderId");
const apparatusAdderTypeSelect = document.getElementById("apparatusAdderType");
const apparatusAdderReserveCheckbox = document.getElementById("apparatusAdderReserve");
const apparatusAdderNotesInput = document.getElementById("apparatusAdderNotes");
const apparatusAdderHomeSelect = document.getElementById("apparatusAdderHome");
const apparatusAdderStationSelect = document.getElementById("apparatusAdderStation");
const apparatusAdderConfirmBtn = document.getElementById("apparatusAdderConfirm");
const apparatusAdderCancelBtn = document.getElementById("apparatusAdderCancel");
const apparatusShowAdderBtn = document.getElementById("apparatusShowAdder");
const backupButton = document.getElementById("backupButton");
const importInput = document.getElementById("importInput");

let bodyScrollLockCount = 0;
let previousBodyOverflow = "";
const DEFAULT_ADMIN_TAB = "apparatus";
// Initialize PocketBase
const pb = new PocketBase(PB_URL);
let isAuthenticated = false;

let lastAddedStationId = null;
let lastAddedApparatusNumber = null;
let selectedStationForEdit = null;
let selectedApparatusForEdit = null;
let stationFormDirty = false;
let apparatusFormDirty = false;

// ========== Authentication Functions ==========

function checkAuth() {
  isAuthenticated = pb.authStore.isValid;
  updateUIForAuthState();
  return isAuthenticated;
}

function showLoginModal() {
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    loginModal.style.display = 'block';
    lockBodyScroll();
    const usernameInput = document.getElementById('loginUsername');
    if (usernameInput) usernameInput.focus();
  }
}

function hideLoginModal() {
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    loginModal.style.display = 'none';
    unlockBodyScroll();
  }
  clearLoginError();
}

function showLoginError(message) {
  const errorEl = document.getElementById('loginError');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }
}

function clearLoginError() {
  const errorEl = document.getElementById('loginError');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
  }
}

async function handleLogin() {
  const username = document.getElementById('loginUsername')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;

  if (!username || !password) {
    showLoginError('Please enter both username and password');
    return;
  }

  try {
    clearLoginError();
    await pb.collection('users').authWithPassword(username, password);
    isAuthenticated = true;
    hideLoginModal();
    updateUIForAuthState();
    await renderDashboard();
  } catch (error) {
    console.error('Login error:', error);
    showLoginError('Invalid username or password');
  }
}

async function handleLogout() {
  pb.authStore.clear();
  isAuthenticated = false;
  closeAdminModal();
  updateUIForAuthState();
  await renderDashboard();
}

function updateUIForAuthState() {
  const adminBtn = document.querySelector('.admin-btn');
  if (adminBtn) {
    adminBtn.style.display = isAuthenticated ? 'block' : 'none';
  }

  // Show/hide login button
  let loginBtn = document.querySelector('.login-btn');
  if (!isAuthenticated && !loginBtn) {
    loginBtn = document.createElement('button');
    loginBtn.className = 'login-btn';
    loginBtn.textContent = 'Login';
    loginBtn.onclick = showLoginModal;
    document.body.appendChild(loginBtn);
  } else if (isAuthenticated && loginBtn) {
    loginBtn.remove();
  }
}

// ========== End Authentication Functions ==========

function lockBodyScroll() {
  if (bodyScrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow || "";
    document.body.style.overflow = "hidden";
  }
  bodyScrollLockCount += 1;
}

function unlockBodyScroll() {
  if (bodyScrollLockCount > 0) {
    bodyScrollLockCount -= 1;
    if (bodyScrollLockCount === 0) {
      document.body.style.overflow = previousBodyOverflow;
    }
  }
}

if (stationShowAdderBtn) {
  stationShowAdderBtn.addEventListener("click", showStationAdder);
}
if (stationAdderCancelBtn) {
  stationAdderCancelBtn.addEventListener("click", hideStationAdder);
}
if (stationAdderConfirmBtn) {
  stationAdderConfirmBtn.addEventListener("click", confirmAddStation);
}
if (stationAdderNameInput) {
  stationAdderNameInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmAddStation();
    }
  });
}
if (apparatusShowAdderBtn) {
  apparatusShowAdderBtn.addEventListener("click", showApparatusAdder);
}
if (apparatusAdderCancelBtn) {
  apparatusAdderCancelBtn.addEventListener("click", hideApparatusAdder);
}
if (apparatusAdderConfirmBtn) {
  apparatusAdderConfirmBtn.addEventListener("click", confirmAddApparatus);
}
[apparatusAdderNumberInput, apparatusAdderIdInput, apparatusAdderNotesInput].forEach(input => {
  if (input) {
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmAddApparatus();
      }
    });
  }
});

if (backupButton) {
  backupButton.addEventListener("click", exportDataBackup);
}

if (importInput) {
  importInput.addEventListener("change", handleDataImport);
}

[adminModalEl, editModalEl].forEach(modal => {
  if (!modal) return;
  modal.addEventListener("click", event => {
    if (event.target === modal) {
      if (modal === adminModalEl) {
        closeAdminModal();
      } else if (modal === editModalEl) {
        closeEditModal();
      }
    }
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (editModalEl && editModalEl.style.display === "block") {
      closeEditModal();
    } else if (adminModalEl && adminModalEl.style.display === "block") {
      closeAdminModal();
    }
  }
});

function switchTab(tabId) {
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
  const tabButton = document.querySelector(`.tab[onclick*="${tabId}"]`);
  const targetContent = document.getElementById(tabId);
  if (tabButton) tabButton.classList.add("active");
  if (targetContent) targetContent.classList.add("active");
}

// ========== PocketBase API Functions ==========

async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add authorization header if authenticated
  if (pb.authStore.token) {
    headers['Authorization'] = `Bearer ${pb.authStore.token}`;
  }

  const response = await fetch(`${PB_URL}/api/collections/${endpoint}`, {
    ...options,
    headers
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }
  // DELETE requests often return no content
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Station API
async function loadStationsFromPB() {
  const result = await apiRequest('stations/records?sort=+order&perPage=500');
  return result.items.map(item => ({
    stationId: item.stationId,
    name: item.name,
    order: item.order,
    _pbId: item.id // Store PB record ID for updates
  }));
}

async function saveStationToPB(station) {
  const payload = {
    stationId: station.stationId,
    name: station.name,
    order: station.order
  };

  if (station._pbId) {
    // Update existing record
    const result = await apiRequest(`stations/records/${station._pbId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return { ...station, _pbId: result.id };
  } else {
    // Create new record
    const result = await apiRequest('stations/records', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return { ...station, _pbId: result.id };
  }
}

async function deleteStationFromPB(station) {
  if (station._pbId) {
    await apiRequest(`stations/records/${station._pbId}`, { method: 'DELETE' });
  }
}

// Apparatus API
async function loadApparatusFromPB() {
  const result = await apiRequest('apparatus/records?perPage=500');
  return result.items.map(item => ({
    apparatusNumber: item.apparatusNumber,
    id: item.apparatusId || "",
    apparatusType: item.apparatusType,
    reserve: item.reserve || false,
    notes: item.notes || "",
    homeStationId: item.homeStationId || "",
    stationId: item.stationId || "",
    _pbId: item.id // Store PB record ID for updates
  }));
}

async function saveApparatusToPB(apparatus) {
  const payload = {
    apparatusNumber: apparatus.apparatusNumber,
    apparatusId: apparatus.id || "",
    apparatusType: apparatus.apparatusType,
    reserve: apparatus.reserve || false,
    notes: apparatus.notes || "",
    homeStationId: apparatus.homeStationId || "",
    stationId: apparatus.stationId || ""
  };

  if (apparatus._pbId) {
    // Update existing record
    const result = await apiRequest(`apparatus/records/${apparatus._pbId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return { ...apparatus, _pbId: result.id };
  } else {
    // Create new record
    const result = await apiRequest('apparatus/records', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return { ...apparatus, _pbId: result.id };
  }
}

async function deleteApparatusFromPB(apparatus) {
  if (apparatus._pbId) {
    await apiRequest(`apparatus/records/${apparatus._pbId}`, { method: 'DELETE' });
  }
}

// ========== End PocketBase API Functions ==========

function migrateStations(stations) {
  let dirty = false;
  const migrated = stations.map((station, index) => {
    const next = { ...station };
    if (!next.stationId && next.id) {
      next.stationId = next.id;
      delete next.id;
      dirty = true;
    }
    if (typeof next.order !== "number") {
      next.order = index;
      dirty = true;
    }
    return next;
  });
  return { stations: migrated, dirty };
}

function migrateApparatus(apparatus) {
  let dirty = false;
  const colorToType = {
    red: "Fire",
    green: "Aid",
    blue: "Medic",
    yellow: "AT",
    purple: "Staff",
    black: "Utility"
  };

  const migrated = apparatus.map(app => {
    const next = { ...app };
    if (!next.apparatusNumber && next.number) {
      next.apparatusNumber = next.number;
      delete next.number;
      dirty = true;
    }
    if (!next.stationId && next.currentStation) {
      next.stationId = next.currentStation;
      delete next.currentStation;
      dirty = true;
    }
    if (!next.homeStationId && next.homeStation) {
      next.homeStationId = next.homeStation;
      delete next.homeStation;
      dirty = true;
    }
    if (!next.apparatusType) {
      if (next.color && colorToType[next.color]) {
        next.apparatusType = colorToType[next.color];
      } else {
        next.apparatusType = DEFAULT_TYPE;
      }
      dirty = true;
    }
    if (!APPARATUS_TYPES.includes(next.apparatusType)) {
      next.apparatusType = DEFAULT_TYPE;
      dirty = true;
    }
    if (next.color) {
      delete next.color;
      dirty = true;
    }
    // Migrate old reserve logic: if no ID, set reserve to true
    if (typeof next.reserve !== "boolean") {
      next.reserve = !next.id;
      dirty = true;
    }
    return next;
  });
  return { apparatus: migrated, dirty };
}

async function loadData() {
  try {
    const [stations, apparatus] = await Promise.all([
      loadStationsFromPB(),
      loadApparatusFromPB()
    ]);

    // Sort stations by order
    stations.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return { stations, apparatus };
  } catch (error) {
    console.error('Failed to load data from PocketBase:', error);
    alert('Failed to load data from server. Please check your connection and refresh the page.');
    return { stations: [], apparatus: [] };
  }
}

async function saveStations(stations) {
  try {
    await Promise.all(stations.map(station => saveStationToPB(station)));
  } catch (error) {
    console.error('Failed to save stations:', error);
    alert('Failed to save stations. Please check your connection and try again.');
    throw error;
  }
}

async function saveApparatus(apparatus) {
  try {
    await Promise.all(apparatus.map(app => saveApparatusToPB(app)));
  } catch (error) {
    console.error('Failed to save apparatus:', error);
    alert('Failed to save apparatus. Please check your connection and try again.');
    throw error;
  }
}

function getColorClass(apparatusType) {
  return TYPE_TO_CLASS[apparatusType] || TYPE_TO_CLASS[DEFAULT_TYPE];
}

function populateTypeSelect(selectOrId, selectedType = DEFAULT_TYPE) {
  const select = typeof selectOrId === "string" ? document.getElementById(selectOrId) : selectOrId;
  if (!select) return;
  select.innerHTML = "";
  APPARATUS_TYPES.forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    select.appendChild(option);
  });
  select.value = selectedType;
}

function populateStationSelect(selectOrId, stations, selectedStation, placeholderLabel = "Unassigned", optionPrefix = "") {
  const select = typeof selectOrId === "string" ? document.getElementById(selectOrId) : selectOrId;
  if (!select) return;
  select.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = placeholderLabel;
  select.appendChild(placeholder);

  stations.forEach(station => {
    const option = document.createElement("option");
    option.value = station.stationId;
    option.textContent = optionPrefix ? `${optionPrefix} ${station.name}` : station.name;
    if (station.stationId === selectedStation) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function buildField(labelText, element) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  const label = document.createElement("span");
  label.className = "field-label";
  label.textContent = labelText;
  wrapper.appendChild(label);
  wrapper.appendChild(element);
  return wrapper;
}

async function showStationAdder() {
  if (!stationAdderRow || !stationShowAdderBtn) return;
  const { stations } = await loadData();
  stationAdderRow.classList.remove("hidden");
  stationShowAdderBtn.disabled = true;
  if (stationAdderNameInput) {
    stationAdderNameInput.value = `Station ${stations.length + 1}`;
    stationAdderNameInput.focus();
    stationAdderNameInput.select();
  }
}

function hideStationAdder() {
  if (stationAdderRow) {
    stationAdderRow.classList.add("hidden");
  }
  if (stationAdderNameInput) {
    stationAdderNameInput.value = "";
  }
  if (stationShowAdderBtn) {
    stationShowAdderBtn.disabled = false;
  }
  clearStationSelection();
}

async function confirmAddStation() {
  const name = stationAdderNameInput ? stationAdderNameInput.value.trim() : "";
  if (!name) {
    alert("Please provide a station name.");
    if (stationAdderNameInput) {
      stationAdderNameInput.focus();
    }
    return;
  }

  const { stations } = await loadData();
  const id = "s" + Math.floor(Math.random() * 100000);
  const order = stations.length;
  const updated = [...stations, { stationId: id, name, order }];
  await saveStations(updated);
  lastAddedStationId = id;
  hideStationAdder();
  await openAdminModal();
  await renderDashboard();
}

async function showApparatusAdder() {
  if (!apparatusAdderRow || !apparatusShowAdderBtn) return;
  const { stations } = await loadData();
  apparatusAdderRow.classList.remove("hidden");
  apparatusShowAdderBtn.disabled = true;
  populateTypeSelect(apparatusAdderTypeSelect, DEFAULT_TYPE);
  populateStationSelect(apparatusAdderHomeSelect, stations, stations[0]?.stationId || "", "Home: Unassigned", "Home:");
  populateStationSelect(
    apparatusAdderStationSelect,
    stations,
    stations[0]?.stationId || "",
    "Current: Unassigned",
    "At:"
  );
  if (apparatusAdderNumberInput) {
    apparatusAdderNumberInput.value = "";
    apparatusAdderNumberInput.focus();
  }
  if (apparatusAdderIdInput) apparatusAdderIdInput.value = "";
  if (apparatusAdderNotesInput) apparatusAdderNotesInput.value = "";
}

function hideApparatusAdder() {
  if (apparatusAdderRow) {
    apparatusAdderRow.classList.add("hidden");
  }
  if (apparatusShowAdderBtn) {
    apparatusShowAdderBtn.disabled = false;
  }
  if (apparatusAdderNumberInput) apparatusAdderNumberInput.value = "";
  if (apparatusAdderIdInput) apparatusAdderIdInput.value = "";
  if (apparatusAdderReserveCheckbox) apparatusAdderReserveCheckbox.checked = false;
  if (apparatusAdderNotesInput) apparatusAdderNotesInput.value = "";
  clearApparatusSelection();
}

async function confirmAddApparatus() {
  const number = apparatusAdderNumberInput ? apparatusAdderNumberInput.value.trim() : "";
  if (!number) {
    alert("Apparatus number is required.");
    if (apparatusAdderNumberInput) {
      apparatusAdderNumberInput.focus();
    }
    return;
  }

  const idValue = apparatusAdderIdInput ? apparatusAdderIdInput.value.trim() : "";
  const typeValue = apparatusAdderTypeSelect ? apparatusAdderTypeSelect.value : DEFAULT_TYPE;
  const reserveValue = apparatusAdderReserveCheckbox ? apparatusAdderReserveCheckbox.checked : false;
  const notesValue = apparatusAdderNotesInput ? apparatusAdderNotesInput.value.trim() : "";
  const homeStationValue = apparatusAdderHomeSelect ? apparatusAdderHomeSelect.value : "";
  const stationValue = apparatusAdderStationSelect
    ? apparatusAdderStationSelect.value || homeStationValue
    : homeStationValue;

  const { apparatus } = await loadData();
  if (apparatus.some(a => a.apparatusNumber === number)) {
    alert("Apparatus number must be unique.");
    if (apparatusAdderNumberInput) {
      apparatusAdderNumberInput.focus();
    }
    return;
  }

  const updated = [
    ...apparatus,
    {
      apparatusNumber: number,
      id: idValue,
      apparatusType: typeValue || DEFAULT_TYPE,
      reserve: reserveValue,
      notes: notesValue,
      homeStationId: homeStationValue,
      stationId: stationValue
    }
  ];
  await saveApparatus(updated);
  lastAddedApparatusNumber = number;
  hideApparatusAdder();
  await openAdminModal();
  await renderDashboard();
}

async function exportDataBackup() {
  const data = await loadData();
  const payload = {
    stations: data.stations,
    apparatus: data.apparatus,
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const link = document.createElement("a");
  link.href = url;
  link.download = `apparatus-backup-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function handleDataImport(event) {
  const input = event.target;
  const file = input.files && input.files[0];
  if (!file) return;

  if (!confirm("Importing will replace all existing stations and apparatus data. This cannot be undone. Continue?")) {
    input.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const text = e.target?.result;
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.stations) || !Array.isArray(parsed.apparatus)) {
        alert("Invalid backup file. Expected stations and apparatus arrays.");
        return;
      }

      // Delete all existing data first
      const currentData = await loadData();
      await Promise.all(currentData.apparatus.map(app => deleteApparatusFromPB(app)));
      await Promise.all(currentData.stations.map(station => deleteStationFromPB(station)));

      // Import to PocketBase - strip _pbId to create new records
      const stationsToImport = parsed.stations.map(({ _pbId, ...station }) => station);
      const apparatusToImport = parsed.apparatus.map(({ _pbId, ...app }) => app);

      await saveStations(stationsToImport);
      await saveApparatus(apparatusToImport);

      lastAddedStationId = null;
      lastAddedApparatusNumber = null;
      await openAdminModal();
      await renderDashboard();
      alert("Import complete. Data has been replaced with the backup file.");
    } catch (err) {
      console.error(err);
      alert("Unable to import backup. Please verify the JSON file and try again.");
    } finally {
      input.value = "";
    }
  };
  reader.onerror = () => {
    alert("Failed to read file. Please try again.");
    input.value = "";
  };
  reader.readAsText(file);
}

function closeAdminModal() {
  hideStationAdder();
  hideApparatusAdder();
  clearStationSelection();
  clearApparatusSelection();
  if (adminModalEl && adminModalEl.style.display === "block") {
    adminModalEl.style.display = "none";
    unlockBodyScroll();
  }
}

async function renderDashboard() {
  const { stations, apparatus } = await loadData();
  const grid = document.getElementById("stationGrid");
  grid.innerHTML = "";

  stations.forEach(station => {
    const card = document.createElement("div");
    card.className = "station";
    card.dataset.stationId = station.stationId;

    const header = document.createElement("div");
    header.className = "station-header";
    header.textContent = station.name;
    if (!isTouchDevice && isAuthenticated) {
      header.setAttribute("draggable", "true");
      header.addEventListener("dragstart", e => {
        draggingStation = station.stationId;
        e.dataTransfer.effectAllowed = "move";
      });
      header.addEventListener("dragend", () => {
        draggingStation = null;
      });
    } else {
      header.removeAttribute("draggable");
    }

    const body = document.createElement("div");
    body.className = "station-body";

    if (!isTouchDevice && isAuthenticated) {
      card.addEventListener("dragover", e => {
        if (draggingApparatus || draggingStation) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }
      });

      card.addEventListener("drop", async (e) => {
        e.preventDefault();
        if (draggingApparatus) {
          const updated = apparatus.map(app => {
            if (app.apparatusNumber === draggingApparatus) {
              const updatedApp = { ...app, stationId: station.stationId };
              // If reserve apparatus is moved to home station, clear the ID
              if (updatedApp.reserve && updatedApp.homeStationId === station.stationId) {
                updatedApp.id = "";
              }
              return updatedApp;
            }
            return app;
          });
          draggingApparatus = null;
          await saveApparatus(updated);
          await renderDashboard();
        } else if (draggingStation && draggingStation !== station.stationId) {
          const reordered = [...stations];
          const fromIndex = reordered.findIndex(s => s.stationId === draggingStation);
          if (fromIndex > -1) {
            const [moved] = reordered.splice(fromIndex, 1);
            const targetIndex = reordered.findIndex(s => s.stationId === station.stationId);
            if (targetIndex > -1) {
              reordered.splice(targetIndex, 0, moved);
              const tagged = reordered.map((s, index) => ({ ...s, order: index }));
              await saveStations(tagged);
              await renderDashboard();
            }
          }
          draggingStation = null;
        }
      });
    }

    const stationApparatus = apparatus.filter(app => app.stationId === station.stationId);
    const stationApparatusIndexed = stationApparatus.map((app, index) => ({ app, index }));
    const sortedStationApparatus = stationApparatusIndexed
      .slice()
      .sort((a, b) => {
        const aReserve = a.app.reserve;
        const bReserve = b.app.reserve;
        if (aReserve && !bReserve) return 1;
        if (!aReserve && bReserve) return -1;
        if (aReserve && bReserve) {
          return a.app.apparatusNumber.localeCompare(b.app.apparatusNumber, undefined, { numeric: true, sensitivity: "base" });
        }
        return a.index - b.index;
      })
      .map(entry => entry.app);
    const homeGhosts = apparatus.filter(app => app.homeStationId === station.stationId && app.stationId !== station.stationId);

    sortedStationApparatus.forEach(app => {
      const box = document.createElement("div");
      const colorClass = getColorClass(app.apparatusType);
      box.className = `apparatus ${colorClass}`;
      box.textContent = app.id ? `${app.id} ${app.apparatusNumber}` : app.apparatusNumber;

      if (!isTouchDevice && isAuthenticated) {
        box.setAttribute("draggable", "true");
        box.addEventListener("dragstart", e => {
          draggingApparatus = app.apparatusNumber;
          e.dataTransfer.effectAllowed = "move";
        });
        box.addEventListener("dragend", () => {
          draggingApparatus = null;
        });
      } else {
        box.removeAttribute("draggable");
      }

      if (app.reserve) {
        box.classList.add("reserve");
      }

      box.addEventListener("click", e => {
        if (draggingApparatus || !isAuthenticated) return;
        openEditModal(app);
      });

      if (isTouchDevice) {
        box.addEventListener(
          "touchend",
          e => {
            if (draggingApparatus || !isAuthenticated) return;
            e.preventDefault();
            openEditModal(app);
          },
          { passive: false }
        );
      }

      body.appendChild(box);
    });

    homeGhosts.forEach(app => {
      const ghost = document.createElement("div");
      const colorClass = getColorClass(app.apparatusType);
      ghost.className = `apparatus ghost ${colorClass}`;
      ghost.textContent = app.id ? `${app.id} ${app.apparatusNumber}` : app.apparatusNumber;
      if (app.reserve) {
        ghost.classList.add("reserve");
      }
      body.appendChild(ghost);
    });

    card.appendChild(header);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

async function openEditModal(app) {
  if (!isAuthenticated) return;
  const { stations } = await loadData();
  editingNumber = app.apparatusNumber;
  if (editModalTitle) {
    editModalTitle.textContent = app.apparatusNumber ? `Edit ${app.apparatusNumber}` : "Edit Apparatus";
  }
  if (editIdInput) {
    editIdInput.value = app.id || "";
  }
  if (editReserveCheckbox) {
    editReserveCheckbox.checked = app.reserve || false;
  }
  if (editNotesInput) {
    editNotesInput.value = app.notes || "";
  }
  populateTypeSelect(editTypeSelect, app.apparatusType);
  populateStationSelect(editHomeSelect, stations, app.homeStationId || "", "Unassigned");
  populateStationSelect(editStationSelect, stations, app.stationId || "", "Unassigned");

  // Add change handler to Current Station dropdown to clear ID when reserve apparatus returns home
  if (editStationSelect) {
    editStationSelect.onchange = () => {
      // If reserve apparatus is moved to home station, clear the ID
      if (editReserveCheckbox && editReserveCheckbox.checked &&
          editHomeSelect && editStationSelect.value === editHomeSelect.value) {
        if (editIdInput) {
          editIdInput.value = "";
        }
      }
    };
  }

  if (editModalEl) {
    const wasHidden = editModalEl.style.display !== "block";
    editModalEl.style.display = "block";
    if (wasHidden) {
      lockBodyScroll();
    }
  }

  // Add Enter key handler for edit modal inputs
  const editModalKeyHandler = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      saveApparatusEdit();
    }
  };

  editModalEl.addEventListener("keydown", editModalKeyHandler);
  // Store handler so we can remove it later
  editModalEl._keyHandler = editModalKeyHandler;
}

function closeEditModal() {
  editingNumber = null;
  if (editModalEl && editModalEl.style.display === "block") {
    editModalEl.style.display = "none";
    unlockBodyScroll();
    // Remove the Enter key handler
    if (editModalEl._keyHandler) {
      editModalEl.removeEventListener("keydown", editModalEl._keyHandler);
      editModalEl._keyHandler = null;
    }
  }
}

async function saveApparatusEdit() {
  const id = editIdInput ? editIdInput.value.trim() : "";
  const apparatusType = editTypeSelect ? editTypeSelect.value : DEFAULT_TYPE;
  const reserve = editReserveCheckbox ? editReserveCheckbox.checked : false;
  const homeStationId = editHomeSelect ? editHomeSelect.value : "";
  const stationId = editStationSelect ? editStationSelect.value : "";
  const notes = editNotesInput ? editNotesInput.value.trim() : "";

  const { apparatus } = await loadData();
  const updated = apparatus.map(app => {
    if (app.apparatusNumber === editingNumber) {
      return {
        ...app,
        id,
        apparatusType,
        reserve,
        homeStationId: homeStationId || "",
        stationId: stationId || "",
        notes
      };
    }
    return app;
  });

  await saveApparatus(updated);
  closeEditModal();
  await renderDashboard();
}

function sortStationsForSelection(stations) {
  return [...stations].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
  );
}

function sortApparatusForSelection(apparatus) {
  const typeOrder = ["Fire", "Aid", "Medic", "AT", "Staff", "Utility"];
  return [...apparatus].sort((a, b) => {
    const typeIndexA = typeOrder.indexOf(a.apparatusType);
    const typeIndexB = typeOrder.indexOf(b.apparatusType);
    if (typeIndexA !== typeIndexB) {
      return typeIndexA - typeIndexB;
    }
    return a.apparatusNumber.localeCompare(b.apparatusNumber, undefined, { numeric: true, sensitivity: "base" });
  });
}

function checkDirtyAndWarn(tabType) {
  if (tabType === "stations" && stationFormDirty) {
    return confirm("You have unsaved changes to the station. Discard changes?");
  }
  if (tabType === "apparatus" && apparatusFormDirty) {
    return confirm("You have unsaved changes to the apparatus. Discard changes?");
  }
  return true;
}

function clearStationSelection() {
  selectedStationForEdit = null;
  stationFormDirty = false;
}

function clearApparatusSelection() {
  selectedApparatusForEdit = null;
  apparatusFormDirty = false;
}

function renderStationEditForm(container, station, stations, apparatus) {
  container.innerHTML = "";

  const header = document.createElement("h3");
  header.className = "edit-form-header";
  header.textContent = `Edit: ${station.name}`;
  container.appendChild(header);

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = station.name;
  nameInput.placeholder = "Station name";
  nameInput.oninput = () => { stationFormDirty = true; };
  nameInput.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      container.querySelector(".save-btn").click();
    }
  };
  const nameField = buildField("Name", nameInput);
  container.appendChild(nameField);

  const actions = document.createElement("div");
  actions.className = "edit-form-actions";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  saveBtn.className = "save-btn";
  saveBtn.onclick = async () => {
    const newName = nameInput.value.trim();
    if (!newName) {
      alert("Station name is required.");
      nameInput.focus();
      return;
    }
    station.name = newName;
    await saveStations(stations);
    stationFormDirty = false;
    await renderDashboard();
    await openAdminModal();
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.classList.add("danger");
  deleteBtn.onclick = async () => {
    const hasApparatus = apparatus.some(app => app.stationId === station.stationId || app.homeStationId === station.stationId);
    if (hasApparatus) {
      alert("Cannot delete station with assigned apparatus.");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${station.name}?`)) {
      return;
    }
    await deleteStationFromPB(station);
    clearStationSelection();
    await renderDashboard();
    await openAdminModal();
  };

  actions.appendChild(saveBtn);
  actions.appendChild(deleteBtn);
  container.appendChild(actions);
}

function renderApparatusEditForm(container, app, apparatus, stations) {
  container.innerHTML = "";

  const header = document.createElement("h3");
  header.className = "edit-form-header";
  header.textContent = app.apparatusNumber ? `Edit ${app.apparatusNumber}` : "Edit Apparatus";
  container.appendChild(header);

  const fieldsContainer = document.createElement("div");
  fieldsContainer.className = "edit-fields";

  // Number field
  const numberInput = document.createElement("input");
  numberInput.type = "text";
  numberInput.value = app.apparatusNumber;
  numberInput.placeholder = "Number";
  numberInput.oninput = () => { apparatusFormDirty = true; };
  numberInput.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      container.querySelector(".save-btn").click();
    }
  };
  const numberField = buildField("Number", numberInput);
  fieldsContainer.appendChild(numberField);

  // ID field
  const idInput = document.createElement("input");
  idInput.type = "text";
  idInput.value = app.id || "";
  idInput.placeholder = "ID (optional)";
  idInput.oninput = () => { apparatusFormDirty = true; };
  idInput.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      container.querySelector(".save-btn").click();
    }
  };
  const idField = buildField("ID", idInput);
  fieldsContainer.appendChild(idField);

  // Type select
  const typeSelect = document.createElement("select");
  populateTypeSelect(typeSelect, app.apparatusType);
  typeSelect.onchange = () => { apparatusFormDirty = true; };
  typeSelect.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      container.querySelector(".save-btn").click();
    }
  };
  const typeField = buildField("Apparatus Type", typeSelect);
  fieldsContainer.appendChild(typeField);

  // Reserve checkbox
  const reserveCheckbox = document.createElement("input");
  reserveCheckbox.type = "checkbox";
  reserveCheckbox.id = "apparatusEditReserveCheckbox";
  reserveCheckbox.checked = app.reserve || false;
  reserveCheckbox.onchange = () => { apparatusFormDirty = true; };
  const reserveLabel = document.createElement("label");
  reserveLabel.className = "field checkbox-field";
  reserveLabel.appendChild(reserveCheckbox);
  const reserveText = document.createElement("span");
  reserveText.className = "checkbox-label";
  reserveText.textContent = "Reserve";
  reserveLabel.appendChild(reserveText);
  fieldsContainer.appendChild(reserveLabel);

  // Notes field (textarea)
  const notesInput = document.createElement("textarea");
  notesInput.value = app.notes || "";
  notesInput.placeholder = "Notes (optional)";
  notesInput.rows = 3;
  notesInput.oninput = () => { apparatusFormDirty = true; };
  const notesField = buildField("Notes", notesInput);
  fieldsContainer.appendChild(notesField);

  // Home station select
  const homeSelect = document.createElement("select");
  populateStationSelect(homeSelect, stations, app.homeStationId, "Unassigned");
  homeSelect.onchange = () => { apparatusFormDirty = true; };
  homeSelect.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      container.querySelector(".save-btn").click();
    }
  };
  const homeField = buildField("Home Station", homeSelect);
  fieldsContainer.appendChild(homeField);

  // Current station select
  const stationSelect = document.createElement("select");
  populateStationSelect(stationSelect, stations, app.stationId, "Unassigned");
  stationSelect.onchange = () => {
    apparatusFormDirty = true;
    // If reserve apparatus is moved to home station, clear the ID
    if (reserveCheckbox.checked && stationSelect.value === homeSelect.value) {
      idInput.value = "";
    }
  };
  stationSelect.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      container.querySelector(".save-btn").click();
    }
  };
  const stationField = buildField("Current Station", stationSelect);
  fieldsContainer.appendChild(stationField);

  container.appendChild(fieldsContainer);

  // Actions
  const actions = document.createElement("div");
  actions.className = "edit-form-actions";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  saveBtn.className = "save-btn";
  saveBtn.onclick = async () => {
    const newNumber = numberInput.value.trim();
    if (!newNumber) {
      alert("Apparatus number is required.");
      numberInput.focus();
      return;
    }

    // Check for duplicate number
    const duplicate = apparatus.some(other => other.apparatusNumber !== app.apparatusNumber && other.apparatusNumber === newNumber);
    if (duplicate) {
      alert("Apparatus number must be unique.");
      numberInput.focus();
      return;
    }

    app.apparatusNumber = newNumber;
    app.id = idInput.value.trim();
    app.apparatusType = typeSelect.value;
    app.reserve = reserveCheckbox.checked;
    app.notes = notesInput.value.trim();
    app.homeStationId = homeSelect.value;
    app.stationId = stationSelect.value;

    await saveApparatus(apparatus);
    apparatusFormDirty = false;
    await renderDashboard();
    await openAdminModal();
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.classList.add("danger");
  deleteBtn.onclick = async () => {
    const displayName = app.id ? `${app.id} (${app.apparatusNumber})` : app.apparatusNumber;
    if (!confirm(`Are you sure you want to delete apparatus ${displayName}?`)) {
      return;
    }
    await deleteApparatusFromPB(app);
    clearApparatusSelection();
    await renderDashboard();
    await openAdminModal();
  };

  actions.appendChild(saveBtn);
  actions.appendChild(deleteBtn);
  container.appendChild(actions);
}

async function openAdminModal() {
  const wasHidden = !adminModalEl || adminModalEl.style.display !== "block";
  const { stations, apparatus } = await loadData();

  hideStationAdder();
  hideApparatusAdder();

  if (apparatusAdderTypeSelect) {
    populateTypeSelect(apparatusAdderTypeSelect, DEFAULT_TYPE);
  }
  if (apparatusAdderHomeSelect) {
    populateStationSelect(apparatusAdderHomeSelect, stations, "", "Home: Unassigned", "Home:");
  }
  if (apparatusAdderStationSelect) {
    populateStationSelect(apparatusAdderStationSelect, stations, "", "Current: Unassigned", "At:");
  }

  // Add logout button to each tab footer
  document.querySelectorAll('.tab-footer').forEach(footer => {
    let logoutBtn = footer.querySelector('.logout-btn');
    if (!logoutBtn) {
      logoutBtn = document.createElement('button');
      logoutBtn.className = 'logout-btn danger';
      logoutBtn.textContent = 'Logout';
      logoutBtn.onclick = handleLogout;
      footer.insertBefore(logoutBtn, footer.firstChild);
    }
  });

  if (stationListEl) {
    stationListEl.innerHTML = "";

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "selection-buttons";

    // Create edit form
    const editForm = document.createElement("div");
    editForm.className = "edit-form";
    editForm.id = "stationEditForm";

    const sortedStations = sortStationsForSelection(stations);

    sortedStations.forEach(station => {
      const btn = document.createElement("button");
      btn.className = "selection-btn";
      btn.textContent = station.name;
      btn.onclick = () => {
        if (!checkDirtyAndWarn("stations")) return;

        // Toggle selection
        if (selectedStationForEdit === station.stationId) {
          clearStationSelection();
          editForm.classList.remove("visible");
          document.querySelectorAll("#stationEditForm").forEach(f => f.classList.remove("visible"));
          document.querySelectorAll(".selection-btn.selected").forEach(b => b.classList.remove("selected"));
        } else {
          selectedStationForEdit = station.stationId;
          stationFormDirty = false;

          // Update button states
          buttonContainer.querySelectorAll(".selection-btn").forEach(b => b.classList.remove("selected"));
          btn.classList.add("selected");

          // Populate and show form
          renderStationEditForm(editForm, station, stations, apparatus);
          editForm.classList.add("visible");
        }
      };

      if (selectedStationForEdit === station.stationId) {
        btn.classList.add("selected");
      }

      buttonContainer.appendChild(btn);
    });

    stationListEl.appendChild(buttonContainer);
    stationListEl.appendChild(editForm);

    // If we just added a station, select it
    if (lastAddedStationId) {
      const addedStation = stations.find(s => s.stationId === lastAddedStationId);
      if (addedStation) {
        buttonContainer.querySelectorAll(".selection-btn").forEach(b => b.classList.remove("selected"));
        selectedStationForEdit = null;
        stationFormDirty = false;
      }
      lastAddedStationId = null;
    } else if (selectedStationForEdit) {
      // Re-render the currently selected station
      const station = stations.find(s => s.stationId === selectedStationForEdit);
      if (station) {
        renderStationEditForm(editForm, station, stations, apparatus);
        editForm.classList.add("visible");
      }
    }
  }

  if (apparatusListEl) {
    apparatusListEl.innerHTML = "";

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "selection-buttons";

    // Create edit form
    const editForm = document.createElement("div");
    editForm.className = "edit-form";
    editForm.id = "apparatusEditForm";

    const sortedApparatus = sortApparatusForSelection(apparatus);

    sortedApparatus.forEach(app => {
      const btn = document.createElement("button");
      const colorClass = getColorClass(app.apparatusType);
      const buttonClasses = ["selection-btn", colorClass];
      if (app.reserve) {
        buttonClasses.push("reserve");
      }
      btn.className = buttonClasses.filter(Boolean).join(" ");
      btn.textContent = app.id ? `${app.id} ${app.apparatusNumber}` : app.apparatusNumber;
      btn.onclick = () => {
        if (!checkDirtyAndWarn("apparatus")) return;

        // Toggle selection
        if (selectedApparatusForEdit === app.apparatusNumber) {
          clearApparatusSelection();
          editForm.classList.remove("visible");
          document.querySelectorAll("#apparatusEditForm").forEach(f => f.classList.remove("visible"));
          document.querySelectorAll(".selection-btn.selected").forEach(b => b.classList.remove("selected"));
        } else {
          selectedApparatusForEdit = app.apparatusNumber;
          apparatusFormDirty = false;

          // Update button states
          buttonContainer.querySelectorAll(".selection-btn").forEach(b => b.classList.remove("selected"));
          btn.classList.add("selected");

          // Populate and show form
          renderApparatusEditForm(editForm, app, apparatus, stations);
          editForm.classList.add("visible");
        }
      };

      if (selectedApparatusForEdit === app.apparatusNumber) {
        btn.classList.add("selected");
      }

      buttonContainer.appendChild(btn);
    });

    apparatusListEl.appendChild(buttonContainer);
    apparatusListEl.appendChild(editForm);

    // If we just added an apparatus, select it
    if (lastAddedApparatusNumber) {
      const addedApparatus = apparatus.find(a => a.apparatusNumber === lastAddedApparatusNumber);
      if (addedApparatus) {
        const btnText = addedApparatus.id ? `${addedApparatus.id} ${addedApparatus.apparatusNumber}` : addedApparatus.apparatusNumber;
        const addedButton = Array.from(buttonContainer.querySelectorAll(".selection-btn")).find(
          b => b.textContent === btnText
        );
        if (addedButton) {
          setTimeout(() => addedButton.focus(), 0);
        }
      }
      lastAddedApparatusNumber = null;
    } else if (selectedApparatusForEdit) {
      // Re-render the currently selected apparatus
      const app = apparatus.find(a => a.apparatusNumber === selectedApparatusForEdit);
      if (app) {
        renderApparatusEditForm(editForm, app, apparatus, stations);
        editForm.classList.add("visible");
      }
    }
  }

  if (adminModalEl) {
    adminModalEl.style.display = "block";
    if (wasHidden) {
      lockBodyScroll();
    }
    // Reset scroll position on the modal content
    const modalContent = adminModalEl.querySelector(".modal-content");
    if (modalContent) {
      modalContent.scrollTop = 0;
    }
  }

  if (wasHidden) switchTab(DEFAULT_ADMIN_TAB);

  // Reset scroll position to top of scrollable lists
  if (stationListEl) {
    stationListEl.scrollTop = 0;
  }
  if (apparatusListEl) {
    apparatusListEl.scrollTop = 0;
  }
}

// Login modal handlers
const loginButton = document.getElementById('loginButton');
const loginUsernameInput = document.getElementById('loginUsername');
const loginPasswordInput = document.getElementById('loginPassword');

if (loginButton) {
  loginButton.addEventListener('click', handleLogin);
}

[loginUsernameInput, loginPasswordInput].forEach(input => {
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleLogin();
      }
    });
  }
});

// Check auth and render dashboard on page load
checkAuth();
renderDashboard();
