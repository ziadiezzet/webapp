// ==================================================================
// MODULE: GRID RENDERING & VIRTUAL SCROLLING
// ==================================================================

/******************************************************
 * Updates the counter displaying visible/total items *
 ******************************************************/
 
function updateCounter() {
    const filtered = state.viewData.length.toLocaleString();
    const total = state.allData.length.toLocaleString();
    els.filteredCounterBadge.textContent = `${filtered}/${total}`;
    els.statusCounter.textContent = `${filtered} ${state.mode === 'CDM' ? 'attributes' : 'columns'} visible`;
}

/*******************************
 * Renders grid column headers *
 *******************************/
 
function renderHeaders() {
    els.gridHeader.innerHTML = '';
    const rowDiv = document.createElement('div');
    rowDiv.className = 'grid-header-row';
    let currentLeft = 0;

    state.columns.forEach((col, index) => {
        if (!col.visible) return;

        const th = document.createElement('div');
        th.className = `header-cell ${col.frozen ? 'frozen' : ''}`;
        th.style.width = `${col.width}px`;
        th.innerHTML = `<span>${col.name}</span>`;
        
        if (col.frozen) {
            th.style.left = `${currentLeft}px`;
            currentLeft += col.width;
        }

        if (state.sortCol === col.id) {
            th.classList.add('sorted');
            const icon = document.createElement('i');
            icon.className = `sort-icon fa-solid fa-sort-${state.sortAsc ? 'up' : 'down'}`;
            th.firstChild.appendChild(icon);
        }
        
        th.draggable = true;
        th.ondragstart = (e) => {
            if (isResizing) { e.preventDefault(); return; }
            draggedColIndex = index;
            th.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        };
        th.ondragover = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; th.classList.add('drag-over'); };
        th.ondragleave = () => th.classList.remove('drag-over');
        th.ondrop = (e) => {
            e.preventDefault();
            th.classList.remove('drag-over');
            th.classList.remove('dragging');
            handleDrop(e, index);
        };
        th.onclick = (e) => {
            if(e.target.classList.contains('col-resizer')) return;
            handleSort(col.id);
        };

        const resizer = document.createElement('div');
        resizer.className = 'col-resizer';
        resizer.addEventListener('mousedown', (e) => { e.stopPropagation(); e.preventDefault(); initResize(e, col); });
        th.appendChild(resizer);

        rowDiv.appendChild(th);
    });

    const totalW = state.columns.reduce((a, c) => c.visible ? a + c.width : a, 0);
    rowDiv.style.width = `${totalW}px`;
    els.gridHeader.appendChild(rowDiv);
    els.gridHeader.scrollLeft = els.gridViewport.scrollLeft;
}

/******************************************
 * Calculates and updates grid dimensions *
 ******************************************/
 
function updateGridMetrics() {
    const totalWidth = state.columns.reduce((acc, col) => col.visible ? acc + col.width : acc, 0);
    els.gridCanvas.style.width = `${totalWidth}px`;
    const totalHeight = state.viewData.length * state.rowHeight;
    els.gridCanvas.style.height = `${totalHeight}px`;
}

/***************************************************
 * Renders only visible rows for virtual scrolling *
 ***************************************************/
 
function renderVirtualRows() {
    const { scrollTop, clientHeight } = els.gridViewport;
    const { rowHeight, viewData, columns } = state;

    const startIndex = Math.floor(scrollTop / rowHeight);
    const endIndex = Math.min(viewData.length, Math.ceil((scrollTop + clientHeight) / rowHeight) + 5);
    const totalWidth = columns.reduce((acc, col) => col.visible ? acc + col.width : acc, 0);

    const fragment = document.createDocumentFragment();

    for (let i = startIndex; i < endIndex; i++) {
        const rowData = viewData[i];
        if (!rowData) continue;

        const rowEl = document.createElement('div');
        rowEl.className = 'grid-row';
        // Support multi-selection: either single selectedRowIndex or entries in selectedRowIndexes
        const isSelected = (Array.isArray(state.selectedRowIndexes) && state.selectedRowIndexes.indexOf(i) !== -1) || state.selectedRowIndex === i;
        if (isSelected) rowEl.classList.add('selected');
        
        rowEl.style.top = `${i * rowHeight}px`;
        rowEl.style.height = `${rowHeight}px`;
        rowEl.style.width = `${totalWidth}px`;
        
        rowEl.addEventListener('click', (e) => handleRowClick(e, i, rowData));

        let currentLeft = 0;

        columns.forEach(col => {
            if (!col.visible) return;
            
            const cell = document.createElement('div');
            cell.className = `grid-cell ${col.frozen ? 'frozen' : ''}`;
            cell.style.width = `${col.width}px`;            
            
            if (col.frozen) {
                cell.style.left = `${currentLeft}px`;
                currentLeft += col.width;
            }

            let content = rowData[col.id];
            content = (content === null || content === undefined) ? '' : String(content);
            if (col.id === 'combinedName') {
                cell.innerHTML = `<a href="#" onclick="event.preventDefault()">${content}</a>`;
            } else if (col.id === 'Screen') {
                cell.innerHTML = `<a href="#" onclick="event.preventDefault();showEntitiesByImpactedModule('${content}', 'N/A', '${encodeString('N/A')}')">${content}</a>`;  
            } else if (col.id === 'TTS') {
				  // Only allow ...text</a>, otherwise render as text
				  const tmp = document.createElement('div');
				  tmp.innerHTML = content;
				  const a = tmp.querySelector('a[href]');
				  if (a && /^https?:\/\//i.test(a.getAttribute('href'))) {
					const safeA = document.createElement('a');
					safeA.href = a.href;
					safeA.textContent = a.textContent || a.href;
					safeA.target = '_blank';
					safeA.rel = 'noopener noreferrer';
					cell.appendChild(safeA);
				  } else {
					cell.textContent = content; // fallback
				  }
            } else if (col.id === 'Domain') {
                const span = document.createElement('span');
                span.className = 'clickable-domain';
                span.textContent = content;
                span.addEventListener('click', (e) => {
                    e.stopPropagation();
                    try { showDomainModal(encodeString(content)); } catch (err) { console.error('showDomainModal error', err); }
                });
                cell.appendChild(span);
			} else {
				  cell.textContent = content;
		}


            cell.title = content.replace(/<[^>]*>?/gm, '');
            rowEl.appendChild(cell);
        });

        fragment.appendChild(rowEl);
    }

    els.gridCanvas.innerHTML = '';
    els.gridCanvas.appendChild(fragment);
}

/**
 * Initializes column resize operation
 */

function initResize(e, col) {
  isResizing = true;
  document.body.style.cursor = 'col-resize';
  const startX = e.clientX;
  const startWidth = col.width;

  function onMouseMove(e) {
    col.width = Math.max(60, startWidth + (e.clientX - startX));
    requestAnimationFrame(() => { renderHeaders(); updateGridMetrics(); renderVirtualRows(); });
  }
    function onMouseUp() {
    isResizing = false;
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    // Persist widths per mode
    const key = (state.mode === 'CDM') ? 'cdm' : 'pdm';
    const widths = {};
    state.columns.forEach(c => { widths[c.id] = c.width; });
    state.settings[key] = state.settings[key] || {};
    state.settings[key].columnWidths = widths;
    saveSettings();
  }
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

/**
 * Handles column reordering via drag and drop
 */

function handleDrop(e, targetIndex) {
  if (draggedColIndex === targetIndex || draggedColIndex === -1) return;
  const cols = [...state.columns];
  const item = cols.splice(draggedColIndex, 1)[0];
  cols.splice(targetIndex, 0, item);
  state.columns = cols;

  // Persist order per mode
  const key = (state.mode === 'CDM') ? 'cdm' : 'pdm';
  state.settings[key] = state.settings[key] || {};
  state.settings[key].columnOrder = state.columns.map(c => c.id);
  saveSettings();

  renderHeaders();
  renderVirtualRows();
  draggedColIndex = -1;
}

/**
 * Gets currently visible columns
 */
function getVisibleColumns() { return state.columns.filter(c => c.visible); }
/*
    Function to handle the right click on a row
*/
function handleRowClick(e, index, rowData) {
    // Multi-select behavior:
    // - Shift: select range from lastClickedIndex to index
    // - Ctrl/Cmd: toggle selection of index
    // - Click: single select

    state.activeRowData = rowData;

    if (!Array.isArray(state.selectedRowIndexes)) state.selectedRowIndexes = [];

    if (e.shiftKey && state.lastClickedIndex >= 0) {
        const a = Math.min(state.lastClickedIndex, index);
        const b = Math.max(state.lastClickedIndex, index);
        state.selectedRowIndexes = [];
        for (let i = a; i <= b; i++) state.selectedRowIndexes.push(i);
        state.selectedRowIndex = index;
        state.lastClickedIndex = index;
    } else if (e.ctrlKey || e.metaKey) {
        const pos = state.selectedRowIndexes.indexOf(index);
        if (pos === -1) state.selectedRowIndexes.push(index);
        else state.selectedRowIndexes.splice(pos, 1);
        state.selectedRowIndex = index;
        state.lastClickedIndex = index;
    } else {
        // single select
        state.selectedRowIndexes = [index];
        state.selectedRowIndex = index;
        state.lastClickedIndex = index;
    }

    renderVirtualRows();
    openSidebar(rowData);
}
