// Export/Import Component
class ExportImportComponent {
    constructor() {
        this.exportInProgress = false;
        this.importInProgress = false;
    }

    // Export all data to ZIP file
    async exportData() {
        if (this.exportInProgress) {
            throw new Error('Export already in progress');
        }

        this.exportInProgress = true;

        try {
            // Show progress
            this.showProgress('Preparing export...', 0);

            // Get all data from database
            const data = await window.db.exportData();
            
            this.showProgress('Creating ZIP file...', 25);

            // Create ZIP file
            const zip = new JSZip();
            
            // Add metadata
            zip.file('data.json', JSON.stringify(data, null, 2));
            
            this.showProgress('Adding images...', 50);

            // Add images
            if (data.images && data.images.length > 0) {
                const imagesFolder = zip.folder('images');
                
                for (let i = 0; i < data.images.length; i++) {
                    const image = data.images[i];
                    const filename = `${image.id}.jpg`;
                    
                    // Convert blob to array buffer
                    const arrayBuffer = await image.blob.arrayBuffer();
                    imagesFolder.file(filename, arrayBuffer);
                    
                    // Update progress
                    const progress = 50 + (i / data.images.length) * 30;
                    this.showProgress(`Adding image ${i + 1} of ${data.images.length}...`, progress);
                }
            }

            this.showProgress('Finalizing export...', 90);

            // Generate ZIP file
            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 6
                }
            });

            this.showProgress('Export complete!', 100);

            // Download the file
            const filename = `our-memories-export-${new Date().toISOString().split('T')[0]}.zip`;
            this.downloadFile(zipBlob, filename);

            // Show success message
            setTimeout(() => {
                this.hideProgress();
                window.app.showToast('Export completed successfully!', 'success');
            }, 1000);

            return true;
        } catch (error) {
            console.error('Export failed:', error);
            this.hideProgress();
            window.app.showToast('Export failed: ' + error.message, 'error');
            throw error;
        } finally {
            this.exportInProgress = false;
        }
    }

    // Import data from ZIP file
    async importData(file) {
        if (this.importInProgress) {
            throw new Error('Import already in progress');
        }

        this.importInProgress = true;

        try {
            // Validate file
            if (!file || !file.name.endsWith('.zip')) {
                throw new Error('Please select a valid ZIP file');
            }

            this.showProgress('Reading ZIP file...', 0);

            // Read ZIP file
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(file);

            this.showProgress('Validating data...', 20);

            // Check if data.json exists
            if (!zipContent.files['data.json']) {
                throw new Error('Invalid export file - data.json not found');
            }

            // Parse metadata
            const dataJson = await zipContent.files['data.json'].async('text');
            const data = JSON.parse(dataJson);

            // Validate data structure
            if (!data.couple || !data.version) {
                throw new Error('Invalid export file format');
            }

            this.showProgress('Importing images...', 40);

            // Import images
            if (zipContent.files['images/']) {
                const imagesFolder = zipContent.files['images/'];
                const imageFiles = Object.keys(zipContent.files).filter(
                    filename => filename.startsWith('images/') && !filename.endsWith('/')
                );

                for (let i = 0; i < imageFiles.length; i++) {
                    const filename = imageFiles[i];
                    const imageFile = zipContent.files[filename];
                    
                    // Get image ID from filename
                    const imageId = filename.replace('images/', '').replace('.jpg', '');
                    
                    // Find corresponding image data
                    const imageData = data.images.find(img => img.id === imageId);
                    if (imageData) {
                        // Convert array buffer to blob
                        const arrayBuffer = await imageFile.async('arraybuffer');
                        const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
                        
                        // Update image data with imported blob
                        imageData.blob = blob;
                        
                        // Update progress
                        const progress = 40 + (i / imageFiles.length) * 30;
                        this.showProgress(`Importing image ${i + 1} of ${imageFiles.length}...`, progress);
                    }
                }
            }

            this.showProgress('Saving to database...', 80);

            // Import data to database
            await window.db.importData(data);

            this.showProgress('Import complete!', 100);

            // Show success message
            setTimeout(() => {
                this.hideProgress();
                window.app.showToast('Import completed successfully!', 'success');
                
                // Reload the app to reflect imported data
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }, 1000);

            return true;
        } catch (error) {
            console.error('Import failed:', error);
            this.hideProgress();
            window.app.showToast('Import failed: ' + error.message, 'error');
            throw error;
        } finally {
            this.importInProgress = false;
        }
    }

    // Show progress dialog
    showProgress(message, percentage) {
        let progressDialog = document.getElementById('progress-dialog');
        
        if (!progressDialog) {
            progressDialog = document.createElement('div');
            progressDialog.id = 'progress-dialog';
            progressDialog.className = 'modal';
            progressDialog.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Export/Import Progress</h3>
                    </div>
                    <div class="modal-body">
                        <div class="progress-message">${message}</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <div class="progress-percentage">0%</div>
                    </div>
                </div>
            `;
            document.body.appendChild(progressDialog);
        }

        // Update progress
        const progressMessage = progressDialog.querySelector('.progress-message');
        const progressFill = progressDialog.querySelector('.progress-fill');
        const progressPercentage = progressDialog.querySelector('.progress-percentage');

        progressMessage.textContent = message;
        progressFill.style.width = percentage + '%';
        progressPercentage.textContent = Math.round(percentage) + '%';
    }

    // Hide progress dialog
    hideProgress() {
        const progressDialog = document.getElementById('progress-dialog');
        if (progressDialog) {
            progressDialog.remove();
        }
    }

    // Download file
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Show import file picker
    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        input.style.display = 'none';
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await this.importData(file);
                } catch (error) {
                    console.error('Import error:', error);
                }
            }
        });
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    // Validate export file
    async validateExportFile(file) {
        try {
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(file);
            
            // Check required files
            const requiredFiles = ['data.json'];
            for (const filename of requiredFiles) {
                if (!zipContent.files[filename]) {
                    throw new Error(`Missing required file: ${filename}`);
                }
            }
            
            // Validate data.json
            const dataJson = await zipContent.files['data.json'].async('text');
            const data = JSON.parse(dataJson);
            
            if (!data.couple || !data.version) {
                throw new Error('Invalid data format');
            }
            
            return {
                valid: true,
                data: data,
                imageCount: Object.keys(zipContent.files).filter(
                    filename => filename.startsWith('images/') && !filename.endsWith('/')
                ).length
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Get export info
    async getExportInfo() {
        try {
            const data = await window.db.exportData();
            
            return {
                coupleName: data.couple ? `${data.couple.partnerAName} & ${data.couple.partnerBName}` : 'Unknown',
                messageCount: data.messages ? data.messages.length : 0,
                memoryCount: data.memories ? data.memories.length : 0,
                imageCount: data.images ? data.images.length : 0,
                deviceCount: data.devices ? data.devices.length : 0,
                exportDate: data.exportDate || new Date().toISOString(),
                version: data.version || '1.0'
            };
        } catch (error) {
            console.error('Failed to get export info:', error);
            return null;
        }
    }

    // Show export preview
    async showExportPreview() {
        const info = await this.getExportInfo();
        if (!info) {
            window.app.showToast('Failed to get export information', 'error');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Export Preview</h3>
                </div>
                <div class="modal-body">
                    <div class="export-info">
                        <div class="info-item">
                            <span class="label">Couple:</span>
                            <span class="value">${info.coupleName}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Messages:</span>
                            <span class="value">${info.messageCount}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Memories:</span>
                            <span class="value">${info.memoryCount}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Images:</span>
                            <span class="value">${info.imageCount}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Devices:</span>
                            <span class="value">${info.deviceCount}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Export Date:</span>
                            <span class="value">${new Date(info.exportDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div class="export-warning">
                        <p><strong>Note:</strong> This export contains all your private data. Keep it secure and don't share it with others.</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-export">Cancel</button>
                    <button class="btn btn-primary" id="confirm-export">Export Now</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle button clicks
        document.getElementById('confirm-export').addEventListener('click', async () => {
            modal.remove();
            try {
                await this.exportData();
            } catch (error) {
                console.error('Export error:', error);
            }
        });
        
        document.getElementById('cancel-export').addEventListener('click', () => {
            modal.remove();
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Check if export/import is in progress
    isExportInProgress() {
        return this.exportInProgress;
    }

    isImportInProgress() {
        return this.importInProgress;
    }
}

// Create global instance
window.exportImport = new ExportImportComponent();
