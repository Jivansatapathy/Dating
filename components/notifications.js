// Notifications Component
class NotificationsComponent {
    constructor() {
        this.permission = 'default';
        this.isSupported = 'Notification' in window;
        this.serviceWorker = null;
        this.soundEnabled = true;
        this.init();
    }

    async init() {
        if (!this.isSupported) {
            console.warn('Notifications not supported in this browser');
            return;
        }

        // Check current permission
        this.permission = Notification.permission;
        
        // Register service worker if available
        if ('serviceWorker' in navigator) {
            try {
                this.serviceWorker = await navigator.serviceWorker.ready;
            } catch (error) {
                console.warn('Service worker not available:', error);
            }
        }

        // Set up notification click handler
        this.setupNotificationClickHandler();
    }

    // Request notification permission
    async requestPermission() {
        if (!this.isSupported) {
            throw new Error('Notifications not supported');
        }

        if (this.permission === 'granted') {
            return true;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                console.log('Notification permission granted');
                return true;
            } else {
                console.log('Notification permission denied');
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            throw error;
        }
    }

    // Show notification
    async showNotification(title, options = {}) {
        if (!this.isSupported || this.permission !== 'granted') {
            console.warn('Cannot show notification - permission not granted');
            return false;
        }

        const defaultOptions = {
            body: '',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'our-memories-notification',
            requireInteraction: false,
            silent: false,
            data: {}
        };

        const notificationOptions = { ...defaultOptions, ...options };

        try {
            if (this.serviceWorker) {
                // Use service worker for background notifications
                this.serviceWorker.showNotification(title, notificationOptions);
            } else {
                // Use regular notification API
                const notification = new Notification(title, notificationOptions);
                
                // Auto-close after 5 seconds
                setTimeout(() => {
                    notification.close();
                }, 5000);
            }

            // Play notification sound if enabled
            if (this.soundEnabled && !notificationOptions.silent) {
                this.playNotificationSound();
            }

            return true;
        } catch (error) {
            console.error('Failed to show notification:', error);
            return false;
        }
    }

    // Show message notification
    async showMessageNotification(senderName, messageText, imageUrl = null) {
        const title = `${senderName} sent a message`;
        const body = messageText || 'Sent a photo';
        
        const options = {
            body: body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'message-notification',
            data: {
                type: 'message',
                sender: senderName,
                message: messageText,
                imageUrl: imageUrl
            },
            actions: [
                {
                    action: 'open',
                    title: 'Open Chat',
                    icon: '/icons/icon-72x72.png'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        };

        // Add image if available
        if (imageUrl) {
            options.image = imageUrl;
        }

        return this.showNotification(title, options);
    }

    // Show memory notification
    async showMemoryNotification(senderName, memoryTitle) {
        const title = `${senderName} added a memory`;
        const body = memoryTitle;
        
        const options = {
            body: body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'memory-notification',
            data: {
                type: 'memory',
                sender: senderName,
                title: memoryTitle
            },
            actions: [
                {
                    action: 'open',
                    title: 'View Memory',
                    icon: '/icons/icon-72x72.png'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        };

        return this.showNotification(title, options);
    }

    // Show in-app toast notification
    showToast(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        // Add to toast container
        const container = document.getElementById('toast-container');
        if (container) {
            container.appendChild(toast);
            
            // Auto-remove after duration
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, duration);
        }
    }

    // Play notification sound
    playNotificationSound() {
        try {
            // Create a simple notification sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a pleasant notification sound
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Set frequency and type
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.type = 'sine';
            
            // Set volume envelope
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            // Play the sound
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Could not play notification sound:', error);
        }
    }

    // Set up notification click handler
    setupNotificationClickHandler() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
                    this.handleNotificationClick(event.data);
                }
            });
        }
    }

    // Handle notification click
    handleNotificationClick(data) {
        console.log('Notification clicked:', data);
        
        // Focus the app window
        if (window.focus) {
            window.focus();
        }
        
        // Navigate to appropriate screen
        if (data.action === 'open') {
            if (data.notificationType === 'message') {
                // Switch to chat screen
                if (window.app) {
                    window.app.switchScreen('chat');
                }
            } else if (data.notificationType === 'memory') {
                // Switch to memory book screen
                if (window.app) {
                    window.app.switchScreen('memory-book');
                }
            }
        }
    }

    // Check if notifications are enabled
    isEnabled() {
        return this.isSupported && this.permission === 'granted';
    }

    // Get permission status
    getPermissionStatus() {
        return {
            supported: this.isSupported,
            permission: this.permission,
            enabled: this.isEnabled()
        };
    }

    // Enable/disable sound
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }

    // Test notification
    async testNotification() {
        if (!this.isEnabled()) {
            const granted = await this.requestPermission();
            if (!granted) {
                throw new Error('Notification permission not granted');
            }
        }

        return this.showNotification('Test Notification', {
            body: 'This is a test notification from Our Memories',
            tag: 'test-notification'
        });
    }

    // Schedule notification (for future use)
    scheduleNotification(title, options, delay) {
        setTimeout(() => {
            this.showNotification(title, options);
        }, delay);
    }

    // Clear all notifications
    clearAllNotifications() {
        if (this.serviceWorker) {
            this.serviceWorker.getNotifications().then(notifications => {
                notifications.forEach(notification => {
                    notification.close();
                });
            });
        }
    }

    // Get notification settings
    getSettings() {
        return {
            enabled: this.isEnabled(),
            soundEnabled: this.soundEnabled,
            permission: this.permission
        };
    }

    // Update notification settings
    async updateSettings(settings) {
        if (settings.enabled && !this.isEnabled()) {
            await this.requestPermission();
        }
        
        if (settings.soundEnabled !== undefined) {
            this.soundEnabled = settings.soundEnabled;
        }
    }

    // Show permission request UI
    showPermissionRequest() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Enable Notifications</h3>
                </div>
                <div class="modal-body">
                    <p>Allow notifications so you'll be notified whenever your love sends a message or adds a memory.</p>
                    <div class="notification-benefits">
                        <div class="benefit">
                            <span class="icon">💬</span>
                            <span>Get notified of new messages</span>
                        </div>
                        <div class="benefit">
                            <span class="icon">📖</span>
                            <span>Know when memories are added</span>
                        </div>
                        <div class="benefit">
                            <span class="icon">🔔</span>
                            <span>Stay connected even when app is closed</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="deny-notifications">Not Now</button>
                    <button class="btn btn-primary" id="allow-notifications">Allow Notifications</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle button clicks
        document.getElementById('allow-notifications').addEventListener('click', async () => {
            try {
                const granted = await this.requestPermission();
                if (granted) {
                    this.showToast('Notifications enabled!', 'success');
                } else {
                    this.showToast('Notifications permission denied', 'warning');
                }
            } catch (error) {
                this.showToast('Failed to enable notifications', 'error');
            }
            modal.remove();
        });
        
        document.getElementById('deny-notifications').addEventListener('click', () => {
            modal.remove();
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

// Create global instance
window.notifications = new NotificationsComponent();
