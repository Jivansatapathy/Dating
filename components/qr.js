// QR Code Component for Device Pairing
class QRCodeComponent {
    constructor() {
        this.qrCodeElement = null;
    }

    generateQRCode(data, elementId) {
        this.qrCodeElement = document.getElementById(elementId);
        if (!this.qrCodeElement) {
            console.error('QR code element not found:', elementId);
            return;
        }

        try {
            // Clear existing content
            this.qrCodeElement.innerHTML = '';

            // Generate QR code using the qrcode library
            QRCode.toCanvas(this.qrCodeElement, data, {
                width: 200,
                height: 200,
                color: {
                    dark: '#ff6b9d',
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'M',
                margin: 2
            }, (error) => {
                if (error) {
                    console.error('QR code generation failed:', error);
                    this.showQRCodeError();
                } else {
                    console.log('QR code generated successfully');
                }
            });
        } catch (error) {
            console.error('QR code generation error:', error);
            this.showQRCodeError();
        }
    }

    showQRCodeError() {
        if (this.qrCodeElement) {
            this.qrCodeElement.innerHTML = `
                <div style="
                    width: 200px;
                    height: 200px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8f9fa;
                    border: 2px dashed #dee2e6;
                    border-radius: 8px;
                    color: #6c757d;
                    text-align: center;
                    font-size: 14px;
                ">
                    QR Code<br>Generation Failed
                </div>
            `;
        }
    }

    generatePairingData(coupleId, pairingToken) {
        return JSON.stringify({
            coupleId: coupleId,
            pairingToken: pairingToken,
            timestamp: Date.now()
        });
    }

    parsePairingData(qrData) {
        try {
            const data = JSON.parse(qrData);
            
            // Validate data structure
            if (!data.coupleId || !data.pairingToken) {
                throw new Error('Invalid QR code data structure');
            }
            
            // Check if QR code is not too old (24 hours)
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            if (Date.now() - data.timestamp > maxAge) {
                throw new Error('QR code has expired');
            }
            
            return data;
        } catch (error) {
            console.error('Failed to parse QR code data:', error);
            throw new Error('Invalid QR code');
        }
    }

    // Generate a numeric pairing code (6-8 digits)
    generateNumericCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Validate numeric pairing code
    validateNumericCode(code) {
        return /^\d{6}$/.test(code);
    }
}

// Create global instance
window.QRCodeComponent = new QRCodeComponent();
