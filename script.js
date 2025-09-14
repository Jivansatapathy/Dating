// Dating App JavaScript
class DatingApp {
    constructor() {
        this.currentUser = 'You';
        this.messages = [];
        this.memories = [];
        this.timeline = [];
        this.currentTab = 'chat';
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderChat();
        this.renderMemories();
        this.renderTimeline();
        this.setCurrentDate();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.closest('.nav-btn').dataset.tab);
            });
        });

        // Chat functionality
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Image upload
        document.getElementById('imageUploadBtn').addEventListener('click', () => {
            document.getElementById('imageInput').click();
        });
        document.getElementById('imageInput').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        // User switching
        document.getElementById('switchUserBtn').addEventListener('click', () => {
            this.switchUser();
        });

        // Memory modal
        document.getElementById('addMemoryBtn').addEventListener('click', () => {
            this.openMemoryModal();
        });
        document.getElementById('closeMemoryModal').addEventListener('click', () => {
            this.closeMemoryModal();
        });
        document.getElementById('cancelMemory').addEventListener('click', () => {
            this.closeMemoryModal();
        });
        document.getElementById('saveMemory').addEventListener('click', () => {
            this.saveMemory();
        });

        // Image modal
        document.getElementById('closeImageModal').addEventListener('click', () => {
            this.closeImageModal();
        });

        // Timeline filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterTimeline(e.target.dataset.filter);
            });
        });

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    switchTab(tab) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tab).classList.add('active');

        this.currentTab = tab;
    }

    switchUser() {
        this.currentUser = this.currentUser === 'You' ? 'Your Love' : 'You';
        document.getElementById('currentUser').textContent = this.currentUser;
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (message) {
            const newMessage = {
                id: Date.now(),
                text: message,
                sender: this.currentUser,
                timestamp: new Date(),
                type: 'text'
            };
            
            this.messages.push(newMessage);
            this.timeline.push({
                ...newMessage,
                type: 'message'
            });
            
            input.value = '';
            this.renderChat();
            this.renderTimeline();
            this.saveData();
            
            // Auto-scroll to bottom
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    handleImageUpload(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const newMessage = {
                    id: Date.now(),
                    image: e.target.result,
                    sender: this.currentUser,
                    timestamp: new Date(),
                    type: 'image'
                };
                
                this.messages.push(newMessage);
                this.timeline.push({
                    ...newMessage,
                    type: 'image'
                });
                
                this.renderChat();
                this.renderTimeline();
                this.saveData();
                
                // Auto-scroll to bottom
                const chatMessages = document.getElementById('chatMessages');
                chatMessages.scrollTop = chatMessages.scrollHeight;
            };
            reader.readAsDataURL(file);
        }
    }

    renderChat() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';

        if (this.messages.length === 0) {
            chatMessages.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart" style="font-size: 3rem; color: #ff6b6b; margin-bottom: 1rem;"></i>
                    <h3>Start your love story!</h3>
                    <p>Send your first message or share a beautiful photo 💕</p>
                </div>
            `;
            return;
        }

        this.messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            chatMessages.appendChild(messageElement);
        });
    }

    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = `message ${message.sender === 'You' ? 'sent' : 'received'}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = message.sender === 'You' ? 'Y' : 'L';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        if (message.type === 'text') {
            content.innerHTML = `
                <div class="message-text">${this.escapeHtml(message.text)}</div>
                <div class="message-time">${this.formatTime(message.timestamp)}</div>
            `;
        } else if (message.type === 'image') {
            content.innerHTML = `
                <img src="${message.image}" alt="Shared image" class="message-image" onclick="app.openImageModal('${message.image}')">
                <div class="message-time">${this.formatTime(message.timestamp)}</div>
            `;
        }
        
        div.appendChild(avatar);
        div.appendChild(content);
        
        return div;
    }

    openMemoryModal() {
        document.getElementById('memoryModal').classList.add('active');
        document.getElementById('memoryDate').value = new Date().toISOString().split('T')[0];
    }

    closeMemoryModal() {
        document.getElementById('memoryModal').classList.remove('active');
        // Clear form
        document.getElementById('memoryTitle').value = '';
        document.getElementById('memoryDescription').value = '';
        document.getElementById('memoryImage').value = '';
    }

    saveMemory() {
        const title = document.getElementById('memoryTitle').value.trim();
        const description = document.getElementById('memoryDescription').value.trim();
        const date = document.getElementById('memoryDate').value;
        const imageFile = document.getElementById('memoryImage').files[0];
        
        if (!title || !description) {
            alert('Please fill in both title and description!');
            return;
        }
        
        const memory = {
            id: Date.now(),
            title,
            description,
            date: new Date(date),
            image: null
        };
        
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                memory.image = e.target.result;
                this.addMemory(memory);
            };
            reader.readAsDataURL(imageFile);
        } else {
            this.addMemory(memory);
        }
    }

    addMemory(memory) {
        this.memories.push(memory);
        this.timeline.push({
            ...memory,
            type: 'memory'
        });
        
        this.renderMemories();
        this.renderTimeline();
        this.saveData();
        this.closeMemoryModal();
    }

    renderMemories() {
        const memoriesGrid = document.getElementById('memoriesGrid');
        memoriesGrid.innerHTML = '';

        if (this.memories.length === 0) {
            memoriesGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-heart" style="font-size: 3rem; color: #ff6b6b; margin-bottom: 1rem;"></i>
                    <h3>No memories yet</h3>
                    <p>Start creating beautiful memories together! 💕</p>
                </div>
            `;
            return;
        }

        // Sort memories by date (newest first)
        const sortedMemories = [...this.memories].sort((a, b) => b.date - a.date);
        
        sortedMemories.forEach(memory => {
            const memoryCard = this.createMemoryCard(memory);
            memoriesGrid.appendChild(memoryCard);
        });
    }

    createMemoryCard(memory) {
        const div = document.createElement('div');
        div.className = 'memory-card';
        div.onclick = () => this.openImageModal(memory.image);
        
        div.innerHTML = `
            ${memory.image ? `<img src="${memory.image}" alt="${memory.title}" class="memory-image">` : ''}
            <div class="memory-content">
                <h3 class="memory-title">${this.escapeHtml(memory.title)}</h3>
                <p class="memory-description">${this.escapeHtml(memory.description)}</p>
                <div class="memory-date">
                    <i class="fas fa-calendar"></i>
                    ${this.formatDate(memory.date)}
                </div>
            </div>
        `;
        
        return div;
    }

    renderTimeline() {
        const timeline = document.getElementById('timeline');
        timeline.innerHTML = '';

        if (this.timeline.length === 0) {
            timeline.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-heart" style="font-size: 3rem; color: #ff6b6b; margin-bottom: 1rem;"></i>
                    <h3>Your timeline is empty</h3>
                    <p>Start chatting and creating memories to build your love story! 💕</p>
                </div>
            `;
            return;
        }

        // Sort timeline by date (newest first)
        const sortedTimeline = [...this.timeline].sort((a, b) => b.timestamp - a.timestamp);
        
        sortedTimeline.forEach(item => {
            const timelineItem = this.createTimelineItem(item);
            timeline.appendChild(timelineItem);
        });
    }

    createTimelineItem(item) {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.dataset.type = item.type;
        
        let content = '';
        let typeLabel = '';
        
        switch (item.type) {
            case 'message':
                typeLabel = 'Message';
                content = `<div class="timeline-item-content">${this.escapeHtml(item.text)}</div>`;
                break;
            case 'image':
                typeLabel = 'Image';
                content = `
                    <div class="timeline-item-content">
                        <img src="${item.image}" alt="Shared image" class="timeline-item-image" onclick="app.openImageModal('${item.image}')">
                    </div>
                `;
                break;
            case 'memory':
                typeLabel = 'Memory';
                content = `
                    <div class="timeline-item-content">
                        <h4>${this.escapeHtml(item.title)}</h4>
                        <p>${this.escapeHtml(item.description)}</p>
                        ${item.image ? `<img src="${item.image}" alt="${item.title}" class="timeline-item-image" onclick="app.openImageModal('${item.image}')">` : ''}
                    </div>
                `;
                break;
        }
        
        div.innerHTML = `
            <div class="timeline-item-header">
                <span class="timeline-item-type">${typeLabel}</span>
                <span class="timeline-item-date">${this.formatDateTime(item.timestamp || item.date)}</span>
            </div>
            ${content}
        `;
        
        return div;
    }

    filterTimeline(filter) {
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        // Filter timeline items
        const timelineItems = document.querySelectorAll('.timeline-item');
        timelineItems.forEach(item => {
            if (filter === 'all' || item.dataset.type === filter) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    openImageModal(imageSrc) {
        if (imageSrc) {
            document.getElementById('modalImage').src = imageSrc;
            document.getElementById('imageModal').classList.add('active');
        }
    }

    closeImageModal() {
        document.getElementById('imageModal').classList.remove('active');
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTime(date) {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }

    formatDateTime(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('memoryDate').value = today;
    }

    // Data persistence
    saveData() {
        const data = {
            messages: this.messages,
            memories: this.memories,
            timeline: this.timeline,
            currentUser: this.currentUser
        };
        localStorage.setItem('datingAppData', JSON.stringify(data));
    }

    loadData() {
        const savedData = localStorage.getItem('datingAppData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.messages = data.messages || [];
            this.memories = data.memories || [];
            this.timeline = data.timeline || [];
            this.currentUser = data.currentUser || 'You';
            
            // Convert date strings back to Date objects
            this.messages.forEach(msg => {
                msg.timestamp = new Date(msg.timestamp);
            });
            this.memories.forEach(memory => {
                memory.date = new Date(memory.date);
            });
            this.timeline.forEach(item => {
                if (item.timestamp) item.timestamp = new Date(item.timestamp);
                if (item.date) item.date = new Date(item.date);
            });
            
            document.getElementById('currentUser').textContent = this.currentUser;
        }
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DatingApp();
});

// Add some romantic features
document.addEventListener('DOMContentLoaded', () => {
    // Add floating hearts animation
    function createFloatingHeart() {
        const heart = document.createElement('div');
        heart.innerHTML = '💕';
        heart.style.position = 'fixed';
        heart.style.left = Math.random() * 100 + 'vw';
        heart.style.top = '100vh';
        heart.style.fontSize = '20px';
        heart.style.pointerEvents = 'none';
        heart.style.zIndex = '1000';
        heart.style.animation = 'floatUp 6s linear forwards';
        
        document.body.appendChild(heart);
        
        setTimeout(() => {
            heart.remove();
        }, 6000);
    }
    
    // Add CSS for floating animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatUp {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(-100vh) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Create floating hearts occasionally
    setInterval(createFloatingHeart, 10000);
    
    // Add romantic quotes
    const romanticQuotes = [
        "Every love story is beautiful, but ours is my favorite. 💕",
        "In all the world, there is no heart for me like yours. 💖",
        "You are my today and all of my tomorrows. 💝",
        "I love you not only for what you are, but for what I am when I am with you. 💕",
        "You make my heart smile. 💖",
        "Every moment with you is a memory I treasure. 💝"
    ];
    
    // Show a romantic quote in the chat when it's empty
    const chatMessages = document.getElementById('chatMessages');
    const observer = new MutationObserver(() => {
        if (chatMessages.children.length === 0) {
            const quote = romanticQuotes[Math.floor(Math.random() * romanticQuotes.length)];
            chatMessages.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart" style="font-size: 3rem; color: #ff6b6b; margin-bottom: 1rem;"></i>
                    <h3>Start your love story!</h3>
                    <p>${quote}</p>
                </div>
            `;
        }
    });
    
    observer.observe(chatMessages, { childList: true });
});
