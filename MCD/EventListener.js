/**
 * Sets up all application event listeners
 */
function setupEventListeners() {
    // Scroll Sync
    els.gridViewport.addEventListener('scroll', () => {
        state.scrollTop = els.gridViewport.scrollTop;
        els.gridHeader.scrollLeft = els.gridViewport.scrollLeft;
        requestAnimationFrame(renderVirtualRows);
    });

    // Setup Search and Autocomplete
    setupAutocompleteListeners();

    // Row Height Slider
    const slider = document.getElementById('rowHeightSlider');
    slider.addEventListener('input', (e) => {
        state.rowHeight = parseInt(e.target.value);
        document.getElementById('rowHeightVal').textContent = state.rowHeight + 'px';
        updateGridMetrics();
        renderVirtualRows();
    });

    // Mode Switcher
    els.modeSwitcher.addEventListener('click', (e) => {
        createRipple(e);
        const newMode = state.mode === 'CDM' ? 'PDM' : 'CDM';
        setMode(newMode);
    });

    // Buttons
    document.getElementById('btnTheme').addEventListener('click', toggleTheme);
    document.getElementById('btnCols').addEventListener('click', (e) => { e.stopPropagation(); toggleColMenu(); });
    document.getElementById('btnCopy').addEventListener('click', (e) => { e.stopPropagation(); toggleCopyMenu(e.currentTarget); });
    document.getElementById('btnSettings').addEventListener('click', showSettingsModal);
    document.getElementById('btnHelp').addEventListener('click', showHelpModal);
    document.getElementById('sidebarClose').onclick = closeSidebar;

    
    // Left Panel Toggle Button
    const toggleLeftPanelBtn = document.getElementById('toggleLeftPanelBtn');
    if (toggleLeftPanelBtn) {
        toggleLeftPanelBtn.addEventListener('click', toggleLeftPanel);
    }
    
    // Left Panel Close Button
    const leftPanelClose = document.getElementById('leftPanelClose');
    if (leftPanelClose) {
        leftPanelClose.addEventListener('click', closeLeftPanel);
    }
    
    // Tab switching
    document.querySelectorAll('.tab').forEach(t => {
        t.onclick = () => {
            document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            if(state.activeRowData) renderSidebarContent(state.activeRowData, t.dataset.tab);
        }
    });

    // Fullscreen
    document.getElementById('btnFullscreen').addEventListener('click', toggleFullscreen);

    // Copy Menu Actions
    els.copyMenu.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        if (action === 'copy-csv') copyVisibleAs(',', true);
        else if (action === 'copy-selected-csv') copySelectedAs(',', true);
        else if (action === 'copy-html') copyVisibleAsHTML();
        else if (action === 'copy-selected-html') copySelectedAsHTML();
        els.copyMenu.style.display = 'none';
    });

    // Export Button - FIXED to always export displayed rows
    document.getElementById('btnExport').addEventListener('click', (e) => {
        e.stopPropagation();
        // Always export the current viewData (filtered and sorted rows)
        downloadCSV(state.viewData, ',');
    });

    // Click-away to close menus
    window.addEventListener('click', () => {
        els.colMenu.style.display = 'none';
        els.copyMenu.style.display = 'none';
    });
    els.copyMenu.addEventListener('click', (ev) => ev.stopPropagation());
    els.colMenu.addEventListener('click', (ev) => ev.stopPropagation());

    // Setup panel resizers
    setupLeftPanelResizer();
    setupSidebarResizer();
}



/**
 * Bind all events inside the Settings modal/tabs.
 * This function is idempotent and can be called each time the modal is (re)rendered.
 * It preserves existing behavior and wires new Diagram styling & zoom controls.
 */
function setupSettingsEventListeners() {
    // First, ensure settings tabs are properly initialized
    initializeSettingsTabs();
    
    // Then set up all the event listeners
    setupAllSettingsEventListeners();
}

/**
 * Initialize settings tab switching
 */
function initializeSettingsTabs() {
    // --- Settings Tab Switching ---
    const settingsTabs = document.querySelectorAll('.settings-tab');
    if (settingsTabs.length) {
        settingsTabs.forEach(tab => {
            // Remove any existing listeners to avoid duplicates
            tab.removeEventListener('click', handleSettingsTabClick);
            tab.addEventListener('click', handleSettingsTabClick);
        });
    }
}

/**
 * Handle settings tab click
 */
function handleSettingsTabClick(e) {
    const tab = e.currentTarget;
    
    // Remove active class from all settings tabs
    document.querySelectorAll('.settings-tab').forEach(t => {
        t.classList.remove('active');
    });
    
    // Add active class to the clicked tab
    tab.classList.add('active');
    
    // Hide all settings tab contents
    document.querySelectorAll('.settings-tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Show the corresponding tab content
    const tabId = tab.getAttribute('data-tab');
    const correspondingContent = document.getElementById(`settings-tab-${tabId}`);
    if (correspondingContent) {
        correspondingContent.style.display = 'block';
        
        // Dispatch custom event for tab change (if needed by other parts of the app)
        document.dispatchEvent(new CustomEvent('settingsTabChanged', { 
            detail: { tabId: tabId }
        }));
    }
}

/**
 * Set up all individual settings event listeners
 */
function setupAllSettingsEventListeners() {
    // --- General tab
    const btnApplyGeneral = document.getElementById('btnApplyGeneral');
    if (btnApplyGeneral) {
        btnApplyGeneral.removeEventListener('click', applyGeneralSettings);
        btnApplyGeneral.addEventListener('click', applyGeneralSettings);
    }

    // --- CDM tab
    const btnApplyCDM = document.getElementById('btnApplyCDM');
    if (btnApplyCDM) {
        btnApplyCDM.removeEventListener('click', applyCDMSettings);
        btnApplyCDM.addEventListener('click', applyCDMSettings);
    }

    // --- PDM tab
    const btnApplyPDM = document.getElementById('btnApplyPDM');
    if (btnApplyPDM) {
        btnApplyPDM.removeEventListener('click', applyPDMSettings);
        btnApplyPDM.addEventListener('click', applyPDMSettings);
    }

    // --- Appearance tab
    const btnApplyAppearance = document.getElementById('btnApplyAppearance');
    if (btnApplyAppearance) {
        btnApplyAppearance.removeEventListener('click', applyAppearanceSettings);
        btnApplyAppearance.addEventListener('click', applyAppearanceSettings);
    }

    // --- Diagram tab
    const btnApplyDiagram = document.getElementById('btnApplyDiagram');
    if (btnApplyDiagram) {
        btnApplyDiagram.removeEventListener('click', applyDiagramSettings);
        btnApplyDiagram.addEventListener('click', applyDiagramSettings);
    }
    
    // Also check for the diagram apply button in the settings section
    const btnApplyDiagram2 = document.querySelector('.settings-section .btn.primary[onclick="applyDiagramSettings()"]');
    if (btnApplyDiagram2 && !btnApplyDiagram) {
        btnApplyDiagram2.removeEventListener('click', applyDiagramSettings);
        btnApplyDiagram2.addEventListener('click', (e) => {
            e.preventDefault();
            applyDiagramSettings();
            document.dispatchEvent(new CustomEvent('diagramSettingsChanged', { 
                detail: { settings: state.settings.diagram } 
            }));
        });
    }

    // --- Behavior tab
    const btnApplyBehavior = document.getElementById('btnApplyBehavior');
    if (btnApplyBehavior) {
        btnApplyBehavior.removeEventListener('click', applyBehaviorSettings);
        btnApplyBehavior.addEventListener('click', applyBehaviorSettings);
    }

    // --- Advanced tab
    const btnApplyAdvanced = document.getElementById('btnApplyAdvanced');
    if (btnApplyAdvanced) {
        btnApplyAdvanced.removeEventListener('click', applyAdvancedSettings);
        btnApplyAdvanced.addEventListener('click', applyAdvancedSettings);
    }

    // --- Reset/Export/Import tab
    const btnResetAll = document.getElementById('btnResetAll');
    if (btnResetAll) {
        btnResetAll.removeEventListener('click', resetAllSettings);
        btnResetAll.addEventListener('click', resetAllSettings);
    }

    const btnExport = document.getElementById('btnExportSettings');
    if (btnExport) {
        btnExport.removeEventListener('click', exportSettings);
        btnExport.addEventListener('click', exportSettings);
    }

    const inputImport = document.getElementById('inputImportSettings');
    if (inputImport) {
        inputImport.removeEventListener('change', importSettings);
        inputImport.addEventListener('change', importSettings);
    }

    // --- Left Panel tab
    const btnApplyLeftPanel = document.getElementById('btnApplyLeftPanel');
    if (btnApplyLeftPanel) {
        btnApplyLeftPanel.removeEventListener('click', applyLeftPanelSettings);
        btnApplyLeftPanel.addEventListener('click', applyLeftPanelSettings);
    }

    // ----------------------------------------------------------------
    // Diagram tab — live preview listeners
    // ----------------------------------------------------------------
    setupDiagramLivePreview();

    // ----------------------------------------------------------------
    // Behavior & Advanced tabs — live preview listeners
    // ----------------------------------------------------------------
    setupBehaviorLivePreview();
    setupAdvancedLivePreview();
}

/**
 * Set up diagram controls for live preview
 */
function setupDiagramLivePreview() {
    const diagramInputs = [
        'dg-spacingFactor', 'dg-autoFit', 'dg-boxW', 'dg-boxH', 'dg-minZoom', 'dg-maxZoom',
        'dg-showRel', 'dg-showInh',
        'dg-relColor', 'dg-relWidth', 'dg-relArrowStyle',
        'dg-inhColor', 'dg-inhWidth', 'dg-inhDash',
        'dg-cardTextColor', 'dg-cardFontSize', 'dg-cardMode',
        'dg-endpointStyle', 'dg-endpointSize', 'dg-edgeOpacity',
        'dg-clickZoomMode', 'dg-clickZoomFactor', 'dg-selectPadding',
        'bf-stereo', 'bf-comment', 'bf-keys', 'bf-mapping', 'bf-counts'
    ];

    diagramInputs.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        // Remove any existing listeners
        const eventName = (el.type === 'range' || el.type === 'number' || el.type === 'color') ? 'input' : 'change';
        const oldHandler = el.onDiagramChange;
        if (oldHandler) {
            el.removeEventListener(eventName, oldHandler);
        }

        // Create new handler
        const handler = () => {
            const d = state.settings.diagram || {};
            // Map the control IDs to the matching state properties
            switch (id) {
                case 'dg-spacingFactor':   d.spacingFactor    = Number(el.value || d.spacingFactor || 0.4); break;
                case 'dg-autoFit':         d.autoFitSpacing   = el.checked; break;
                case 'dg-boxW':            d.boxWidth         = Number(el.value || d.boxWidth || 240); break;
                case 'dg-boxH':            d.boxHeight        = Number(el.value || d.boxHeight || 100); break;
                case 'dg-minZoom':         d.minZoom          = Number(el.value || d.minZoom || 0.1); break;
                case 'dg-maxZoom':         d.maxZoom          = Number(el.value || d.maxZoom || 4); break;
                case 'dg-showRel':         d.showRelationships= el.checked; break;
                case 'dg-showInh':         d.showInheritance  = el.checked; break;

                case 'dg-relColor':        d.edgeStyles = d.edgeStyles || {};
                                           d.edgeStyles.relationship = d.edgeStyles.relationship || {};
                                           d.edgeStyles.relationship.color = el.value; break;
                case 'dg-relWidth':        d.edgeStyles = d.edgeStyles || {};
                                           d.edgeStyles.relationship = d.edgeStyles.relationship || {};
                                           d.edgeStyles.relationship.width = Number(el.value || 2); break;
                case 'dg-relArrowStyle':   d.edgeStyles = d.edgeStyles || {};
                                           d.edgeStyles.relationship = d.edgeStyles.relationship || {};
                                           d.edgeStyles.relationship.arrowStyle = el.value; break;

                case 'dg-inhColor':        d.edgeStyles = d.edgeStyles || {};
                                           d.edgeStyles.inheritance = d.edgeStyles.inheritance || {};
                                           d.edgeStyles.inheritance.color = el.value; break;
                case 'dg-inhWidth':        d.edgeStyles = d.edgeStyles || {};
                                           d.edgeStyles.inheritance = d.edgeStyles.inheritance || {};
                                           d.edgeStyles.inheritance.width = Number(el.value || 2); break;
                case 'dg-inhDash':         d.edgeStyles = d.edgeStyles || {};
                                           d.edgeStyles.inheritance = d.edgeStyles.inheritance || {};
                                           d.edgeStyles.inheritance.dash = el.checked; break;

                case 'dg-cardTextColor':   d.edgeStyles = d.edgeStyles || {};
                                           d.edgeStyles.cardinality = d.edgeStyles.cardinality || {};
                                           d.edgeStyles.cardinality.textColor = el.value; break;
                case 'dg-cardFontSize':    d.edgeStyles = d.edgeStyles || {};
                                           d.edgeStyles.cardinality = d.edgeStyles.cardinality || {};
                                           d.edgeStyles.cardinality.fontSize = Number(el.value || 12); break;
                case 'dg-cardMode':        d.edgeStyles = d.edgeStyles || {};
                                           d.edgeStyles.cardinality = d.edgeStyles.cardinality || {};
                                           d.edgeStyles.cardinality.mode = el.value; break;
                case 'dg-endpointStyle':   d.edgeStyles = d.edgeStyles || {};
                                           d.edgeStyles.cardinality = d.edgeStyles.cardinality || {};
                                           d.edgeStyles.cardinality.endpointStyle = el.value; break;
                case 'dg-endpointSize':    d.edgeStyles = d.edgeStyles || {};
                                           d.edgeStyles.cardinality = d.edgeStyles.cardinality || {};
                                           d.edgeStyles.cardinality.endpointSize = Number(el.value || 12); break;
                case 'dg-edgeOpacity':     d.edgeStyles = d.edgeStyles || {};
                                           d.edgeStyles.edgeOpacity = Number(el.value || 1); break;

                case 'dg-clickZoomMode':   d.zoom = d.zoom || {};
                                           d.zoom.clickMode = el.value; break;
                case 'dg-clickZoomFactor': d.zoom = d.zoom || {};
                                           d.zoom.clickFactor = Number(el.value || 1.8); break;
                case 'dg-selectPadding':   d.zoom = d.zoom || {};
                                           d.zoom.selectPadding = Number(el.value || 40); break;

                // Box fields
                case 'bf-stereo':          d.boxFields = d.boxFields || {};
                                           d.boxFields.showStereotype = el.checked; break;
                case 'bf-comment':         d.boxFields = d.boxFields || {};
                                           d.boxFields.showComment = el.checked; break;
                case 'bf-keys':            d.boxFields = d.boxFields || {};
                                           d.boxFields.showKeySummary = el.checked; break;
                case 'bf-mapping':         d.boxFields = d.boxFields || {};
                                           d.boxFields.showMapping = el.checked; break;
                case 'bf-counts':          d.boxFields = d.boxFields || {};
                                           d.boxFields.showCounts = el.checked; break;
            }
            // assign back without persisting; Apply will save and notify open modals
            state.settings.diagram = d;
        };

        // Store handler reference on element for later removal
        el.onDiagramChange = handler;
        el.addEventListener(eventName, handler);
    });
}

/**
 * Set up behavior controls for live preview
 */
function setupBehaviorLivePreview() {
    const behaviorInputs = [
        'keyboardShortcutsEnabled',
        'searchAutoFocus',
        'searchLiveUpdate',
        'selectOnClick',
        'showRowNumbers',
        'smoothScrolling',
        'gridLines',
        'rowHoverHighlight',
        'clickAnimation'
    ];

    behaviorInputs.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        // Remove any existing listeners using the stored handler
        if (el.handleBehaviorChange) {
            el.removeEventListener('change', el.handleBehaviorChange);
        }
        
        // Create new handler
        const handler = () => {
            if (!state.settings.behavior) state.settings.behavior = {};
            const isCheckbox = el.type === 'checkbox';
            state.settings.behavior[id] = isCheckbox ? el.checked : el.value;
        };
        
        // Store handler reference on element for later removal
        el.handleBehaviorChange = handler;
        el.addEventListener('change', handler);
    });
}

/**
 * Set up advanced controls for live preview
 */
/**
 * Set up advanced controls for live preview
 */
function setupAdvancedLivePreview() {
    const advancedInputs = [
        'cacheSize',
        'maxUndoSteps',
        'autoSaveInterval',
        'logLevel',
        'performanceMode',
        'experimentalFeatures',
        'debugMode'
    ];

    advancedInputs.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        // Remove any existing listeners using the stored handler
        if (el.handleAdvancedChange) {
            el.removeEventListener('change', el.handleAdvancedChange);
        }
        
        // Create new handler
        const handler = () => {
            if (!state.settings.advanced) state.settings.advanced = {};
            const isCheckbox = el.type === 'checkbox';
            const isNumber = el.type === 'number' || el.type === 'range';
            state.settings.advanced[id] = isCheckbox ? el.checked : isNumber ? Number(el.value) : el.value;
        };
        
        // Store handler reference on element for later removal
        el.handleAdvancedChange = handler;
        el.addEventListener('change', handler);
    });
}

/**
 * Sets up keyboard shortcuts for application
 */
function setupKeyboardShortcuts() {
    
    // Check if shortcuts are enabled
    const behavior = state.settings.behavior || {};
    if (behavior.keyboardShortcutsEnabled === false) {
        return;
    }
    
    // Remove existing listeners
    document.removeEventListener('keydown', handleGlobalKeyboardShortcut);
    
    // Add new listener
    document.addEventListener('keydown', handleGlobalKeyboardShortcut);
}