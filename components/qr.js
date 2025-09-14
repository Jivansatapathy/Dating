// Pairing Code Component for Device Pairing
class PairingCodeComponent {
    constructor() {
        this.pairingCodeElement = null;
    }

    generatePairingCode(coupleData) {
        const pairingData = {
            coupleId: coupleData.id,
            partnerAName: coupleData.partnerAName,
            partnerBName: coupleData.partnerBName,
            coverTitle: coupleData.coverTitle || 'Our Memories',
            loveDate: coupleData.loveDate,
            storyStart: coupleData.storyStart,
            pairingToken: coupleData.pairingToken,
            timestamp: Date.now()
        };

        // Encode as base64 URL-safe string
        const jsonString = JSON.stringify(pairingData);
        const base64String = btoa(jsonString)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        return base64String;
    }

    parsePairingCode(pairingCode) {
        try {
            // Decode base64 URL-safe string
            let base64String = pairingCode
                .replace(/-/g, '+')
                .replace(/_/g, '/');
            
            // Add padding if needed
            while (base64String.length % 4) {
                base64String += '=';
            }

            const jsonString = atob(base64String);
            const data = JSON.parse(jsonString);
            
            // Validate required fields
            const requiredFields = ['coupleId', 'partnerAName', 'partnerBName', 'loveDate', 'storyStart', 'pairingToken'];
            for (const field of requiredFields) {
                if (!data[field]) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }
            
            // Check if code is not too old (24 hours) - UX only, not enforced
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            if (Date.now() - data.timestamp > maxAge) {
                console.warn('Pairing code is older than 24 hours');
            }
            
            return data;
        } catch (error) {
            console.error('Failed to parse pairing code:', error);
            throw new Error('Invalid pairing code format');
        }
    }

    displayPairingCode(pairingCode, elementId) {
        this.pairingCodeElement = document.getElementById(elementId);
        if (!this.pairingCodeElement) {
            console.error('Pairing code element not found:', elementId);
            return;
        }

        this.pairingCodeElement.innerHTML = `
            <div class="pairing-code-display">
                <textarea readonly class="pairing-code-textarea" id="pairing-code-text">${pairingCode}</textarea>
                <button class="btn btn-primary copy-pairing-code-btn" id="copy-pairing-code">
                    <span class="icon">📋</span>
                    Copy Code
                </button>
            </div>
        `;

        // Add copy functionality
        document.getElementById('copy-pairing-code').addEventListener('click', () => {
            this.copyPairingCode(pairingCode);
        });
    }

    copyPairingCode(pairingCode) {
        const textarea = document.getElementById('pairing-code-text');
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices

        try {
            document.execCommand('copy');
            const copyBtn = document.getElementById('copy-pairing-code');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span class="icon">✅</span> Copied!';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy pairing code:', err);
            // Fallback: show the code in an alert
            alert('Please copy this code manually:\n\n' + pairingCode);
        }
    }

    // Generate a new pairing token (for regenerating codes)
    generateNewPairingToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Format pairing code for display (add spaces for readability)
    formatPairingCodeForDisplay(code) {
        // Add spaces every 4 characters for better readability
        return code.replace(/(.{4})/g, '$1 ').trim();
    }
}

// Create global instance
window.pairingCode = new PairingCodeComponent();
