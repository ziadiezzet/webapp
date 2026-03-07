/** Author : Eziadi
 * ==================================================================
 * DATA MODEL EXPLORER - MAIN APPLICATION
 * ==================================================================
 * 
 * ORGANIZED STRUCTURE:
 * 
 * 1. APPLICATION STATE & INITIALIZATION
 * 2. LEFT PANEL - ENTITIES/TABLES LIST  
 * 3. DATA PROCESSING & SOURCES
 * 4. GRID RENDERING & VIRTUAL SCROLLING
 * 5. SORTING, SEARCHING & AUTOCOMPLETE
 * 6. UI INTERACTION - SIDEBAR & MODALS
 * 7. OVERVIEW TAB RENDERING
 * 8. SETTINGS MANAGEMENT
 * 9. EXPORT & CLIPBOARD
 * 10. EVENT LISTENERS & KEYBOARD SHORTCUTS
 * 11. HELPER FUNCTIONS
 * ==================================================================
 */

// ==================================================================
// MODULE: APPLICATION STATE & INITIALIZATION
// ==================================================================

/************************************ 
 * Application state object
 * you can add new propriety in CDM/PDM columns by adding { id: 'columnNameInJs', name: 'DisplayedName', width: 120, frozen: false, visible: true }, 
 * only if it exist in the js file
 ************************************/

// Initialize LoadTimer early to track total page load time
if (!window.loadTimer) {
    window.loadTimer = new (class SimpleLoadTimer {
        constructor() {
            this.startTime = Date.now();
            this.isLoading = true;
        }
        
        markAsLoaded() {
            if (!this.isLoading) return;
            this.isLoading = false;
            const loadTime = Date.now() - this.startTime;
        }
    })();
}

console.log("Start Executing the application");

const state = {
    mode: 'CDM',
    cdmData: [],
    allData: [],
    viewData: [],
    pdmData: [],
    cdmColumns: [
        { id: 'Model', name: 'Model', width: 250, frozen: false, visible: true },
        { id: 'combinedName', name: 'CDM', width: 250, frozen: false, visible: true },
        { id: 'Datatype', name: 'Datatype', width: 120, frozen: false, visible: true },
        { id: 'Mandatory', name: 'M', width: 60, frozen: false, visible: true },
        { id: 'Primary', name: 'PK', width: 60, frozen: false, visible: true },
		{ id: 'Identifier', name: 'BI', width: 60, frozen: false, visible: true },
        { id: 'Mapping', name: 'Mapping', width: 250, frozen: false, visible: true },   
        { id: 'STSP', name: 'STSP', width: 100, frozen: false, visible: true },
        { id: 'Screen', name: 'Screen', width: 120, frozen: false, visible: true },
        { id: 'TTS', name: 'TTS', width: 150, frozen: false, visible: true },
        { id: 'Domain', name: 'Domain', width: 200, frozen: false, visible: true },                
        { id: 'Description', name: 'Description', width: 300, frozen: false, visible: false },        
        { id: 'FrName', name: 'Fr Name', width: 150, frozen: false, visible: false },
        { id: 'FrDescription', name: 'Fr Desc', width: 200, frozen: false, visible: false },        
        { id: 'Creation_date', name: 'Created', width: 100, frozen: false, visible: false },
        { id: 'Modification_date', name: 'Modified', width: 100, frozen: false, visible: false },
    ],
    pdmColumns: [
        { id: 'Model', name: 'Model', width: 250, frozen: false, visible: true },
        { id: 'combinedName', name: 'PDM name', width: 250, frozen: false, visible: true },
        { id: 'combinedCode', name: 'PDM code', width: 250, frozen: false, visible: true },
        { id: 'Datatype', name: 'Datatype', width: 120, frozen: false, visible: true },
        { id: 'Mandatory', name: 'M', width: 60, frozen: false, visible: true },
        { id: 'Primary', name: 'PK', width: 60, frozen: false, visible: true },
        { id: 'Unique', name: 'AK', width: 60, frozen: false, visible: true },
        { id: 'Foreign', name: 'FK', width: 60, frozen: false, visible: true },
        { id: 'Index', name: 'Index', width: 100, frozen: false, visible: true },
        { id: 'Sequence', name: 'Seq', width: 100, frozen: false, visible: true },
        { id: 'Description', name: 'Description', width: 300, frozen: false, visible: true },
        { id: 'Comment', name: 'Comment', width: 200, frozen: false, visible: true },
        { id: 'Identifier', name: 'Identifier', width: 100, frozen: false, visible: false },
        { id: 'Creation_date', name: 'Created', width: 100, frozen: false, visible: false },
        { id: 'Modification_date', name: 'Modified', width: 100, frozen: false, visible: false },
    ],
    columns: [],
    rowHeight: 35,
    scrollTop: 0,
    sortCol: null,
    sortAsc: true,
    filterText: '',
    selectedRowIndex: -1,
    selectedRowIndexes: [], // supports multi-selection (indices in viewData)
    lastClickedIndex: -1,
    darkMode: false,
    activeRowData: null,
    currentFocus: -1,
    settings: {
        general: {
            theme: 'auto',
            fontSize: 'medium',
            fontFamily: 'Lexend',
            rowHeight: 35,
            sidebarWidth: 450,
            sidebarDefaultOpen: false,
            collapseSections: false
        },
        cdm: {
            defaultColumns: ['Model', 'combinedName', 'Datatype', 'Mandatory', 'Primary', 'Identifier', 'Mapping', 'STSP', 'Screen',  'TTS', 'Description', 'Domain', 'Creation_date', 'Modification_date'],
            columnOrder: ['Model', 'combinedName', 'Mapping', 'Datatype', 'Mandatory', 'Primary', 'Identifier', 'STSP', 'Screen', 'TTS', 'Description', 'Domain', 'FrName', 'FrDescription', 'Creation_date', 'Modification_date'],
            frozenColumns: []
        },
        pdm: {
            defaultColumns: ['Model', 'combinedName', 'combinedCode', 'Datatype', 'Mandatory', 'Primary', 'Unique', 'Foreign', 'Index', 'Sequence', 'Description', 'Comment', 'Creation_date', 'Modification_date'],
            columnOrder: ['Model', 'combinedName', 'combinedCode', 'Datatype', 'Mandatory', 'Primary', 'Unique', 'Foreign', 'Index', 'Sequence', 'Description', 'Comment', 'Stereotype', 'Identifier', 'Creation_date', 'Modification_date'],
            frozenColumns: []
        },
        appearance: {
            accentColor: '#2563eb',
            accentColorCDM: '#8b5cf6',
            accentColorPDM: '#06b6d4',
            bgPrimary: '#ffffff',
            bgSecondary: '#e5eeff',
            textPrimary: '#111827',
            borderColor: '#d1d5db',
            txtttcolor: '#000000',
            bgttcolor: '#d9dbdcff',
            rowHoverColor: 'rgba(37, 99, 235, 0.05)',
            selectedRowColor: 'rgba(37, 99, 235, 0.15)',
            headerHeight: 40,
            rowHeight: 35,
            borderRadius: 6,
            gridLineWidth: 1,
            showRowNumbers: true,
            highlightSelectedRow: true,
            rowHoverEffect: true,
            smoothScrolling: true,
            fontFamily: 'Lexend, sans-serif',
            headerFontWeight: '600',
            fontSizeScale: 100
        },
        diagram : {
            // Layout settings
            spacingFactor:  0.3,
            autoFitSpacing: true,
            defaultView: 'center',
            showRelationships: true,
            showInheritance: true,
            wrapLabel: false,
            wrapLength: 30,
            minZoom: 0.1,
            maxZoom: 4,
            invertPosY: false,
              
            // Node box settings
            boxWidth: 240,
            boxHeight: 100,
            boxStrokeColor: '#334155',
            boxStrokeWidth: 1.5,
            boxStrokeDash: 'solid',
              
            // Edge style settings
            edgeColorRel: '#1912f5a6',
            edgeWidthRel: 1.5,
            edgeDashRel: 'solid',
            edgeColorInh: '#0fe2e2ff',
            edgeWidthInh: 1.5,
            edgeDashInh: 'dash',
              
            // Cardinality settings
            showCardinalityMarkers: true,
            
            // Content display settings
            boxFieldsCdm: {
                showStereotype: true,
                showComment: true,
                showKeySummary: true,
                showMapping: false,
                showCounts: false
            },
            boxFieldsPdm: {
                showStereotype: true,
                showComment: true,
                showKeySummary: true,
                showCounts: false
            },
              
            // Position persistence
            positions: {},
              
            // NEW: edge styling defaults
            edgeStyles: {
                relationship: { color: '#2563eb', width: 2, arrow: true },
                inheritance:  { color: '#29cdd6eb', width: 2, dash: true }
            },

            // NEW: viewer zoom-in behavior
            zoomInMode: 'factor',     // 'factor' | 'center'
            zoomInFactor: 1.2
        },
        accessibility: {
            reducedMotion: false,
            highContrast: false,
            alwaysShowFocus: false,
            logicalTabOrder: true,
            screenReaderSupport: true,
            fontSizeMultiplier: 100,
            lineHeight: 1.5,
            letterSpacing: 0,
            underlineLinks: false
        },
        shortcuts: {
            // Global shortcuts
            'focus-search': 'Ctrl+F',
            'toggle-left-panel': 'Ctrl+L',
            'toggle-sidebar': 'Ctrl+B',
            'toggle-theme': 'Ctrl+D',
            'toggle-fullscreen': 'F11',
            'export-data': 'Ctrl+E',
            'copy-selected': 'Ctrl+C',
            'show-settings': 'Ctrl+,',
            'show-help': 'Ctrl+/',
            
            // Navigation shortcuts
            'navigate-up': 'ArrowUp',
            'navigate-down': 'ArrowDown',
            'navigate-left': 'ArrowLeft',
            'navigate-right': 'ArrowRight',
            'page-up': 'PageUp',
            'page-down': 'PageDown',
            'home': 'Home',
            'end': 'End',
            
            // Diagram shortcuts
            'show-diagram': 'Ctrl+G',
            'zoom-in': 'Ctrl+Plus',
            'zoom-out': 'Ctrl+Minus',
            'zoom-reset': 'Ctrl+0',
            'zoom-fit': 'Ctrl+1',
            'pan-left': 'ArrowLeft+Shift',
            'pan-right': 'ArrowRight+Shift',
            'pan-up': 'ArrowUp+Shift',
            'pan-down': 'ArrowDown+Shift'
        },
        // In the state.settings object, add:
        icons: {
            iconSet: 'fontawesome',
            iconSize: 'medium',
            iconColorSource: 'accent',
            iconCustomColor: '#4b5563',
            iconAnimation: 'spin',
            buttonIconSize: 16,
            toolbarIconSize: 18,
            showIconTooltips: true,
            iconLoadingAnimation: true,
            successIconColor: '#10b981',
            errorIconColor: '#ef4444',
            warningIconColor: '#f59e0b',
            infoIconColor: '#3b82f6'
        },
        leftPanel: {
            regexSearch: true,
            defaultExpand: false,
            enableModelDrag: true,
            saveModelOrder: true,
            showCounts: true,
            showStereotypeColors: true,
            modelOrderCDM: [],    // Separate order for CDM
            modelOrderPDM: [],    // Separate order for PDM
            animationSpeed: 200,
            filterDelay: 300,
            fontSize: 'medium',
            fontWeight: '500',
            itemHeight: 80,
            leftPanelWidth: 500,
            selectedModelsCDM: ['iMX Standard Conceptual Model', 'iMX Collection Conceptual Model v2', 'iMX Commercial Finance Conceptual Model', 'iMX Leasing Conceptual Model'],
            selectedModelsPDM: ['StandardModel','Factoring_Standard_Model'],
            
            // Add missing properties from LeftPanel.js:
            defaultState: 'closed',  // or 'open' based on your preference
            showModelIcons: true,
            iconSize: 'medium',
            collapseEmptyModels: false,
            highlightCurrentModel: true,
            syncWithGridSelection: true,
            showModelTypeBadges: true,
            modelTypeColors: {
                CDM: '#8b5cf6',
                PDM: '#06b6d4',
                mixed: '#94a3b8'
            }
        },
        // Enhance behavior settings with toast colors:
        behavior: {
            toastDuration: 3500,
            toastPosition: 'bottom-right',
            toastAnimation: 'fade',
            showSuccessToasts: true,
            showInfoToasts: true,
            showWarningToasts: true,
            showErrorToasts: true,
            toastSoundEnabled: false,
            keyboardShortcutsEnabled: true,
            showShortcutHints: true,
            shortcutConflict: 'prevent',
            doubleClickSpeed: 500,
            tooltipDelay: 500,
            confirmTimeout: 0,
            autoSaveInterval: 5,
            toastSuccessColor: '#10b981',
            toastErrorColor: '#ef4444',
            toastWarningColor: '#f59e0b',
            toastInfoColor: '#3b82f6',
            toastTextColor: '#ffffff',
            toastBorderColor: 'rgba(255, 255, 255, 0.1)',
            toastShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }
    }
};

/************************************
 * Loads settings from localStorage *
 ************************************/
function loadSettings() {
    try {
        const saved = localStorage.getItem('datagrid_settings');
        if (saved) {
            const parsed = JSON.parse(saved);           
            // Merge saved settings with defaults
            state.settings = deepMerge(state.settings, parsed);           
            console.log('Settings loaded successfully');
        } else {
            console.log('No saved settings found, using defaults');
        }
        
        // Apply settings without DOM dependencies
        setTimeout(() => {
            try {
                applyAllSettings();
            } catch (applyError) {
                console.error('Error applying settings on load:', applyError);
            }
        }, 100);
        
    } catch (e) {
        console.warn('Could not load settings:', e);
        // Apply default settings on error
        setTimeout(() => {
            try {
                applyAllSettings();
            } catch (applyError) {
                console.error('Error applying default settings:', applyError);
            }
        }, 100);
    }
}

/**********************************
 * Saves settings to localStorage *
 **********************************/
function saveSettings() {
    try {
        localStorage.setItem('datagrid_settings', JSON.stringify(state.settings));
        console.log('Settings saved successfully');
    } catch (e) {
        console.warn('Could not save settings:', e);
    }
}

// Helper function for deep merging objects
function deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, { [key]: source[key] });
                else
                    output[key] = deepMerge(target[key], source[key]);
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/***************************
 *  DOM element references *
 ***************************/ 
const els = {
    gridHeader: document.getElementById('gridHeader'),
    gridViewport: document.getElementById('gridViewport'),
    gridCanvas: document.getElementById('gridCanvas'),
    sidebar: document.getElementById('sidebar'),
    statusCounter: document.getElementById('statusCounter'),
    filteredCounterBadge: document.getElementById('filteredCounterBadge'),
    colMenu: document.getElementById('colMenu'),
    copyMenu: document.getElementById('copyMenu'),
    searchInput: document.getElementById('globalSearch'),
    autocompleteList: document.getElementById('autocomplete-list'),
    modeSwitcher: document.getElementById('modeSwitcher'),
    modeTag: document.getElementById('modeTag'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingTime: document.getElementById('loadingTime')
};

//Global variable
let tmp = ""
// Resize & Drag Logic
let isResizing = false;
let draggedColIndex = -1;

// ==================================================================
// MODULE: DATA PROCESSING & SOURCES
// ==================================================================

/****************************
 * Gets the CDM data source *
 ****************************/
 
function getCDMDataSource() {
    return cdmData;
}

/****************************
 * Gets the PDM data source *
 ****************************/
 
function getPDMDataSource() {
    return pdmData;
}

/*******************************************************
 * Processes raw CDM entities into flat attribute list *
 *******************************************************/
 
function processCDMData(sourceEntities) {
    const flatList = [];
    let globalRowId = 0;

    sourceEntities.forEach(entity => {
        const attributes = Array.isArray(entity.Attributes) ? entity.Attributes : [];

        if (attributes.length === 0) {
            // Create minimal row for entities without attributes
            flatList.push({
                _id: globalRowId++,
                Model: entity.Model || 'N/A',
                combinedName: entity.Name,
                Name: entity.Name,
                Description: entity.Description,
                Stereotype: entity.Stereotype,
                _parentEntity: entity,
                _rawAttribute: null
            });
        } else {
            attributes.forEach(attr => {
                // Handle STSP display logic
                let stspDisplay = attr.STSP;
                if (stspDisplay === true || stspDisplay === 'Standard') {
                    stspDisplay = 'Standard';
                } else {
                    stspDisplay = attr.STSP;
                }

                flatList.push({
                    _id: globalRowId++,
                    Model: entity.Model || 'N/A',
                    combinedName: `${entity.Name}.${attr.Name}`,
                    Name: attr.Name,
                    Datatype: attr.Datatype,
                    Description: attr.Description,
                    FrName: attr.FrName,
                    FrDescription: attr.FrDescription,
                    Primary: attr.Primary,
                    Mandatory: attr.Mandatory,
                    Identifier: attr.Identifier,
                    Mapping: attr.Mapping,
                    Screen: attr.Screen,
                    STSP: stspDisplay,
                    TTS: attr.TTS,
                    Domain: attr.Domain,
                    Creation_date: attr.Creation_date.split(" ")[0],
                    Modification_date: attr.Modification_date.split(" ")[0],
                    Creator: attr.Creator,
                    Modifier: attr.Modifier,
                    _parentEntity: entity,
                    _rawAttribute: attr
                });
            });
        }
    });
    console.log("CDM Data Processed");
    return flatList;
}

/**************************************************
 * Processes raw PDM tables into flat column list *
 **************************************************/
 
function processPDMData(sourceTables) {
    const flatList = [];
    let globalRowId = 0;

    sourceTables.forEach(table => {
        const columns = Array.isArray(table.Columns) ? table.Columns : [];

        if (columns.length === 0) {
            // Create row for tables without columns
            flatList.push({
                _id: globalRowId++,
                Model: table.Model || 'N/A',
                combinedName: table.Name,
                Name: table.Name,
                Code: table.Code,
                Comment: table.Comment,
                Stereotype: table.Stereotype,
                Identifier: table.Identifier,
                Shareable_link: table.Shareable_link,
                Creation_date: table.Creation_date,
                Modification_date: table.Modification_date,
                Creator: table.Creator,
                Modifier: table.Modifier,
                Diagrams: table.Diagrams,
                _parentTable: table,
                _rawColumn: null
            });
        } else {
            columns.forEach(col => {
                flatList.push({
                    _id: globalRowId++,
                    Model: table.Model || 'N/A',
                    combinedName: `${table.Name}.${col.Name}`,
                    combinedCode: `${table.Code}.${col.Code}`,
                    Name: col.Name,
                    Code: col.Code,
                    Datatype: col.Datatype,
                    Description: col.Description,
                    Comment: col.Comment,
                    Mandatory: col.Mandatory,
                    Primary: col.Primary,
                    Unique: col.AK,
                    Foreign: col.FK,
                    Index: col.Index,
                    Sequence: col.Sequence,
                    Identifier: col.Identifier,
                    Creation_date: col.Creation_date.split(" ")[0],
                    Modification_date: col.Modification_date.split(" ")[0],
                    Creator: col.Creator,
                    Modifier: col.Modifier,
                    _parentTable: table,
                    _rawColumn: col
                });
            });
        }
    });
    console.log("PDM Data Processed");
    return flatList;
}

/**************************************
 * Switches between CDM and PDM modes *
 **************************************/
 
function setMode(newMode, animate = true) {
    const isFirstInit = !state.columns || state.columns.length === 0;
    if (!isFirstInit && state.mode === newMode) return;
    
    state.mode = newMode;
    state.columns = state.mode === 'CDM' ? state.cdmColumns : state.pdmColumns;

    // Apply persisted order & widths for this mode
    const key = (state.mode === 'CDM') ? 'cdm' : 'pdm';
    const st = state.settings[key] || {};
    if (Array.isArray(st.columnOrder) && st.columnOrder.length) {
        const byId = new Map(state.columns.map(c => [c.id, c]));
        state.columns = st.columnOrder.map(id => byId.get(id)).filter(Boolean);
        // add any missing (new) columns at the end
        state.columns.push(...Array.from(byId.values()).filter(c => !st.columnOrder.includes(c.id)));
    }
    if (st.columnWidths) {
        state.columns.forEach(c => { 
                if (st.columnWidths[c.id]) {
                    c.width = st.columnWidths[c.id];  
                }
            }
        )
    }
    if (Array.isArray(st.defaultColumns) && st.defaultColumns.length) {
        state.columns.forEach(c => { c.visible = st.defaultColumns.includes(c.id); });
    }
    const stataMap = document.getElementById("mappingStatsBtn");
    if (state.mode === 'CDM') {
        console.log("SetMode CDM");
        state.allData = processCDMData(state.cdmData);
        updateModeSwitcherUI('CDM', 'Entities', 'fa-sitemap', 'cdm'); 
        els.modeTag.textContent = 'CDM';
        let tabEntTab = document.getElementById("tabEntTab");
        let tabAttCol = document.getElementById("tabAttCol");
        tabEntTab.innerHTML = "Entity Details";
        tabAttCol.innerHTML = "Attribute Details";
        stataMap.style.visibility = "visible";

    } else {
        console.log("SetMode PDM");
        state.allData = processPDMData(state.pdmData); 
        updateModeSwitcherUI('PDM', 'Tables', 'fa-table', 'pdm');
        els.modeTag.textContent = 'PDM';
        let tabEntTab = document.getElementById("tabEntTab");
        let tabAttCol = document.getElementById("tabAttCol");
        tabEntTab.innerHTML = "Table Details";
        tabAttCol.innerHTML = "Column Details";
        stataMap.style.visibility = "hidden";
    }
    console.log("Initializing ...");
    // reset view and render
    state.viewData = [...state.allData];
    // Apply left panel model filter (if any models are selected in settings)
    if (typeof applyLeftPanelModelFilter === 'function') applyLeftPanelModelFilter();
    state.filterText = '';
    state.selectedRowIndex = -1;
    state.selectedRowIndexes = [];
    state.lastClickedIndex = -1;
    state.sortCol = null;
    state.sortAsc = true;
    els.searchInput.value = '';
    
    closeSidebar(); // call from Helper.js file
    updateCounter(); // call from Grid.js file
    renderHeaders(); // call from Grid.js file
    updateGridMetrics(); // call from Grid.js file
    renderVirtualRows(); // call from Grid.js file
    updateLeftPanelOnModeChange(); // call from LeftPanel.js file

    if (animate) {
        document.body.classList.add('mode-transition');
        setTimeout(() => document.body.classList.remove('mode-transition'), 400);
    }
    showToast(`Switched to ${state.mode} mode`, 'info');
    saveSettings();
}
 
/********************************
 * Main initialization function *
 ********************************/
 
function init() {    
    // Track data processing time separately
    const dataProcessingStart = Date.now();
    
    // Show loading progress
    const loadingOverlay = document.getElementById('loadingOverlay');
    const progressBar = document.createElement('div');
    progressBar.className = 'loading-progress';
    progressBar.innerHTML = `
        <div class="progress-text">Loading data...</div>
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
    `;
    loadingOverlay.appendChild(progressBar);
    
    // Load settings first
    loadSettings();
    
    // Track CDM data processing
    console.time('CDM Data Processing');
    const cdmData = getCDMDataSource();
    state.cdmData = cdmData.slice ? cdmData.slice() : [];
    console.timeEnd('CDM Data Processing');
    
    // Track PDM data processing  
    console.time('PDM Data Processing');
    const pdmData = getPDMDataSource();
    state.pdmData = pdmData.slice ? pdmData.slice() : [];
    console.timeEnd('PDM Data Processing');
    
    const dataProcessingTime = Date.now() - dataProcessingStart;
    console.log(`Total data processing time: ${dataProcessingTime}ms`);
    
    // Show warning if data processing took too long
    if (dataProcessingTime > 3000) { // 3 seconds threshold
        console.warn(`Data processing took ${dataProcessingTime}ms - consider performance optimization`);
        
        // Dispatch event for LoadTimer to show warning if needed
        if (dataProcessingTime > 5000) {
            document.dispatchEvent(new CustomEvent('longDataProcessing', { 
                detail: { processingTime: dataProcessingTime } 
            }));
        }
    }
    
    // Set initial mode
    setMode(state.mode, true);
    
    // Apply theme
    document.body.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
    
    // Initialize UI components
    document.getElementById('rowHeightSlider').value = state.rowHeight;
    document.getElementById('rowHeightVal').textContent = state.rowHeight + 'px';
    
    // Try to setup event listeners
    if (typeof setupEventListeners === 'function') {
        setupEventListeners();
    } else {
        console.warn('setupEventListeners function not found');
        setTimeout(() => {
            if (typeof setupEventListeners === 'function') {
                setupEventListeners();
            }
        }, 1000);
    }
    
    // Setup other components
    if (typeof setupSidebarResizer === 'function') setupSidebarResizer();
    if (typeof setupKeyboardShortcuts === 'function') setupKeyboardShortcuts();
    if (typeof setupLeftPanelResizer === 'function') setupLeftPanelResizer();
    if (typeof setupLeftPanelFilter === 'function') setupLeftPanelFilter();

    // Hide loading overlay
    setTimeout(() => {
        els.loadingOverlay.classList.add('hidden');
        setTimeout(() => {
            els.loadingOverlay.style.display = 'none';
            
            // Mark application as fully loaded
            const totalInitTime = Date.now() - dataProcessingStart;
            console.log(`Application fully initialized in ${totalInitTime}ms`);
            loadingTime.innerHTML = `Loaded in ${totalInitTime/1000} s`;
            // Notify LoadTimer that app is ready
            if (window.loadTimer && window.loadTimer.markAsLoaded) {
                window.loadTimer.markAsLoaded();
            }
            
            // Also dispatch event for any other listeners
            document.dispatchEvent(new Event('appInitialized'));
            
        }, 500);
    }, Math.max(1000, Math.min(dataProcessingTime, 3000))); // Show loading for at least 1 second

    showToast('Application loaded successfully', 'success');
    console.timeEnd('Total Initialization');
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
let tg = null;
let tgLS = null;
let tt = null;
const tooltip = document.getElementById('tooltip');

document.addEventListener('mousemove', (e) => {
    let target = e.target.closest('[title]');
    if(target) {
        tg = target;
        tt = target.getAttribute('title');
        localStorage.setItem("title", tt);
        tgLS = localStorage.getItem("title");
        tooltip.style.color = state.settings.appearance.txtttcolor;
        tooltip.style.backgroundColor = state.settings.appearance.bgttcolor;
        tooltip.textContent = tt;
        tooltip.style.left = (e.pageX + 15) + 'px';
        tooltip.style.top = (e.pageY + 15) + 'px';  
        tooltip.style.opacity = '1';
        tooltip.classList.add('visible');
        tooltip.classList.add('tooltip-template1');
        target.removeAttribute('title');
    }
});
    document.addEventListener('mouseout', (e) => {
    tooltip.style.opacity = '0';
    tooltip.classList.remove('visible');
    tgLS = localStorage.getItem("title");
    if(tgLS){
        tg.setAttribute('title', tgLS);
    }
});