// ==================================================================
// MODULE: OVERVIEW TAB RENDERING
// ==================================================================

/** Sidebar helpers (unchanged) */
function openSidebar(data) {
  els.sidebar.classList.add('open');
  const activeTab = document.querySelector('.tab.active')?.dataset.tab;
  renderSidebarContent(data, activeTab);
}

function closeSidebar() {
  els.sidebar.classList.remove('open');
  state.selectedRowIndex = -1;
  state.selectedRowIndexes = [];
  state.lastClickedIndex = -1;
}

/**
 * Renders the sidebar content
 */
function renderSidebarContent(data, tab) {
  const container = document.getElementById('sidebarContent');
  container.innerHTML = '';
  const tabs = document.querySelectorAll('.tab');
  if (tab === 'overview') {
    renderOverviewTab(data);
  } else {
    let objToRender;
    if (state.mode === 'CDM') {
      objToRender = tab === 'entity' ? (data._parentEntity || {}) : (data._rawAttribute || data);
      if (tab === 'entity') window._sidebarEntityForPopup = objToRender;
    } else {
      objToRender = tab === 'entity' ? (data._parentTable || {}) : (data._rawColumn || data);
      if (tab === 'entity') window._sidebarEntityForPopup = objToRender;
    }
    renderDetailView(objToRender, container);
  }
}

/**
 * Renders the Overview section according to the Mode CDM/PDM
 */
function renderOverviewTab(data) {
  const container = document.getElementById('sidebarContent');
  let html = '';
  try {
    if (state.mode === 'CDM') {
      html += renderCDMOverview(data);
    } else {
      html += renderPDMOverview(data);
    }
  } catch (error) {
    console.error('Error rendering overview tab:', error);
    html = `
      <div class="overview-section">
        <div class="overview-title">Error Loading Overview</div>
        <div>Could not load overview data. Error: ${escapeHtml(error.message || String(error))}</div>
      </div>`;
  }
  container.innerHTML = html;

  // IMPORTANT: make the diagram links clickable
  setupOverviewDiagramLinks();
}

/**
 * Renders the detail section Overview
 */
function renderDetailView(obj, container) {
  let html = '';
  const safeVal = (k, v) => {
    if (k === 'List_parent' || k === 'List_child' || k === 'Diagrams' || k === 'List_relationship') {
      if (Array.isArray(v)) {
        return v.map(item => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join('\n');
      }
      return String(v);
    }
    if (Array.isArray(v)) return `[${v.length} items]`;
    if (typeof v === 'object' && v !== null) return '{...}';
    return v;
  };

  for (const [key, val] of Object.entries(obj || {})) {
    if (key === 'Attributes' || key === 'Columns') continue;
    if (key.startsWith('_')) continue;

    let displayVal = safeVal(key, val);
    let extraStyle = '';
    if (key === 'List_parent' || key === 'List_child' || key === 'Diagrams' || key === 'List_relationship') {
      extraStyle = 'style="white-space: pre-wrap;"';
    }

    if (key === 'Name' && val) {
      displayVal = `[ ${escapeHtml(val)} ]`;
    } else if (key === 'Shareable_link' && val) {
      displayVal = `<a href="${val}" target="_blank" rel="noopener">${escapeHtml(val)}</a>`;
    } else if (key === 'TTS' && val) {
        if (val.includes('<a')){
          displayVal = val ;
        } else {
          displayVal = `<a href="https://tts.codix.eu/jira/browse/${escapeHtml(val)}" target="_blank" rel="noopener">${escapeHtml(val)}</a>`;
        }
    } else if (key === 'Domain' && val) {
        displayVal = `<span class="clickable-domain" onClick="showDomainModal('${encodeString(val)}')">${escapeHtml(val)}</span>`;
    } else {
      displayVal = escapeHtml(String(displayVal));
    }

    html += `<div class="detail-item" ${extraStyle}>
      <div class="detail-label">${escapeHtml(key.replace(/_/g, ' '))}</div>
      <div class="detail-value">${displayVal}</div>
    </div>`;
  }
  container.innerHTML = html;
}

/**
 * Renders the overview tab with entity/table information
 */
 
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('sidebarContent');

  const makeSectionsFoldable = () => {
    const sections = container.querySelectorAll('.overview-section');
    const defaultCollapsed = !!state.settings?.general?.collapseSections;
    const persisted = state.settings?.general?.collapsedById || {};

    sections.forEach(section => {
      const title = section.querySelector('.overview-title') || section.firstElementChild;
      if (!title) return;

      // Ensure each section has an id to persist state; fall back to trimmed title text
      const sid = section.dataset.sectionId || title.textContent.trim();
      section.dataset.sectionId = sid;

      // Wrap remaining content in a body container
      let body = section.querySelector('.__fold-body');
      if (!body) {
        body = document.createElement('div');
        body.className = '__fold-body';
        const siblings = [];
        let node = title.nextSibling;
        while (node) {
          siblings.push(node);
          node = node.nextSibling;
        }
        siblings.forEach(n => body.appendChild(n));
        section.appendChild(body);
      }

      // Apply default or persisted collapsed state
      const collapsed = (sid in persisted) ? !!persisted[sid] : defaultCollapsed;
      body.style.display = collapsed ? 'none' : '';
      section.classList.toggle('collapsed', collapsed);
      title.style.cursor = 'pointer';

      // Toggle on click and persist
      title.addEventListener('click', () => {
        const nowCollapsed = body.style.display !== 'none';
        body.style.display = nowCollapsed ? 'none' : '';
        section.classList.toggle('collapsed', nowCollapsed);

        // Persist per-section state
        state.settings = state.settings || {};
        state.settings.general = state.settings.general || {};
        state.settings.general.collapsedById = state.settings.general.collapsedById || {};
        state.settings.general.collapsedById[section.dataset.sectionId] = nowCollapsed;
        saveSettings();
      });
    });
  };

  // Run after overview content is rendered
  const observer = new MutationObserver(() => makeSectionsFoldable());
  observer.observe(container, { childList: true });
});

/**
 * ==================================================================
 * MODULE: CARDINALITY & RELATIONSHIP HANDLING
 * ==================================================================
 * Handles parsing and display of entity relationships with cardinalities
 */

/**
 * Parses cardinality notation and converts to display symbols
 * @param {string} cardinality - Cardinality string (e.g., '0-1', '1-N')
 * @returns {Object} Left and right symbols for display
 */
function parseCardinality(cardinality) {
    if (!cardinality) return { left: '', right: '' };
    
    const card = String(cardinality).trim().toUpperCase();
    
    // Map cardinalities to (min,max) format
    const symbolMap = {
        // CDM format to (min,max) format
        '0-1': { left: '(0,1)', right: '(0,1)' },
        '1-1': { left: '(1,1)', right: '(1,1)' },
        '0-N': { left: '(0,N)', right: '(0,N)' },
        '1-N': { left: '(1,N)', right: '(1,N)' },
        '0-*': { left: '(0,N)', right: '(0,N)' },
        '1-*': { left: '(1,N)', right: '(1,N)' },
        
        // PDM format
        '0..1': { left: '(0,1)', right: '(0,1)' },
        '1..1': { left: '(1,1)', right: '(1,1)' },
        '0..*': { left: '(0,N)', right: '(0,N)' },
        '1..*': { left: '(1,N)', right: '(1,N)' },
        
        // Other common formats
        'N': { left: '(0,N)', right: '(0,N)' },
        '1': { left: '(1,1)', right: '(1,1)' },
        '0': { left: '(0,1)', right: '(0,1)' },
        '*': { left: '(0,N)', right: '(0,N)' },
        '0..N': { left: '(0,N)', right: '(0,N)' },
        '1..N': { left: '(1,N)', right: '(1,N)' }
    };
    
    return symbolMap[card] || { left: `(${card})`, right: `(${card})` };
}

/**
 * Determines the relationship connector based on cardinalities
 * @param {string} leftCardinality - Left side cardinality
 * @param {string} rightCardinality - Right side cardinality
 * @returns {string} Connector symbol (-->, <--, or --)
 */
function getRelationshipConnector(leftCardinality, rightCardinality, type = '') {
    const leftHasN = (leftCardinality || '').toUpperCase().includes('N') || 
                    (leftCardinality || '').includes('*');
    const rightHasN = (rightCardinality || '').toUpperCase().includes('N') || 
                     (rightCardinality || '').includes('*');
    
    let connector;
    
    // For foreign key relationships in PDM
    if (type === 'foreign_key') {
        // Arrow should point FROM the child table (N side) TO the parent table (1 side)
        if (leftHasN && !rightHasN) {
            connector = '<--'; // Arrow points from N side to 1 side
        } else if (!leftHasN && rightHasN) {
            connector = '-->'; // Arrow points from N side to 1 side (reversed)
        } else {
            connector = '--'; // No clear N side, or both have N
        }
    } 
    // For regular relationships in CDM
    else {
        // Arrow points TO the N side (many side)
        if (leftHasN && !rightHasN) {
            connector = '<--'; // Arrow points away from N (towards the non-N side)
        } else if (!leftHasN && rightHasN) {
            connector = '-->'; // Arrow points toward N
        } else {
            connector = '--'; // No N on either side, or both have N
        }
    }
    
    // Debug logging for foreign key relationships
    if (type === 'foreign_key') {
            leftHasN, 
            rightHasN,
            leftCardinality,
            rightCardinality,
            type
    }
    
    return connector;
}

/**
 * Extracts relationships with cardinalities from relationship text
 * @param {string} relationshipText - Raw relationship text
 * @param {string} currentEntityName - Name of current entity
 * @returns {Array} Array of relationship objects
 */
function extractRelationshipsWithCardinalities(relationshipText, currentEntityName) {
    if (!relationshipText) return [];
    
    const relationships = [];
    
    // If it's already an array, process each item
    if (Array.isArray(relationshipText)) {
        relationshipText.forEach(item => {
            if (typeof item === 'string') {
                const parsed = parseRelationshipLine(item, currentEntityName);
                if (parsed) relationships.push(parsed);
            } else if (typeof item === 'object') {
                // Handle relationship objects directly
                relationships.push(item);
            }
        });
        return relationships;
    }
    
    // Convert to string and split by new lines
    const lines = String(relationshipText).split('\n');
    
    lines.forEach(line => {
        if (!line.trim()) return;
        
        const parsed = parseRelationshipLine(line, currentEntityName);
        if (parsed) relationships.push(parsed);
    });
    
    return relationships;
}

/**
 * Parses a single relationship line to extract entities and cardinalities
 * @param {string} line - Relationship line text
 * @param {string} currentEntityName - Name of current entity
 * @returns {Object|null} Parsed relationship object or null
 */
function parseRelationshipLine(line, currentEntityName) {
    const cleanLine = line.trim();
    
    // Pattern to match: Entity1 (cardinality) --> (cardinality) Entity2
    const patterns = [
        // Pattern: Entity1 (0-1) --> (1-N) Entity2
        /([^(]+)\s*\(([^)]+)\)\s*[-=]+>\s*\(([^)]+)\)\s*([^(]+)/,
        // Pattern: Entity1 --> Entity2 (clean simple format)
        /([^-=]+)\s*[-=]+>\s*([^-=]+)/,
        // Pattern: Entity1 (0-1) -- Entity2 (1-N)
        /([^(]+)\s*\(([^)]+)\)\s*--\s*([^(]+)\s*\(([^)]+)\)/,
        // Simple pattern: Entity1 -- Entity2
        /([^-\s]+)\s*--\s*([^-\s]+)/,
        // Pattern to handle entity1 -- -- -- entity2 by extracting just the entity names
        /([a-zA-Z0-9_]+)\s*[-=\s]+\s*([a-zA-Z0-9_]+)/
    ];
    
    for (const pattern of patterns) {
        const match = cleanLine.match(pattern);
        if (match) {
            let entity1, card1, card2, entity2;
            
            if (match.length >= 5) {
                // Pattern with cardinalities
                entity1 = match[1].trim();
                card1 = match[2].trim();
                card2 = match[3] ? match[3].trim() : '';
                entity2 = match[4] ? match[4].trim() : match[3].trim();
            } else if (match.length >= 3) {
                // Simple pattern without cardinalities
                entity1 = match[1].trim();
                entity2 = match[2].trim();
                card1 = '1'; // Default cardinality
                card2 = '1'; // Default cardinality
            }
            
            // Clean entity names - remove any remaining dashes or symbols
            entity1 = entity1.replace(/[-=*>\s]+$/g, '').replace(/^[-=*<\s]+/g, '').trim();
            entity2 = entity2.replace(/[-=*>\s]+$/g, '').replace(/^[-=*<\s]+/g, '').trim();
            
            if (entity1 && entity2) {
                // Determine direction relative to current entity
                if (entity1 === currentEntityName) {
                    return {
                        source: entity1,
                        target: entity2,
                        sourceCardinality: card1,
                        targetCardinality: card2,
                        direction: 'outgoing'
                    };
                } else if (entity2 === currentEntityName) {
                    return {
                        source: entity2,
                        target: entity1,
                        sourceCardinality: card2,
                        targetCardinality: card1,
                        direction: 'incoming'
                    };
                } else {
                    // If current entity is not explicitly mentioned, assume it's entity1
                    return {
                        source: entity1,
                        target: entity2,
                        sourceCardinality: card1,
                        targetCardinality: card2,
                        direction: 'outgoing'
                    };
                }
            }
        }
    }
    
    return null;
}

/**
 * Formats relationship for display with cardinality symbols
 * @param {Object} rel - Relationship object
 * @returns {string} Formatted relationship string
 */
function formatRelationship(rel) {
    const sourceCardinality = rel.sourceCardinality || '';
    const targetCardinality = rel.targetCardinality || '';
    
    const sourceSymbols = parseCardinality(sourceCardinality);
    const targetSymbols = parseCardinality(targetCardinality);
    
    // Determine connector based on cardinalities
    const connector = getRelationshipConnector(sourceCardinality, targetCardinality);
    
    if (rel.direction === 'outgoing') {
        return `${rel.source} ${sourceSymbols.left} ${connector} ${targetSymbols.right} ${rel.target}`;
    } else if (rel.direction === 'incoming') {
        return `${rel.source} ${sourceSymbols.left} ${connector} ${targetSymbols.right} ${rel.target}`;
    } else {
        // For external relationships, use the determined connector
        return `${rel.source} ${sourceSymbols.left} ${connector} ${targetSymbols.right} ${rel.target}`;
    }
}

/**
 * Parses hierarchical notation with * and |--> to extract entity names
 * @param {string} hierarchicalText - Text with hierarchical notation
 * @returns {Array} Array of entity names
 */
function parseHierarchicalNotation(hierarchicalText) {
    if (!hierarchicalText) return [];
    
    const entities = [];
    const lines = String(hierarchicalText).split('\n');
    
    lines.forEach(line => {
        if (!line.trim()) return;
        
        // Remove all hierarchical markers: *, |-->, <--, -- and any leading/trailing whitespace
        let cleanLine = line.trim()
            .replace(/^\*\s*/, '') // Remove leading * and space
            .replace(/^\|\-\-\>\s*/, '') // Remove leading |--> and space
            .replace(/^\<\-\-\s*/, '') // Remove leading <-- and space
            .replace(/^\-\-\s*/, '') // Remove leading -- and space
            .replace(/\s*\|\-\-\>\s*$/, '') // Remove trailing |--> and space
            .replace(/\s*\<\-\-\s*$/, '') // Remove trailing <-- and space
            .replace(/\s*\-\-\s*$/, '') // Remove trailing -- and space
            .trim();
            
        // If there are still hierarchical markers in the middle, extract just the entity name
        const entityMatch = cleanLine.match(/([^|*<>\-]+)/);
        if (entityMatch) {
            const entityName = entityMatch[1].trim();
            if (entityName) {
                entities.push(entityName);
            }
        } else if (cleanLine) {
            // If no markers found but there's content, use it as is
            entities.push(cleanLine);
        }
    });
    
    return entities;
}


function renderParentEntitiesSection(entity) {
    // Get parent data and handle different formats
    let parentsRaw = entity.List_parent || entity.list_parent || [];
    let parents = [];
    
    if (Array.isArray(parentsRaw)) {
        parents = parentsRaw.map(item => {
            if (typeof item === 'string') {
                const cleanedName = parseHierarchicalNotation(item)[0] || item.trim();
                return { name: cleanedName };
            } else if (item && (item.Name || item.name)) {
                return { 
                    name: item.Name || item.name,
                    stereotype: item.Stereotype || item.stereotype
                };
            }
            return null;
        }).filter(Boolean);
    } else if (typeof parentsRaw === 'string') {
        // Parse hierarchical notation
        const entityNames = parseHierarchicalNotation(parentsRaw);
        parents = entityNames.map(name => ({ name }));
    } else if (parentsRaw && (parentsRaw.Name || parentsRaw.name)) {
        // Single parent object
        parents = [{
            name: parentsRaw.Name || parentsRaw.name,
            stereotype: parentsRaw.Stereotype || parentsRaw.stereotype
        }];
    }
    
    if (parents.length === 0) {
        return `
            <div class="overview-section">
                <div class="overview-title">
                    <i class="fa-solid fa-level-up-alt"></i>
                    Parent Entities
                </div>
                <div style="color: var(--text-secondary); font-size: 12px; padding: 15px; text-align: center;">
                    No parent entities defined
                </div>
            </div>
        `;
    }

    let html = `
        <div class="overview-section">
            <div class="overview-title">
                <i class="fa-solid fa-level-up-alt"></i>
                Parent Entities (${parents.length})
            </div>
            <div class="entity-box-container">
    `;

    parents.forEach(parent => {
        const parentName = parent.name || 'Unnamed Entity';
        const parentStereotype = parent.stereotype || '';
        const stereotypeClass = getStereotypeColorClass(parentStereotype);
        
        html += `
            <div class="entity-box ${stereotypeClass}" 
                 onclick="showParentEntityDetails('${encodeString(parentName)}')"
                 title="${parentStereotype ? 'Stereotype: ' + escapeHtml(parentStereotype) : 'View parent entity details'}">
                ${escapeHtml(parentName)}
                ${parentStereotype ? `<div style="font-size:9px; opacity:0.8; margin-top:2px;">${escapeHtml(parentStereotype)}</div>` : ''}
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Renders child entities section for overview tab
 * @param {Object} entity - Entity data
 * @returns {string} HTML content for child section
 */
function renderChildEntitiesSection(entity) {
    // Get child data and handle different formats - using EXACTLY the same logic as parent section
    let childrenRaw = entity.List_child || entity.list_child || [];
    let children = [];
    
    if (Array.isArray(childrenRaw)) {
        children = childrenRaw.map(item => {
            if (typeof item === 'string') {
                const cleanedName = parseHierarchicalNotation(item)[0] || item.trim();
                return { name: cleanedName };
            } else if (item && (item.Name || item.name)) {
                return { 
                    name: item.Name || item.name,
                    stereotype: item.Stereotype || item.stereotype
                };
            }
            return null;
        }).filter(Boolean);
    } else if (typeof childrenRaw === 'string') {
        // Parse hierarchical notation using the same function
        const entityNames = parseHierarchicalNotation(childrenRaw);
        children = entityNames.map(name => ({ name }));
    } else if (childrenRaw && (childrenRaw.Name || childrenRaw.name)) {
        // Single child object - same logic as parent
        children = [{
            name: childrenRaw.Name || childrenRaw.name,
            stereotype: childrenRaw.Stereotype || childrenRaw.stereotype
        }];
    }
    
    if (children.length === 0) {
        return `
            <div class="overview-section">
                <div class="overview-title">
                    <i class="fa-solid fa-level-down-alt"></i>
                    Child Entities
                </div>
                <div style="color: var(--text-secondary); font-size: 12px; padding: 15px; text-align: center;">
                    No child entities defined
                </div>
            </div>
        `;
    }

    let html = `
        <div class="overview-section">
            <div class="overview-title">
                <i class="fa-solid fa-level-down-alt"></i>
                Child Entities (${children.length})
            </div>
            <div class="entity-box-container">
    `;

    children.forEach(child => {
        const childName = child.name || 'Unnamed Entity';
        const childStereotype = child.stereotype || '';
        const stereotypeClass = getStereotypeColorClass(childStereotype);
        
        html += `
            <div class="entity-box ${stereotypeClass}" 
                 onclick="showParentEntityDetails('${encodeString(childName)}')"
                 title="${childStereotype ? 'Stereotype: ' + escapeHtml(childStereotype) : 'View child entity details'}">
                ${escapeHtml(childName)}
                ${childStereotype ? `<div style="font-size:9px; opacity:0.8; margin-top:2px;">${escapeHtml(childStereotype)}</div>` : ''}
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Renders entity content for CDM mode
 * @param {Object} entity - Entity data
 * @param {boolean} isCurrent - Whether this is the current entity
 * @returns {string} HTML content
 */
function renderEntityContent(entity, isCurrent) {
  const attributes = entity.Attributes || [];
  const stereotypeClass = getStereotypeColorClass(entity.Stereotype);

  let html = `
    <div style="margin-bottom: 15px;">
      <table class="modal-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Model</td><td>${escapeHtml(entity.Model || '')}</td></tr>
          <tr>
            <td>Name</td>
            <td>
              <a href="#" class="sidebar-link" onclick="event.preventDefault(); tagSearch('', '${encodeString(entity.Name)}')">
                <i class="fa-solid fa-magnifying-glass" style="font-size:10px;"></i> 
                ${escapeHtml(entity.Name || entity.name || '')}
              </a>
            </td>
          </tr>
          <tr><td>Description</td><td>${escapeHtml(entity.Description || '')}</td></tr>
          ${entity.Ent_fr_name ? `<tr><td>French Name</td><td>${escapeHtml(entity.Ent_fr_name)}</td></tr>` : ''}
          ${entity.Ent_fr_comment ? `<tr><td>French Comment</td><td>${escapeHtml(entity.Ent_fr_comment)}</td></tr>` : ''}
          ${entity.Stereotype ? `<tr><td>Stereotype</td><td><span class="entity-box ${stereotypeClass}">${escapeHtml(entity.Stereotype)}</span></td></tr>` : ''}
          ${entity.Comment ? `<tr><td>Comment</td><td>${escapeHtml(entity.Comment)}</td></tr>` : ''}
          ${entity.Mapping ? `<tr><td>Mapping</td><td><a href="#" onclick="showPDMMappingModal('${encodeString(entity.Mapping)}')">${escapeHtml(entity.Mapping)}</a></td></tr>` : ''}
          ${entity.Diagrams ? `<tr><td>Diagrams</td><td>${renderDiagramContainersSection(entity, 'CDM')}</td></tr>` : ''}
          <tr><td>Attributes Count</td><td>${attributes.length}</td></tr>
        </tbody>
      </table>
    </div>
  `;

  // Add attributes section
  if (attributes.length > 0) {
    html += `
      <div>
        <strong>Attributes (${attributes.length})</strong>
        <table class="modal-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Datatype</th>
              <th>Description</th>
              <th>Primary</th>
              <th>Mandatory</th>
              <th>Mapping</th>
              <th>Screen</th>
            </tr>
          </thead>
          <tbody>
    `;

    attributes.forEach(attr => {
      html += `
        <tr>
          <td>
            <a href="#" class="sidebar-link" onclick="event.preventDefault(); tagSearch('', '${encodeString(attr.Name || attr.name || '')}')">
              <i class="fa-solid fa-magnifying-glass" style="font-size:10px;"></i> 
              ${escapeHtml(attr.Name || attr.name || '')}
            </a>
          </td>
          <td>${escapeHtml(attr.Datatype || '')}</td>
          <td>${escapeHtml(attr.Description || '')}</td>
          <td>${escapeHtml(attr.Primary || '')}</td>
          <td>${escapeHtml(attr.Mandatory || '')}</td>
          <td>${escapeHtml(attr.Mapping || '')}</td>
          <td>${escapeHtml(attr.Screen || '')}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  return html;
}

/**
 * Renders table content for PDM mode
 * @param {Object} table - Table data
 * @param {boolean} isCurrent - Whether this is the current table
 * @returns {string} HTML content
 */
function renderTableContent(table, isCurrent) {
    const columns = table.Columns || [];
    const stereotypeClass = getStereotypeColorClass(table.Stereotype);

    let html = `
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
                    <tr>
                        <td>Name</td>
                        <td>
                            <a href="#" class="sidebar-link" onclick="event.preventDefault(); tagSearch('', '${encodeString(table.Name || '')}')">
                                <i class="fa-solid fa-magnifying-glass" style="font-size:10px;"></i> 
                                ${escapeHtml(table.Name || '')}
                            </a>
                        </td>
                    </tr>
                    <tr><td>Code</td><td>${escapeHtml(table.Code || '')}</td></tr>
                    <tr><td>Comment</td><td>${escapeHtml(table.Comment || '')}</td></tr>
                    ${table.Stereotype ? `<tr><td>Stereotype</td><td><span class="entity-box ${stereotypeClass}">${escapeHtml(table.Stereotype)}</span></td></tr>` : ''}
                    ${table.Identifier ? `<tr><td>Identifier</td><td>${escapeHtml(table.Identifier)}</td></tr>` : ''}
                    ${table.Datasource ? `<tr><td>Datasource</td><td>${escapeHtml(table.Datasource)}</td></tr>` : ''}
                    ${table.Diagrams ? `<tr><td>Diagrams</td><td>${renderDiagramContainersSection(table, 'PDM')}</td></tr>` : ''}
                    ${table.References && table.References.length > 0 ? `<tr><td>References</td><td>${table.References.length} foreign key relationships</td></tr>` : ''}
                    <tr><td>Columns Count</td><td>${columns.length}</td></tr>
                </tbody>
            </table>
        </div>
    `;

    // Add columns section
    if (columns.length > 0) {
        html += `
            <div>
                <strong>Columns (${columns.length})</strong>
                <table class="modal-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Code</th>
                            <th>Datatype</th>
                            <th>Description</th>
                            <th>Primary</th>
                            <th>Foreign</th>
                            <th>Mandatory</th>
                            <th>Unique</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        columns.forEach(col => {
            html += `
                <tr>
                    <td>
                        <a href="#" class="sidebar-link" onclick="event.preventDefault(); tagSearch('', '${encodeString(col.Name || '')}')">
                            <i class="fa-solid fa-magnifying-glass" style="font-size:10px;"></i> 
                            ${escapeHtml(col.Name || '')}
                        </a>
                    </td>
                    <td>${escapeHtml(col.Code || '')}</td>
                    <td>${escapeHtml(col.Datatype || '')}</td>
                    <td>${escapeHtml(col.Description || '')}</td>
                    <td>${escapeHtml(col.Primary || '')}</td>
                    <td>${escapeHtml(col.Foreign || '')}</td>
                    <td>${escapeHtml(col.Mandatory || '')}</td>
                    <td>${escapeHtml(col.Unique || '')}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    }

    return html;
}
/**
 * Shows linked entities/tables in a modal with tabs for both sides
 * @param {Object} relationship - Relationship object
 * @param {string} currentEntityName - Current entity/table name
 * @param {string} mode - 'CDM' or 'PDM'
 */
function showLinkedEntitiesModal(relationship, currentEntityName, mode) {
    try {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'modal-box';

        const sourceName = relationship.source;
        const targetName = relationship.target;
        const sourceCardinality = relationship.sourceCardinality || '';
        const targetCardinality = relationship.targetCardinality || '';
        
        // Determine which entity is the current one and which is the linked one
        const isSourceCurrent = sourceName === currentEntityName;
        const isTargetCurrent = targetName === currentEntityName;
        
        const currentEntity = isSourceCurrent ? sourceName : (isTargetCurrent ? targetName : currentEntityName);
        const linkedEntity = isSourceCurrent ? targetName : sourceName;
        
        const currentCardinality = isSourceCurrent ? sourceCardinality : targetCardinality;
        const linkedCardinality = isSourceCurrent ? targetCardinality : sourceCardinality;
        
        const currentSymbols = parseCardinality(currentCardinality);
        const linkedSymbols = parseCardinality(linkedCardinality);

        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `
            <div class="title">
                <i class="fa-solid fa-code-branch"></i>
                Relationship: <strong>${escapeHtml(currentEntity)}</strong> ${currentSymbols.left} ↔ ${linkedSymbols.right} <strong>${escapeHtml(linkedEntity)}</strong>
            </div>
            <button class="modal-close">&times;</button>
        `;
        
        modal.appendChild(header);

        // Create tabs for both entities
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'pdm-tabs';
        
        const tabs = [
            { name: currentEntity, type: 'current', entityName: currentEntity, cardinality: currentCardinality },
            { name: linkedEntity, type: 'linked', entityName: linkedEntity, cardinality: linkedCardinality }
        ];

        tabs.forEach((tab, index) => {
            const tabElement = document.createElement('div');
            tabElement.className = `pdm-tab ${index === 0 ? 'active' : ''}`;
            tabElement.dataset.tabType = tab.type;
            tabElement.dataset.entityName = tab.entityName;
            const cardinalitySymbols = parseCardinality(tab.cardinality);
            tabElement.innerHTML = `
                <i class="fa-solid ${tab.type === 'current' ? 'fa-cube' : 'fa-external-link-alt'}"></i> 
                ${escapeHtml(tab.name)} ${cardinalitySymbols.left} ${tab.type === 'current' ? '(Current)' : ''}
            `;
            tabElement.addEventListener('click', () => {
                // Remove active class from all tabs
                tabsContainer.querySelectorAll('.pdm-tab').forEach(t => t.classList.remove('active'));
                // Add active class to clicked tab
                tabElement.classList.add('active');
                // Hide all content
                contentContainer.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                // Show corresponding content
                const content = contentContainer.querySelector(`.tab-content[data-tab-type="${tab.type}"]`);
                if (content) content.style.display = 'block';
            });
            tabsContainer.appendChild(tabElement);
        });

        modal.appendChild(tabsContainer);

        const contentContainer = document.createElement('div');
        contentContainer.style.position = 'relative';

        // Create content for both tabs
        tabs.forEach((tab, index) => {
            const tabContent = document.createElement('div');
            tabContent.className = 'tab-content';
            tabContent.dataset.tabType = tab.type;
            tabContent.style.display = index === 0 ? 'block' : 'none';

            // Find the entity/table data
            let entityData = null;
            if (mode === 'CDM') {
                entityData = state.cdmData.find(e => 
                    (e.Name && e.Name.toLowerCase() === tab.entityName.toLowerCase()) ||
                    (e.name && e.name.toLowerCase() === tab.entityName.toLowerCase())
                );
            } else {
                entityData = state.pdmData.find(t => 
                    (t.Name && t.Name.toLowerCase() === tab.entityName.toLowerCase()) ||
                    (t.Code && t.Code.toLowerCase() === tab.entityName.toLowerCase())
                );
            }

            if (entityData) {
                if (mode === 'CDM') {
                    tabContent.innerHTML = renderEntityContent(entityData, tab.type === 'current');
                } else {
                    tabContent.innerHTML = renderTableContent(entityData, tab.type === 'current');
                }
            } else {
                tabContent.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                        <i class="fa-solid fa-question-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
                        <div>${mode === 'CDM' ? 'Entity' : 'Table'} "${escapeHtml(tab.entityName)}" not found in data</div>
                    </div>
                `;
            }

            contentContainer.appendChild(tabContent);
        });

        modal.appendChild(contentContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        header.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { 
            if (e.target === overlay) overlay.remove(); 
        });

        showToast(`Showing relationship between ${currentEntity} and ${linkedEntity}`, 'info');

    } catch (error) {
        console.error('Error showing linked entities modal:', error);
        showToast('Failed to load relationship details', 'error');
    }
}


/**
 * Renders CDM-specific overview content
 */
function renderCDMOverview(data) {
  const entity = data._parentEntity || {};
  const attributes = entity.Attributes || [];
  const stereotypeClass = getStereotypeColorClass(entity.Stereotype);
  const currentEntityName = entity.Name || entity.name || '';
  
  // Calculate entity statistics
  const totalAttributes = attributes.length;
  const primaryKeys = attributes.filter(attr => 
    (attr.Primary && (attr.Primary === 'X' || attr.Primary === 'X' || attr.Primary === 'X')) || 
    (attr.primary && (attr.Primary === 'X' || attr.Primary === 'X' || attr.Primary === 'X'))
  ).length;
  const mandatoryAttributes = attributes.filter(attr => 
    (attr.Mandatory && (attr.Mandatory === 'X' || attr.Mandatory === 'X' || attr.Mandatory === true)) || 
    (attr.mandatory && (attr.Mandatory === 'X' || attr.Mandatory === 'X' || attr.mandatory === true))
  ).length;
  
  let stspDisplay = entity.STSP;
  if (stspDisplay === true || stspDisplay === 'true') {
    stspDisplay = 'Standard';
  } else if (stspDisplay === false || stspDisplay === 'false') {
    stspDisplay = '';
  }
  
  let html = '';

  // Entity Information Section
  html += `
    <div class="overview-section ${stereotypeClass}" style="border-left: 4px solid var(--${stereotypeClass.replace('stereotype-', '')});">
      <div class="overview-title">
        <i class="fa-solid fa-cube"></i>
        Entity Information
      </div>
      <div style="padding: 15px; background: var(--bg-primary); border-radius: 6px; border: 1px solid var(--border);">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <div style="font-size: 16px; font-weight: 700; color: var(--accent-cdm);">
            <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Name :</span>
            <a href="#" onclick="event.preventDefault(); tagSearch('CDM', '${encodeString(entity.Name)}')">${escapeHtml(entity.Name || entity.name || 'Unnamed Entity')}</a>
          </div>
          
          ${entity.Mapping ? `
          <div style="display: flex; gap: 15px; margin-bottom: 12px; flex-wrap: wrap;"> 
            <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Mapping : </span>
            <a href="#" onclick="showPDMMappingModal('${encodeString(entity.Mapping)}')">[${escapeHtml(entity.Mapping)}]</a>
          </div> 
          ` : ''}
        </div>
        
        <div style="display: flex; gap: 15px; margin-bottom: 12px; flex-wrap: wrap;">
          ${entity.Stereotype ? `
            <div style="display: flex; align-items: center; gap: 5px;">
              <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Stereotype:</span>
              <span class="entity-box ${stereotypeClass}" style="font-size: 12px; font-weight: 500; padding: 2px 6px; border-radius: 4px;">
                ${escapeHtml(entity.Stereotype)}
              </span>
            </div>
          ` : ''}
          
          ${entity.STSP ? `
            <div style="display: flex; align-items: center; gap: 5px;">
              <span style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">STSP:</span>
              <span style="font-size: 12px; color: var(--text-primary); font-weight: 500; background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px;">
                ${escapeHtml(stspDisplay)}
              </span>
            </div>
          ` : ''}
        </div>
        
        ${entity.Comment || entity.comment ? `
          <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4; padding-top: 8px; border-top: 1px solid var(--border);">
            <strong>Comment:</strong> ${escapeHtml(entity.Comment || entity.comment)}
          </div>
        ` : ''}
        
        ${entity.Ent_fr_name || entity.Ent_fr_comment ? `
          <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4; padding-top: 8px; border-top: 1px solid var(--border); margin-top: 8px;">
            ${entity.Ent_fr_name ? `<div><strong>French Name:</strong> ${escapeHtml(entity.Ent_fr_name)}</div>` : ''}
            ${entity.Ent_fr_comment ? `<div style="margin-top: 4px;"><strong>French Comment:</strong> ${escapeHtml(entity.Ent_fr_comment)}</div>` : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `;
  
  // Key Attributes Section
  html += renderKeyAttributesSection(attributes, 'CDM');

  // Parent Entities Section
  html += renderParentEntitiesSection(entity);

  // Child Entities Section  
  html += renderChildEntitiesSection(entity);

  // NEW: Impacted Modules Section
  html += renderImpactedModulesSection(entity);

  // UPDATED: Relationships Section - now using Relationships array
  const relationshipsData = entity.Relationships || [];
  const relationships = extractCDMRelationships(relationshipsData, currentEntityName);
  
  if (relationships.length > 0) {
    html += `
      <div class="overview-section">
        <div class="overview-title">
          <i class="fa-solid fa-code-branch"></i>
          Relationships (${relationships.length})
        </div>
        <div style="padding: 15px; background: var(--bg-primary); border-radius: 6px; border: 1px solid var(--border);">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.8;">
    `;
    
    relationships.forEach(rel => {
      const formattedRel = formatRelationship(rel);
      const relatedEntity = getRelatedEntityName(rel, currentEntityName);
      
      // Find the original relationship object to get the name
      const originalRel = relationshipsData.find(r => 
        (r.ChildEntity === rel.source && r.ParentEntity === rel.target) ||
        (r.ChildEntity === rel.target && r.ParentEntity === rel.source)
      );
      const relationshipName = originalRel?.name || rel.relationshipName || '';
      
      html += `
        <div style="margin-bottom: 8px; padding: 8px; background: var(--bg-secondary); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px;">${escapeHtml(formattedRel)}</div>
            ${relationshipName ? `<div style="font-size: 10px; color: var(--text-secondary); margin-top: 2px;">${escapeHtml(relationshipName)}</div>` : ''}
          </div>
          <div style="display: flex; gap: 5px;">
            <button onclick="showLinkedEntitiesModal(${JSON.stringify(rel).replace(/"/g, '&quot;')}, '${escapeHtml(currentEntityName)}', 'CDM')" 
                    style="background: var(--accent-cdm); color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer; margin-right: 5px;">
              View Entities
            </button>
            ${rel.diagramContainer ? `
              <button onclick="showRelationshipDiagramModal('${encodeString(rel.diagramContainer)}', '${encodeString(relationshipName)}', 'CDM', '${encodeString(entity.Model || '')}')" 
                      style="background: var(--accent-pdm); color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;"
                      title="Show diagram containing this relationship">
                <i class="fa-solid fa-diagram-project" style="font-size: 10px;"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    html += `
          </div>
        </div>
      </div>
    `;
  }

  // Diagram section
  html += renderDiagramContainersSection(entity, 'CDM');
  
  // Entity Statistics Section
  html += `
    <div class="overview-section">
      <div class="overview-title">
        <i class="fa-solid fa-chart-simple"></i>
        Entity Statistics
      </div>
      <div class="overview-grid">
        <div class="overview-stat">
          <div class="stat-value">${totalAttributes}</div>
          <div class="stat-label">Total Attributes</div>
        </div>
        <div class="overview-stat">
          <div class="stat-value">${primaryKeys}</div>
          <div class="stat-label">Primary Keys</div>
        </div>
        <div class="overview-stat">
          <div class="stat-value">${mandatoryAttributes}</div>
          <div class="stat-label">Mandatory</div>
        </div>
        <div class="overview-stat">
          <div class="stat-value">${stspDisplay}</div>
          <div class="stat-label">STSP Standard</div>
        </div>
      </div>
    </div>
  `;

  return html;
}

/**
 * Renders indexes section for PDM tables
 * @param {Object} table - Table data
 * @returns {string} HTML content for indexes section
 */
function renderIndexesSection(table) {
    const columns = table.Columns || [];
    
    // Group columns by index
    const indexGroups = {};
    
    columns.forEach(col => {
        const indexName = col.Index;
        if (indexName && indexName.trim() !== '') {
            if (!indexGroups[indexName]) {
                indexGroups[indexName] = [];
            }
            indexGroups[indexName].push(col);
        }
    });
    
    const indexNames = Object.keys(indexGroups);
    
    if (indexNames.length === 0) {
        return `
            <div class="overview-section">
                <div class="overview-title">
                    <i class="fa-solid fa-list-ol"></i>
                    Indexes
                </div>
                <div style="color: var(--text-secondary); font-size: 12px; padding: 15px; text-align: center;">
                    No indexes defined for this table
                </div>
            </div>
        `;
    }

    let html = `
        <div class="overview-section">
            <div class="overview-title">
                <i class="fa-solid fa-list-ol"></i>
                Indexes (${indexNames.length})
            </div>
            <div style="padding: 15px; background: var(--bg-primary); border-radius: 6px; border: 1px solid var(--border);">
    `;

    indexNames.forEach((indexName, indexIndex) => {
        const indexColumns = indexGroups[indexName];
        
        html += `
            <div style="margin-bottom: ${indexIndex < indexNames.length - 1 ? '15px' : '0'}; padding-bottom: ${indexIndex < indexNames.length - 1 ? '15px' : '0'}; ${indexIndex < indexNames.length - 1 ? 'border-bottom: 1px solid var(--border);' : ''}">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <div style="font-weight: 600; color: var(--accent-pdm); font-size: 13px;">
                        ${escapeHtml(indexName)}
                    </div>
                    <div style="font-size: 11px; color: var(--text-secondary); background: var(--bg-secondary); padding: 2px 6px; border-radius: 3px;">
                        ${indexColumns.length} column${indexColumns.length > 1 ? 's' : ''}
                    </div>
                </div>
                
                <table class="attributes-table" style="width: 100%; font-size: 11px;">
                    <thead>
                        <tr>
                            <th style="width: 30%;">Column Name</th>
                            <th style="width: 25%;">Code</th>
                            <th style="width: 25%;">Datatype</th>
                            <th style="width: 20%;">Key Type</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        indexColumns.forEach(col => {
            const isPrimary = col.Primary && col.Primary === 'X';
            const isForeign = col.Foreign && col.Foreign === 'X';
            
            let keyType = '';
            if (isPrimary && isForeign) {
                keyType = 'Primary & Foreign';
            } else if (isPrimary) {
                keyType = 'Primary';
            } else if (isForeign) {
                keyType = 'Foreign';
            } else {
                keyType = 'Index Only';
            }

            html += `
                <tr>
                    <td style="font-weight: 500;">
                        <a href="#" class="sidebar-link" onclick="event.preventDefault(); tagSearch('', '${encodeString(col.Name || '')}')" style="font-size: 11px;">
                            <i class="fa-solid fa-magnifying-glass" style="font-size: 9px;"></i>
                            ${escapeHtml(col.Name || '')}
                        </a>
                    </td>
                    <td style="font-family: 'JetBrains Mono', monospace;">${escapeHtml(col.Code || '')}</td>
                    <td style="font-family: 'JetBrains Mono', monospace; color: var(--accent);">${escapeHtml(col.Datatype || '')}</td>
                    <td>
                        <div style="display: flex; gap: 2px; flex-wrap: wrap;">
                            ${isPrimary ? `<span class="key-indicator key-pk" style="width: 14px; height: 14px; font-size: 8px; margin-right: 2px;">PK</span>` : ''}
                            ${isForeign ? `<span class="key-indicator key-fk" style="width: 14px; height: 14px; font-size: 8px; margin-right: 2px;">FK</span>` : ''}
                            ${!isPrimary && !isForeign ? `<span style="font-size: 9px; color: var(--text-secondary);">Index</span>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Formats foreign key relationship for PDM with proper arrow direction
 * @param {Object} rel - Relationship object
 * @returns {string} Formatted relationship string
 */
function formatForeignKeyRelationship(rel) {
    const sourceCardinality = rel.sourceCardinality || '';
    const targetCardinality = rel.targetCardinality || '';
    
    const sourceSymbols = parseCardinality(sourceCardinality);
    const targetSymbols = parseCardinality(targetCardinality);
    
    // Determine connector based on cardinalities - pass type for debugging
    const connector = getRelationshipConnector(sourceCardinality, targetCardinality, rel.type);
    
    return `${rel.source} ${sourceSymbols.left} ${connector} ${targetSymbols.right} ${rel.target}`;
}

/**
 * Gets the related entity name for the "View" button
 * @param {Object} rel - Relationship object
 * @param {string} currentEntityName - Current entity name
 * @returns {string} Related entity name to display
 */
function getRelatedEntityName(rel, currentEntityName) {
    if (rel.direction === 'outgoing') {
        return rel.target; // Show the target (parent table)
    } else if (rel.direction === 'incoming') {
        return rel.source; // Show the source (child table)
    } else {
        // For external relationships, show the one that's not current
        return rel.source === currentEntityName ? rel.target : rel.source;
    }
}

/**
 * Renders PDM-specific overview content
 */
function renderPDMOverview(data) {
    const table = data._parentTable || {};
    const columns = table.Columns || [];
    const stereotypeClass = getStereotypeColorClass(table.Stereotype);
    const currentTableName = table.Name || table.name || '';
    
    let html = '';

    // Table Information Section
    html += `
        <div class="overview-section">
            <div class="overview-title">
                <i class="fa-solid fa-table"></i>
                Table Information
            </div>
            <div style="padding: 15px; background: var(--bg-primary); border-radius: 6px; border: 1px solid var(--border);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                    <div style="font-size: 16px; font-weight: 700; color: var(--accent-pdm);">
                        <a href="#" onclick="event.preventDefault(); tagSearch('PDM code', '${encodeString(table.Name)}')">${escapeHtml(table.Name || table.name || 'Unnamed table')}</a>
                    </div>
                    ${table.Code ? `
                        <div style="font-size: 14px; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace;">
                            [${escapeHtml(table.Code)}]
                        </div>
                    ` : ''}
                </div>
                
                ${table.Stereotype ? `
                    <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 12px;">
                        <span style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Stereotype:</span>
                        <span class="entity-box ${stereotypeClass}" style="font-size: 12px; font-weight: 500; padding: 2px 6px; border-radius: 4px;">
                            ${escapeHtml(table.Stereotype)}
                        </span>
                    </div>
                ` : ''}
                
                ${table.Comment || table.comment ? `
                    <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4; padding-top: 8px; border-top: 1px solid var(--border);">
                        <strong>Comment:</strong> ${escapeHtml(table.Comment || table.comment)}
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // Key Columns Section
    html += renderKeyAttributesSection(columns, 'PDM');

    // Indexes Section
    html += renderIndexesSection(table);
    
    // UPDATED: Foreign Key Relationships Section (from References array)
    const referencesArray = table.References || [];
    const fkRelationships = parsePDMReferencesArray(referencesArray, currentTableName);

    if (fkRelationships.length > 0) {
        html += `
            <div class="overview-section">
                <div class="overview-title">
                    <i class="fa-solid fa-code-branch"></i>
                    Foreign Key Relationships (${fkRelationships.length})
                </div>
                <div style="padding: 15px; background: var(--bg-primary); border-radius: 6px; border: 1px solid var(--border);">
                    <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.8;">
        `;
        
        fkRelationships.forEach(rel => {
            const formattedRel = formatForeignKeyRelationship(rel);
            const relatedTable = getRelatedEntityName(rel, currentTableName);
            
            // Add column details for foreign key relationships
            const columnInfo = ` [${rel.fkColumn} → ${rel.pkColumn}]`;
            const cardinalityInfo = rel.cardinality ? ` (${rel.cardinality})` : '';
            const generatedInfo = rel.generated === 'True' || rel.generated === true ? ' [Generated]' : '';
            
            html += `
                <div style="margin-bottom: 8px; padding: 8px; background: var(--bg-secondary); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px;">${escapeHtml(formattedRel)}</div>
                        <div style="font-size: 10px; color: var(--text-secondary); margin-top: 2px;">
                            ${escapeHtml(columnInfo)}
                            ${escapeHtml(cardinalityInfo)}
                            ${escapeHtml(generatedInfo)}
                            ${rel.referenceName ? `<div style="margin-top: 2px; font-style: italic;">${escapeHtml(rel.referenceName)}</div>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="showLinkedEntitiesModal(${JSON.stringify(rel).replace(/"/g, '&quot;')}, '${escapeHtml(currentTableName)}', 'PDM')" 
                                style="background: var(--accent-pdm); color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer; margin-right: 5px;">
                            View Tables
                        </button>
                        ${rel.diagramContainer ? `
                            <button onclick="showRelationshipDiagramModal('${encodeString(rel.diagramContainer)}', '${encodeString(rel.referenceName || 'FK Relationship')}', 'PDM', '${encodeString(table.Model || '')}')" 
                                    style="background: var(--accent-cdm); color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;"
                                    title="Show diagram containing this relationship">
                                <i class="fa-solid fa-diagram-project" style="font-size: 10px;"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        html += `
                    </div>
                </div>
            </div>
        `;
    }

    // Regular Relationships Section (from List_relationship)
    const relationshipsRaw = table.List_relationship || table.list_relationship || table.relationships || '';
    const relationships = extractRelationshipsWithCardinalities(relationshipsRaw, currentTableName);

    if (relationships.length > 0) {
        html += `
            <div class="overview-section">
                <div class="overview-title">
                    <i class="fa-solid fa-project-diagram"></i>
                    Table Relationships (${relationships.length})
                </div>
                <div style="padding: 15px; background: var(--bg-primary); border-radius: 6px; border: 1px solid var(--border);">
                    <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.8;">
        `;
        
        relationships.forEach(rel => {
            const formattedRel = formatRelationship(rel);
            const relatedTable = getRelatedEntityName(rel, currentTableName);
            
            html += `
                <div style="margin-bottom: 8px; padding: 8px; background: var(--bg-secondary); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="flex: 1;">${escapeHtml(formattedRel)}</span>
                    <button onclick="findAndShowTable('${encodeString(relatedTable)}')" 
                            style="background: var(--accent-pdm); color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">
                        View
                    </button>
                </div>
            `;
        });
        
        html += `
                    </div>
                </div>
            </div>
        `;
    }

    html += renderDiagramContainersSection(table, 'PDM');
    
    // Mapped Entities Section
    html += renderMappedEntitiesSection(table, 'PDM');
    
    // Statistics Section
    html += `
        <div class="overview-section">
            <div class="overview-title">
                <i class="fa-solid fa-chart-simple"></i>
                Table Statistics
            </div>
            <div class="overview-grid">
                <div class="overview-stat">
                    <div class="stat-value">${columns.length}</div>
                    <div class="stat-label">Total Columns</div>
                </div>
                <div class="overview-stat">
                    <div class="stat-value">${columns.filter(c => 
                        (c.Mandatory && (c.Mandatory === 'X' || c.Mandatory === 'X' || c.Mandatory === 'X')) || 
                        (c.mandatory && (c.mandatory === 'X' || c.mandatory === 'X' || c.mandatory === 'X'))
                    ).length}</div>
                    <div class="stat-label">Mandatory</div>
                </div>
                <div class="overview-stat">
                    <div class="stat-value">${columns.filter(c => 
                        (c.Primary && (c.Primary === 'X' || c.Primary === 'X' || c.Primary === 'X')) || 
                        (c.primary && (c.primary === 'X' || c.primary === 'X' || c.primary === 'X'))
                    ).length}</div>
                    <div class="stat-label">Primary Keys</div>
                </div>
                <div class="overview-stat">
                    <div class="stat-value">${columns.filter(c => 
                        (c.Foreign && (c.Foreign === 'X' || c.Foreign === 'X' || c.Foreign === 'X')) || 
                        (c.foreign && (c.foreign === 'X' || c.foreign === 'X' || c.foreign === 'X'))
                    ).length}</div>
                    <div class="stat-label">Foreign Keys</div>
                </div>
            </div>
        </div>
    `;

    return html;
}

/**
 * Renders key attributes/columns section for overview
 */

function renderKeyAttributesSection(items, mode) {
    const isCDM = mode === 'CDM';

    // Helpers to normalize values across datasets
    const isTrueLike = v => {
        if (v === undefined || v === null) return false;
        if (typeof v === 'boolean') return v;
        if (typeof v === 'number') return v !== 0;
        const s = String(v).trim().toLowerCase();
        return s === 'x' || s === 'y' || s === 'true' || s === 'yes' || s === '1';
    };

    const flag = (item, aliases) => aliases.some(k => isTrueLike(item[k]));

    // Build normalized flags for each item
    const normalized = items.map(item => {
        const isPrimary   = flag(item, ['Primary', 'primary', 'PK']);
        const isMandatory = flag(item, ['Mandatory', 'mandatory', 'M']);
        const isIdentifier= flag(item, ['Identifier', 'identifier', 'BI']);

        // In PDM/non-CDM datasets, foreign & unique may be called FK/AK
        const isForeign   = flag(item, ['Foreign', 'foreign', 'FK']);
        const isUnique    = flag(item, ['Unique', 'unique', 'AK']);

        // Names & extra fields
        const name        = isCDM ? (item.Name ?? item.name ?? '') : (item.Code ?? item.code ?? item.Name ?? '');
        const datatype    = item.Datatype ?? item.datatype ?? '';
        const extra       = isCDM ? (item.Mapping ?? item.mapping ?? '') : (item.Description ?? item.description ?? '');

        // Constraints (prefer specific keys if present)
        const fkConstraint = item.FK_Constraint ?? item.Foreign_Constraint ?? item.fk_constraint ?? '';
        const fkReference  = item.FK_Reference  ?? item.Foreign_Reference  ?? item.fk_reference  ?? '';
        const akConstraint = item.AK_Constraint ?? item.Unique_Constraint  ?? item.ak_constraint ?? '';

        return {
            raw: item,
            isPrimary,
            isMandatory,
            isIdentifier,
            isForeign: !isCDM && isForeign, // Foreign applies only in non-CDM
            isUnique:  !isCDM && isUnique,  // Unique applies only in non-CDM
            name, datatype, extra,
            fkConstraint, fkReference, akConstraint
        };
    });

    // Filter using normalized flags
    const keyItems = normalized.filter(n =>
        isCDM
            ? (n.isPrimary || n.isMandatory || n.isIdentifier)
            : (n.isPrimary || n.isForeign || n.isMandatory || n.isUnique)
    );

    // Debug: counts (optional)
    if (keyItems.length === 0) {
        return `
            <div class="overview-section">
                <div class="overview-title">
                    <i class="fa-solid fa-key"></i>
                    ${isCDM ? 'Key Attributes' : 'Key Columns'}
                </div>
                <div style="color: var(--text-secondary); font-size: 12px; padding: 15px; text-align: center;">
                    No ${isCDM ? 'primary or mandatory' : 'primary, foreign, or mandatory'} ${isCDM ? 'attributes' : 'columns'} defined
                </div>
            </div>
        `;
    }

    // Helper to safely escape attribute values (for title tooltips)
    const escapeAttr = s => String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    let html = `
        <div class="overview-section">
            <div class="overview-title">
                <i class="fa-solid fa-key"></i>
                ${isCDM ? 'Key Attributes (Primary & Mandatory & Business Identifier)' : 'Key Columns (Primary, Foreign & Mandatory & Unique)'}
            </div>
            <div style="padding: 15px; background: var(--bg-primary); border-radius: 6px; border: 1px solid var(--border);">
                <table class="attributes-table" style="width: 100%;">
                    <thead>
                        <tr>
                            <th style="width: 25%;">${isCDM ? 'Attribute' : 'Column'}</th>
                            <th style="width: 20%;">Datatype</th>
                            <th style="width: 15%;">Keys</th>
                            <th style="width: 40%;">${isCDM ? 'Mapping' : 'Description'}</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    keyItems.forEach(n => {
        const keys = [];
        if (n.isPrimary)   keys.push('PK');
        if (n.isForeign)   keys.push('FK');
        if (n.isMandatory) keys.push('M');
        if (n.isIdentifier)keys.push('BI');
        if (n.isUnique)    keys.push('AK');

        // Optional verbose debug per item
        html += `
            <tr>
                <td style="font-weight: 500;">${escapeHtml(n.name)}</td>
                <td style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--accent);">${escapeHtml(n.datatype)}</td>
                <td>
                    <div style="display: flex; gap: 4px;">
                        ${n.isPrimary   ? `<span class="key-indicator key-pk" title="Primary key">PK</span>` : ''}
                        ${n.isForeign   ? `<span class="key-indicator key-fk" title="Foreign key Constraint: ${escapeAttr(n.fkConstraint)}&#13;Foreign key reference: ${escapeAttr(n.fkReference)}">FK</span>` : ''}
                        ${n.isMandatory ? `<span class="key-indicator key-mandatory" title="Mandatory">M</span>` : ''}
                        ${n.isUnique    ? `<span class="key-indicator key-unique" title="Unique key: ${escapeAttr(n.akConstraint)}">AK</span>` : ''}
                        ${n.isIdentifier? `<span class="key-indicator key-bi" title="Business Identifier">BI</span>` : ''}
                    </div>
                </td>
                <td style="font-size: 11px;">${escapeHtml(n.extra)}</td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    return html;
}


function renderDiagramContainersSection(obj, mode) {
  const model = obj.Model || '';
  const diagrams = Array.isArray(obj.Diagrams) ? obj.Diagrams : [];

  if (!diagrams.length) {
    return `
      <div class="overview-section">
        <div class="overview-title">Diagram Containers</div>
        <div>No diagrams linked to this ${mode === 'CDM' ? 'entity' : 'table'}.</div>
      </div>`;
  }

  const items = diagrams.map(d => `
    <li>
      
      <a href="#" onclick="handleDiagramItemClick(
                                                    '${encodeString(d.name)}',
                                                    '${encodeString(model)}',
                                                    '${mode}'
                                                )">
            ${escapeHtml(String(d.name))}
        </a>
      ${d.comment ? `<span class="small-note"> — ${escapeHtml(String(d.comment))}</span>` : ''}
    </li>
  `).join('');

  return `
    <div class="overview-section">
      <div class="overview-title">Diagram Containers (${diagrams.length})</div>
      <ul class="overview-list">
        ${items}
      </ul>
    </div>`;
}

/* 
*   Attach once; prevents duplicate bindings
*/
function setupOverviewDiagramLinks() {
  const container = document.getElementById('sidebarContent');
  if (!container || container.__diagramDelegated) return;
  container.__diagramDelegated = true;

  container.addEventListener('click', (e) => {
    const link = e.target.closest('a.diagram-link');
    if (!link) return;

    e.preventDefault();
    const mode    = link.dataset.mode;
    const diagram = link.dataset.diagram;
    const model   = link.dataset.model;

    if (mode === 'CDM')      showCDMDiagramModal(diagram, model);
    else if (mode === 'PDM') showPDMDiagramModal(diagram, model);
  });
}

/**
 * NEW: Renders impacted modules section for CDM entities
 */
function renderImpactedModulesSection(entity) {
  const impactedModules = entity.ImpactedModules || [];
  
  if (impactedModules.length === 0) {
    return `
      <div class="overview-section">
        <div class="overview-title">
          <i class="fa-solid fa-cubes"></i>
          Impacted Modules
        </div>
        <div style="color: var(--text-secondary); font-size: 12px; padding: 15px; text-align: center;">
          No impacted modules defined
        </div>
      </div>
    `;
  }

  let html = `
    <div class="overview-section">
      <div class="overview-title">
        <i class="fa-solid fa-cubes"></i>
        Impacted Modules (${impactedModules.length})
      </div>
      <div style="padding: 15px; background: var(--bg-primary); border-radius: 6px; border: 1px solid var(--border);">
        <table class="attributes-table" style="width: 100%; font-size: 11px;">
          <thead>
            <tr>
              <th style="width: 30%;">Module Name</th>
              <th style="width: 20%;">Class</th>
              <th style="width: 50%;">Comment</th>
            </tr>
          </thead>
          <tbody>
  `;

  impactedModules.forEach(module => {
    let mname = module.name; 
    let mclname = module.ClassName; 
    let mcomment = escapeHtml(module.Comment); 
    html += `
      <tr>
        <td style="font-weight: 500;">
          <a href="#" class="sidebar-link" onclick="event.preventDefault(); showEntitiesByImpactedModule('${mname}', '${mclname}', '${encodeString(mcomment)}')" style="font-size: 11px; cursor: pointer;">
            <i class="fa-solid fa-magnifying-glass" style="font-size: 9px;"></i>
            ${escapeHtml(module.name || 'Unnamed Module')}
          </a>
        </td>
        <td style="color: var(--accent-cdm);">${escapeHtml(module.ClassName || '')}</td>
        <td>${escapeHtml(module.Comment || '')}</td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  return html;
}

/**
 * NEW: Extracts relationships from the new CDM structure
 */
function extractCDMRelationships(relationshipData, currentEntityName) {
  if (!relationshipData) return [];
  
  const relationships = [];
  
  // Handle array of relationship objects (new structure)
  if (Array.isArray(relationshipData)) {
    relationshipData.forEach(rel => {
      if (typeof rel === 'object' && rel !== null) {
        // Extract entities and cardinalities from the relationship object
        const childEntity = rel.ChildEntity || '';
        const parentEntity = rel.ParentEntity || '';
        const childCardinality = rel.childCardinality || '';
        const parentCardinality = rel.parentCardinality || '';
        const diagramContainers = rel.DiagramContainers || '';
        
        if (childEntity && parentEntity) {
          // Determine direction relative to current entity
          if (childEntity === currentEntityName) {
            // Current entity is the child
            relationships.push({
              source: childEntity,
              target: parentEntity,
              sourceCardinality: childCardinality,
              targetCardinality: parentCardinality,
              direction: 'outgoing',
              type: 'cdm_relationship',
              diagramContainer: diagramContainers,
              relationshipName: rel.name || ''
            });
          } else if (parentEntity === currentEntityName) {
            // Current entity is the parent
            relationships.push({
              source: parentEntity,
              target: childEntity,
              sourceCardinality: parentCardinality,
              targetCardinality: childCardinality,
              direction: 'incoming',
              type: 'cdm_relationship',
              diagramContainer: diagramContainers,
              relationshipName: rel.name || ''
            });
          } else {
            // Current entity is not directly involved
            relationships.push({
              source: childEntity,
              target: parentEntity,
              sourceCardinality: childCardinality,
              targetCardinality: parentCardinality,
              direction: 'external',
              type: 'cdm_relationship',
              diagramContainer: diagramContainers,
              relationshipName: rel.name || ''
            });
          }
        }
      }
    });
    return relationships;
  }
  
  // Fallback to old string parsing for backward compatibility
  return extractRelationshipsWithCardinalities(relationshipData, currentEntityName);
}

/**
 * NEW: Shows relationship diagram modal
 */
function showRelationshipDiagramModal(encdiagramContainer, encrelationshipName, mode, encmodel) {
  let diagramContainer = decodeString(encdiagramContainer);
  let relationshipName = decodeString(encrelationshipName);
  let model = decodeString(encmodel);
  if (!diagramContainer) {
    showToast('No diagram available for this relationship', 'info');
    return;
  }
  
  // Split multiple diagram containers if needed
  const diagrams = diagramContainer.split(',').map(d => d.trim()).filter(d => d);
  
  if (diagrams.length === 1) {
    // Single diagram - show it directly
    if (mode === 'CDM') {
      showCDMDiagramModal(encodeString(diagrams[0]), encodeString(model));
    } else {
      showPDMDiagramModal(encodeString(diagrams[0]), encodeString(model));
    }
  } else if (diagrams.length > 1) {
    // Multiple diagrams - let user choose
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal-box';
    modal.style.maxWidth = '500px';
    
    modal.innerHTML = `
      <div class="modal-header">
        <div class="title">
          <i class="fa-solid fa-diagram-project"></i>
          Select Diagram for: ${escapeHtml(relationshipName || 'Relationship')}
        </div>
        <button class="modal-close">&times;</button>
      </div>
      <div style="padding: 20px;">
        <p style="margin-bottom: 15px; color: var(--text-secondary);">This relationship appears in multiple diagrams. Select one to view:</p>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${diagrams.map((diagram, index) => `
            <button onclick="
              this.closest('.modal-overlay').remove();
              ${mode === 'CDM' ? `showCDMDiagramModal('${encodeString(diagram)}', '${encodeString(model || '')}')` : `showPDMDiagramModal('${encodeString(diagram)}', '${encodeString(model || '')}')`};
            " 
              style="
                display: flex; 
                align-items: center; 
                justify-content: space-between;
                padding: 12px 15px;
                background: var(--bg-secondary);
                border: 1px solid var(--border);
                border-radius: 6px;
                cursor: pointer;
                text-align: left;
                transition: background 0.2s;
              "
              onmouseover="this.style.background='var(--hover-bg)'"
              onmouseout="this.style.background='var(--bg-secondary)'"
            >
              <span>
                <i class="fa-solid fa-diagram-project" style="margin-right: 8px; color: var(--accent-cdm);"></i>
                ${escapeHtml(diagram)}
              </span>
              <i class="fa-solid fa-chevron-right" style="color: var(--text-secondary);"></i>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { 
      if (e.target === overlay) overlay.remove(); 
    });
  } else {
    showToast('No valid diagram container found', 'warning');
  }
}

/**
 * NEW: Parses PDM references from array structure
 */

/**
 * NEW: Parses PDM references from array structure with correct cardinality assignment
 */
function parsePDMReferencesArray(referencesData, currentTableName) {
    if (!referencesData || !Array.isArray(referencesData)) return [];
    
    const relationships = [];
    
    referencesData.forEach(ref => {
        if (typeof ref === 'object' && ref !== null) {
            const childTable = ref.ChildTable || '';
            const parentTable = ref.ParentTable || '';
            const childColumn = ref.ChildColumn || '';
            const parentColumn = ref.ParentColumn || '';
            const childCardinality = ref.Cardinality || '0..*'; // Child (FK) side
            const diagramContainer = ref.DiagramContainers || '';
            
            // ROBUST MANDATORY CHECK
            // Check both capitalized and lowercase properties
            const mandatoryVal = ref.Mandatory !== undefined ? ref.Mandatory : ref.mandatory;
            
            // Use helper to determine true boolean state
            const isMandatory = isTrueLike(mandatoryVal);
            
            // Determine parent cardinality based on Mandatory property
            // Mandatory=True -> Parent (1,1)
            // Mandatory=False -> Parent (0,1)
            const parentCardinality = isMandatory ? '1..1' : '0..1';
            
            if (childTable && parentTable) {
                // Common object properties
                const relObj = {
                    type: 'foreign_key',
                    fkColumn: childColumn,
                    pkColumn: parentColumn,
                    diagramContainer: diagramContainer,
                    referenceName: ref.name || '',
                    generated: ref.Generated || "False",
                    
                    // Crucial: Store the calculated cardinalities explicitly
                    childCardinality: childCardinality, 
                    parentCardinality: parentCardinality,
                    
                    // Store the raw mandatory boolean for reference
                    mandatory: isMandatory 
                };

                // Determine direction
                if (childTable === currentTableName) {
                    // Outgoing: Current is Child
                    relationships.push({
                        ...relObj,
                        source: childTable,
                        target: parentTable,
                        sourceCardinality: childCardinality, 
                        targetCardinality: parentCardinality,
                        direction: 'outgoing'
                    });
                } else {
                    // Incoming: Current is Parent
                    relationships.push({
                        ...relObj,
                        source: parentTable, // Note: In UI we usually list source as the 'other' one, but for edges logic:
                        target: childTable,  // Logic depends on how you interpret source/target in Sidebar vs Diagram.
                        // Standard Sidebar display usually wants: [This Table] -> [Other Table]
                        // But for parsing edges, we usually want Source=Child, Target=Parent or similar.
                        // Based on your existing code structure, we keep your direction logic:
                        
                        source: parentTable,
                        target: childTable,
                        sourceCardinality: parentCardinality,
                        targetCardinality: childCardinality,
                        direction: 'incoming'
                    });
                }
            }
        }
    });
    
    return relationships;
}

/**
 * Finds entities/tables that have mapping properties pointing to the current entity/table
 * @param {Object} currentObj - Current entity/table data
 * @param {string} mode - 'CDM' or 'PDM'
 * @returns {Array} Array of mapped objects
 */
function findMappedEntities(currentObj, mode) {
    if (!currentObj) return [];
    
    const currentName = currentObj.Code || '';
    if (!currentName) return [];
    
    const mappedEntities = [];
    
    if (mode === 'PDM') {
        // For PDM tables: find CDM entities that map to this table
        const cdmData = state.cdmData || [];
        cdmData.forEach(entity => {
            const mapping = entity.Mapping || '';
            if (mapping && typeof mapping === 'string') {
                // Check if mapping contains current table name
                const mappingParts = mapping.split(',').map(part => part.trim());
                if (mappingParts.includes(currentName)) {
                    mappedEntities.push({
                        type: 'entity',
                        name: entity.Name || entity.name || '',
                        code: entity.Code || '',
                        stereotype: entity.Stereotype || entity.stereotype || '',
                        model: entity.Model || '',
                        mapping: mapping
                    });
                }
            }
        });
    } else if (mode === 'CDM') {
        // For CDM entities: find PDM tables that map from this entity
        const pdmData = state.pdmData || [];
        pdmData.forEach(table => {
            // Check table level mapping
            const tableMapping = table.Mapping || '';
            if (tableMapping && typeof tableMapping === 'string') {
                const mappingParts = tableMapping.split(',').map(part => part.trim());
                if (mappingParts.includes(currentName)) {
                    mappedEntities.push({
                        type: 'table',
                        name: table.Name || table.name || '',
                        code: table.Code || table.code || '',
                        stereotype: table.Stereotype || table.stereotype || '',
                        model: table.Model || '',
                        mapping: tableMapping
                    });
                }
            }
            
            // Check column level mappings
            const columns = table.Columns || [];
            columns.forEach(column => {
                const columnMapping = column.Mapping || '';
                if (columnMapping && typeof columnMapping === 'string') {
                    const mappingParts = columnMapping.split(',').map(part => part.trim());
                    if (mappingParts.includes(currentName)) {
                        mappedEntities.push({
                            type: 'column',
                            name: column.Name || column.name || '',
                            code: column.Code || column.code || '',
                            datatype: column.Datatype || column.datatype || '',
                            tableName: table.Name || table.name || '',
                            tableCode: table.Code || table.code || '',
                            model: table.Model || '',
                            mapping: columnMapping
                        });
                    }
                }
            });
        });
    }
    
    return mappedEntities;
}

/**
 * Renders Mapped Entities section for sidebar overview
 * @param {Object} currentObj - Current entity/table data
 * @param {string} mode - 'CDM' or 'PDM'
 * @returns {string} HTML content for mapped entities section
 */
function renderMappedEntitiesSection(currentObj, mode) {
    const mappedEntities = findMappedEntities(currentObj, mode);
    
    if (mappedEntities.length === 0) {
        return `
            <div class="overview-section">
                <div class="overview-title">
                    <i class="fa-solid fa-arrows-alt-h"></i>
                    Mapped ${mode === 'CDM' ? 'Tables/Columns' : 'Entities'}
                </div>
                <div style="color: var(--text-secondary); font-size: 12px; padding: 15px; text-align: center;">
                    No ${mode === 'CDM' ? 'tables or columns' : 'entities'} map to this ${mode === 'CDM' ? 'entity' : 'table'}
                </div>
            </div>
        `;
    }
    
    // Group by type for better organization
    const grouped = {
        entity: [],
        table: [],
        column: []
    };
    
    mappedEntities.forEach(item => {
        if (grouped[item.type]) {
            grouped[item.type].push(item);
        }
    });
    
    let html = `
        <div class="overview-section">
            <div class="overview-title">
                <i class="fa-solid fa-arrows-alt-h"></i>
                Mapped ${mode === 'CDM' ? 'Tables/Columns' : 'Entities'} (${mappedEntities.length})
            </div>
            <div style="padding: 15px; background: var(--bg-primary); border-radius: 6px; border: 1px solid var(--border);">
    `;
    
    // Render each group
    if (mode === 'PDM' && grouped.entity.length > 0) {
        html += `
            <div style="margin-bottom: ${grouped.table.length > 0 || grouped.column.length > 0 ? '20px' : '0'}">
                <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid var(--border);">
                    <i class="fa-solid fa-sitemap" style="margin-right: 5px; color: var(--accent-cdm);"></i>
                    CDM Entities (${grouped.entity.length})
                </div>
                <div class="entity-box-container">
        `;
        
        grouped.entity.forEach(entity => {
            const stereotypeClass = getStereotypeColorClass(entity.stereotype);
            html += `
                <div class="entity-box ${stereotypeClass}" 
                     onclick="showMappedEntityDetails('${escapeHtml(entity.name)}', 'CDM')"
                     title="Model: ${escapeHtml(entity.model || 'N/A')}&#10;Mapping: ${escapeHtml(entity.mapping)}">
                    <div style="font-weight: 500;">${escapeHtml(entity.name)}</div>
                    ${entity.code && entity.code !== entity.name ? `<div style="font-size: 9px; color: var(--text-secondary); margin-top: 2px;">${escapeHtml(entity.code)}</div>` : ''}
                    ${entity.stereotype ? `<div style="font-size: 9px; opacity: 0.8; margin-top: 2px;">${escapeHtml(entity.stereotype)}</div>` : ''}
                    <div style="font-size: 8px; color: var(--accent-cdm); margin-top: 2px;">
                        <i class="fa-solid fa-arrow-right" style="font-size: 7px;"></i> ${mode === 'CDM' ? 'Maps to this entity' : 'Maps from this entity'}
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    if (mode === 'CDM' && grouped.table.length > 0) {
        html += `
            <div style="margin-bottom: ${grouped.column.length > 0 ? '20px' : '0'}">
                <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid var(--border);">
                    <i class="fa-solid fa-table" style="margin-right: 5px; color: var(--accent-pdm);"></i>
                    PDM Tables (${grouped.table.length})
                </div>
                <div class="entity-box-container">
        `;
        
        grouped.table.forEach(table => {
            const stereotypeClass = getStereotypeColorClass(table.stereotype);
            html += `
                <div class="entity-box ${stereotypeClass}" 
                     onclick="showMappedEntityDetails('${escapeHtml(table.name)}', 'PDM')"
                     title="Model: ${escapeHtml(table.model || 'N/A')}&#10;Mapping: ${escapeHtml(table.mapping)}">
                    <div style="font-weight: 500;">${escapeHtml(table.name)}</div>
                    ${table.code && table.code !== table.name ? `<div style="font-size: 9px; color: var(--text-secondary); margin-top: 2px;">${escapeHtml(table.code)}</div>` : ''}
                    ${table.stereotype ? `<div style="font-size: 9px; opacity: 0.8; margin-top: 2px;">${escapeHtml(table.stereotype)}</div>` : ''}
                    <div style="font-size: 8px; color: var(--accent-pdm); margin-top: 2px;">
                        <i class="fa-solid fa-arrow-right" style="font-size: 7px;"></i> ${mode === 'CDM' ? 'Maps from this entity' : 'Maps to this table'}
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    if (mode === 'CDM' && grouped.column.length > 0) {
        html += `
            <div>
                <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid var(--border);">
                    <i class="fa-solid fa-columns" style="margin-right: 5px; color: var(--accent);"></i>
                    PDM Columns (${grouped.column.length})
                </div>
                <div class="entity-box-container">
        `;
        
        grouped.column.forEach(column => {
            html += `
                <div class="entity-box" 
                     onclick="showMappedColumnDetails('${escapeHtml(column.tableName)}', '${escapeHtml(column.name)}')"
                     title="Table: ${escapeHtml(column.tableName)}&#10;Model: ${escapeHtml(column.model || 'N/A')}&#10;Datatype: ${escapeHtml(column.datatype || 'N/A')}&#10;Mapping: ${escapeHtml(column.mapping)}">
                    <div style="font-weight: 500; font-size: 11px;">${escapeHtml(column.name)}</div>
                    ${column.code && column.code !== column.name ? `<div style="font-size: 8px; color: var(--text-secondary); margin-top: 2px;">${escapeHtml(column.code)}</div>` : ''}
                    <div style="font-size: 8px; color: var(--text-secondary); margin-top: 2px;">${escapeHtml(column.datatype || '')}</div>
                    <div style="font-size: 8px; color: var(--accent-pdm); margin-top: 2px;">
                        <i class="fa-solid fa-table" style="font-size: 7px;"></i> ${escapeHtml(column.tableName)}
                    </div>
                    <div style="font-size: 7px; color: var(--accent); margin-top: 2px;">
                        <i class="fa-solid fa-arrow-right" style="font-size: 6px;"></i> Maps from this entity
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Shows details of a mapped entity in a modal
 * @param {string} entityName - Name of the entity to show
 * @param {string} mode - 'CDM' or 'PDM'
 */
function showMappedEntityDetails(entityName, mode) {
    try {
        let entityData = null;
        
        if (mode === 'CDM') {
            entityData = (state.cdmData || []).find(e => 
                (e.Name && e.Name.toLowerCase() === entityName.toLowerCase()) ||
                (e.name && e.name.toLowerCase() === entityName.toLowerCase())
            );
        } else {
            entityData = (state.pdmData || []).find(t => 
                (t.Name && t.Name.toLowerCase() === entityName.toLowerCase()) ||
                (t.Code && t.Code.toLowerCase() === entityName.toLowerCase())
            );
        }
        
        if (!entityData) {
            showToast(`${mode === 'CDM' ? 'Entity' : 'Table'} not found: ${entityName}`, 'warning');
            return;
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'modal-box';
        modal.style.maxWidth = '800px';
        
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `
            <div class="title">
                <i class="fa-solid ${mode === 'CDM' ? 'fa-sitemap' : 'fa-table'}"></i>
                ${mode === 'CDM' ? 'Entity' : 'Table'} Details: <strong>${escapeHtml(entityName)}</strong>
            </div>
            <button class="modal-close">&times;</button>
        `;
        
        modal.appendChild(header);
        
        const content = document.createElement('div');
        content.style.padding = '20px';
        content.style.maxHeight = '70vh';
        content.style.overflowY = 'auto';
        
        if (mode === 'CDM') {
            content.innerHTML = renderEntityContent(entityData, false);
        } else {
            content.innerHTML = renderTableContent(entityData, false);
        }
        
        modal.appendChild(content);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        header.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { 
            if (e.target === overlay) overlay.remove(); 
        });
        
    } catch (error) {
        console.error('Error showing mapped entity details:', error);
        showToast('Failed to load entity details', 'error');
    }
}

/**
 * Shows details of a mapped column in a modal
 * @param {string} tableName - Name of the table
 * @param {string} columnName - Name of the column
 */
function showMappedColumnDetails(tableName, columnName) {
    try {
        const tableData = (state.pdmData || []).find(t => 
            (t.Name && t.Name.toLowerCase() === tableName.toLowerCase()) ||
            (t.Code && t.Code.toLowerCase() === tableName.toLowerCase())
        );
        
        if (!tableData) {
            showToast(`Table not found: ${tableName}`, 'warning');
            return;
        }
        
        const columns = tableData.Columns || [];
        const columnData = columns.find(col => 
            (col.Name && col.Name.toLowerCase() === columnName.toLowerCase()) ||
            (col.Code && col.Code.toLowerCase() === columnName.toLowerCase())
        );
        
        if (!columnData) {
            showToast(`Column not found: ${columnName}`, 'warning');
            return;
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'modal-box';
        modal.style.maxWidth = '700px';
        
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `
            <div class="title">
                <i class="fa-solid fa-columns"></i>
                Column Details: <strong>${escapeHtml(columnName)}</strong>
                <span style="font-size: 14px; color: var(--text-secondary); margin-left: 10px;">
                    (in table: ${escapeHtml(tableName)})
                </span>
            </div>
            <button class="modal-close">&times;</button>
        `;
        
        modal.appendChild(header);
        
        const content = document.createElement('div');
        content.style.padding = '20px';
        
        // Extract key properties from column data
        const columnProps = {
            'Table': tableName,
            'Name': columnData.Name || columnData.name || '',
            'Code': columnData.Code || columnData.code || '',
            'Datatype': columnData.Datatype || columnData.datatype || '',
            'Description': columnData.Description || columnData.description || '',
            'Primary': columnData.Primary || columnData.primary || '',
            'Foreign': columnData.Foreign || columnData.foreign || '',
            'Mandatory': columnData.Mandatory || columnData.mandatory || '',
            'Unique': columnData.Unique || columnData.unique || '',
            'Mapping': columnData.Mapping || columnData.mapping || '',
            'FK Constraint': columnData.FK_Constraint || columnData.fk_constraint || '',
            'FK Reference': columnData.FK_Reference || columnData.fk_reference || '',
            'AK Constraint': columnData.AK_Constraint || columnData.ak_constraint || ''
        };
        
        let html = `
            <div style="margin-bottom: 20px;">
                <table class="modal-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        Object.entries(columnProps).forEach(([key, value]) => {
            if (value || value === 0 || value === false) {
                html += `
                    <tr>
                        <td style="font-weight: 500;">${escapeHtml(key)}</td>
                        <td>${escapeHtml(String(value))}</td>
                    </tr>
                `;
            }
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        // Add navigation buttons
        html += `
            <div style="display: flex; gap: 10px; margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--border);">
                <button onclick="showMappedEntityDetails('${escapeHtml(tableName)}', 'PDM')"
                        style="flex: 1; padding: 8px 15px; background: var(--accent-pdm); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    <i class="fa-solid fa-table"></i> View Table Details
                </button>
                <button onclick="event.preventDefault(); tagSearch('PDM', '${encodeString(tableName)}')"
                        style="flex: 1; padding: 8px 15px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border); border-radius: 4px; cursor: pointer; font-size: 12px;">
                    <i class="fa-solid fa-magnifying-glass"></i> Search for Table
                </button>
            </div>
        `;
        
        content.innerHTML = html;
        modal.appendChild(content);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        header.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { 
            if (e.target === overlay) overlay.remove(); 
        });
        
    } catch (error) {
        console.error('Error showing mapped column details:', error);
        showToast('Failed to load column details', 'error');
    }
}

/**
 * NEW: Shows all entities that have a specific impacted module
 * @param {string} moduleName - Name of the impacted module
 * @param {string} className - Class name of the module
 * @param {string} comment - Comment about the module
 */
function showEntitiesByImpactedModule(moduleName, className, comment) {
  // Decode parameters
  const decodedModuleName = moduleName;
  const decodedClassName = className;
  const decodedComment = decodeString(comment);  
  // Find all entities that have this impacted module
  const allEntities = state.cdmData || [];
  const matchingEntities = [];
  
  allEntities.forEach(entity => {
    const impactedModules = entity.ImpactedModules || [];
    
    // Check if any impacted module in this entity matches our module name
    const hasModule = impactedModules.some(module => {
      const modName = module.name || module.Name || '';
      return modName && modName.toLowerCase() === decodedModuleName.toLowerCase();
    });
    
    if (hasModule) {
      matchingEntities.push(entity);
    }
  });
    
  // Create the modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const modal = document.createElement('div');
  modal.className = 'modal-box';
  modal.style.maxWidth = '800px';
  modal.style.maxHeight = '80vh';
  
  modal.innerHTML = `
    <div class="modal-header">
      <div class="title">
        <i class="fa-solid fa-cubes"></i>
        Impacted Module: <strong>${escapeHtml(decodedModuleName)}</strong>
        <span style="font-size: 12px; color: var(--text-secondary); margin-left: 10px;">
          (${matchingEntities.length} entities)
        </span>
      </div>
      <button class="modal-close">&times;</button>
    </div>
    
    <div style="padding: 15px; border-bottom: 1px solid var(--border);">
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${decodedClassName ? `
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="font-weight: 600; color: var(--text-secondary); min-width: 60px;">Class:</span>
            <span style="color: var(--accent-cdm);">${escapeHtml(decodedClassName)}</span>
          </div>
        ` : ''}
        ${decodedComment ? `
          <div style="display: flex; align-items: flex-start; gap: 5px;">
            <span style="font-weight: 600; color: var(--text-secondary); min-width: 60px;">Comment:</span>
            <span>${escapeHtml(decodedComment)}</span>
          </div>
        ` : ''}
      </div>
    </div>
    
    <div style="padding: 0;">
      ${matchingEntities.length === 0 ? `
        <div style="padding: 40px 20px; text-align: center; color: var(--text-secondary);">
          <i class="fa-solid fa-search" style="font-size: 24px; margin-bottom: 10px; opacity: 0.5;"></i>
          <div>No entities found with this impacted module.</div>
        </div>
      ` : `
        <div style="max-height: 50vh; overflow-y: auto;">
          <table class="modal-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="position: sticky; top: 0; background: var(--bg-secondary); z-index: 1;">
                <th style="padding: 12px 15px; border-bottom: 2px solid var(--border); text-align: left; font-weight: 600; font-size: 12px;">
                  Entity Name
                </th>
                <th style="padding: 12px 15px; border-bottom: 2px solid var(--border); text-align: left; font-weight: 600; font-size: 12px;">
                  Model
                </th>
                <th style="padding: 12px 15px; border-bottom: 2px solid var(--border); text-align: left; font-weight: 600; font-size: 12px;">
                  Attributes
                </th>
                <th style="padding: 12px 15px; border-bottom: 2px solid var(--border); text-align: left; font-weight: 600; font-size: 12px;">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              ${matchingEntities.map((entity, index) => {
                const entityName = entity.Name || entity.name || 'Unnamed Entity';
                const model = entity.Model || 'N/A';
                const attributes = entity.Attributes || [];
                const stereotype = entity.Stereotype || '';
                const stereotypeClass = getStereotypeColorClass(stereotype);
                
                return `
                  <tr style="${index % 2 === 0 ? 'background: var(--bg-secondary);' : ''}">
                    <td style="padding: 10px 15px; border-bottom: 1px solid var(--border);">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        ${stereotype ? `
                          <span class="entity-box ${stereotypeClass}" style="font-size: 10px; padding: 2px 4px;">
                            ${escapeHtml(stereotype)}
                          </span>
                        ` : ''}
                        <div style="font-weight: 500; font-size: 12px;">
                          ${escapeHtml(entityName)}
                        </div>
                      </div>
                    </td>
                    <td style="padding: 10px 15px; border-bottom: 1px solid var(--border); font-size: 11px; color: var(--text-secondary);">
                      ${escapeHtml(model)}
                    </td>
                    <td style="padding: 10px 15px; border-bottom: 1px solid var(--border); font-size: 11px;">
                      <span style="background: var(--bg-primary); padding: 2px 6px; border-radius: 10px; font-weight: 500;">
                        ${attributes.length}
                      </span>
                    </td>
                    <td style="padding: 10px 15px; border-bottom: 1px solid var(--border);">
                      <div style="display: flex; gap: 5px;">
                        <button onclick="showEntityInSidebar('${encodeString(entityName)}')"
                                style="background: var(--accent-cdm); color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;"
                                title="View entity details">
                          <i class="fa-solid fa-eye" style="font-size: 10px;"></i> View
                        </button>
                        <button onclick="findAndSelectEntityInGrid('${encodeString(entityName)}')"
                                style="background: var(--accent); color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;"
                                title="Find in grid">
                          <i class="fa-solid fa-magnifying-glass" style="font-size: 10px;"></i> Find
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
    
    ${matchingEntities.length > 0 ? `
      <div style="padding: 15px; border-top: 1px solid var(--border); background: var(--bg-secondary);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 11px; color: var(--text-secondary);">
            Showing ${matchingEntities.length} entities with impacted module <strong>${escapeHtml(decodedModuleName)}</strong>
          </div>
          <button onclick="exportEntitiesToCSV(${JSON.stringify(matchingEntities.map(e => e.Name || e.name)).replace(/"/g, '&quot;')}, '${encodeString(decodedModuleName)}')"
                  style="background: var(--accent-pdm); color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer;">
            <i class="fa-solid fa-download" style="font-size: 10px; margin-right: 4px;"></i> Export List
          </button>
        </div>
      </div>
    ` : ''}
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Add close functionality
  overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { 
    if (e.target === overlay) overlay.remove(); 
  });
}



/**
 * Helper function to find and select entity in the grid
 */
function findAndSelectEntityInGrid(encodedEntityName) {
  const entityName = decodeString(encodedEntityName);  
  // Build search string to find the entity
  const searchString = entityName + '.';
  
  // Set search input and trigger search
  const searchInput = document.getElementById('globalSearch');
  if (searchInput) {
    searchInput.value = searchString;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Close the impacted module modal
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
      modalOverlay.remove();
    }
    
    showToast(`Searching for entity: ${entityName}`, 'info');
  }
}

/**
 * Helper function to export entities list to CSV
 */
function exportEntitiesToCSV(encodedEntityNames, encodedModuleName) {
  const entityNames = JSON.parse(decodeString(encodedEntityNames));
  const moduleName = decodeString(encodedModuleName);
  
  if (!entityNames || !Array.isArray(entityNames) || entityNames.length === 0) {
    showToast('No entities to export', 'warning');
    return;
  }
  
  // Create CSV content
  const headers = ['Entity Name', 'Model', 'Stereotype', 'Attribute Count', 'Impacted Module'];
  const rows = [];
  
  entityNames.forEach(entityName => {
    const entity = state.cdmData.find(e => 
      (e.Name && e.Name.toLowerCase() === entityName.toLowerCase()) ||
      (e.name && e.name.toLowerCase() === entityName.toLowerCase())
    );
    
    if (entity) {
      rows.push([
        entity.Name || entity.name || '',
        entity.Model || '',
        entity.Stereotype || '',
        (entity.Attributes || []).length,
        moduleName
      ]);
    }
  });
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `entities_with_impacted_module_${moduleName.replace(/[^a-z0-9]/gi, '_')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showToast(`Exported ${rows.length} entities to CSV`, 'success');
}

/**
 * Shows modal with CDM entities/attributes that have a specific domain
 * @param {string} domainValue - The domain value to search for
 */
function showDomainModal(encdomainValue) {
    try {
        domainValue = decodeString(encdomainValue);        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'modal-box domain-modal simple-domain-modal';
        
        // Collect all CDM entities/attributes with this domain
        const domainEntities = [];
        
        if (state.cdmData && Array.isArray(state.cdmData)) {
            state.cdmData.forEach(entity => {
                const attributes = entity.Attributes || [];
                const matchingAttributes = [];
                
                attributes.forEach(attr => {
                    // Check both capitalized and lowercase versions
                    const attrDomain = attr.Domain || attr.domain || '';
                    if (attrDomain && attrDomain.toLowerCase() === domainValue.toLowerCase()) {
                        matchingAttributes.push({
                            name: attr.Name || attr.name || '',
                            description: attr.Description || attr.description || '',
                            datatype: attr.Datatype || attr.datatype || '',
                            mandatory: attr.Mandatory || attr.mandatory || '',
                            primary: attr.Primary || attr.primary || '',
                            mapping: attr.Mapping || attr.mapping || ''
                        });
                    }
                });
                
                if (matchingAttributes.length > 0) {
                    domainEntities.push({
                        entityName: entity.Name || entity.name || '',
                        entityModel: entity.Model || '',
                        attributes: matchingAttributes
                    });
                }
            });
        }
        
        // Sort by entity name
        domainEntities.sort((a, b) => a.entityName.localeCompare(b.entityName));
        
        // Calculate totals
        const totalEntities = domainEntities.length;
        const totalAttributes = domainEntities.reduce((sum, entity) => sum + entity.attributes.length, 0);
        
        // Create modal header
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `
            <div class="title">
                <i class="fa-solid fa-layer-group"></i>
                Domain: <strong>${escapeHtml(domainValue)}</strong>
                <span class="domain-count-badge">${totalEntities} entities, ${totalAttributes} attributes</span>
            </div>
            <button class="modal-close">&times;</button>
        `;
        
        modal.appendChild(header);
        
        // Create modal content
        const content = document.createElement('div');
        content.style.padding = '20px';
        
        if (domainEntities.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                    <i class="fa-solid fa-search" style="font-size: 24px; margin-bottom: 10px; opacity: 0.5;"></i>
                    <div style="font-size: 14px;">No CDM entities found with domain "${escapeHtml(domainValue)}"</div>
                </div>
            `;
        } else {
            // Simple search box
            content.innerHTML = `
                <div class="domain-search-box">
                    <input type="text" 
                           class="domain-search-input" 
                           placeholder="Filter by entity or attribute name..." 
                           id="domainSearchInput">
                </div>
                
                <div id="domainContent">
                    ${domainEntities.map(entity => `
                        <div class="domain-entity-header">
                            <i class="fa-solid fa-cube" style="color: var(--accent-cdm);"></i>
                            ${escapeHtml(entity.entityName)}
                            <span style="font-size: 11px; color: var(--text-secondary);">
                                (${entity.attributes.length} attributes)
                            </span>
                            <span style="margin-left: auto; font-size: 11px; color: var(--text-secondary);">
                                ${escapeHtml(entity.entityModel || '')}
                            </span>
                        </div>
                        
                        <div class="domain-entity-row">
                            ${entity.attributes.map(attr => `
                                <div class="domain-attribute-item">
                                    <div class="domain-attribute-info">
                                        <div class="domain-attribute-name">
                                            ${escapeHtml(attr.name)}
                                        </div>
                                        <div class="domain-attribute-details">
                                            ${attr.datatype ? `<span>${escapeHtml(attr.datatype)}</span>` : ''}
                                            ${attr.description ? `<span>${escapeHtml(truncateText(attr.description, 50))}</span>` : ''}
                                            ${attr.mandatory === 'X' ? `<span style="color: var(--error);">Mandatory</span>` : ''}
                                            ${attr.primary === 'X' ? `<span style="color: var(--warning);">PK</span>` : ''}
                                        </div>
                                    </div>
                                    <div class="domain-actions">
                                        <button class="btn-icon-small btn-search-attr" data-entity="${encodeString(entity.entityName)}" data-attr="${encodeString(attr.name)}" title="Search in grid">
                                          <i class="fa-solid fa-magnifying-glass"></i>
                                        </button>
                                        <button class="btn-icon-small btn-view-entity" data-entity="${encodeString(entity.entityName)}" title="View entity">
                                          <i class="fa-solid fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--border); text-align: center;">
                    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;">
                        Found ${totalAttributes} attributes in ${totalEntities} entities
                    </div>
                    <button class="btn-export-domain" data-domain="${encodeString(domainValue)}" style="background: var(--accent); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        <i class="fa-solid fa-download" style="margin-right: 5px;"></i> Export to CSV
                    </button>
                </div>
            `;
        }
        
        modal.appendChild(content);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Add close functionality
        header.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { 
            if (e.target === overlay) overlay.remove(); 
        });
        
            // Add search filter
            const searchInput = content.querySelector('#domainSearchInput');
            if (searchInput) {
              searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const entities = content.querySelectorAll('.domain-entity-header');
                const rows = content.querySelectorAll('.domain-entity-row');

                let visibleCount = 0;

                entities.forEach((entity, index) => {
                  const entityName = entity.textContent.toLowerCase();
                  const row = rows[index];
                  const attributes = row.querySelectorAll('.domain-attribute-item');

                  let entityVisible = false;

                  attributes.forEach(attr => {
                    const attrName = attr.querySelector('.domain-attribute-name').textContent.toLowerCase();
                    const attrDetails = attr.querySelector('.domain-attribute-details').textContent.toLowerCase();

                    if (attrName.includes(searchTerm) || entityName.includes(searchTerm) || attrDetails.includes(searchTerm)) {
                      attr.style.display = '';
                      entityVisible = true;
                    } else {
                      attr.style.display = 'none';
                    }
                  });

                  if (entityVisible || searchTerm === '') {
                    entity.style.display = '';
                    row.style.display = '';
                    visibleCount++;
                  } else {
                    entity.style.display = 'none';
                    row.style.display = 'none';
                  }
                });

                // Update count if we want to show it
                if (searchTerm) {
                  const badge = header.querySelector('.domain-count-badge');
                  if (badge) {
                    badge.textContent = `${visibleCount} entities`;
                  }
                }
              });
            }

            // Attach actions to buttons (use data- attributes to avoid inline onclick injection)
            // Search attribute buttons
            content.querySelectorAll('.btn-search-attr').forEach(btn => {
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                const ent = btn.dataset.entity;
                const attr = btn.dataset.attr;
                try { searchAttributeInGrid(ent, attr); } catch (err) { console.error('searchAttributeInGrid error', err); }
              });
            });

            // View entity buttons
            content.querySelectorAll('.btn-view-entity').forEach(btn => {
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                const ent = btn.dataset.entity;
                try { showEntityInSidebar(ent); } catch (err) { console.error('showEntityInSidebar error', err); }
              });
            });

            // Export domain button
            const exportBtn = content.querySelector('.btn-export-domain');
            if (exportBtn) {
              exportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const d = exportBtn.dataset.domain;
                try { exportDomainToCSV(d); } catch (err) { console.error('exportDomainToCSV error', err); }
              });
            }
        
        showToast(`Showing ${totalAttributes} attributes with domain "${domainValue}"`, 'info');
        
    } catch (error) {
        console.error('Error showing domain modal:', error);
        showToast('Failed to load domain information', 'error');
    }
}

/**
 * Search for attribute in grid
 */
function searchAttributeInGrid(encodedEntityName, encodedAttributeName) {
    const entityName = decodeString(encodedEntityName);
    const attributeName = decodeString(encodedAttributeName);
    
    // Create search string in format "EntityName.AttributeName"
    const searchString = `${entityName}.${attributeName}`;
    
    // Set search input
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.value = searchString;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Close modal
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
        
        showToast(`Searching: ${searchString}`, 'info');
    }
}

/**
 * Show entity in sidebar
 */
function showEntityInSidebar(encodedEntityName) {
    const entityName = decodeString(encodedEntityName);
    
    // Find entity in CDM data
    const entity = state.cdmData.find(e => 
        (e.Name && e.Name.toLowerCase() === entityName.toLowerCase()) ||
        (e.name && e.name.toLowerCase() === entityName.toLowerCase())
    );
    
    if (!entity) {
        showToast(`Entity "${entityName}" not found`, 'error');
        return;
    }
    
    // Create row data for sidebar
    const rowData = {
        _parentEntity: entity,
        _rawAttribute: null,
        Model: entity.Model || '',
        combinedName: entity.Name || entity.name || ''
    };
    
    // Open sidebar
    openSidebar(rowData);
    
    // Close modal
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
    
    showToast(`Showing entity: ${entityName}`, 'success');
}

/**
 * Export domain data to CSV
 */
function exportDomainToCSV(encodedDomainValue) {
    const domainValue = decodeString(encodedDomainValue);
    
    // Collect data again for export
    const exportData = [];
    
    if (state.cdmData && Array.isArray(state.cdmData)) {
        state.cdmData.forEach(entity => {
            const attributes = entity.Attributes || [];
            
            attributes.forEach(attr => {
                const attrDomain = attr.Domain || attr.domain || '';
                if (attrDomain && attrDomain.toLowerCase() === domainValue.toLowerCase()) {
                    exportData.push({
                        Entity: entity.Name || entity.name || '',
                        Model: entity.Model || '',
                        Attribute: attr.Name || attr.name || '',
                        Datatype: attr.Datatype || attr.datatype || '',
                        Description: attr.Description || attr.description || '',
                        Primary: attr.Primary || attr.primary || '',
                        Mandatory: attr.Mandatory || attr.mandatory || '',
                        Domain: attrDomain,
                        Mapping: attr.Mapping || attr.mapping || ''
                    });
                }
            });
        });
    }
    
    if (exportData.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }
    
    // Create CSV
    const headers = ['Entity', 'Model', 'Attribute', 'Datatype', 'Description', 'Primary', 'Mandatory', 'Domain', 'Mapping'];
    
    const csvRows = exportData.map(item => [
        item.Entity,
        item.Model,
        item.Attribute,
        item.Datatype,
        item.Description,
        item.Primary,
        item.Mandatory,
        item.Domain,
        item.Mapping
    ]);
    
    const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `domain_${domainValue.replace(/[^a-z0-9]/gi, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${exportData.length} attributes to CSV`, 'success');
}