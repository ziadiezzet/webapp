// =========================================================================================|
// MODULE: SEARCHING & AUTOCOMPLETE & SORTING & COPY & EXPORT & COLUMNS-TOGGLE & FULLSCREEN=|
// =========================================================================================|

/***************************************
 * Updates the mode switcher button UI *
 ***************************************/
 
function updateModeSwitcherUI(mode, badgeText, iconClass, modeClass) {
    const switcher = els.modeSwitcher;
    const modeText = switcher.querySelector('.mode-text');
    const modeIcon = switcher.querySelector('.mode-icon');
    const modeBadge = switcher.querySelector('.mode-badge');
    
    modeText.textContent = mode;
    modeBadge.textContent = badgeText;
    modeIcon.className = `fa-solid ${iconClass} mode-icon`;
    
    switcher.className = `mode-switcher ${modeClass}`;
}

/**
 * Tags a value in the search input for quick filtering
 * @param {string} columnName - Column name to search in
 * @param {string} value - Value to search for
 */
function tagSearch(columnName, evalue) {
	let value = decodeString(evalue);
    if (!value) return;
    
    const searchInput = document.getElementById('globalSearch');
    
    // Clear any existing search
    searchInput.value = '';
    
    // Set the new search with column tag
    searchInput.value = `^${value}\\.`;
    
    // Trigger the search
    handleSearch(searchInput.value);
    
    // Focus the search input
    searchInput.focus();
    
    showToast(`Searching for [${columnName}] ${value}`, 'info');
}

/**
 * Filters grid data based on search text with regex support
 */
function handleSearch(text) {
    state.filterText = text;
    state.scrollTop = 0;
    els.gridViewport.scrollTop = 0;
    
    if (!text) {
        state.viewData = [...state.allData];
    } else {
        // Regex to detect [Column Name] SearchString
        const colMatch = text.match(/^\[([^\]]+)\]\s*(.*)$/);
        
        let shouldUseGlobalSearch = true;
        let searchTerm = text;
        
        if (colMatch) {
            const colName = colMatch[1];
            const term = colMatch[2].trim();
            
            // Find the column
            const targetCol = state.columns.find(c => 
                c.name.toLowerCase() === colName.toLowerCase() || 
                c.id.toLowerCase() === colName.toLowerCase()
            );
            
            if (targetCol && term) {
                // Column exists and has search term - do column-specific search
                shouldUseGlobalSearch = false;
                searchTerm = term;
                
                let regex;
                try { 
                    regex = new RegExp(term, 'i'); 
                }
                catch(e) { 
                    regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); 
                }
                
                state.viewData = state.allData.filter(row => {
                    const val = String(row[targetCol.id] || '');
                    return regex.test(val);
                });
            } else if (targetCol && !term) {
                // Column exists but no search term - show all rows
                shouldUseGlobalSearch = false;
                state.viewData = [...state.allData];
            }
            // If column doesn't exist, keep shouldUseGlobalSearch = true and use full text
        }
        
        // If we should use global search (either no column prefix or column not found)
        if (shouldUseGlobalSearch) {
            let regex;
            let text2 = text.replace("(", "\\(");
            let text3 = text2.replace(")", "\\)");
            let text4 = text3.replace("[", "\\[");
            let text5 = text4.replace("]", "\\]");
            try { 
                regex = new RegExp(text5, 'i'); 
            } 
            catch(e) { 
                regex = new RegExp(text5.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); 
            }
            
            state.viewData = state.allData.filter(row => {
                return state.columns.some(col => {
                    if (!col.visible) return false;
                    const val = String(row[col.id] || '');
                    return regex.test(val);
                });
            });
        }
    }
    updateCounter(); 
    updateGridMetrics(); 
    renderVirtualRows();
}

/**
 * Sets up autocomplete functionality for search input
 */
function setupAutocompleteListeners() {
    const input = els.searchInput;
    
    // Input event for typing
    input.addEventListener('input', (e) => {
        const val = input.value;
        const cursor = input.selectionStart;
        
        // Find if we are typing inside a bracket: "[M..."
        const lastOpen = val.lastIndexOf('[', cursor - 1);
        const lastClose = val.lastIndexOf(']', cursor - 1);

        // If we have an open bracket that hasn't been closed yet before the cursor
        if (lastOpen !== -1 && lastOpen > lastClose) {
            const query = val.substring(lastOpen + 1, cursor);
            showAutocomplete(query);
        } else {
            closeAutocomplete();
            handleSearch(val);
        }
    });

    // Keyboard navigation (Up/Down/Enter)
    input.addEventListener('keydown', (e) => {
        const list = els.autocompleteList;
        if (list.style.display === 'block') {
            const items = list.getElementsByClassName('autocomplete-item');
            if (e.key === 'ArrowDown') {
                state.currentFocus++;
                addActive(items);
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                state.currentFocus--;
                addActive(items);
                e.preventDefault();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (state.currentFocus > -1) {
                    if (items[state.currentFocus]) items[state.currentFocus].click();
                }
            } else if (e.key === 'Escape') {
                closeAutocomplete();
            }
        }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== els.autocompleteList) {
            closeAutocomplete();
        }
    });
}

/**
 * Shows autocomplete suggestions for column names
 */
function showAutocomplete(filter) {
    const list = els.autocompleteList;
    list.innerHTML = '';
    state.currentFocus = -1;

    // Filter columns that contain the typed text
    const matches = state.columns.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));

    if (matches.length === 0) {
        closeAutocomplete();
        return;
    }

    matches.forEach(col => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        // Highlight matching part
        const regex = new RegExp(`(${filter})`, 'gi');
        const highlighted = col.name.replace(regex, '<strong>$1</strong>');
        
        item.innerHTML = `<span>${highlighted}</span>`;
        item.addEventListener('click', () => {
            applyAutocomplete(col.name);
        });
        list.appendChild(item);
    });

    list.style.display = 'block';
}

/**
 * Updates active item in autocomplete list
 */
function addActive(items) {
    if (!items) return;
    removeActive(items);
    if (state.currentFocus >= items.length) state.currentFocus = 0;
    if (state.currentFocus < 0) state.currentFocus = items.length - 1;
    items[state.currentFocus].classList.add('autocomplete-active');
    items[state.currentFocus].scrollIntoView({ block: 'nearest' });
}

/**
 * Removes active state from all autocomplete items
 */
function removeActive(items) {
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('autocomplete-active');
    }
}

/**
 * Closes autocomplete dropdown
 */
function closeAutocomplete() {
    els.autocompleteList.innerHTML = '';
    els.autocompleteList.style.display = 'none';
    state.currentFocus = -1;
}

/**
 * Applies selected autocomplete value to search input
 */
function applyAutocomplete(colName) {
    const input = els.searchInput;
    const val = input.value;
    const cursor = input.selectionStart;
    const lastOpen = val.lastIndexOf('[', cursor - 1);
    
    const before = val.substring(0, lastOpen);
    const after = val.substring(cursor);
    
    // Construct new value: ... [ColumnName] ... 
    const newValue = `${before}[${colName}] ${after}`;
    input.value = newValue;
    input.focus();
    
    // Move cursor to end of inserted tag
    const newPos = before.length + colName.length + 3; 
    input.setSelectionRange(newPos, newPos);
    
    closeAutocomplete();
    handleSearch(newValue);
}


/**
 * Sorts grid data by specified column
 */

const comparators = {
  Creation_date: (a, b) => new Date(a||0) - new Date(b||0),
  Modification_date: (a, b) => new Date(a||0) - new Date(b||0),
  Mandatory: (a,b) => (a?1:0) - (b?1:0),
};

function handleSort(colId) {
  if (isResizing) return;
  state.sortAsc = state.sortCol === colId ? !state.sortAsc : true;
  state.sortCol = colId;
  const cmp = comparators[colId] || ((x,y)=>String(x||'').localeCompare(String(y||'')));
  state.viewData.sort((r1,r2) => {
    const res = cmp(r1[colId], r2[colId]);
    return state.sortAsc ? res : -res;
  });
  renderHeaders(); renderVirtualRows();
}

// ==================================================================
// MODULE: EXPORT & CLIPBOARD
// ==================================================================

/**
 * Escapes HTML special characters to prevent XSS
 */

function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

/**
 * Removes HTML tags from string
 */
function stripHtml(input) {
    if (input === null || input === undefined) return '';
    return String(input).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, '').replace(/\r?\n/g, ' ');
}

/**
 * Builds delimited text from rows
 */
function buildDelimited(rows, sep, includeHeader = true) {
    const cols = getVisibleColumns();
    const lines = [];
    if (includeHeader) {
        lines.push(cols.map(c => escapeField(c.name, sep)).join(sep));
    }
    rows.forEach(r => {
        const vals = cols.map(c => {
            let v = r[c.id];
            if (v === null || v === undefined) v = '';
            v = stripHtml(v);
            return escapeField(String(v), sep);
        });
        lines.push(vals.join(sep));
    });
    return lines.join('\n');
}

/**
 * Copies text to clipboard
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        return true;
    } catch (e) { console.error('copy failed', e); return false; }
}

/**
 * Copies visible rows as specified format
 */
async function copyVisibleAs(sep, includeHeader) {
    const text = buildDelimited(state.viewData, sep, includeHeader);
    const ok = await copyToClipboard(text);
    showToast(ok ? 'Copied to clipboard' : 'Copy failed', ok ? 'success' : 'error');
}

/**
 * Copies selected row as specified format
 */
async function copySelectedAs(sep, includeHeader) {
    // Support multiple selected rows
    const sel = Array.isArray(state.selectedRowIndexes) && state.selectedRowIndexes.length > 0 ? state.selectedRowIndexes : (state.selectedRowIndex >= 0 ? [state.selectedRowIndex] : []);
    if (sel.length === 0) { showToast('No row selected', 'error'); return; }
    const rows = sel.map(i => state.viewData[i]).filter(Boolean);
    const text = buildDelimited(rows, sep, includeHeader);
    const ok = await copyToClipboard(text);
    showToast(ok ? 'Copied to clipboard' : 'Copy failed', ok ? 'success' : 'error');
}

/**
 * Copies visible rows as HTML table
 */
async function copyVisibleAsHTML() {
    const cols = getVisibleColumns();
    let html = '<table><thead><tr>';
    cols.forEach(c => html += `<th>${escapeHtml(c.name)}</th>`);
    html += '</tr></thead><tbody>';
    state.viewData.forEach(r => {
        html += '<tr>';
        cols.forEach(c => {
            let v = r[c.id];
            if (v === null || v === undefined) v = '';
            v = stripHtml(v);
            html += `<td>${escapeHtml(String(v))}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';
    const ok = await copyToClipboard(html);
    showToast(ok ? 'Copied HTML to clipboard' : 'Copy failed', ok ? 'success' : 'error');
}

/**
 * Copies selected row as HTML table
 */
async function copySelectedAsHTML() {
    // Support multiple selected rows
    const sel = Array.isArray(state.selectedRowIndexes) && state.selectedRowIndexes.length > 0 ? state.selectedRowIndexes : (state.selectedRowIndex >= 0 ? [state.selectedRowIndex] : []);
    if (sel.length === 0) { showToast('No row selected', 'error'); return; }
    const cols = getVisibleColumns();
    let html = '<table><thead><tr>';
    cols.forEach(c => html += `<th>${escapeHtml(c.name)}</th>`);
    html += '</tr></thead><tbody>';
    sel.forEach(idx => {
        const r = state.viewData[idx];
        if (!r) return;
        html += '<tr>';
        cols.forEach(c => {
            let v = r[c.id];
            if (v === null || v === undefined) v = '';
            v = stripHtml(v);
            html += `<td>${escapeHtml(String(v))}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';
    const ok = await copyToClipboard(html);
    showToast(ok ? 'Copied HTML to clipboard' : 'Copy failed', ok ? 'success' : 'error');
}

/**
 * Copies currently selected rows (multi or single) as CSV to clipboard
 */
async function copySelectedRows() {
    const sel = Array.isArray(state.selectedRowIndexes) && state.selectedRowIndexes.length > 0 ? state.selectedRowIndexes : (state.selectedRowIndex >= 0 ? [state.selectedRowIndex] : []);
    if (sel.length === 0) { showToast('No row selected', 'error'); return; }
    const rows = sel.map(i => state.viewData[i]).filter(Boolean);
    const text = buildDelimited(rows, ',', true);
    const ok = await copyToClipboard(text);
    showToast(ok ? 'Copied to clipboard' : 'Copy failed', ok ? 'success' : 'error');
}

/**
 * Escapes field values for CSV/TSV
 */
function escapeField(value, sep) {
    if (sep === '\t') return value.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
    const mustQuote = value.indexOf(',') >= 0 || value.indexOf('\n') >= 0 || value.indexOf('"') >= 0 || value.indexOf('\r') >= 0;
    let out = value.replace(/\r/g, '').replace(/\n/g, ' ').replace(/"/g, '""');
    if (mustQuote) out = '"' + out + '"';
    return out;
}

/**
 * Downloads data as CSV file
 */
function downloadCSV(data, sep) {
    // Use the current viewData (filtered/sorted data) instead of passed data
    const exportData = state.viewData;
    const text = buildDelimited(exportData, sep, true);
    const blob = new Blob([text], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datamodel-${state.mode.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`CSV exported with ${exportData.length} rows`, 'success');
}

/**
 * Toggles between light and dark themes
 */
function toggleTheme() {
    state.darkMode = !state.darkMode;
    document.body.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
    saveSettings();
    showToast(`${state.darkMode ? 'Dark' : 'Light'} theme activated`, 'info');
}

/**
 * Toggles fullscreen mode
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// ==================================================================
// MODULE: MAPPING STATISTICS
// ==================================================================

/**
 * Calculates mapping statistics for all entities
 */
function calculateMappingStats() {
    const stats = {};
    let totalEntities = 0;
    let totalAttributes = 0;
    let totalMappedAttributes = 0;
    
    if (state.mode === 'CDM') {
        // Process CDM entities
        state.cdmData.forEach(entity => {
            const attributes = Array.isArray(entity.Attributes) ? entity.Attributes : [];
            const total = attributes.length;
            
            // Count mapped attributes (Mapping field is not empty/null)
            const mapped = attributes.filter(attr => {
                const mapping = attr.Mapping || attr.mapping;
                return mapping && mapping.trim() !== '';
            }).length;
            
            const percentage = total > 0 ? Math.round((mapped / total) * 100) : 0;
            
            stats[entity.Name] = {
                entityName: entity.Name,
                model: entity.Model,
                totalAttributes: total,
                mappedAttributes: mapped,
                percentage: percentage,
                attributes: attributes // Store for potential drill-down
            };
            
            totalEntities++;
            totalAttributes += total;
            totalMappedAttributes += mapped;
        });
    } else {
        // Process PDM tables
        state.pdmData.forEach(table => {
            const columns = Array.isArray(table.Columns) ? table.Columns : [];
            const total = columns.length;
            
            // For PDM, you might want to use different criteria for mapping
            // For example: columns with Foreign Key or specific flags
            const mapped = columns.filter(col => {
                // Adjust this logic based on what "mapped" means for PDM
                return col.FK || col.Index || col.AK; // Example criteria
            }).length;
            
            const percentage = total > 0 ? Math.round((mapped / total) * 100) : 0;
            
            stats[table.Name] = {
                entityName: table.Name,
                model: table.Model,
                totalAttributes: total,
                mappedAttributes: mapped,
                percentage: percentage,
                attributes: columns
            };
            
            totalEntities++;
            totalAttributes += total;
            totalMappedAttributes += mapped;
        });
    }
    
    // Calculate overall average
    const avgPercentage = totalAttributes > 0 ? 
        Math.round((totalMappedAttributes / totalAttributes) * 100) : 0;
    
    return {
        stats: stats,
        totalEntities: totalEntities,
        totalAttributes: totalAttributes,
        totalMappedAttributes: totalMappedAttributes,
        avgPercentage: avgPercentage
    };
}

/**
 * Opens the mapping statistics modal
 */
function openMappingStatsModal() {
    const modal = document.getElementById('mappingStatsModal');
    if (!modal) return;
    
    // Calculate statistics
    const mappingStats = calculateMappingStats();
    
    // Update summary
    document.getElementById('totalEntitiesCount').textContent = 
        `${mappingStats.totalEntities} entities`;
    document.getElementById('avgMapping').textContent = 
        `Average: ${mappingStats.avgPercentage}%`;
    
    // Render table
    renderMappingStatsTable(mappingStats.stats);
    
    // Show modal
    modal.classList.add('modal-open');
    
    // Focus search input
    setTimeout(() => {
        document.getElementById('mappingSearch').focus();
    }, 100);
    
    showToast('Mapping statistics loaded', 'info');
}

/**
 * Renders the mapping statistics table
 */
function renderMappingStatsTable(stats, filter = 'all', searchTerm = '') {
    const tbody = document.getElementById('mappingStatsBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Convert stats object to array and sort by percentage (descending)
    let statsArray = Object.values(stats);
    
    // Apply search filter
    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        statsArray = statsArray.filter(item =>
            item.entityName.toLowerCase().includes(searchLower) ||
            item.model.toLowerCase().includes(searchLower) ||
            item.percentage.toString().includes(searchTerm)
        );
    }
    
    // Apply category filter
    if (filter !== 'all') {
        statsArray = statsArray.filter(item => {
            if (filter === 'unmapped') return item.percentage === 0;
            if (filter === 'partial') return item.percentage > 0 && item.percentage < 100;
            if (filter === 'complete') return item.percentage === 100;
            return true;
        });
    }
    
    // Sort by percentage (descending)
    statsArray.sort((a, b) => b.percentage - a.percentage);
    
    // Render rows
    statsArray.forEach(item => {
        const row = document.createElement('tr');
        
        // Determine progress bar class based on percentage
        let progressClass = 'partial';
        if (item.percentage === 0) progressClass = 'unmapped';
        if (item.percentage === 100) progressClass = 'complete';
        
        row.innerHTML = `
            <td>
                <strong>${escapeHtml(item.entityName)}</strong>
                <div class="entity-model">${escapeHtml(item.model)}</div>
            </td>
            <td>
                <span class="mapping-percentage">${item.percentage}%</span>
                <div class="mapping-progress ${progressClass}">
                    <div class="mapping-progress-fill" style="width: ${item.percentage}%"></div>
                </div>
            </td>
            <td>${item.mappedAttributes}</td>
            <td>${item.totalAttributes}</td>
            <td>
                <button class="entity-tag" onclick="viewEntityDetails('${escapeHtml(item.entityName)}')">
                    <i class="fa-solid fa-eye"></i> View
                </button>
                <button class="entity-tag" onclick="searchEntity('${escapeHtml(item.entityName)}')">
                    <i class="fa-solid fa-search"></i> Search
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Update filter buttons
    updateFilterButtons(filter);
}

/**
 * Updates active filter button state
 */
function updateFilterButtons(activeFilter) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        if (btn.dataset.filter === activeFilter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Closes the mapping statistics modal
 */
function closeMappingStatsModal() {
    const modal = document.getElementById('mappingStatsModal');
    if (modal) {
        modal.classList.remove('modal-open');
    }
}

/**
 * Exports mapping statistics as CSV (filtered/visible rows only)
 */
function exportMappingStats() {
    const mappingStats = calculateMappingStats();
    let statsArray = Object.values(mappingStats.stats);
    
    // Get current filter and search term
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    const searchTerm = document.getElementById('mappingSearch').value;
    
    // Apply the same filters that are currently active in the modal
    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        statsArray = statsArray.filter(item =>
            item.entityName.toLowerCase().includes(searchLower) ||
            item.model.toLowerCase().includes(searchLower) ||
            item.percentage.toString().includes(searchTerm)
        );
    }
    
    // Apply category filter
    if (activeFilter !== 'all') {
        statsArray = statsArray.filter(item => {
            if (activeFilter === 'unmapped') return item.percentage === 0;
            if (activeFilter === 'partial') return item.percentage > 0 && item.percentage < 100;
            if (activeFilter === 'complete') return item.percentage === 100;
            return true;
        });
    }
    
    // Sort by percentage descending (same as displayed)
    statsArray.sort((a, b) => b.percentage - a.percentage);
    
    // Create CSV content with visible/filtered rows only
    const headers = ['Entity', 'Model', 'Mapping %', 'Mapped Attributes', 'Total Attributes'];
    const rows = statsArray.map(item => [
        item.entityName,
        item.model,
        `${item.percentage}%`,
        item.mappedAttributes,
        item.totalAttributes
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${escapeFieldForCSV(cell)}"`).join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    const filterText = activeFilter !== 'all' ? `-${activeFilter}` : '';
    const searchText = searchTerm ? `-search` : '';
    a.href = url;
    a.download = `mapping-stats-${state.mode}${filterText}${searchText}-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${statsArray.length} filtered entities`, 'success');
}

/**
 * Escape field for CSV (more robust)
 */
function escapeFieldForCSV(value) {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    
    // Replace any existing quotes with double quotes
    const escapedValue = stringValue.replace(/"/g, '""');
    
    // Check if we need quotes
    const needsQuotes = stringValue.includes(',') || 
                       stringValue.includes('\n') || 
                       stringValue.includes('\r') || 
                       stringValue.includes('"') ||
                       stringValue.trim() !== stringValue;
    
    return needsQuotes ? `"${escapedValue}"` : escapedValue;
}

/**
 * Searches for a specific entity in the main grid
 */
function searchEntity(entityName) {
    closeMappingStatsModal();
    
    // Focus search input
    const searchInput = document.getElementById('globalSearch');
    searchInput.value = `[${state.mode === 'CDM' ? 'CDM' : 'Table'}]^${entityName}\\.`;
    
    // Trigger search
    handleSearch(searchInput.value);
    searchInput.focus();
    
    showToast(`Searching for ${entityName}`, 'info');
}

/**
 * Views entity details in sidebar
 */
function viewEntityDetails(entityName) {
    closeMappingStatsModal();
    
    // Find the entity in the data
    const dataSource = state.mode === 'CDM' ? state.cdmData : state.pdmData;
    const entity = dataSource.find(item => item.Name === entityName);
    if (entity) {
        // Select the entity in the left panel (if function exists)
        if (typeof selectEntityInLeftPanel === 'function') {
            selectEntityInLeftPanel(entityName);
        }
        handleLeftPanelItemClick(this, encodeString(entity));
        // Try to open sidebar with entity details
        //if (typeof showSidebar === 'function') {
            //showSidebar();
            // You might need to trigger the row selection
            const rowIndex = state.viewData.findIndex(row => 
                row._parentEntity?.Name === entityName || 
                row._parentTable?.Name === entityName
            );
            //if (rowIndex !== -1) {
            //    selectRow(rowIndex);
            //}            
        //}
        
        openSidebar(state.viewData[rowIndex]);
        showToast(`Viewing details for ${entityName}`, 'info');
    } else {
        showToast(`Entity ${entityName} not found`, 'error');
    }
}

// Event listener setup for mapping stats modal
function setupMappingStatsModal() {
    // Button click to open modal
    const mappingStatsBtn = document.getElementById('mappingStatsBtn');
    if (mappingStatsBtn) {
        mappingStatsBtn.addEventListener('click', openMappingStatsModal);
    }
    
    // Search input filtering
    const mappingSearch = document.getElementById('mappingSearch');
    if (mappingSearch) {
        mappingSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
            const stats = calculateMappingStats().stats;
            renderMappingStatsTable(stats, activeFilter, searchTerm);
        });
    }
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.dataset.filter;
            const searchTerm = document.getElementById('mappingSearch').value;
            const stats = calculateMappingStats().stats;
            renderMappingStatsTable(stats, filter, searchTerm);
        });
    });
    
    // Sort indicator click
    const sortIndicator = document.querySelector('.sort-indicator');
    if (sortIndicator) {
        sortIndicator.addEventListener('click', () => {
            // You could implement sorting by different columns here
            const currentSort = sortIndicator.dataset.sort;
            // Toggle between asc/desc for percentage
            // Implementation depends on your needs
        });
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('mappingStatsModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeMappingStatsModal();
            }
        });
    }
    
    // Close with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('modal-open')) {
            closeMappingStatsModal();
        }
    });
}

// Add to your existing setup function
document.addEventListener('DOMContentLoaded', () => {
    // Add this after other setup calls
    if (typeof setupMappingStatsModal === 'function') {
        setupMappingStatsModal();
    }
});