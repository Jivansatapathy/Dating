// Login UI Component
class LoginUI {
    constructor() {
        this.form = null;
        this.isSubmitting = false;
    }

    init() {
        this.form = document.getElementById('login-form');
        if (!this.form) {
            console.error('Login form not found');
            return;
        }

        this.setupEventListeners();
        this.focusInput();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Input validation
        const nameInput = document.getElementById('login-name');
        if (nameInput) {
            nameInput.addEventListener('input', () => {
                this.clearError();
            });

            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSubmit();
                }
            });
        }

        // Pairing code button
        const pairingBtn = document.getElementById('pairing-code-btn');
        if (pairingBtn) {
            pairingBtn.addEventListener('click', () => {
                this.showPairingModal();
            });
        }

        // Load quick devices
        this.loadQuickDevices();
    }

    focusInput() {
        const nameInput = document.getElementById('login-name');
        if (nameInput) {
            // Focus after a short delay to ensure the screen is visible
            setTimeout(() => {
                nameInput.focus();
            }, 100);
        }
    }

    async handleSubmit() {
        if (this.isSubmitting) {
            return;
        }

        this.isSubmitting = true;

        try {
            // Get input value
            const nameInput = document.getElementById('login-name');
            const name = nameInput.value.trim();

            // Validate input
            if (!name) {
                this.showError('Please enter your name');
                return;
            }

            // Show loading state
            this.showLoadingState();

            // Attempt login
            const loginResult = await this.attemptLogin(name);

            if (loginResult) {
                // Login successful
                this.handleLoginSuccess(loginResult);
            } else {
                // Login failed
                this.handleLoginFailure();
            }

        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');
        } finally {
            this.isSubmitting = false;
            this.hideLoadingState();
        }
    }

    async attemptLogin(name) {
        try {
            const result = await window.db.loginByName(name);
            return result;
        } catch (error) {
            console.error('Database login error:', error);
            return null;
        }
    }

    handleLoginSuccess(loginResult) {
        const { user, couple } = loginResult;

        // Set current user and couple
        window.app.setCurrentUser(user);
        window.app.setCurrentCouple(couple);

        // Show success message
        window.app.showToast(`Welcome back, ${user}!`, 'success');

        // Hide login screen
        document.getElementById('login-screen').classList.add('hidden');

        // Show main app
        window.app.showMainApp();
    }

    handleLoginFailure() {
        this.showError('Name not recognized — please enter the exact name your partner set during onboarding.');
    }

    showError(message) {
        const errorElement = document.getElementById('login-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }

        // Also show as toast
        if (window.app) {
            window.app.showToast(message, 'error');
        }
    }

    clearError() {
        const errorElement = document.getElementById('login-error');
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }

    showLoadingState() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span> Signing in...';
        }
    }

    hideLoadingState() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Enter Our Memories';
        }
    }

    // Method to handle QR code login (for future implementation)
    async handleQRCodeLogin(qrData) {
        try {
            const data = window.QRCodeComponent.parsePairingData(qrData);
            
            if (data.coupleId && data.pairingToken) {
                // Validate pairing token and get couple data
                const couple = await window.db.getCouple(data.coupleId);
                
                if (couple) {
                    // Hash the provided token and compare
                    const providedTokenHash = await window.db.hashString(data.pairingToken);
                    
                    if (providedTokenHash === couple.pairingTokenHash) {
                        // Valid pairing token
                        this.handleLoginSuccess({
                            user: couple.partnerAName, // Default to first partner
                            couple: couple
                        });
                        return true;
                    }
                }
            }
            
            this.showError('Invalid QR code');
            return false;
        } catch (error) {
            this.showError('Invalid QR code: ' + error.message);
            return false;
        }
    }

    // Method to handle numeric code login (for future implementation)
    async handleNumericCodeLogin(code) {
        if (!window.QRCodeComponent.validateNumericCode(code)) {
            this.showError('Invalid pairing code');
            return false;
        }

        // This would typically involve validating the code with the original device
        // For now, we'll just show an error
        this.showError('Numeric code pairing not yet implemented');
        return false;
    }

    // Method to show pairing instructions
    showPairingInstructions() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Pair Your Device</h3>
                </div>
                <div class="modal-body">
                    <p>To pair your device with your partner's device:</p>
                    <ol>
                        <li>Ask your partner to open the app on their device</li>
                        <li>Have them go to Settings > Pair Device</li>
                        <li>Scan the QR code they show you</li>
                        <li>Or enter the 6-digit code they provide</li>
                    </ol>
                    <p><strong>Note:</strong> You must be physically near your partner to pair devices securely.</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="close-pairing-instructions">Got it</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('close-pairing-instructions').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Method to reset login form
    resetForm() {
        const nameInput = document.getElementById('login-name');
        if (nameInput) {
            nameInput.value = '';
        }
        this.clearError();
    }

    // Method to check if user can login (for future implementation)
    async checkLoginEligibility() {
        try {
            const couple = await window.db.findCouple();
            return !!couple;
        } catch (error) {
            console.error('Error checking login eligibility:', error);
            return false;
        }
    }

    // Show pairing modal
    showPairingModal() {
        const modal = document.getElementById('pairing-modal');
        if (modal) {
            modal.classList.remove('hidden');
            
            // Focus on pairing code input
            const codeInput = document.getElementById('pairing-code-input');
            if (codeInput) {
                setTimeout(() => codeInput.focus(), 100);
            }
        }
    }

    // Hide pairing modal
    hidePairingModal() {
        const modal = document.getElementById('pairing-modal');
        if (modal) {
            modal.classList.add('hidden');
            
            // Clear form
            document.getElementById('pairing-code-input').value = '';
            document.getElementById('device-name-input').value = '';
            this.clearPairingError();
            this.clearPairingSuccess();
        }
    }

    // Load quick devices for login
    async loadQuickDevices() {
        try {
            const couple = await window.db.findCouple();
            if (!couple) return;

            const devices = await window.db.getDevices(couple.id);
            const quickDevicesContainer = document.getElementById('quick-devices');
            const deviceList = document.getElementById('device-list');

            if (devices.length > 0) {
                quickDevicesContainer.classList.remove('hidden');
                deviceList.innerHTML = '';

                devices.forEach(device => {
                    const deviceElement = this.createDeviceElement(device);
                    deviceList.appendChild(deviceElement);
                });
            } else {
                quickDevicesContainer.classList.add('hidden');
            }
        } catch (error) {
            console.error('Failed to load quick devices:', error);
        }
    }

    // Create device element for quick login
    createDeviceElement(device) {
        const div = document.createElement('div');
        div.className = 'device-item';
        
        const deviceInfo = this.getDeviceInfo(device.deviceInfo);
        
        div.innerHTML = `
            <div class="device-info">
                <div class="device-name">${device.displayName}</div>
                <div class="device-details">${deviceInfo} • ${window.app.formatDate(device.pairedAt)}</div>
            </div>
            <button class="device-login-btn" data-device-id="${device.id}">
                Login
            </button>
        `;

        // Add click handler
        const loginBtn = div.querySelector('.device-login-btn');
        loginBtn.addEventListener('click', () => {
            this.quickLogin(device);
        });

        return div;
    }

    // Get device info string
    getDeviceInfo(deviceInfo) {
        if (!deviceInfo) return 'Unknown device';
        
        const parts = [];
        if (deviceInfo.platform) parts.push(deviceInfo.platform);
        if (deviceInfo.language) parts.push(deviceInfo.language);
        
        return parts.join(' • ') || 'Unknown device';
    }

    // Quick login with device
    async quickLogin(device) {
        try {
            const couple = await window.db.getCouple(device.coupleId);
            if (!couple) {
                this.showError('Device not found');
                return;
            }

            // Set current user and couple
            window.app.setCurrentUser(device.displayName);
            window.app.setCurrentCouple(couple);

            // Show success message
            window.app.showToast(`Welcome back, ${device.displayName}!`, 'success');

            // Hide login screen
            document.getElementById('login-screen').classList.add('hidden');

            // Show main app
            window.app.showMainApp();
        } catch (error) {
            console.error('Quick login failed:', error);
            this.showError('Quick login failed');
        }
    }

    // Handle pairing code submission
    async handlePairingCode() {
        const pairingCodeInput = document.getElementById('pairing-code-input');
        const deviceNameInput = document.getElementById('device-name-input');
        
        const pairingCode = pairingCodeInput.value.trim();
        const deviceName = deviceNameInput.value.trim();

        if (!pairingCode || !deviceName) {
            this.showPairingError('Please fill in both pairing code and device name');
            return;
        }

        try {
            // Parse pairing code
            const pairingData = window.pairingCode.parsePairingCode(pairingCode);
            
            // Validate pairing token
            const providedTokenHash = await window.db.hashString(pairingData.pairingToken);
            
            // Create couple data
            const coupleData = {
                partnerAName: pairingData.partnerAName,
                partnerBName: pairingData.partnerBName,
                coverTitle: pairingData.coverTitle,
                loveDate: pairingData.loveDate,
                storyStart: pairingData.storyStart,
                pairingTokenHash: providedTokenHash
            };

            // Save couple
            const couple = await window.db.createCouple(coupleData);
            
            // Add device
            await window.db.addDevice({
                coupleId: couple.id,
                displayName: deviceName,
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language,
                    timestamp: new Date().toISOString()
                }
            });

            // Show success
            this.showPairingSuccess(`Paired successfully as ${deviceName}. You can now log in with your name.`);
            
            // Close modal after delay
            setTimeout(() => {
                this.hidePairingModal();
                this.loadQuickDevices(); // Refresh device list
            }, 2000);

        } catch (error) {
            console.error('Pairing failed:', error);
            this.showPairingError('Invalid pairing code: ' + error.message);
        }
    }

    // Show pairing error
    showPairingError(message) {
        const errorElement = document.getElementById('pairing-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
        this.clearPairingSuccess();
    }

    // Show pairing success
    showPairingSuccess(message) {
        const successElement = document.getElementById('pairing-success');
        if (successElement) {
            successElement.textContent = message;
            successElement.classList.remove('hidden');
        }
        this.clearPairingError();
    }

    // Clear pairing error
    clearPairingError() {
        const errorElement = document.getElementById('pairing-error');
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }

    // Clear pairing success
    clearPairingSuccess() {
        const successElement = document.getElementById('pairing-success');
        if (successElement) {
            successElement.classList.add('hidden');
        }
    }
}

// Create global instance
window.loginUI = new LoginUI();
