
// ==================================================================
// MODULE: UI INTERACTION - SIDEBAR & MODALS (PATCHED)
// ==================================================================

// ----------------- Diagram helpers -----------------
const isX = v => v === true || String(v).toUpperCase() === 'X' || v === '1';

function computeCentroid(nodes) {
  const xs = nodes.map(n => n.posX), ys = nodes.map(n => n.posY);
  return { cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

/* Existing functions (kept) */

function toggleColMenu() {
  const menu = els.colMenu;
  if (menu.style.display === 'block') { menu.style.display = 'none'; return; }

  // Position menu under button
  const btn = document.getElementById('btnCols');
  const r = btn.getBoundingClientRect();
  menu.style.top = `${r.bottom + 5-42}px`;
  menu.style.left = `${r.left-49}px`;
  menu.innerHTML = '';
  menu.style.display = 'block';

  const list = document.createElement('div');
  list.className = 'col-menu-list';

  state.columns.forEach(col => {
    const item = document.createElement('label');
    item.className = 'col-menu-item';
    item.innerHTML = `
      <input type="checkbox" ${col.visible ? 'checked' : ''} />
      <span>${escapeHtml(col.name)}</span>
    `;
    const cb = item.querySelector('input');
    cb.addEventListener('change', () => {
      col.visible = cb.checked;
      // persist default visible columns per mode
      const key = (state.mode === 'CDM') ? 'cdm' : 'pdm';
      const vis = state.columns.filter(c => c.visible).map(c => c.id);
      state.settings[key] = state.settings[key] || {};
      state.settings[key].defaultColumns = vis;
      saveSettings();

      renderHeaders(); updateGridMetrics(); renderVirtualRows();
    });
    list.appendChild(item);
  });

  menu.appendChild(list);
}

function toggleCopyMenu(buttonEl) {
  const menu = els.copyMenu;
  if (menu.style.display === 'block') { menu.style.display = 'none'; return; }
  const btnRect = buttonEl.getBoundingClientRect();
  menu.style.top = `${btnRect.bottom + 5-7}px`;
  menu.style.left = `${btnRect.left-5}px`;
  menu.style.display = 'block';
}

function showHelpModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const modal = document.createElement('div');
  modal.className = 'modal-box';

  // Build shortcuts table dynamically from settings
  const shortcuts = (state && state.settings && state.settings.shortcuts) ? state.settings.shortcuts : {};

  // Friendly labels and optional descriptions for well-known actions
  const known = {
    'focus-search': ['Global Search', 'Focus the search bar. Supports RegExp.'],
    'export-data': ['Export CSV', 'Download current view as CSV.'],
    'toggle-theme': ['Toggle Theme', 'Switch between Dark and Light mode.'],
    'toggle-mode': ['Toggle Mode', 'Switch between CDM and PDM modes.'],
    'toggle-settings': ['Toggle Settings', 'Open settings modal.'],
    'show-help': ['Toggle Help', 'Open this help menu.'],
    'toggle-left-panel': ['Toggle Left Panel', 'Show/hide entities/tables panel.'],
    'copy-selected': ['Copy Selected', 'Copy selected rows to clipboard.'],
    'show-diagram': ['Show Diagram', 'Open diagram viewer for current selection.']
  };

  function prettyAction(key) {
    if (known[key]) return known[key][0];
    return key.replace(/[-_]/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
  }
  function actionDesc(key) { return (known[key] && known[key][1]) ? known[key][1] : ''; }

  const rows = Object.keys(shortcuts).sort().map(action => {
    const k = shortcuts[action];
    return `<tr><td>${escapeHtml(prettyAction(action))}</td><td>${escapeHtml(String(k))}</td><td>${escapeHtml(actionDesc(action))}</td></tr>`;
  }).join('');

  modal.innerHTML = `
    <div class="modal-header">
      <div class="title"><i class="fa-solid fa-circle-question"></i> Help & Shortcuts</div>
      <button class="modal-close">×</button>
    </div>
    <div>
      <p>Welcome to Data Model Explorer. Below are the features and keyboard shortcuts (from your settings).</p>
      <table class="modal-table">
        <tr><th>Action</th><th>Shortcut</th><th>Description</th></tr>
        ${rows}
      </table>
    </div>`;

  overlay.appendChild(modal);

  // Append overlay inside the fullscreen host if present, otherwise to body
  const hostEl = (document.fullscreenElement || document.body).appendChild(overlay);

  // Ensure overlay sits above everything
  overlay.style.position = 'fixed';
  overlay.style.zIndex = '2147483647';
  overlay.style.inset = '0';

  modal.querySelector('.modal-close').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

function showParentEntityDetails(entityEncoded, entityData) {
  try {
    let entityName = decodeString(entityEncoded);
    const cleanEntityName = entityName;
    let entity = state.cdmData.find(e => (e.Name && e.Name.toLowerCase() === cleanEntityName.toLowerCase()) ||
                                            (e.name && e.name.toLowerCase() === cleanEntityName.toLowerCase()));
    if (!entity && entityData) entity = entityData;
    if (!entity) {
      entity = state.cdmData.find(e => (e.Name && e.Name.toLowerCase().includes(cleanEntityName.toLowerCase())) ||
                                           (e.name && e.name.toLowerCase().includes(cleanEntityName.toLowerCase())));
    }
    if (!entity) { showToast(`Entity "${cleanEntityName}" not found in data`, 'error'); return; }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal-box';

    const attributes = entity.Attributes || entity.attributes || [];
    const stereotypeClass = getStereotypeColorClass(entity.Stereotype);

    modal.innerHTML = `
      <div class="modal-header">
        <div class="title"><span class="detail-label">Entity:</span> <i onclick="showEntityInSidebar('${encodeString(entity.Name)}')">${escapeHtml(entity.Name || entity.name || cleanEntityName)}</i></div>
        <button class="modal-close">×</button>
      </div><hr>
      ${ (entity.Mapping || entity.mapping) ? `<div style="margin-bottom:8px"><b><span class="detail-label">Mapping:</span> </b><a href="#" onclick="showPDMMappingModal('${encodeString(entity.Mapping)}')">${escapeHtml(entity.Mapping || entity.mapping)}</a></div>` : ''}
      <hr>${ (entity.Comment || entity.comment) ? `<div style="margin-bottom:8px"><b><span class="detail-label">Comment: </span></b><i>${escapeHtml(entity.Comment || entity.comment)}</i></div>` : ''}
      <hr>${ entity.Stereotype ? `<div style="margin-bottom:8px"><span class="detail-label">Stereotype:</span> <span class="entity-box ${stereotypeClass}">${escapeHtml(entity.Stereotype)}</span></div>` : ''}
      <div class="overview-section">
        <div class="overview-title">Attributes (${attributes.length})</div>
        ${attributes.length > 0 ? `
          <table class="modal-table">
            <tr><th>Name</th><th>Datatype</th><th>M</th><th>PK</th><th>BI</th><th>Mapping</th><th>Description</th></tr>
            ${attributes.map(attr => {
              const isPrimary = (attr.Primary === 'X' || attr.primary === 'X' || attr.Primary === true);
              const isMandatory = (attr.Mandatory === 'X' || attr.mandatory === 'X' || attr.Mandatory === true || attr.mandatory === true);
              const isBI = (attr.Identifier === 'X' || attr.identifier === 'X');
              return `<tr>
                <td>${escapeHtml(attr.Name || attr.name || '')}</td>
                <td>${escapeHtml(attr.Datatype || attr.datatype || '')}</td>
                <td>${isMandatory ? '✓' : ''}</td>
                <td>${isPrimary ? '✓' : ''}</td>
                <td>${isBI ? '✓' : ''}</td>
                <td>${escapeHtml(attr.Mapping || attr.mapping || '')}</td>
                <td>${escapeHtml(attr.Description || attr.description || '')}</td>
              </tr>`;
            }).join('')}
          </table>` : `<div>No attributes defined</div>`}
      </div>`;

    overlay.appendChild(modal);
    
    // Append overlay inside the fullscreen host if present, otherwise to body
    const hostEl = (document.fullscreenElement || document.body).appendChild(overlay);

    // (optional but recommended) make sure overlay sits above everything:
    overlay.style.position = 'fixed';
    overlay.style.zIndex = '2147483647'; // max z-index
    overlay.style.inset = '0';           // cover fullscreen element

    modal.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    showToast(`Showing details for ${entity.Name || entity.name || cleanEntityName}`, 'info');
  } catch (error) {
    console.error('Error showing parent entity details:', error);
    showToast('Failed to load entity details', 'error');
  }
}

function showPDMMappingModal(tmp) {
  let mappingValue = decodeString(tmp); 
  try {
    const tableCodes = mappingValue.split(/[\n,;"]\s*/).map(code => code.trim()).filter(Boolean);
    const matchingTables = [];
    const notFoundTables = [];
    tableCodes.forEach(code => {
      const table = state.pdmData.find(t => t.Code && t.Code.toLowerCase() === code.toLowerCase());
      if (table) matchingTables.push(table); else notFoundTables.push(code);
    });
    if (!matchingTables.length) { showToast(`No PDM tables found for: ${tableCodes.join(', ')}`, 'error'); return; }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal-box';
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `<div class="title">PDM Table Details: ${matchingTables.length} table(s) found</div><button class="modal-close">×</button>`;
    modal.appendChild(header);

    if (notFoundTables.length) {
      const warningDiv = document.createElement('div');
      warningDiv.style.cssText = 'background:#fef3cd;border:1px solid #fde68a;border-radius:6px;padding:10px;margin-bottom:15px;color:#92400e;font-size:12px;';
      warningDiv.innerHTML = `Warning: The following tables were not found: ${notFoundTables.join(', ')}`;
      modal.appendChild(warningDiv);
    }

    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'pdm-tabs';
    const contentContainer = document.createElement('div');
    contentContainer.style.position = 'relative';

    matchingTables.forEach((table, index) => {
      const tab = document.createElement('div');
      tab.className = `pdm-tab ${index === 0 ? 'active' : ''}`;
      tab.dataset.tabIndex = index;
      tab.innerHTML = `${escapeHtml(table.Name || table.Code || 'Unknown')}`;
      tab.addEventListener('click', () => {
        tabsContainer.querySelectorAll('.pdm-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        contentContainer.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        const content = contentContainer.querySelector(`.tab-content[data-tab-index="${index}"]`);
        if (content) content.style.display = 'block';
      });
      tabsContainer.appendChild(tab);

      const tableContent = document.createElement('div');
      tableContent.className = 'tab-content';
      tableContent.dataset.tabIndex = index;
      tableContent.style.display = index === 0 ? 'block' : 'none';
      
      let contentHtml = `
        <table class="modal-table">
          <tr><th>Property</th><th>Value</th></tr>
          <tr><td>Model</td><td>${escapeHtml(table.Model || '')}</td></tr>
          <tr><td>Name</td><td>${escapeHtml(table.Name || '')}</td></tr>
          <tr><td>Code</td><td>${escapeHtml(table.Code || '')}</td></tr>
          <tr><td>Comment</td><td>${escapeHtml(table.Comment || '')}</td></tr>
          <tr><td>Stereotype</td><td>${escapeHtml(table.Stereotype || '')}</td></tr>
          <tr><td>Identifier</td><td>${escapeHtml(table.Identifier || '')}</td></tr>
          ${table.Shareable_link ? `<tr><td>Shareable Link</td><td><a href="${table.Shareable_link}" target="_blank" rel="noopener">${escapeHtml(table.Shareable_link)}</a></td></tr>` : ''}
          <tr><td>Creation Date</td><td>${escapeHtml(table.Creation_date || '')}</td></tr>
          <tr><td>Modification Date</td><td>${escapeHtml(table.Modification_date || '')}</td></tr>
          <tr><td>Creator</td><td>${escapeHtml(table.Creator || '')}</td></tr>
          <tr><td>Modifier</td><td>${escapeHtml(table.Modifier || '')}</td></tr>
          <tr><td>Diagrams</td><td>${String(renderDiagramContainersSection(table, 'PDM') || '')}</td></tr>
        </table>`;
      if (table.Columns && table.Columns.length) {
        contentHtml += `
          <div class="overview-section"><div class="overview-title">Columns (${table.Columns.length})</div>
            <table class="modal-table">
              <tr><th>Name</th><th>Code</th><th>Datatype</th><th>Description</th><th>Comment</th><th>Mandatory</th><th>Primary</th><th>Foreign</th><th>Index</th><th>Sequence</th><th>Identifier</th><th>Creation</th><th>Modification</th><th>Creator</th><th>Modifier</th></tr>
              ${table.Columns.map(col => `
                <tr>
                  <td>${escapeHtml(col.Name || '')}</td>
                  <td>${escapeHtml(col.Code || '')}</td>
                  <td>${escapeHtml(col.Datatype || '')}</td>
                  <td>${escapeHtml(col.Description || '')}</td>
                  <td>${escapeHtml(col.Comment || '')}</td>
                  <td>${escapeHtml(col.Mandatory || '')}</td>
                  <td>${escapeHtml(col.Primary || '')}</td>
                  <td>${escapeHtml(col.Foreign || '')}</td>
                  <td>${escapeHtml(col.Index || '')}</td>
                  <td>${escapeHtml(col.Sequence || '')}</td>
                  <td>${escapeHtml(col.Identifier || '')}</td>
                  <td>${escapeHtml(col.Creation_date || '')}</td>
                  <td>${escapeHtml(col.Modification_date || '')}</td>
                  <td>${escapeHtml(col.Creator || '')}</td>
                  <td>${escapeHtml(col.Modifier || '')}</td>
                </tr>`).join('')}
            </table>
          </div>`;
      } else {
        contentHtml += `<div class="overview-section">No columns defined</div>`;
      }
      tableContent.innerHTML = contentHtml;
      contentContainer.appendChild(tableContent);
    });

    modal.appendChild(tabsContainer);
    modal.appendChild(contentContainer);
    overlay.appendChild(modal);
    
  // Append overlay inside the fullscreen host if present, otherwise to body
  const hostEl = (document.fullscreenElement || document.body).appendChild(overlay);

  // (optional but recommended) make sure overlay sits above everything:
  overlay.style.position = 'fixed';
  overlay.style.zIndex = '2147483647'; // max z-index
  overlay.style.inset = '0';           // cover fullscreen element

    header.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    showToast(`Showing ${matchingTables.length} PDM table(s)`, 'info');
  } catch (e) {
    console.error('showPDMMappingModal error', e);
    showToast('Failed to open PDM table details', 'error');
  }
}

/**
 * Shows table modal for PDM table details
 * @param {Object} table - Table object to display
 */
function showTableModal(table) {
    try {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'modal-box';

        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `<div class="title">Table Details: <strong>${escapeHtml(table.Name || table.Code || 'Table')}</strong></div><button class="modal-close">&times;</button>`;
        
        modal.appendChild(header);

        let contentHtml = `
            <div style="margin-bottom: 15px;">
                <table class="modal-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Model</td><td>${escapeHtml(table.Model || '')}</td></tr>
                        <tr><td>Name</td><td>${escapeHtml(table.Name || '')}</td></tr>
                        <tr><td>Code</td><td>${escapeHtml(table.Code || '')}</td></tr>
                        <tr><td>Comment</td><td>${escapeHtml(table.Comment || '')}</td></tr>
                        <tr><td>Stereotype</td><td>${escapeHtml(table.Stereotype || '')}</td></tr>
                        <tr><td>Identifier</td><td>${escapeHtml(table.Identifier || '')}</td></tr>
                        ${table.Shareable_link ? `<tr><td>Shareable Link</td><td><a href="${table.Shareable_link}" target="_blank">${escapeHtml(table.Shareable_link)}</a></td></tr>` : ''}
                        <tr><td>Creation Date</td><td>${escapeHtml(table.Creation_date || '')}</td></tr>
                        <tr><td>Modification Date</td><td>${escapeHtml(table.Modification_date || '')}</td></tr>
                        <tr><td>Creator</td><td>${escapeHtml(table.Creator || '')}</td></tr>
                        <tr><td>Modifier</td><td>${escapeHtml(table.Modifier || '')}</td></tr>
                        <tr><td>Diagrams</td><td>${renderDiagramContainersSection(table, 'PDM')}</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        // Add columns section
        if (table.Columns && table.Columns.length > 0) {
            contentHtml += `
                <div>
                    <strong>Columns (${table.Columns.length})</strong>
                    <table class="modal-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Code</th>
                                <th>Datatype</th>
                                <th>Description</th>
                                <th>Comment</th>
                                <th>Mandatory</th>
                                <th>Primary</th>
                                <th>Unique</th>
                                <th>Foreign</th>
                                <th>Index</th>
                                <th>Sequence</th>
                                <th>Identifier</th>
                                <th>Creation Date</th>
                                <th>Modification Date</th>
                                <th>Creator</th>
                                <th>Modifier</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            table.Columns.forEach(col => {
                contentHtml += `
                    <tr>
                        <td>${escapeHtml(col.Name || '')}</td>
                        <td>${escapeHtml(col.Code || '')}</td>
                        <td>${escapeHtml(col.Datatype || '')}</td>
                        <td>${escapeHtml(col.Description || '')}</td>
                        <td>${escapeHtml(col.Comment || '')}</td>
                        <td>${escapeHtml(col.Mandatory || '')}</td>
                        <td>${escapeHtml(col.Primary || '')}</td>
                        <td>${escapeHtml(col.Unique || '')}</td>
                        <td>${escapeHtml(col.Foreign  || '')}</td>
                        <td>${escapeHtml(col.Index || '')}</td>
                        <td>${escapeHtml(col.Sequence || '')}</td>
                        <td>${escapeHtml(col.Identifier || '')}</td>
                        <td>${escapeHtml(col.Creation_date || '')}</td>
                        <td>${escapeHtml(col.Modification_date || '')}</td>
                        <td>${escapeHtml(col.Creator || '')}</td>
                        <td>${escapeHtml(col.Modifier || '')}</td>
                    </tr>
                `;
            });

            contentHtml += `
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            contentHtml += '<div>No columns defined</div>';
        }

        // Add References section if available
        if (table.References) {
            const references = parsePDMReferences(table.References, table.Name || table.Code || '');
            if (references.length > 0) {
                contentHtml += `
                    <div style="margin-top: 20px;">
                        <strong>Foreign Key References (${references.length})</strong>
                        <table class="modal-table">
                            <thead>
                                <tr>
                                    <th>Relationship</th>
                                    <th>Foreign Key Column</th>
                                    <th>Primary Key Column</th>
                                    <th>Cardinality</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                references.forEach(ref => {
                    const formattedRel = formatRelationship(ref);
                    contentHtml += `
                        <tr>
                            <td>${escapeHtml(formattedRel)}</td>
                            <td>${escapeHtml(ref.fkColumn || '')}</td>
                            <td>${escapeHtml(ref.pkColumn || '')}</td>
                            <td>${escapeHtml(ref.sourceCardinality + ' → ' + ref.targetCardinality)}</td>
                        </tr>
                    `;
                });

                contentHtml += `
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }

        const body = document.createElement('div');
        body.innerHTML = contentHtml;
        modal.appendChild(body);
        overlay.appendChild(modal);
        
        // Append overlay inside the fullscreen host if present, otherwise to body
        const hostEl = (document.fullscreenElement || document.body).appendChild(overlay);

        // (optional but recommended) make sure overlay sits above everything:
        overlay.style.position = 'fixed';
        overlay.style.zIndex = '2147483647'; // max z-index
        overlay.style.inset = '0';           // cover fullscreen element


        header.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        
        showToast(`Viewing details for ${table.Name || table.Code}`, 'info');

    } catch (e) {
        console.error('showTableModal error', e);
        showToast('Failed to open table modal', 'error');
    }
}

/**
 * Find and show table by name in PDM mode
 * @param {string} tableName - Table name to find
 */
function findAndShowTable(tmp) {
    let tableName = decodeString(tmp);
    // First try to find in PDM data
    let table = state.pdmData.find(t => 
        (t.Name && t.Name.toLowerCase() === tableName.toLowerCase()) ||
        (t.Code && t.Code.toLowerCase() === tableName.toLowerCase())
    );
    
    if (table) {
        showTableModal(table);
    } else {
        // If not found in PDM, try CDM entities as fallback
        const entity = state.cdmData.find(e => 
            (e.Name && e.Name.toLowerCase() === tableName.toLowerCase()) ||
            (e.name && e.name.toLowerCase() === tableName.toLowerCase())
        );
        
        if (entity) {
            showParentEntityDetails(tableName, entity);
        } else {
            showToast(`Table/Entity "${tableName}" not found`, 'error');
        }
    }
}
