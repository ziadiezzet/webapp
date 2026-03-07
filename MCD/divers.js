
// ==================================================================
// MODULE: HELPER FUNCTIONS
// ==================================================================

// --- helper: compute intersection point with node rectangle edge ---
function rectEdgePoint(center, toward, halfW, halfH) {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  if (dx === 0 && dy === 0) return { x: center.x, y: center.y };
  const tx = halfW / Math.abs(dx || 1e-6);
  const ty = halfH / Math.abs(dy || 1e-6);
  const t  = Math.min(tx, ty);
  return { x: center.x + dx * t, y: center.y + dy * t };
}

// --- helper: small perpendicular offset for label legibility ---
function perpOffset(x1, y1, x2, y2, d = 10) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;  // unit normal
  return { x: nx * d, y: ny * d };
}

// Colors from stereotype class to CSS var — ensure CSS defines these variables
function fillColorForClass(stClass) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--${stClass}`) || 'var(--bg-primary)';
}

/** Ripple (unchanged) */
function createRipple(event) {
  const button = event.currentTarget;
  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
  circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
  circle.classList.add("ripple");
  const ripple = button.getElementsByClassName("ripple")[0];
  if (ripple) ripple.remove();
  button.appendChild(circle);
}

/*****************************
  Keyboard Shortcut Helper  *
******************************/

// Parse shortcut string (e.g., "Ctrl+Shift+S") into event properties
function parseShortcut(shortcut) {
    if (!shortcut) return null;
    
    const parts = shortcut.toLowerCase().split('+').map(p => p.trim());
    const result = {
        ctrl: parts.includes('ctrl') || parts.includes('control'),
        shift: parts.includes('shift'),
        alt: parts.includes('alt') || parts.includes('option'),
        meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
        key: parts.find(p => !['ctrl', 'control', 'shift', 'alt', 'option', 'meta', 'cmd', 'command'].includes(p))
    };
    
    // Convert special keys
    if (result.key) {
        switch (result.key) {
            case 'enter': result.key = 'Enter'; break;
            case 'escape': result.key = 'Escape'; break;
            case 'tab': result.key = 'Tab'; break;
            case 'space': result.key = ' '; break;
            case 'arrowup': result.key = 'ArrowUp'; break;
            case 'arrowdown': result.key = 'ArrowDown'; break;
            case 'arrowleft': result.key = 'ArrowLeft'; break;
            case 'arrowright': result.key = 'ArrowRight'; break;
            case 'f1': result.key = 'F1'; break;
            case 'f2': result.key = 'F2'; break;
            case 'f3': result.key = 'F3'; break;
            case 'f4': result.key = 'F4'; break;
            case 'f5': result.key = 'F5'; break;
            case 'f6': result.key = 'F6'; break;
            case 'f7': result.key = 'F7'; break;
            case 'f8': result.key = 'F8'; break;
            case 'f9': result.key = 'F9'; break;
            case 'f10': result.key = 'F10'; break;
            case 'f11': result.key = 'F11'; break;
            case 'f12': result.key = 'F12'; break;
            case 'plus': result.key = '+'; break;
            case 'minus': result.key = '-'; break;
            case 'slash': result.key = '/'; break;
            case 'period': result.key = '.'; break;
            case 'comma': result.key = ','; break;
            case 'backspace': result.key = 'Backspace'; break;
            case 'delete': result.key = 'Delete'; break;
            case 'insert': result.key = 'Insert'; break;
            case 'home': result.key = 'Home'; break;
            case 'end': result.key = 'End'; break;
            case 'pageup': result.key = 'PageUp'; break;
            case 'pagedown': result.key = 'PageDown'; break;
            default: 
                if (result.key.length === 1) result.key = result.key.toUpperCase();
                break;
        }
    }
    
    return result;
}

// Check if event matches shortcut
function matchesShortcut(event, shortcutString) {
    const shortcut = parseShortcut(shortcutString);
    if (!shortcut || !shortcut.key) return false;
    
    const eventKey = event.key.length === 1 ? event.key.toUpperCase() : event.key;
    
    return (shortcut.ctrl === (event.ctrlKey || event.metaKey)) &&
           (shortcut.shift === event.shiftKey) &&
           (shortcut.alt === event.altKey) &&
           (shortcut.meta === event.metaKey) &&
           (eventKey === shortcut.key);
}

// Format shortcut for display
function formatShortcut(shortcut) {
    if (!shortcut) return '';
    
    const parts = shortcut.split('+').map(p => {
        const trimmed = p.trim();
        switch(trimmed.toLowerCase()) {
            case 'ctrl': return 'Ctrl';
            case 'shift': return 'Shift';
            case 'alt': return 'Alt';
            case 'meta': return 'Cmd';
            case 'cmd': return 'Cmd';
            case 'command': return 'Cmd';
            case 'enter': return 'Enter';
            case 'escape': return 'Esc';
            case 'tab': return 'Tab';
            case 'space': return 'Space';
            case 'arrowup': return '↑';
            case 'arrowdown': return '↓';
            case 'arrowleft': return '←';
            case 'arrowright': return '→';
            case 'plus': return '+';
            case 'minus': return '-';
            case 'slash': return '/';
            case 'period': return '.';
            case 'comma': return ',';
            default: 
                if (trimmed.length === 1) return trimmed.toUpperCase();
                return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        }
    });
    
    return parts.join('+');
}

// Get keyboard shortcut icon
function getShortcutIcon(action) {
    const iconMap = {
        'focus-search': 'fa-search',
        'toggle-left-panel': 'fa-sitemap',
        'toggle-sidebar': 'fa-chevron-right',
        'toggle-theme': 'fa-moon',
        'toggle-fullscreen': 'fa-expand',
        'export-data': 'fa-download',
        'copy-selected': 'fa-copy',
        'show-settings': 'fa-cog',
        'show-help': 'fa-question-circle',
        'show-diagram': 'fa-diagram-project',
        'zoom-in': 'fa-search-plus',
        'zoom-out': 'fa-search-minus',
        'zoom-reset': 'fa-search',
        'zoom-fit': 'fa-compress',
        'navigate-up': 'fa-arrow-up',
        'navigate-down': 'fa-arrow-down',
        'navigate-left': 'fa-arrow-left',
        'navigate-right': 'fa-arrow-right',
        'select-all': 'fa-check-double',
        'deselect-all': 'fa-times-circle',
        'refresh': 'fa-sync-alt',
        'save': 'fa-save',
        'undo': 'fa-undo',
        'redo': 'fa-redo',
        'print': 'fa-print',
        'find': 'fa-search',
        'replace': 'fa-exchange-alt',
        'new': 'fa-plus-circle',
        'open': 'fa-folder-open',
        'close': 'fa-times'
    };
    
    return iconMap[action] || 'fa-keyboard';
}

// Helper functions
function updateIconColorText() {
    const colorInput = document.getElementById('setting-iconCustomColor');
    const textInput = document.getElementById('setting-iconCustomColorText');
    if (colorInput && textInput) {
        textInput.value = colorInput.value;
    }
}

function updateButtonIconSizeDisplay() {
    const slider = document.getElementById('setting-buttonIconSize');
    const display = document.getElementById('buttonIconSizeDisplay');
    if (slider && display) display.textContent = `${slider.value}px`;
}

function updateToolbarIconSizeDisplay() {
    const slider = document.getElementById('setting-toolbarIconSize');
    const display = document.getElementById('toolbarIconSizeDisplay');
    if (slider && display) display.textContent = `${slider.value}px`;
}

/**
 * Helper function to update toast color text inputs
 */
function updateToastColorText(type) {
    const colorInput = document.getElementById(`setting-toast${type.charAt(0).toUpperCase() + type.slice(1)}Color`);
    const textInput = document.getElementById(`setting-toast${type.charAt(0).toUpperCase() + type.slice(1)}ColorText`);
    if (colorInput && textInput) {
        textInput.value = colorInput.value;
    }
}

// Add this helper function at the top of Settings.js:
function getElementSafe(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with id "${id}" not found`);
    }
    return element;
}

/**
 * Formats cardinality for display (e.g., "(0,N)")
 */
function formatCardinalityDisplay(cardinality) {
    if (!cardinality) return '';
    const { min, max } = parseCardinalityString(cardinality);
    return `(${min},${max})`;
}

/**
 * Apply ALL settings from state to the UI
 */
function applyAllSettingsFromState() {
    
    // Apply theme first
    applyThemeFromState();
    
    // Apply general settings
    applyGeneralSettingsFromState();
    
    // Apply appearance settings
    applyAppearanceSettingsFromState();
    
    // Apply accessibility settings
    applyAccessibilitySettingsFromState();
    
    // Apply behavior settings
    applyBehaviorSettingsFromState();
    
    // Apply icon settings
    applyIconSettingsFromState();
    
    // Apply left panel settings
    applyLeftPanelSettingsFromState();
    
    // Apply diagram settings
    applyDiagramSettingsFromState();
    
    // Apply shortcut settings
    applyShortcutSettingsFromState();
    
    // Apply mode-specific settings
    if (state.mode === 'CDM') {
        applyCDMSettingsFromState();
    } else {
        applyPDMSettingsFromState();
    }
}

/**
 * Apply theme from state settings
 */
function applyThemeFromState() {
    const settings = state.settings.general || {};
    
    if (settings.theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        state.darkMode = prefersDark;
    } else {
        state.darkMode = settings.theme === 'dark';
    }
    
    document.body.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
}

/**
 * Apply general settings from state
 */
function applyGeneralSettingsFromState() {
    const settings = state.settings.general || {};
    
    // Apply sidebar width
    if (settings.sidebarWidth) {
        document.documentElement.style.setProperty('--sidebar-width', `${settings.sidebarWidth}px`);
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.style.width = `${settings.sidebarWidth}px`;
    }
    
    // Apply row height
    if (settings.rowHeight) {
        state.rowHeight = settings.rowHeight;
        document.documentElement.style.setProperty('--row-height', `${settings.rowHeight}px`);
    }
    
    // Apply font size
    const fontSizeMap = { 
        xsmall: '10px', small: '12px', medium: '14px', large: '16px', xlarge: '18px' 
    };
    if (settings.fontSize) {
        document.documentElement.style.setProperty('--font-size-medium', fontSizeMap[settings.fontSize] || '14px');
    }
    
    // Apply left panel state
    if (settings.leftPanelOpen !== undefined) {
        const leftPanel = document.getElementById('leftPanel');
        if (leftPanel) {
            if (settings.leftPanelOpen) {
                openLeftPanel();
            } else {
                closeLeftPanel();
            }
        }
    }
    
    // Apply sidebar default state
    if (settings.sidebarDefaultOpen !== undefined) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && settings.sidebarDefaultOpen) {
            openSidebar();
        }
    }
}

/**
 * Apply appearance settings from state
 */
function applyAppearanceSettingsFromState() {
    const settings = state.settings.appearance || {};
    const root = document.documentElement;
    
    // Apply colors
    if (settings.accentColor) root.style.setProperty('--accent', settings.accentColor);
    if (settings.accentColorCDM) root.style.setProperty('--accent-cdm', settings.accentColorCDM);
    if (settings.accentColorPDM) root.style.setProperty('--accent-pdm', settings.accentColorPDM);
    if (settings.bgPrimary) root.style.setProperty('--bg-primary', settings.bgPrimary);
    if (settings.bgSecondary) root.style.setProperty('--bg-secondary', settings.bgSecondary);
    if (settings.textPrimary) root.style.setProperty('--text-primary', settings.textPrimary);
    if (settings.borderColor) root.style.setProperty('--border', settings.borderColor);
    if (settings.rowHoverColor) root.style.setProperty('--row-hover-color', settings.rowHoverColor);
    if (settings.selectedRowColor) root.style.setProperty('--selected-row-color', settings.selectedRowColor);
    
    // Apply dimensions
    if (settings.headerHeight) root.style.setProperty('--header-height', `${settings.headerHeight}px`);
    if (settings.borderRadius) root.style.setProperty('--border-radius', `${settings.borderRadius}px`);
    if (settings.gridLineWidth) {
        document.querySelectorAll('.grid-cell, .header-cell').forEach(cell => {
            cell.style.borderRightWidth = `${settings.gridLineWidth}px`;
            cell.style.borderBottomWidth = `${settings.gridLineWidth}px`;
        });
    }
    
    // Apply typography
    if (settings.fontFamily) {
        root.style.setProperty('--font-family', settings.fontFamily);
        document.body.style.fontFamily = settings.fontFamily;
    }
    if (settings.headerFontWeight) root.style.setProperty('--header-font-weight', settings.headerFontWeight);
    if (settings.fontSizeScale) root.style.setProperty('--font-size-scale', `${settings.fontSizeScale}%`);
    
    // Apply visual effects
    if (settings.showRowNumbers !== undefined) {
        // Update grid to show/hide row numbers
    }
}

/**
 * Apply accessibility settings from state
 */
function applyAccessibilitySettingsFromState() {
    const settings = state.settings.accessibility || {};
    const body = document.body;
    
    if (settings.reducedMotion) {
        body.classList.add('reduced-motion');
    } else {
        body.classList.remove('reduced-motion');
    }
    
    if (settings.highContrast) {
        body.classList.add('high-contrast');
    } else {
        body.classList.remove('high-contrast');
    }
    
    if (settings.fontSizeMultiplier) {
        document.documentElement.style.setProperty('--font-size-multiplier', `${settings.fontSizeMultiplier}%`);
    }
    
    if (settings.lineHeight) {
        document.documentElement.style.setProperty('--line-height', settings.lineHeight);
    }
}

/**
 * Apply behavior settings from state
 */
function applyBehaviorSettingsFromState() {
    const settings = state.settings.behavior || {};
    const root = document.documentElement;
    
    // Apply toast colors as CSS variables
    if (settings.toastSuccessColor) root.style.setProperty('--toast-success-color', settings.toastSuccessColor);
    if (settings.toastErrorColor) root.style.setProperty('--toast-error-color', settings.toastErrorColor);
    if (settings.toastWarningColor) root.style.setProperty('--toast-warning-color', settings.toastWarningColor);
    if (settings.toastInfoColor) root.style.setProperty('--toast-info-color', settings.toastInfoColor);
    if (settings.toastTextColor) root.style.setProperty('--toast-text-color', settings.toastTextColor);
    if (settings.toastBorderColor) root.style.setProperty('--toast-border-color', settings.toastBorderColor);
    if (settings.toastShadow) root.style.setProperty('--toast-shadow', settings.toastShadow);
    
    // Apply toast position
    const toastContainer = document.getElementById('toastContainer');
    if (toastContainer && settings.toastPosition) {
        toastContainer.className = 'toast-container';
        toastContainer.classList.add(`toast-${settings.toastPosition}`);
    }
}

/**
 * Apply icon settings from state
 */
function applyIconSettingsFromState() {
    const settings = state.settings.icons || {};
    
    if (settings.iconSet) {
        loadIconSet(settings.iconSet);
    }
    
    if (settings.iconColorSource === 'custom' && settings.iconCustomColor) {
        document.documentElement.style.setProperty('--icon-color', settings.iconCustomColor);
    }
    
    if (settings.buttonIconSize) {
        document.documentElement.style.setProperty('--button-icon-size', `${settings.buttonIconSize}px`);
    }
    
    if (settings.toolbarIconSize) {
        document.documentElement.style.setProperty('--toolbar-icon-size', `${settings.toolbarIconSize}px`);
    }
}

/**
 * Apply shortcut settings from state
 */
function applyShortcutSettingsFromState() {
    // This sets up the global keyboard shortcut handler
    document.removeEventListener('keydown', handleGlobalKeyboardShortcut);
    document.addEventListener('keydown', handleGlobalKeyboardShortcut);
}

/**
 * Apply diagram settings from state
 */
function applyDiagramSettingsFromState() {
    // Settings are applied when diagram is opened via event listener
    document.dispatchEvent(new CustomEvent('diagramSettingsChanged', {
        detail: { settings: state.settings.diagram || {} }
    }));
}