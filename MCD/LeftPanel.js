// ============================================================
// MODULE: LEFT PANEL - ENTITIES/TABLES TREE GROUPED BY MODEL
// ============================================================

/******************************
 Main Functions for leftPanel *
*******************************/

// Update left panel when mode changes
function updateLeftPanelOnModeChange() {
  const leftPanel = document.getElementById('leftPanel');
  if (!leftPanel) return;

  const toggleBtn = document.getElementById('toggleLeftPanelBtn');
  if (toggleBtn) {
    const icon = toggleBtn.querySelector('i');
    if (icon) icon.className = state.mode === 'CDM' ? 'fa-solid fa-sitemap' : 'fa-solid fa-table';
    const text = toggleBtn.querySelector('.btn-text');
    if (text) text.textContent = state.mode === 'CDM' ? 'Entities' : 'Tables';
  }
  
  // Apply styles first
  applyLeftPanelStyles();
  
  // Use the correct property name
  const defaultState = state.settings.leftPanel?.defaultState || 'closed';
  
  if (defaultState === 'open') {
    openLeftPanel();
  } else if (defaultState === 'closed') {
    closeLeftPanel();
  } else {
    // 'remember' state - check if panel was previously open
    const wasOpen = state.settings.general?.leftPanelDefaultOpen || false;
    if (wasOpen) {
      openLeftPanel();
    } else {
      closeLeftPanel();
    }
  }
}

//  Populates the Left Panel with TREE grouped by Model *
function populateLeftPanel() {
  const leftPanelContent = document.getElementById('leftPanelContent');
  if (!leftPanelContent) return;

  // Apply left panel styles
  applyLeftPanelStyles();

  // Apply left panel width from settings (if present)
  try {
    const leftPanelEl = document.getElementById('leftPanel');
    const lpWidth = state?.settings?.leftPanel?.leftPanelWidth;
    if (leftPanelEl && lpWidth) {
      leftPanelEl.style.width = `${lpWidth}px`;
      document.documentElement.style.setProperty('--left-panel-width', `${lpWidth}px`);
      const gridWrapper = document.querySelector('.grid-wrapper');
      if (gridWrapper && leftPanelEl.classList.contains('open')) {
        gridWrapper.style.marginLeft = `${lpWidth}px`;
      }
    }
  } catch (e) {
    console.warn('Could not apply saved left panel width:', e);
  }
  
  try {
    const isCDM = state.mode === 'CDM';
    const items = isCDM ? (state.cdmData || []) : (state.pdmData || []);
    const title = isCDM ? 'Entities' : 'Tables';
    const lp = state.settings.leftPanel || {};
    
    // Group items by model
    const itemsByModel = {};
    items.forEach(item => {
        const model = item.Model || 'Uncategorized';
        if (!itemsByModel[model]) itemsByModel[model] = [];
        itemsByModel[model].push(item);
    });
    
    // Get sorted models (apply model filtering here)
    let models = Object.keys(itemsByModel).sort();
    
    // Apply model filtering based on settings
    models = filterModelsBySettings(models, state.mode);
    
    // Apply saved model order if enabled
    const settings = state.settings.leftPanel || {};
    if (settings.saveModelOrder) {
        const savedOrder = state.mode === 'CDM' 
            ? (settings.modelOrderCDM || [])
            : (settings.modelOrderPDM || []);
        
        if (savedOrder.length > 0) {
            models = [...new Set([...savedOrder, ...models])].filter(m => models.includes(m));
        }
    }

    // Update panel title: "Models (#)"
    const titleElement = document.getElementById('leftPanelTitle');
    if (titleElement) {
      titleElement.textContent = `Models (${new Set(items.map(i => i.Model || 'N/A')).size})`;
    }

    if (!items || items.length === 0) {
      leftPanelContent.innerHTML = `
        <div style="padding:20px; text-align:center; color: var(--text-secondary);">
          <i class="fa-solid fa-inbox"></i>
          <div style="margin-top:8px; font-size:12px;">No ${title.toLowerCase()} found</div>
        </div>`;
      setupLeftPanelTreeHandlers();
      return;
    }
    
    // Group items by model then filter by the models list (respecting user's selection)
    const allGrouped = groupByModel(items);
    // Keep only models that are present in the filtered `models` array
    let grouped = allGrouped.filter(rec => models.includes(rec.model));
    grouped = applyStoredModelOrder(grouped);

    let html = '<div class="left-panel-tree">';
    grouped.forEach(rec => {
      const showCounts = lp.showCounts !== false; // Default to true
      const modelCount = showCounts ? ` (${rec.items.length})` : '';
      
      // Get relationships data for this model
      const relationshipsData = isCDM ? 
        groupCDMRelationshipsByModel(rec.items) : 
        groupPDMReferencesByModel(rec.items);
      
      const currentModelRelationships = relationshipsData.find(r => r.model === rec.model);
      const relationshipsList = isCDM ? 
        (currentModelRelationships?.relationships || []) : 
        (currentModelRelationships?.references || []);
      
      // Build Modules list (CDM only)
      let modulesHtml = '';
      if (isCDM) {
        const modulesMap = new Map();
        (rec.items || []).forEach(entity => {
          const impacted = entity.ImpactedModules || [];
          impacted.forEach(m => {
            const name = (m.name || m.Name || '').trim();
            if (!name) return;
            const key = name.toLowerCase();
            if (!modulesMap.has(key)) modulesMap.set(key, { name, className: m.ClassName || m.Class || '', comment: m.Comment || m.comment || '', count: 0 });
            modulesMap.get(key).count += 1;
          });
        });
        const modulesArr = Array.from(modulesMap.values()).sort((a,b) => a.name.localeCompare(b.name));
        modulesHtml = `
          <div class="left-panel-item tree-group-header" data-group="modules">
            <div class="left-panel-item-header">
              <div class="left-panel-item-name">
                <span class="tree-toggle"><i class="fa-solid fa-chevron-right"></i></span>
                <i class="fa-solid fa-cubes"></i>&nbsp;Modules${showCounts ? ` (${modulesArr.length})` : ''}
              </div>
            </div>
          </div>
          <div class="tree-subchildren" style="display:none;">
            <ul class="tree-list modules-list">
              ${modulesArr.length ? modulesArr.map(m => `
                <li class="left-panel-item tree-item" data-search-text="${escapeHtml(m.name)}" title="${escapeHtml(m.comment || m.name)}"
                    onclick="event.preventDefault(); showEntitiesByImpactedModule('${escapeHtml(m.name)}', '${escapeHtml(m.className)}', '${encodeString(m.comment || '')}')">
                  <div class="left-panel-item-header">
                    <div class="left-panel-item-name">${escapeHtml(m.name)}</div>
                    ${showCounts ? `<div class="left-panel-count">${m.count} entities</div>` : ''}
                  </div>
                </li>
              `).join('') : `<li class="diagrams-item empty">No modules</li>`}
            </ul>
          </div>
        `;
      }

      // Build Domains list (CDM only)
      let domainsHtml = '';
      if (isCDM) {
        const domainsMap = new Map();
        (rec.items || []).forEach(entity => {
          const attrs = entity.Attributes || [];
          attrs.forEach(a => {
            const d = (a.Domain || a.domain || '').trim();
            if (!d) return;
            const key = d.toLowerCase();
            if (!domainsMap.has(key)) domainsMap.set(key, { name: d, attrCount: 0, entitySet: new Set() });
            const entry = domainsMap.get(key);
            entry.attrCount += 1;
            entry.entitySet.add(entity.Name || entity.name || '');
          });
        });
        const domainsArr = Array.from(domainsMap.values()).sort((a,b) => a.name.localeCompare(b.name));
        domainsHtml = `
          <div class="left-panel-item tree-group-header" data-group="domains">
            <div class="left-panel-item-header">
              <div class="left-panel-item-name">
                <span class="tree-toggle"><i class="fa-solid fa-chevron-right"></i></span>
                <i class="fa-solid fa-tag"></i>&nbsp;Domains${showCounts ? ` (${domainsArr.length})` : ''}
              </div>
            </div>
          </div>
          <div class="tree-subchildren" style="display:none;">
            <ul class="tree-list domains-list">
              ${domainsArr.length ? domainsArr.map(d => `
                <li class="left-panel-item tree-item" data-search-text="${escapeHtml(d.name)}" title="${escapeHtml(d.name)}"
                    onclick="event.preventDefault(); showDomainModal('${encodeString(d.name)}')">
                  <div class="left-panel-item-header">
                    <div class="left-panel-item-name">${escapeHtml(d.name)}</div>
                    ${showCounts ? `<div class="left-panel-count">${d.attrCount} attrs / ${d.entitySet.size} entities</div>` : ''}
                  </div>
                </li>
              `).join('') : `<li class="diagrams-item empty">No domains</li>`}
            </ul>
          </div>
        `;
      }

      // Build Sequences list (PDM only)
      let sequencesHtml = '';
      if (!isCDM) {
        const seqMap = new Map();
        (rec.items || []).forEach(table => {
          const cols = table.Columns || [];
          cols.forEach(col => {
            const seq = (col.Sequence || col.sequence || '').trim();
            if (!seq) return;
            const key = seq.toLowerCase();
            if (!seqMap.has(key)) seqMap.set(key, { name: seq, usages: [] });
            seqMap.get(key).usages.push({ table: table.Code || '', column: col.Code || '' });
          });
        });
        const seqArr = Array.from(seqMap.values()).sort((a,b) => a.name.localeCompare(b.name));
        sequencesHtml = `
          <div class="left-panel-item tree-group-header" data-group="sequences">
            <div class="left-panel-item-header">
              <div class="left-panel-item-name">
                <span class="tree-toggle"><i class="fa-solid fa-chevron-right"></i></span>
                <i class="fa-solid fa-seedling"></i>&nbsp;Sequences${showCounts ? ` (${seqArr.length})` : ''}
              </div>
            </div>
          </div>
          <div class="tree-subchildren" style="display:none;">
            <ul class="tree-list sequences-list">
              ${seqArr.length ? seqArr.map(s => `
                <li class="left-panel-item tree-item" data-search-text="${escapeHtml(s.name)}" title="${escapeHtml(s.name)}"
                    onclick="event.preventDefault(); showSequenceModal('${escapeHtml(s.name)}', '${encodeString(rec.model)}')">
                  <div class="left-panel-item-header">
                    <div class="left-panel-item-name">${escapeHtml(s.name)}</div>
                    ${showCounts ? `<div class="left-panel-count">${s.usages.length} usages</div>` : ''}
                  </div>
                </li>
              `).join('') : `<li class="diagrams-item empty">No sequences</li>`}
            </ul>
          </div>
        `;
      }

      // Build Constraints list (PDM only)
      let constraintsHtml = '';
      if (!isCDM) {
        try {
          const constraintsData = groupPDMConstraintsByModel(rec.items);
          const currentModelConstraints = (constraintsData || []).find(c => c.model === rec.model);
          const constraintsList = currentModelConstraints?.constraints || currentModelConstraints?.constraints || [];
          constraintsHtml = `
            <div class="left-panel-item tree-group-header" data-group="constraints">
              <div class="left-panel-item-header">
                <div class="left-panel-item-name">
                  <span class="tree-toggle"><i class="fa-solid fa-chevron-right"></i></span>
                  <i class="fa-solid fa-key"></i>&nbsp;Constraints${showCounts ? ` (${constraintsList.length})` : ''}
                </div>
              </div>
            </div>
            <div class="tree-subchildren" style="display:none;">
              <ul class="tree-list constraints-list">
                ${
                  constraintsList.length
                    ? constraintsList.map(con => {
                        const cname = escapeHtml(con.name || con.ConstraintName || con.constraintName || 'Unnamed');
                        const tag = formatConstraintTag(con);
                        return `
                          <li class="left-panel-item tree-item constraints-item"
                              data-search-text="${escapeHtml(cname + ' ' + (con.comment || '') )}"
                              onclick="event.stopPropagation(); showConstraintDetailsModalEncoded('${encodeString(JSON.stringify(con))}','${encodeString(rec.model)}')"
                              title="${cname}">
                            <div class="left-panel-item-header">
                              <div class="left-panel-item-name">${cname}</div>
                              <div class="left-panel-count">${tag ? `<span class=\"constraint-badge\">${tag}</span>` : ''}</div>
                            </div>
                          </li>`;
                    }).join('')
                    : `<li class="diagrams-item empty">No constraints</li>`
                }
              </ul>
            </div>`;
        } catch (e) {
          constraintsHtml = '';
        }
      }

      // Build Indexes list (PDM only)
      let indexesHtml = '';
      if (!isCDM) {
        try {
          const indexesData = groupPDMIndexesByModel(rec.items);
          const currentModelIndexes = (indexesData || []).find(i => i.model === rec.model);
          const indexesList = currentModelIndexes?.indexes || [];
          indexesHtml = `
            <div class="left-panel-item tree-group-header" data-group="indexes">
              <div class="left-panel-item-header">
                <div class="left-panel-item-name">
                  <span class="tree-toggle"><i class="fa-solid fa-chevron-right"></i></span>
                  <i class="fa-solid fa-list-ol"></i>&nbsp;Indexes${showCounts ? ` (${indexesList.length})` : ''}
                </div>
              </div>
            </div>
            <div class="tree-subchildren" style="display:none;">
              <ul class="tree-list indexes-list">
                ${
                  indexesList.length
                    ? indexesList.map(idx => {
                        const iname = escapeHtml(idx.name || idx.IndexName || idx.name || 'Unnamed');
                        const colsArr = Array.isArray(idx.columns || idx.Columns) ? (idx.columns || idx.Columns) : (idx.columns || idx.Columns ? [idx.columns || idx.Columns] : []);
                        const cols = colsArr.join(', ');
                        const uniq = idx.unique || idx.Unique || idx.IsUnique ? 'U' : '';
                        return `
                          <li class="left-panel-item tree-item indexes-item"
                              data-search-text="${escapeHtml(iname + ' ' + cols)}"
                              onclick="event.stopPropagation(); showIndexDetailsModalEncoded('${encodeString(JSON.stringify(idx))}','${encodeString(rec.model)}')"
                              title="${iname}">
                            <div class="left-panel-item-header">
                              <div class="left-panel-item-name">${iname}</div>
                              <div class="left-panel-count">${uniq ? `<span class=\"index-badge\">${uniq}</span>` : ''}</div>
                            </div>
                          </li>`;
                    }).join('')
                    : `<li class="diagrams-item empty">No indexes</li>`
                }
              </ul>
            </div>`;
        } catch (e) {
          indexesHtml = '';
        }
      }

      html += `
        <div class="left-panel-item model-node" data-model="${encodeString(rec.model)}">
          <div class="left-panel-item-header">
            <div class="left-panel-item-name">
              <span class="tree-toggle"><i class="fa-solid fa-chevron-right"></i></span>
              ${escapeHtml(rec.model)}${modelCount}
            </div>
            ${showCounts ? `<div class="left-panel-count">${rec.items.length} ${isCDM ? 'entities' : 'tables'}</div>` : ''}
          </div>
        </div>

        <div class="tree-children" style="display:none;">
          <!-- Diagrams subsection -->
          <div class="left-panel-item tree-group-header" data-group="diagrams">
            <div class="left-panel-item-header">
              <div class="left-panel-item-name">
                <span class="tree-toggle"><i class="fa-solid fa-chevron-right"></i></span>
                <i class="fa-solid fa-diagram-project"></i>&nbsp;Diagrams${showCounts ? ` (${rec.diagrams.length})` : ''}
              </div>
            </div>
          </div>
          <div class="tree-subchildren" style="display:none;">
            <ul class="tree-list diagrams-list">
              ${
                rec.diagrams.length
                  ? rec.diagrams.map(di => `
                      <li class="diagrams-item"
                          data-search-text="${escapeHtml(di.name)} ${escapeHtml(di.comment || '')}"
                          onclick="handleDiagramItemClick('${encodeString(di.name)}','${encodeString(rec.model)}', '${state.mode}')"
                          title="${escapeHtml(di.comment || di.name)}">
                        <i class="fa-solid fa-file"></i> ${escapeHtml(di.name)}
                        ${showCounts ? `<span class="left-panel-count">${di.nodes.length} entities</span>` : ''}
                      </li>`
                    ).join('')
                  : `<li class="diagrams-item empty">No diagrams</li>`
              }
            </ul>
          </div>

          <!-- Entities/Tables subsection -->
          <div class="left-panel-item tree-group-header" data-group="${isCDM ? 'entities' : 'tables'}">
            <div class="left-panel-item-header">
              <div class="left-panel-item-name">
                <span class="tree-toggle"><i class="fa-solid fa-chevron-right"></i></span>
                <i class="fa-solid ${isCDM ? 'fa-sitemap' : 'fa-table'}"></i>&nbsp;${isCDM ? 'Entities' : 'Tables'}${showCounts ? ` (${rec.items.length})` : ''}
              </div>
            </div>
          </div>
          <div class="tree-subchildren" style="display:none;">
            <ul class="tree-list entities-list">
              ${rec.items.map(item => {
                const name = item.Name || item.name || 'Unnamed';
                const code = item.Code || item.code || '';
                const stereotype = item.Stereotype || item.stereotype || '';
                const desc = item.Description || item.description || '';
                const count = (item.Attributes || item.Columns || []).length;
                const showStereotypeColors = lp.showStereotypeColors !== false; // Default to true
                const stereoClass = showStereotypeColors ? getStereotypeColorClass(stereotype) : '';
                return `
                  <li class="left-panel-item tree-item"
                      data-search-text="${escapeHtml(`${name} ${code} ${desc} ${stereotype}`)}"
                      onclick="handleLeftPanelItemClick(this, '${encodeString(name)}')">
                    <div class="left-panel-item-header">
                      <div class="left-panel-item-name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
                      ${code ? `<div class="left-panel-item-code" title="${escapeHtml(code)}">${escapeHtml(code)}</div>` : ''}
                    </div>
                    ${desc ? `<div class="left-panel-item-description">${escapeHtml(desc.substring(0, 100))}${desc.length > 100 ? '…' : ''}</div>` : ''}
                    <div class="left-panel-item-footer">
                      ${stereotype ? `<span class="left-panel-stereotype ${stereoClass}">${escapeHtml(stereotype)}</span>` : ''}
                      ${showCounts ? `<span class="left-panel-count">${count} ${isCDM ? 'attrs' : 'cols'}</span>` : ''}
                    </div>
                  </li>`;
              }).join('')}
            </ul>
          </div>

          ${modulesHtml || ''}${domainsHtml || ''}${sequencesHtml || ''}${constraintsHtml || ''}${indexesHtml || ''}

          <!-- Relationships/References subsection -->
          <div class="left-panel-item tree-group-header" data-group="${isCDM ? 'relationships' : 'references'}">
            <div class="left-panel-item-header">
              <div class="left-panel-item-name">
                <span class="tree-toggle"><i class="fa-solid fa-chevron-right"></i></span>
                <i class="fa-solid ${isCDM ? 'fa-code-branch' : 'fa-link'}"></i>&nbsp;${isCDM ? 'Relationships' : 'References'}${showCounts ? ` (${relationshipsList.length})` : ''}
              </div>
            </div>
          </div>
          <div class="tree-subchildren" style="display:none;">
            <ul class="tree-list ${isCDM ? 'relationships-list' : 'references-list'}">
              ${
                relationshipsList.length
                  ? relationshipsList.map(rel => {
                      const displayName = rel.name || 
                        (isCDM ? `${rel.childEntity} → ${rel.parentEntity}` : `${rel.childTable} → ${rel.parentTable}`);
                      const entities = isCDM ? rel.entities || [] : rel.tables || [];
                      const entityCount = entities.length;
                      
                      return `
                        <li class="left-panel-item tree-item ${isCDM ? 'relationship-item' : 'reference-item'}"
                            data-search-text="${escapeHtml(`${displayName} ${entities.join(' ')}`)}"
                            onclick="${isCDM ? 
                              `showRelationshipDetailsModal(${JSON.stringify(rel).replace(/"/g, '&quot;')}, '${encodeString(rec.model)}')` : 
                              `showReferenceDetailsModal(${JSON.stringify(rel).replace(/"/g, '&quot;')}, '${encodeString(rec.model)}')`}"
                            title="${isCDM ? 
                              `Relationship between ${rel.childEntity} and ${rel.parentEntity}` : 
                              `FK: ${rel.childTable}.${rel.childColumn} → ${rel.parentTable}.${rel.parentColumn}`}">
                          <div class="left-panel-item-header">
                            <div class="left-panel-item-name" title="${escapeHtml(displayName)}">${escapeHtml(displayName)}</div>
                            ${showCounts ? `<div class="left-panel-count">${entityCount} ${isCDM ? 'entities' : 'tables'}</div>` : ''}
                          </div>
                          <div class="left-panel-item-description" style="font-size: 10px; color: var(--text-secondary);">
                            ${isCDM ? 
                              `${escapeHtml(rel.childEntity)} → ${escapeHtml(rel.parentEntity)}` : 
                              `${escapeHtml(rel.childColumn)} → ${escapeHtml(rel.parentColumn)}`}
                          </div>
                          ${isCDM ? 
                            `<div class="left-panel-item-footer">
                              <span class="left-panel-stereotype" style="background: var(--accent-cdm); color: white; font-size: 9px;">
                                ${escapeHtml(rel.childCardinality || '?')} → ${escapeHtml(rel.parentCardinality || '?')}
                              </span>
                            </div>` : 
                            `<div class="left-panel-item-footer">
                              <span class="left-panel-stereotype" style="background: var(--accent-pdm); color: white; font-size: 9px;">
                                ${escapeHtml(rel.cardinality || '?')}
                              </span>
                              ${rel.mandatory === 'True' ? '<span style="font-size: 9px; color: var(--accent);">M</span>' : ''}
                            </div>`
                          }
                        </li>`;
                    }).join('')
                  : `<li class="diagrams-item empty">No ${isCDM ? 'relationships' : 'references'} found</li>`
              }
            </ul>
          </div>
        </div>`;
    });
    html += '</div>';

    // Default expand/collapse from settings
    const defaultExpand = lp.defaultExpand || false;
    leftPanelContent.innerHTML = html;
    
    // Apply expand/collapse after HTML is inserted
    setTimeout(() => {
      document.querySelectorAll('.model-node').forEach(header => {
        const children = header.nextElementSibling;
        const icon = header.querySelector('.tree-toggle i');
        if (children && children.classList.contains('tree-children')) {
          const expanded = defaultExpand;
          header.classList.toggle('expanded', expanded);
          children.style.display = expanded ? '' : 'none';
          if (icon) icon.className = expanded ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-right';
        }
      });
    }, 10);
    
    setupLeftPanelTreeHandlers();
    initializeModelDrag();
  } catch (error) {
    console.error('Error populating left panel:', error);
    leftPanelContent.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #ef4444;">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div style="margin-top: 8px; font-size: 12px;">Error loading data</div>
      </div>`;
  }
}

 // Initialize drag and drop functionality based on settings *
function initializeModelDrag() {
  const container = document.getElementById('leftPanelContent');
  if (!container) return;
  
  const dragEnabled = state.settings.leftPanel?.enableModelDrag !== false;
  
  if (dragEnabled) {
    // Re-apply drag handlers when panel is opened
    setupModelDragHandlers(container);
    
    // Update UI to show draggable state
    container.querySelectorAll('.model-node').forEach(node => {
      node.classList.add('draggable');
      
      // Ensure drag handle exists
      if (!node.querySelector('.drag-handle')) {
        const header = node.querySelector('.left-panel-item-header');
        if (header) {
          const dragHandle = document.createElement('div');
          dragHandle.className = 'drag-handle';
          dragHandle.innerHTML = '<i class="fa-solid fa-grip-vertical"></i>';
          dragHandle.style.cssText = `
            display: inline-flex;
            align-items: center;
            margin-right: 8px;
            color: var(--text-secondary);
            cursor: grab;
            opacity: 0.6;
            transition: opacity 0.2s;
          `;
          
          const toggleEl = header.querySelector('.tree-toggle');
          if (toggleEl) {
            toggleEl.parentNode.insertBefore(dragHandle, toggleEl.nextSibling);
          } else {
            header.insertBefore(dragHandle, header.firstChild);
          }
        }
      }
    });
  } else {
    // Remove drag functionality
    container.querySelectorAll('.model-node').forEach(node => {
      node.removeAttribute('draggable');
      node.classList.remove('draggable');
      
      // Remove drag handles
      const dragHandle = node.querySelector('.drag-handle');
      if (dragHandle) dragHandle.remove();
    });
  }
}

// Handles click on entity/table item
function handleLeftPanelItemClick(element, itemEncoded) {
  let itemName = decodeString(itemEncoded);
  if (!element || !itemName) return;
  try {
    document.querySelectorAll('.tree-item').forEach(item => item.classList.remove('selected'));
    element.classList.add('selected');

    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
      searchInput.value = `^${itemName}\\.`;
      handleSearch(searchInput.value);
    }

    if (window.innerWidth < 768) closeLeftPanel();
    showToast(`Showing ${state.mode === 'CDM' ? 'entity' : 'table'}: ${itemName}`, 'info');
  } catch (error) {
    console.error('Error handling left panel item click:', error);
    showToast('Error filtering data', 'error');
  }
}

// Persists the current model order to settings and localStorage
function persistModelOrder(container) {
  const saveOrder = state.settings.leftPanel?.saveModelOrder !== false;
  if (!saveOrder) return;
  
  const headers = Array.from(container.querySelectorAll('.model-node'));
  const order = headers.map(h => {
    const model = decodeString(h.dataset.model || '');
    return model === 'N/A' ? 'N/A' : model; // Handle the default "N/A" model
  }).filter(Boolean);
  
  if (!state.settings.leftPanel) state.settings.leftPanel = {};
  
  // Store order for current mode
  if (state.mode === 'CDM') {
    state.settings.leftPanel.modelOrderCDM = order;
  } else {
    state.settings.leftPanel.modelOrderPDM = order;
  }
  
  // Save to localStorage
  saveSettings();
  
  // Visual feedback
  const modeText = state.mode === 'CDM' ? 'CDM' : 'PDM';
  showToast(`${modeText} model order saved`, 'success', 1500);
}

// Toggles expansion of a model node
function toggleModelNode(header) {
  if (!header) return;
  const children = header.nextElementSibling;
  const icon = header.querySelector('.tree-toggle i');
  if (children && children.classList.contains('tree-children')) {
    const expanded = header.classList.toggle('expanded');
    children.style.display = expanded ? '' : 'none';
    if (icon) icon.className = expanded ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-right';
  }
}

// Handle diagram click -> open Diagram Viewer modal 
function handleDiagramItemClick(diagramEncoded, modelEncoded, statemode) {
  if (!diagramEncoded) return;
  if (statemode === 'CDM') showCDMDiagramModal(diagramEncoded, modelEncoded);
  else                     showPDMDiagramModal(diagramEncoded, modelEncoded);
}

// Handle diagram click in PDM mode -> open PDM Diagram Viewer 
function handlePDMDiagramItemClick(diagramEncoded, modelEncoded) {
  const diagramName = decodeString(diagramEncoded);
  const modelName = decodeString(modelEncoded);
  if (!diagramName) return;
  showPDMDiagramModal(diagramName, modelName);
}

// Groups items by their Model and collects diagram objects
function groupByModel(items) {
  const map = new Map();

  items.forEach(item => {
    const model = (item.Model || 'N/A').trim();
    let rec = map.get(model);
    if (!rec) rec = { model, diagramsMap: new Map(), items: [] };

    // Collect diagram objects from entity.Diagrams (array of {name, comment, posX, posY})
    const diagrams = Array.isArray(item.Diagrams) ? item.Diagrams : [];
    diagrams.forEach(d => {
      const dn = String(d.name || '').trim();
      if (!dn) return;

      const entry = rec.diagramsMap.get(dn) || { name: dn, model, comment: '', nodes: [] };
      if (d.comment && !entry.comment) entry.comment = String(d.comment);

      const posX = Number(d.posX || d.posx || 0);
      const posY = Number(d.posY || d.posy || 0);

      entry.nodes.push({
        name: String(item.Name || item.name || 'Unnamed'),
        stereotype: item.Stereotype || item.stereotype || '',
        posX, posY,
      });

      rec.diagramsMap.set(dn, entry);
    });

    rec.items.push(item);
    map.set(model, rec);
  });

  // Sort models and normalize arrays
  const result = Array.from(map.values()).sort((a, b) => a.model.localeCompare(b.model));
  result.forEach(rec => {
    rec.items.sort((a, b) => String(a.Name || a.name || '').localeCompare(String(b.Name || b.name || '')));
    rec.diagrams = Array.from(rec.diagramsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  });
  return result;
}
// Group constraints by model (PDM)
function groupPDMConstraintsByModel(items) {
  const map = new Map();
  const truthy = v => v === true || v === 'True' || v === 'true' || v === 'Y' || v === '1' || v === 1;

  items.forEach(table => {
    const model = (table.Model || 'N/A').trim();
    let rec = map.get(model);
    if (!rec) rec = { model, constraints: [], items: [] };

    const cols = Array.isArray(table.Columns) ? table.Columns : [];

    // Primary key: aggregate per table (composite keys handled)
    const pkCols = cols.filter(c => truthy(c.Primary)).map(c => c.Code || '');
    if (pkCols.length) {
      const tableNameVal = table.Name || '';
      const tableCodeVal = table.Code || '';
      rec.constraints.push({
        name: `PK_${tableCodeVal}`,
        type: 'PRIMARY',
        table: tableCodeVal,
        tableCode: tableCodeVal,
        tableName: tableNameVal,
        columns: pkCols,
        raw: { source: 'columns', cols: pkCols }
      });
    }

    const akMap = new Map();
    cols.forEach(c => {
      const akName = (c.AK_Constraint || '').toString().trim();
      const colName = c.Code || '';
      if (akName) {
        if (!akMap.has(akName)) akMap.set(akName, { name: akName, type: 'UNIQUE', table: table.Code || '', tableCode: table.Code || '', columns: [] });
        akMap.get(akName).columns.push(colName);
      }
    });
    cols.forEach(c => {
      const colName = c.Code || '';
      if (!Array.from(akMap.values()).some(v => v.columns.includes(colName)) && truthy(c.AK)) {
        const key = `AK_${table.Code || ''}_${colName}`;
        akMap.set(key, { name: key, type: 'UNIQUE', table: table.Code || '', columns: [colName] });
      }
    });
    akMap.forEach(v => rec.constraints.push(v));

    const fkMap = new Map();
    cols.forEach(c => {
      const fkRefRaw = (c.FK_Reference || '').toString().trim();
      let fkName = (c.FK_Constraint || '').toString().trim();
      // If FK constraint name is empty, fall back to FK_REFERENCE string as identifier
      if (!fkName && fkRefRaw) fkName = fkRefRaw;
      const colName = c.Code || '';
      if (fkName) {
        if (!fkMap.has(fkName)) fkMap.set(fkName, { name: fkName, type: 'FOREIGN', table: table.Code || '', tableCode: table.Code || '', columns: [], referencedTable: '', referencedColumns: [] });
        fkMap.get(fkName).columns.push(colName);
        // Prefer explicit FK_REFERENCE parsing format: child.col=referencedTable.referencedColumn
        if (fkRefRaw && fkRefRaw.includes('=')) {
          const parts = fkRefRaw.split('=');
          const right = (parts[1] || '').trim();
          const refParts = right.split('.').map(p => p.trim()).filter(Boolean);
          if (refParts.length >= 2) {
            fkMap.get(fkName).referencedTable = refParts[0];
            fkMap.get(fkName).referencedColumns.push(refParts[1]);
          }
        } else {
          if (c.ReferencedTable || c.ParentTable) fkMap.get(fkName).referencedTable = c.ReferencedTable || c.ParentTable;
          if (c.ReferencedColumn || c.ParentColumn) fkMap.get(fkName).referencedColumns.push(c.ReferencedColumn || c.ParentColumn);
        }
      }
    });
    cols.forEach(c => {
      const colName = c.Code || '';
      if (!Array.from(fkMap.values()).some(v => v.columns.includes(colName)) && truthy(c.FK)) {
        const key = `FK_${table.Code || ''}_${colName}`;
        fkMap.set(key, { name: key, type: 'FOREIGN', table: table.Code || '', tableCode: table.Code || '', columns: [colName], referencedTable: '', referencedColumns: [], raw: c });
      }
    });
    fkMap.forEach(v => rec.constraints.push(v));

    // Include table-level Checks (PDM) if present
    const checks = Array.isArray(table.Checks) ? table.Checks : [];
    checks.forEach(ch => {
      const name = ch.Name || ch.name || ch.Code || ch.CheckName || '';
      rec.constraints.push({
        name: name || `CHECK_${table.Code || ''}`,
        type: 'CHECK',
        table: table.Code || '',
        tableCode: table.Code || '',
        tableName: table.Name || '',
        expression: ch.ServerExpression || ch.Expression || ch.Definition || ch.Constraint || '',
        raw: ch
      });
    });

    rec.items.push(table);
    map.set(model, rec);
  });

  const result = Array.from(map.values()).sort((a,b) => a.model.localeCompare(b.model));
  return result;
}

// Group indexes by model (PDM)
function groupPDMIndexesByModel(items) {
  const map = new Map();
  const truthy = v => v === true || v === 'True' || v === 'true' || v === 'Y' || v === '1' || v === 1;

  items.forEach(table => {
    const model = (table.Model || 'N/A').trim();
    let rec = map.get(model);
    if (!rec) rec = { model, indexes: [], items: [] };

    const cols = Array.isArray(table.Columns) ? table.Columns : [];
    const idxMap = new Map();
    cols.forEach(c => {
      const idxName = (c.Index || c.IndexName || '').toString().trim();
      const colName = c.Name || c.Code || c.name || '';
      if (!idxName) return; // skip columns without explicit index name
      if (!idxMap.has(idxName)) idxMap.set(idxName, { name: idxName, columns: [], unique: false, table: table.Name || table.Code || table.name || '', raw: [] });
      idxMap.get(idxName).columns.push(colName);
      idxMap.get(idxName).raw.push(c);
      if (truthy(c.AK_Constraint) || truthy(c.AK) || truthy(c.Unique)) idxMap.get(idxName).unique = true;
    });

    const explicit = Array.isArray(table.Indexes) ? table.Indexes : [];
    explicit.forEach(idx => {
      const name = idx.name || idx.IndexName || '';
      const colsList = idx.Columns || idx.columns || [];
      if (!name) return;
      if (!idxMap.has(name)) idxMap.set(name, { name, columns: [], unique: !!(idx.unique || idx.Unique || idx.IsUnique), table: table.Name || table.Code || table.name || '', raw: [] });
      (Array.isArray(colsList) ? colsList : [colsList]).forEach(cn => {
        if (!idxMap.get(name).columns.includes(cn)) idxMap.get(name).columns.push(cn);
      });
      idxMap.get(name).raw.push(idx);
    });

    idxMap.forEach(v => rec.indexes.push({ name: v.name, columns: v.columns, unique: v.unique, table: v.table, raw: v.raw }));

    rec.items.push(table);
    map.set(model, rec);
  });

  const result = Array.from(map.values()).sort((a,b) => a.model.localeCompare(b.model));
  return result;
}

// CDM variants (if entities include constraints/indexes)
function groupCDMConstraintsByModel(items) {
  const map = new Map();
  items.forEach(entity => {
    const model = (entity.Model || 'N/A').trim();
    let rec = map.get(model);
    if (!rec) rec = { model, constraintsMap: new Map(), items: [] };

    const constraints = Array.isArray(entity.Constraints) ? entity.Constraints : [];
    constraints.forEach(con => {
      const key = `${con.name || con.ConstraintName || ''}-${(con.Attributes || con.Columns || []).join(',')}`;
      const entry = rec.constraintsMap.get(key) || {
        name: con.name || con.ConstraintName || '',
        type: con.type || con.ConstraintType || '',
        entity: entity.Name || entity.name || '',
        attributes: con.Attributes || con.Attributes || [],
        comment: con.Comment || con.comment || '',
        raw: con,
        entities: new Set()
      };
      if (entry.entity) entry.entities.add(entry.entity);
      rec.constraintsMap.set(key, entry);
    });

    const indexes = Array.isArray(entity.Indexes) ? entity.Indexes : [];
    indexes.forEach(idx => {
      const key = `${idx.name || idx.IndexName || ''}-${(idx.Attributes || []).join(',')}`;
      const entry = rec.indexesMap?.get(key) || {
        name: idx.name || idx.IndexName || '',
        attributes: idx.Attributes || [],
        unique: idx.unique || idx.Unique || false,
        entity: entity.Name || entity.name || '',
        comment: idx.Comment || idx.comment || '',
        raw: idx,
        entities: new Set()
      };
      if (!rec.indexesMap) rec.indexesMap = new Map();
      if (entry.entity) entry.entities.add(entry.entity);
      rec.indexesMap.set(key, entry);
    });

    rec.items.push(entity);
    map.set(model, rec);
  });

  const result = Array.from(map.values()).sort((a,b) => a.model.localeCompare(b.model));
  result.forEach(rec => {
    rec.constraints = Array.from(rec.constraintsMap.values()).sort((a,b) => (a.name||'').localeCompare(b.name||''));
    rec.indexes = rec.indexesMap ? Array.from(rec.indexesMap.values()).sort((a,b) => (a.name||'').localeCompare(b.name||'')) : [];
  });
  return result;
}

// Heuristic tag for constraints: P=Primary, F=Foreign, U=Unique
function formatConstraintTag(con) {
  const t = String(con.type || con.ConstraintType || '').toLowerCase();
  if (t.includes('primary') || (con.isPrimary || con.IsPrimary || false)) return 'P';
  if (t.includes('foreign') || con.referencedTable || con.ParentTable) return 'F';
  if (t.includes('unique') || t === 'u' || t === 'ak') return 'U';
  // Check constraint: either explicit type or presence of an expression/server expression
  if (t.includes('check') || con.ServerExpression || con.Serverexpression || con.Expression || con.expression || con.type === 'CHECK') return 'C';
  return '';
}

// Modal helpers for constraints and indexes (accept objects)
function showConstraintDetailsModal(constraint, modelName) {
  try {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal-box';
    modal.style.maxWidth = '600px';

    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <div class="title">
        <i class="fa-solid fa-key"></i>
        Constraint: <strong>${escapeHtml(constraint.name || constraint.ConstraintName || 'Unnamed')}</strong>
      </div>
      <button class="modal-close">&times;</button>
    `;
    modal.appendChild(header);

    const content = document.createElement('div');
    content.style.padding = '16px';

    const type = escapeHtml(constraint.type || constraint.ConstraintType || '').toUpperCase();
    const table = escapeHtml(constraint.tableCode || constraint.table || constraint.Table || '');
    const cols = Array.isArray(constraint.columns) ? constraint.columns : (constraint.Columns || []);
    const colsHtml = cols.length ? `<ul>${cols.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>` : '<div style="color:var(--text-secondary)">No columns</div>';

    let fkHtml = '';
    if (constraint.referencedTable || constraint.referencedColumns) {
      fkHtml = `
        <tr><td>Referenced Table</td><td>${escapeHtml(constraint.referencedTable || '')}</td></tr>
        <tr><td>Referenced Columns</td><td>${escapeHtml((constraint.referencedColumns || []).join(', '))}</td></tr>
      `;
    }

    let exprHtml = '';
    const expr = constraint.expression || constraint.ServerExpression || constraint.Expression || constraint.Definition || '';
    if (expr) {
      exprHtml = `<tr><td>Expression</td><td><pre style="white-space:pre-wrap;margin:0">${escapeHtml(expr)}</pre></td></tr>`;
    }

    content.innerHTML = `
      <table class="modal-table">
        <tbody>
          <tr><td>Model</td><td>${escapeHtml(decodeString(modelName || ''))}</td></tr>
          <tr><td>Type</td><td>${type}</td></tr>
          <tr><td>Table</td><td>${table}</td></tr>
          <tr><td>Columns</td><td>${colsHtml}</td></tr>
          ${fkHtml}
          ${exprHtml}
        </tbody>
      </table>
    `;

    modal.appendChild(content);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    header.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  } catch (err) {
    console.error('Error showing constraint modal', err);
  }
}

// Shows index details modal
function showIndexDetailsModal(index, modelName) {
  try {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal-box';
    modal.style.maxWidth = '600px';

    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <div class="title">
        <i class="fa-solid fa-list-ol"></i>
        Index: <strong>${escapeHtml(index.name || index.IndexName || 'Unnamed')}</strong>
      </div>
      <button class="modal-close">&times;</button>
    `;
    modal.appendChild(header);

    const content = document.createElement('div');
    content.style.padding = '16px';

    const cols = Array.isArray(index.columns) ? index.columns : (index.Columns || []);
    const colsHtml = cols.length ? `<ul>${cols.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>` : '<div style="color:var(--text-secondary)">No columns</div>';
    const unique = index.unique || index.IsUnique || index.Unique ? 'Yes' : 'No';

    content.innerHTML = `
      <table class="modal-table">
        <tbody>
          <tr><td>Model</td><td>${escapeHtml(decodeString(modelName || ''))}</td></tr>
          <tr><td>Table</td><td>${escapeHtml(index.table || index.Table || '')}</td></tr>
          <tr><td>Columns</td><td>${colsHtml}</td></tr>
          <tr><td>Unique</td><td>${unique}</td></tr>
        </tbody>
      </table>
    `;

    modal.appendChild(content);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    header.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  } catch (err) {
    console.error('Error showing index modal', err);
  }
}

// Wrappers to accept encoded JSON in onclick handlers
function showConstraintDetailsModalEncoded(encoded, modelEncoded) {
  try { const obj = JSON.parse(decodeString(encoded)); showConstraintDetailsModal(obj, modelEncoded); } catch (e) { console.error(e); }
}
function showIndexDetailsModalEncoded(encoded, modelEncoded) {
  try { const obj = JSON.parse(decodeString(encoded)); showIndexDetailsModal(obj, modelEncoded); } catch (e) { console.error(e); }
}

// Shows/hides the left entities/tables panel
function toggleLeftPanel() {
  const leftPanel = document.getElementById('leftPanel');
  if (!leftPanel) return;
  if (leftPanel.classList.contains('open')) {
    closeLeftPanel();
  } else {
    openLeftPanel();
  }
}

// Filters the left panel items based on search text (expands models on filter)
function filterLeftPanel(filterText) {
  const container = document.getElementById('leftPanelContent');
  const filterClearBtn = document.getElementById('leftPanelFilterClear');
  if (!container) return;

  const raw = (filterText || '').trim();
  if (filterClearBtn) filterClearBtn.style.display = raw ? 'block' : 'none';
  
  // Always compile regex - it will handle the regexEnabled setting internally
  const regex = raw ? compileRegex(raw) : null;

  // Expand all models and groups while filtering
  container.querySelectorAll('.model-node').forEach(node => {
    node.classList.add('expanded');
    const children = node.nextElementSibling;
    if (children && children.classList.contains('tree-children')) children.style.display = '';
    
    // Also expand all groups within this model
    children.querySelectorAll('.tree-group-header').forEach(groupHeader => {
      groupHeader.classList.add('expanded');
      const subChildren = groupHeader.nextElementSibling;
      if (subChildren && subChildren.classList.contains('tree-subchildren')) subChildren.style.display = '';
      const icon = groupHeader.querySelector('.tree-toggle i');
      if (icon) icon.className = 'fa-solid fa-chevron-down';
    });
  });

  // Show/hide list items based on regex
  container.querySelectorAll('.tree-item, .diagrams-item, .relationship-item, .reference-item, .constraints-item, .indexes-item').forEach(el => {
    const text = String(el.dataset.searchText || '').toLowerCase();
    
    if (!raw) {
      // No filter text, show everything
      el.style.display = '';
    } else if (!regex) {
      // No valid regex, hide everything
      el.style.display = 'none';
    } else {
      // Test with regex
      el.style.display = regex.test(text) ? '' : 'none';
    }
  });

  updateModelHeaderCounts();
}

/************************
* Helpers for LeftPanel *
*************************/

//Apply stored model order when building the tree
function applyStoredModelOrder(grouped) {
  const saveOrder = state.settings.leftPanel?.saveModelOrder !== false;
  if (!saveOrder) return grouped;
  
  const lp = state.settings.leftPanel || {};
  const order = state.mode === 'CDM' ? (lp.modelOrderCDM || []) : (lp.modelOrderPDM || []);
  
  if (!order || order.length === 0) return grouped;

  // Create a map for quick lookup
  const modelMap = new Map();
  grouped.forEach(g => modelMap.set(g.model, g));
  
  // Sort by saved order, unsaved models go to the end
  const result = [];
  
  // Add models in saved order
  order.forEach(modelName => {
    if (modelMap.has(modelName)) {
      result.push(modelMap.get(modelName));
      modelMap.delete(modelName);
    }
  });
  
  // Add remaining models (not in saved order) in alphabetical order
  const remaining = Array.from(modelMap.values())
    .sort((a, b) => a.model.localeCompare(b.model));
  
  result.push(...remaining);
  
  return result;
}

// Opens the left panel and populates it with TREE grouped by Model
function openLeftPanel() {
  const leftPanel = document.getElementById('leftPanel');
  if (!leftPanel) return;
  
  // Apply styles before opening
  applyLeftPanelStyles();
  
  leftPanel.classList.add('open');

  // Set grid wrapper margin to match left panel width
  const gridWrapper = document.querySelector('.grid-wrapper');
  if (gridWrapper) {
    const width = state.settings.leftPanel?.leftPanelWidth || 300;
    gridWrapper.style.marginLeft = `${width}px`;
  }

  // Populate the panel
  populateLeftPanel();
  
  // Setup handlers
  setupLeftPanelTreeHandlers();
  initializeModelDrag();

  // Persist panel open state
  try {
    if (!state.settings.general) state.settings.general = {};
    state.settings.general.leftPanelDefaultOpen = true;
    saveSettings();
  } catch (e) {
    console.warn('Could not persist leftPanel open state', e);
  }
}

// Closes the left panel 
function closeLeftPanel() {
  const leftPanel = document.getElementById('leftPanel');
  if (!leftPanel) return;
  leftPanel.classList.remove('open');

  const gridWrapper = document.querySelector('.grid-wrapper');
  if (gridWrapper) gridWrapper.style.marginLeft = '0';

  // Persist panel closed state
  try {
    if (!state.settings.general) state.settings.general = {};
    state.settings.general.leftPanelDefaultOpen = false;
    saveSettings();
  } catch (e) {
    console.warn('Could not persist leftPanel closed state', e);
  }
}

// Add this function to LeftPanel.js to force refresh
function refreshLeftPanel() {
  const leftPanel = document.getElementById('leftPanel');
  if (leftPanel && leftPanel.classList.contains('open')) {
    // Re-apply all settings
    applyLeftPanelStyles();
    
    // Re-populate with current data
    populateLeftPanel();
    
    // Re-setup handlers
    setupLeftPanelTreeHandlers();
    initializeModelDrag();
    
    showToast('Left panel refreshed with new settings', 'success');
  }
}

// Call this in applyLeftPanelSettings() after applying changes
window.refreshLeftPanel = refreshLeftPanel;

// Updates the (visible/total) counts shown in each model header 
function updateModelHeaderCounts() {
  const container = document.getElementById('leftPanelContent');
  if (!container) return;

  container.querySelectorAll('.model-node').forEach(header => {
    const children = header.nextElementSibling;
    if (!children || !children.classList.contains('tree-children')) return;

    // Count visible items under Entities/Tables subsection
    const entityList = children.querySelector('.entities-list');
    const items = entityList ? Array.from(entityList.querySelectorAll('.tree-item')) : [];
    const visibleCount = items.filter(el => el.style.display !== 'none').length;
    const totalCount = items.length;

    // Update title: "Model X (visible/total)"
    const titleEl = header.querySelector('.left-panel-item-name');
    if (titleEl) {
      const base = titleEl.dataset.baseTitle || titleEl.textContent;
      titleEl.dataset.baseTitle = base;
      titleEl.textContent = `${base} (${visibleCount}/${totalCount})`;
    }
  });
}

// Compiles a regex from input string (supports /pattern/flags or plain text)
function compileRegex(input) {
  const val = String(input || '').trim();
  
  // Check if regex search is enabled in settings
  const regexEnabled = state.settings.leftPanel?.regexSearch !== false; // Default to true
  
  // If regex is disabled, treat input as plain text
  if (!regexEnabled) {
    // Escape regex special characters to treat input as literal text
    const escaped = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try { 
      return new RegExp(escaped, 'i'); 
    } catch (e) { 
      return new RegExp('', 'i'); // Return empty regex on error
    }
  }
  
  // Support /pattern/flags or plain text as regex (only when regex is enabled)
  const m = val.match(/^\/(.*)\/([a-z]*)$/i);
  if (m) {
    try { 
      return new RegExp(m[1], m[2]); 
    } catch (e) { 
      // If regex fails, fall back to case-insensitive match
      return new RegExp(m[1], 'i'); 
    }
  }
  
  try { 
    return new RegExp(val, 'i'); 
  } catch (e) {
    // If plain text fails as regex, escape special characters
    return new RegExp(val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }
}

// Helper functions for settings UI
function updateLeftPanelWidthDisplay() {
  const slider = document.getElementById('lp-width');
  const display = document.getElementById('lp-width-display');
  if (slider && display) {
    display.textContent = `${slider.value}px`;
  }
}

function updateLeftPanelAnimationDisplay() {
  const slider = document.getElementById('lp-animationSpeed');
  const display = document.getElementById('lp-animation-display');
  if (slider && display) {
    display.textContent = `${slider.value}ms`;
  }
}

function updateLeftPanelFilterDelayDisplay() {
  const slider = document.getElementById('lp-filterDelay');
  const display = document.getElementById('lp-filter-delay-display');
  if (slider && display) {
    display.textContent = `${slider.value}ms`;
  }
}

function updateLeftPanelItemHeightDisplay() {
  const slider = document.getElementById('lp-itemHeight');
  const display = document.getElementById('lp-item-height-display');
  if (slider && display) {
    display.textContent = `${slider.value}px`;
  }
}

// Reset model order
function resetModelOrder() {
  if (confirm('Reset model order to alphabetical?')) {
    const lp = state.settings.leftPanel || {};
    
    if (state.mode === 'CDM') {
      lp.modelOrderCDM = [];
    } else {
      lp.modelOrderPDM = [];
    }
    
    // Update left panel if open
    const leftPanel = document.getElementById('leftPanel');
    if (leftPanel && leftPanel.classList.contains('open')) {
      populateLeftPanel();
    }
    
    saveSettings();
    showToast('Model order reset to alphabetical', 'success');
  }
}

/*********************************
* Setup & Settings for LeftPanel *
**********************************/

// Sets up the left panel filter functionality 
function setupLeftPanelFilter() {
  const filterInput = document.getElementById('leftPanelFilter');
  const filterClearBtn = document.getElementById('leftPanelFilterClear');
  if (!filterInput || !filterClearBtn) return;

  // Add tooltip or indicator for regex mode
  const updateSearchModeIndicator = () => {
    const regexEnabled = state.settings.leftPanel?.regexSearch !== false;
    filterInput.title = regexEnabled ? 
      "Search with regular expressions. Use /pattern/flags or plain text." : 
      "Simple text search (regex disabled)";
    
    // Add a visual indicator
    const parent = filterInput.parentElement;
    if (regexEnabled) {
      parent.classList.add('regex-enabled');
      parent.classList.remove('regex-disabled');
    } else {
      parent.classList.add('regex-disabled');
      parent.classList.remove('regex-enabled');
    }
  };

  // Get filter delay from settings
  const getFilterDelay = () => {
    return state.settings.leftPanel?.filterDelay || 300;
  };

  let filterTimeout = null;

  // Debounced filter function
  const debouncedFilter = (value) => {
    if (filterTimeout) {
      clearTimeout(filterTimeout);
    }
    
    const delay = getFilterDelay();
    filterTimeout = setTimeout(() => {
      filterLeftPanel(value);
    }, delay);
  };

  // Update on input with debounce
  filterInput.addEventListener('input', (e) => {
    updateSearchModeIndicator();
    debouncedFilter(e.target.value);
  });
  
  filterClearBtn.addEventListener('click', () => {
    if (filterTimeout) {
      clearTimeout(filterTimeout);
      filterTimeout = null;
    }
    filterInput.value = '';
    filterLeftPanel('');
    filterInput.focus();
  });

  // Ctrl+F focuses filter when panel is open
  document.addEventListener('keydown', (e) => {
    const leftPanel = document.getElementById('leftPanel');
    if (e.ctrlKey && e.key === 'f' && leftPanel && leftPanel.classList.contains('open')) {
      e.preventDefault();
      filterInput.focus();
    }
  });

  // Initialize the indicator
  updateSearchModeIndicator();
  
  // Also update when settings change
  const originalApplyLeftPanelSettings = window.applyLeftPanelSettings;
  if (typeof originalApplyLeftPanelSettings === 'function') {
    window.applyLeftPanelSettings = function() {
      originalApplyLeftPanelSettings.apply(this, arguments);
      updateSearchModeIndicator();
    };
  }
}

// Sets up resizer for left panel 
function setupLeftPanelResizer() {
  const resizer = document.getElementById('leftPanelResizer');
  const leftPanel = document.getElementById('leftPanel');
  if (!resizer || !leftPanel) return;

  let isResizing = false;
  let startX, startWidth;

  function onMouseMove(e) {
    if (!isResizing) return;
    const width = startWidth + e.clientX - startX;
    const newWidth = Math.max(200, Math.min(800, width));
    leftPanel.style.width = `${newWidth}px`;
    document.documentElement.style.setProperty('--left-panel-width', `${newWidth}px`);

    const gridWrapper = document.querySelector('.grid-wrapper');
    if (gridWrapper && leftPanel.classList.contains('open')) {
      gridWrapper.style.marginLeft = `${newWidth}px`;
    }
  }
  function onMouseUp() {
    if (!isResizing) return;
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    leftPanel.classList.remove('resizing');
    resizer.classList.remove('resizing');
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    if (state.settings) {
      const currentWidth = parseInt(leftPanel.style.width);
      state.settings.general.leftPanelWidth = currentWidth;
      saveSettings();
    }
  }

  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = parseInt(document.defaultView.getComputedStyle(leftPanel).width, 10);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    leftPanel.classList.add('resizing');
    resizer.classList.add('resizing');
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    e.preventDefault();
    e.stopPropagation();
  });
}
 
// Sets up Attach expand/collapse handlers for the tree
function setupLeftPanelTreeHandlers() {
  const container = document.getElementById('leftPanelContent');
  if (!container || container.__delegated) return; // bind once
  container.__delegated = true;
  
  // Set up drag handlers if enabled
  const dragEnabled = state.settings.leftPanel?.enableModelDrag !== false;
  if (dragEnabled) {
    setupModelDragHandlers(container);
  }
  
  container.addEventListener('click', (e) => {
    // Toggle model node: chevron or header
    const toggleEl = e.target.closest('.tree-toggle, .left-panel-item-name, .left-panel-item-header');
    if (toggleEl) {
      const header = toggleEl.closest('.model-node');
      if (header) {
        const children = header.nextElementSibling;
        const icon = header.querySelector('.tree-toggle i');
        const expanded = !header.classList.contains('expanded');
        header.classList.toggle('expanded', expanded);
        if (children && children.classList.contains('tree-children'))
          children.style.display = expanded ? '' : 'none';
        if (icon) icon.className = expanded ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-right';
        return;
      }
    }

    // Toggle group header (Diagrams or Entities/Tables)
    const groupHeader = e.target.closest('.tree-group-header');
    if (groupHeader) {
      const children = groupHeader.nextElementSibling;
      const icon = groupHeader.querySelector('.tree-toggle i');
      if (children && children.classList.contains('tree-subchildren')) {
        const expanded = !groupHeader.classList.contains('expanded');
        groupHeader.classList.toggle('expanded', expanded);
        children.style.display = expanded ? '' : 'none';
        if (icon) icon.className = expanded ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-right';
      }
      return;
    }

    // Diagram items
    const diagItem = e.target.closest('.diagrams-item');
    if (diagItem) return; // handled inline via onclick attribute

    // Entity/Table items
    const itemEl = e.target.closest('.tree-item');
    if (itemEl) {
      document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('selected'));
      itemEl.classList.add('selected');
    }
  });
}

// Sets up drag and drop handlers for model nodes
function setupModelDragHandlers(container) {
  // Check if drag is enabled in settings
  const dragEnabled = state.settings.leftPanel?.enableModelDrag !== false;
  const saveOrder = state.settings.leftPanel?.saveModelOrder !== false;
  
  if (!dragEnabled) {
    // Remove drag attributes if previously added
    container.querySelectorAll('.model-node').forEach(node => {
      node.removeAttribute('draggable');
      node.classList.remove('draggable');
      // Remove drag handle if exists
      const dragHandle = node.querySelector('.drag-handle');
      if (dragHandle) dragHandle.remove();
    });
    return;
  }
  
  let dragSrc = null;
  let dragOffset = { x: 0, y: 0 };
  let dropIndicator = null;

  // Function to create drop indicator
  function createDropIndicator(position) {
    if (dropIndicator) dropIndicator.remove();
    
    dropIndicator = document.createElement('div');
    dropIndicator.className = 'drag-drop-indicator';
    dropIndicator.style.cssText = `
      position: absolute;
      height: 2px;
      background-color: var(--accent);
      border-radius: 1px;
      left: 10px;
      right: 10px;
      pointer-events: none;
      z-index: 1000;
      top: ${position}px;
    `;
    
    container.appendChild(dropIndicator);
  }

  // Function to get drop position
  function getDropPosition(node, clientY) {
    const rect = node.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const relativeY = rect.top - containerRect.top;
    const midPoint = relativeY + rect.height / 2;
    const mouseRelativeY = clientY - containerRect.top;
    
    return {
      isBefore: mouseRelativeY < midPoint,
      position: mouseRelativeY < midPoint ? relativeY : relativeY + rect.height
    };
  }

  // Apply drag handlers to all model nodes
  container.querySelectorAll('.model-node').forEach(node => {
    // Add drag attribute and class
    node.setAttribute('draggable', 'true');
    node.classList.add('draggable');
    
    // Add visual drag handle if not present
    if (!node.querySelector('.drag-handle')) {
      const header = node.querySelector('.left-panel-item-header');
      if (header) {
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '<i class="fa-solid fa-grip-vertical"></i>';
        dragHandle.style.cssText = `
          display: inline-flex;
          align-items: center;
          margin-right: 8px;
          color: var(--text-secondary);
          cursor: grab;
          opacity: 0.6;
          transition: opacity 0.2s;
        `;
        
        const toggleEl = header.querySelector('.tree-toggle');
        if (toggleEl) {
          toggleEl.parentNode.insertBefore(dragHandle, toggleEl.nextSibling);
        } else {
          header.insertBefore(dragHandle, header.firstChild);
        }
      }
    }

    // Drag start event
    node.addEventListener('dragstart', (e) => {
      if (!dragEnabled) {
        e.preventDefault();
        return;
      }
      
      dragSrc = node;
      node.classList.add('dragging');
      
      // Store offset for drag image
      const rect = node.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      
      // Set drag data
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', node.dataset.model || '');
      
      // Create drag image
      const dragImage = node.cloneNode(true);
      dragImage.style.cssText = `
        width: ${rect.width}px;
        opacity: 0.7;
        background-color: var(--bg-secondary);
        border: 1px solid var(--accent);
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      document.body.appendChild(dragImage);
      
      // Position off-screen
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      dragImage.style.left = '-1000px';
      
      e.dataTransfer.setDragImage(dragImage, dragOffset.x, dragOffset.y);
      
      // Clean up after drag starts
      setTimeout(() => document.body.removeChild(dragImage), 0);
    });

    // Drag over event
    node.addEventListener('dragover', (e) => {
      if (!dragSrc || dragSrc === node) return;
      
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      // Show drop indicator
      const { position } = getDropPosition(node, e.clientY);
      createDropIndicator(position);
      
      // Visual feedback
      node.classList.add('drag-over');
    });

    // Drag leave event
    node.addEventListener('dragleave', () => {
      node.classList.remove('drag-over');
    });

    // Drop event
    node.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!dragSrc || dragSrc === node) return;
      
      // Remove visual feedback
      node.classList.remove('drag-over');
      if (dropIndicator) {
        dropIndicator.remove();
        dropIndicator = null;
      }
      
      const { isBefore } = getDropPosition(node, e.clientY);
      const tree = container.querySelector('.left-panel-tree');
      
      // Get both the header and its children
      const srcHeader = dragSrc;
      const srcChildren = dragSrc.nextElementSibling;
      const targetHeader = node;
      const targetChildren = node.nextElementSibling;
      
      if (isBefore) {
        // Insert before target
        tree.insertBefore(srcHeader, targetHeader);
        if (srcChildren && srcChildren.classList.contains('tree-children')) {
          tree.insertBefore(srcChildren, targetHeader);
        }
      } else {
        // Insert after target (need to find correct position after target children)
        let insertAfter = targetHeader;
        if (targetChildren && targetChildren.classList.contains('tree-children')) {
          insertAfter = targetChildren;
        }
        
        // Insert header
        if (insertAfter.nextSibling) {
          tree.insertBefore(srcHeader, insertAfter.nextSibling);
        } else {
          tree.appendChild(srcHeader);
        }
        
        // Insert children
        if (srcChildren && srcChildren.classList.contains('tree-children')) {
          if (srcHeader.nextSibling) {
            tree.insertBefore(srcChildren, srcHeader.nextSibling);
          } else {
            tree.appendChild(srcChildren);
          }
        }
      }
      
      // Clean up
      dragSrc.classList.remove('dragging');
      dragSrc = null;
      
      // Persist new order
      if (saveOrder) {
        persistModelOrder(container);
      }
      
      // Visual feedback
      showToast(`Model order updated${saveOrder ? ' and saved' : ''}`, 'info', 1500);
    });

    // Drag end event
    node.addEventListener('dragend', () => {
      // Clean up all visual feedback
      container.querySelectorAll('.model-node').forEach(n => {
        n.classList.remove('dragging', 'drag-over');
      });
      
      if (dropIndicator) {
        dropIndicator.remove();
        dropIndicator = null;
      }
      
      dragSrc = null;
    });
  });
  
  // Handle drag over on container for edge cases
  container.addEventListener('dragover', (e) => {
    if (!dragSrc) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // If dragging over empty space at bottom, show indicator at bottom
    const lastNode = container.querySelector('.model-node:last-of-type');
    if (lastNode) {
      const rect = lastNode.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const isBelowLast = e.clientY > rect.bottom;
      
      if (isBelowLast) {
        const position = rect.bottom - containerRect.top + 5;
        createDropIndicator(position);
      }
    }
  });
  
  // Handle drop on container (for dropping at the end)
  container.addEventListener('drop', (e) => {
    if (!dragSrc) return;
    
    const lastNode = container.querySelector('.model-node:last-of-type');
    if (lastNode && e.clientY > lastNode.getBoundingClientRect().bottom) {
      e.preventDefault();
      
      const tree = container.querySelector('.left-panel-tree');
      const srcHeader = dragSrc;
      const srcChildren = dragSrc.nextElementSibling;
      
      // Move to end
      tree.appendChild(srcHeader);
      if (srcChildren && srcChildren.classList.contains('tree-children')) {
        tree.appendChild(srcChildren);
      }
      
      // Clean up
      dragSrc.classList.remove('dragging');
      dragSrc = null;
      
      if (dropIndicator) {
        dropIndicator.remove();
        dropIndicator = null;
      }
      
      // Persist
      if (saveOrder) {
        persistModelOrder(container);
      }
      
      showToast(`Model moved to end${saveOrder ? ' and saved' : ''}`, 'info', 1500);
    }
  });
}

// Renders LeftPanel settings tab content @returns {string} HTML content for LeftPanel settings
function renderLeftPanelSettings() {
  const s = state.settings.leftPanel || {};
   // Get unique models from CDM and PDM data
    const cdmModels = [...new Set(state.cdmData.map(item => item.Model).filter(Boolean))].sort();
    const pdmModels = [...new Set(state.pdmData.map(item => item.Model).filter(Boolean))].sort();
    
    // Get selected models for each mode (default to all if not specified)
    const selectedCdmModels = s.selectedModelsCDM || cdmModels;
    const selectedPdmModels = s.selectedModelsPDM || pdmModels;
    
  return `
  <div class="settings-section">
            <div class="settings-section-title">
                <i class="fa-solid fa-layer-group"></i>
                Model Visibility
            </div>
            <div class="settings-grid">
                <div class="setting-item">
                    <label class="setting-label">CDM Models to Display</label>
                    <div class="setting-description">Select which CDM models appear in the left panel</div>
                    <div class="model-selection-container">
                        <div class="model-selection-header">
                            <button type="button" class="setting-btn btn-small" onclick="selectAllCDMModels()">
                                <i class="fa-solid fa-check-double"></i> Select All
                            </button>
                            <button type="button" class="setting-btn btn-small" onclick="deselectAllCDMModels()">
                                <i class="fa-solid fa-square"></i> Deselect All
                            </button>
                            <span class="model-count">${cdmModels.length} models available</span>
                        </div>
                        <div class="model-checkbox-list" id="cdmModelList">
                            ${cdmModels.map(model => `
                                <div class="model-checkbox-item">
                                    <input type="checkbox" 
                                           class="setting-checkbox model-checkbox" 
                                           id="cdm-model-${model.replace(/[^a-zA-Z0-9]/g, '-')}" 
                                           value="${model}"
                                           ${selectedCdmModels.includes(model) ? 'checked' : ''}>
                                    <label for="cdm-model-${model.replace(/[^a-zA-Z0-9]/g, '-')}">
                                        <i class="fa-solid fa-sitemap"></i> ${model}
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">PDM Models to Display</label>
                    <div class="setting-description">Select which PDM models appear in the left panel</div>
                    <div class="model-selection-container">
                        <div class="model-selection-header">
                            <button type="button" class="setting-btn btn-small" onclick="selectAllPDMModels()">
                                <i class="fa-solid fa-check-double"></i> Select All
                            </button>
                            <button type="button" class="setting-btn btn-small" onclick="deselectAllPDMModels()">
                                <i class="fa-solid fa-square"></i> Deselect All
                            </button>
                            <span class="model-count">${pdmModels.length} models available</span>
                        </div>
                        <div class="model-checkbox-list" id="pdmModelList">
                            ${pdmModels.map(model => `
                                <div class="model-checkbox-item">
                                    <input type="checkbox" 
                                           class="setting-checkbox model-checkbox" 
                                           id="pdm-model-${model.replace(/[^a-zA-Z0-9]/g, '-')}" 
                                           value="${model}"
                                           ${selectedPdmModels.includes(model) ? 'checked' : ''}>
                                    <label for="pdm-model-${model.replace(/[^a-zA-Z0-9]/g, '-')}">
                                        <i class="fa-solid fa-table"></i> ${model}
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>

    <div class="settings-section">
      <div class="settings-section-title">
        <i class="fa-solid fa-list-tree"></i>
        Left Panel Configuration
      </div>
      <div class="settings-grid">

<div class="setting-item">
  <label class="setting-label">Drag to Reorder Models</label>
  <div class="setting-description">Allow dragging models to reorder them</div>
  <div class="setting-control">
    <input type="checkbox" class="setting-checkbox" id="lp-enableModelDrag" 
           ${s.enableModelDrag !== false ? 'checked' : ''}>
    <label for="lp-enableModelDrag">Enable model drag & drop</label>
  </div>
</div>

<div class="setting-item">
  <label class="setting-label">Save Model Order</label>
  <div class="setting-description">Remember model order across sessions</div>
  <div class="setting-control">
    <input type="checkbox" class="setting-checkbox" id="lp-saveModelOrder" 
           ${s.saveModelOrder !== false ? 'checked' : ''}>
    <label for="lp-saveModelOrder">Save model order</label>
  </div>
</div>

<div class="setting-item">
  <label class="setting-label">Reset Model Order</label>
  <div class="setting-description">Reset to alphabetical order</div>
  <div class="setting-control">
    <button class="setting-btn btn-small" onclick="resetModelOrder()" style="margin-top: 5px;">
      <i class="fa-solid fa-rotate-left"></i> Reset Order
    </button>
  </div>
</div>
        <div class="setting-item">
          <label class="setting-label">Panel Width</label>
          <div class="setting-description">Width of the left panel in pixels</div>
          <div class="setting-control">
            <input type="range" class="setting-slider" id="lp-width" min="200" max="800" step="10" 
                   value="${s.leftPanelWidth || 300}" oninput="updateLeftPanelWidthDisplay()">
            <span class="info-badge" id="lp-width-display">${s.leftPanelWidth || 300}px</span>
          </div>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">Default State</label>
          <div class="setting-description">How the left panel starts when app loads</div>
          <select class="setting-select" id="lp-defaultState">
            <option value="closed" ${s.defaultState === 'closed' ? 'selected' : ''}>Closed</option>
            <option value="open" ${s.defaultState === 'open' ? 'selected' : ''}>Open</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">Default Expand Models</label>
          <div class="setting-description">Automatically expand all model groups</div>
          <div class="setting-control">
            <input type="checkbox" class="setting-checkbox" id="lp-defaultExpand" ${s.defaultExpand ? 'checked' : ''}>
            <label for="lp-defaultExpand">Expand models by default</label>
          </div>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">Enable RegExp Search</label>
          <div class="setting-description">Use regular expressions in left panel search</div>
          <div class="setting-control">
            <input type="checkbox" class="setting-checkbox" id="lp-regexSearch" ${s.regexSearch !== false ? 'checked' : ''}>
            <label for="lp-regexSearch">Enable regex search</label>
          </div>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">Show Entity Counts</label>
          <div class="setting-description">Display entity/table counts in model headers</div>
          <div class="setting-control">
            <input type="checkbox" class="setting-checkbox" id="lp-showCounts" ${s.showCounts !== false ? 'checked' : ''}>
            <label for="lp-showCounts">Show counts</label>
          </div>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">Show Stereotype Colors</label>
          <div class="setting-description">Color-code items by stereotype in left panel</div>
          <div class="setting-control">
            <input type="checkbox" class="setting-checkbox" id="lp-showStereotypeColors" ${s.showStereotypeColors !== false ? 'checked' : ''}>
            <label for="lp-showStereotypeColors">Show stereotype colors</label>
          </div>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">Animation Speed</label>
          <div class="setting-description">Speed of expand/collapse animations (ms)</div>
          <div class="setting-control">
            <input type="range" class="setting-slider" id="lp-animationSpeed" min="0" max="500" step="50" 
                   value="${s.animationSpeed || 200}" oninput="updateLeftPanelAnimationDisplay()">
            <span class="info-badge" id="lp-animation-display">${s.animationSpeed || 200}ms</span>
          </div>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">Search Filter Delay</label>
          <div class="setting-description">Delay before filtering while typing (ms)</div>
          <div class="setting-control">
            <input type="range" class="setting-slider" id="lp-filterDelay" min="0" max="1000" step="50" 
                   value="${s.filterDelay || 300}" oninput="updateLeftPanelFilterDelayDisplay()">
            <span class="info-badge" id="lp-filter-delay-display">${s.filterDelay || 300}ms</span>
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
          <label class="setting-label">Font Size</label>
          <div class="setting-description">Font size for left panel text</div>
          <select class="setting-select" id="lp-fontSize">
            <option value="small" ${s.fontSize === 'small' ? 'selected' : ''}>Small (12px)</option>
            <option value="medium" ${s.fontSize === 'medium' || !s.fontSize ? 'selected' : ''}>Medium (13px)</option>
            <option value="large" ${s.fontSize === 'large' ? 'selected' : ''}>Large (14px)</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">Font Weight</label>
          <div class="setting-description">Font weight for headers</div>
          <select class="setting-select" id="lp-fontWeight">
            <option value="400" ${s.fontWeight === '400' ? 'selected' : ''}>Normal (400)</option>
            <option value="500" ${s.fontWeight === '500' || !s.fontWeight ? 'selected' : ''}>Medium (500)</option>
            <option value="600" ${s.fontWeight === '600' ? 'selected' : ''}>Semi-bold (600)</option>
            <option value="700" ${s.fontWeight === '700' ? 'selected' : ''}>Bold (700)</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">Item Height</label>
          <div class="setting-description">Height of each item in the list (px)</div>
          <div class="setting-control">
            <input type="range" class="setting-slider" id="lp-itemHeight" min="30" max="100" step="2" 
                   value="${s.itemHeight || 36}" oninput="updateLeftPanelItemHeightDisplay()">
            <span class="info-badge" id="lp-item-height-display">${s.itemHeight || 36}px</span>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-buttons">
      <button class="setting-btn primary" onclick="applyLeftPanelSettings()">
        <i class="fa-solid fa-check"></i> Apply Left Panel Settings
      </button>
      <button class="setting-btn" onclick="resetLeftPanelSettings()">
        <i class="fa-solid fa-rotate-left"></i> Reset to Defaults
      </button>
    </div>
  `;
}

/**
 * Select all CDM models
 */
function selectAllCDMModels() {
    const checkboxes = document.querySelectorAll('#cdmModelList input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
}

/**
 * Deselect all CDM models
 */
function deselectAllCDMModels() {
    const checkboxes = document.querySelectorAll('#cdmModelList input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
}

/**
 * Select all PDM models
 */
function selectAllPDMModels() {
    const checkboxes = document.querySelectorAll('#pdmModelList input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
}

/**
 * Deselect all PDM models
 */
function deselectAllPDMModels() {
    const checkboxes = document.querySelectorAll('#pdmModelList input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
}


// Replace the existing applyLeftPanelSettings function with this corrected version:
function applyLeftPanelSettings() {
  state.settings.leftPanel = state.settings.leftPanel || {};

  // Get selected CDM models
  const cdmCheckboxes = document.querySelectorAll('#cdmModelList input[type="checkbox"]:checked');
  const selectedCdmModels = Array.from(cdmCheckboxes).map(cb => cb.value);
  state.settings.leftPanel.selectedModelsCDM = selectedCdmModels;
  
  // Get selected PDM models
  const pdmCheckboxes = document.querySelectorAll('#pdmModelList input[type="checkbox"]:checked');
  const selectedPdmModels = Array.from(pdmCheckboxes).map(cb => cb.value);
  state.settings.leftPanel.selectedModelsPDM = selectedPdmModels;

  // Get values from DOM
  const widthSlider = document.getElementById('lp-width');
  const defaultState = document.getElementById('lp-defaultState');
  const defaultExpand = document.getElementById('lp-defaultExpand');
  const regexSearch = document.getElementById('lp-regexSearch');
  const enableModelDrag = document.getElementById('lp-enableModelDrag');
  const saveModelOrder = document.getElementById('lp-saveModelOrder');
  const showCounts = document.getElementById('lp-showCounts');
  const showStereotypeColors = document.getElementById('lp-showStereotypeColors');
  const animationSpeed = document.getElementById('lp-animationSpeed');
  const filterDelay = document.getElementById('lp-filterDelay');
  const fontSize = document.getElementById('lp-fontSize');
  const fontWeight = document.getElementById('lp-fontWeight');
  const itemHeight = document.getElementById('lp-itemHeight');
  
  // Update state
  if (widthSlider) {
    state.settings.leftPanel.leftPanelWidth = parseInt(widthSlider.value, 10);
  }
  if (defaultState) {
    state.settings.leftPanel.defaultState = defaultState.value;
  }
  if (defaultExpand) {
    state.settings.leftPanel.defaultExpand = defaultExpand.checked;
  }
  if (regexSearch) {
    state.settings.leftPanel.regexSearch = regexSearch.checked;
  }
  if (enableModelDrag) {
    state.settings.leftPanel.enableModelDrag = enableModelDrag.checked;
  }
  if (saveModelOrder) {
    state.settings.leftPanel.saveModelOrder = saveModelOrder.checked;
  }
  if (showCounts) {
    state.settings.leftPanel.showCounts = showCounts.checked;
  }
  if (showStereotypeColors) {
    state.settings.leftPanel.showStereotypeColors = showStereotypeColors.checked;
  }
  if (animationSpeed) {
    state.settings.leftPanel.animationSpeed = parseInt(animationSpeed.value, 10);
  }
  if (filterDelay) {
    state.settings.leftPanel.filterDelay = parseInt(filterDelay.value, 10);
  }
  if (fontSize) {
    state.settings.leftPanel.fontSize = fontSize.value;
  }
  if (fontWeight) {
    state.settings.leftPanel.fontWeight = fontWeight.value;
  }
  if (itemHeight) {
    state.settings.leftPanel.itemHeight = parseInt(itemHeight.value, 10);
  }
  
  // Apply settings immediately
  applyLeftPanelStyleSettings();
    // Debug: log the selected models
  console.log('Selected CDM models:', state.settings.leftPanel.selectedModelsCDM);
  console.log('Selected PDM models:', state.settings.leftPanel.selectedModelsPDM);
    // Apply model filter to grid
  if (typeof applyLeftPanelModelFilter === 'function') applyLeftPanelModelFilter();
    // Refresh the panel if open
  refreshLeftPanel();
  saveSettings();
  showToast('Left panel settings applied', 'success');
}

// Apply left panel style settings immediately
function applyLeftPanelStyleSettings() {
  applyLeftPanelStyles();
  
  const leftPanel = document.getElementById('leftPanel');
  if (leftPanel && leftPanel.classList.contains('open')) {
    populateLeftPanel();
  }
}

// Apply model selection from Left Panel settings to the grid viewData
function applyLeftPanelModelFilter() {
  try {
    const lp = state.settings.leftPanel || {};
    const mode = state.mode;
    const selected = mode === 'CDM' ? (lp.selectedModelsCDM || []) : (lp.selectedModelsPDM || []);

    if (!Array.isArray(selected) || selected.length === 0) {
      // No filter -> show all
      state.viewData = Array.isArray(state.allData) ? state.allData.slice() : [];
    } else {
      state.viewData = (state.allData || []).filter(row => {
        const model = (row && (row.Model || row.model)) || 'N/A';
        return selected.includes(model);
      });
    }

    // Refresh grid UI
    if (typeof updateCounter === 'function') updateCounter();
    if (typeof renderHeaders === 'function') renderHeaders();
    if (typeof updateGridMetrics === 'function') updateGridMetrics();
    if (typeof renderVirtualRows === 'function') renderVirtualRows();
  } catch (err) {
    console.error('Error applying left panel model filter:', err);
  }
}
// expose globally
window.applyLeftPanelModelFilter = applyLeftPanelModelFilter;

// Replace the existing filterModelsBySettings function with this corrected version:
function filterModelsBySettings(models, mode) {
    const settings = state.settings.leftPanel || {};
    
    // Debug: log what's happening
    console.log(`Filtering ${mode} models. Available models:`, models);
    console.log(`Selected models for ${mode}:`, mode === 'CDM' ? settings.selectedModelsCDM : settings.selectedModelsPDM);
    
    if (mode === 'CDM') {
        // If no filter is set for CDM, show all models
        if (!settings.selectedModelsCDM || settings.selectedModelsCDM.length === 0) {
            console.log('No CDM filter set, showing all models');
            return models;
        }
        // Filter CDM models by selected list
        const filtered = models.filter(model => settings.selectedModelsCDM.includes(model));
        console.log('Filtered CDM models:', filtered);
        return filtered;
    } else if (mode === 'PDM') {
        // If no filter is set for PDM, show all models
        if (!settings.selectedModelsPDM || settings.selectedModelsPDM.length === 0) {
            console.log('No PDM filter set, showing all models');
            return models;
        }
        // Filter PDM models by selected list
        const filtered = models.filter(model => settings.selectedModelsPDM.includes(model));
        console.log('Filtered PDM models:', filtered);
        return filtered;
    }
    
    // Return all models if no filter is set
    console.log('No mode matched, returning all models');
    return models;
}

// Apply left panel style settings immediately
function applyLeftPanelStyles() {
  const leftPanel = document.getElementById('leftPanel');
  if (!leftPanel) return;

  const lp = state.settings.leftPanel || {};
  
  // Apply font size
  const fontSizeMap = { small: '12px', medium: '13px', large: '14px' };
  const fontSize = fontSizeMap[lp.fontSize] || '13px';
  leftPanel.style.fontSize = fontSize;
  
  // Apply font weight
  const fontWeight = lp.fontWeight || '500';
  leftPanel.style.fontWeight = fontWeight;
  
  // Apply item height
  const itemHeight = lp.itemHeight || 36;
  
  // Apply width
  const width = lp.leftPanelWidth || 300;
  leftPanel.style.width = `${width}px`;
  
  // Update CSS custom properties
  document.documentElement.style.setProperty('--left-panel-width', `${width}px`);
  document.documentElement.style.setProperty('--left-panel-item-height', `${itemHeight}px`);
  document.documentElement.style.setProperty('--left-panel-animation-speed', `${lp.animationSpeed || 200}ms`);
  document.documentElement.style.setProperty('--left-panel-font-weight', fontWeight);
  
  // Also update the grid wrapper if panel is open
  if (leftPanel.classList.contains('open')) {
    const gridWrapper = document.querySelector('.grid-wrapper');
    if (gridWrapper) {
      gridWrapper.style.marginLeft = `${width}px`;
    }
  }
}

// Reset left panel settings to defaults
function resetLeftPanelSettings() {
  if (confirm('Reset left panel settings to defaults?')) {
    state.settings.leftPanel = {
      defaultState: 'remember',
      defaultExpand: false,
      regexSearch: true,
      enableModelDrag: true,
      showCounts: true,
      showStereotypeColors: true,
      animationSpeed: 200,
      filterDelay: 300,
      fontSize: 'medium',
      fontWeight: '500',
      itemHeight: 36
    };
    
    state.settings.general.leftPanelWidth = 300;
    // Re-render settings
    if (typeof renderSettingsContent === 'function') {
      renderSettingsContent('leftpanel');
    }
    
    // Apply immediately
    applyLeftPanelStyleSettings();
    
    saveSettings();
    showToast('Left panel settings reset to defaults', 'success');
  }
}

// Apply left panel styles from settings
function applyLeftPanelStyles() {
  const leftPanel = document.getElementById('leftPanel');
  if (!leftPanel) return;

  const lp = state.settings.leftPanel || {};
  
  // Apply font size
  const fontSizeMap = { small: '12px', medium: '13px', large: '14px' };
  const fontSize = fontSizeMap[lp.fontSize] || '13px';
  leftPanel.style.fontSize = fontSize;
  leftPanel.style.setProperty('font-size', fontSize);
  // Apply font weight
  const fontWeight = lp.fontWeight || '500';
  leftPanel.style.setProperty('--left-panel-font-weight', fontWeight);
  
  // Apply item height
  const itemHeight = lp.itemHeight || 36;
  leftPanel.style.setProperty('--left-panel-item-height', `${itemHeight}px`);
  
  // Apply animation speed
  const animationSpeed = lp.animationSpeed || 200;
  leftPanel.style.setProperty('--left-panel-animation-speed', `${animationSpeed}ms`);
  
  // Apply width
  const width = leftPanel.leftPanelWidth || 300;
  leftPanel.style.width = `${width}px`;
  document.documentElement.style.setProperty('--left-panel-width', `${width}px`);
}

/**
 * Groups relationships by model for CDM mode
 */
function groupCDMRelationshipsByModel(items) {
  const map = new Map();
  
  items.forEach(entity => {
    const model = (entity.Model || 'N/A').trim();
    let rec = map.get(model);
    if (!rec) rec = { model, relationshipsMap: new Map(), items: [] };
    
    // Collect relationships from entity.Relationships (array of objects)
    const relationships = Array.isArray(entity.Relationships) ? entity.Relationships : [];
    relationships.forEach(rel => {
      const relKey = `${rel.ChildEntity}-${rel.ParentEntity}-${rel.name || ''}`;
      const entry = rec.relationshipsMap.get(relKey) || { 
        name: rel.name || '',
        childEntity: rel.ChildEntity || '',
        parentEntity: rel.ParentEntity || '',
        childCardinality: rel.childCardinality || '',
        parentCardinality: rel.parentCardinality || '',
        diagramContainers: rel.DiagramContainers || '',
        entities: new Set()
      };
      
      // Add entities involved in this relationship
      if (rel.ChildEntity) entry.entities.add(rel.ChildEntity);
      if (rel.ParentEntity) entry.entities.add(rel.ParentEntity);
      
      rec.relationshipsMap.set(relKey, entry);
    });
    
    rec.items.push(entity);
    map.set(model, rec);
  });
  
  // Convert to array and sort
  const result = Array.from(map.values()).sort((a, b) => a.model.localeCompare(b.model));
  result.forEach(rec => {
    rec.relationships = Array.from(rec.relationshipsMap.values()).sort((a, b) => {
      // Sort by relationship name, then by child entity
      if (a.name && b.name) return a.name.localeCompare(b.name);
      if (a.childEntity && b.childEntity) return a.childEntity.localeCompare(b.childEntity);
      return 0;
    });
    
    // Convert entity sets to arrays
    rec.relationships.forEach(rel => {
      rel.entities = Array.from(rel.entities);
    });
  });
  
  return result;
}

/**
 * Groups references by model for PDM mode
 */
function groupPDMReferencesByModel(items) {
  const map = new Map();

  items.forEach(table => {
    const model = (table.Model || 'N/A').trim();
    let rec = map.get(model);
    if (!rec) rec = { model, referencesMap: new Map(), items: [] };

    const references = Array.isArray(table.References) ? table.References : [];
    references.forEach(ref => {
      const childTable = ref.ChildTable || ref.childTable || '';
      const parentTable = ref.ParentTable || ref.parentTable || '';
      const childColumn = ref.ChildColumn || ref.childColumn || '';
      const parentColumn = ref.ParentColumn || ref.parentColumn || '';
      const key = `${ref.name || ''}-${childTable}-${parentTable}-${childColumn}-${parentColumn}`;

      let entry = rec.referencesMap.get(key);
      if (!entry) entry = {
        name: ref.name || '',
        childTable,
        parentTable,
        childColumn,
        parentColumn,
        cardinality: ref.Cardinality || ref.cardinality || '',
        mandatory: ref.Mandatory || ref.mandatory || false,
        generated: ref.Generated || ref.generated || false,
        diagramContainers: ref.DiagramContainers || ref.diagramContainers || '',
        tables: new Set()
      };

      if (childTable) entry.tables.add(childTable);
      if (parentTable) entry.tables.add(parentTable);

      rec.referencesMap.set(key, entry);
    });

    rec.items.push(table);
    map.set(model, rec);
  });

  // Convert to array and sort
  const result = Array.from(map.values()).sort((a, b) => a.model.localeCompare(b.model));
  result.forEach(rec => {
    rec.references = Array.from(rec.referencesMap.values()).sort((a, b) => {
      if (a.name && b.name) return a.name.localeCompare(b.name);
      if (a.childTable && b.childTable) return a.childTable.localeCompare(b.childTable);
      return 0;
    });

    // Convert table sets to arrays
    rec.references.forEach(ref => {
      ref.tables = Array.from(ref.tables);
    });
  });

  return result;
}

/**
 * Shows relationship details modal for CDM
 */
function showRelationshipDetailsModal(relationship, modelName) {
  try {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal-box';
    modal.style.maxWidth = '700px';

    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <div class="title">
        <i class="fa-solid fa-code-branch"></i>
        Relationship: <strong>${escapeHtml(relationship.name || 'Unnamed Relationship')}</strong>
      </div>
      <button class="modal-close">&times;</button>
    `;
    
    modal.appendChild(header);

    // Create tabs for relationship details
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'pdm-tabs';
    
    const tabs = [
      { name: 'Relationship Details', type: 'details', icon: 'fa-info-circle' },
      { name: 'Involved Entities', type: 'entities', icon: 'fa-sitemap' },
      { name: 'Related Diagrams', type: 'diagrams', icon: 'fa-diagram-project' }
    ];

    tabs.forEach((tab, index) => {
      const tabElement = document.createElement('div');
      tabElement.className = `pdm-tab ${index === 0 ? 'active' : ''}`;
      tabElement.dataset.tabType = tab.type;
      tabElement.innerHTML = `
        <i class="fa-solid ${tab.icon}"></i> 
        ${escapeHtml(tab.name)}
      `;
      tabElement.addEventListener('click', () => {
        tabsContainer.querySelectorAll('.pdm-tab').forEach(t => t.classList.remove('active'));
        tabElement.classList.add('active');
        contentContainer.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        const content = contentContainer.querySelector(`.tab-content[data-tab-type="${tab.type}"]`);
        if (content) content.style.display = 'block';
      });
      tabsContainer.appendChild(tabElement);
    });

    modal.appendChild(tabsContainer);

    const contentContainer = document.createElement('div');
    contentContainer.style.position = 'relative';
    contentContainer.style.minHeight = '300px';

    // Details tab
    const detailsContent = document.createElement('div');
    detailsContent.className = 'tab-content';
    detailsContent.dataset.tabType = 'details';
    detailsContent.style.display = 'block';
    
    const childSymbols = parseCardinality(relationship.childCardinality);
    const parentSymbols = parseCardinality(relationship.parentCardinality);
    const connector = getRelationshipConnector(relationship.childCardinality, relationship.parentCardinality, 'cdm');
    
    detailsContent.innerHTML = `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-secondary); border-radius: 6px; border-left: 4px solid var(--accent-cdm);">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 14px; text-align: center; margin-bottom: 10px;">
            ${escapeHtml(relationship.childEntity)} ${childSymbols.left} ${connector} ${parentSymbols.right} ${escapeHtml(relationship.parentEntity)}
          </div>
          ${relationship.name ? `<div style="text-align: center; font-size: 12px; color: var(--text-secondary);">"${escapeHtml(relationship.name)}"</div>` : ''}
        </div>
        
        <table class="modal-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Model</td><td>${escapeHtml(decodeString(modelName))}</td></tr>
            <tr><td>Child Entity</td><td><a href="#" onclick="event.preventDefault(); tagSearch('CDM', '${encodeString(relationship.childEntity)}')">${escapeHtml(relationship.childEntity)}</a></td></tr>
            <tr><td>Parent Entity</td><td><a href="#" onclick="event.preventDefault(); tagSearch('CDM', '${encodeString(relationship.parentEntity)}')">${escapeHtml(relationship.parentEntity)}</a></td></tr>
            <tr><td>Child Cardinality</td><td>${escapeHtml(relationship.childCardinality)}</td></tr>
            <tr><td>Parent Cardinality</td><td>${escapeHtml(relationship.parentCardinality)}</td></tr>
            ${relationship.diagramContainers ? `<tr><td>Diagram Containers</td><td>${escapeHtml(relationship.diagramContainers)}</td></tr>` : ''}
          </tbody>
        </table>
      </div>
    `;
    
    contentContainer.appendChild(detailsContent);

    // Entities tab
    const entitiesContent = document.createElement('div');
    entitiesContent.className = 'tab-content';
    entitiesContent.dataset.tabType = 'entities';
    entitiesContent.style.display = 'none';
    
    let entitiesHtml = '<div style="padding: 20px;">';
    if (relationship.entities && relationship.entities.length > 0) {
      entitiesHtml += `
        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
      `;
      
      relationship.entities.forEach(entityName => {
        // Find entity data
        const entityData = state.cdmData.find(e => 
          (e.Name && e.Name.toLowerCase() === entityName.toLowerCase()) ||
          (e.name && e.name.toLowerCase() === entityName.toLowerCase())
        );
        
        const stereotype = entityData?.Stereotype || '';
        const stereotypeClass = getStereotypeColorClass(stereotype);
        
        entitiesHtml += `
          <div class="entity-box ${stereotypeClass}" 
               onclick="event.stopPropagation(); showLinkedEntitiesModal({
                 source: '${escapeHtml(entityName)}',
                 target: '${escapeHtml(entityName === relationship.childEntity ? relationship.parentEntity : relationship.childEntity)}',
                 sourceCardinality: '${escapeHtml(entityName === relationship.childEntity ? relationship.childCardinality : relationship.parentCardinality)}',
                 targetCardinality: '${escapeHtml(entityName === relationship.childEntity ? relationship.parentCardinality : relationship.childCardinality)}',
                 direction: '${entityName === relationship.childEntity ? 'outgoing' : 'incoming'}',
                 type: 'cdm_relationship'
               }, '${escapeHtml(entityName)}', 'CDM')"
               style="cursor: pointer; min-width: 120px; text-align: center; padding: 10px;">
            <div style="font-weight: 600;">${escapeHtml(entityName)}</div>
            ${stereotype ? `<div style="font-size: 10px; margin-top: 4px; opacity: 0.8;">${escapeHtml(stereotype)}</div>` : ''}
            <div style="font-size: 10px; margin-top: 4px; color: var(--text-secondary);">
              ${entityName === relationship.childEntity ? 'Child' : 'Parent'}
            </div>
          </div>
        `;
      });
      
      entitiesHtml += '</div>';
    } else {
      entitiesHtml += '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">No entities found</div>';
    }
    entitiesHtml += '</div>';
    
    entitiesContent.innerHTML = entitiesHtml;
    contentContainer.appendChild(entitiesContent);

    // Diagrams tab
    const diagramsContent = document.createElement('div');
    diagramsContent.className = 'tab-content';
    diagramsContent.dataset.tabType = 'diagrams';
    diagramsContent.style.display = 'none';
    
    let diagramsHtml = '<div style="padding: 20px;">';
    if (relationship.diagramContainers) {
      const diagrams = relationship.diagramContainers.split(',').map(d => d.trim()).filter(d => d);
      if (diagrams.length > 0) {
        diagramsHtml += `
          <p style="margin-bottom: 15px; color: var(--text-secondary);">
            This relationship appears in ${diagrams.length} diagram(s):
          </p>
          <div style="display: flex; flex-direction: column; gap: 10px;">
        `;
        
        diagrams.forEach(diagram => {
          diagramsHtml += `
            <button onclick="showCDMDiagramModal('${encodeString(diagram)}', '${modelName}')" title="${modelName}"
                    style="display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; text-align: left; transition: background 0.2s;"
                    onmouseover="this.style.background='var(--hover-bg)'"
                    onmouseout="this.style.background='var(--bg-secondary)'">
              <span>
                <i class="fa-solid fa-diagram-project" style="margin-right: 8px; color: var(--accent-cdm);"></i>
                ${escapeHtml(diagram)}
              </span>
              <i class="fa-solid fa-chevron-right" style="color: var(--text-secondary);"></i>
            </button>
          `;
        });
        
        diagramsHtml += '</div>';
      } else {
        diagramsHtml += '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">No diagrams found</div>';
      }
    } else {
      diagramsHtml += '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">No diagram containers specified</div>';
    }
    diagramsHtml += '</div>';
    
    diagramsContent.innerHTML = diagramsHtml;
    contentContainer.appendChild(diagramsContent);

    modal.appendChild(contentContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    header.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { 
      if (e.target === overlay) overlay.remove(); 
    });

    showToast(`Showing relationship: ${relationship.name || 'Unnamed'}`, 'info');

  } catch (error) {
    console.error('Error showing relationship details modal:', error);
    showToast('Failed to load relationship details', 'error');
  }
}

/**
 * Shows reference details modal for PDM
 */
function showReferenceDetailsModal(reference, modelName) {
  try {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal-box';
    modal.style.maxWidth = '700px';

    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <div class="title">
        <i class="fa-solid fa-link"></i>
        Foreign Key Reference: <strong>${escapeHtml(reference.name || 'Unnamed Reference')}</strong>
      </div>
      <button class="modal-close">&times;</button>
    `;
    
    modal.appendChild(header);

    // Create tabs for reference details
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'pdm-tabs';
    
    const tabs = [
      { name: 'Reference Details', type: 'details', icon: 'fa-info-circle' },
      { name: 'Involved Tables', type: 'tables', icon: 'fa-table' },
      { name: 'Related Diagrams', type: 'diagrams', icon: 'fa-diagram-project' }
    ];

    tabs.forEach((tab, index) => {
      const tabElement = document.createElement('div');
      tabElement.className = `pdm-tab ${index === 0 ? 'active' : ''}`;
      tabElement.dataset.tabType = tab.type;
      tabElement.innerHTML = `
        <i class="fa-solid ${tab.icon}"></i> 
        ${escapeHtml(tab.name)}
      `;
      tabElement.addEventListener('click', () => {
        tabsContainer.querySelectorAll('.pdm-tab').forEach(t => t.classList.remove('active'));
        tabElement.classList.add('active');
        contentContainer.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        const content = contentContainer.querySelector(`.tab-content[data-tab-type="${tab.type}"]`);
        if (content) content.style.display = 'block';
      });
      tabsContainer.appendChild(tabElement);
    });

    modal.appendChild(tabsContainer);

    const contentContainer = document.createElement('div');
    contentContainer.style.position = 'relative';
    contentContainer.style.minHeight = '300px';

    // Details tab
    const detailsContent = document.createElement('div');
    detailsContent.className = 'tab-content';
    detailsContent.dataset.tabType = 'details';
    detailsContent.style.display = 'block';
    
    const childCardinality = reference.cardinality || '0..*';
    const parentCardinality = reference.mandatory === 'True' || reference.mandatory === true ? '1..1' : '0..1';
    const childSymbols = parseCardinality(childCardinality);
    const parentSymbols = parseCardinality(parentCardinality);
    const connector = getRelationshipConnector(childCardinality, parentCardinality, 'foreign_key');
    
    detailsContent.innerHTML = `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-secondary); border-radius: 6px; border-left: 4px solid var(--accent-pdm);">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 14px; text-align: center; margin-bottom: 10px;">
            ${escapeHtml(reference.childTable)} ${childSymbols.left} ${connector} ${parentSymbols.right} ${escapeHtml(reference.parentTable)}
          </div>
          <div style="text-align: center; font-size: 12px; color: var(--text-secondary); margin-bottom: 5px;">
            ${escapeHtml(reference.childColumn)} → ${escapeHtml(reference.parentColumn)}
          </div>
          ${reference.name ? `<div style="text-align: center; font-size: 12px; color: var(--text-secondary);">"${escapeHtml(reference.name)}"</div>` : ''}
        </div>
        
        <table class="modal-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Model</td><td>${decodeString(modelName)}</td></tr>
            <tr><td>Child Table</td><td><a href="#" onclick="event.preventDefault(); tagSearch('PDM', '${encodeString(reference.childTable)}')">${escapeHtml(reference.childTable)}</a></td></tr>
            <tr><td>Parent Table</td><td><a href="#" onclick="event.preventDefault(); tagSearch('PDM', '${encodeString(reference.parentTable)}')">${escapeHtml(reference.parentTable)}</a></td></tr>
            <tr><td>Child Column</td><td>${escapeHtml(reference.childColumn)}</td></tr>
            <tr><td>Parent Column</td><td>${escapeHtml(reference.parentColumn)}</td></tr>
            <tr><td>Cardinality</td><td>${escapeHtml(childCardinality)}</td></tr>
            <tr><td>Mandatory</td><td>${escapeHtml(reference.mandatory)}</td></tr>
            <tr><td>Generated</td><td>${escapeHtml(reference.generated)}</td></tr>
            ${reference.diagramContainers ? `<tr><td>Diagram Containers</td><td>${escapeHtml(reference.diagramContainers)}</td></tr>` : ''}
          </tbody>
        </table>
      </div>
    `;
    
    contentContainer.appendChild(detailsContent);

    // Tables tab
    const tablesContent = document.createElement('div');
    tablesContent.className = 'tab-content';
    tablesContent.dataset.tabType = 'tables';
    tablesContent.style.display = 'none';
    
    let tablesHtml = '<div style="padding: 20px;">';
    if (reference.tables && reference.tables.length > 0) {
      tablesHtml += `
        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
      `;
      
      reference.tables.forEach(tableName => {
        // Find table data
        const tableData = state.pdmData.find(t => 
          (t.Name && t.Name.toLowerCase() === tableName.toLowerCase()) ||
          (t.Code && t.Code.toLowerCase() === tableName.toLowerCase())
        );
        
        const stereotype = tableData?.Stereotype || '';
        const stereotypeClass = getStereotypeColorClass(stereotype);
        
        tablesHtml += `
          <div class="entity-box ${stereotypeClass}" 
               onclick="event.stopPropagation(); showLinkedEntitiesModal({
                 source: '${escapeHtml(tableName)}',
                 target: '${escapeHtml(tableName === reference.childTable ? reference.parentTable : reference.childTable)}',
                 sourceCardinality: '${escapeHtml(tableName === reference.childTable ? childCardinality : parentCardinality)}',
                 targetCardinality: '${escapeHtml(tableName === reference.childTable ? parentCardinality : childCardinality)}',
                 direction: '${tableName === reference.childTable ? 'outgoing' : 'incoming'}',
                 type: 'foreign_key'
               }, '${escapeHtml(tableName)}', 'PDM')"
               style="cursor: pointer; min-width: 120px; text-align: center; padding: 10px;">
            <div style="font-weight: 600;">${escapeHtml(tableName)}</div>
            ${stereotype ? `<div style="font-size: 10px; margin-top: 4px; opacity: 0.8;">${escapeHtml(stereotype)}</div>` : ''}
            <div style="font-size: 10px; margin-top: 4px; color: var(--text-secondary);">
              ${tableName === reference.childTable ? 'Child Table' : 'Parent Table'}
            </div>
          </div>
        `;
      });
      
      tablesHtml += '</div>';
    } else {
      tablesHtml += '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">No tables found</div>';
    }
    tablesHtml += '</div>';
    
    tablesContent.innerHTML = tablesHtml;
    contentContainer.appendChild(tablesContent);

    // Diagrams tab
    const diagramsContent = document.createElement('div');
    diagramsContent.className = 'tab-content';
    diagramsContent.dataset.tabType = 'diagrams';
    diagramsContent.style.display = 'none';
    
    let diagramsHtml = '<div style="padding: 20px;">';
    if (reference.diagramContainers) {
      const diagrams = reference.diagramContainers.split(',').map(d => d.trim()).filter(d => d);
      if (diagrams.length > 0) {
        diagramsHtml += `
          <p style="margin-bottom: 15px; color: var(--text-secondary);">
            This reference appears in ${diagrams.length} diagram(s):
          </p>
          <div style="display: flex; flex-direction: column; gap: 10px;">
        `;
        
        diagrams.forEach(diagram => {
          diagramsHtml += `
            <button onclick="showPDMDiagramModal('${encodeString(diagram)}', '${modelName}')"
                    style="display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; text-align: left; transition: background 0.2s;"
                    onmouseover="this.style.background='var(--hover-bg)'"
                    onmouseout="this.style.background='var(--bg-secondary)'">
              <span>
                <i class="fa-solid fa-diagram-project" style="margin-right: 8px; color: var(--accent-pdm);"></i>
                ${escapeHtml(diagram)}
              </span>
              <i class="fa-solid fa-chevron-right" style="color: var(--text-secondary);"></i>
            </button>
          `;
        });
        
        diagramsHtml += '</div>';
      } else {
        diagramsHtml += '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">No diagrams found</div>';
      }
    } else {
      diagramsHtml += '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">No diagram containers specified</div>';
    }
    diagramsHtml += '</div>';
    
    diagramsContent.innerHTML = diagramsHtml;
    contentContainer.appendChild(diagramsContent);

    modal.appendChild(contentContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    header.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { 
      if (e.target === overlay) overlay.remove(); 
    });

    showToast(`Showing reference: ${reference.name || 'Unnamed'}`, 'info');

  } catch (error) {
    console.error('Error showing reference details modal:', error);
    showToast('Failed to load reference details', 'error');
  }
}

/**
 * Parses references for a specific table in PDM mode
 * Used by showTableModal in UI.js
 */
function parsePDMReferences(table) {
  if (!table) return [];
  
  const references = Array.isArray(table.References) ? table.References : [];
  
  // Format references for display in table modal
  return references.map(ref => {
    return {
      name: ref.name || '',
      childTable: ref.ChildTable || ref.childTable || '',
      parentTable: ref.ParentTable || ref.parentTable || '',
      childColumn: ref.ChildColumn || ref.childColumn || '',
      parentColumn: ref.ParentColumn || ref.parentColumn || '',
      cardinality: ref.Cardinality || ref.cardinality || '',
      mandatory: ref.Mandatory || ref.mandatory || 'False',
      generated: ref.Generated || ref.generated || 'False',
      diagramContainers: ref.DiagramContainers || ref.diagramContainers || ''
    };
  });
}

// Make it globally available so UI.js can call it
window.parsePDMReferences = parsePDMReferences;

// Add this debug function to test the filtering:
function debugModelFiltering() {
    console.log('=== DEBUG MODEL FILTERING ===');
    console.log('Current mode:', state.mode);
    console.log('Left panel settings:', state.settings.leftPanel);
    console.log('CDM models available:', [...new Set(state.cdmData.map(item => item.Model).filter(Boolean))]);
    console.log('PDM models available:', [...new Set(state.pdmData.map(item => item.Model).filter(Boolean))]);
    console.log('Selected CDM models:', state.settings.leftPanel?.selectedModelsCDM || []);
    console.log('Selected PDM models:', state.settings.leftPanel?.selectedModelsPDM || []);
    
    // Test the filter function
    const cdmModels = [...new Set(state.cdmData.map(item => item.Model || 'Uncategorized'))];
    const pdmModels = [...new Set(state.pdmData.map(item => item.Model || 'Uncategorized'))];
    
    console.log('Filtered CDM models:', filterModelsBySettings(cdmModels, 'CDM'));
    console.log('Filtered PDM models:', filterModelsBySettings(pdmModels, 'PDM'));
    console.log('=== END DEBUG ===');
}

// Call it from console or add a button in settings
window.debugModelFiltering = debugModelFiltering;