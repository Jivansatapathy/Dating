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
}

// Create global instance
window.loginUI = new LoginUI();
