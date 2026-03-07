// ==================================================================
// MODULE: SETTINGS MANAGEMENT
// ==================================================================

/**
 * ================================|
 * SETTINGS TABS RENDERING        =|
 * ================================|
 */

/**
 * Enhanced renderBehaviorSettings with toast colors
 */
function renderBehaviorSettings() {
    const behavior = state.settings.behavior || {};
    
    return `
        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-bell"></i>
                Toast Notification Settings
            </div>
            <div class="settings-grid">
                <div class="setting-item">
                    <label class="setting-label">Toast Duration (ms)</label>
                    <div class="setting-description">How long toasts stay visible</div>
                    <div class="setting-control">
                        <input type="range" class="setting-slider" id="setting-toastDuration" 
                               min="1000" max="10000" step="500" value="${behavior.toastDuration || 3500}" 
                               onchange="rangeChange('toastDuration')">
                        <span class="info-badge" id="toastDurationDisplay">${behavior.toastDuration || 3500}ms</span>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Toast Position</label>
                    <div class="setting-description">Where toasts appear on screen</div>
                    <select class="setting-select" id="setting-toastPosition">
                        <option value="top-left" ${behavior.toastPosition === 'top-left' ? 'selected' : ''}>Top Left</option>
                        <option value="top-center" ${behavior.toastPosition === 'top-center' ? 'selected' : ''}>Top Center</option>
                        <option value="top-right" ${behavior.toastPosition === 'top-right' ? 'selected' : ''}>Top Right</option>
                        <option value="bottom-left" ${behavior.toastPosition === 'bottom-left' ? 'selected' : ''}>Bottom Left</option>
                        <option value="bottom-center" ${behavior.toastPosition === 'bottom-center' ? 'selected' : ''}>Bottom Center</option>
                        <option value="bottom-right" ${behavior.toastPosition === 'bottom-right' ? 'selected' : ''}>Bottom Right</option>
                    </select>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Toast Animation</label>
                    <div class="setting-description">Animation style for toasts</div>
                    <select class="setting-select" id="setting-toastAnimation">
                        <option value="fade" ${behavior.toastAnimation === 'fade' ? 'selected' : ''}>Fade</option>
                        <option value="slide" ${behavior.toastAnimation === 'slide' ? 'selected' : ''}>Slide</option>
                        <option value="scale" ${behavior.toastAnimation === 'scale' ? 'selected' : ''}>Scale</option>
                        <option value="none" ${behavior.toastAnimation === 'none' ? 'selected' : ''}>None</option>
                    </select>
                </div>
            </div>
        </div>
        
        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-eye"></i>
                Toast Visibility
            </div>
            <div class="settings-grid">
                <div class="setting-item">
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-showSuccessToasts" ${behavior.showSuccessToasts !== false ? 'checked' : ''}>
                        <label for="setting-showSuccessToasts">Show Success Toasts</label>
                    </div>
                </div>
                <div class="setting-item">
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-showInfoToasts" ${behavior.showInfoToasts !== false ? 'checked' : ''}>
                        <label for="setting-showInfoToasts">Show Info Toasts</label>
                    </div>
                </div>
                <div class="setting-item">
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-showWarningToasts" ${behavior.showWarningToasts !== false ? 'checked' : ''}>
                        <label for="setting-showWarningToasts">Show Warning Toasts</label>
                    </div>
                </div>
                <div class="setting-item">
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-showErrorToasts" ${behavior.showErrorToasts !== false ? 'checked' : ''}>
                        <label for="setting-showErrorToasts">Show Error Toasts</label>
                    </div>
                </div>
                <div class="setting-item">
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-toastSoundEnabled" ${behavior.toastSoundEnabled ? 'checked' : ''}>
                        <label for="setting-toastSoundEnabled">Enable Toast Sounds</label>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-palette"></i>
                Toast Colors
            </div>
            <div class="settings-grid">
                <div class="setting-item">
                    <label class="setting-label">Success Color</label>
                    <div class="setting-description">Background color for success toasts</div>
                    <div class="setting-control">
                        <input type="color" class="setting-color" id="setting-toastSuccessColor" 
                               value="${behavior.toastSuccessColor || '#10b981'}" onchange="updateToastColorText('success')">
                        <input type="text" class="setting-input" id="setting-toastSuccessColorText" 
                               value="${behavior.toastSuccessColor || '#10b981'}" style="width: 100px;">
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Error Color</label>
                    <div class="setting-description">Background color for error toasts</div>
                    <div class="setting-control">
                        <input type="color" class="setting-color" id="setting-toastErrorColor" 
                               value="${behavior.toastErrorColor || '#ef4444'}" onchange="updateToastColorText('error')">
                        <input type="text" class="setting-input" id="setting-toastErrorColorText" 
                               value="${behavior.toastErrorColor || '#ef4444'}" style="width: 100px;">
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Warning Color</label>
                    <div class="setting-description">Background color for warning toasts</div>
                    <div class="setting-control">
                        <input type="color" class="setting-color" id="setting-toastWarningColor" 
                               value="${behavior.toastWarningColor || '#f59e0b'}" onchange="updateToastColorText('warning')">
                        <input type="text" class="setting-input" id="setting-toastWarningColorText" 
                               value="${behavior.toastWarningColor || '#f59e0b'}" style="width: 100px;">
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Info Color</label>
                    <div class="setting-description">Background color for info toasts</div>
                    <div class="setting-control">
                        <input type="color" class="setting-color" id="setting-toastInfoColor" 
                               value="${behavior.toastInfoColor || '#3b82f6'}" onchange="updateToastColorText('info')">
                        <input type="text" class="setting-input" id="setting-toastInfoColorText" 
                               value="${behavior.toastInfoColor || '#3b82f6'}" style="width: 100px;">
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Text Color</label>
                    <div class="setting-description">Text color for all toasts</div>
                    <div class="setting-control">
                        <input type="color" class="setting-color" id="setting-toastTextColor" 
                               value="${behavior.toastTextColor || '#ffffff'}">
                        <input type="text" class="setting-input" id="setting-toastTextColorText" 
                               value="${behavior.toastTextColor || '#ffffff'}" style="width: 100px;">
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Border Color</label>
                    <div class="setting-description">Border color for all toasts</div>
                    <div class="setting-control">
                        <input type="color" class="setting-color" id="setting-toastBorderColor" 
                               value="${behavior.toastBorderColor || 'rgba(255, 255, 255, 0.1)'}">
                        <input type="text" class="setting-input" id="setting-toastBorderColorText" 
                               value="${behavior.toastBorderColor || 'rgba(255, 255, 255, 0.1)'}" style="width: 100px;">
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Toast Shadow</label>
                    <div class="setting-description">Box shadow for toasts</div>
                    <div class="setting-control">
                        <input type="text" class="setting-input" id="setting-toastShadow" 
                               value="${behavior.toastShadow || '0 4px 12px rgba(0, 0, 0, 0.15)'}" style="width: 200px;">
                    </div>
                </div>
            </div>
        </div>
        
        <div class="settings-buttons">
            <button class="setting-btn primary" onclick="applyBehaviorSettings()">Apply Behavior Settings</button>
        </div>
    `;
}

/**
 * Renders the Behavior settings tab content
 */
function renderBehaviorSettingsOriginal() {
    const behavior = state.settings.behavior || {};
    
    return `
        <div class="settings-section">
            <h3>Behavior Settings</h3>
            
            <!-- Toast Settings -->
            <div class="settings-group">
                <h4>Toast Notifications</h4>
                <div class="form-group">
                    <label for="toastDuration">Toast Duration (ms):</label>
                    <input type="number" id="toastDuration" value="${behavior.toastDuration || 3500}" min="1000" max="10000" step="500">
                </div>
                <div class="form-group">
                    <label for="toastPosition">Toast Position:</label>
                    <select id="toastPosition">
                        <option value="top-left" ${behavior.toastPosition === 'top-left' ? 'selected' : ''}>Top Left</option>
                        <option value="top-center" ${behavior.toastPosition === 'top-center' ? 'selected' : ''}>Top Center</option>
                        <option value="top-right" ${behavior.toastPosition === 'top-right' ? 'selected' : ''}>Top Right</option>
                        <option value="bottom-left" ${behavior.toastPosition === 'bottom-left' ? 'selected' : ''}>Bottom Left</option>
                        <option value="bottom-center" ${behavior.toastPosition === 'bottom-center' ? 'selected' : ''}>Bottom Center</option>
                        <option value="bottom-right" ${behavior.toastPosition === 'bottom-right' ? 'selected' : ''}>Bottom Right</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="toastAnimation">Toast Animation:</label>
                    <select id="toastAnimation">
                        <option value="fade" ${behavior.toastAnimation === 'fade' ? 'selected' : ''}>Fade</option>
                        <option value="slide" ${behavior.toastAnimation === 'slide' ? 'selected' : ''}>Slide</option>
                        <option value="scale" ${behavior.toastAnimation === 'scale' ? 'selected' : ''}>Scale</option>
                        <option value="none" ${behavior.toastAnimation === 'none' ? 'selected' : ''}>None</option>
                    </select>
                </div>
            </div>
            
            <!-- Toast Visibility -->
            <div class="settings-group">
                <h4>Toast Visibility</h4>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="showSuccessToasts" ${behavior.showSuccessToasts !== false ? 'checked' : ''}>
                    <label for="showSuccessToasts">Show Success Toasts</label>
                </div>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="showInfoToasts" ${behavior.showInfoToasts !== false ? 'checked' : ''}>
                    <label for="showInfoToasts">Show Info Toasts</label>
                </div>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="showWarningToasts" ${behavior.showWarningToasts !== false ? 'checked' : ''}>
                    <label for="showWarningToasts">Show Warning Toasts</label>
                </div>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="showErrorToasts" ${behavior.showErrorToasts !== false ? 'checked' : ''}>
                    <label for="showErrorToasts">Show Error Toasts</label>
                </div>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="toastSoundEnabled" ${behavior.toastSoundEnabled ? 'checked' : ''}>
                    <label for="toastSoundEnabled">Enable Toast Sounds</label>
                </div>
            </div>
            
            <!-- Keyboard Shortcuts -->
            <div class="settings-group">
                <h4>Keyboard Shortcuts</h4>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="keyboardShortcutsEnabled" ${behavior.keyboardShortcutsEnabled !== false ? 'checked' : ''}>
                    <label for="keyboardShortcutsEnabled">Enable Keyboard Shortcuts</label>
                </div>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="showShortcutHints" ${behavior.showShortcutHints !== false ? 'checked' : ''}>
                    <label for="showShortcutHints">Show Shortcut Hints</label>
                </div>
                <div class="form-group">
                    <label for="shortcutConflict">Shortcut Conflict Handling:</label>
                    <select id="shortcutConflict">
                        <option value="prevent" ${behavior.shortcutConflict === 'prevent' ? 'selected' : ''}>Prevent Default</option>
                        <option value="allow" ${behavior.shortcutConflict === 'allow' ? 'selected' : ''}>Allow Default</option>
                        <option value="warning" ${behavior.shortcutConflict === 'warning' ? 'selected' : ''}>Show Warning</option>
                    </select>
                </div>
            </div>
            
            <!-- Interaction Settings -->
            <div class="settings-group">
                <h4>Interaction Settings</h4>
                <div class="form-group">
                    <label for="doubleClickSpeed">Double-Click Speed (ms):</label>
                    <input type="number" id="doubleClickSpeed" value="${behavior.doubleClickSpeed || 500}" min="100" max="1000" step="100">
                </div>
                <div class="form-group">
                    <label for="tooltipDelay">Tooltip Delay (ms):</label>
                    <input type="number" id="tooltipDelay" value="${behavior.tooltipDelay || 500}" min="0" max="2000" step="100">
                </div>
                <div class="form-group">
                    <label for="confirmTimeout">Confirm Dialog Timeout (s, 0=disabled):</label>
                    <input type="number" id="confirmTimeout" value="${behavior.confirmTimeout || 0}" min="0" max="60" step="1">
                </div>
                <div class="form-group">
                    <label for="autoSaveInterval">Auto-Save Interval (minutes):</label>
                    <input type="number" id="autoSaveInterval" value="${behavior.autoSaveInterval || 5}" min="1" max="60" step="1">
                </div>
            </div>
            
            <!-- Toast Colors -->
            <div class="settings-group">
                <h4>Toast Colors</h4>
                <div class="form-group">
                    <label for="toastSuccessColor">Success Color:</label>
                    <input type="color" id="toastSuccessColor" value="${behavior.toastSuccessColor || '#10b981'}">
                </div>
                <div class="form-group">
                    <label for="toastErrorColor">Error Color:</label>
                    <input type="color" id="toastErrorColor" value="${behavior.toastErrorColor || '#ef4444'}">
                </div>
                <div class="form-group">
                    <label for="toastWarningColor">Warning Color:</label>
                    <input type="color" id="toastWarningColor" value="${behavior.toastWarningColor || '#f59e0b'}">
                </div>
                <div class="form-group">
                    <label for="toastInfoColor">Info Color:</label>
                    <input type="color" id="toastInfoColor" value="${behavior.toastInfoColor || '#3b82f6'}">
                </div>
                <div class="form-group">
                    <label for="toastTextColor">Text Color:</label>
                    <input type="color" id="toastTextColor" value="${behavior.toastTextColor || '#ffffff'}">
                </div>
            </div>
            
            <div class="form-group row">
                <div class="col-12">
                    <button id="btnApplyBehavior" class="btn primary">Apply Behavior Settings</button>
                </div>
            </div>
        </div>
    `;
}


/**
 * Renders accessibility settings tab content
 * @returns {string} HTML content for accessibility settings
 */
function renderAccessibilitySettings() {
    const settings = state.settings.accessibility || {};
    return `
        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-universal-access"></i>
                Accessibility
            </div>
            <div class="settings-grid">
                <div class="setting-item">
                    <label class="setting-label">Reduced Motion</label>
                    <div class="setting-description">Reduce or remove animations</div>
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-reducedMotion" ${settings.reducedMotion ? 'checked' : ''}>
                        <label for="setting-reducedMotion">Reduce motion</label>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">High Contrast Mode</label>
                    <div class="setting-description">Increase contrast for better visibility</div>
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-highContrast" ${settings.highContrast ? 'checked' : ''}>
                        <label for="setting-highContrast">High contrast</label>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Focus Outline</label>
                    <div class="setting-description">Always show focus outlines for keyboard navigation</div>
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-alwaysShowFocus" ${settings.alwaysShowFocus ? 'checked' : ''}>
                        <label for="setting-alwaysShowFocus">Always show focus</label>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Tab Index Order</label>
                    <div class="setting-description">Logical tab order for keyboard navigation</div>
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-logicalTabOrder" ${settings.logicalTabOrder !== false ? 'checked' : ''}>
                        <label for="setting-logicalTabOrder">Logical tab order</label>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Screen Reader Support</label>
                    <div class="setting-description">Enhanced screen reader announcements</div>
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-screenReaderSupport" ${settings.screenReaderSupport ? 'checked' : ''}>
                        <label for="setting-screenReaderSupport">Screen reader support</label>
                    </div>
                </div>
            </div>
        </div>

        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-eye"></i>
                Visual Assistance
            </div>
            <div class="settings-grid">
                <div class="setting-item">
                    <label class="setting-label">Font Size Multiplier</label>
                    <div class="setting-description">Scale text size (100% = normal)</div>
                    <div class="setting-control">
                        <input type="range" class="setting-slider" id="setting-fontSizeMultiplier" min="80" max="200" step="5" value="${settings.fontSizeMultiplier || 100}" onChange="rangeChange('fontSizeMultiplier')">
                        <span class="info-badge" id="fontSizeMultiplierDisplay">${settings.fontSizeMultiplier || 100}%</span>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Line Height</label>
                    <div class="setting-description">Adjust line spacing for readability</div>
                    <div class="setting-control">
                        <input type="range" class="setting-slider" id="setting-lineHeight" min="1" max="2.5" step="0.1" value="${settings.lineHeight || 1.5}" onChange="rangeChange('lineHeight')">
                        <span class="info-badge" id="lineHeightDisplay">${settings.lineHeight || 1.5}</span>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Letter Spacing</label>
                    <div class="setting-description">Increase spacing between letters</div>
                    <div class="setting-control">
                        <input type="range" class="setting-slider" id="setting-letterSpacing" min="-0.05" max="0.2" step="0.01" value="${settings.letterSpacing || 0}" onChange="rangeChange('letterSpacing')">
                        <span class="info-badge" id="letterSpacingDisplay">${settings.letterSpacing || 0}em</span>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Underline Links</label>
                    <div class="setting-description">Always underline clickable elements</div>
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-underlineLinks" ${settings.underlineLinks ? 'checked' : ''}>
                        <label for="setting-underlineLinks">Underline links</label>
                    </div>
                </div>
            </div>
        </div>

        <div class="settings-buttons">
            <button class="setting-btn primary" onclick="applyAccessibilitySettings()">Apply Accessibility Settings</button>
        </div>
    `;
}

/**
 * Renders general settings tab content
 * @returns {string} HTML content for ge@neral settings
 */
function renderGeneralSettings() {
    const settings = state.settings.general;
    return `
        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-display"></i>
                Theme & Display
            </div>
            <div class="settings-grid">
                <div class="setting-item">
                    <label class="setting-label">Theme</label>
                    <div class="setting-description">Choose between light, dark, or auto (system preference)</div>
                    <select class="setting-select" id="setting-theme">
                        <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                        <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                        <option value="auto" ${settings.theme === 'auto' ? 'selected' : ''}>Auto (System)</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Font Size</label>
                    <div class="setting-description">Adjust the base font size</div>
                    <select class="setting-select" id="setting-fontSize">
                        <option value="xsmall" ${settings.fontSize === 'xsmall' ? 'selected' : ''}>xSmall</option>
                        <option value="small" ${settings.fontSize === 'small' ? 'selected' : ''}>Small</option>
                        <option value="medium" ${settings.fontSize === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="large" ${settings.fontSize === 'large' ? 'selected' : ''}>Large</option>
                        <option value="xlarge" ${settings.fontSize === 'xlarge' ? 'selected' : ''}>XLarge</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Row Height</label>
                    <div class="setting-description">Height of grid rows in pixels</div>
                    <div class="setting-control">
                        <input type="range" class="setting-slider" id="setting-rowHeight" min="25" max="80" value="${settings.rowHeight}" onChange="rangeChange('rowHeight')">
                        <span class="info-badge" id="rowHeightDisplay">${settings.rowHeight}px</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-sidebar"></i>
                Sidebar
            </div>
            <div class="settings-grid">
                <div class="setting-item">
                    <label class="setting-label">Sidebar Width</label>
                    <div class="setting-description">Width of the details sidebar in pixels</div>
                    <div class="setting-control">
                        <input type="range" class="setting-slider" id="setting-sidebarWidth" min="300" max="800" value="${settings.sidebarWidth}" onChange="rangeChange('sidebar')">
                        <span class="info-badge" id="sidebarWidthDisplay">${settings.sidebarWidth}px</span>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Default State</label>
                    <div class="setting-description">Whether sidebar should be open by default</div>
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-sidebarDefaultOpen" ${settings.sidebarDefaultOpen ? 'checked' : ''}>
                        <label for="setting-sidebarDefaultOpen">Open sidebar by default</label>
                    </div>
                </div>
                            <div class="setting-item">
                                <label class="setting-label">Sidebar Sections</label>
                                <div class="setting-description">Collapse sidebar sections by default</div>
                                <div class="setting-control">
                                    <input type="checkbox" class="setting-checkbox" id="setting-collapseSidebarSections" ${state.settings.general?.collapseSections ? 'checked' : ''}>
                                    <label for="setting-collapseSidebarSections">Collapse sections by default</label>
                                </div>
                            </div>
            </div>
        </div>

        <div class="settings-buttons">
            <button class="setting-btn" onclick="applyGeneralSettings()">Apply Changes</button>
            <button class="setting-btn primary" onclick="saveAllSettings()">Save All Settings</button>
        </div>
    `;
}

/**
 * Renders CDM settings tab content
 * @returns {string} HTML content for CDM settings
 */
function renderCDMSettings() {
    const settings = state.settings.cdm;
    return `
        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-sitemap"></i>
                CDM Column Configuration
            </div>
            <div class="setting-item">
                <label class="setting-label">Default Visible Columns</label>
                <div class="setting-description">Select which columns should be visible by default in CDM mode</div>
                <div class="column-order-list" id="cdmColumnList">
                    ${state.cdmColumns.map(col => `
                        <div class="column-order-item" data-column-id="${col.id}">
                            <div class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></div>
                            <div class="column-order-name">${col.name}</div>
                            <div class="column-order-visibility">
                                <input type="checkbox" class="setting-checkbox" ${settings.defaultColumns.includes(col.id) ? 'checked' : ''}>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-lock"></i>
                Frozen Columns
            </div>
            <div class="setting-item">
                <label class="setting-label">Frozen Columns</label>
                <div class="setting-description">Columns that stay visible when scrolling horizontally</div>
                <div class="settings-grid">
                    ${state.cdmColumns.map(col => `
                        <div class="setting-item">
                            <div class="setting-control">
                                <input type="checkbox" class="setting-checkbox" id="cdm-frozen-${col.id}" 
                                       ${settings.frozenColumns.includes(col.id) ? 'checked' : ''}>
                                <label for="cdm-frozen-${col.id}">${col.name}</label>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="settings-buttons">
            <button class="setting-btn primary" onclick="applyCDMSettings()">Apply CDM Settings</button>
        </div>
    `;
}

/**
 * Renders PDM settings tab content
 * @returns {string} HTML content for PDM settings
 */
function renderPDMSettings() {
    const settings = state.settings.pdm;
    return `
        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-table"></i>
                PDM Column Configuration
            </div>
            <div class="setting-item">
                <label class="setting-label">Default Visible Columns</label>
                <div class="setting-description">Select which columns should be visible by default in PDM mode</div>
                <div class="column-order-list" id="pdmColumnList">
                    ${state.pdmColumns.map(col => `
                        <div class="column-order-item" data-column-id="${col.id}">
                            <div class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></div>
                            <div class="column-order-name">${col.name}</div>
                            <div class="column-order-visibility">
                                <input type="checkbox" class="setting-checkbox" ${settings.defaultColumns.includes(col.id) ? 'checked' : ''}>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-lock"></i>
                Frozen Columns
            </div>
            <div class="setting-item">
                <label class="setting-label">Frozen Columns</label>
                <div class="setting-description">Columns that stay visible when scrolling horizontally</div>
                <div class="settings-grid">
                    ${state.pdmColumns.map(col => `
                        <div class="setting-item">
                            <div class="setting-control">
                                <input type="checkbox" class="setting-checkbox" id="pdm-frozen-${col.id}" 
                                       ${settings.frozenColumns.includes(col.id) ? 'checked' : ''}>
                                <label for="pdm-frozen-${col.id}">${col.name}</label>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="settings-buttons">
            <button class="setting-btn primary" onclick="applyPDMSettings()">Apply PDM Settings</button>
        </div>
    `;
}

/**
 * Renders appearance settings tab content
 * @returns {string} HTML content for appearance settings
 */
function renderAppearanceSettings() {
    const settings = state.settings.appearance;
    return `
        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-palette"></i>
                Color Scheme
            </div>
            <div class="settings-grid">
                <div class="setting-item">
                    <label class="setting-label">Primary Accent Color</label>
                    <div class="setting-description">Main accent color used throughout the application</div>
                    <div class="setting-control">
                        <span class="color-preview" style="background-color: ${settings.accentColor};"></span>
                        <input type="color" class="setting-color" id="setting-accentColor" value="${settings.accentColor}" onChange="colorChange('primaryAC')">
                        <input type="text" class="setting-input" id="setting-accentColorText" value="${settings.accentColor}" style="width: 100px;">
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">CDM Accent Color</label>
                    <div class="setting-description">Accent color for CDM mode</div>
                    <div class="setting-control">
                        <span class="color-preview" style="background-color: ${settings.accentColorCDM};"></span>
                        <input type="color" class="setting-color" id="setting-accentColorCDM" value="${settings.accentColorCDM}" onChange="colorChange('CCDM')">
                        <input type="text" class="setting-input" id="setting-accentColorCDMText" value="${settings.accentColorCDM}" style="width: 100px;">
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">PDM Accent Color</label>
                    <div class="setting-description">Accent color for PDM mode</div>
                    <div class="setting-control">
                        <span class="color-preview" style="background-color: ${settings.accentColorPDM};"></span>
                        <input type="color" class="setting-color" id="setting-accentColorPDM" value="${settings.accentColorPDM}" onChange="colorChange('CPDM')">
                        <input type="text" class="setting-input" id="setting-accentColorPDMText" value="${settings.accentColorPDM}" style="width: 100px;">
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Background Color</label>
                    <div class="setting-description">Main background color</div>
                    <div class="setting-control">
                        <span class="color-preview" style="background-color: ${settings.bgPrimary};"></span>
                        <input type="color" class="setting-color" id="setting-bgPrimary" value="${settings.bgPrimary}" onChange="colorChange('bgPrimary')">
                        <input type="text" class="setting-input" id="setting-bgPrimaryText" value="${settings.bgPrimary}" style="width: 100px;">
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Secondary Background</label>
                    <div class="setting-description">Secondary background color</div>
                    <div class="setting-control">
                        <span class="color-preview" style="background-color: ${settings.bgSecondary};"></span>
                        <input type="color" class="setting-color" id="setting-bgSecondary" value="${settings.bgSecondary}" onChange="colorChange('bgSecondary')">
                        <input type="text" class="setting-input" id="setting-bgSecondaryText" value="${settings.bgSecondary}" style="width: 100px;">
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Text Color</label>
                    <div class="setting-description">Primary text color</div>
                    <div class="setting-control">
                        <span class="color-preview" style="background-color: ${settings.textPrimary};"></span>
                        <input type="color" class="setting-color" id="setting-textPrimary" value="${settings.textPrimary}" onChange="colorChange('txtPrimary')">
                        <input type="text" class="setting-input" id="setting-textPrimaryText" value="${settings.textPrimary}" style="width: 100px;">
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Tooltip Color</label>
                    <div class="setting-description">Tooltip text color</div>
                    <div class="setting-control">
                        <span class="color-preview" style="background-color: ${settings.txtttcolor};"></span>
                        <input type="color" class="setting-color" id="setting-txtttcolor" value="${settings.txtttcolor}" onChange="colorChange('txtttcolor')">
                        <input type="text" class="setting-input" id="setting-txtttcolortxt" value="${settings.txtttcolor}" style="width: 100px;">
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Tooltip BGColor</label>
                    <div class="setting-description">Tooltip background color</div>
                    <div class="setting-control">
                        <span class="color-preview" style="background-color: ${settings.bgttcolor};"></span>
                        <input type="color" class="setting-color" id="setting-bgttcolor" value="${settings.bgttcolor}" onChange="colorChange('bgttcolor')">
                        <input type="text" class="setting-input" id="setting-bgttcolortxt" value="${settings.bgttcolor}" style="width: 100px;">
                    </div>
                </div>
            </div>
        </div>

        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-border-all"></i>
                Layout & Behavior
            </div>
            <div class="settings-grid">
                <div class="setting-item">
                    <label class="setting-label">Header Height</label>
                    <div class="setting-description">Height of grid header in pixels</div>
                    <div class="setting-control">
                        <input type="range" class="setting-slider" id="setting-headerHeight" min="30" max="60" value="${settings.headerHeight}" onChange="rangeChange('headerHeight')">
                        <span class="info-badge" id="headerHeightDisplay">${settings.headerHeight}px</span>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Row Height</label>
                    <div class="setting-description">Height of grid rows in pixels</div>
                    <div class="setting-control">
                        <input type="range" class="setting-slider" id="setting-rowHeightAppearance" min="25" max="80" value="${settings.rowHeight}" onChange="rangeChange('rowHeightAppearance')">
                        <span class="info-badge" id="rowHeightAppearanceDisplay">${settings.rowHeight}px</span>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Border Radius</label>
                    <div class="setting-description">Border radius for UI elements</div>
                    <div class="setting-control">
                        <input type="range" class="setting-slider" id="setting-borderRadius" min="0" max="12" value="${settings.borderRadius}" onChange="rangeChange('borderRadius')">
                        <span class="info-badge" id="borderRadiusDisplay">${settings.borderRadius}px</span>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Border Color</label>
                    <div class="setting-description">Color for borders and dividers</div>
                    <div class="setting-control">
                        <span class="color-preview" style="background-color: ${settings.borderColor};"></span>
                        <input type="color" class="setting-color" id="setting-borderColor" value="${settings.borderColor}" onChange="colorChange('borderColor')">
                        <input type="text" class="setting-input" id="setting-borderColorText" value="${settings.borderColor}" style="width: 100px;">
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Grid Line Width</label>
                    <div class="setting-description">Width of grid lines in pixels</div>
                    <div class="setting-control">
                        <input type="range" class="setting-slider" id="setting-gridLineWidth" min="1" max="3" step="0.5" value="${settings.gridLineWidth}" onChange="rangeChange('gridLineWidth')">
                        <span class="info-badge" id="gridLineWidthDisplay">${settings.gridLineWidth}px</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-eye"></i>
                Visual Effects
            </div>
            <div class="settings-grid">
                <div class="setting-item">
                    <label class="setting-label">Show Row Numbers</label>
                    <div class="setting-description">Display row numbers in the grid</div>
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-showRowNumbers" ${settings.showRowNumbers ? 'checked' : ''}>
                        <label for="setting-showRowNumbers">Show row numbers</label>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Highlight Selected Row</label>
                    <div class="setting-description">Highlight the currently selected row</div>
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-highlightSelectedRow" ${settings.highlightSelectedRow ? 'checked' : ''}>
                        <label for="setting-highlightSelectedRow">Highlight selected row</label>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Row Hover Effect</label>
                    <div class="setting-description">Show hover effect on rows</div>
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-rowHoverEffect" ${settings.rowHoverEffect ? 'checked' : ''}>
                        <label for="setting-rowHoverEffect">Enable row hover</label>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Smooth Scrolling</label>
                    <div class="setting-description">Enable smooth scrolling animations</div>
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-smoothScrolling" ${settings.smoothScrolling ? 'checked' : ''}>
                        <label for="setting-smoothScrolling">Enable smooth scrolling</label>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Row Hover Color</label>
                    <div class="setting-description">Color when hovering over rows</div>
                    <div class="setting-control">
                        <span class="color-preview" style="background-color: ${settings.rowHoverColor};"></span>
                        <input type="color" class="setting-color" id="setting-rowHoverColor" value="${settings.rowHoverColor}" onChange="colorChange('RHColor')">
                        <input type="text" class="setting-input" id="setting-rowHoverColorText" value="${settings.rowHoverColor}" style="width: 100px;">
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Selected Row Color</label>
                    <div class="setting-description">Background color for selected row</div>
                    <div class="setting-control">
                        <span class="color-preview" style="background-color: ${settings.selectedRowColor};"></span>
                        <input type="color" class="setting-color" id="setting-selectedRowColor" value="${settings.selectedRowColor}" onChange="colorChange('SRColor')">
                        <input type="text" class="setting-input" id="setting-selectedRowColorText" value="${settings.selectedRowColor}" style="width: 100px;">
                    </div>
                </div>
            </div>
        </div>

        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-font"></i>
                Typography
            </div>
            <div class="settings-grid">
                <div class="setting-item">
                    <label class="setting-label">Font Family</label>
                    <div class="setting-description">Main font family for the application</div>
                    <select class="setting-select" id="setting-fontFamily">
                           <option value="Lexend, sans-serif" ${settings.fontFamily === 'Lexend, sans-serif' ? 'selected' : ''}>Lexend</option>
                           <option value="Segoe UI, sans-serif" ${settings.fontFamily === 'Segoe UI, sans-serif' ? 'selected' : ''}>Segoe UI</option>
                           <option value="Arial, sans-serif" ${settings.fontFamily === 'Arial, sans-serif' ? 'selected' : ''}>Arial</option>
                           <option value="Courier New, monospace" ${settings.fontFamily === 'Courier New, monospace' ? 'selected' : ''}>Courier New</option>
                           <option value="Georgia, serif" ${settings.fontFamily === 'Georgia, serif' ? 'selected' : ''}>Georgia</option>
                           <!-- Add more fonts here -->
                           <option value="Roboto, sans-serif" ${settings.fontFamily === 'Roboto, sans-serif' ? 'selected' : ''}>Roboto</option>
                           <option value="Open Sans, sans-serif" ${settings.fontFamily === 'Open Sans, sans-serif' ? 'selected' : ''}>Open Sans</option>
                           <option value="Times New Roman, serif" ${settings.fontFamily === 'Times New Roman, serif' ? 'selected' : ''}>Times New Roman</option>
                           <option value="Montserrat, sans-serif" ${settings.fontFamily === 'Montserrat, sans-serif' ? 'selected' : ''}>Montserrat</option>
                           <option value="Arial, Helvetica, sans-serif" ${settings.fontFamily === 'Arial, Helvetica, sans-serif' ? 'selected' : ''}>Arial</option>
                            <option value="Verdana, Geneva, sans-serif" ${settings.fontFamily === 'Verdana, Geneva, sans-serif' ? 'selected' : ''}>Verdana</option>
                            <option value="Tahoma, Geneva, sans-serif" ${settings.fontFamily === 'Tahoma, Geneva, sans-serif' ? 'selected' : ''}>Tahoma</option>
                            <option value="Trebuchet MS, Helvetica, sans-serif" ${settings.fontFamily === 'Trebuchet MS, Helvetica, sans-serif' ? 'selected' : ''}>Trebuchet MS</option>
                            <option value="Georgia, serif" ${settings.fontFamily === 'Georgia, serif' ? 'selected' : ''}>Georgia</option>
                            <option value="Times New Roman, Times, serif" ${settings.fontFamily === 'Times New Roman, Times, serif' ? 'selected' : ''}>Times New Roman</option>
                            <option value="Courier New, Courier, monospace" ${settings.fontFamily === 'Courier New, Courier, monospace' ? 'selected' : ''}>Courier New</option>
                            <option value="Lucida Console, Monaco, monospace" ${settings.fontFamily === 'Lucida Console, Monaco, monospace' ? 'selected' : ''}>Lucida Console</option>
                            <option value="Garamond, serif" ${settings.fontFamily === 'Garamond, serif' ? 'selected' : ''}>Garamond</option>
                            <option value="Bookman, serif" ${settings.fontFamily === 'Bookman, serif' ? 'selected' : ''}>Bookman</option>
                            <option value="Comic Sans MS, cursive" ${settings.fontFamily === 'Comic Sans MS, cursive' ? 'selected' : ''}>Comic Sans MS</option>
                            <option value="Impact, Charcoal, sans-serif" ${settings.fontFamily === 'Impact, Charcoal, sans-serif' ? 'selected' : ''}>Impact</option>
                            <option value="Lucida Sans Unicode, Lucida Grande, sans-serif" ${settings.fontFamily === 'Lucida Sans Unicode, Lucida Grande, sans-serif' ? 'selected' : ''}>Lucida Sans</option>
                            <option value="Palatino Linotype, Book Antiqua, Palatino, serif" ${settings.fontFamily === 'Palatino Linotype, Book Antiqua, Palatino, serif' ? 'selected' : ''}>Palatino</option>
                            <option value="MS Sans Serif, Geneva, sans-serif" ${settings.fontFamily === 'MS Sans Serif, Geneva, sans-serif' ? 'selected' : ''}>MS Sans Serif</option>
                            <option value="MS Serif, New York, serif" ${settings.fontFamily === 'MS Serif, New York, serif' ? 'selected' : ''}>MS Serif</option>
                            <option value="Symbol, sans-serif" ${settings.fontFamily === 'Symbol, sans-serif' ? 'selected' : ''}>Symbol</option>
                            <option value="Webdings, sans-serif" ${settings.fontFamily === 'Webdings, sans-serif' ? 'selected' : ''}>Webdings</option>
                            <option value="Wingdings, Zapf Dingbats, sans-serif" ${settings.fontFamily === 'Wingdings, Zapf Dingbats, sans-serif' ? 'selected' : ''}>Wingdings</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Header Font Weight</label>
                    <div class="setting-description">Font weight for headers</div>
                    <select class="setting-select" id="setting-headerFontWeight">
                        <option value="300" ${settings.headerFontWeight === '300' ? 'selected' : ''}>Light (300)</option>
                        <option value="400" ${settings.headerFontWeight === '400' ? 'selected' : ''}>Normal (400)</option>
                        <option value="500" ${settings.headerFontWeight === '500' ? 'selected' : ''}>Medium (500)</option>
                        <option value="600" ${settings.headerFontWeight === '600' ? 'selected' : ''}>Semi-bold (600)</option>
                        <option value="700" ${settings.headerFontWeight === '700' ? 'selected' : ''}>Bold (700)</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Font Size Scaling</label>
                    <div class="setting-description">Overall font size scaling factor</div>
                    <div class="setting-control">
                        <input type="range" class="setting-slider" id="setting-fontSizeScale" min="80" max="120" value="${settings.fontSizeScale}" onChange="rangeChange('fontSizeScale')">
                        <span class="info-badge" id="fontSizeScaleDisplay">${settings.fontSizeScale}%</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="settings-buttons">
            <button class="setting-btn primary" onclick="applyAppearanceSettings()">Apply Appearance Settings</button>
        </div>
    `;
}

/**
 * Renders Diagram settings tab content
 * @returns {string} HTML content for Diagram settings
 */
 
function renderDiagramSettings() {
  const d = state.settings.diagram || {};
  const bf = d.boxFieldsCdm || {};
  const relColor = d.edgeStyles?.relationship?.color ?? '#2563eb';
  const relWidth = d.edgeStyles?.relationship?.width ?? 2;
  const relArrow = d.edgeStyles?.relationship?.arrow ?? true;
  const inhColor = d.edgeStyles?.inheritance?.color ?? '#6b7280';
  const inhWidth = d.edgeStyles?.inheritance?.width ?? 2;
  const inhDash = d.edgeStyles?.inheritance?.dash ?? true;
  const wrapLength = d.WrapLength ?? 30;
  return `
    <div class="settings-section">
      <div class="settings-section-title"><i class="fa-solid fa-diagram-project"></i> Diagram Viewer</div>
      <div class="settings-grid">
        <div class="setting-item">
          <div class="setting-label">Spacing factor (0.05 – 2.00)</div>
          <div class="setting-control">
            <input id="dg-spacingFactor" type="number" step="0.05" min="0.05" max="2.00" value="${d.spacingFactor ?? 0.40}">
          </div>
          <div class="setting-description">Lower = tighter layout. Auto‑fit may compress more to fit the viewport.</div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">Auto‑fit spacing</div>
          <div class="setting-control">
            <input id="dg-autoFit" type="checkbox" ${d.autoFitSpacing !== false ? 'checked' : ''}>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">Node width / height (px)</div>
          <div class="setting-control">
            <input id="dg-boxW" type="number" min="120" max="600" step="10" value="${d.boxWidth ?? 240}">
            <input id="dg-boxH" type="number" min="60" max="400" step="10" value="${d.boxHeight ?? 100}">
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">Default view</div>
          <div class="setting-control">
            <select id="dg-defaultView">
              <option value="center" ${d.defaultView === 'center' ? 'selected' : ''}>Center</option>
              <option value="fit" ${d.defaultView === 'fit' ? 'selected' : ''}>Fit</option>
            </select>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">Show relationships by default</div>
          <div class="setting-control">
            <input id="dg-showRel" type="checkbox" ${d.showRelationships !== false ? 'checked' : ''}>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">Show inheritance by default</div>
          <div class="setting-control">
            <input id="dg-showInh" type="checkbox" ${d.showInheritance !== false ? 'checked' : ''}>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">Zoom limits</div>
          <div class="setting-control">
            <input id="dg-minZoom" type="number" step="0.05" min="0.05" max="2" value="${d.minZoom ?? 0.1}" placeholder="Min">
            <input id="dg-maxZoom" type="number" step="0.1" min="1" max="6" value="${d.maxZoom ?? 4}" placeholder="Max">
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">Zoom-in mode</div>
          <div class="setting-control">
            <select id="dg-zoomInMode">
              <option value="factor" ${(d.zoomInMode || 'factor') === 'factor' ? 'selected' : ''}>By factor (+)</option>
              <option value="center" ${(d.zoomInMode || 'factor') === 'center' ? 'selected' : ''}>By center (re-center after +)</option>
            </select>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">Zoom-in factor</div>
          <div class="setting-control">
            <input id="dg-zoomInFactor" type="number" step="0.1" min="1" max="5" value="${d.zoomInFactor ?? 1.2}">
          </div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title"><i class="fa-solid fa-square"></i> Entity Box Contents (CDM)</div>
      <div class="settings-grid">
        <div class="setting-item">
          <label class="setting-label">
            <input id="bf-stereo" type="checkbox" ${bf.showStereotype !== false ? 'checked' : ''}>
            Show stereotype
          </label>
        </div>
        <div class="setting-item">
          <label class="setting-label">
            <input id="bf-comment" type="checkbox" ${bf.showComment !== false ? 'checked' : ''}>
            Show comment
          </label>
        </div>
        <div class="setting-item">
          <label class="setting-label">
            <input id="bf-keys" type="checkbox" ${bf.showKeySummary !== false ? 'checked' : ''}>
            Show key summary (PK/M/BI)
          </label>
        </div>
        <div class="setting-item">
          <label class="setting-label">
            <input id="bf-mapping" type="checkbox" ${bf.showMapping ? 'checked' : ''}>
            Show mapping
          </label>
        </div>
        <div class="setting-item">
          <label class="setting-label">
            <input id="bf-counts" type="checkbox" ${bf.showCounts ? 'checked' : ''}>
            Show attribute counts
          </label>
        </div>
      </div>
    </div>
    
    <div class="settings-section">
      <div class="settings-section-title"><i class="fa-solid fa-table"></i> Table Box Contents (PDM)</div>
      <div class="settings-grid">
        <div class="setting-item">
          <label class="setting-label">
            <input id="tb-stereo" type="checkbox" ${d.boxFieldsPDM?.showStereotype !== false ? 'checked' : ''}>
            Show stereotype
          </label>
        </div>
        <div class="setting-item">
          <label class="setting-label">
            <input id="tb-comment" type="checkbox" ${d.boxFieldsPDM?.showComment !== false ? 'checked' : ''}>
            Show comment
          </label>
        </div>
        <div class="setting-item">
          <label class="setting-label">
            <input id="tb-keys" type="checkbox" ${d.boxFieldsPDM?.showKeySummary !== false ? 'checked' : ''}>
            Show key summary (PK/FK/AK)
          </label>
        </div>
        <div class="setting-item">
          <label class="setting-label">
            <input id="tb-counts" type="checkbox" ${d.boxFieldsPDM?.showCounts ? 'checked' : ''}>
            Show columns count
          </label>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title"><i class="fa-solid fa-arrow-right-arrow-left"></i> Edge Styling</div>
      <div class="settings-grid">
        <div class="setting-item">
          <div class="setting-label">Relationship color</div>
          <div class="setting-control">
            <input id="dg-relColor" type="color" value="${relColor}" onChange="colorChange('relColor')">
            <span id ="dg-relColor-display" class="color-value">${relColor}</span>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">Relationship width (px)</div>
          <div class="setting-control">
            <input id="dg-relWidth" type="number" min="1" max="10" step="0.5" value="${relWidth}">
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">Relationship arrow</div>
          <div class="setting-control">
            <select id="dg-relArrow">
              <option value="arrow" ${relArrow ? 'selected' : ''}>Arrow</option>
              <option value="none" ${!relArrow ? 'selected' : ''}>None</option>
            </select>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">Inheritance color</div>
          <div class="setting-control">
            <input id="dg-inhColor" type="color" value="${inhColor}" onchange="colorChange('inhColor')">
            <span id="dg-inhColor-display" class="color-value">${inhColor}</span>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">Inheritance width (px)</div>
          <div class="setting-control">
            <input id="dg-inhWidth" type="number" min="1" max="10" step="0.5" value="${inhWidth}">
          </div>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <input id="dg-inhDash" type="checkbox" ${inhDash ? 'checked' : ''}>
            Dashed inheritance line
          </label>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <input id="dg-wrapLength" type="input" value="${wrapLength}">
            Wrap Label length (characters)
          </label>
        </div>
      </div>
    </div>

    <div class="settings-buttons">
      <button class="setting-btn primary" onclick="applyDiagramSettings()">Apply Diagram Settings</button>
    </div>
  `;
}

/**
 * Renders keyboard shortcut settings tab content
 * @returns {string} HTML content for shortcut settings
 */
function renderShortcutSettings() {
    const shortcuts = state.settings.shortcuts || {};
    const categories = {
        'Global': [
            'focus-search', 'toggle-left-panel', 'toggle-sidebar', 
            'toggle-theme', 'toggle-fullscreen', 'export-data',
            'copy-selected', 'show-settings', 'show-help'
        ],
        'Navigation': [
            'navigate-up', 'navigate-down', 'navigate-left', 'navigate-right',
            'page-up', 'page-down', 'home', 'end'
        ],
        'Diagram': [
            'show-diagram', 'zoom-in', 'zoom-out', 'zoom-reset',
            'zoom-fit', 'pan-left', 'pan-right', 'pan-up', 'pan-down'
        ]
    };
    
    const actionLabels = {
        'focus-search': 'Focus Search Box',
        'toggle-left-panel': 'Toggle Left Panel',
        'toggle-sidebar': 'Toggle Sidebar',
        'toggle-theme': 'Toggle Theme',
        'toggle-fullscreen': 'Toggle Fullscreen',
        'export-data': 'Export Data',
        'copy-selected': 'Copy Selected',
        'show-settings': 'Show Settings',
        'show-help': 'Show Help',
        'navigate-up': 'Navigate Up',
        'navigate-down': 'Navigate Down',
        'navigate-left': 'Navigate Left',
        'navigate-right': 'Navigate Right',
        'page-up': 'Page Up',
        'page-down': 'Page Down',
        'home': 'Go to First Row',
        'end': 'Go to Last Row',
        'show-diagram': 'Show Diagram',
        'zoom-in': 'Zoom In',
        'zoom-out': 'Zoom Out',
        'zoom-reset': 'Reset Zoom',
        'zoom-fit': 'Fit to View',
        'pan-left': 'Pan Left',
        'pan-right': 'Pan Right',
        'pan-up': 'Pan Up',
        'pan-down': 'Pan Down'
    };
    
    return `
        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-keyboard"></i>
                Keyboard Shortcuts
            </div>
            
            <div class="setting-item">
                <label class="setting-label">Global Shortcut Behavior</label>
                <div class="setting-description">Control how keyboard shortcuts work in the application</div>
                <div class="settings-grid">
                    <div class="setting-item">
                        <div class="setting-control">
                            <input type="checkbox" class="setting-checkbox" id="setting-shortcutsEnabled" 
                                   ${state.settings.behavior?.keyboardShortcutsEnabled !== false ? 'checked' : ''}>
                            <label for="setting-shortcutsEnabled">Enable keyboard shortcuts</label>
                        </div>
                    </div>
                    <div class="setting-item">
                        <div class="setting-control">
                            <input type="checkbox" class="setting-checkbox" id="setting-showShortcutHints" 
                                   ${state.settings.behavior?.showShortcutHints ? 'checked' : ''}>
                            <label for="setting-showShortcutHints">Show shortcut hints in tooltips</label>
                        </div>
                    </div>
                </div>
            </div>
            
            ${Object.entries(categories).map(([category, actions]) => `
                <div class="settings-section">
                    <div class="settings-section-title" style="font-size: 14px; padding: 8px 12px;">
                        <i class="fa-solid fa-${category === 'Global' ? 'globe' : category === 'Navigation' ? 'arrows-alt' : 'diagram-project'}"></i>
                        ${category} Shortcuts
                    </div>
                    <div class="settings-grid">
                        ${actions.map(action => `
                            <div class="setting-item shortcut-item">
                                <label class="setting-label">
                                    <i class="fa-solid ${getShortcutIcon(action)}"></i>
                                    ${actionLabels[action] || action}
                                </label>
                                <div class="setting-control">
                                    <input type="text" 
                                           class="setting-input shortcut-input" 
                                           id="shortcut-${action}" 
                                           value="${state.settings.shortcuts?.[action] || ''}"
                                           placeholder="Click to record shortcut..."
                                           readonly
                                           data-action="${action}">
                                    <button class="setting-btn btn-small" onclick="recordShortcut('${action}')">
                                        <i class="fa-solid fa-keyboard"></i> Record
                                    </button>
                                    <button class="setting-btn btn-small" onclick="resetShortcut('${action}')">
                                        <i class="fa-solid fa-undo"></i> Reset
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
            
            <div class="shortcut-hint">
                <i class="fa-solid fa-info-circle"></i>
                Click "Record" and press the key combination you want to assign. Use Escape to cancel.
            </div>
            
            <div class="settings-buttons">
                <button class="setting-btn" onclick="resetAllShortcuts()">
                    <i class="fa-solid fa-rotate-left"></i> Reset All Shortcuts
                </button>
                <button class="setting-btn primary" onclick="applyShortcutSettings(true)">
                    <i class="fa-solid fa-save"></i> Apply Shortcut Settings
                </button>
            </div>
        </div>
    `;
}

/**
 * Renders icon settings tab content
 */
function renderIconSettings() {
    const settings = state.settings.icons || {};
    
    return `
        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-icons"></i>
                Icon Configuration
            </div>
            
            <div class="settings-grid">
                <div class="setting-item">
                    <label class="setting-label">Icon Set</label>
                    <div class="setting-description">Choose which icon set to use</div>
                    <select class="setting-select" id="setting-iconSet">
                        <option value="fontawesome" ${settings.iconSet === 'fontawesome' || !settings.iconSet ? 'selected' : ''}>
                            Font Awesome (Solid)
                        </option>
                        <option value="fontawesome-regular" ${settings.iconSet === 'fontawesome-regular' ? 'selected' : ''}>
                            Font Awesome (Regular)
                        </option>
                        <option value="fontawesome-light" ${settings.iconSet === 'fontawesome-light' ? 'selected' : ''}>
                            Font Awesome (Light)
                        </option>
                        <option value="material" ${settings.iconSet === 'material' ? 'selected' : ''}>
                            Material Icons
                        </option>
                        <option value="bootstrap" ${settings.iconSet === 'bootstrap' ? 'selected' : ''}>
                            Bootstrap Icons
                        </option>
                    </select>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Icon Size</label>
                    <div class="setting-description">Base size for all icons</div>
                    <select class="setting-select" id="setting-iconSize">
                        <option value="small" ${settings.iconSize === 'small' ? 'selected' : ''}>Small (12px)</option>
                        <option value="medium" ${settings.iconSize === 'medium' || !settings.iconSize ? 'selected' : ''}>Medium (14px)</option>
                        <option value="large" ${settings.iconSize === 'large' ? 'selected' : ''}>Large (16px)</option>
                        <option value="xlarge" ${settings.iconSize === 'xlarge' ? 'selected' : ''}>Extra Large (18px)</option>
                    </select>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Icon Color Source</label>
                    <div class="setting-description">Where icons get their color from</div>
                    <select class="setting-select" id="setting-iconColorSource">
                        <option value="accent" ${settings.iconColorSource === 'accent' || !settings.iconColorSource ? 'selected' : ''}>
                            Use accent color
                        </option>
                        <option value="text" ${settings.iconColorSource === 'text' ? 'selected' : ''}>
                            Match text color
                        </option>
                        <option value="custom" ${settings.iconColorSource === 'custom' ? 'selected' : ''}>
                            Custom color
                        </option>
                    </select>
                </div>
                
                <div class="setting-item" id="customIconColorContainer" style="display: ${settings.iconColorSource === 'custom' ? 'block' : 'none'};">
                    <label class="setting-label">Custom Icon Color</label>
                    <div class="setting-description">Color for all icons when using custom color source</div>
                    <div class="setting-control">
                        <input type="color" class="setting-color" id="setting-iconCustomColor" 
                               value="${settings.iconCustomColor || '#4b5563'}" onchange="updateIconColorText()">
                        <input type="text" class="setting-input" id="setting-iconCustomColorText" 
                               value="${settings.iconCustomColor || '#4b5563'}" style="width: 100px;">
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Icon Animation</label>
                    <div class="setting-description">Animation for interactive icons</div>
                    <select class="setting-select" id="setting-iconAnimation">
                        <option value="none" ${settings.iconAnimation === 'none' ? 'selected' : ''}>None</option>
                        <option value="spin" ${settings.iconAnimation === 'spin' || !settings.iconAnimation ? 'selected' : ''}>Spin on hover</option>
                        <option value="pulse" ${settings.iconAnimation === 'pulse' ? 'selected' : ''}>Pulse on hover</option>
                        <option value="bounce" ${settings.iconAnimation === 'bounce' ? 'selected' : ''}>Bounce on hover</option>
                    </select>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Button Icon Size</label>
                    <div class="setting-description">Icon size inside buttons</div>
                    <div class="setting-control">
                        <input type="range" class="setting-slider" id="setting-buttonIconSize" min="12" max="24" step="1" 
                               value="${settings.buttonIconSize || 16}" oninput="updateButtonIconSizeDisplay()">
                        <span class="info-badge" id="buttonIconSizeDisplay">${settings.buttonIconSize || 16}px</span>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Toolbar Icon Size</label>
                    <div class="setting-description">Icon size in toolbars</div>
                    <div class="setting-control">
                        <input type="range" class="setting-slider" id="setting-toolbarIconSize" min="14" max="28" step="1" 
                               value="${settings.toolbarIconSize || 18}" oninput="updateToolbarIconSizeDisplay()">
                        <span class="info-badge" id="toolbarIconSizeDisplay">${settings.toolbarIconSize || 18}px</span>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Show Icon Tooltips</label>
                    <div class="setting-description">Show tooltips when hovering over icons</div>
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-showIconTooltips" ${settings.showIconTooltips !== false ? 'checked' : ''}>
                        <label for="setting-showIconTooltips">Show icon tooltips</label>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Icon Loading Animation</label>
                    <div class="setting-description">Show loading animation for icons during data load</div>
                    <div class="setting-control">
                        <input type="checkbox" class="setting-checkbox" id="setting-iconLoadingAnimation" ${settings.iconLoadingAnimation !== false ? 'checked' : ''}>
                        <label for="setting-iconLoadingAnimation">Show loading animation</label>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-palette"></i>
                Specific Icon Colors
            </div>
            <div class="settings-grid">
                <div class="setting-item">
                    <label class="setting-label">Success Icon Color</label>
                    <div class="setting-control">
                        <input type="color" class="setting-color" id="setting-successIconColor" 
                               value="${settings.successIconColor || '#10b981'}">
                        <span class="color-value">${settings.successIconColor || '#10b981'}</span>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Error Icon Color</label>
                    <div class="setting-control">
                        <input type="color" class="setting-color" id="setting-errorIconColor" 
                               value="${settings.errorIconColor || '#ef4444'}">
                        <span class="color-value">${settings.errorIconColor || '#ef4444'}</span>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Warning Icon Color</label>
                    <div class="setting-control">
                        <input type="color" class="setting-color" id="setting-warningIconColor" 
                               value="${settings.warningIconColor || '#f59e0b'}">
                        <span class="color-value">${settings.warningIconColor || '#f59e0b'}</span>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">Info Icon Color</label>
                    <div class="setting-control">
                        <input type="color" class="setting-color" id="setting-infoIconColor" 
                               value="${settings.infoIconColor || '#3b82f6'}">
                        <span class="color-value">${settings.infoIconColor || '#3b82f6'}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="settings-buttons">
            <button class="setting-btn primary" onclick="applyIconSettings()">
                <i class="fa-solid fa-check"></i> Apply Icon Settings
            </button>
            <button class="setting-btn" onclick="resetIconSettings()">
                <i class="fa-solid fa-rotate-left"></i> Reset to Defaults
            </button>
        </div>
    `;
}

/**
 * Renders reset settings tab content
 * @returns {string} HTML content for reset settings
 */
function renderResetSettings() {
    return `
        <div class="settings-section reset-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-triangle-exclamation"></i>
                Reset Settings
            </div>
            <div class="setting-item">
                <label class="setting-label">Reset to Defaults</label>
                <div class="setting-description">Reset all settings to their default values. This action cannot be undone.</div>
                <div class="setting-control">
                    <button class="setting-btn" style="background: #ef4444; color: white; border-color: #ef4444;" onclick="resetAllSettings()">
                        <i class="fa-solid fa-rotate-left"></i> Reset All Settings
                    </button>
                </div>
            </div>
        </div>

        <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-download"></i>
                Import/Export Settings
            </div>
            <div class="settings-grid">
                <div class="setting-item">
                    <label class="setting-label">Export Settings</label>
                    <div class="setting-description">Download your current settings as a JSON file</div>
                    <div class="setting-control">
                        <button class="setting-btn" onclick="exportSettings()">
                            <i class="fa-solid fa-download"></i> Export Settings
                        </button>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="setting-label">Import Settings</label>
                    <div class="setting-description">Upload settings from a JSON file</div>
                    <div class="setting-control">
                        <input type="file" id="importSettingsFile" accept=".json" style="display: none;" onchange="importSettings(event)">
                        <button class="setting-btn" onclick="document.getElementById('importSettingsFile').click()">
                            <i class="fa-solid fa-upload"></i> Import Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renders settings content for specific tab
 */
function renderSettingsContent(tab) {
    const container = document.getElementById('settingsContent');
    if (!container) return;
    
    switch(tab) {
        case 'general':
            container.innerHTML = renderGeneralSettings();
            break;
        case 'cdm':
            container.innerHTML = renderCDMSettings();
            break;
        case 'pdm':
            container.innerHTML = renderPDMSettings();
            break;
        case 'appearance':
            container.innerHTML = renderAppearanceSettings();
            break;
        case 'leftpanel':
            container.innerHTML = renderLeftPanelSettings();
            break;
        case 'diagram':
            container.innerHTML = renderDiagramSettings();
            break;
        case 'behavior':
            container.innerHTML = renderBehaviorSettings();
            break;
        case 'accessibility':
            container.innerHTML = renderAccessibilitySettings();
            break;
        case 'shortcuts':
            container.innerHTML = renderShortcutSettings();
            break;
        case 'icons':
            container.innerHTML = renderIconSettings();
            break;
        case 'reset':
            container.innerHTML = renderResetSettings();
            break;
        default:
            container.innerHTML = renderGeneralSettings();
    }
    setupSettingsEventListeners(tab);
}

/**
 * ================================|
 * SETTINGS APPLICATION FUNCTIONS =|
 * ================================|
 */

/**
 * Applies general settings changes
 */

function applyGeneralSettings() {
  // Fall back to the values already stored in state.settings.general
  const current = state.settings.general || { theme: 'auto', fontSize: 'medium', rowHeight: 35, sidebarWidth: 450, sidebarDefaultOpen: false, collapseSections: false, collapsedById: {} };

  const theme             = readInputValue('setting-theme', current.theme);
  const fontSize          = readInputValue('setting-fontSize', current.fontSize);
  const rowHeightRaw      = readInputValue('setting-rowHeight', String(current.rowHeight));
  const sidebarWidthRaw   = readInputValue('setting-sidebarWidth', String(current.sidebarWidth));
  const sidebarDefaultOpen= readInputValue('setting-sidebarDefaultOpen', !!current.sidebarDefaultOpen);
  const collapseSections = readInputValue('setting-collapseSidebarSections', !!current.collapseSections);

  const rowHeight   = parseInt(rowHeightRaw, 10)  || current.rowHeight;
  const sidebarWidth= parseInt(sidebarWidthRaw,10)|| current.sidebarWidth;

  // Persist to state
    state.settings.general = { theme, fontSize, rowHeight, sidebarWidth, sidebarDefaultOpen, collapseSections};
    // Persist sidebar-specific flag under top-level sidebar settings
    //state.settings.sidebar = state.settings.sidebar || {};
    //state.settings.sidebar.collapseSections = !!collapseSidebarSections;

  // Apply layout changes
  document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
  state.rowHeight = rowHeight;

  const sldr = document.getElementById('rowHeightSlider');
  if (sldr) sldr.value = rowHeight;
  const val = document.getElementById('rowHeightVal');
  if (val) val.textContent = `${rowHeight}px`;

  // Apply font size
  const fontSizeMap = { xsmall: '10px', small: '12px', medium: '14px', large: '16px', xlarge : '18px' };
  document.documentElement.style.setProperty('--font-size-medium', fontSizeMap[fontSize] || '13px');

  // Apply theme (auto respects system)
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    state.darkMode = prefersDark;
  } else {
    state.darkMode = theme === 'dark';
  }
  document.body.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');

  updateGridMetrics();
  renderVirtualRows();
  showToast('General settings applied', 'success');
}


// --- Safe DOM readers: fall back to provided defaults when element doesn't exist ---
function readInputValue(id, def) {
  const el = document.getElementById(id);
  if (!el) return def;
  const type = (el.type || '').toLowerCase();
  if (type === 'checkbox') return !!el.checked;
  // number inputs still return strings; caller can cast if needed
  return (el.value ?? def);
}

/**
 * Applies CDM settings changes
 */

function applyCDMSettings() {
  const columnList = document.getElementById('cdmColumnList');

  // If the CDM settings UI isn't present (e.g., modal closed),
  // just persist current state and exit safely.
  if (!columnList) {
    // Nothing to read from DOM; keep existing defaults
    // but still refresh grid if we're in CDM mode.
    if (state.mode === 'CDM') {
      state.columns = [...state.cdmColumns];
      renderHeaders();
      updateGridMetrics();
      renderVirtualRows();
    }
    showToast('CDM settings applied', 'success');
    return;
  }

  // When UI is present, read it safely
  const items = columnList.querySelectorAll('.column-order-item');
  const newOrder = Array.from(items).map(item => item.getAttribute('data-column-id'));

  const defaultColumns = Array.from(items)
    .filter(item => item.querySelector('input[type="checkbox"]')?.checked)
    .map(item => item.getAttribute('data-column-id'));

  const frozenColumns = state.cdmColumns
    .filter(col => document.getElementById(`cdm-frozen-${col.id}`)?.checked)
    .map(col => col.id);

  state.settings.cdm = { defaultColumns, columnOrder: newOrder, frozenColumns };

  if (state.mode === 'CDM') {
    state.cdmColumns.forEach(col => {
      col.visible = defaultColumns.includes(col.id);
      col.frozen = frozenColumns.includes(col.id);
    });
    state.columns = [...state.cdmColumns];
    renderHeaders();
    updateGridMetrics();
    renderVirtualRows();
  }

  showToast('CDM settings applied', 'success');
}

/**
 * Applies PDM settings changes
 */

function applyPDMSettings() {
  const columnList = document.getElementById('pdmColumnList');

  // If the PDM settings UI isn't present (e.g., modal closed or different tab),
  // exit safely after refreshing the current grid when in PDM mode.
  if (!columnList) {
    if (state.mode === 'PDM') {
      // Ensure columns reflect whatever is currently in state.settings.pdm
      const defaults = (state.settings.pdm?.defaultColumns) || [];
      const frozen   = (state.settings.pdm?.frozenColumns)   || [];

      // Apply visibility/frozen to in-memory columns (if they exist already)
      if (Array.isArray(state.pdmColumns)) {
        state.pdmColumns.forEach(col => {
          col.visible = defaults.length ? defaults.includes(col.id) : (col.visible ?? true);
          col.frozen  = frozen.includes(col.id);
        });
      }

      state.columns = [...(state.pdmColumns || [])];
      renderHeaders();
      updateGridMetrics();
      renderVirtualRows();
    }
    showToast('PDM settings applied', 'success');
    return;
  }

  // --- Normal path: UI is present, read from DOM safely
  const items = columnList.querySelectorAll('.column-order-item');

  const newOrder = Array.from(items).map(item =>
    item.getAttribute('data-column-id')
  );

  const defaultColumns = Array.from(items)
    .filter(item => item.querySelector('input[type="checkbox"]')?.checked)
    .map(item => item.getAttribute('data-column-id'));

  const frozenColumns = (state.pdmColumns || [])
    .filter(col => document.getElementById(`pdm-frozen-${col.id}`)?.checked)
    .map(col => col.id);

  state.settings.pdm = { defaultColumns, columnOrder: newOrder, frozenColumns };

  // Apply to current state if in PDM mode
  if (state.mode === 'PDM') {
    (state.pdmColumns || []).forEach(col => {
      col.visible = defaultColumns.includes(col.id);
      col.frozen  = frozenColumns.includes(col.id);
    });
    state.columns = [...(state.pdmColumns || [])];
    renderHeaders();
    updateGridMetrics();
    renderVirtualRows();
  }

  saveSettings?.();
  showToast('PDM settings applied', 'success');
}

/**
 * Applies appearance settings changes
 */

function applyAppearanceSettings() {
  const current = state.settings.appearance || {
    accentColor: '#2563eb', accentColorCDM: '#8b5cf6', accentColorPDM: '#06b6d4',
    bgPrimary: '#ffffff', bgSecondary: '#e5eeff', textPrimary: '#111827', txtttcolor : '#000000' , bgttcolor : '#ffffff' , borderColor: '#d1d5db',
    rowHoverColor: 'rgba(37, 99, 235, 0.05)', selectedRowColor: 'rgba(37, 99, 235, 0.15)',
    headerHeight: 40, rowHeight: 35, borderRadius: 6, gridLineWidth: 1,
    showRowNumbers: true, highlightSelectedRow: true, rowHoverEffect: true, smoothScrolling: true,
    fontFamily: 'Lexend, sans-serif', headerFontWeight: '600', fontSizeScale: 100
  };

  const accentColor     = readInputValue('setting-accentColor',     current.accentColor);
  const accentColorCDM  = readInputValue('setting-accentColorCDM',  current.accentColorCDM);
  const accentColorPDM  = readInputValue('setting-accentColorPDM',  current.accentColorPDM);
  const bgPrimary       = readInputValue('setting-bgPrimary',       current.bgPrimary);
  const bgSecondary     = readInputValue('setting-bgSecondary',     current.bgSecondary);
  const textPrimary     = readInputValue('setting-textPrimary',     current.textPrimary);
  const txtttcolor     = readInputValue('setting-txtttcolor',     current.txtttcolor);
  const bgttcolor     = readInputValue('setting-bgttcolor',     current.bgttcolor);
  const borderColor     = readInputValue('setting-borderColor',     current.borderColor);
  const rowHoverColor   = readInputValue('setting-rowHoverColor',   current.rowHoverColor);
  const selectedRowColor= readInputValue('setting-selectedRowColor',current.selectedRowColor);

  const headerHeight    = parseInt(readInputValue('setting-headerHeight',         String(current.headerHeight)), 10) || current.headerHeight;
  const rowHeight       = parseInt(readInputValue('setting-rowHeightAppearance',  String(current.rowHeight)), 10)   || current.rowHeight;
  const borderRadius    = parseInt(readInputValue('setting-borderRadius',         String(current.borderRadius)), 10)|| current.borderRadius;
  const gridLineWidth   = parseFloat(readInputValue('setting-gridLineWidth',      String(current.gridLineWidth)))   || current.gridLineWidth;

  const showRowNumbers      = !!readInputValue('setting-showRowNumbers',      current.showRowNumbers);
  const highlightSelectedRow= !!readInputValue('setting-highlightSelectedRow',current.highlightSelectedRow);
  const rowHoverEffect      = !!readInputValue('setting-rowHoverEffect',      current.rowHoverEffect);
  const smoothScrolling     = !!readInputValue('setting-smoothScrolling',     current.smoothScrolling);

  const fontFamily      = readInputValue('setting-fontFamily',      current.fontFamily);
  const headerFontWeight= readInputValue('setting-headerFontWeight',current.headerFontWeight);
  const fontSizeScale   = parseInt(readInputValue('setting-fontSizeScale',    String(current.fontSizeScale)), 10) || current.fontSizeScale;

  state.settings.appearance = {
    accentColor, accentColorCDM, accentColorPDM,
    bgPrimary, bgSecondary, textPrimary, txtttcolor, bgttcolor, borderColor,
    rowHoverColor, selectedRowColor,
    headerHeight, rowHeight, borderRadius, gridLineWidth,
    showRowNumbers, highlightSelectedRow, rowHoverEffect, smoothScrolling,
    fontFamily, headerFontWeight, fontSizeScale
  };

  // Apply CSS custom properties
  const root = document.documentElement;
  root.style.setProperty('--accent', accentColor);
  root.style.setProperty('--accent-cdm', accentColorCDM);
  root.style.setProperty('--accent-pdm', accentColorPDM);
  root.style.setProperty('--bg-primary', bgPrimary);
  root.style.setProperty('--bg-secondary', bgSecondary);
  root.style.setProperty('--text-primary', textPrimary);
  root.style.setProperty('--border', borderColor);

  root.style.setProperty('--header-height', `${headerHeight}px`);
  root.style.setProperty('--border-radius', `${borderRadius}px`);
  root.style.setProperty('--row-height', `${rowHeight}px`);

  // Apply font settings
  root.style.setProperty('--font-family', fontFamily);
  root.style.setProperty('--font-size-scale', `${fontSizeScale}%`);
  document.body.style.fontFamily = fontFamily;

  // Update row height in state and UI
  state.rowHeight = rowHeight;
  const sldr = document.getElementById('rowHeightSlider'); if (sldr) sldr.value = rowHeight;
  const val = document.getElementById('rowHeightVal');    if (val)  val.textContent = `${rowHeight}px`;

  // Apply grid line width
  document.querySelectorAll('.grid-cell, .header-cell').forEach(cell => {
    cell.style.borderRightWidth = `${gridLineWidth}px`;
    cell.style.borderBottomWidth = `${gridLineWidth}px`;
  });

  // Hover/selected colors
  root.style.setProperty('--row-hover-color', rowHoverColor);
  root.style.setProperty('--selected-row-color', selectedRowColor);

  updateModeSwitcherUI(
    state.mode,
    state.mode === 'CDM' ? 'Entities' : 'Tables',
    state.mode === 'CDM' ? 'fa-sitemap' : 'fa-table',
    state.mode.toLowerCase()
  );

  updateGridMetrics();
  renderHeaders();
  renderVirtualRows();

  showToast('Appearance settings applied', 'success');
  saveSettings();
}



/**
 * Applies Diagram settings changes
 */
function applyDiagramSettings() {
  // Ensure diagram settings exist
  state.settings.diagram = state.settings.diagram || {};
  const d = state.settings.diagram;
  
  // Layout settings
  d.spacingFactor = Number(document.getElementById('dg-spacingFactor')?.value || 0.40);
  d.autoFitSpacing = document.getElementById('dg-autoFit')?.checked || false;
  d.defaultView = document.getElementById('dg-defaultView')?.value || 'center';
  d.showRelationships = document.getElementById('dg-showRel')?.checked || false;
  d.showInheritance = document.getElementById('dg-showInh')?.checked || false;
  d.minZoom = Number(document.getElementById('dg-minZoom')?.value || 0.1);
  d.maxZoom = Number(document.getElementById('dg-maxZoom')?.value || 4);
  d.boxWidth = Number(document.getElementById('dg-boxW')?.value || 240);
  d.boxHeight = Number(document.getElementById('dg-boxH')?.value || 100);
  d.wrapLength = Number(document.getElementById('dg-wrapLength')?.value || 30);
  // Zoom behavior
  d.zoomInMode = document.getElementById('dg-zoomInMode')?.value || 'factor';
  d.zoomInFactor = Number(document.getElementById('dg-zoomInFactor')?.value || 1.2);
  
  // CDM box content settings
  d.boxFieldsCdm = d.boxFieldsCdm || {};
  d.boxFieldsCdm.showStereotype = document.getElementById('bf-stereo')?.checked || false;
  d.boxFieldsCdm.showComment = document.getElementById('bf-comment')?.checked || false;
  d.boxFieldsCdm.showKeySummary = document.getElementById('bf-keys')?.checked || false;
  d.boxFieldsCdm.showMapping = document.getElementById('bf-mapping')?.checked || false;
  d.boxFieldsCdm.showCounts = document.getElementById('bf-counts')?.checked || false;
  
  // PDM box content settings
  d.boxFieldsPDM = d.boxFieldsPDM || {};
  d.boxFieldsPDM.showStereotype = document.getElementById('tb-stereo')?.checked || false;
  d.boxFieldsPDM.showComment = document.getElementById('tb-comment')?.checked || false;
  d.boxFieldsPDM.showKeySummary = document.getElementById('tb-keys')?.checked || false;
  d.boxFieldsPDM.showCounts = document.getElementById('tb-counts')?.checked || false;
  
  // Edge styling
  d.edgeStyles = d.edgeStyles || {};
  d.edgeStyles.relationship = d.edgeStyles.relationship || {};
  d.edgeStyles.inheritance = d.edgeStyles.inheritance || {};
  
  d.edgeStyles.relationship.color = document.getElementById('dg-relColor')?.value || '#2563eb';
  d.edgeStyles.relationship.width = Number(document.getElementById('dg-relWidth')?.value || 2);
  d.edgeStyles.relationship.arrow = document.getElementById('dg-relArrow')?.value === 'arrow';
  
  d.edgeStyles.inheritance.color = document.getElementById('dg-inhColor')?.value || '#6b7280';
  d.edgeStyles.inheritance.width = Number(document.getElementById('dg-inhWidth')?.value || 2);
  d.edgeStyles.inheritance.dash = document.getElementById('dg-inhDash')?.checked || false;
  // Save settings
  saveSettings();
  
  // Trigger restyling of any open diagrams
  document.dispatchEvent(new CustomEvent('diagramSettingsChanged', { 
    detail: { settings: d } 
  }));
  
  showToast('Diagram settings applied', 'success');
}

/**
 * Saves all settings and shows confirmation
 */
function saveAllSettings() {
    saveSettings();
    showToast('All settings saved', 'success');
}

/**
 * Resets all settings to defaults
 */
function resetAllSettings() {
    if (confirm('Are you sure you want to reset all settings to their default values? This action cannot be undone.')) {
        // Reset to default settings
        state.settings = {
            general: {
                theme: 'auto',
                fontSize: 'medium',
                rowHeight: 35,
                sidebarWidth: 450,
                sidebarDefaultOpen: false,
                collapseSections: false,
                collapsedById: {}
            },
            cdm: {
                defaultColumns: ['Model', 'combinedName', 'Datatype', 'Mandatory', 'Primary', 'Identifier', 'Mapping', 'STSP', 'Description', 'Domain', 'Creation_date', 'Modification_date'],
                columnOrder: ['Model', 'combinedName', 'Datatype', 'Mandatory', 'Primary', 'Identifier', 'STSP', 'Description', 'Domain', 'Mapping', 'Screen', 'FrName', 'FrDescription', 'TTS', 'Creation_date', 'Modification_date'],
                frozenColumns: []
            },
            pdm: {
                defaultColumns: ['Model', 'combinedName', 'combinedCode', 'Datatype', 'Mandatory', 'Primary', 'Unique' , 'Foreign', 'Index', 'Sequence', 'Description', 'Comment', 'Creation_date', 'Modification_date'],
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
            spacingFactor: 0.08,
            autoFitSpacing: true,
            defaultView: 'center',
            showRelationships: true,
            showInheritance: true,
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
            leftPanel : {
              regexSearch: true,
              defaultExpand: false,
              enableModelDrag: true,      // NEW
              saveModelOrder: true,       // NEW
              showCounts: true,
              showStereotypeColors: true,
              modelOrderCDM: [],          // NEW
              modelOrderPDM: [],          // NEW
              animationSpeed: 200,
              filterDelay: 300,
              fontSize: 'medium',
              fontWeight: '500',
              itemHeight: 36
            },
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
                autoSaveInterval: 5
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
            }
        };

        // Apply reset settings
        applyAllSettings(); // Use the new function

        // Clear localStorage
        localStorage.removeItem('datagrid_settings');

        showToast('All settings have been reset to defaults', 'success');
    }
}

/**
 * Exports current settings to JSON file
 */
function exportSettings() {
    const settingsData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        settings: state.settings
    };

    const dataStr = JSON.stringify(settingsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `datamodel-explorer-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Settings exported successfully', 'success');
}

/**
 * Imports settings from JSON file
 * @param {Event} event - File input change event
 */
function importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (importedData.settings) {
                state.settings = { ...state.settings, ...importedData.settings };
                saveAllSettings();
                showToast('Settings imported successfully', 'success');
                setMode(state.mode, true);
                // Reload the settings modal to show imported values
                const activeTab = document.querySelector('.settings-tab.active').dataset.tab;
                renderSettingsContent(activeTab);                
            } else {
                showToast('Invalid settings file format', 'error');
            }
        } catch (error) {
            console.error('Error importing settings:', error);
            showToast('Error importing settings file', 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

/**
 * Applies behavior settings changes
 */
function applyBehaviorSettings() {
    state.settings.behavior = state.settings.behavior || {};
    
    // Get toast settings
    const toastDuration = parseInt(document.getElementById('setting-toastDuration')?.value || 3500);
    const toastPosition = document.getElementById('setting-toastPosition')?.value || 'bottom-right';
    const toastAnimation = document.getElementById('setting-toastAnimation')?.value || 'fade';
    const showSuccessToasts = document.getElementById('setting-showSuccessToasts')?.checked ?? true;
    const showInfoToasts = document.getElementById('setting-showInfoToasts')?.checked ?? true;
    const showWarningToasts = document.getElementById('setting-showWarningToasts')?.checked ?? true;
    const showErrorToasts = document.getElementById('setting-showErrorToasts')?.checked ?? true;
    const toastSoundEnabled = document.getElementById('setting-toastSoundEnabled')?.checked ?? false;
    
    // Get toast colors
    const toastSuccessColor = document.getElementById('setting-toastSuccessColor')?.value || '#10b981';
    const toastErrorColor = document.getElementById('setting-toastErrorColor')?.value || '#ef4444';
    const toastWarningColor = document.getElementById('setting-toastWarningColor')?.value || '#f59e0b';
    const toastInfoColor = document.getElementById('setting-toastInfoColor')?.value || '#3b82f6';
    const toastTextColor = document.getElementById('setting-toastTextColor')?.value || '#ffffff';
    const toastBorderColor = document.getElementById('setting-toastBorderColor')?.value || 'rgba(255, 255, 255, 0.1)';
    const toastShadow = document.getElementById('setting-toastShadow')?.value || '0 4px 12px rgba(0, 0, 0, 0.15)';
    
    // Update state
    state.settings.behavior = {
        ...state.settings.behavior,
        toastDuration,
        toastPosition,
        toastAnimation,
        showSuccessToasts,
        showInfoToasts,
        showWarningToasts,
        showErrorToasts,
        toastSoundEnabled,
        toastSuccessColor,
        toastErrorColor,
        toastWarningColor,
        toastInfoColor,
        toastTextColor,
        toastBorderColor,
        toastShadow
    };
    
    // Apply toast position
    const toastContainer = document.getElementById('toastContainer');
    if (toastContainer) {
        // Remove all position classes
        toastContainer.className = 'toast-container';
        toastContainer.classList.add(`toast-${toastPosition}`);
    }
    
    // Setup auto-save if enabled
    const autoSaveInterval = state.settings.behavior.autoSaveInterval || 5;
    if (autoSaveInterval > 0) {
        clearInterval(window.autoSaveInterval);
        window.autoSaveInterval = setInterval(() => {
            saveSettings();
            if (state.settings.behavior.showInfoToasts) {
                showToast('Settings auto-saved', 'info', 1500);
            }
        }, autoSaveInterval * 60000);
    } else {
        clearInterval(window.autoSaveInterval);
    }
    saveSettings();
    showToast('Behavior settings applied', 'success');
}

/**
 * Applies accessibility settings changes
 */
function applyAccessibilitySettings() {
    const current = state.settings.accessibility || {};
    
    const reducedMotion = !!readInputValue('setting-reducedMotion', current.reducedMotion);
    const highContrast = !!readInputValue('setting-highContrast', current.highContrast);
    const alwaysShowFocus = !!readInputValue('setting-alwaysShowFocus', current.alwaysShowFocus);
    const logicalTabOrder = !!readInputValue('setting-logicalTabOrder', current.logicalTabOrder !== false);
    const screenReaderSupport = !!readInputValue('setting-screenReaderSupport', current.screenReaderSupport);
    const fontSizeMultiplier = parseInt(readInputValue('setting-fontSizeMultiplier', String(current.fontSizeMultiplier || 100)), 10) || 100;
    const lineHeight = parseFloat(readInputValue('setting-lineHeight', String(current.lineHeight || 1.5))) || 1.5;
    const letterSpacing = parseFloat(readInputValue('setting-letterSpacing', String(current.letterSpacing || 0))) || 0;
    const underlineLinks = !!readInputValue('setting-underlineLinks', current.underlineLinks);
    
    state.settings.accessibility = {
        reducedMotion,
        highContrast,
        alwaysShowFocus,
        logicalTabOrder,
        screenReaderSupport,
        fontSizeMultiplier,
        lineHeight,
        letterSpacing,
        underlineLinks
    };
    
    // Apply accessibility styles
    const root = document.documentElement;
    const body = document.body;
    
    if (reducedMotion) {
        body.classList.add('reduced-motion');
    } else {
        body.classList.remove('reduced-motion');
    }
    
    if (highContrast) {
        body.classList.add('high-contrast');
    } else {
        body.classList.remove('high-contrast');
    }
    
    if (alwaysShowFocus) {
        body.classList.add('always-show-focus');
    } else {
        body.classList.remove('always-show-focus');
    }
    
    root.style.setProperty('--font-size-multiplier', `${fontSizeMultiplier}%`);
    root.style.setProperty('--line-height', lineHeight);
    root.style.setProperty('--letter-spacing', `${letterSpacing}em`);
    
    if (underlineLinks) {
        body.classList.add('underline-links');
    } else {
        body.classList.remove('underline-links');
    }
    
    saveSettings();
    showToast('Accessibility settings applied', 'success');
}

/**
 * Apply icon settings
 */
function applyIconSettings() {
    state.settings.icons = state.settings.icons || {};
    
    // Get values
    const iconSet = document.getElementById('setting-iconSet');
    const iconSize = document.getElementById('setting-iconSize');
    const iconColorSource = document.getElementById('setting-iconColorSource');
    const iconCustomColor = document.getElementById('setting-iconCustomColor');
    const iconAnimation = document.getElementById('setting-iconAnimation');
    const buttonIconSize = document.getElementById('setting-buttonIconSize');
    const toolbarIconSize = document.getElementById('setting-toolbarIconSize');
    const showIconTooltips = document.getElementById('setting-showIconTooltips');
    const iconLoadingAnimation = document.getElementById('setting-iconLoadingAnimation');
    const successIconColor = document.getElementById('setting-successIconColor');
    const errorIconColor = document.getElementById('setting-errorIconColor');
    const warningIconColor = document.getElementById('setting-warningIconColor');
    const infoIconColor = document.getElementById('setting-infoIconColor');
    
    // Update state
    if (iconSet) state.settings.icons.iconSet = iconSet.value;
    if (iconSize) state.settings.icons.iconSize = iconSize.value;
    if (iconColorSource) state.settings.icons.iconColorSource = iconColorSource.value;
    if (iconCustomColor) state.settings.icons.iconCustomColor = iconCustomColor.value;
    if (iconAnimation) state.settings.icons.iconAnimation = iconAnimation.value;
    if (buttonIconSize) state.settings.icons.buttonIconSize = parseInt(buttonIconSize.value, 10);
    if (toolbarIconSize) state.settings.icons.toolbarIconSize = parseInt(toolbarIconSize.value, 10);
    if (showIconTooltips) state.settings.icons.showIconTooltips = showIconTooltips.checked;
    if (iconLoadingAnimation) state.settings.icons.iconLoadingAnimation = iconLoadingAnimation.checked;
    if (successIconColor) state.settings.icons.successIconColor = successIconColor.value;
    if (errorIconColor) state.settings.icons.errorIconColor = errorIconColor.value;
    if (warningIconColor) state.settings.icons.warningIconColor = warningIconColor.value;
    if (infoIconColor) state.settings.icons.infoIconColor = infoIconColor.value;
    
    // Apply settings
    applyIconStyleSettings();
    
    saveSettings();
    showToast('Icon settings applied', 'success');
}

/**
 * Apply icon style settings
 */
function applyIconStyleSettings() {
    const icons = state.settings.icons || {};
    
    // Set CSS variables
    const root = document.documentElement;
    
    // Icon size mapping
    const sizeMap = { small: '12px', medium: '14px', large: '16px', xlarge: '18px' };
    const iconSize = sizeMap[icons.iconSize] || '14px';
    root.style.setProperty('--icon-size', iconSize);
    
    // Button icon size
    root.style.setProperty('--button-icon-size', `${icons.buttonIconSize || 16}px`);
    
    // Toolbar icon size
    root.style.setProperty('--toolbar-icon-size', `${icons.toolbarIconSize || 18}px`);
    
    // Icon colors
    if (icons.iconColorSource === 'custom' && icons.iconCustomColor) {
        root.style.setProperty('--icon-color', icons.iconCustomColor);
    } else if (icons.iconColorSource === 'text') {
        root.style.setProperty('--icon-color', 'var(--text-primary)');
    } else {
        root.style.setProperty('--icon-color', 'var(--accent)');
    }
    
    // Specific icon colors
    if (icons.successIconColor) root.style.setProperty('--icon-success-color', icons.successIconColor);
    if (icons.errorIconColor) root.style.setProperty('--icon-error-color', icons.errorIconColor);
    if (icons.warningIconColor) root.style.setProperty('--icon-warning-color', icons.warningIconColor);
    if (icons.infoIconColor) root.style.setProperty('--icon-info-color', icons.infoIconColor);
    
    // Load appropriate icon set
    loadIconSet(icons.iconSet || 'fontawesome');
}

/**
 * Load icon set dynamically
 */
function loadIconSet(iconSet) {
    // Remove existing icon stylesheets
    document.querySelectorAll('link[rel="stylesheet"][href*="icon"]').forEach(link => link.remove());
    
    switch(iconSet) {
        case 'fontawesome-regular':
            // Load Font Awesome Regular
            const faRegular = document.createElement('link');
            faRegular.rel = 'stylesheet';
            faRegular.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/regular.min.css';
            document.head.appendChild(faRegular);
            break;
            
        case 'fontawesome-light':
            // Load Font Awesome Light
            const faLight = document.createElement('link');
            faLight.rel = 'stylesheet';
            faLight.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/light.min.css';
            document.head.appendChild(faLight);
            break;
            
        case 'material':
            // Load Material Icons
            const material = document.createElement('link');
            material.rel = 'stylesheet';
            material.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
            document.head.appendChild(material);
            break;
            
        case 'bootstrap':
            // Load Bootstrap Icons
            const bootstrap = document.createElement('link');
            bootstrap.rel = 'stylesheet';
            bootstrap.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css';
            document.head.appendChild(bootstrap);
            break;
            
        default:
            // Default Font Awesome Solid (already loaded in HTML)
            break;
    }
}

/**
 * Reset icon settings
 */
function resetIconSettings() {
    if (confirm('Reset icon settings to defaults?')) {
        state.settings.icons = {
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
        };
        
        renderSettingsContent('icons');
        applyIconStyleSettings();
        saveSettings();
        showToast('Icon settings reset to defaults', 'success');
    }
}

/**
 * Apply ALL settings including behavior and accessibility
 */

/**
 * Apply ALL settings at once (for after loading from storage)
 */
function applyAllSettings() {    
    try {
        
        // Apply left panel settings
        if (typeof applyLeftPanelStyleSettings === 'function') {
            applyLeftPanelStyleSettings();
        } else {
            console.warn('applyLeftPanelStyleSettings function not found');
        }

        // Use the comprehensive helper function
        applyAllSettingsFromState();
        
        showToast('All settings applied successfully', 'success', 2000);
    } catch (error) {
        console.error('Error applying settings:', error);
        showToast('Error applying some settings', 'error');
    }
}

/**
 * Apply general settings from state (no DOM dependency)
 */
function applyGeneralSettingsFromState() {
    const settings = state.settings.general || {};
    
    // Apply theme
    if (settings.theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        state.darkMode = prefersDark;
    } else {
        state.darkMode = settings.theme === 'dark';
    }
    document.body.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
    
    // Apply row height
    if (settings.rowHeight) {
        state.rowHeight = settings.rowHeight;
    }
    
    // Apply font size
    const fontSizeMap = { small: '12px', medium: '13px', large: '14px' };
    if (settings.fontSize) {
        document.documentElement.style.setProperty('--font-size-medium', fontSizeMap[settings.fontSize] || '13px');
    }
}


/**
 * Records a new shortcut for an action
 */
let recordingShortcut = null;
let recordingTimeout = null;

function recordShortcut(action) {
    recordingShortcut = action;
    const input = document.getElementById(`shortcut-${action}`);
    input.value = 'Press any key combination...';
    input.classList.add('recording');
    
    // Clear any existing timeout
    if (recordingTimeout) {
        clearTimeout(recordingTimeout);
    }
    
    // Set timeout to automatically cancel recording after 5 seconds
    recordingTimeout = setTimeout(() => {
        if (recordingShortcut === action) {
            input.value = state.settings.shortcuts[action] || '';
            input.classList.remove('recording');
            recordingShortcut = null;
            showToast('Shortcut recording timed out', 'warning');
        }
    }, 5000);
    
    const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Don't process if we're not recording this action
        if (recordingShortcut !== action) return;
        
        // Check for Escape key to cancel
        if (e.key === 'Escape') {
            input.value = state.settings.shortcuts[action] || '';
            input.classList.remove('recording');
            document.removeEventListener('keydown', handler, true);
            document.removeEventListener('keyup', keyUpHandler, true);
            recordingShortcut = null;
            clearTimeout(recordingTimeout);
            return;
        }
        
        // Don't process modifier-only keydown events
        if (e.key === 'Control' || e.key === 'Shift' || e.key === 'Alt' || 
            e.key === 'Meta' || e.key === 'AltGraph') {
            return;
        }
        
        // Build shortcut string
        const parts = [];
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.shiftKey) parts.push('Shift');
        if (e.altKey) parts.push('Alt');
        if (e.metaKey) parts.push('Cmd');
        
        // Add the key
        let key = e.key;
        if (key.length === 1) {
            key = key.toUpperCase();
        } else if (key.startsWith('Arrow')) {
            key = key.replace('Arrow', '').charAt(0).toUpperCase() + 
                   key.replace('Arrow', '').slice(1).toLowerCase();
        } else if (key.startsWith('F') && key.length > 1) {
            // Keep function keys as is (F1, F2, etc.)
        } else {
            // Handle special keys
            const specialKeys = {
                ' ': 'Space',
                'Escape': 'Esc',
                'Enter': 'Enter',
                'Tab': 'Tab',
                'Backspace': 'Backspace',
                'Delete': 'Delete',
                'Insert': 'Insert',
                'Home': 'Home',
                'End': 'End',
                'PageUp': 'PageUp',
                'PageDown': 'PageDown',
                'CapsLock': 'CapsLock',
                'NumLock': 'NumLock',
                'ScrollLock': 'ScrollLock',
                'Pause': 'Pause',
                'ContextMenu': 'Menu',
                '`': '`',
                '~': '~',
                '!': '!',
                '@': '@',
                '#': '#',
                '$': '$',
                '%': '%',
                '^': '^',
                '&': '&',
                '*': '*',
                '(': '(',
                ')': ')',
                '-': '-',
                '_': '_',
                '=': '=',
                '+': '+',
                '[': '[',
                ']': ']',
                '{': '{',
                '}': '}',
                '\\': '\\',
                '|': '|',
                ';': ';',
                ':': ':',
                "'": "'",
                '"': '"',
                ',': ',',
                '<': '<',
                '.': '.',
                '>': '>',
                '/': '/',
                '?': '?'
            };
            
            key = specialKeys[key] || key.toLowerCase();
        }
        
        // Don't add duplicate modifiers
        if (!parts.includes(key)) {
            parts.push(key);
        }
        
        // Update input
        input.value = parts.join('+');
        input.classList.remove('recording');
        
        // Remove listeners
        document.removeEventListener('keydown', handler, true);
        document.removeEventListener('keyup', keyUpHandler, true);
        recordingShortcut = null;
        clearTimeout(recordingTimeout);
    };
    
    // Additional handler for keyup to detect modifier releases
    const keyUpHandler = (e) => {
        if (recordingShortcut !== action) return;
        
        // If all modifiers are released, maybe we want to record just the key?
        // This is optional, but can help with certain combinations
    };
    
    document.addEventListener('keydown', handler, true);
    document.addEventListener('keyup', keyUpHandler, true);
}

/**
 * Improved shortcut matching function
 */
function matchesShortcut(e, shortcutString) {
    if (!shortcutString) return false;
    
    const parts = shortcutString.toLowerCase().split('+');
    const required = {
        ctrl: parts.includes('ctrl'),
        shift: parts.includes('shift'),
        alt: parts.includes('alt'),
        meta: parts.includes('cmd') || parts.includes('meta'),
        key: parts.find(p => !['ctrl', 'shift', 'alt', 'cmd', 'meta'].includes(p))
    };
    
    if (!required.key) return false;
    
    // Normalize event key
    let eventKey = e.key.toLowerCase();
    if (eventKey.length === 1) eventKey = eventKey.toUpperCase();
    
    // Handle special key mappings
    const keyMap = {
        'arrowup': 'up',
        'arrowdown': 'down',
        'arrowleft': 'left',
        'arrowright': 'right',
        ' ': 'space',
        'escape': 'esc',
        'enter': 'enter',
        'tab': 'tab',
        'backspace': 'backspace',
        'delete': 'delete',
        'insert': 'insert',
        'home': 'home',
        'end': 'end',
        'pageup': 'pageup',
        'pagedown': 'pagedown',
        'capslock': 'capslock',
        'numlock': 'numlock',
        'scrolllock': 'scrolllock',
        'pause': 'pause',
        'contextmenu': 'menu'
    };
    
    const normalizedEventKey = keyMap[eventKey] || eventKey;
    const normalizedRequiredKey = keyMap[required.key] || required.key;
    
    // Check modifiers
    const ctrlMatch = required.ctrl === (e.ctrlKey || e.metaKey); // Meta on Mac
    const shiftMatch = required.shift === e.shiftKey;
    const altMatch = required.alt === e.altKey;
    const metaMatch = required.meta === e.metaKey;
    
    // Check key (case-insensitive)
    const keyMatch = normalizedEventKey === normalizedRequiredKey.toLowerCase() || 
                     normalizedEventKey === normalizedRequiredKey.toUpperCase();
    
    return ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch;
}

/**
 * Resets a single shortcut to default
 */
function resetShortcut(action) {
    const defaults = {
        'focus-search': 'Ctrl+F',
        'toggle-left-panel': 'Ctrl+L',
        'toggle-sidebar': 'Ctrl+B',
        'toggle-theme': 'Ctrl+D',
        'toggle-fullscreen': 'F11',
        'export-data': 'Ctrl+E',
        'copy-selected': 'Ctrl+C',
        'show-settings': 'Ctrl+,',
        'show-help': 'Ctrl+/',
        'navigate-up': 'ArrowUp',
        'navigate-down': 'ArrowDown',
        'navigate-left': 'ArrowLeft',
        'navigate-right': 'ArrowRight',
        'page-up': 'PageUp',
        'page-down': 'PageDown',
        'home': 'Home',
        'end': 'End',
        'show-diagram': 'Ctrl+G',
        'zoom-in': 'Ctrl+Plus',
        'zoom-out': 'Ctrl+Minus',
        'zoom-reset': 'Ctrl+0',
        'zoom-fit': 'Ctrl+1',
        'pan-left': 'ArrowLeft+Shift',
        'pan-right': 'ArrowRight+Shift',
        'pan-up': 'ArrowUp+Shift',
        'pan-down': 'ArrowDown+Shift'
    };
    
    const input = document.getElementById(`shortcut-${action}`);
    input.value = defaults[action] || '';
}

/**
 * Resets all shortcuts to defaults
 */
function resetAllShortcuts() {
    if (confirm('Are you sure you want to reset all shortcuts to their default values?')) {
        const defaults = {
            'focus-search': 'Ctrl+F',
            'toggle-left-panel': 'Ctrl+L',
            'toggle-sidebar': 'Ctrl+B',
            'toggle-theme': 'Ctrl+D',
            'toggle-fullscreen': 'F11',
            'export-data': 'Ctrl+E',
            'copy-selected': 'Ctrl+C',
            'show-settings': 'Ctrl+,',
            'show-help': 'Ctrl+/',
            'navigate-up': 'ArrowUp',
            'navigate-down': 'ArrowDown',
            'navigate-left': 'ArrowLeft',
            'navigate-right': 'ArrowRight',
            'page-up': 'PageUp',
            'page-down': 'PageDown',
            'home': 'Home',
            'end': 'End',
            'show-diagram': 'Ctrl+G',
            'zoom-in': 'Ctrl+Plus',
            'zoom-out': 'Ctrl+Minus',
            'zoom-reset': 'Ctrl+0',
            'zoom-fit': 'Ctrl+1',
            'pan-left': 'ArrowLeft+Shift',
            'pan-right': 'ArrowRight+Shift',
            'pan-up': 'ArrowUp+Shift',
            'pan-down': 'ArrowDown+Shift'
        };
        
        Object.keys(defaults).forEach(action => {
            const input = document.getElementById(`shortcut-${action}`);
            if (input) {
                input.value = defaults[action];
            }
        });
        
        showToast('All shortcuts reset to defaults', 'info');
    }
}

/**
 * Applies shortcut settings
 */
function applyShortcutSettings(readFromDOM = false) {
    // Update behavior settings
    state.settings.behavior = state.settings.behavior || {};
    
    // Only read from DOM if elements exist (when settings modal is open)
    if (readFromDOM) {
        // Update shortcut configuration from DOM if available
        const newShortcuts = {};
        const inputs = document.querySelectorAll('.shortcut-input');
        
        inputs.forEach(input => {
            const action = input.dataset.action;
            const value = input.value.trim();
            if (value) {
                newShortcuts[action] = value;
            }
        });
        
        state.settings.shortcuts = newShortcuts;
        
        // Update behavior settings from DOM if available
        const shortcutsEnabledEl = document.getElementById('setting-shortcutsEnabled');
        const showShortcutHintsEl = document.getElementById('setting-showShortcutHints');
        const shortcutOverlayEl = document.getElementById('setting-shortcutOverlay');
        
        if (shortcutsEnabledEl) {
            state.settings.behavior.keyboardShortcutsEnabled = shortcutsEnabledEl.checked;
        }
        if (showShortcutHintsEl) {
            state.settings.behavior.showShortcutHints = showShortcutHintsEl.checked;
        }
        if (shortcutOverlayEl) {
            state.settings.behavior.shortcutOverlay = shortcutOverlayEl.checked;
        }
        
        saveSettings();
        showToast('Keyboard shortcut settings applied', 'success');
    } else {
        // Just apply the settings from state (no DOM interaction)
    }
    
    // Always try to reinitialize keyboard shortcuts
    if (typeof setupKeyboardShortcuts === 'function') {
        setupKeyboardShortcuts();
    }
}

/**
 * Handle global keyboard shortcuts
 */
function handleGlobalKeyboardShortcut(e) {
    // If the user is typing in an input/textarea/contenteditable, don't intercept
    // plain navigation keys (like ArrowLeft/ArrowRight) so cursor can move normally.
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
        // If no modifier keys are pressed, allow default behavior (do not handle globally)
        if (!e.ctrlKey && !e.metaKey && !e.altKey) return;
        // If modifier keys are present, fall through to allow shortcuts like Ctrl+Arrow
    }
    const shortcuts = state.settings.shortcuts || {};
    
    // Check each shortcut
    for (const [action, shortcut] of Object.entries(shortcuts)) {
        if (matchesShortcut(e, shortcut)) {
            e.preventDefault();
            e.stopPropagation();

            // Execute the corresponding action
            executeShortcutAction(action);
            return;
        }
    }
}

/**
 * Execute shortcut action
 */
function executeShortcutAction(action) {    
    switch(action) {
        case 'focus-search':
            const searchInput = document.getElementById('globalSearch');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
            break;
            
        case 'toggle-left-panel':
            toggleLeftPanel();
            break;
            
        case 'toggle-sidebar':
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                if (sidebar.classList.contains('open')) {
                    closeSidebar();
                } else {
                    openSidebar();
                }
            }
            break;
            
        case 'toggle-theme':
            toggleTheme();
            break;
            
        case 'toggle-fullscreen':
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
            break;
            
        case 'export-data':
            exportToExcel();
            break;
            
        case 'copy-selected':
            copySelectedRows();
            break;
            
        case 'show-settings':
            showSettingsModal();
            break;
            
        case 'show-help':
            showHelpModal();
            break;
            
        case 'show-diagram':
            // Try to show diagram for selected entity/table (use active selection)
            let idx = -1;
            if (state.selectedRowIndex >= 0 && state.selectedRowIndex < state.viewData.length) idx = state.selectedRowIndex;
            else if (Array.isArray(state.selectedRowIndexes) && state.selectedRowIndexes.length > 0) idx = state.selectedRowIndexes[0];
            if (idx >= 0 && idx < state.viewData.length) {
                const selectedRow = state.viewData[idx];
                if (state.mode === 'CDM' && selectedRow._parentEntity) {
                    const entity = selectedRow._parentEntity;
                    const diagrams = entity.Diagrams || [];
                    if (diagrams.length > 0) {
                        showCDMDiagramModal(diagrams[0].name, entity.Model);
                    }
                } else if (state.mode === 'PDM' && selectedRow._parentTable) {
                    const table = selectedRow._parentTable;
                    const diagrams = table.Diagrams || [];
                    if (diagrams.length > 0) {
                        showPDMDiagramModal(diagrams[0].name, table.Model);
                    }
                }
            }
            break;
            
        default:
    }
}

/**
 * Apply toast color settings
 */
function applyToastSettings() {
    state.settings.behavior = state.settings.behavior || {};
    
    // Get toast color values
    const toastSuccessColor = document.getElementById('setting-toastSuccessColor');
    const toastErrorColor = document.getElementById('setting-toastErrorColor');
    const toastWarningColor = document.getElementById('setting-toastWarningColor');
    const toastInfoColor = document.getElementById('setting-toastInfoColor');
    const toastTextColor = document.getElementById('setting-toastTextColor');
    const toastBorderColor = document.getElementById('setting-toastBorderColor');
    const toastShadow = document.getElementById('setting-toastShadow');
    
    // Update state
    if (toastSuccessColor) state.settings.behavior.toastSuccessColor = toastSuccessColor.value;
    if (toastErrorColor) state.settings.behavior.toastErrorColor = toastErrorColor.value;
    if (toastWarningColor) state.settings.behavior.toastWarningColor = toastWarningColor.value;
    if (toastInfoColor) state.settings.behavior.toastInfoColor = toastInfoColor.value;
    if (toastTextColor) state.settings.behavior.toastTextColor = toastTextColor.value;
    if (toastBorderColor) state.settings.behavior.toastBorderColor = toastBorderColor.value;
    if (toastShadow) state.settings.behavior.toastShadow = toastShadow.value;
    
    // Apply toast styles
    applyToastStyleSettings();
    
    saveSettings();
}

/**
 * Apply toast style settings
 */
function applyToastStyleSettings() {
    const behavior = state.settings.behavior || {};
    const root = document.documentElement;
    
    // Set CSS variables for toast colors
    if (behavior.toastSuccessColor) {
        root.style.setProperty('--toast-success-color', behavior.toastSuccessColor);
    }
    if (behavior.toastErrorColor) {
        root.style.setProperty('--toast-error-color', behavior.toastErrorColor);
    }
    if (behavior.toastWarningColor) {
        root.style.setProperty('--toast-warning-color', behavior.toastWarningColor);
    }
    if (behavior.toastInfoColor) {
        root.style.setProperty('--toast-info-color', behavior.toastInfoColor);
    }
    if (behavior.toastTextColor) {
        root.style.setProperty('--toast-text-color', behavior.toastTextColor);
    }
    if (behavior.toastBorderColor) {
        root.style.setProperty('--toast-border-color', behavior.toastBorderColor);
    }
    if (behavior.toastShadow) {
        root.style.setProperty('--toast-shadow', behavior.toastShadow);
    }
}

/**
 * Apply CDM settings from state
 */
function applyCDMSettingsFromState() {
    const settings = state.settings.cdm || {};
    
    if (state.mode === 'CDM') {
        // Apply visibility
        state.cdmColumns.forEach(col => {
            col.visible = settings.defaultColumns?.includes(col.id) ?? col.visible;
            col.frozen = settings.frozenColumns?.includes(col.id) ?? col.frozen;
        });
        
        // Apply order if available
        if (settings.columnOrder && settings.columnOrder.length) {
            const byId = new Map(state.cdmColumns.map(c => [c.id, c]));
            state.cdmColumns = settings.columnOrder.map(id => byId.get(id)).filter(Boolean);
        }
        
        state.columns = [...state.cdmColumns];
    }
}

/**
 * Apply PDM settings from state
 */
function applyPDMSettingsFromState() {
    const settings = state.settings.pdm || {};
    
    if (state.mode === 'PDM') {
        // Apply visibility
        state.pdmColumns.forEach(col => {
            col.visible = settings.defaultColumns?.includes(col.id) ?? col.visible;
            col.frozen = settings.frozenColumns?.includes(col.id) ?? col.frozen;
        });
        
        // Apply order if available
        if (settings.columnOrder && settings.columnOrder.length) {
            const byId = new Map(state.pdmColumns.map(c => [c.id, c]));
            state.pdmColumns = settings.columnOrder.map(id => byId.get(id)).filter(Boolean);
        }
        
        state.columns = [...state.pdmColumns];
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
    
    // Apply dimensions
    if (settings.headerHeight) root.style.setProperty('--header-height', `${settings.headerHeight}px`);
    if (settings.borderRadius) root.style.setProperty('--border-radius', `${settings.borderRadius}px`);
    if (settings.rowHeight) {
        state.rowHeight = settings.rowHeight;
        root.style.setProperty('--row-height', `${settings.rowHeight}px`);
    }
    
    // Apply typography
    if (settings.fontFamily) {
        root.style.setProperty('--font-family', settings.fontFamily);
        document.body.style.fontFamily = settings.fontFamily;
    }
    if (settings.fontSizeScale) root.style.setProperty('--font-size-scale', `${settings.fontSizeScale}%`);
    
}

/**
 * Apply left panel settings from state
 */
function applyLeftPanelSettingsFromState() {
    const settings = state.settings.leftPanel || {};
    const root = document.documentElement;
    
    // Apply width
    const width = settings.leftPanelWidth || 300;
    root.style.setProperty('--left-panel-width', `${width}px`);
    
    // Apply font size
    const fontSizeMap = { small: '12px', medium: '13px', large: '14px' };
    if (settings.fontSize) {
        root.style.setProperty('--left-panel-font-size', fontSizeMap[settings.fontSize] || '13px');
    }
    
    // Apply font weight
    if (settings.fontWeight) {
        root.style.setProperty('--left-panel-font-weight', settings.fontWeight);
    }
    
    // Apply item height
    if (settings.itemHeight) {
        root.style.setProperty('--left-panel-item-height', `${settings.itemHeight}px`);
    }
    
    // Update left panel if open
    const leftPanel = document.getElementById('leftPanel');
    if (leftPanel && leftPanel.classList.contains('open')) {
        populateLeftPanel();
    }
}

/**
 * Apply diagram settings from state
 */
function applyDiagramSettingsFromState() {
    // Settings are applied when diagram is opened
}

/**
 * Apply behavior settings from state
 */
function applyBehaviorSettingsFromState() {
    const settings = state.settings.behavior || {};
    const root = document.documentElement;
    
    // Apply toast colors
    if (settings.toastSuccessColor) root.style.setProperty('--toast-success-color', settings.toastSuccessColor);
    if (settings.toastErrorColor) root.style.setProperty('--toast-error-color', settings.toastErrorColor);
    if (settings.toastWarningColor) root.style.setProperty('--toast-warning-color', settings.toastWarningColor);
    if (settings.toastInfoColor) root.style.setProperty('--toast-info-color', settings.toastInfoColor);
    if (settings.toastTextColor) root.style.setProperty('--toast-text-color', settings.toastTextColor);
    if (settings.toastBorderColor) root.style.setProperty('--toast-border-color', settings.toastBorderColor);
    if (settings.toastShadow) root.style.setProperty('--toast-shadow', settings.toastShadow);    
}

/**
 * Apply accessibility settings from state
 */
function applyAccessibilitySettingsFromState() {
    const settings = state.settings.accessibility || {};
    const root = document.documentElement;
    const body = document.body;
    
    // Apply reduced motion
    if (settings.reducedMotion) {
        body.classList.add('reduced-motion');
    } else {
        body.classList.remove('reduced-motion');
    }
    
    // Apply high contrast
    if (settings.highContrast) {
        body.classList.add('high-contrast');
    } else {
        body.classList.remove('high-contrast');
    }
    
    // Apply font scaling
    if (settings.fontSizeMultiplier) {
        root.style.setProperty('--font-size-multiplier', `${settings.fontSizeMultiplier}%`);
    }
    
    if (settings.lineHeight) {
        root.style.setProperty('--line-height', settings.lineHeight);
    }    
}

/**
 * Apply icon settings from state
 */
function applyIconSettingsFromState() {
    const settings = state.settings.icons || {};
    const root = document.documentElement;
    
    // Apply icon sizes
    if (settings.buttonIconSize) {
        root.style.setProperty('--button-icon-size', `${settings.buttonIconSize}px`);
    }
    
    if (settings.toolbarIconSize) {
        root.style.setProperty('--toolbar-icon-size', `${settings.toolbarIconSize}px`);
    }
    
    // Apply icon colors
    if (settings.successIconColor) root.style.setProperty('--icon-success-color', settings.successIconColor);
    if (settings.errorIconColor) root.style.setProperty('--icon-error-color', settings.errorIconColor);
    if (settings.warningIconColor) root.style.setProperty('--icon-warning-color', settings.warningIconColor);
    if (settings.infoIconColor) root.style.setProperty('--icon-info-color', settings.infoIconColor);    
}

/**
 * Apply toast settings from state
 */
function applyToastSettingsFromState() {
    const settings = state.settings.behavior || {};
    const root = document.documentElement;
    
    // Apply toast colors
    if (settings.toastSuccessColor) root.style.setProperty('--toast-success-color', settings.toastSuccessColor);
    if (settings.toastErrorColor) root.style.setProperty('--toast-error-color', settings.toastErrorColor);
    if (settings.toastWarningColor) root.style.setProperty('--toast-warning-color', settings.toastWarningColor);
    if (settings.toastInfoColor) root.style.setProperty('--toast-info-color', settings.toastInfoColor);
    if (settings.toastTextColor) root.style.setProperty('--toast-text-color', settings.toastTextColor);
    if (settings.toastBorderColor) root.style.setProperty('--toast-border-color', settings.toastBorderColor);
    if (settings.toastShadow) root.style.setProperty('--toast-shadow', settings.toastShadow);    
}

/**
 * Shows the settings modal with all configuration options
 */
function showSettingsModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal-box';
    
    modal.innerHTML = `
        <div class="modal-header">
            <div class="title"><i class="fa-solid fa-gear"></i> Application Settings</div>
            <button class="modal-close">&times;</button>
        </div>
        <div class="settings-tabs" id="settingsTabs">
            <div class="settings-tab active" data-tab="general">General</div>
            <div class="settings-tab" data-tab="cdm">CDM</div>
            <div class="settings-tab" data-tab="pdm">PDM</div>
            <div class="settings-tab" data-tab="appearance">Appearance</div>            
            <div class="settings-tab" data-tab="leftpanel">Left Panel</div>
            <div class="settings-tab" data-tab="diagram"><i class= "fa-solid fa-sitemap"></i> Diagram</div>
            <div class="settings-tab" data-tab="behavior"><i class="fa-solid fa-bell"></i> Behavior</div>
            <div class="settings-tab" data-tab="accessibility">
                <i class="fa-solid fa-universal-access"></i> Accessibility
            </div>
            <div class="settings-tab" data-tab="shortcuts"><i class="fa-solid fa-keyboard"></i> Keyboard shortchut</div>
            <div class="settings-tab" data-tab="icons">Icons</div>
            <div class="settings-tab" data-tab="reset">Reset</div>
        </div>
        <div id="settingsContent"></div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Wait for DOM to be updated before accessing elements
    setTimeout(() => {
        renderSettingsContent('general');
    }, 0);

    // Tab switching
    modal.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            modal.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderSettingsContent(tab.dataset.tab);
        });
    });

    // Close handlers
    modal.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { 
        if (e.target === overlay) overlay.remove(); 
    });
}

/**
 * Reset model order to alphabetical
 */
function resetModelOrder() {
  if (confirm('Reset model order to alphabetical? This will remove your custom ordering.')) {
    const mode = state.mode;
    
    // Clear saved order
    if (state.settings.leftPanel) {
      if (mode === 'CDM') {
        state.settings.leftPanel.modelOrderCDM = [];
      } else {
        state.settings.leftPanel.modelOrderPDM = [];
      }
    }
    
    // Re-populate left panel with alphabetical order
    const leftPanelContent = document.getElementById('leftPanelContent');
    if (leftPanelContent) {
      populateLeftPanel();
    }
    
    saveSettings();
    showToast('Model order reset to alphabetical', 'success');
  }
}