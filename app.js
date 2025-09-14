// Our Memories - Main Application Bootstrap
class OurMemoriesApp {
    constructor() {
        this.currentScreen = 'loading';
        this.currentUser = null;
        this.currentCouple = null;
        this.perspective = 'A'; // A or B for viewing perspective
        this.isOnline = navigator.onLine;
        
        this.init();
    }

    async init() {
        console.log('💕 Our Memories App Starting...');
        
        // Register service worker
        await this.registerServiceWorker();
        
        // Initialize database
        await this.initDatabase();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check if we have existing data
        await this.checkExistingData();
        
        // Start the app
        this.startApp();
        
        console.log('💕 Our Memories App Ready!');
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
                
                // Listen for service worker updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            this.showToast('App updated! Refresh to get the latest version.', 'success');
                        }
                    });
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    async initDatabase() {
        try {
            await window.db.init();
            console.log('Database initialized');
        } catch (error) {
            console.error('Database initialization failed:', error);
            this.showToast('Failed to initialize database', 'error');
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                this.switchScreen(screen);
            });
        });

        // Header actions
        document.getElementById('switch-perspective')?.addEventListener('click', () => {
            this.switchPerspective();
        });

        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.showSettings();
        });

        // Back to main from settings
        document.getElementById('back-to-main')?.addEventListener('click', () => {
            this.hideSettings();
        });

        // Online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showToast('Back online!', 'success');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showToast('You\'re offline - all data is saved locally', 'warning');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Prevent context menu on long press (for mobile)
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.message-content')) {
                e.preventDefault();
                this.showMessageReaction(e.target.closest('.message-content'));
            }
        });
    }

    async checkExistingData() {
        try {
            // Check if we have a couple record
            const couple = await window.db.findCouple();
            
            if (couple) {
                this.currentCouple = couple;
                console.log('Found existing couple:', couple);
                
                // Check if we have a current user session
                const currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    this.currentUser = currentUser;
                    console.log('Found current user:', currentUser);
                }
            }
        } catch (error) {
            console.error('Error checking existing data:', error);
        }
    }

    startApp() {
        // Hide loading screen
        this.hideScreen('loading-screen');
        
        if (this.currentCouple && this.currentUser) {
            // User is logged in, show main app
            this.showMainApp();
        } else if (this.currentCouple) {
            // Couple exists but no user logged in, show login
            this.showLogin();
        } else {
            // No couple exists, show onboarding
            this.showOnboarding();
        }
    }

    showOnboarding() {
        this.showScreen('onboarding-screen');
        this.currentScreen = 'onboarding';
        
        // Initialize onboarding UI
        if (window.onboardingUI) {
            window.onboardingUI.init();
        }
    }

    showLogin() {
        this.showScreen('login-screen');
        this.currentScreen = 'login';
        
        // Initialize login UI
        if (window.loginUI) {
            window.loginUI.init();
        }
    }

    showMainApp() {
        this.showScreen('main-app');
        this.currentScreen = 'main';
        
        // Initialize main app components
        this.initializeMainApp();
    }

    showSettings() {
        this.showScreen('settings-screen');
        this.currentScreen = 'settings';
        
        // Initialize settings UI
        if (window.settingsUI) {
            window.settingsUI.init();
        }
    }

    hideSettings() {
        this.showMainApp();
    }

    initializeMainApp() {
        // Initialize chat
        if (window.chatUI) {
            window.chatUI.init();
        }
        
        // Initialize memory book
        if (window.memoryBookUI) {
            window.memoryBookUI.init();
        }
        
        // Initialize timeline
        if (window.timelineUI) {
            window.timelineUI.init();
        }
        
        // Start floating hearts if enabled
        this.startFloatingHearts();
        
        // Update header with current user
        this.updateHeader();
    }

    switchScreen(screenName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-screen="${screenName}"]`)?.classList.add('active');
        
        // Update content screens
        document.querySelectorAll('.content-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(`${screenName}-screen`)?.classList.add('active');
        
        // Trigger screen-specific initialization
        switch (screenName) {
            case 'chat':
                if (window.chatUI) window.chatUI.refresh();
                break;
            case 'memory-book':
                if (window.memoryBookUI) window.memoryBookUI.refresh();
                break;
            case 'timeline':
                if (window.timelineUI) window.timelineUI.refresh();
                break;
        }
    }

    switchPerspective() {
        this.perspective = this.perspective === 'A' ? 'B' : 'A';
        
        // Update UI to reflect perspective change
        const switchBtn = document.getElementById('switch-perspective');
        if (switchBtn) {
            switchBtn.title = `Currently viewing as ${this.perspective === 'A' ? this.currentCouple?.partnerAName : this.currentCouple?.partnerBName}`;
        }
        
        // Refresh current screen
        const activeScreen = document.querySelector('.content-screen.active');
        if (activeScreen) {
            const screenName = activeScreen.id.replace('-screen', '');
            this.switchScreen(screenName);
        }
        
        this.showToast(`Switched to ${this.perspective === 'A' ? this.currentCouple?.partnerAName : this.currentCouple?.partnerBName}'s perspective`, 'success');
    }

    updateHeader() {
        const title = document.querySelector('.app-title');
        if (title && this.currentCouple) {
            title.textContent = this.currentCouple.coverTitle || 'Our Memories';
        }
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Show target screen
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('hidden');
        }
    }

    hideScreen(screenId) {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('hidden');
        }
    }

    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (e.key) {
            case '1':
                this.switchScreen('chat');
                break;
            case '2':
                this.switchScreen('memory-book');
                break;
            case '3':
                this.switchScreen('timeline');
                break;
            case 'Escape':
                this.closeModals();
                break;
            case 'p':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.switchPerspective();
                }
                break;
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    showMessageReaction(messageElement) {
        // Show heart reaction on long press
        const heart = document.createElement('div');
        heart.innerHTML = '❤️';
        heart.style.position = 'absolute';
        heart.style.fontSize = '2rem';
        heart.style.pointerEvents = 'none';
        heart.style.animation = 'heartBurst 1s ease-out forwards';
        
        const rect = messageElement.getBoundingClientRect();
        heart.style.left = rect.left + rect.width / 2 + 'px';
        heart.style.top = rect.top + rect.height / 2 + 'px';
        
        document.body.appendChild(heart);
        
        setTimeout(() => {
            heart.remove();
        }, 1000);
    }

    startFloatingHearts() {
        // Check if floating hearts are enabled
        const enabled = localStorage.getItem('floatingHearts') !== 'false';
        if (!enabled) return;
        
        const createHeart = () => {
            const heart = document.createElement('div');
            heart.className = 'floating-heart';
            heart.innerHTML = '💕';
            heart.style.left = Math.random() * 100 + 'vw';
            heart.style.animationDelay = Math.random() * 2 + 's';
            
            document.getElementById('floating-hearts').appendChild(heart);
            
            setTimeout(() => {
                heart.remove();
            }, 6000);
        };
        
        // Create hearts every 10 seconds
        setInterval(createHeart, 10000);
        
        // Create initial heart
        setTimeout(createHeart, 2000);
    }

    showConfetti() {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Create confetti pieces
        for (let i = 0; i < 50; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + 'vw';
            piece.style.animationDelay = Math.random() * 3 + 's';
            piece.style.backgroundColor = ['#ff6b9d', '#c44569', '#ffd700', '#ffb3ba'][Math.floor(Math.random() * 4)];
            confetti.appendChild(piece);
        }
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.getElementById('toast-container').appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    // Utility methods
    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    }

    formatTime(date) {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(new Date(date));
    }

    formatDateTime(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(new Date(date));
    }

    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    // App state management
    setCurrentUser(userName) {
        this.currentUser = userName;
        localStorage.setItem('currentUser', userName);
    }

    setCurrentCouple(couple) {
        this.currentCouple = couple;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentCouple() {
        return this.currentCouple;
    }

    isUserPartnerA() {
        return this.currentUser === this.currentCouple?.partnerAName;
    }

    isUserPartnerB() {
        return this.currentUser === this.currentCouple?.partnerBName;
    }

    getPartnerName() {
        if (this.isUserPartnerA()) {
            return this.currentCouple?.partnerBName;
        } else if (this.isUserPartnerB()) {
            return this.currentCouple?.partnerAName;
        }
        return null;
    }

    // Cleanup method
    destroy() {
        // Clean up event listeners and resources
        console.log('App destroyed');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new OurMemoriesApp();
});

// Add CSS for heart burst animation
const style = document.createElement('style');
style.textContent = `
    @keyframes heartBurst {
        0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
        }
        50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 0.8;
        }
        100% {
            transform: scale(2) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
