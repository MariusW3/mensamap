// Layout Editor functionality for mensamap

// Editor State
let activeTool = 'select'; // 'select', 'add-table', 'add-area', 'add-wall'
let selectedElement = null; // Reference to data object: { type: 'table'|'area', data: obj, parentId: str }
let isDragging = false;
let dragStartCoords = { x: 0, y: 0 };
let dragStartElementPos = { x: 0, y: 0 };
let currentScale = 1;

// Register global editor functions
window.initializeEditor = function() {
  activeTool = 'select';
  selectedElement = null;
  updateToolUI();
  setupEditorEvents();
  setupEditorSidebarEvents();
  
  // Render grid helper visual
  window.renderMap();
};

window.deactivateEditor = function() {
  removeEditorEvents();
  selectedElement = null;
  document.getElementById("properties-panel").style.display = "none";
};

// Update active tool visual indicators in the sidebar
function updateToolUI() {
  document.querySelectorAll(".tool-btn").forEach(btn => btn.classList.remove("active"));
  
  if (activeTool === 'select') document.getElementById("tool-select").classList.add("active");
  else if (activeTool === 'add-table') document.getElementById("tool-add-table").classList.add("active");
  else if (activeTool === 'add-area') document.getElementById("tool-add-area").classList.add("active");
  else if (activeTool === 'add-wall') document.getElementById("tool-add-wall").classList.add("active");
  
  // If not select tool, clear current selection
  if (activeTool !== 'select') {
    clearEditorSelection();
  }
}

// Map Editor interactions
function setupEditorEvents() {
  const mapContainer = document.getElementById("map-container");
  const mapSvg = document.getElementById("map");
  
  // Use capturing phase on the parent container to guarantee we run before Panzoom
  mapContainer.addEventListener("pointerdown", handleMapPointerDown, { capture: true });
  
  // Prevent Firefox from starting native ghost drag-and-drop on SVG elements
  mapSvg.addEventListener("dragstart", preventDefaultDrag);
}

function removeEditorEvents() {
  const mapContainer = document.getElementById("map-container");
  const mapSvg = document.getElementById("map");
  
  mapContainer.removeEventListener("pointerdown", handleMapPointerDown, { capture: true });
  mapSvg.removeEventListener("dragstart", preventDefaultDrag);
}

function preventDefaultDrag(e) {
  e.preventDefault();
}

// Helper to get Panzoom transform using getPan and getScale (standard methods in Panzoom v4.x)
function getPanzoomTransform() {
  const pan = window.panzoomInstance.getPan();
  const scale = window.panzoomInstance.getScale();
  return { x: pan.x, y: pan.y, scale: scale };
}

// Convert screen mouse coords to SVG canvas coordinates taking pan/zoom scale into account
function screenToSVGCoords(clientX, clientY) {
  const container = document.getElementById("map-container");
  const rect = container.getBoundingClientRect();
  const transform = getPanzoomTransform();
  
  let svgX = (clientX - rect.left - transform.x) / transform.scale;
  let svgY = (clientY - rect.top - transform.y) / transform.scale;
  
  if (document.getElementById("snap-grid-checkbox").checked) {
    svgX = Math.round(svgX / 10) * 10;
    svgY = Math.round(svgY / 10) * 10;
  }
  
  return { x: svgX, y: svgY };
}

// Pointer down event handler on the SVG canvas
function handleMapPointerDown(e) {
  // Only handle left clicks
  if (e.button !== 0) return;
  
  const coords = screenToSVGCoords(e.clientX, e.clientY);
  const transform = getPanzoomTransform();
  currentScale = transform.scale;

  if (activeTool === 'add-table') {
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
    addTableAt(coords.x, coords.y);
    return;
  }
  
  if (activeTool === 'add-area') {
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
    addAreaAt(coords.x, coords.y, 'indoor');
    return;
  }
  
  if (activeTool === 'add-wall') {
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
    addAreaAt(coords.x, coords.y, 'wall');
    return;
  }
  
  // Select / Drag Mode
  if (activeTool === 'select') {
    // Check if clicked a table or an area
    const targetGroup = e.target.closest(".table-group");
    const targetAreaId = e.target.id;
    
    const mensa = window.MensaMapData[window.CurrentMensaId];
    
    if (targetGroup) {
      // Table selection
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      
      const tableId = targetGroup.getAttribute("data-id");
      const tableData = mensa.tables.find(t => t.id === tableId);
      
      if (tableData) {
        selectElementForEditing('table', tableData, e.clientX, e.clientY);
      }
    } else if (targetAreaId && targetAreaId !== "map" && targetAreaId !== "map-background" && !e.target.classList.contains("grid-lines")) {
      // Background area selection
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      
      const areaData = mensa.areas.find(a => a.id === targetAreaId);
      
      if (areaData) {
        selectElementForEditing('area', areaData, e.clientX, e.clientY);
      }
    } else {
      // Clicked on empty canvas, clear selection
      clearEditorSelection();
      // Do NOT stop propagation here, so the user can still drag the map to pan!
    }
  }
}

// Select an element in the editor and prepare for potential dragging
function selectElementForEditing(type, dataObj, clientX, clientY) {
  clearEditorSelection();
  
  selectedElement = { type, data: dataObj };
  
  // Highlight visually
  if (type === 'table') {
    const node = document.getElementById(`table-node-${dataObj.id}`);
    if (node) node.classList.add("editor-selected");
  } else {
    const node = document.getElementById(dataObj.id);
    if (node) node.classList.add("editor-selected");
  }
  
  // Populate details panel
  showPropertiesPanel();
  
  // Initiate drag setup
  isDragging = true;
  dragStartCoords = { x: clientX, y: clientY };
  dragStartElementPos = { x: dataObj.x, y: dataObj.y };
  
  // Disable panzoom during drag to avoid panning the map
  window.panzoomInstance.setOptions({ disablePan: true });
  
  // Attach pointermove / pointerup
  document.addEventListener("pointermove", handlePointerMove);
  document.addEventListener("pointerup", handlePointerUp);
}

function handlePointerMove(e) {
  if (!isDragging || !selectedElement) return;
  e.preventDefault();
  
  // Calculate delta in SVG coordinates
  const deltaX = (e.clientX - dragStartCoords.x) / currentScale;
  const deltaY = (e.clientY - dragStartCoords.y) / currentScale;
  
  let newX = dragStartElementPos.x + deltaX;
  let newY = dragStartElementPos.y + deltaY;
  
  // Snap coordinates if enabled
  if (document.getElementById("snap-grid-checkbox").checked) {
    newX = Math.round(newX / 10) * 10;
    newY = Math.round(newY / 10) * 10;
  }
  
  // Update data reference
  selectedElement.data.x = newX;
  selectedElement.data.y = newY;
  
  // Update inputs
  document.getElementById("prop-x").value = Math.round(newX);
  document.getElementById("prop-y").value = Math.round(newY);
  
  // Update live DOM elements instead of full re-render for performance during drag
  if (selectedElement.type === 'table') {
    const node = document.getElementById(`table-node-${selectedElement.data.id}`);
    if (node) {
      if (selectedElement.data.shape === 'circle') {
        node.setAttribute("cx", newX + selectedElement.data.width / 2);
        node.setAttribute("cy", newY + selectedElement.data.height / 2);
      } else {
        node.setAttribute("x", newX);
        node.setAttribute("y", newY);
      }
      
      // Update label
      const group = node.closest(".table-group");
      const label = group.querySelector("text");
      if (label) {
        label.setAttribute("x", newX + selectedElement.data.width / 2);
        label.setAttribute("y", newY + selectedElement.data.height / 2);
      }
    }
  } else {
    const node = document.getElementById(selectedElement.data.id);
    if (node) {
      node.setAttribute("x", newX);
      node.setAttribute("y", newY);
      
      // Update area label if exists
      const labelNode = Array.from(document.querySelectorAll("#map-areas text")).find(text => {
        // Label x is center of rect: x + w/2
        const expectedX = selectedElement.data.x + selectedElement.data.width / 2;
        return Math.abs(parseFloat(text.getAttribute("x")) - expectedX) < 100; // approximate check
      });
      if (labelNode && selectedElement.data.label) {
        labelNode.setAttribute("x", newX + selectedElement.data.width / 2);
        labelNode.setAttribute("y", newY + 40);
      }
    }
  }
}

function handlePointerUp() {
  if (isDragging) {
    isDragging = false;
    window.panzoomInstance.setOptions({ disablePan: false });
    
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    
    window.saveDataToLocalStorage();
    
    // Full render to fix label positioning and any slight misalignment
    window.renderMap();
    
    // Re-apply select state visualization
    if (selectedElement) {
      const type = selectedElement.type;
      const dataObj = selectedElement.data;
      if (type === 'table') {
        const node = document.getElementById(`table-node-${dataObj.id}`);
        if (node) node.classList.add("editor-selected");
      } else {
        const node = document.getElementById(dataObj.id);
        if (node) node.classList.add("editor-selected");
      }
    }
  }
}

// Clear selected item visual highlighting and states
function clearEditorSelection() {
  document.querySelectorAll(".editor-selected").forEach(el => el.classList.remove("editor-selected"));
  selectedElement = null;
  document.getElementById("properties-panel").style.display = "none";
}

// Show properties sidebar for selected element
function showPropertiesPanel() {
  if (!selectedElement) return;
  
  const panel = document.getElementById("properties-panel");
  panel.style.display = "block";
  
  const typeLabel = document.getElementById("selected-type-label");
  const idGroup = document.getElementById("prop-id-group");
  const labelGroup = document.getElementById("prop-label-group");
  const typeGroup = document.getElementById("prop-type-group");
  const shapeGroup = document.getElementById("prop-shape-group");
  
  const obj = selectedElement.data;
  
  // Fill position coordinates
  document.getElementById("prop-x").value = Math.round(obj.x);
  document.getElementById("prop-y").value = Math.round(obj.y);
  document.getElementById("prop-w").value = Math.round(obj.width);
  document.getElementById("prop-h").value = Math.round(obj.height);
  
  if (selectedElement.type === 'table') {
    typeLabel.textContent = "Tisch";
    idGroup.style.display = "block";
    labelGroup.style.display = "none";
    typeGroup.style.display = "none";
    shapeGroup.style.display = "block";
    
    document.getElementById("prop-id").value = obj.id;
    document.getElementById("prop-shape").value = obj.shape || "rect";
  } else {
    // Area
    if (obj.type === 'wall') {
      typeLabel.textContent = "Trennwand";
      idGroup.style.display = "none";
      labelGroup.style.display = "none";
      typeGroup.style.display = "block";
      shapeGroup.style.display = "none";
    } else {
      typeLabel.textContent = "Bereich";
      idGroup.style.display = "none";
      labelGroup.style.display = "block";
      typeGroup.style.display = "block";
      shapeGroup.style.display = "none";
      
      document.getElementById("prop-label").value = obj.label || "";
    }
    
    document.getElementById("prop-type").value = obj.type;
  }
}

// Add a new table at target coordinates
function addTableAt(x, y) {
  const mensa = window.MensaMapData[window.CurrentMensaId];
  if (!mensa) return;
  
  // Auto-generate ID: Find last table's alphabetical prefix + incremented number
  let nextId = "A-1";
  if (mensa.tables && mensa.tables.length > 0) {
    // Look at last table or selected table
    let lastTable = mensa.tables[mensa.tables.length - 1];
    if (selectedElement && selectedElement.type === 'table') {
      lastTable = selectedElement.data;
    }
    
    const match = lastTable.id.match(/^([A-Za-z]+)-?([0-9]+)$/);
    if (match) {
      const prefix = match[1];
      const nextNum = parseInt(match[2]) + 1;
      nextId = `${prefix}-${nextNum}`;
    } else {
      nextId = `T-${mensa.tables.length + 1}`;
    }
  }
  
  const defaultW = 60;
  const defaultH = 20;
  
  const newTable = {
    id: nextId,
    x: x - defaultW / 2,
    y: y - defaultH / 2,
    width: defaultW,
    height: defaultH,
    shape: 'rect'
  };
  
  mensa.tables.push(newTable);
  window.saveDataToLocalStorage();
  window.renderMap();
  
  // Auto select the new table
  selectElementForEditing('table', newTable, 0, 0);
  isDragging = false; // block dragging immediately on click
  window.panzoomInstance.setOptions({ disablePan: false });
}

// Add a new area (background shapes/walls) at coordinates
function addAreaAt(x, y, areaType) {
  const mensa = window.MensaMapData[window.CurrentMensaId];
  if (!mensa) return;
  
  const areaId = `area_${Date.now()}`;
  let defaultW = 200;
  let defaultH = 150;
  let defaultLabel = "Neuer Saal";
  
  if (areaType === 'wall') {
    defaultW = 8;
    defaultH = 150;
    defaultLabel = "";
  } else if (areaType === 'outdoor') {
    defaultLabel = "Außenbereich";
  }
  
  const newArea = {
    id: areaId,
    type: areaType,
    label: defaultLabel,
    x: x - defaultW / 2,
    y: y - defaultH / 2,
    width: defaultW,
    height: defaultH
  };
  
  if (!mensa.areas) mensa.areas = [];
  mensa.areas.push(newArea);
  
  window.saveDataToLocalStorage();
  window.renderMap();
  
  // Auto select the new area
  selectElementForEditing('area', newArea, 0, 0);
  isDragging = false;
  window.panzoomInstance.setOptions({ disablePan: false });
}

// Editor Sidebar events handling
function setupEditorSidebarEvents() {
  // Toolbar buttons click
  document.getElementById("tool-select").addEventListener("click", () => { activeTool = 'select'; updateToolUI(); });
  document.getElementById("tool-add-table").addEventListener("click", () => { activeTool = 'add-table'; updateToolUI(); });
  document.getElementById("tool-add-area").addEventListener("click", () => { activeTool = 'add-area'; updateToolUI(); });
  document.getElementById("tool-add-wall").addEventListener("click", () => { activeTool = 'add-wall'; updateToolUI(); });
  
  // Duplicate element
  document.getElementById("duplicate-element-btn").addEventListener("click", duplicateSelectedElement);
  
  // Delete element
  document.getElementById("delete-element-btn").addEventListener("click", deleteSelectedElement);
  
  // Sync changes from property inputs back to memory
  const syncProperty = (field, propName, isNum = false) => {
    const input = document.getElementById(field);
    input.addEventListener("input", (e) => {
      if (!selectedElement) return;
      
      let val = e.target.value;
      if (isNum) {
        val = parseFloat(val) || 0;
      }
      
      // If table ID is changed, update DOM node references too
      if (propName === 'id' && selectedElement.type === 'table') {
        const mensa = window.MensaMapData[window.CurrentMensaId];
        // Ensure ID is unique
        const exists = mensa.tables.some(t => t.id === val && t !== selectedElement.data);
        if (exists) {
          input.style.borderColor = "var(--danger)";
          return;
        } else {
          input.style.borderColor = "";
        }
        
        // Update selection node ID
        const oldId = selectedElement.data.id;
        selectedElement.data.id = val;
        
        window.saveDataToLocalStorage();
        window.renderMap();
        
        // Re-highlight the selected item
        const node = document.getElementById(`table-node-${val}`);
        if (node) node.classList.add("editor-selected");
        return;
      }
      
      // Normal update
      selectedElement.data[propName] = val;
      window.saveDataToLocalStorage();
      window.renderMap();
      
      // Re-highlight selection visually
      const nodeId = selectedElement.type === 'table' ? `table-node-${selectedElement.data.id}` : selectedElement.data.id;
      const node = document.getElementById(nodeId);
      if (node) node.classList.add("editor-selected");
    });
  };
  
  syncProperty("prop-id", "id");
  syncProperty("prop-label", "label");
  syncProperty("prop-type", "type");
  syncProperty("prop-shape", "shape");
  syncProperty("prop-x", "x", true);
  syncProperty("prop-y", "y", true);
  syncProperty("prop-w", "width", true);
  syncProperty("prop-h", "height", true);
  
  // Mensa general operations
  document.getElementById("edit-mensa-name").addEventListener("input", (e) => {
    const mensa = window.MensaMapData[window.CurrentMensaId];
    if (mensa && e.target.value.trim() !== "") {
      mensa.name = e.target.value;
      window.saveDataToLocalStorage();
      
      // Update dropdown option labels
      const option = document.querySelector(`#mensa-select option[value="${window.CurrentMensaId}"]`);
      if (option) option.textContent = e.target.value;
    }
  });
  
  document.getElementById("edit-mensa-viewbox").addEventListener("input", (e) => {
    const mensa = window.MensaMapData[window.CurrentMensaId];
    if (mensa && e.target.value.trim() !== "") {
      mensa.viewBox = e.target.value;
      window.saveDataToLocalStorage();
      window.renderMap();
    }
  });
  
  // Add new Mensa option
  document.getElementById("add-mensa-btn").addEventListener("click", createNewMensa);
  
  // Delete active Mensa
  document.getElementById("delete-mensa-btn").addEventListener("click", deleteCurrentMensa);
  
  // Data actions
  document.getElementById("export-json-btn").addEventListener("click", exportLayoutJSON);
  document.getElementById("import-json-btn").addEventListener("click", () => {
    document.getElementById("import-file-input").click();
  });
  document.getElementById("import-file-input").addEventListener("change", importLayoutJSON);
  
  document.getElementById("reset-layout-btn").addEventListener("click", resetToDefaults);
  
  // Populate Mensa details in panel initially
  const mensa = window.MensaMapData[window.CurrentMensaId];
  if (mensa) {
    document.getElementById("edit-mensa-name").value = mensa.name;
    document.getElementById("edit-mensa-viewbox").value = mensa.viewBox;
  }
}

// Duplicate the active element
function duplicateSelectedElement() {
  if (!selectedElement) return;
  
  const mensa = window.MensaMapData[window.CurrentMensaId];
  const obj = selectedElement.data;
  
  const clone = JSON.parse(JSON.stringify(obj));
  
  // Shift positions slightly
  clone.x += 20;
  clone.y += 20;
  
  if (selectedElement.type === 'table') {
    // Generate new unique ID
    const match = obj.id.match(/^([A-Za-z]+)-?([0-9]+)$/);
    let nextId = `${obj.id}_copy`;
    if (match) {
      const prefix = match[1];
      let num = parseInt(match[2]) + 1;
      nextId = `${prefix}-${num}`;
      
      // Loop to ensure uniqueness
      while (mensa.tables.some(t => t.id === nextId)) {
        num++;
        nextId = `${prefix}-${num}`;
      }
    }
    
    clone.id = nextId;
    mensa.tables.push(clone);
    window.saveDataToLocalStorage();
    window.renderMap();
    selectElementForEditing('table', clone, 0, 0);
  } else {
    // Area
    clone.id = `area_${Date.now()}`;
    if (clone.label) clone.label = `${clone.label} (Kopie)`;
    mensa.areas.push(clone);
    window.saveDataToLocalStorage();
    window.renderMap();
    selectElementForEditing('area', clone, 0, 0);
  }
  
  isDragging = false;
  window.panzoomInstance.setOptions({ disablePan: false });
  window.showToast("Element dupliziert!");
}

// Delete the active element from dataset
function deleteSelectedElement() {
  if (!selectedElement) return;
  
  const mensa = window.MensaMapData[window.CurrentMensaId];
  const obj = selectedElement.data;
  
  if (selectedElement.type === 'table') {
    mensa.tables = mensa.tables.filter(t => t !== obj);
  } else {
    mensa.areas = mensa.areas.filter(a => a !== obj);
  }
  
  window.saveDataToLocalStorage();
  clearEditorSelection();
  window.renderMap();
  window.showToast("Element gelöscht!");
}

// Create a completely new cafeteria layout
function createNewMensa() {
  const name = prompt("Name der neuen Mensa eingeben:");
  if (!name || name.trim() === "") return;
  
  const cleanId = name.toLowerCase().replace(/[^a-z0-9]/g, "_");
  
  if (window.MensaMapData[cleanId]) {
    alert("Eine Mensa mit diesem Bezeichner existiert bereits.");
    return;
  }
  
  window.MensaMapData[cleanId] = {
    id: cleanId,
    name: name,
    viewBox: "0 0 1200 800",
    areas: [
      { id: `area_${Date.now()}`, type: "indoor", label: name, x: 0, y: 0, width: 1200, height: 800 }
    ],
    tables: []
  };
  
  window.saveDataToLocalStorage();
  
  // Re-build selectors
  const select = document.getElementById("mensa-select");
  const option = document.createElement("option");
  option.value = cleanId;
  option.textContent = name;
  select.appendChild(option);
  
  select.value = cleanId;
  window.CurrentMensaId = cleanId;
  
  // Fill details inputs
  document.getElementById("edit-mensa-name").value = name;
  document.getElementById("edit-mensa-viewbox").value = "0 0 1200 800";
  
  clearEditorSelection();
  window.renderMap();
  
  // Reset Panzoom
  if (window.panzoomInstance) {
    window.panzoomInstance.reset();
  }
  
  window.showToast("Mensa erstellt!");
}

// Delete current cafeteria layout
function deleteCurrentMensa() {
  const keys = Object.keys(window.MensaMapData);
  if (keys.length <= 1) {
    alert("Es muss mindestens eine Mensa vorhanden bleiben.");
    return;
  }
  
  const name = window.MensaMapData[window.CurrentMensaId].name;
  if (!confirm(`Bist du sicher, dass du die Mensa "${name}" löschen möchtest?`)) return;
  
  delete window.MensaMapData[window.CurrentMensaId];
  window.saveDataToLocalStorage();
  
  // Re-initialize selectors & switch to first remaining
  populateDropdown();
  
  const select = document.getElementById("mensa-select");
  window.CurrentMensaId = select.value;
  
  // Update sidebar inputs
  const mensa = window.MensaMapData[window.CurrentMensaId];
  document.getElementById("edit-mensa-name").value = mensa.name;
  document.getElementById("edit-mensa-viewbox").value = mensa.viewBox;
  
  clearEditorSelection();
  window.renderMap();
  
  window.showToast("Mensa gelöscht!");
}

// Export entire layout configuration data to JSON file
function exportLayoutJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.MensaMapData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "mensamap_layout.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  window.showToast("JSON-Datei heruntergeladen!");
}

// Import config JSON file
function importLayoutJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedData = JSON.parse(event.target.result);
      
      // Simple verification
      const keys = Object.keys(importedData);
      if (keys.length === 0 || !importedData[keys[0]].name) {
        throw new Error("Ungültiges Dateiformat");
      }
      
      window.MensaMapData = importedData;
      window.saveDataToLocalStorage();
      
      // Refresh UI
      populateDropdown();
      setupURLRoute();
      
      // Fill details inputs
      const mensa = window.MensaMapData[window.CurrentMensaId];
      document.getElementById("edit-mensa-name").value = mensa.name;
      document.getElementById("edit-mensa-viewbox").value = mensa.viewBox;
      
      window.showToast("Layout erfolgreich importiert!");
    } catch (err) {
      alert("Fehler beim Importieren der Datei: " + err.message);
    }
  };
  reader.readAsText(file);
}

// Reset local storage to hardcoded defaults in data.js
function resetToDefaults() {
  if (!confirm("Bist du sicher, dass du alle Änderungen verwerfen und das Standard-Layout wiederherstellen willst?")) return;
  
  localStorage.removeItem("mensamap_custom_data");
  window.MensaMapData = JSON.parse(JSON.stringify(DEFAULT_MENSA_DATA));
  
  populateDropdown();
  setupURLRoute();
  
  const mensa = window.MensaMapData[window.CurrentMensaId];
  document.getElementById("edit-mensa-name").value = mensa.name;
  document.getElementById("edit-mensa-viewbox").value = mensa.viewBox;
  
  clearEditorSelection();
  window.showToast("Standard-Layout wiederhergestellt.");
}
