// Onboarding UI Component
class OnboardingUI {
    constructor() {
        this.form = null;
        this.isSubmitting = false;
    }

    init() {
        this.form = document.getElementById('onboarding-form');
        if (!this.form) {
            console.error('Onboarding form not found');
            return;
        }

        this.setupEventListeners();
        this.setDefaultDate();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Real-time validation
        const inputs = this.form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }

    setDefaultDate() {
        const loveDateInput = document.getElementById('love-date');
        if (loveDateInput && !loveDateInput.value) {
            // Set default to today
            const today = new Date().toISOString().split('T')[0];
            loveDateInput.value = today;
        }
    }

    async handleSubmit() {
        if (this.isSubmitting) {
            return;
        }

        this.isSubmitting = true;

        try {
            // Validate form
            if (!this.validateForm()) {
                return;
            }

            // Get form data
            const formData = this.getFormData();

            // Show loading state
            this.showLoadingState();

            // Create couple
            const couple = await this.createCouple(formData);

            // Add device
            await this.addDevice(couple.id, formData.deviceName);

            // Show pairing screen
            this.showPairingScreen(couple);

        } catch (error) {
            console.error('Onboarding failed:', error);
            this.showError('Failed to create your memories. Please try again.');
        } finally {
            this.isSubmitting = false;
            this.hideLoadingState();
        }
    }

    validateForm() {
        const inputs = this.form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        // Additional validation
        const partnerAName = document.getElementById('partner-a-name').value.trim();
        const partnerBName = document.getElementById('partner-b-name').value.trim();

        if (partnerAName.toLowerCase() === partnerBName.toLowerCase()) {
            this.showFieldError('partner-b-name', 'Partner names must be different');
            isValid = false;
        }

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.id;

        // Clear previous errors
        this.clearFieldError(fieldName);

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(fieldName, 'This field is required');
            return false;
        }

        // Specific field validations
        switch (fieldName) {
            case 'partner-a-name':
            case 'partner-b-name':
                if (value.length < 2) {
                    this.showFieldError(fieldName, 'Name must be at least 2 characters');
                    return false;
                }
                if (value.length > 50) {
                    this.showFieldError(fieldName, 'Name must be less than 50 characters');
                    return false;
                }
                break;

            case 'love-date':
                const date = new Date(value);
                const today = new Date();
                if (date > today) {
                    this.showFieldError(fieldName, 'Love date cannot be in the future');
                    return false;
                }
                break;

            case 'story-start':
                if (value.length < 10) {
                    this.showFieldError(fieldName, 'Please write at least 10 characters about your story');
                    return false;
                }
                if (value.length > 1000) {
                    this.showFieldError(fieldName, 'Story must be less than 1000 characters');
                    return false;
                }
                break;

            case 'device-name':
                if (value.length < 2) {
                    this.showFieldError(fieldName, 'Device name must be at least 2 characters');
                    return false;
                }
                break;
        }

        return true;
    }

    showFieldError(fieldName, message) {
        const field = document.getElementById(fieldName);
        if (!field) return;

        // Add error class
        field.classList.add('error');

        // Create or update error message
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    clearFieldError(fieldName) {
        const field = document.getElementById(fieldName);
        if (!field) return;

        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    showError(message) {
        // Create error toast
        if (window.app) {
            window.app.showToast(message, 'error');
        }
    }

    getFormData() {
        return {
            partnerAName: document.getElementById('partner-a-name').value.trim(),
            partnerBName: document.getElementById('partner-b-name').value.trim(),
            loveDate: document.getElementById('love-date').value,
            storyStart: document.getElementById('story-start').value.trim(),
            deviceName: document.getElementById('device-name').value.trim()
        };
    }

    async createCouple(formData) {
        // Generate pairing token
        const pairingToken = await window.db.generatePairingToken();
        const pairingTokenHash = await window.db.hashString(pairingToken);

        const coupleData = {
            partnerAName: formData.partnerAName,
            partnerBName: formData.partnerBName,
            loveDate: formData.loveDate,
            storyStart: formData.storyStart,
            pairingTokenHash: pairingTokenHash
        };

        const couple = await window.db.createCouple(coupleData);
        
        // Store pairing token temporarily for QR generation
        couple.pairingToken = pairingToken;
        
        return couple;
    }

    async addDevice(coupleId, deviceName) {
        const deviceData = {
            coupleId: coupleId,
            displayName: deviceName,
            deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                timestamp: new Date().toISOString()
            }
        };

        return await window.db.addDevice(deviceData);
    }

    showPairingScreen(couple) {
        // Hide onboarding screen
        document.getElementById('onboarding-screen').classList.add('hidden');

        // Show pairing screen
        const pairingScreen = document.getElementById('pairing-screen');
        pairingScreen.classList.remove('hidden');

        // Generate QR code
        this.generateQRCode(couple);

        // Generate numeric code
        this.generateNumericCode();

        // Set up pairing screen event listeners
        this.setupPairingEventListeners(couple);
    }

    generateQRCode(couple) {
        const qrData = window.QRCodeComponent.generatePairingData(
            couple.id,
            couple.pairingToken
        );

        window.QRCodeComponent.generateQRCode(qrData, 'qr-code');
    }

    generateNumericCode() {
        const numericCode = window.QRCodeComponent.generateNumericCode();
        document.getElementById('pairing-code-display').textContent = numericCode;
    }

    setupPairingEventListeners(couple) {
        // Continue to app button
        document.getElementById('continue-to-app').addEventListener('click', () => {
            this.continueToApp(couple);
        });

        // Pair another device button
        document.getElementById('pair-another-device').addEventListener('click', () => {
            this.pairAnotherDevice(couple);
        });
    }

    continueToApp(couple) {
        // Set current user (first partner)
        window.app.setCurrentUser(couple.partnerAName);
        window.app.setCurrentCouple(couple);

        // Hide pairing screen
        document.getElementById('pairing-screen').classList.add('hidden');

        // Show main app
        window.app.showMainApp();
    }

    pairAnotherDevice(couple) {
        // This would typically involve showing instructions for pairing
        // For now, we'll just continue to the app
        this.continueToApp(couple);
    }

    showLoadingState() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span> Creating...';
        }
    }

    hideLoadingState() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create Our Memories';
        }
    }

    // Method to handle QR code scanning (for future implementation)
    handleQRCodeScan(qrData) {
        try {
            const data = window.QRCodeComponent.parsePairingData(qrData);
            
            // Validate pairing token
            if (data.coupleId && data.pairingToken) {
                // This would typically involve validating the token with the original device
                // For now, we'll just show a success message
                window.app.showToast('QR code scanned successfully!', 'success');
                return data;
            }
        } catch (error) {
            window.app.showToast('Invalid QR code: ' + error.message, 'error');
        }
        
        return null;
    }

    // Method to handle numeric code pairing (for future implementation)
    handleNumericCodePairing(code) {
        if (window.QRCodeComponent.validateNumericCode(code)) {
            // This would typically involve validating the code with the original device
            window.app.showToast('Pairing code accepted!', 'success');
            return true;
        } else {
            window.app.showToast('Invalid pairing code', 'error');
            return false;
        }
    }
}

// Create global instance
window.onboardingUI = new OnboardingUI();
