// ==================================================================
// MODULE: LOADING SPINNER WITH TIMEOUT MESSAGE
// ==================================================================

let loadingTimer = null;
let loadingTimeout = null;
let loadingStartTime = null;
let loadingInterval = null;

/**
 * Shows the loading spinner with timeout message
 * @param {string} message - Custom loading message
 * @param {number} timeoutMs - Time in ms before showing slow loading message (default: 5000ms)
 */
function showLoading(message = 'Loading Data Model Explorer...', timeoutMs = 1000) {
    const spinner = document.getElementById('loadingOverlay');
    if (!spinner) return;
    
    // Reset any existing timers
    hideLoading();
    
    // Set loading message
    const messageEl = document.getElementById('loadingMessage');
    if (messageEl) messageEl.textContent = message;
    
    // Show spinner
    spinner.style.display = 'flex';
    
    // Hide progress bar by default
    const progressBar = document.getElementById('loadingProgressBar');
    if (progressBar) progressBar.style.display = 'none';
    
    // Reset slow loading message
    const slowMsg = document.getElementById('slowLoadingMessage');
    const extendedHelp = document.getElementById('extendedHelp');
    if (slowMsg) slowMsg.style.display = 'none';
    if (extendedHelp) extendedHelp.style.display = 'none';
    
    // Reset timer display
    const timerEl = document.getElementById('loadingTimer');
    const timerDisplay = document.getElementById('loadingTimerDisplay');
    if (timerEl) timerEl.textContent = '0s';
    if (timerDisplay) timerDisplay.textContent = '0s elapsed';
    
    // Hide retry section
    const retrySection = document.getElementById('retrySection');
    if (retrySection) retrySection.style.display = 'none';
    
    // Record start time
    loadingStartTime = Date.now();
    // Start updating timer every second
    loadingInterval = setInterval(() => {
        if (loadingStartTime) {
            const elapsed = Math.floor((Date.now() - loadingStartTime) / 1000);
            if (timerEl) timerEl.textContent = `${elapsed}s`;
            if (timerDisplay) timerDisplay.textContent = `${elapsed}s elapsed`;
        }
    }, 1000);
    
    // Animate dots
    animateLoadingDots();
    
    // Set timeout to show slow loading message
    loadingTimeout = setTimeout(() => {
        if (slowMsg) slowMsg.style.display = 'block';
        
        // Show extended help after another 5 seconds
        setTimeout(() => {
            if (extendedHelp) extendedHelp.style.display = 'block';
        }, 5000);
    }, timeoutMs);
}

/**
 * Shows loading with progress percentage
 * @param {string} message - Loading message
 * @param {number} progress - Progress percentage (0-100)
 */
function showLoadingWithProgress(message, progress) {
    const spinner = document.getElementById('loadingOverlay');
    if (!spinner) return;
    
    // Update message
    updateLoadingMessage(message);
    
    // Show progress bar
    const progressBar = document.getElementById('loadingProgressBar');
    if (progressBar) progressBar.style.display = 'block';
    
    // Update progress
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    if (progressFill) {
        progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
    if (progressText) {
        progressText.textContent = `${Math.round(progress)}%`;
    }
}

/**
 * Updates the loading message dynamically
 * @param {string} message - New loading message
 */
function updateLoadingMessage(message) {
    const messageEl = document.getElementById('loadingMessage');
    if (messageEl) messageEl.textContent = message;
}

/**
 * Updates the loading progress text
 * @param {string} text - Progress description text
 */
function updateLoadingProgress(text) {
    const progressEl = document.getElementById('loadingProgress');
    if (progressEl) progressEl.textContent = text;
}

/**
 * Animates the loading dots
 */
function animateLoadingDots() {
    const dotsEl = document.getElementById('loadingDots');
    if (!dotsEl) return;
    
    let dots = 0;
    const maxDots = 3;
    
    loadingTimer = setInterval(() => {
        dots = (dots + 1) % (maxDots + 1);
        if (dotsEl) {
            dotsEl.textContent = '.'.repeat(dots) + ' '.repeat(maxDots - dots);
        }
    }, 500);
}

/**
 * Hides the loading spinner and clears all timers
 */
function hideLoading() {
    const spinner = document.getElementById('loadingOverlay');
    if (spinner) spinner.style.display = 'none';
    
    // Clear all timers and intervals
    if (loadingTimer) {
        clearInterval(loadingTimer);
        loadingTimer = null;
    }
    
    if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
    }
    
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
    
    loadingStartTime = null;
}

/**
 * Shows loading error with download suggestion
 * @param {string} errorMessage - Error message to display
 * @param {string} downloadLink - Optional custom download link
 */
function showLoadingError(errorMessage, downloadLink = null) {
    const spinner = document.getElementById('loadingOverlay');
    if (!spinner) return;
    
    // Update message
    const messageEl = document.getElementById('loadingMessage');
    if (messageEl) {
        messageEl.innerHTML = `<span style="color: #dc2626;">⚠️ ${errorMessage}</span>`;
    }
    
    // Hide progress bar
    const progressBar = document.getElementById('loadingProgressBar');
    if (progressBar) progressBar.style.display = 'none';
    
    // Show download suggestion prominently
    const slowMsg = document.getElementById('slowLoadingMessage');
    if (slowMsg) {
        const downloadUrl = downloadLink || 'http://cxtsbg2/MCD/report/AIO/MCD_AIO.zip';
        slowMsg.innerHTML = `
            <div style="font-size: 14px; font-weight: 600; color: #dc2626; margin-bottom: 8px;">
                ⚠️ Loading Failed
            </div>
            <div style="font-size: 13px; color: #374151; line-height: 1.5; margin-bottom: 12px;">
                ${errorMessage}
            </div>
            <div style="padding: 10px; background: #fee2e2; border-radius: 6px; border-left: 4px solid #dc2626;">
                <div style="font-size: 13px; font-weight: 600; color: #7c2d12; margin-bottom: 5px;">
                    Try the offline version:
                </div>
                <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                    <a href="${downloadUrl}" 
                       target="_blank"
                       style="flex: 1; min-width: 150px; padding: 8px 12px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; text-align: center;">
                        <i class="fa-solid fa-download" style="margin-right: 5px;"></i>
                        Download Local Version
                    </a>
                    <button onclick="retryLoading()"
                            style="padding: 8px 12px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; cursor: pointer; min-width: 80px;">
                        Retry
                    </button>
                </div>
            </div>
        `;
        slowMsg.style.display = 'block';
    }
    
    // Show retry section
    const retrySection = document.getElementById('retrySection');
    if (retrySection) retrySection.style.display = 'block';
}

/**
 * Retry loading function
 */
function retryLoading() {
    hideLoading();
    // Show loading again
    showLoading('Retrying...', 3000);
    
    // Simulate retry (you should replace this with your actual retry logic)
    setTimeout(() => {
        // If you have an initialization function, call it here
        // Example: initializeApplication();
        hideLoading();
    }, 2000);
}

/**
 * Detects if dataset is large and suggests offline version
 */
function checkDatasetSize(data) {
    if (!data) return false;
    
    const isLargeDataset = Array.isArray(data) && data.length > 1000;
    
    if (isLargeDataset) {
        
        // Modify the slow loading message to be more prominent
        const slowMsg = document.getElementById('slowLoadingMessage');
        if (slowMsg) {
            slowMsg.innerHTML = `
                <div style="font-size: 14px; font-weight: 600; color: #d97706; margin-bottom: 8px;">
                    📊 Large Dataset Detected (${data.length} items)
                </div>
                <div style="font-size: 13px; color: #374151; line-height: 1.5; margin-bottom: 12px;">
                    For optimal performance with datasets this size, we recommend using the offline version.
                </div>
                <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                    <a href="http://cxtsbg2/MCD/report/AIO/MCD_AIO.zip" 
                       target="_blank"
                       style="flex: 1; min-width: 150px; padding: 10px 15px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; text-align: center;">
                        <i class="fa-solid fa-rocket" style="margin-right: 8px;"></i>
                        Get Offline Version
                    </a>
                    <button onclick="continueLoading()"
                            style="padding: 10px 15px; background: white; color: #374151; border: 2px solid #f59e0b; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; min-width: 120px;">
                        Continue Online
                    </button>
                </div>
            `;
            slowMsg.style.display = 'block';
            return true;
        }
    }
    
    return false;
}

function continueLoading() {
    const slowMsg = document.getElementById('slowLoadingMessage');
    if (slowMsg) slowMsg.style.display = 'none';
}

// ==================================================================
// WRAP EXISTING HEAVY OPERATIONS
// ==================================================================

// Wrap the populateLeftPanel function if it exists
if (typeof populateLeftPanel === 'function') {
    const originalPopulateLeftPanel = populateLeftPanel;
    window.populateLeftPanel = function(...args) {
        showLoading('Building navigation panel...', 3000);
        try {
            const result = originalPopulateLeftPanel.apply(this, args);
            hideLoading();
            return result;
        } catch (error) {
            showLoadingError(`Failed to build navigation: ${error.message}`);
            throw error;
        }
    };
}

// Wrap file loading operations if they exist
if (typeof loadFileWithProgress === 'function') {
    const originalLoadFileWithProgress = loadFileWithProgress;
    window.loadFileWithProgress = function(file) {
        showLoading(`Loading ${file.name}...`, 2000);
        
        // Show progress as we load
        updateLoadingProgress('Reading file...');
        
        try {
            const result = originalLoadFileWithProgress.apply(this, arguments);
            hideLoading();
            return result;
        } catch (error) {
            showLoadingError(`Failed to load file: ${file.name}`);
            throw error;
        }
    };
}

// ==================================================================
// AUTOMATIC DETECTION OF SLOW INITIAL LOAD
// ==================================================================

// Show loading when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a slow connection
    const isSlowConnection = navigator.connection 
        ? (navigator.connection.downlink < 1 || navigator.connection.saveData)
        : false;
    
    // Show loading with shorter timeout for slow connections
    const timeout = isSlowConnection ? 2000 : 5000;
    showLoading('Initializing Data Model Explorer...', timeout);
    
    // If still loading after 10 seconds, show the slow message
    setTimeout(() => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay && overlay.style.display !== 'none') {
            const slowMsg = document.getElementById('slowLoadingMessage');
            if (slowMsg) slowMsg.style.display = 'block';
        }
    }, 10000);
});

// Make functions globally available
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showLoadingWithProgress = showLoadingWithProgress;
window.updateLoadingMessage = updateLoadingMessage;
window.updateLoadingProgress = updateLoadingProgress;
window.showLoadingError = showLoadingError;
window.retryLoading = retryLoading;
window.checkDatasetSize = checkDatasetSize;