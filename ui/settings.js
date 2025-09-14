// Settings UI Component
class SettingsUI {
    constructor() {
        this.settings = null;
        this.isLoading = false;
    }

    init() {
        this.setupEventListeners();
        this.loadSettings();
    }

    setupEventListeners() {
        // Notification toggle
        const notificationToggle = document.getElementById('notifications-enabled');
        if (notificationToggle) {
            notificationToggle.addEventListener('change', (e) => {
                this.updateNotificationSetting(e.target.checked);
            });
        }

        // Floating hearts toggle
        const floatingHeartsToggle = document.getElementById('floating-hearts');
        if (floatingHeartsToggle) {
            floatingHeartsToggle.addEventListener('change', (e) => {
                this.updateFloatingHeartsSetting(e.target.checked);
            });
        }

        // High contrast toggle
        const highContrastToggle = document.getElementById('high-contrast');
        if (highContrastToggle) {
            highContrastToggle.addEventListener('change', (e) => {
                this.updateHighContrastSetting(e.target.checked);
            });
        }

        // Export data button
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.handleExportData();
            });
        }

        // Import data button
        const importBtn = document.getElementById('import-data');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.handleImportData();
            });
        }

        // Import file input
        const importFile = document.getElementById('import-file');
        if (importFile) {
            importFile.addEventListener('change', (e) => {
                this.handleImportFile(e.target.files[0]);
            });
        }
    }

    async loadSettings() {
        try {
            this.settings = await window.db.getSettings();
            this.renderSettings();
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.showError('Failed to load settings');
        }
    }

    renderSettings() {
        if (!this.settings) return;

        // Update notification toggle
        const notificationToggle = document.getElementById('notifications-enabled');
        if (notificationToggle) {
            notificationToggle.checked = this.settings.notificationEnabled;
        }

        // Update floating hearts toggle
        const floatingHeartsToggle = document.getElementById('floating-hearts');
        if (floatingHeartsToggle) {
            floatingHeartsToggle.checked = this.settings.floatingHearts;
        }

        // Update high contrast toggle
        const highContrastToggle = document.getElementById('high-contrast');
        if (highContrastToggle) {
            highContrastToggle.checked = this.settings.theme === 'high-contrast';
        }
    }

    async updateNotificationSetting(enabled) {
        try {
            this.settings.notificationEnabled = enabled;
            await window.db.updateSettings(this.settings);
            
            if (enabled) {
                // Request notification permission
                const granted = await window.notifications.requestPermission();
                if (granted) {
                    this.showSuccess('Notifications enabled!');
                } else {
                    this.showError('Notification permission denied');
                    // Revert toggle
                    const toggle = document.getElementById('notifications-enabled');
                    if (toggle) {
                        toggle.checked = false;
                    }
                    this.settings.notificationEnabled = false;
                    await window.db.updateSettings(this.settings);
                }
            } else {
                this.showSuccess('Notifications disabled');
            }
        } catch (error) {
            console.error('Failed to update notification setting:', error);
            this.showError('Failed to update notification setting');
        }
    }

    async updateFloatingHeartsSetting(enabled) {
        try {
            this.settings.floatingHearts = enabled;
            await window.db.updateSettings(this.settings);
            
            // Update localStorage for immediate effect
            localStorage.setItem('floatingHearts', enabled.toString());
            
            this.showSuccess(enabled ? 'Floating hearts enabled' : 'Floating hearts disabled');
        } catch (error) {
            console.error('Failed to update floating hearts setting:', error);
            this.showError('Failed to update floating hearts setting');
        }
    }

    async updateHighContrastSetting(enabled) {
        try {
            this.settings.theme = enabled ? 'high-contrast' : 'default';
            await window.db.updateSettings(this.settings);
            
            // Apply theme immediately
            if (enabled) {
                document.documentElement.setAttribute('data-theme', 'high-contrast');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
            
            this.showSuccess(enabled ? 'High contrast theme enabled' : 'High contrast theme disabled');
        } catch (error) {
            console.error('Failed to update theme setting:', error);
            this.showError('Failed to update theme setting');
        }
    }

    async handleExportData() {
        if (this.isLoading) return;

        this.isLoading = true;

        try {
            // Show export preview first
            await window.exportImport.showExportPreview();
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Export failed: ' + error.message);
        } finally {
            this.isLoading = false;
        }
    }

    handleImportData() {
        if (this.isLoading) return;

        // Show confirmation dialog
        const confirmed = confirm(
            'Importing data will replace all existing data. This cannot be undone. Are you sure you want to continue?'
        );

        if (confirmed) {
            window.exportImport.showImportDialog();
        }
    }

    async handleImportFile(file) {
        if (!file) return;

        if (this.isLoading) return;

        this.isLoading = true;

        try {
            await window.exportImport.importData(file);
        } catch (error) {
            console.error('Import failed:', error);
            this.showError('Import failed: ' + error.message);
        } finally {
            this.isLoading = false;
        }
    }

    showSuccess(message) {
        if (window.app) {
            window.app.showToast(message, 'success');
        }
    }

    showError(message) {
        if (window.app) {
            window.app.showToast(message, 'error');
        }
    }

    // Method to show app information
    showAppInfo() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>About Our Memories</h3>
                </div>
                <div class="modal-body">
                    <div class="app-info">
                        <div class="info-item">
                            <span class="label">Version:</span>
                            <span class="value">1.0.0</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Build:</span>
                            <span class="value">${new Date().toISOString().split('T')[0]}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Storage:</span>
                            <span class="value">Local (IndexedDB)</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Privacy:</span>
                            <span class="value">100% Local</span>
                        </div>
                    </div>
                    <div class="app-description">
                        <p>Our Memories is a private, local-first app for couples to chat, share images, and create beautiful memory books together.</p>
                        <p>All your data is stored locally on your device and never shared with anyone.</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="close-app-info">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('close-app-info').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Method to clear all data
    async clearAllData() {
        const confirmed = confirm(
            'This will permanently delete all your data including messages, images, and memories. This cannot be undone. Are you absolutely sure?'
        );

        if (!confirmed) return;

        const doubleConfirmed = confirm(
            'Last chance! This will delete everything. Type "DELETE" to confirm.'
        );

        if (doubleConfirmed) {
            try {
                await window.db.clearAllData();
                window.app.showToast('All data cleared', 'success');
                
                // Reload the app
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } catch (error) {
                console.error('Failed to clear data:', error);
                this.showError('Failed to clear data');
            }
        }
    }

    // Method to show storage usage
    async showStorageUsage() {
        try {
            const couple = window.app.getCurrentCouple();
            if (!couple) return;

            const [messages, images, memories] = await Promise.all([
                window.db.getMessages(couple.id),
                window.db.getAllImages(),
                window.db.getMemories(couple.id)
            ]);

            // Calculate storage usage
            let totalSize = 0;
            let imageSize = 0;

            images.forEach(image => {
                if (image.blob) {
                    imageSize += image.blob.size;
                }
            });

            totalSize = imageSize; // Messages and memories are just text

            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Storage Usage</h3>
                    </div>
                    <div class="modal-body">
                        <div class="storage-info">
                            <div class="storage-item">
                                <span class="label">Messages:</span>
                                <span class="value">${messages.length}</span>
                            </div>
                            <div class="storage-item">
                                <span class="label">Images:</span>
                                <span class="value">${images.length}</span>
                            </div>
                            <div class="storage-item">
                                <span class="label">Memories:</span>
                                <span class="value">${memories.length}</span>
                            </div>
                            <div class="storage-item">
                                <span class="label">Total Size:</span>
                                <span class="value">${this.formatFileSize(totalSize)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" id="close-storage-info">Close</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            document.getElementById('close-storage-info').addEventListener('click', () => {
                modal.remove();
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        } catch (error) {
            console.error('Failed to get storage usage:', error);
            this.showError('Failed to get storage usage');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Method to refresh settings (called when switching screens)
    refresh() {
        this.loadSettings();
    }
}

// Create global instance
window.settingsUI = new SettingsUI();
