/*************************
  Stereotype color class *
**************************/

function getStereotypeColorClass(stereotype) {
  if (!stereotype) return 'stereotype-technical';
  const stereo = String(stereotype).toLowerCase();
  if (stereo.includes('contract')) return 'stereotype-contract';
  else if (stereo.includes('business') || stereo.includes('mail') || stereo.includes('info') || stereo.includes('event')) return 'stereotype-business';
  else if (stereo.includes('accounting')) return 'stereotype-accounting';
  else if (stereo.includes('individual')) return 'stereotype-individual';
  else if (stereo.includes('telephony')) return 'stereotype-telephony';
  else if (stereo.includes('staff')) return 'stereotype-staff';
  else if (stereo.includes('config')) return 'stereotype-config';
  else if (stereo.includes('limit')) return 'stereotype-limit';
  else if (stereo.includes('lov')) return 'stereotype-lov';
  else return 'stereotype-technical';
}

/******************************************
  Range display helper (used by Settings) *
*******************************************/

function rangeChange(tmp){
  if (tmp === 'sidebar') {
    let sb = document.getElementById('setting-sidebarWidth');
    let ib = document.getElementById('sidebarWidthDisplay');
    if (sb && ib) ib.innerHTML = sb.value+"px";
  }
  if (tmp === 'rowHeight') {
    let sb = document.getElementById('setting-rowHeight');
    let ib = document.getElementById('rowHeightDisplay');
    if (sb && ib) ib.innerHTML = sb.value+"px";
  }
  if (tmp === 'headerHeight') {
    let sb = document.getElementById('setting-headerHeight');
    let ib = document.getElementById('headerHeightDisplay');
    if (sb && ib) ib.innerHTML = sb.value+"px";
  }
  if (tmp === 'rowHeightAppearance') {
    let sb = document.getElementById('setting-rowHeightAppearance');
    let ib = document.getElementById('rowHeightAppearanceDisplay');
    if (sb && ib) ib.innerHTML = sb.value+"px";
  }
  if (tmp === 'borderRadius') {
    let sb = document.getElementById('setting-borderRadius');
    let ib = document.getElementById('borderRadiusDisplay');
    if (sb && ib) ib.innerHTML = sb.value+"px";
  }
  if (tmp === 'gridLineWidth') {
    let sb = document.getElementById('setting-gridLineWidth');
    let ib = document.getElementById('gridLineWidthDisplay');
    if (sb && ib) ib.innerHTML = sb.value+"px";
  }
  if (tmp === 'fontSizeScale') {
    let sb = document.getElementById('setting-fontSizeScale');
    let ib = document.getElementById('fontSizeScaleDisplay');
    if (sb && ib) ib.innerHTML = sb.value+"%";
  }
  if (tmp === 'toastDuration') {
        let sb = document.getElementById('setting-toastDuration');
        let ib = document.getElementById('toastDurationDisplay');
        if (sb && ib) ib.innerHTML = sb.value + "ms";
    }
  if (tmp === 'doubleClickSpeed') {
      let sb = document.getElementById('setting-doubleClickSpeed');
      let ib = document.getElementById('doubleClickSpeedDisplay');
      if (sb && ib) ib.innerHTML = sb.value + "ms";
  }
  if (tmp === 'tooltipDelay') {
      let sb = document.getElementById('setting-tooltipDelay');
      let ib = document.getElementById('tooltipDelayDisplay');
      if (sb && ib) ib.innerHTML = sb.value + "ms";
  }
  if (tmp === 'confirmTimeout') {
      let sb = document.getElementById('setting-confirmTimeout');
      let ib = document.getElementById('confirmTimeoutDisplay');
      if (sb && ib) ib.innerHTML = sb.value + "s (0=disabled)";
  }
  if (tmp === 'autoSaveInterval') {
      let sb = document.getElementById('setting-autoSaveInterval');
      let ib = document.getElementById('autoSaveIntervalDisplay');
      if (sb && ib) ib.innerHTML = sb.value + "min";
  }
  if (tmp === 'fontSizeMultiplier') {
      let sb = document.getElementById('setting-fontSizeMultiplier');
      let ib = document.getElementById('fontSizeMultiplierDisplay');
      if (sb && ib) ib.innerHTML = sb.value + "%";
  }
  if (tmp === 'lineHeight') {
      let sb = document.getElementById('setting-lineHeight');
      let ib = document.getElementById('lineHeightDisplay');
      if (sb && ib) ib.innerHTML = sb.value;
  }
  if (tmp === 'letterSpacing') {
      let sb = document.getElementById('setting-letterSpacing');
      let ib = document.getElementById('letterSpacingDisplay');
      if (sb && ib) ib.innerHTML = sb.value + "em";
  }
}

/******************************************
  Color display Helper (used by Settings) *
*******************************************/

function colorChange(tmp){
   if (tmp === 'primaryAC') {
    let sb = document.getElementById('setting-accentColor');
    let ib = document.getElementById('setting-accentColorText');
    if (sb && ib) ib.value = sb.value; 
   }
  if (tmp === 'CCDM') {
    let sb = document.getElementById('setting-accentColorCDM');
    let ib = document.getElementById('setting-accentColorCDMText');
    if (sb && ib) ib.value = sb.value; 
  }
  if (tmp === 'CPDM') {
    let sb = document.getElementById('setting-accentColorPDM');
    let ib = document.getElementById('setting-accentColorPDMText');
    if (sb && ib) ib.value = sb.value; 
  }
  if (tmp === 'bgPrimary') {
    let sb = document.getElementById('setting-bgPrimary');
    let ib = document.getElementById('setting-bgPrimaryText');
    if (sb && ib) ib.value = sb.value; 
  }
  if (tmp === 'bgSecondary') {
    let sb = document.getElementById('setting-bgSecondary');
    let ib = document.getElementById('setting-bgSecondaryText');
    if (sb && ib) ib.value = sb.value; 
  }
  if (tmp === 'txtPrimary') {
    let sb = document.getElementById('setting-textPrimary');
    let ib = document.getElementById('setting-textPrimaryText');
    if (sb && ib) ib.value = sb.value; 
  }
  if (tmp === 'borderColor') {
    let sb = document.getElementById('setting-borderColor');
    let ib = document.getElementById('setting-borderColorText');
    if (sb && ib) ib.value = sb.value; 
  }
  if (tmp === 'RHColor') {
    let sb = document.getElementById('setting-rowHoverColor');
    let ib = document.getElementById('setting-rowHoverColorText');
    if (sb && ib) ib.value = sb.value; 
  }
  if (tmp === 'SRColor') {
    let sb = document.getElementById('setting-selectedRowColor');
    let ib = document.getElementById('setting-selectedRowColorText');
    if (sb && ib) ib.value = sb.value; 
  }
  if (tmp === 'relColor') {
    let sb = document.getElementById('dg-relColor');
    let ib = document.getElementById('dg-relColor-display');
    if (sb && ib) ib.innerHTML = sb.value; 
  }
  if (tmp === 'inhColor') {
    let sb = document.getElementById('dg-inhColor');
    let ib = document.getElementById('dg-inhColor-display');
    if (sb && ib) ib.innerHTML = sb.value; 
  }
  if (tmp === 'txtttcolor') {
    let sb = document.getElementById('setting-txtttcolor');
    let ib = document.getElementById('setting-txtttcolortxt');
    if (sb && ib) ib.value = sb.value; 
  }
  if (tmp === 'bgttcolor') {
    let sb = document.getElementById('setting-bgttcolor');
    let ib = document.getElementById('setting-bgttcolortxt');
    if (sb && ib) ib.value = sb.value; 
  }
}

/*****************************
  Helper for encoding string *
******************************/

function encodeString(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  let binary = '';
  for (let i = 0; i < str.length; i++) binary += str.charCodeAt(i).toString(2).padStart(8, '0');
  const padding = 6 - (binary.length % 6);
  if (padding < 6) binary += '0'.repeat(padding);
  for (let i = 0; i < binary.length; i += 6) {
    const chunk = binary.substr(i, 6);
    const index = parseInt(chunk, 2);
    result += chars.charAt(index);
  }
  return result;
}

/*****************************
  Helper for encoding string *
******************************/

function decodeString(encodedStr) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let binary = '';
  for (let i = 0; i < encodedStr.length; i++) {
    const index = chars.indexOf(encodedStr.charAt(i));
    if (index === -1) continue;
    binary += index.toString(2).padStart(6, '0');
  }
  const padding = binary.length % 8;
  if (padding > 0) binary = binary.slice(0, -padding);
  let result = '';
  for (let i = 0; i < binary.length; i += 8) {
    const chunk = binary.substr(i, 8);
    if (chunk.length < 8) break;
    const charCode = parseInt(chunk, 2);
    result += String.fromCharCode(charCode);
  }
  return result;
}

// tooltips helper


/** Sidebar Resizer */
function setupSidebarResizer() {
  const resizer = document.getElementById('sidebarResizer');
  const sidebar = document.getElementById('sidebar');
  let isResizing = false;
  resizer.addEventListener('mousedown', (e) => {
    isResizing = true; document.body.style.cursor = 'ew-resize'; e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const newWidth = Math.max(300, Math.min(window.innerWidth - e.clientX, 800));
    sidebar.style.width = `${newWidth}px`;
    document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
    state.settings.general.sidebarWidth = newWidth;
  });
  document.addEventListener('mouseup', () => {
    if (isResizing) { isResizing = false; document.body.style.cursor = ''; saveSettings(); }
  });
}

function showToast(message, type = 'info', duration) {
  try {
    const behavior = state.settings.behavior || {};

    // Respect per-type visibility (remove this check if you want all toasts to show)
        if (type === 'success' && behavior.showSuccessToasts === false) return;
        if (type === 'info' && behavior.showInfoToasts === false) return;
        if (type === 'warning' && behavior.showWarningToasts === false) return;
        if (type === 'error' && behavior.showErrorToasts === false) return;
        
        // Determine duration
        if (duration === undefined || duration === null) {
            duration = Number(behavior.toastDuration || 3500);
        }
        
        // Get CSS variables for colors
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        const toastColors = {
            success: state.settings.behavior.toastSuccessColor.trim() || '#10b981',
            error: state.settings.behavior.toastErrorColor.trim() || '#ef4444',
            warning: state.settings.behavior.toastWarningColor.trim() || '#f59e0b',
            info: state.settings.behavior.toastInfoColor.trim() || '#3b82f6'
        };

    // Ensure toast container exists and apply position from settings
    let container = document.getElementById('toastContainer');
    const position = String(behavior.toastPosition || 'top-right');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = `toast-${position}`;
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('role', 'status');
      document.body.appendChild(container);
    } else {
      // normalize container position class
      container.className = `toast-${position}`;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type || 'info'}`;

    // Animation class
    const animation = String(behavior.toastAnimation || 'fade');
    if (animation && animation !== 'none') toast.classList.add(`toast-${animation}`);

  
    toast.style.backgroundColor = toastColors[type] || toastColors.info;
    toast.style.color = behavior.toastTextColor || '#ffffff';
    if (behavior.toastBorderColor) toast.style.border = `1px solid ${behavior.toastBorderColor}`;
    if (behavior.toastShadow) toast.style.boxShadow = behavior.toastShadow;

    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
      <div class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ'}</div>
      <div class="toast-content">${escapeHtml(message)}</div>
      <button class="toast-close" aria-label="Close toast">×</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');

    // Append or prepend based on position (top = newest on top)
    const isTop = position.startsWith('top');
    if (isTop && container.firstChild) container.insertBefore(toast, container.firstChild);
    else container.appendChild(toast);

    // Close handler and cleanup
    let removed = false;
    const removeToast = (fast = false) => {
      if (removed) return;
      removed = true;
      if (fast) {
        toast.remove();
      } else {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 250);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };

    closeBtn.addEventListener('click', () => removeToast(true));

    // Play sound if enabled
    if (behavior.toastSoundEnabled) {
      try { playNotificationSound(type); } catch (err) { console.warn('playNotificationSound failed', err); }
    }

    // Auto-remove after duration
    const timeoutId = setTimeout(() => removeToast(false), duration);

  } catch (e) {
    console.error('Toast failed', e);
  }
}

// Helper function for notification sounds (with better error handling)
function playNotificationSound(type) {
    try {
        // Check if AudioContext is supported
        if (!window.AudioContext && !window.webkitAudioContext) {
            return;
        }
        
        // Create audio context only when needed
        if (!window.audioContext) {
            try {
                window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('AudioContext creation failed:', e);
                return;
            }
        }
        
        const context = window.audioContext;
        
        // Resume context if suspended (required by browsers)
        if (context.state === 'suspended') {
            context.resume().catch(e => {
                return;
            });
        }
        
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        // Different frequencies for different types
        if (type === 'error') {
            oscillator.frequency.setValueAtTime(440, context.currentTime); // A4
        } else if (type === 'warning') {
            oscillator.frequency.setValueAtTime(330, context.currentTime); // E4
        } else {
            oscillator.frequency.setValueAtTime(523.25, context.currentTime); // C5
        }
        
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.5);
        
    } catch (e) {
        console.log('Could not play notification sound:', e);
    }
}

// -------- Basic HTML escaper (used across modules) --------
function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

/**
 * Truncate a string safely and add ellipsis if it exceeds max length
 */
function truncateText(s, maxLen = 100) {
  if (s === undefined || s === null) return '';
  const str = String(s);
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

function getDateMinusSevenDays() {
  const today = new Date();
  today.setDate(today.getDate() - 7);
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `^${month}.*/${year}`;
}

function updateSearchTitle(newTitl) {
  let searchTitle = document.getElementById('globalSearch').title
  document.getElementById('globalSearch').title = searchTitle + "\n[created] " + getDateMinusSevenDays()+"$ : created during this month\n[modified] " + getDateMinusSevenDays()+"$ : modified during this month";
}

/**
 * Robustly checks if a value represents "True".
 * Handles: boolean true, string "true"/"True", "x"/"X", "1", "yes".
 */
function isTrueLike(v) {
    if (v === undefined || v === null) return false;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    const s = String(v).trim().toLowerCase();
    return s === 'true' || s === 'x' || s === 'yes' || s === '1';
}

// ----- Fullscreen helpers -----
function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
}

function requestFullscreen(el) {
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  if (el.mozRequestFullScreen) return el.mozRequestFullScreen();
  if (el.msRequestFullscreen) return el.msRequestFullscreen();
}

function exitFullscreen() {
  if (document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
  if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
  if (document.msExitFullscreen) return document.msExitFullscreen();
}