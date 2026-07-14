// Main Application Logic for mensamap

// Global error logger for client-side diagnostics
window.addEventListener('error', function(e) {
  const errorContainer = document.createElement('div');
  errorContainer.style.position = 'fixed';
  errorContainer.style.top = '10px';
  errorContainer.style.left = '50%';
  errorContainer.style.transform = 'translateX(-50%)';
  errorContainer.style.background = '#ef4444';
  errorContainer.style.color = '#fff';
  errorContainer.style.padding = '12px 20px';
  errorContainer.style.borderRadius = '8px';
  errorContainer.style.zIndex = '99999';
  errorContainer.style.fontFamily = 'monospace';
  errorContainer.style.fontSize = '12px';
  errorContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  errorContainer.style.maxWidth = '90%';
  errorContainer.style.whiteSpace = 'pre-wrap';
  errorContainer.innerText = `JS-Fehler: ${e.message}\nDatei: ${e.filename ? e.filename.split('/').pop() : 'unknown'}:${e.lineno}:${e.colno}`;
  document.body.appendChild(errorContainer);
  
  setTimeout(() => {
    errorContainer.remove();
  }, 10000);
});

// State variables
window.MensaMapData = {};
window.CurrentMensaId = "";
window.selectedTableId = null;
window.panzoomInstance = null;

// Hashed password for editor: sha256("admin123")
const ADMIN_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";

// Initialize app when DOM is fully loaded
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  loadData();
  populateDropdown();
  setupURLRoute();
  setupEventListeners();
  initPanzoom();
  
  // Check if already in editor mode from URL or session
  const params = new URLSearchParams(window.location.search);
  if (params.get("editor") === "true" || sessionStorage.getItem("editor_authorized") === "true") {
    if (sessionStorage.getItem("editor_authorized") === "true") {
      enterEditorMode();
    } else {
      openPasswordModal();
    }
  }
});

// Load data from localStorage or fallback to defaults
function loadData() {
  const savedData = localStorage.getItem("mensamap_custom_data");
  if (savedData) {
    try {
      window.MensaMapData = JSON.parse(savedData);
    } catch (e) {
      console.error("Failed to parse custom layout data, reverting to defaults.", e);
      window.MensaMapData = JSON.parse(JSON.stringify(DEFAULT_MENSA_DATA));
    }
  } else {
    window.MensaMapData = JSON.parse(JSON.stringify(DEFAULT_MENSA_DATA));
  }
}

// Save active data to localStorage
window.saveDataToLocalStorage = function() {
  localStorage.setItem("mensamap_custom_data", JSON.stringify(window.MensaMapData));
};

// Populate the Mensa selector dropdown
function populateDropdown() {
  const select = document.getElementById("mensa-select");
  select.innerHTML = "";
  
  Object.keys(window.MensaMapData).forEach(key => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = window.MensaMapData[key].name;
    select.appendChild(option);
  });
}

// Read parameters from URL and load appropriate Mensa/table
function setupURLRoute() {
  const params = new URLSearchParams(window.location.search);
  const mensaId = params.get("mensa");
  const tableId = params.get("table");
  
  const select = document.getElementById("mensa-select");
  
  if (mensaId && window.MensaMapData[mensaId]) {
    window.CurrentMensaId = mensaId;
    select.value = mensaId;
  } else {
    // Default to first Mensa in data
    window.CurrentMensaId = Object.keys(window.MensaMapData)[0] || "";
    select.value = window.CurrentMensaId;
  }
  
  renderMap();
  
  if (tableId) {
    // Highlight table after a small delay to let Panzoom initialize
    setTimeout(() => {
      selectTable(tableId, true);
    }, 200);
  } else {
    // Run zoom-in entrance animation
    setTimeout(() => {
      runEntranceAnimation();
    }, 200);
  }
}

// Run a smooth entry zoom animation (focusing on the center area of the tables)
function runEntranceAnimation() {
  if (!window.panzoomInstance) return;
  if (document.body.classList.contains("editor-mode")) return;
  
  const container = document.getElementById("map-container");
  const containerRect = container.getBoundingClientRect();
  
  // Parse current viewBox
  const svg = document.getElementById("map");
  const viewBoxAttr = svg.getAttribute("viewBox") || "0 0 1900 1270";
  const vbParts = viewBoxAttr.split(" ").map(parseFloat);
  const vbWidth = vbParts[2];
  const vbHeight = vbParts[3];
  
  // Mobile check
  const isMobile = containerRect.width < 768;
  
  // Zoom configuration
  const startScale = isMobile ? 0.6 : 0.8;
  const targetScale = isMobile ? 1.3 : 1.1;
  
  // Center of main focus (e.g. Speisesaal West/Süd junction, near B-40 / A-1)
  const focusX = 600;
  const focusY = 750;
  
  // Calculate mapping scale
  const containerAspect = containerRect.width / containerRect.height;
  const svgAspect = vbWidth / vbHeight;
  
  let svgRenderedWidth = containerRect.width;
  let offsetX = 0;
  let offsetY = 0;
  
  if (containerAspect > svgAspect) {
    const svgRenderedHeight = containerRect.height;
    svgRenderedWidth = svgRenderedHeight * svgAspect;
    offsetX = (containerRect.width - svgRenderedWidth) / 2;
  } else {
    svgRenderedWidth = containerRect.width;
    const svgRenderedHeight = svgRenderedWidth / svgAspect;
    offsetY = (containerRect.height - svgRenderedHeight) / 2;
  }
  
  const svgToPixel = svgRenderedWidth / vbWidth;
  const unscaledFocusX = offsetX + (focusX * svgToPixel);
  const unscaledFocusY = offsetY + (focusY * svgToPixel);
  
  // 1. Instantly snap to a zoomed-out view
  window.panzoomInstance.zoom(startScale, { animate: false });
  const startPanX = (containerRect.width / 2) - (unscaledFocusX * startScale);
  const startPanY = (containerRect.height / 2) - (unscaledFocusY * startScale);
  window.panzoomInstance.pan(startPanX, startPanY, { animate: false });
  
  // 2. Smoothly zoom in to focus area
  setTimeout(() => {
    if (document.body.classList.contains("editor-mode")) return;
    
    const targetPanX = (containerRect.width / 2) - (unscaledFocusX * targetScale);
    const targetPanY = (containerRect.height / 2) - (unscaledFocusY * targetScale);
    
    window.panzoomInstance.zoom(targetScale, { animate: true, duration: 1200 });
    window.panzoomInstance.pan(targetPanX, targetPanY, { animate: true, duration: 1200 });
  }, 300);
}

// Set up event listeners for main UI elements
function setupEventListeners() {
  const select = document.getElementById("mensa-select");
  select.addEventListener("change", (e) => {
    switchMensa(e.target.value);
  });
  
  // Theme toggle
  const themeBtn = document.getElementById("theme-toggle-btn");
  themeBtn.addEventListener("click", toggleTheme);
  
  // Editor mode toggles
  document.getElementById("enter-editor-btn").addEventListener("click", () => {
    if (sessionStorage.getItem("editor_authorized") === "true") {
      enterEditorMode();
    } else {
      openPasswordModal();
    }
  });
  
  document.getElementById("exit-editor-btn").addEventListener("click", exitEditorMode);
  
  // Password modal buttons
  document.getElementById("cancel-password-btn").addEventListener("click", closePasswordModal);
  document.getElementById("submit-password-btn").addEventListener("click", verifyPassword);
  document.getElementById("editor-password-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") verifyPassword();
  });
  
  // Bottom sheet close
  document.getElementById("sheet-close-btn").addEventListener("click", closeBottomSheet);
  document.getElementById("sheet-handle").addEventListener("click", closeBottomSheet);
  
  // Share button
  document.getElementById("btn-share-link").addEventListener("click", shareSelectedTable);
  
  // Close bottom sheet when clicking outside map elements
  document.getElementById("map-container").addEventListener("click", (e) => {
    // Only close if we are in viewer mode and didn't click a table
    if (!document.body.classList.contains("editor-mode")) {
      const isTable = e.target.classList.contains("table-rect") || e.target.classList.contains("table-circle") || e.target.closest(".table-group");
      if (!isTable) {
        closeBottomSheet();
        clearTableSelection();
      }
    }
  });
}

// Switch current cafeteria
function switchMensa(mensaId) {
  if (!window.MensaMapData[mensaId]) return;
  
  window.CurrentMensaId = mensaId;
  clearTableSelection();
  closeBottomSheet();
  renderMap();
  
  // Update URL
  updateURL(mensaId, null);
  
  // Run entrance animation for the new Mensa
  setTimeout(() => {
    runEntranceAnimation();
  }, 100);
}

// Render dynamic map content from data
window.renderMap = function() {
  const mensa = window.MensaMapData[window.CurrentMensaId];
  if (!mensa) return;
  
  const svg = document.getElementById("map");
  svg.setAttribute("viewBox", mensa.viewBox || "0 0 1900 1270");
  
  const areasGroup = document.getElementById("map-areas");
  const tablesGroup = document.getElementById("map-tables");
  
  areasGroup.innerHTML = "";
  tablesGroup.innerHTML = "";
  
  // Render Areas
  if (mensa.areas) {
    mensa.areas.forEach(area => {
      // Area rect
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("id", area.id);
      rect.setAttribute("x", area.x);
      rect.setAttribute("y", area.y);
      rect.setAttribute("width", area.width);
      rect.setAttribute("height", area.height);
      
      if (area.type === "outdoor") {
        rect.setAttribute("class", "area-outdoor");
      } else if (area.type === "wall") {
        rect.setAttribute("class", "area-wall");
      } else {
        rect.setAttribute("class", "area-indoor");
      }
      
      areasGroup.appendChild(rect);
      
      // Area Label
      if (area.label && area.type !== "wall") {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", area.x + area.width / 2);
        text.setAttribute("y", area.y + 40); // slightly shifted from top
        text.setAttribute("class", "svg-label");
        text.setAttribute("text-anchor", "middle");
        text.textContent = area.label;
        areasGroup.appendChild(text);
      }
    });
  }
  
  // Render Tables
  if (mensa.tables) {
    mensa.tables.forEach(table => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "table-group");
      g.setAttribute("data-id", table.id);
      
      let tableShape;
      if (table.shape === "circle") {
        tableShape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        tableShape.setAttribute("cx", table.x + table.width / 2);
        tableShape.setAttribute("cy", table.y + table.height / 2);
        tableShape.setAttribute("r", Math.min(table.width, table.height) / 2);
        tableShape.setAttribute("class", "table-circle");
      } else {
        tableShape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        tableShape.setAttribute("x", table.x);
        tableShape.setAttribute("y", table.y);
        tableShape.setAttribute("width", table.width);
        tableShape.setAttribute("height", table.height);
        tableShape.setAttribute("rx", "4");
        tableShape.setAttribute("ry", "4");
        tableShape.setAttribute("class", "table-rect");
      }
      
      tableShape.setAttribute("id", `table-node-${table.id}`);
      g.appendChild(tableShape);
      
      // Table label inside shapes
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", table.x + table.width / 2);
      text.setAttribute("y", table.y + table.height / 2);
      text.setAttribute("class", "svg-table-label");
      text.textContent = table.id;
      g.appendChild(text);
      
      // Add interactive event listner for viewer mode
      g.addEventListener("click", (e) => {
        if (document.body.classList.contains("editor-mode")) {
          // Handled separately by editor.js select logic
          return;
        }
        e.stopPropagation();
        selectTable(table.id, false);
      });
      
      tablesGroup.appendChild(g);
    });
  }
};

// Initialize Panzoom
function initPanzoom() {
  const mapElement = document.getElementById("map");
  window.panzoomInstance = Panzoom(mapElement, {
    maxScale: 6,
    minScale: 0.5,
    canvas: true,
    contain: 'outside'
  });
  
  // Enable mouse wheel zooming
  mapElement.parentElement.addEventListener('wheel', (e) => {
    if (document.body.classList.contains("editor-mode")) {
      // In editor mode, we might want zoom but prevent default wheel scroll
    }
    window.panzoomInstance.zoomWithWheel(e);
  });
}

// Select a table, optionally zoom/pan to center it
function selectTable(tableId, triggerZoom = false) {
  clearTableSelection();
  
  const tableNode = document.getElementById(`table-node-${tableId}`);
  if (tableNode) {
    tableNode.classList.add("active");
    window.selectedTableId = tableId;
    
    // Open bottom sheet
    document.getElementById("sheet-title").textContent = `Tisch ${tableId}`;
    document.getElementById("bottom-sheet").classList.add("show");
    
    // Update URL
    updateURL(window.CurrentMensaId, tableId);
    
    // Zoom and pan to element if requested (like when loading shared links)
    if (triggerZoom && window.panzoomInstance) {
      // 1. Set target zoom scale
      const scale = 2.5;
      window.panzoomInstance.zoom(scale);
      
      // 2. Wait for the browser to apply scale transform, then measure screen positions and pan to center
      setTimeout(() => {
        const targetNode = document.getElementById(`table-node-${tableId}`);
        if (!targetNode) return;
        
        const container = document.getElementById("map-container");
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetNode.getBoundingClientRect();
        
        // Target screen center
        const screenCenterX = containerRect.left + containerRect.width / 2;
        const screenCenterY = containerRect.top + containerRect.height / 2;
        
        // Element's current screen center (at scale = 2.5)
        const elementCenterX = targetRect.left + targetRect.width / 2;
        const elementCenterY = targetRect.top + targetRect.height / 2;
        
        // Shift required to move element's center to screen's center
        const deltaX = screenCenterX - elementCenterX;
        const deltaY = screenCenterY - elementCenterY;
        
        const currentPan = window.panzoomInstance.getPan();
        window.panzoomInstance.pan(currentPan.x + deltaX, currentPan.y + deltaY);
      }, 150);
    }
  }
}

// Clear currently active table visual state
function clearTableSelection() {
  document.querySelectorAll(".table-rect, .table-circle").forEach(node => {
    node.classList.remove("active");
  });
  window.selectedTableId = null;
}

// Close mobile bottom sheet panel
function closeBottomSheet() {
  document.getElementById("bottom-sheet").classList.remove("show");
  // Also remove table parameter from URL
  updateURL(window.CurrentMensaId, null);
  clearTableSelection();
}

// Share selected table details
function shareSelectedTable() {
  if (!window.selectedTableId) return;
  
  const shareURL = `${window.location.origin}${window.location.pathname}?mensa=${window.CurrentMensaId}&table=${window.selectedTableId}`;
  
  if (navigator.share) {
    navigator.share({
      url: shareURL
    }).then(() => {
      showToast("Erfolgreich geteilt!");
    }).catch((err) => {
      // Fallback if rejected/aborted
      if (err.name !== "AbortError") {
        copyToClipboard(shareURL);
      }
    });
  } else {
    copyToClipboard(shareURL);
  }
}

// Copy URL link helper
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast("Link in die Zwischenablage kopiert!");
  }).catch(err => {
    console.error("Clipboard copy failed: ", err);
    showToast("Kopieren fehlgeschlagen.", true);
  });
}

// Show Toast feedback UI
window.showToast = function(message, isError = false) {
  const toast = document.getElementById("toast");
  const icon = document.getElementById("toast-icon");
  const msgEl = document.getElementById("toast-message");
  
  toast.style.background = isError ? "var(--danger)" : "#10b981";
  icon.textContent = isError ? "✗" : "✓";
  msgEl.textContent = message;
  
  toast.classList.add("show");
  
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
};

// URL updates
function updateURL(mensaId, tableId) {
  let url = `?mensa=${mensaId}`;
  if (tableId) {
    url += `&table=${tableId}`;
  }
  if (document.body.classList.contains("editor-mode")) {
    url += `&editor=true`;
  }
  history.replaceState({}, "", url);
}

/* Theme Controller */
function initTheme() {
  const theme = localStorage.getItem("mensamap_theme") || "dark";
  if (theme === "light") {
    document.body.classList.add("light-theme");
    document.getElementById("theme-toggle-btn").textContent = "☀️";
  } else {
    document.body.classList.remove("light-theme");
    document.getElementById("theme-toggle-btn").textContent = "🌙";
  }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle("light-theme");
  localStorage.setItem("mensamap_theme", isLight ? "light" : "dark");
  document.getElementById("theme-toggle-btn").textContent = isLight ? "☀️" : "🌙";
}

/* Authentication System */
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function openPasswordModal() {
  document.getElementById("password-modal").classList.add("show");
  document.getElementById("editor-password-input").value = "";
  document.getElementById("editor-password-input").focus();
  document.getElementById("password-error-msg").style.display = "none";
}

function closePasswordModal() {
  document.getElementById("password-modal").classList.remove("show");
}

async function verifyPassword() {
  const password = document.getElementById("editor-password-input").value;
  const hash = await sha256(password);
  
  if (hash === ADMIN_HASH) {
    sessionStorage.setItem("editor_authorized", "true");
    closePasswordModal();
    enterEditorMode();
  } else {
    document.getElementById("password-error-msg").style.display = "block";
  }
}

// Mode Transitions
function enterEditorMode() {
  document.body.classList.add("editor-mode");
  document.getElementById("enter-editor-btn").style.display = "none";
  document.getElementById("exit-editor-btn").style.display = "inline-flex";
  
  closeBottomSheet();
  clearTableSelection();
  
  // Set URL parameter
  updateURL(window.CurrentMensaId, null);
  
  // Notify editor.js
  if (window.initializeEditor) {
    window.initializeEditor();
  }
}

function exitEditorMode() {
  document.body.classList.remove("editor-mode");
  document.getElementById("enter-editor-btn").style.display = "inline-flex";
  document.getElementById("exit-editor-btn").style.display = "none";
  
  // Remove URL parameter
  updateURL(window.CurrentMensaId, null);
  
  // Deactivate editor.js handlers
  if (window.deactivateEditor) {
    window.deactivateEditor();
  }
  
  // Re-render viewer clean map
  renderMap();
}
