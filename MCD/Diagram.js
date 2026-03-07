/* 
  SECTION : PDM DIAGRAM
*/

/**
 * Make modal draggable
 */
function makeModalDraggable(modal, dragHandle) {
  let isDragging = false;
  let offsetX = 0, offsetY = 0;
  
  dragHandle.addEventListener('mousedown', startDrag);
  
  function startDrag(e) {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) {
      return; // Don't drag if clicking on interactive elements
    }
    
    isDragging = true;
    const rect = modal.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    modal.style.position = 'fixed';
    modal.style.margin = '0';
    modal.style.transform = 'none';
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    e.preventDefault();
  }
  
  function drag(e) {
    if (!isDragging) return;
    
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // Keep modal within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const modalWidth = modal.offsetWidth;
    const modalHeight = modal.offsetHeight;
    
    const boundedX = Math.max(0, Math.min(x, viewportWidth - modalWidth));
    const boundedY = Math.max(0, Math.min(y, viewportHeight - modalHeight));
    
    modal.style.left = `${boundedX}px`;
    modal.style.top = `${boundedY}px`;
  }
  
  function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
  }
}

/**
 * Helper function to parse cardinality string and get display format
 */
function parseCardinalityString(cardinality) {
  if (!cardinality) return { min: '', max: '' };
  
  const card = String(cardinality).trim();
  
  // Handle common formats
  if (card.includes('..')) {
    const parts = card.split('..');
    return { 
      min: parts[0] || '0', 
      max: parts[1] || 'N' 
    };
  } else if (card.includes('-')) {
    const parts = card.split('-');
    return { 
      min: parts[0] || '0', 
      max: parts[1] || 'N' 
    };
  } else if (card.includes(',')) {
    const parts = card.split(',');
    return { 
      min: parts[0] || '0', 
      max: parts[1] || 'N' 
    };
  } 
  else if (card === '1' || card.toLowerCase() === 'one') {
    return { min: '1', max: '1' };
  } else if (card === '0' || card.toLowerCase() === 'zero') {
    return { min: '0', max: '1' };
  } else if (card === '*' || card.toLowerCase() === 'n') {
    return { min: '0', max: 'N' };
  } else {
    // Try to parse as a number
    const num = parseInt(card);
    if (!isNaN(num)) {
      return { min: String(num), max: String(num) };
    }
    // Return default
    return { min: '0', max: 'N' };
  }
}

// factor < 1 compresses distances; > 1 expands (around centroid)
function scaledPositions(nodes, factor) {
  const { cx, cy } = computeCentroid(nodes);
  const map = new Map();
  nodes.forEach(n => {
    const dx = n.posX - cx, dy = n.posY - cy;
    map.set(n.name, { x: cx + dx * factor, y: cy + dy * factor });
  });
  return map;
}

// Ensure a single reusable arrow marker exists and matches current color
function ensureArrowMarker(svgRoot, color) {
  let defs = svgRoot.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svgRoot.insertBefore(defs, svgRoot.firstChild);
  }
  let marker = svgRoot.querySelector('#arrowhead');
  if (!marker) {
    marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '10');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    // scale marker with stroke width
    marker.setAttribute('markerUnits', 'strokeWidth');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M0,0 L10,3.5 L0,7 Z');
    path.setAttribute('class', 'arrowhead-path');
    marker.appendChild(path);
    defs.appendChild(marker);
  }
  // Update marker color to match the line
  const path = marker.querySelector('.arrowhead-path');
  if (path) {
    path.setAttribute('fill', color);
    path.setAttribute('stroke', color);
  }
}

// Edge styling helpers (shared by CDM & PDM) 
function getEdgeStyles() {
  const d = state.settings?.diagram ?? {};
  const rel = d.edgeStyles?.relationship ?? {};
  const inh = d.edgeStyles?.inheritance ?? {};
  return {
    relationship: {
      color: rel.color ?? '#2563eb',
      width: Number(rel.width ?? 2),
      arrow: !!(rel.arrow ?? true),
    },
    inheritance: {
      color: inh.color ?? '#6b7280',
      width: Number(inh.width ?? 2),
      dash: !!(inh.dash ?? true),
    },
  };
}

// Apply stroke/width/marker/dash to a single edge element
function styleEdgeElement(lineEl, type, svgRoot) {
  const styles = getEdgeStyles();
  const s = styles[type];
  if (!s) return;
  lineEl.setAttribute('stroke', s.color);
  lineEl.setAttribute('stroke-width', String(s.width));
  // Marker for relationships only
  if (type === 'relationship') {
    if (s.arrow) {
      ensureArrowMarker(svgRoot, s.color);
      lineEl.setAttribute('marker-end', 'url(#arrowhead)');
    } else {
      lineEl.removeAttribute('marker-end');
    }
    // clear dash for relationships
    lineEl.removeAttribute('stroke-dasharray');
  } else if (type === 'inheritance') {
    // dashed if requested
    if (s.dash) {
      lineEl.setAttribute('stroke-dasharray', '6,4');
    } else {
      lineEl.removeAttribute('stroke-dasharray');
    }
    // no arrow on inheritance
    lineEl.removeAttribute('marker-end');
  }
}

// Collect edges (relationships) for PDM diagram based on given nodes
function collectPDMEdges(nodes) {
  const nameSet = new Set(nodes.map(n => n.name).concat(nodes.map(n => n.code)));
  const edges = [];

  (state.pdmData || []).forEach(tbl => {
    const referencesArray = tbl.References || [];
    const currentName = String(tbl.Name || tbl.Code || '');
    // This calls the function in Sidebar.js
    const rels = parsePDMReferencesArray(referencesArray, currentName) || [];
    
    rels.forEach(r => {
      // For the diagram, we strictly want Source = Child, Target = Parent for consistency
      // The Sidebar parser returns direction-aware objects.
      // We need to normalize them to Source=Child, Target=Parent for the diagram logic if possible, 
      // OR trust the draw logic to handle direction. 
      // Your drawPDMEdges logic handles generic source/target.
      
      const src = r.source;
      const tgt = r.target;
      
      if (nameSet.has(src) && nameSet.has(tgt)) {
        edges.push(r);
      }
    });
  });

  // Deduplicate based on unique key
  const uniq = new Map();
  edges.forEach(e => {
    // Unique key based on Child -> Parent relationship
    // If direction is incoming, source/target are swapped in the parser.
    // Let's ensure the key is stable: ChildTable -> ParentTable
    let child, parent;
    
    if (e.direction === 'outgoing') { // Current(Child) -> Other(Parent)
         child = e.source; parent = e.target;
    } else { // Current(Parent) <- Other(Child)
         child = e.target; parent = e.source;
    }
    
    // Fallback if direction logic is ambiguous, use column mapping
    //const key = `FK:${child || e.source}->${parent || e.target}:${e.fkColumn}|${e.pkColumn}`;
    
    //if (!uniq.has(key)) uniq.set(key, e);
  });
  // Return the collected edges. Previously the function returned the empty
  // dedupe map which was never populated, resulting in no edges rendered.
  return edges;
}

// Collect tables (nodes) in a PDM diagram for a given model
function collectPDMDiagramNodes(diagramName, modelName) {
  const nodes = [];
  (state.pdmData || []).forEach(t => {
    const sameModel = String(t.Model || 'N/A').trim() === String(modelName || 'N/A').trim();
    if (!sameModel) return;
    const diagrams = Array.isArray(t.Diagrams) ? t.Diagrams : [];
    diagrams.forEach(d => {
      const dn = String(d.name || '').trim();
      if (dn === String(diagramName).trim()) {
        nodes.push({
          name: String(t.Name || t.Code || 'Unnamed'),
          code: String(t.Code || ''),
          stereotype: t.Stereotype || '',
          comment: t.Comment || '',
          posX: Number(d.posX),
          posY: Number(d.posY),
          table: t
        });
      }
    });
  });
  return nodes;
}

 
/** function to generate the PDM diagram */
function showPDMDiagramModal(encdiagramName, encmodelName) {
  try {
    let diagramName = decodeString(encdiagramName);
    let modelName = decodeString(encmodelName);    
    // Collect nodes
    const nodes = collectPDMDiagramNodes(diagramName, modelName);
    if (!nodes.length) { 
      showToast(`No tables found in diagram "${diagramName}" (Model: ${modelName})`, 'error'); 
      return; 
    }
    
    // Use the function from Sidebar.js to get edges
    const edges = collectPDMEdges(nodes);    
    // Settings
    const dset = (state.settings.diagram || {});
    let spacingFactor = Number(dset.spacingFactor ?? 0.25);
    let autoFitSpacing = dset.autoFitSpacing ?? true;
    const defaultShowRel = dset.showRelationships !== false;
    let wrapLabel = dset.wrapLabel ?? false;
    const NODE_W = Number(dset.boxWidth ?? 220);
    const NODE_H = Number(dset.boxHeight ?? 90);
    const bf = Object.assign({
      showStereotype: true,
      showComment: true,
      showKeySummary: true,  // PK/FK/AK counts
      showCounts: false  // columns count
    }, dset.boxFieldsPdm || {});

    // Modal shell
    const overlay = document.createElement('div'); 
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div'); 
    modal.className = 'modal-box diagram-modal';
    modal.innerHTML = `
      <div class="modal-header">
        <div class="title"><i class="fa-solid fa-diagram-project"></i>
          PDM Diagram: ${escapeHtml(diagramName)} <span class="diag-model">(${escapeHtml(modelName)})</span>
        </div>
        <button class="modal-close">×</button>
      </div>
      <div class="diagram-toolbar">
        <button class="btn" id="btnFit"><i class="fa-solid fa-expand"></i> Fit</button>
        <button class="btn" id="btnZoomIn"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
        <button class="btn" id="btnZoomOut"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
        <button class="btn" id="btnCenter"><i class="fa-solid fa-crosshairs"></i> Center</button>
        <button class="btn" id="btnReset"><i class="fa-solid fa-rotate-left"></i> Reset</button>
        <button id="btnFullscreen" class="btn" title="Fullscreen (F)">⤢</button>
        <label class="chk"><input type="checkbox" id="chkShowRel" ${defaultShowRel ? 'checked' : ''}> Show FKs</label>
        <label class="chk"><input type="checkbox" id="wrapLabel" ${wrapLabel ? 'checked' : ''}> Wrap Label</label>
        <div class="diagram-search">
          <input id="diagSearch" type="text" placeholder="Find table…">
          <button class="btn" id="btnFind"><i class="fa-solid fa-search"></i></button>
        </div>
        <div class="spacing-group">
          <span style="font-size:12px;color:var(--text-secondary);">Spacing</span>
          <input id="spacingSlider" type="range" min="0.05" max="2.00" step="0.05" value="${spacingFactor}">
          <label class="chk" style="margin-left:6px"><input type="checkbox" id="chkAutoFit" ${autoFitSpacing ? 'checked' : ''}> Auto‑fit</label>
        </div>
      </div>
      <div class="diagram-viewport">
        <svg id="svgPDM">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-primary)"></polygon>
            </marker>
          </defs>
          <g id="zoomLayer" transform="translate(0,0) scale(1)">
            <g id="edgesLayer"></g>
            <g id="nodesLayer"></g>
          </g>
        </svg>
      </div>
      <!-- Relationship Modal Container -->
      <div id="relationshipModal" class="relationship-modal" style="display: none;">
        <div class="relationship-modal-content">
          <div class="relationship-modal-header">
            <div class="title"></div>
            <button class="relationship-modal-close">&times;</button>
          </div>
          <div class="relationship-modal-body"></div>
        </div>
      </div>
    `;
    // Make modal draggable
    setTimeout(() => {
      const modalHeader = modal.querySelector('.modal-header');
      makeModalDraggable(modal, modalHeader);
    }, 100);
    overlay.appendChild(modal); 
    document.body.appendChild(overlay);

    const svg = modal.querySelector('#svgPDM');
    const zoomLayer = modal.querySelector('#zoomLayer');
    const nodesLayer = modal.querySelector('#nodesLayer');
    const edgesLayer = modal.querySelector('#edgesLayer');
    const showRelEl = modal.querySelector('#chkShowRel');
    const wrapLabelEl = modal.querySelector('#wrapLabel');

    // Get relationship modal elements
    const relationshipModal = modal.querySelector('#relationshipModal');
    const relationshipModalHeader = relationshipModal.querySelector('.relationship-modal-header .title');
    const relationshipModalBody = relationshipModal.querySelector('.relationship-modal-body');
    const relationshipModalClose = relationshipModal.querySelector('.relationship-modal-close');

    // --- Live restyle handler for PDM ---
    function restyleAllEdgesPDM() {
      //const styles = getEdgeStyles();
      edgesLayer.querySelectorAll('line.edge.relationship').forEach(line => {
        styleEdgeElement(line, 'relationship', svg);
      });
    }

    function onDiagramSettingsChangedPDM(e) {
      restyleAllEdgesPDM();
    }
    document.addEventListener('diagramSettingsChanged', onDiagramSettingsChangedPDM);

    const btnFullscreen = modal.querySelector('#btnFullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => toggleFullscreen(modal));
    }
    
    modal.addEventListener('keydown', (e) => {
      if ((e.key === 'f' || e.key === 'F') && e.altKey) {
        e.preventDefault();
        toggleFullscreen(modal);
      }
    });

    // On close, exit fullscreen if needed
    modal.querySelector('.modal-close').addEventListener('click', () => {
      if (isFullscreen()) exitFullscreen();
      document.removeEventListener('diagramSettingsChanged', onDiagramSettingsChangedPDM);
      overlay.remove();
    });
    
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        if (isFullscreen()) exitFullscreen();
        document.removeEventListener('diagramSettingsChanged', onDiagramSettingsChangedPDM);
        overlay.remove();
      }
    });

    modal.setAttribute('tabindex', '-1');
    modal.focus();

    // Build box content
    function buildBoxLines(n) {
      const t = n.table || {};
      const lines = [];
      if (bf.showStereotype && t.Stereotype) lines.push(`Stereo: ${t.Stereotype}`);
      if (bf.showComment && t.Comment) {
        const c = String(t.Comment).trim();
        lines.push(c.length > 60 ? c.slice(0, 57) + '…' : c);
      }
      if (bf.showKeySummary && Array.isArray(t.Columns)) {
        const cols = t.Columns;
        const pk = cols.filter(c => isX(c.Primary)).length;
        const fk = cols.filter(c => isX(c.Foreign || c.FK)).length;
        const ak = cols.filter(c => isX(c.Unique || c.AK)).length;
        lines.push(`PK:${pk} FK:${fk} AK:${ak}`);
      }
      if (bf.showCounts && Array.isArray(t.Columns)) {
        lines.push(`Cols: ${t.Columns.length}`);
      }
      return lines;
    }

    // Node drag persistence (optional)
    const persistKey = `pdm:${modelName}:${diagramName}`;
    const persisted = (state.settings.diagram?.positions || {})[persistKey] || {};

    // Rebuild nodes+edges with spacing
    function rebuild() {
      nodesLayer.innerHTML = ''; 
      edgesLayer.innerHTML = '';

      // auto‑fit spacing calculation
      let eff = spacingFactor;
      if (modal.querySelector('#chkAutoFit').checked) {
        const pos1 = scaledPositions(nodes, 1.0);
        const xs = nodes.map(n => pos1.get(n.name).x), ys = nodes.map(n => pos1.get(n.name).y);
        const minX = Math.min(...xs) - NODE_W / 2, maxX = Math.max(...xs) + NODE_W / 2;
        const minY = Math.min(...ys) - NODE_H / 2, maxY = Math.max(...ys) + NODE_H / 2;
        const vb = svg.getBoundingClientRect(), PAD = 20;
        const needW = (maxX - minX) + PAD * 2, needH = (maxY - minY) + PAD * 2;
        const fit = Math.min(vb.width / needW, vb.height / needH);
        eff = Math.min(spacingFactor, Math.max(0.05, fit));
      }

      const pos = scaledPositions(nodes, eff);
      const coordMap = new Map(); // <string: name or code> -> {x,y}

      nodes.forEach(n => {
        const persistedPos = persisted[n.name];
        const p = persistedPos ? { x: persistedPos.x, y: persistedPos.y } : pos.get(n.name);

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const stereoClass = getStereotypeColorClass(n.stereotype);
        g.setAttribute('class', `node ${stereoClass}`);
        g.setAttribute('data-name', n.name);
        g.setAttribute('transform', `translate(${p.x}, ${p.y})`);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', -NODE_W / 2); 
        rect.setAttribute('y', -NODE_H / 2);
        rect.setAttribute('width', NODE_W); 
        rect.setAttribute('height', NODE_H);
        rect.setAttribute('rx', 10); 
        rect.setAttribute('ry', 10);
        rect.setAttribute('class', 'node-box');

        const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        title.setAttribute('class', 'node-title');
        title.setAttribute('text-anchor', 'middle');
        title.setAttribute('y', -NODE_H / 2 + 20);
        title.textContent = `${n.name}${n.code ? ` [${n.code}]` : ''}`;

        const sep = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        sep.setAttribute('x1', -NODE_W / 2 + 10);
        sep.setAttribute('y1', -NODE_H / 2 + 26);
        sep.setAttribute('x2', NODE_W / 2 - 10);
        sep.setAttribute('y2', -NODE_H / 2 + 26);
        sep.setAttribute('class', 'node-sep');

        const lines = buildBoxLines(n);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'node-lines');
        text.setAttribute('text-anchor', 'middle');
        let y0 = -NODE_H / 2 + 42;
        lines.forEach((line, i) => {
          const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          tspan.setAttribute('x', '0'); 
          tspan.setAttribute('y', String(y0 + i * 14));
          tspan.textContent = line; 
          text.appendChild(tspan);
        });

        // Drag node
        let dragging = false, lastX = 0, lastY = 0;
        g.addEventListener('mousedown', (e) => { 
          dragging = true; 
          lastX = e.clientX; 
          lastY = e.clientY; 
          svg.style.cursor = 'grabbing'; 
          e.stopPropagation(); 
        });
        
        document.addEventListener('mousemove', (e) => {
          if (!dragging) return;
          const dx = e.clientX - lastX, dy = e.clientY - lastY; 
          lastX = e.clientX; 
          lastY = e.clientY;
          const nx = p.x + dx / scale, ny = p.y + dy / scale; 
          p.x = nx; 
          p.y = ny;
          g.setAttribute('transform', `translate(${nx}, ${ny})`);
          coordMap.set(n.name, { x: nx, y: ny });
          if (n.code) coordMap.set(n.code, { x: nx, y: ny });
          drawPDMEdges(coordMap);
        });
        
        document.addEventListener('mouseup', () => {
          if (dragging) {
            dragging = false; 
            svg.style.cursor = '';
            state.settings.diagram = state.settings.diagram || {};
            state.settings.diagram.positions = state.settings.diagram.positions || {};
            state.settings.diagram.positions[persistKey] = state.settings.diagram.positions[persistKey] || {};
            state.settings.diagram.positions[persistKey][n.name] = { x: p.x, y: p.y };
            saveSettings();
          }
        });

        // Double‑click → table modal
        g.addEventListener('dblclick', () => showTableModal(n.table));

        g.appendChild(rect); 
        g.appendChild(title); 
        g.appendChild(sep); 
        g.appendChild(text);
        nodesLayer.appendChild(g);

        // Put both keys in the map
        coordMap.set(n.name, { x: p.x, y: p.y });
        if (n.code) coordMap.set(n.code, { x: p.x, y: p.y });
      });

      drawPDMEdges(coordMap);
      return coordMap;
    }

    /**
     * Shows reference modal when clicking on a relationship line
     */
    function showReferenceModal(edge) {
      try {
        // Determine which table to use as "current" based on direction
        let currentTableName = null;
        let linkedTableName = null;
        let dir = "";
        let child = "";
        let parent = "";

        // If direction is incoming, swap
        if (edge.direction === 'incoming') {
          currentTableName = edge.source;
          linkedTableName = edge.target;
          dir = "→";
          parent = edge.source;
          child = edge.target;
        }
        else {
          currentTableName = edge.target;
          linkedTableName = edge.source;
          dir = "←";
          child = edge.source;
          parent = edge.target;
        }
        
        // Get the table data
        const currentTable = state.pdmData.find(t => 
          (t.Name && t.Name.toLowerCase() === currentTableName.toLowerCase()) ||
          (t.Code && t.Code.toLowerCase() === currentTableName.toLowerCase())
        );
        
        const linkedTable = state.pdmData.find(t => 
          (t.Name && t.Name.toLowerCase() === linkedTableName.toLowerCase()) ||
          (t.Code && t.Code.toLowerCase() === linkedTableName.toLowerCase())
        );
        
        if (!currentTable) {
          showToast(`Table "${currentTableName}" not found in data`, 'error');
          return;
        }
        
        if (!linkedTable) {
          showToast(`Table "${linkedTableName}" not found in data`, 'error');
          return;
        }
        
        // Parse cardinalities for display
        const childCardinality = edge.childCardinality;
        const childParsed = parseCardinalityString(childCardinality);
        const fmtCard = (p) => {
          if (!p) return '';
          if (p.min && p.max) return p.min === p.max ? p.min : `${p.min}..${p.max}`;
          return '';
        };
        const childDisplay = fmtCard(childParsed);
        const isMandatory = edge.Mandatory === "True" || edge.Mandatory === true; //getMandatoryValue(edge);
        const parentCardinality = isMandatory ? '1..1' : '0..1';
        const parentParsed = parseCardinalityString(parentCardinality);
        const parentDisplay = fmtCard(parentParsed);
        
        
        // Update modal header
        relationshipModalHeader.innerHTML = `
          <i class="fa-solid fa-code-branch"></i>
          Foreign Key Relationship: <strong>${escapeHtml(currentTableName)}</strong> ${dir} <strong>${escapeHtml(linkedTableName)}</strong>
        `;
        
        // Update modal body
        relationshipModalBody.innerHTML = `
          <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div style="flex: 1; padding: 15px; background: var(--bg-primary); border-radius: 6px; border: 1px solid var(--border);">
              <h4 style="margin: 0 0 10px 0; color: var(--accent-pdm);">
                <i class="fa-solid fa-table"></i> Current Table: ${escapeHtml(currentTableName)}
              </h4>
              <div style="font-size: 12px; color: var(--text-secondary);">
                ${currentTable.Code ? `<div><strong>Code:</strong> ${escapeHtml(currentTable.Code)}</div>` : ''}
                ${currentTable.Comment ? `<div><strong>Comment:</strong> ${escapeHtml(currentTable.Comment)}</div>` : ''}
                ${currentTable.Stereotype ? `<div><strong>Stereotype:</strong> ${escapeHtml(currentTable.Stereotype)}</div>` : ''}
                <div style="margin-top: 10px;">
                  <button onclick="findAndShowTable('${encodeString(currentTableName)}')" 
                          style="background: var(--accent-pdm); color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                    View Table Details
                  </button>
                </div>
              </div>
            </div>
            
            <div style="flex: 1; padding: 15px; background: var(--bg-primary); border-radius: 6px; border: 1px solid var(--border);">
              <h4 style="margin: 0 0 10px 0; color: var(--accent-pdm);">
                <i class="fa-solid fa-external-link-alt"></i> Linked Table: ${escapeHtml(linkedTableName)}
              </h4>
              <div style="font-size: 12px; color: var(--text-secondary);">
                ${linkedTable.Code ? `<div><strong>Code:</strong> ${escapeHtml(linkedTable.Code)}</div>` : ''}
                ${linkedTable.Comment ? `<div><strong>Comment:</strong> ${escapeHtml(linkedTable.Comment)}</div>` : ''}
                ${linkedTable.Stereotype ? `<div><strong>Stereotype:</strong> ${escapeHtml(linkedTable.Stereotype)}</div>` : ''}
                <div style="margin-top: 10px;">
                  <button onclick="findAndShowTable('${encodeString(linkedTableName)}')" 
                          style="background: var(--accent-pdm); color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                    View Table Details
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div style="padding: 15px; background: var(--bg-primary); border-radius: 6px; border: 1px solid var(--border);">
            <h4 style="margin: 0 0 10px 0; color: var(--accent-pdm);">
              <i class="fa-solid fa-link"></i> Foreign Key Relationship Details
            </h4>
            
            <!-- Cardinality Summary -->
            <div style="margin: 15px 0; padding: 12px; background: var(--bg-secondary); border-radius: 6px; border: 1px solid var(--border);">
                <div style="text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: bold;">
                ${escapeHtml(child)} ${escapeHtml(childDisplay)} → ${escapeHtml(parentDisplay)} ${escapeHtml(parent)}
              </div>
              <div style="text-align: center; font-size: 11px; color: var(--text-secondary); margin-top: 5px;">
                Child Table → Parent Table
              </div>
            </div>
            
            <table class="modal-table" style="width: 100%; font-size: 12px;">
              <tbody>
                ${edge.referenceName ? `<tr><td style="width: 30%; font-weight: 600;">Reference Name</td><td>${escapeHtml(edge.referenceName)}</td></tr>` : ''}
                ${edge.fkColumn && edge.pkColumn ? `<tr><td style="width: 30%; font-weight: 600;">Column Mapping</td><td><code>${escapeHtml(edge.fkColumn)}</code> → <code>${escapeHtml(edge.pkColumn)}</code></td></tr>` : ''}
                
                <!-- Child Table (FK side) Details -->
                <tr>
                  <td style="width: 30%; font-weight: 600; color: var(--accent-pdm);">Child Table</td>
                  <td>${escapeHtml(child)}</td>
                </tr>
                <tr>
                  <td style="width: 30%; font-weight: 600;">Child Cardinality</td>
                  <td>${escapeHtml(childCardinality)} → ${escapeHtml(childDisplay)}</td>
                </tr>
                ${childParsed.min ? `<tr><td style="width: 30%; font-weight: 600;">Child Min Cardinality</td><td>${escapeHtml(childParsed.min)}</td></tr>` : ''}
                ${childParsed.max ? `<tr><td style="width: 30%; font-weight: 600;">Child Max Cardinality</td><td>${escapeHtml(childParsed.max)}</td></tr>` : ''}
                
                <!-- Parent Table (PK side) Details -->
                <tr>
                  <td style="width: 30%; font-weight: 600; color: var(--accent-pdm);">Parent Table</td>
                  <td>${escapeHtml(parent)}</td>
                </tr>
                <tr>
                  <td style="width: 30%; font-weight: 600;">Parent Mandatory</td>
                  <td>${isMandatory ? 'Yes' : 'No'} → ${escapeHtml(parentDisplay)}</td>
                </tr>
                <tr>
                  <td style="width: 30%; font-weight: 600;">Parent Cardinality</td>
                  <td>${escapeHtml(parentCardinality)} → ${escapeHtml(parentDisplay)}</td>
                </tr>
                ${parentParsed.min ? `<tr><td style="width: 30%; font-weight: 600;">Parent Min Cardinality</td><td>${escapeHtml(parentParsed.min)}</td></tr>` : ''}
                ${parentParsed.max ? `<tr><td style="width: 30%; font-weight: 600;">Parent Max Cardinality</td><td>${escapeHtml(parentParsed.max)}</td></tr>` : ''}
                
                <!-- Other properties -->
                ${edge.direction ? `<tr><td style="width: 30%; font-weight: 600;">Direction</td><td>${escapeHtml(edge.direction)}</td></tr>` : ''}
                ${edge.generated ? `<tr><td style="width: 30%; font-weight: 600;">Generated</td><td>${escapeHtml(edge.generated)}</td></tr>` : ''}
                ${edge.diagramContainer ? `<tr><td style="width: 30%; font-weight: 600;">Diagram Container</td><td>${escapeHtml(edge.diagramContainer)}</td></tr>` : ''}
                ${edge.Constraint ? `<tr><td style="width: 30%; font-weight: 600;">Constraint</td><td>${escapeHtml(edge.Constraint)}</td></tr>` : ''}
              </tbody>
            </table>
            
            ${edge.diagramContainer ? `
              <div style="margin-top: 15px; text-align: center;">
                <button onclick="showRelationshipDiagramModal('${edge.diagramContainer}', '${edge.referenceName || 'FK Relationship'}', 'PDM', '${modelName}')" 
                        style="background: var(--accent-cdm); color: white; border: none; padding: 8px 16px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                  <i class="fa-solid fa-diagram-project"></i> View in Diagram
                </button>
              </div>
            ` : ''}
          </div>
        `;
        // Make relationship modal draggable
      setTimeout(() => {
        const relationshipModalHeader = relationshipModal.querySelector('.relationship-modal-header');
        makeModalDraggable(relationshipModal, relationshipModalHeader);
      }, 100);
        // Show the modal
        relationshipModal.style.display = 'block';
        showToast(`Showing relationship between ${currentTableName} and ${linkedTableName}`, 'info');
        
      } catch (error) {
        console.error('Error showing reference modal:', error);
        showToast('Failed to load relationship details', 'error');
      }
    }
    
    // Close relationship modal handler
    relationshipModalClose.addEventListener('click', () => {
      relationshipModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    relationshipModal.addEventListener('click', (e) => {
      if (e.target === relationshipModal) {
        relationshipModal.style.display = 'none';
      }
    });

    // Function to draw edges with cardinality labels
    function drawPDMEdges(coordMap) {
      edgesLayer.innerHTML = '';
      if (!showRelEl.checked) return;

      edges.forEach(e => {      
        const src = coordMap.get(e.source);
        const tgt = coordMap.get(e.target);
        if (!src || !tgt) return;

        // Create the line - MAKE IT CLICKABLE
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', src.x);
        line.setAttribute('y1', src.y);
        line.setAttribute('x2', tgt.x);
        line.setAttribute('y2', tgt.y);
        line.setAttribute('class', 'edge relationship clickable-edge');
        line.setAttribute('data-reference-name', e.referenceName || '');
        line.setAttribute('data-source', e.source);
        line.setAttribute('data-target', e.target);
        line.style.cursor = 'pointer';
        
        // Add hover effect
        line.addEventListener('mouseenter', () => {
          line.style.strokeWidth = '3';
          line.style.stroke = 'var(--accent-pdm)';
        });
        
        line.addEventListener('mouseleave', () => {
          line.style.strokeWidth = '';
          line.style.stroke = '';
        });
        
        // Add click event to show reference modal
        line.addEventListener('click', (event) => {
          event.stopPropagation();
          showReferenceModal(e);
        });
        
        // style from settings
        styleEdgeElement(line, 'relationship', svg);
        edgesLayer.appendChild(line);

        // Calculate positions for labels
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        const quarterX = src.x + (tgt.x - src.x) * 0.25;
        const quarterY = src.y + (tgt.y - src.y) * 0.25;
        const threeQuarterX = src.x + (tgt.x - src.x) * 0.75;
        const threeQuarterY = src.y + (tgt.y - src.y) * 0.75;

        // Compute cardinalities per-edge (was using undefined outer-scope vars)
        const childParsed = parseCardinalityString(e.childCardinality);
        const fmtCard = (p) => {
          if (!p) return '';
          if (p.min && p.max) return p.min === p.max ? p.min : `${p.min}..${p.max}`;
          return '';
        };
        const childCardinalityDisplay = fmtCard(childParsed);
        const isMandatoryEdge = e.Mandatory === 'True' || e.Mandatory === true;
        const parentCardinality = isMandatoryEdge ? '1..1' : '0..1';
        const parentParsed = parseCardinalityString(parentCardinality);
        const parentCardinalityDisplay = fmtCard(parentParsed);
        // FOR PDM: Source is always CHILD (FK side), Target is always PARENT (PK side)
        // Position labels near the extremities of the table boxes (outside the rectangle)
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;
        const LABEL_OFFSET = 12; // px outside the node box
        const childSidePosition = {
          x: src.x + nx * (NODE_W / 2 + LABEL_OFFSET),
          y: src.y + ny * (NODE_H / 2 + LABEL_OFFSET)
        };
        const parentSidePosition = {
          x: tgt.x - nx * (NODE_W / 2 + LABEL_OFFSET),
          y: tgt.y - ny * (NODE_H / 2 + LABEL_OFFSET)
        };

        // Child cardinality label (always on child/source side near quarter position)
        if (childCardinalityDisplay) {
          const childCardinalityLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          childCardinalityLabel.setAttribute('class', 'card-label child');
          childCardinalityLabel.style.pointerEvents = 'none';
          childCardinalityLabel.textContent = childCardinalityDisplay;
          childCardinalityLabel.setAttribute('x', childSidePosition.x);
          childCardinalityLabel.setAttribute('y', childSidePosition.y);
          childCardinalityLabel.setAttribute('text-anchor', 'middle');
          childCardinalityLabel.setAttribute('dominant-baseline', 'middle');
          childCardinalityLabel.setAttribute('font-weight', 'bold');
          edgesLayer.appendChild(childCardinalityLabel);
        }

        // Parent cardinality label (always on parent/target side near three-quarter position)
        if (parentCardinalityDisplay) {
          const parentCardinalityLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          parentCardinalityLabel.setAttribute('class', 'card-label parent');
          parentCardinalityLabel.style.pointerEvents = 'none';
          parentCardinalityLabel.textContent = parentCardinalityDisplay;
          parentCardinalityLabel.setAttribute('x', parentSidePosition.x);
          parentCardinalityLabel.setAttribute('y', parentSidePosition.y);
          parentCardinalityLabel.setAttribute('text-anchor', 'middle');
          parentCardinalityLabel.setAttribute('dominant-baseline', 'middle');
          parentCardinalityLabel.setAttribute('font-weight', 'bold');
          edgesLayer.appendChild(parentCardinalityLabel);
        }

        // Middle label - reference name
        const midLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        midLabel.setAttribute('class', 'card-label mid');
        midLabel.style.pointerEvents = 'none';
        
        // Display reference name or relationship name
        let middleText = '';
        if (e.referenceName) {
          middleText = e.referenceName;
        } else if (e.name) {
          middleText = e.name;
        } else {
          // Fallback to column mapping
          middleText = `${e.fkColumn || ''} → ${e.pkColumn || ''}`;
        }
        // Handle wrapping when checkbox is enabled (use wrapLabelEl)
        if (wrapLabelEl && !wrapLabelEl.checked) {
          // Create a temporary measuring element
          const measure = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          measure.setAttribute('font-size', '11');
          measure.style.visibility = 'hidden';
          measure.textContent = '';
          svg.appendChild(measure);

          const maxWidth = Math.max(80, Math.min(200, NODE_W * 0.9));
          const words = String(middleText).split(/\s+/);
          const lines = [];
          let cur = '';
          words.forEach(w => {
            const trial = cur ? (cur + ' ' + w) : w;
            measure.textContent = trial;
            const wlen = measure.getComputedTextLength();
            if (wlen > maxWidth && cur) {
              lines.push(cur);
              cur = w;
            } else {
              cur = trial;
            }
          });
          if (cur) lines.push(cur);
          svg.removeChild(measure);

          // Build tspans centered vertically around midY
          const lineHeight = 12;
          const startY = midY - ((lines.length - 1) * lineHeight) / 2 - 4;
          midLabel.setAttribute('x', midX);
          midLabel.setAttribute('y', startY);
          midLabel.setAttribute('text-anchor', 'middle');
          midLabel.setAttribute('dominant-baseline', 'middle');
          midLabel.setAttribute('font-size', '11');
          lines.forEach((ln, idx) => {
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.setAttribute('x', String(midX));
            tspan.setAttribute('y', String(startY + idx * lineHeight));
            tspan.textContent = ln;
            midLabel.appendChild(tspan);
          });
          edgesLayer.appendChild(midLabel);
        } else {
          // No wrapping: simple text, truncated for safety
          const wrapLength = state.settings.diagram?.wrapLength || 30;
          if (middleText.length > wrapLength) middleText = middleText.substring(0, wrapLength) + '...';
          midLabel.textContent = middleText;
          midLabel.setAttribute('x', midX);
          midLabel.setAttribute('y', midY - 8);
          midLabel.setAttribute('text-anchor', 'middle');
          midLabel.setAttribute('dominant-baseline', 'middle');
          midLabel.setAttribute('font-size', '11');
          edgesLayer.appendChild(midLabel);
        }

        // Optional: Add column mapping as a smaller label below the reference name
        if (e.fkColumn && e.pkColumn && (e.referenceName || e.name)) {
          const columnLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          columnLabel.setAttribute('class', 'card-label small');
          columnLabel.style.pointerEvents = 'none';
          columnLabel.textContent = `${e.fkColumn} → ${e.pkColumn}`;
          columnLabel.setAttribute('x', midX);
          columnLabel.setAttribute('y', midY + 8);
          columnLabel.setAttribute('text-anchor', 'middle');
          columnLabel.setAttribute('dominant-baseline', 'middle');
          columnLabel.setAttribute('font-size', '9');
          columnLabel.setAttribute('fill', 'var(--text-secondary)');
          edgesLayer.appendChild(columnLabel);
        }
      });
    }

    // Build and center initially
    let nodeMap = rebuild();

    // Zoom & Pan (viewport)
    let scale = 1, tx = 0, ty = 0;
    function applyTransform() { 
      zoomLayer.setAttribute('transform', `translate(${tx},${ty}) scale(${scale})`); 
    }

    function zoomToPoint(x, y, factor) {
      const vb = svg.getBoundingClientRect();
      const minZ = state.settings.diagram?.minZoom ?? 0.1;
      const maxZ = state.settings.diagram?.maxZoom ?? 4;
      scale = Math.max(minZ, Math.min(maxZ, scale * factor));
      tx = vb.width / 2 - scale * x;
      ty = vb.height / 2 - scale * y;
      applyTransform();
    }
    
    function fitRect(x1, y1, x2, y2, pad) {
      const left = Math.min(x1, x2) - pad;
      const right = Math.max(x1, x2) + pad;
      const top = Math.min(y1, y2) - pad;
      const bottom = Math.max(y1, y2) + pad;
      const vb = svg.getBoundingClientRect();
      const needW = (right - left), needH = (bottom - top);
      const sX = vb.width / needW, sY = vb.height / needH;
      const minZ = state.settings.diagram?.minZoom ?? 0.1;
      const maxZ = state.settings.diagram?.maxZoom ?? 4;
      scale = Math.max(minZ, Math.min(sX, sY, maxZ));
      tx = (vb.width - scale * (left + right)) / 2;
      ty = (vb.height - scale * (top + bottom)) / 2;
      applyTransform();
    }

    // Click on a node => zoom (factor from settings), or fit-to-node
    nodesLayer.addEventListener('click', (ev) => {
      const g = ev.target.closest('g.node'); 
      if (!g) return;
      const name = g.getAttribute('data-name');
      const p = nodeMap.get(name); 
      if (!p) return;
      const z = state.settings.diagram?.zoom?.clickFactor ?? 1.8;
      const mode = state.settings.diagram?.zoom?.clickMode ?? 'factor';
      if (mode === 'factor') zoomToPoint(p.x, p.y, z);
      else {
        const pad = state.settings.diagram?.zoom?.selectPadding ?? 40;
        fitRect(p.x - NODE_W / 2, p.y - NODE_H / 2, p.x + NODE_W / 2, p.y + NODE_H / 2, pad);
      }
    });

    let selecting = false, selStart = null, selRectEl = null;
    svg.addEventListener('mousedown', (e) => {
      if (!e.shiftKey) return;
      selecting = true;
      svg.style.cursor = 'crosshair';
      const r = svg.getBoundingClientRect();
      const x = (e.clientX - r.left - tx) / scale;
      const y = (e.clientY - r.top - ty) / scale;
      selStart = { x, y };
      selRectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      selRectEl.setAttribute('class', 'selection-rect');
      selRectEl.setAttribute('x', x); 
      selRectEl.setAttribute('y', y);
      selRectEl.setAttribute('width', 0); 
      selRectEl.setAttribute('height', 0);
      selRectEl.setAttribute('fill', 'rgba(37,99,235,0.12)');
      selRectEl.setAttribute('stroke', state.settings.diagram.edgeColorRel || 'var(--accent-pdm)');
      selRectEl.setAttribute('stroke-dasharray', '4,2');
      zoomLayer.appendChild(selRectEl);
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!selecting || !selRectEl) return;
      const r = svg.getBoundingClientRect();
      const x = (e.clientX - r.left - tx) / scale;
      const y = (e.clientY - r.top - ty) / scale;
      selRectEl.setAttribute('x', Math.min(selStart.x, x));
      selRectEl.setAttribute('y', Math.min(selStart.y, y));
      selRectEl.setAttribute('width', Math.abs(x - selStart.x));
      selRectEl.setAttribute('height', Math.abs(y - selStart.y));
    });
    
    document.addEventListener('mouseup', () => {
      if (!selecting) return;
      selecting = false;
      svg.style.cursor = '';
      if (selRectEl) {
        const pad = state.settings.diagram?.zoom?.selectPadding ?? 40;
        const x1 = Number(selRectEl.getAttribute('x'));
        const y1 = Number(selRectEl.getAttribute('y'));
        const x2 = x1 + Number(selRectEl.getAttribute('width'));
        const y2 = y1 + Number(selRectEl.getAttribute('height'));
        selRectEl.remove(); 
        selRectEl = null;
        if (Math.abs(x2 - x1) > 10 && Math.abs(y2 - y1) > 10) fitRect(x1, y1, x2, y2, pad);
      }
    });

    function centerView() {
      const xs = nodes.map(n => (nodeMap.get(n.name) || {}).x), 
            ys = nodes.map(n => (nodeMap.get(n.name) || {}).y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const vb = svg.getBoundingClientRect();
      tx = vb.width / 2 - scale * cx; 
      ty = vb.height / 2 - scale * cy; 
      applyTransform();
    }
    
    function fitView() {
      const xs = nodes.map(n => (nodeMap.get(n.name) || {}).x), 
            ys = nodes.map(n => (nodeMap.get(n.name) || {}).y);
      const minX = Math.min(...xs) - NODE_W / 2, maxX = Math.max(...xs) + NODE_W / 2;
      const minY = Math.min(...ys) - NODE_H / 2, maxY = Math.max(...ys) + NODE_H / 2;
      const vb = svg.getBoundingClientRect(), PAD = 40;
      const needW = (maxX - minX) + PAD * 2, needH = (maxY - minY) + PAD * 2;
      const sX = vb.width / needW, sY = vb.height / needH;
      const minZ = state.settings.diagram?.minZoom ?? 0.1, maxZ = state.settings.diagram?.maxZoom ?? 4;
      scale = Math.max(minZ, Math.min(sX, sY, maxZ));
      tx = (vb.width - scale * (minX + maxX)) / 2;
      ty = (vb.height - scale * (minY + maxY)) / 2;
      applyTransform();
    }

    // Drag-to-pan on canvas
    let draggingCanvas = false, lastX = 0, lastY = 0;
    svg.addEventListener('mousedown', (e) => { 
      draggingCanvas = true; 
      lastX = e.clientX; 
      lastY = e.clientY; 
      svg.style.cursor = 'grabbing'; 
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!draggingCanvas) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY; 
      lastX = e.clientX; 
      lastY = e.clientY;
      tx += dx; 
      ty += dy; 
      applyTransform();
    });
    
    document.addEventListener('mouseup', () => { 
      if (draggingCanvas) { 
        draggingCanvas = false; 
        svg.style.cursor = ''; 
      } 
    });

    // Toolbar wiring
    modal.querySelector('#btnFit').addEventListener('click', fitView);
    modal.querySelector('#btnCenter').addEventListener('click', centerView);
    modal.querySelector('#btnReset').addEventListener('click', () => { 
      scale = 1; 
      tx = 0; 
      ty = 0; 
      applyTransform(); 
    });
    
    modal.querySelector('#btnZoomIn').addEventListener('click', () => { 
      const maxZ = state.settings.diagram?.maxZoom ?? 4; 
      scale = Math.min(maxZ, scale * 1.2); 
      applyTransform(); 
    });
    
    modal.querySelector('#btnZoomOut').addEventListener('click', () => { 
      const minZ = state.settings.diagram?.minZoom ?? 0.1; 
      scale = Math.max(minZ, scale / 1.2); 
      applyTransform(); 
    });

    showRelEl.addEventListener('change', () => drawPDMEdges(nodeMap));
    
    wrapLabelEl.addEventListener('change', () => {
      if (wrapLabelEl.checked) {
        state.settings.diagram = Object.assign({ wrapLabel: true }, state.settings.diagram || {});
        showToast('Reference names will be truncated to '+ String(state.settings.diagram.wrapLength) + ' if too long', 'info');
      } else {
        state.settings.diagram = Object.assign({ wrapLabel: false }, state.settings.diagram || {});  
        showToast('Reference names will be shown in full', 'info');
      } 
      drawPDMEdges(nodeMap);
    });

    modal.querySelector('#spacingSlider').addEventListener('input', (e) => {
      spacingFactor = Number(e.target.value);
      nodeMap = rebuild(); 
      centerView();
      state.settings.diagram = Object.assign({ spacingFactor }, state.settings.diagram || {}); 
      saveSettings();
    });
    
    modal.querySelector('#chkAutoFit').addEventListener('change', () => { 
      nodeMap = rebuild(); 
      centerView(); 
      state.settings.diagram.autoFitSpacing = modal.querySelector('#chkAutoFit').checked; 
      saveSettings(); 
    });

    modal.querySelector('#btnFind').addEventListener('click', () => {
      const q = String(modal.querySelector('#diagSearch').value || '').trim().toLowerCase();
      if (!q) return;
      const hit = nodes.find(n => (n.name.toLowerCase().includes(q) || (n.code || '').toLowerCase().includes(q)));
      if (!hit) { 
        showToast('Table not found in diagram', 'error'); 
        return; 
      }
      const p = nodeMap.get(hit.name); 
      if (!p) return;
      const vb = svg.getBoundingClientRect(); 
      tx = vb.width / 2 - scale * p.x; 
      ty = vb.height / 2 - scale * p.y; 
      applyTransform();
    });

    // Initial center
    centerView();

    showToast(`PDM diagram "${diagramName}" opened (${nodes.length} tables)`, 'info');
    
  } catch (e) {
    console.error('showPDMDiagramModal error', e);
    showToast('Failed to open PDM diagram viewer', 'error');
  }
}

/** CDM section */

/**
 * Build CDM edges (relationships + inheritance) between nodes present in diagram
 */
function collectCDMEdges(nodes) {
  const nameSet = new Set(nodes.map(n => n.name));
  const edges = [];

  // Extract relationships from Relationships array
  nodes.forEach(n => {
    const e = n.entity || {};
    const relationshipsData = e.Relationships || [];
    
    const rels = extractCDMRelationships(relationshipsData, n.name) || [];
    
    rels.forEach(r => {
      if (nameSet.has(r.source) && nameSet.has(r.target)) {
        edges.push({ 
          type: 'relationship', 
          source: r.source,
          target: r.target,
          sourceCardinality: r.sourceCardinality || '',
          targetCardinality: r.targetCardinality || '',
          direction: r.direction,
          relationshipName: r.relationshipName || '',
          diagramContainer: r.diagramContainer || ''
        });
      }
    });
  });

  // Inheritance: parents and children
  nodes.forEach(n => {
    const e = n.entity || {};

    // Parents
    let parentsRaw = e.List_parent || e.list_parent;
    if (parentsRaw) {
      let parents = [];
      if (Array.isArray(parentsRaw)) {
        parents = parentsRaw.map(x => typeof x === 'string' ? x : (x?.Name || x?.name || '')).filter(Boolean);
      } else if (typeof parentsRaw === 'string') {
        parents = parseHierarchicalNotation(parentsRaw);
      } else if (parentsRaw?.Name || parentsRaw?.name) {
        parents = [parentsRaw.Name || parentsRaw.name];
      }
      parents.forEach(p => {
        const pn = String(p).trim();
        if (nameSet.has(pn)) edges.push({ type: 'inheritance', source: pn, target: n.name });
      });
    }

    // Children
    let childrenRaw = e.List_child || e.list_child;
    if (childrenRaw) {
      let children = [];
      if (Array.isArray(childrenRaw)) {
        children = childrenRaw.map(x => typeof x === 'string' ? x : (x?.Name || x?.name || '')).filter(Boolean);
      } else if (typeof childrenRaw === 'string') {
        children = parseHierarchicalNotation(childrenRaw);
      } else if (childrenRaw?.Name || childrenRaw?.name) {
        children = [childrenRaw.Name || childrenRaw.name];
      }
      children.forEach(c => {
        const cn = String(c).trim();
        if (nameSet.has(cn)) edges.push({ type: 'inheritance', source: n.name, target: cn });
      });
    }
  });

  // Deduplicate
  const uniq = new Map();
  edges.forEach(e => {
    const key = `${e.type}:${e.source}->${e.target}:${e.sourceCardinality}|${e.targetCardinality}`;
    if (!uniq.has(key)) uniq.set(key, e);
  });
  return Array.from(uniq.values());
}


/* 
  SECTION : CDM DIAGRAM
*/
/**
 * Collect entities (nodes) in a CDM diagram for a given model
 */
function collectCDMDiagramNodes(diagramName, modelName) {
  const nodes = [];
  (state.cdmData || []).forEach(e => {
    const sameModel = String(e.Model || 'N/A').trim() === String(modelName || 'N/A').trim();
    if (!sameModel) return;
    const diagrams = Array.isArray(e.Diagrams) ? e.Diagrams : [];
    diagrams.forEach(d => {
      const dn = String(d.name || '').trim();
      if (dn === String(diagramName).trim()) {
        nodes.push({
          name: String(e.Name || e.Ent_fr_name || e.name || 'Unnamed'),
          stereotype: e.Stereotype || e.stereotype || '',
          comment: e.Comment || e.Ent_fr_comment || '',
          mapping: e.Mapping || '',
          posX: Number(d.posX),
          posY: Number(d.posY),
          entity: e
        });
      }
    });
  });
  return nodes;
}


/** 
  function to generate the CDM diagram
 */
function showCDMDiagramModal(diagramEncoded, modelEncoded) {
  try {
    let diagramName = decodeString(diagramEncoded);
    let modelName = decodeString(modelEncoded);
    const nodes = collectCDMDiagramNodes(diagramName, modelName);
    if (!nodes.length) { 
      showToast(`No entities found in diagram "${diagramName}" (Model: ${modelName})`, 'error'); 
      return; 
    }
    
    const edges = collectCDMEdges(nodes);

    const dset = (state.settings.diagram || {});
    let spacingFactor = Number(dset.spacingFactor ?? 0.25);
    let autoFitSpacing = dset.autoFitSpacing ?? true;
    const defaultShowRel = dset.showRelationships !== false;
    const defaultShowInh = dset.showInheritance !== false;
    const NODE_W = Number(dset.boxWidth ?? 220);
    const NODE_H = Number(dset.boxHeight ?? 90);
    const bf = Object.assign({
      showStereotype: true,
      showComment: true,
      showKeySummary: true,
      showMapping: false,
      showCounts: false
    }, dset.boxFields || {});

    const overlay = document.createElement('div'); 
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div'); 
    modal.className = 'modal-box diagram-modal';
    modal.innerHTML = `
      <div class="modal-header">
        <div class="title"><i class="fa-solid fa-diagram-project"></i>
          CDM Diagram: ${escapeHtml(diagramName)} <span class="diag-model">(${escapeHtml(modelName)})</span>
        </div>
        <button class="modal-close">×</button>
      </div>
      <div class="diagram-toolbar">
        <button class="btn" id="btnFit"><i class="fa-solid fa-expand"></i> Fit</button>
        <button class="btn" id="btnZoomIn"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
        <button class="btn" id="btnZoomOut"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
        <button class="btn" id="btnCenter"><i class="fa-solid fa-crosshairs"></i> Center</button>
        <button class="btn" id="btnReset"><i class="fa-solid fa-rotate-left"></i> Reset</button>
        <button id="btnFullscreen" class="btn" title="Fullscreen (F)">⤢</button>
        <label class="chk"><input type="checkbox" id="chkShowRel" ${defaultShowRel ? 'checked' : ''}> Relationships</label>
        <label class="chk"><input type="checkbox" id="chkShowInh" ${defaultShowInh ? 'checked' : ''}> Inheritance</label>
        <div class="diagram-search">
          <input id="diagSearch" type="text" placeholder="Find entity…">
          <button class="btn" id="btnFind"><i class="fa-solid fa-search"></i></button>
        </div>
        <div class="spacing-group">
          <span style="font-size:12px;color:var(--text-secondary);">Spacing</span>
          <input id="spacingSlider" type="range" min="0.05" max="2.00" step="0.05" value="${spacingFactor}">
          <label class="chk" style="margin-left:6px"><input type="checkbox" id="chkAutoFit" ${autoFitSpacing ? 'checked' : ''}> Auto‑fit</label>
        </div>
      </div>
      <div class="diagram-viewport">
        <svg id="svgCDM">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-primary)"></polygon>
            </marker>
          </defs>
          <g id="zoomLayer" transform="translate(0,0) scale(1)">
            <g id="edgesLayer"></g>
            <g id="nodesLayer"></g>
          </g>
        </svg>
      </div>
      <!-- Relationship Modal Container -->
      <div id="relationshipModal" class="relationship-modal" style="display: none;">
        <div class="relationship-modal-content">
          <div class="relationship-modal-header">
            <div class="title"></div>
            <button class="relationship-modal-close">&times;</button>
          </div>
          <div class="relationship-modal-body"></div>
        </div>
      </div>
    `;
    // Make modal draggable
    setTimeout(() => {
      const modalHeader = modal.querySelector('.modal-header');
      makeModalDraggable(modal, modalHeader);
    }, 100);
    overlay.appendChild(modal); 
    document.body.appendChild(overlay);

    const svg = modal.querySelector('#svgCDM');
    const zoomLayer = modal.querySelector('#zoomLayer');
    const nodesLayer = modal.querySelector('#nodesLayer');
    const edgesLayer = modal.querySelector('#edgesLayer');
    const showRelEl = modal.querySelector('#chkShowRel');
    const showInhEl = modal.querySelector('#chkShowInh');
    
    // Get relationship modal elements
    const relationshipModal = modal.querySelector('#relationshipModal');
    const relationshipModalHeader = relationshipModal.querySelector('.relationship-modal-header .title');
    const relationshipModalBody = relationshipModal.querySelector('.relationship-modal-body');
    const relationshipModalClose = relationshipModal.querySelector('.relationship-modal-close');
    
    function restyleAllEdgesCDM() {
      edgesLayer.querySelectorAll('line.edge.relationship').forEach(line => {
        styleEdgeElement(line, 'relationship', svg);
      });
      edgesLayer.querySelectorAll('line.edge.inheritance').forEach(line => {
        styleEdgeElement(line, 'inheritance', svg);
      });
      const inhColor = state.settings.diagram?.edgeColorInh || 'var(--accent-cdm)';
      edgesLayer.querySelectorAll('polygon.inheritance-tip').forEach(poly => {
        poly.setAttribute('stroke', inhColor);
        poly.setAttribute('fill', inhColor);
      });
    }

    function onDiagramSettingsChanged(e) {
      restyleAllEdgesCDM();
    }
    document.addEventListener('diagramSettingsChanged', onDiagramSettingsChanged);

    const btnFullscreen = modal.querySelector('#btnFullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => toggleFullscreen(modal));
    }
    
    modal.addEventListener('keydown', (e) => {
      if ((e.key === 'f' || e.key === 'F') && e.altKey) {
        e.preventDefault();
        toggleFullscreen(modal);
      }
    });

    modal.querySelector('.modal-close').addEventListener('click', () => {
      if (isFullscreen()) exitFullscreen();
      document.removeEventListener('diagramSettingsChanged', onDiagramSettingsChanged);
      overlay.remove();
    });

    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        if (isFullscreen()) exitFullscreen();
        document.removeEventListener('diagramSettingsChanged', onDiagramSettingsChanged);
        overlay.remove();
      }
    });
    
    /**
     * Shows relationship modal when clicking on a relationship line
     */
    function showRelationshipModal(edge) {
      try {
        // Determine which entity to use as "current" based on direction
        let currentEntityName = edge.source;
        let linkedEntityName = edge.target;
        
        // Get the entity data for both entities
        const currentEntity = state.cdmData.find(e => 
          (e.Name && e.Name.toLowerCase() === currentEntityName.toLowerCase()) ||
          (e.name && e.name.toLowerCase() === currentEntityName.toLowerCase())
        );
        
        const linkedEntity = state.cdmData.find(e => 
          (e.Name && e.Name.toLowerCase() === linkedEntityName.toLowerCase()) ||
          (e.name && e.name.toLowerCase() === linkedEntityName.toLowerCase())
        );
        
        if (!currentEntity) {
          showToast(`Entity "${currentEntityName}" not found in data`, 'error');
          return;
        }
        
        if (!linkedEntity) {
          showToast(`Entity "${linkedEntityName}" not found in data`, 'error');
          return;
        }
        
        // Format cardinalities for display
        const sourceCardinality = edge.sourceCardinality || '';
        const targetCardinality = edge.targetCardinality || '';
        const sourceSymbols = parseCardinality(sourceCardinality);
        const targetSymbols = parseCardinality(targetCardinality);
        
        // Update modal header
        relationshipModalHeader.innerHTML = `
          <i class="fa-solid fa-code-branch"></i>
          Relationship: <strong>${escapeHtml(currentEntityName)}</strong> ↔ <strong>${escapeHtml(linkedEntityName)}</strong>
        `;
        
        // Update modal body
        relationshipModalBody.innerHTML = `
          <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div style="flex: 1; padding: 15px; background: var(--bg-primary); border-radius: 6px; border: 1px solid var(--border);">
              <h4 style="margin: 0 0 10px 0; color: var(--accent-cdm);">
                <i class="fa-solid fa-cube"></i> Current Entity: ${escapeHtml(currentEntityName)}
              </h4>
              <div style="font-size: 12px; color: var(--text-secondary);">
                ${currentEntity.Description ? `<div><strong>Description:</strong> ${escapeHtml(currentEntity.Description)}</div>` : ''}
                ${currentEntity.Comment ? `<div><strong>Comment:</strong> ${escapeHtml(currentEntity.Comment)}</div>` : ''}
                ${currentEntity.Stereotype ? `<div><strong>Stereotype:</strong> ${escapeHtml(currentEntity.Stereotype)}</div>` : ''}
                ${currentEntity.Mapping ? `<div><strong>Mapping:</strong> ${escapeHtml(currentEntity.Mapping)}</div>` : ''}
                <div style="margin-top: 10px;">
                  <button onclick="showParentEntityDetails('${encodeString(currentEntityName)}')" 
                          style="background: var(--accent-cdm); color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                    View Entity Details
                  </button>
                </div>
              </div>
            </div>
            
            <div style="flex: 1; padding: 15px; background: var(--bg-primary); border-radius: 6px; border: 1px solid var(--border);">
              <h4 style="margin: 0 0 10px 0; color: var(--accent-cdm);">
                <i class="fa-solid fa-external-link-alt"></i> Linked Entity: ${escapeHtml(linkedEntityName)}
              </h4>
              <div style="font-size: 12px; color: var(--text-secondary);">
                ${linkedEntity.Description ? `<div><strong>Description:</strong> ${escapeHtml(linkedEntity.Description)}</div>` : ''}
                ${linkedEntity.Comment ? `<div><strong>Comment:</strong> ${escapeHtml(linkedEntity.Comment)}</div>` : ''}
                ${linkedEntity.Stereotype ? `<div><strong>Stereotype:</strong> ${escapeHtml(linkedEntity.Stereotype)}</div>` : ''}
                ${linkedEntity.Mapping ? `<div><strong>Mapping:</strong> ${escapeHtml(linkedEntity.Mapping)}</div>` : ''}
                <div style="margin-top: 10px;">
                  <button onclick="showParentEntityDetails('${encodeString(linkedEntityName)}')" 
                          style="background: var(--accent-cdm); color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                    View Entity Details
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div style="padding: 15px; background: var(--bg-primary); border-radius: 6px; border: 1px solid var(--border);">
            <h4 style="margin: 0 0 10px 0; color: var(--accent-cdm);">
              <i class="fa-solid fa-link"></i> Relationship Details
            </h4>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 14px; text-align: center; margin: 15px 0; padding: 10px; background: var(--bg-secondary); border-radius: 4px;">
              ${escapeHtml(currentEntityName)} ${sourceSymbols.left} ↔ ${targetSymbols.right} ${escapeHtml(linkedEntityName)}
            </div>
            <table class="modal-table" style="width: 100%; font-size: 12px;">
              <tbody>
                ${edge.relationshipName ? `<tr><td style="width: 30%; font-weight: 600;">Relationship Name</td><td>${escapeHtml(edge.relationshipName)}</td></tr>` : ''}
                ${sourceCardinality ? `<tr><td style="width: 30%; font-weight: 600;">Source Cardinality</td><td>${escapeHtml(sourceCardinality)} ${sourceSymbols.left ? `(${escapeHtml(sourceSymbols.left)})` : ''}</td></tr>` : ''}
                ${targetCardinality ? `<tr><td style="width: 30%; font-weight: 600;">Target Cardinality</td><td>${escapeHtml(targetCardinality)} ${targetSymbols.right ? `(${escapeHtml(targetSymbols.right)})` : ''}</td></tr>` : ''}
                ${edge.direction ? `<tr><td style="width: 30%; font-weight: 600;">Direction</td><td>${escapeHtml(edge.direction)}</td></tr>` : ''}
                ${edge.diagramContainer ? `<tr><td style="width: 30%; font-weight: 600;">Diagram Container</td><td>${escapeHtml(edge.diagramContainer)}</td></tr>` : ''}
              </tbody>
            </table>
            
            ${edge.diagramContainer ? `
              <div style="margin-top: 15px; text-align: center;">
                <button onclick="showRelationshipDiagramModal('${encodeString(edge.diagramContainer)}', '${encodeString(edge.relationshipName || 'Relationship')}', 'CDM', '${encodeString(modelName)}')" 
                        style="background: var(--accent-cdm); color: white; border: none; padding: 8px 16px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                  <i class="fa-solid fa-diagram-project"></i> View in Diagram
                </button>
              </div>
            ` : ''}
          </div>
        `;
        // Make relationship modal draggable
        setTimeout(() => {
          const relationshipModalHeader = relationshipModal.querySelector('.relationship-modal-header');
          makeModalDraggable(relationshipModal, relationshipModalHeader);
        }, 100);
        // Show the modal
        relationshipModal.style.display = 'block';
        showToast(`Showing relationship between ${currentEntityName} and ${linkedEntityName}`, 'info');
        
      } catch (error) {
        console.error('Error showing relationship modal:', error);
        showToast('Failed to load relationship details', 'error');
      }
    }
    
    // Close relationship modal handler
    relationshipModalClose.addEventListener('click', () => {
      relationshipModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    relationshipModal.addEventListener('click', (e) => {
      if (e.target === relationshipModal) {
        relationshipModal.style.display = 'none';
      }
    });

    function buildBoxLines(n) {
      const e = n.entity || {};
      const lines = [];
      if (bf.showStereotype && e.Stereotype) lines.push(`Stereo: ${e.Stereotype}`);
      if (bf.showComment) {
        const c = (e.Comment || e.Ent_fr_comment || '').trim();
        if (c) lines.push(c.length > 60 ? c.slice(0, 57) + '…' : c);
      }
      if (bf.showMapping && e.Mapping) lines.push(`Map: ${e.Mapping}`);
      if (bf.showKeySummary) {
        const attrs = Array.isArray(e.Attributes) ? e.Attributes : [];
        const pk = attrs.filter(a => isX(a.Primary)).length;
        const m = attrs.filter(a => isX(a.Mandatory)).length;
        const bi = attrs.filter(a => isX(a.Identifier)).length;
        lines.push(`PK:${pk} M:${m} BI:${bi}`);
      }
      if (bf.showCounts) {
        const attrs = Array.isArray(e.Attributes) ? e.Attributes : [];
        lines.push(`Attrs: ${attrs.length}`);
      }
      return lines;
    }

    const persistKey = `cdm:${modelName}:${diagramName}`;
    const persisted = (state.settings.diagram?.positions || {})[persistKey] || {};

    function rebuild() {
      nodesLayer.innerHTML = ''; 
      edgesLayer.innerHTML = '';

      let eff = spacingFactor;
      if (modal.querySelector('#chkAutoFit').checked) {
        const pos1 = scaledPositions(nodes, 1.0);
        const xs = nodes.map(n => pos1.get(n.name).x), ys = nodes.map(n => pos1.get(n.name).y);
        const minX = Math.min(...xs) - NODE_W / 2, maxX = Math.max(...xs) + NODE_W / 2;
        const minY = Math.min(...ys) - NODE_H / 2, maxY = Math.max(...ys) + NODE_H / 2;
        const vb = svg.getBoundingClientRect(), PAD = 20;
        const needW = (maxX - minX) + PAD * 2, needH = (maxY - minY) + PAD * 2;
        const fit = Math.min(vb.width / needW, vb.height / needH);
        eff = Math.min(spacingFactor, Math.max(0.05, fit));
      }

      const pos = scaledPositions(nodes, eff);
      const nodeMap = new Map();

      nodes.forEach(n => {
        const persistedPos = persisted[n.name];
        const p = persistedPos ? { x: persistedPos.x, y: persistedPos.y } : pos.get(n.name);

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const stereoClass = getStereotypeColorClass(n.stereotype);
        g.setAttribute('class', `node ${stereoClass}`);
        g.setAttribute('data-name', n.name);
        g.setAttribute('transform', `translate(${p.x}, ${p.y})`);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', -NODE_W / 2); 
        rect.setAttribute('y', -NODE_H / 2);
        rect.setAttribute('width', NODE_W); 
        rect.setAttribute('height', NODE_H);
        rect.setAttribute('rx', 10); 
        rect.setAttribute('ry', 10);
        rect.setAttribute('class', 'node-box');

        const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        title.setAttribute('class', 'node-title');
        title.setAttribute('text-anchor', 'middle');
        title.setAttribute('y', -NODE_H / 2 + 20);
        title.textContent = n.name;

        const sep = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        sep.setAttribute('x1', -NODE_W / 2 + 10); 
        sep.setAttribute('y1', -NODE_H / 2 + 26);
        sep.setAttribute('x2', NODE_W / 2 - 10); 
        sep.setAttribute('y2', -NODE_H / 2 + 26);
        sep.setAttribute('class', 'node-sep');

        const lines = buildBoxLines(n);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'node-lines');
        text.setAttribute('text-anchor', 'middle');
        let y0 = -NODE_H / 2 + 42;
        lines.forEach((line, i) => {
          const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          tspan.setAttribute('x', '0'); 
          tspan.setAttribute('y', String(y0 + i * 14));
          tspan.textContent = line; 
          text.appendChild(tspan);
        });

        let dragging = false, lastX = 0, lastY = 0;
        g.addEventListener('mousedown', (e) => { 
          dragging = true; 
          lastX = e.clientX; 
          lastY = e.clientY; 
          svg.style.cursor = 'grabbing'; 
          e.stopPropagation(); 
        });
        
        document.addEventListener('mousemove', (e) => {
          if (!dragging) return;
          const dx = e.clientX - lastX, dy = e.clientY - lastY; 
          lastX = e.clientX; 
          lastY = e.clientY;
          const nx = p.x + dx / scale, ny = p.y + dy / scale; 
          p.x = nx; 
          p.y = ny;
          g.setAttribute('transform', `translate(${nx}, ${ny})`);
          nodeMap.set(n.name, { x: nx, y: ny }); 
          drawCDMEdges(nodeMap);
        });
        
        document.addEventListener('mouseup', () => {
          if (dragging) {
            dragging = false; 
            svg.style.cursor = '';
            state.settings.diagram = state.settings.diagram || {};
            state.settings.diagram.positions = state.settings.diagram.positions || {};
            state.settings.diagram.positions[persistKey] = state.settings.diagram.positions[persistKey] || {};
            state.settings.diagram.positions[persistKey][n.name] = { x: p.x, y: p.y };
            saveSettings();
          }
        });

        g.addEventListener('dblclick', () => showParentEntityDetails(n.name, n.entity));

        g.appendChild(rect); 
        g.appendChild(title); 
        g.appendChild(sep); 
        g.appendChild(text);
        nodesLayer.appendChild(g);
        nodeMap.set(n.name, { x: p.x, y: p.y });
      });

      drawCDMEdges(nodeMap);
      return nodeMap;
    }

    function drawCDMEdges(nodeMap) {
      edgesLayer.innerHTML = '';
      const showRel = showRelEl.checked;
      const showInh = showInhEl.checked;

      edges.forEach(e => {
        if (e.type === 'relationship' && !showRel) return;
        if (e.type === 'inheritance' && !showInh) return;

        const src = nodeMap.get(e.source);
        const tgt = nodeMap.get(e.target);
        if (!src || !tgt) return;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', src.x); 
        line.setAttribute('y1', src.y);
        line.setAttribute('x2', tgt.x); 
        line.setAttribute('y2', tgt.y);
        // line.setAttribute('class', `edge ${e.type}`);
        line.style.color = state.settings.diagram?.edgeColorRel || 'var(--accent-cdm)';
        
        // Make relationship lines clickable
        if (e.type === 'relationship') {
          line.classList.add('clickable-edge');
          line.style.cursor = 'pointer';
          line.style.color = state.settings.diagram?.edgeColorInh || 'var(--accent-cdm)';
          // Add hover effect
          line.addEventListener('mouseenter', () => {
            line.style.strokeWidth = '3';
            line.style.stroke = state.settings.diagram?.edgeColorRel || 'var(--accent-cdm)';
          });
          
          line.addEventListener('mouseleave', () => {
            line.style.strokeWidth = '';
            line.style.stroke = '';
          });
          
          // Add click event to show relationship modal
          line.addEventListener('click', (event) => {
            event.stopPropagation();
            showRelationshipModal(e);
          });
        }
        
        styleEdgeElement(line, e.type, svg);
        edgesLayer.appendChild(line);

        if (e.type === 'relationship') {
          // Format cardinalities for display
          const sourceCardinality = e.sourceCardinality || '';
          const targetCardinality = e.targetCardinality || '';
          const sourceSymbols = parseCardinality(sourceCardinality);
          const targetSymbols = parseCardinality(targetCardinality);

          // Add source cardinality label
          const labelSrc = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          labelSrc.setAttribute('class', 'card-label');
          labelSrc.textContent = sourceSymbols.left || '';
          labelSrc.setAttribute('x', src.x + (tgt.x - src.x) * 0.25);
          labelSrc.setAttribute('y', src.y + (tgt.y - src.y) * 0.25 - 6);
          labelSrc.style.pointerEvents = 'none';
          edgesLayer.appendChild(labelSrc);

          // Add target cardinality label
          const labelTgt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          labelTgt.setAttribute('class', 'card-label');
          labelTgt.textContent = targetSymbols.right || '';
          labelTgt.setAttribute('x', src.x + (tgt.x - src.x) * 0.75);
          labelTgt.setAttribute('y', src.y + (tgt.y - src.y) * 0.75 + 14);
          labelTgt.style.pointerEvents = 'none';
          edgesLayer.appendChild(labelTgt);

          // Add middle label with relationship name
          const mid = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          mid.setAttribute('class', 'card-label mid');
          
          let middleText = e.relationshipName || `${sourceSymbols.left || ''} : ${targetSymbols.right || ''}`;
          if (middleText.length > 30) {
            middleText = middleText.substring(0, 27) + '...';
          }
          
          mid.textContent = middleText;
          mid.setAttribute('x', (src.x + tgt.x) / 2);
          mid.setAttribute('y', (src.y + tgt.y) / 2 - 6);
          mid.style.pointerEvents = 'none';
          mid.setAttribute('font-size', '11');
          edgesLayer.appendChild(mid);
        }

        if (e.type === 'inheritance') {
          const tri = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          tri.setAttribute('class', 'inheritance-tip');
          const inhColor = state.settings.diagram?.edgeColorInh || 'var(--accent-cdm)';
          tri.setAttribute('stroke', inhColor);
          tri.setAttribute('fill', inhColor);
          edgesLayer.appendChild(tri);
        }
      });
    }

    let nodeMap = rebuild();
    let scale = 1, tx = 0, ty = 0;
    
    function applyTransform() { 
      zoomLayer.setAttribute('transform', `translate(${tx},${ty}) scale(${scale})`); 
    }

    function zoomToPoint(x, y, factor) {
      const vb = svg.getBoundingClientRect();
      const minZ = state.settings.diagram?.minZoom ?? 0.1;
      const maxZ = state.settings.diagram?.maxZoom ?? 4;
      scale = Math.max(minZ, Math.min(maxZ, scale * factor));
      tx = vb.width / 2 - scale * x;
      ty = vb.height / 2 - scale * y;
      applyTransform();
    }

    function fitRect(x1, y1, x2, y2, pad) {
      const left = Math.min(x1, x2) - pad;
      const right = Math.max(x1, x2) + pad;
      const top = Math.min(y1, y2) - pad;
      const bottom = Math.max(y1, y2) + pad;
      const vb = svg.getBoundingClientRect();
      const needW = (right - left), needH = (bottom - top);
      const sX = vb.width / needW, sY = vb.height / needH;
      const minZ = state.settings.diagram?.minZoom ?? 0.1;
      const maxZ = state.settings.diagram?.maxZoom ?? 4;
      scale = Math.max(minZ, Math.min(sX, sY, maxZ));
      tx = (vb.width - scale * (left + right)) / 2;
      ty = (vb.height - scale * (top + bottom)) / 2;
      applyTransform();
    }

    function centerView() {
      const xs = nodes.map(n => (nodeMap.get(n.name) || {}).x), 
            ys = nodes.map(n => (nodeMap.get(n.name) || {}).y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const vb = svg.getBoundingClientRect();
      tx = vb.width / 2 - scale * cx; 
      ty = vb.height / 2 - scale * cy; 
      applyTransform();
    }

    function fitView() {
      const xs = nodes.map(n => (nodeMap.get(n.name) || {}).x), 
            ys = nodes.map(n => (nodeMap.get(n.name) || {}).y);
      const minX = Math.min(...xs) - NODE_W / 2, maxX = Math.max(...xs) + NODE_W / 2;
      const minY = Math.min(...ys) - NODE_H / 2, maxY = Math.max(...ys) + NODE_H / 2;
      const vb = svg.getBoundingClientRect(), PAD = 40;
      const needW = (maxX - minX) + PAD * 2, needH = (maxY - minY) + PAD * 2;
      const sX = vb.width / needW, sY = vb.height / needH;
      const minZ = state.settings.diagram?.minZoom ?? 0.1, maxZ = state.settings.diagram?.maxZoom ?? 4;
      scale = Math.max(minZ, Math.min(sX, sY, maxZ));
      tx = (vb.width - scale * (minX + maxX)) / 2;
      ty = (vb.height - scale * (minY + maxY)) / 2;
      applyTransform();
    }

    nodesLayer.addEventListener('click', (ev) => {
      const g = ev.target.closest('g.node'); 
      if (!g) return;
      const name = g.getAttribute('data-name');
      const p = nodeMap.get(name); 
      if (!p) return;
      const z = state.settings.diagram?.zoom?.clickFactor ?? 1.8;
      const mode = state.settings.diagram?.zoom?.clickMode ?? 'factor';
      if (mode === 'factor') zoomToPoint(p.x, p.y, z);
      else fitRect(p.x - NODE_W / 2, p.y - NODE_H / 2, p.x + NODE_W / 2, p.y + NODE_H / 2, 40);
    });

    let selecting = false, selStart = null, selRectEl = null;
    svg.addEventListener('mousedown', (e) => {
      if (!e.shiftKey) return;
      selecting = true;
      svg.style.cursor = 'crosshair';
      const r = svg.getBoundingClientRect();
      const x = (e.clientX - r.left - tx) / scale;
      const y = (e.clientY - r.top - ty) / scale;
      selStart = { x, y };
      selRectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      selRectEl.setAttribute('class', 'selection-rect');
      selRectEl.setAttribute('x', x); 
      selRectEl.setAttribute('y', y);
      selRectEl.setAttribute('width', 0); 
      selRectEl.setAttribute('height', 0);
      selRectEl.setAttribute('fill', 'rgba(37,99,235,0.12)');
      selRectEl.setAttribute('stroke', state.settings.diagram.edgeColorRel || 'var(--accent-cdm)');
      selRectEl.setAttribute('stroke-dasharray', '4,2');
      zoomLayer.appendChild(selRectEl);
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!selecting || !selRectEl) return;
      const r = svg.getBoundingClientRect();
      const x = (e.clientX - r.left - tx) / scale;
      const y = (e.clientY - r.top - ty) / scale;
      selRectEl.setAttribute('x', Math.min(selStart.x, x));
      selRectEl.setAttribute('y', Math.min(selStart.y, y));
      selRectEl.setAttribute('width', Math.abs(x - selStart.x));
      selRectEl.setAttribute('height', Math.abs(y - selStart.y));
    });
    
    document.addEventListener('mouseup', () => {
      if (!selecting) return;
      selecting = false;
      svg.style.cursor = '';
      if (selRectEl) {
        const x1 = Number(selRectEl.getAttribute('x'));
        const y1 = Number(selRectEl.getAttribute('y'));
        const x2 = x1 + Number(selRectEl.getAttribute('width'));
        const y2 = y1 + Number(selRectEl.getAttribute('height'));
        selRectEl.remove(); 
        selRectEl = null;
        if (Math.abs(x2 - x1) > 10 && Math.abs(y2 - y1) > 10) fitRect(x1, y1, x2, y2, 20);
      }
    });

    let draggingCanvas = false, lastX = 0, lastY = 0;
    svg.addEventListener('mousedown', (e) => { 
      draggingCanvas = true; 
      lastX = e.clientX; 
      lastY = e.clientY; 
      svg.style.cursor = 'grabbing'; 
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!draggingCanvas) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY; 
      lastX = e.clientX; 
      lastY = e.clientY;
      tx += dx; 
      ty += dy; 
      applyTransform();
    });
    
    document.addEventListener('mouseup', () => { 
      if (draggingCanvas) { 
        draggingCanvas = false; 
        svg.style.cursor = ''; 
      } 
    });

    // Toolbar wiring
    modal.querySelector('#btnFit').addEventListener('click', fitView);
    modal.querySelector('#btnCenter').addEventListener('click', centerView);
    modal.querySelector('#btnReset').addEventListener('click', () => { 
      scale = 1; 
      tx = 0; 
      ty = 0; 
      applyTransform(); 
    });
    
    modal.querySelector('#btnZoomIn').addEventListener('click', () => { 
      scale = Math.min(4, scale * 1.2); 
      applyTransform(); 
    });
    
    modal.querySelector('#btnZoomOut').addEventListener('click', () => { 
      scale = Math.max(0.1, scale / 1.2); 
      applyTransform(); 
    });

    showRelEl.addEventListener('change', () => drawCDMEdges(nodeMap));
    showInhEl.addEventListener('change', () => drawCDMEdges(nodeMap));
    
    modal.querySelector('#spacingSlider').addEventListener('input', (e) => {
      spacingFactor = Number(e.target.value);
      nodeMap = rebuild(); 
      centerView();
      state.settings.diagram = Object.assign({ spacingFactor }, state.settings.diagram || {}); 
      saveSettings();
    });
    
    modal.querySelector('#chkAutoFit').addEventListener('change', () => { 
      nodeMap = rebuild(); 
      centerView(); 
      state.settings.diagram.autoFitSpacing = modal.querySelector('#chkAutoFit').checked; 
      saveSettings(); 
    });

    modal.querySelector('#btnFind').addEventListener('click', () => {
      const q = String(modal.querySelector('#diagSearch').value || '').trim().toLowerCase();
      if (!q) return;
      const hit = nodes.find(n => n.name.toLowerCase().includes(q));
      if (!hit) { 
        showToast('Entity not found in diagram', 'error'); 
        return; 
      }
      const p = nodeMap.get(hit.name); 
      if (!p) return;
      const vb = svg.getBoundingClientRect(); 
      tx = vb.width / 2 - scale * p.x; 
      ty = vb.height / 2 - scale * p.y; 
      applyTransform();
    });

    centerView();
    showToast(`CDM diagram "${diagramName}" opened (${nodes.length} entities)`, 'info');
    
  } catch (e) {
    console.error('showCDMDiagramModal error', e);
    showToast('Failed to open CDM diagram viewer', 'error');
  }
}
