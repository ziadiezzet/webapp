// ==================================================================
// MODULE: LOAD TIME MONITOR
// ==================================================================

class LoadTimer {
    constructor() {
        this.startTime = Date.now();
        this.maxLoadTime = 10; // 1 second threshold (fixed from 1ms)
        this.timeoutId = null;
        this.isLoading = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        // Start monitoring
        this.timeoutId = setTimeout(() => {
            if (this.isLoading) {
                this.showLoadingWarning();
            }
        }, this.maxLoadTime);
        // Listen for load events
        this.setupEventListeners();
        this.initialized = true;
    }

    setupEventListeners() {
        // When DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded in:', Date.now() - this.startTime, 'ms');
        });

        // When window is fully loaded
        window.addEventListener('load', () => {
            this.markAsLoaded();
        });

        // When your app is initialized
        document.addEventListener('appInitialized', () => {
            this.markAsLoaded();
        });

        // Fallback: check every second if loading seems stuck
        this.checkInterval = setInterval(() => {
            if (this.isLoading && Date.now() - this.startTime > 10000) { // 10 seconds
                this.showCriticalWarning();
                clearInterval(this.checkInterval);
            }
        }, 1000);
    }

    markAsLoaded() {
        if (!this.isLoading) return;
        
        this.isLoading = false;
        const loadTime = Date.now() - this.startTime;
        
        console.log(`Page loaded in ${loadTime}ms`);
        
        // Clear the timeout if page loaded before warning
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        
        // Clear the check interval
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        // Remove any existing warning
        this.removeWarning();
        
        // Show quick notification if load was slow but not critical
        if (loadTime > 1000 && loadTime < this.maxLoadTime) {
            this.showPerformanceHint(loadTime);
        }
    }

    showLoadingWarning() {
        console.warn(`Page loading taking too long (${Date.now() - this.startTime}ms)`);
        
        const warning = document.createElement('div');
        warning.id = 'load-time-warning';
        warning.className = 'load-warning';
        warning.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: white; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10000; max-width: 400px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="font-size: 14px; font-weight: 600; color: #d97706; margin-bottom: 8px;">
                    📊 Large Dataset Detected 
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
                    <button onclick="window.loadTimer.continueWaiting()"
                            style="padding: 10px 15px; background: white; color: #374151; border: 2px solid #f59e0b; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; min-width: 120px;">
                        Continue Online
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        // Add fade-in animation
        setTimeout(() => {
            warning.style.opacity = '1';
            warning.style.transform = 'translateY(0)';
        }, 100);
    }

    showCriticalWarning() {
        console.error(`Critical loading timeout (${Date.now() - this.startTime}ms)`);
        
        const warning = document.getElementById('load-time-warning');
        if (warning) {
            warning.innerHTML = `
                <div style="position: fixed; top: 20px; right: 20px; background: white; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); z-index: 10000; max-width: 400px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <div style="font-size: 16px; font-weight: 600; color: #ef4444; margin-bottom: 8px;">
                        ⚠️ Loading Seems Stuck
                    </div>
                    <div style="font-size: 13px; color: #374151; line-height: 1.5; margin-bottom: 12px;">
                        The page has been loading for over 10 seconds. You might want to:
                        <ul style="margin: 8px 0; padding-left: 20px;">
                            <li>Check your internet connection</li>
                            <li>Refresh the page</li>
                            <li>Clear browser cache</li>
                            <li>Try a different browser</li>
                        </ul>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                        <button onclick="location.reload()"
                                style="flex: 1; padding: 10px 15px; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
                            Refresh Page
                        </button>
                        <button onclick="window.loadTimer.reportIssue()"
                                style="flex: 1; padding: 10px 15px; background: white; color: #374151; border: 2px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
                            Report Issue
                        </button>
                    </div>
                </div>
            `;
        }
    }

    showPerformanceHint(loadTime) {
        console.log(`Performance hint shown for ${loadTime}ms load time`);
        
        // You can optionally add a subtle notification here
    }

    continueWaiting() {
        const warning = document.getElementById('load-time-warning');
        if (warning) {
            warning.style.opacity = '0';
            warning.style.transform = 'translateY(-20px)';
            setTimeout(() => warning.remove(), 300);
        }
        
        // Reset timeout for another 5 seconds
        this.timeoutId = setTimeout(() => {
            if (this.isLoading) {
                this.showLoadingWarning();
            }
        }, 5000);
    }

    reportIssue() {
        const pageInfo = {
            url: window.location.href,
            loadTime: Date.now() - this.startTime,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
        
        console.log('Reporting issue:', pageInfo);
        
        // Show confirmation (using existing toast system if available)
        if (typeof showToast === 'function') {
            showToast('Issue reported. Thank you for your feedback!', 'info');
        } else {
            alert('Issue reported. Thank you!');
        }
        
        // Close the warning
        this.removeWarning();
    }

    removeWarning() {
        const warning = document.getElementById('load-time-warning');
        if (warning) {
            warning.style.opacity = '0';
            warning.style.transform = 'translateY(-20px)';
            setTimeout(() => warning.remove(), 300);
        }
    }

    getElapsedTime() {
        return Date.now() - this.startTime;
    }

    destroy() {
        if (this.timeoutId) clearTimeout(this.timeoutId);
        if (this.checkInterval) clearInterval(this.checkInterval);
        this.removeWarning();
        this.initialized = false;
        console.log('Load timer destroyed');
    }
}

// Create global instance
window.loadTimer = new LoadTimer();

// Start timer immediately when script loads
window.loadTimer.init();

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadTimer;
}