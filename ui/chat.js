// Chat UI Component
class ChatUI {
    constructor() {
        this.messagesContainer = null;
        this.messageInput = null;
        this.sendBtn = null;
        this.imageInput = null;
        this.imageUploadBtn = null;
        this.isLoading = false;
        this.messages = [];
    }

    init() {
        this.messagesContainer = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.imageInput = document.getElementById('image-input');
        this.imageUploadBtn = document.getElementById('image-upload-btn');

        if (!this.messagesContainer || !this.messageInput || !this.sendBtn) {
            console.error('Chat UI elements not found');
            return;
        }

        this.setupEventListeners();
        this.loadMessages();
    }

    setupEventListeners() {
        // Send message
        this.sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key to send
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Image upload
        this.imageUploadBtn.addEventListener('click', () => {
            this.imageInput.click();
        });

        this.imageInput.addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });

        // Focus input when switching to chat
        const chatNavBtn = document.querySelector('[data-screen="chat"]');
        if (chatNavBtn) {
            chatNavBtn.addEventListener('click', () => {
                setTimeout(() => {
                    this.messageInput.focus();
                }, 100);
            });
        }
    }

    async loadMessages() {
        try {
            const couple = window.app.getCurrentCouple();
            if (!couple) {
                console.error('No couple found');
                return;
            }

            this.messages = await window.db.getMessages(couple.id, 100);
            this.renderMessages();
        } catch (error) {
            console.error('Failed to load messages:', error);
            this.showError('Failed to load messages');
        }
    }

    renderMessages() {
        if (!this.messagesContainer) return;

        // Clear existing messages
        this.messagesContainer.innerHTML = '';

        if (this.messages.length === 0) {
            this.showEmptyState();
            return;
        }

        // Sort messages by creation date (oldest first)
        const sortedMessages = [...this.messages].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
        );

        // Render each message
        sortedMessages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            this.messagesContainer.appendChild(messageElement);
        });

        // Scroll to bottom
        this.scrollToBottom();
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.dataset.messageId = message.id;

        // Determine if message is sent by current user
        const currentUser = window.app.getCurrentUser();
        const isSentByCurrentUser = message.senderDisplayName === currentUser;

        if (isSentByCurrentUser) {
            messageDiv.classList.add('sent');
        } else {
            messageDiv.classList.add('received');
        }

        // Create avatar
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = message.senderDisplayName.charAt(0).toUpperCase();

        // Create message content
        const content = document.createElement('div');
        content.className = 'message-content';

        // Add text if present
        if (message.text) {
            const textDiv = document.createElement('div');
            textDiv.className = 'message-text';
            textDiv.textContent = message.text;
            content.appendChild(textDiv);
        }

        // Add image if present
        if (message.imageId) {
            this.addImageToMessage(content, message.imageId);
        }

        // Add timestamp
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = window.app.formatTime(message.createdAt);
        content.appendChild(timeDiv);

        // Add reactions if present
        if (message.reactions && message.reactions.length > 0) {
            this.addReactionsToMessage(content, message.reactions);
        }

        // Add click handler for reactions
        content.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showMessageReaction(message.id);
        });

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

        return messageDiv;
    }

    async addImageToMessage(content, imageId) {
        try {
            const image = await window.db.getImage(imageId);
            if (image && image.blob) {
                const img = document.createElement('img');
                img.className = 'message-image';
                img.src = window.imageUtils.createBlobURL(image.blob);
                img.alt = image.altText || 'Shared image';
                
                img.addEventListener('click', () => {
                    window.imageUtils.showImageLightbox(image.blob, img.alt);
                });

                // Insert before timestamp
                const timeDiv = content.querySelector('.message-time');
                content.insertBefore(img, timeDiv);
            }
        } catch (error) {
            console.error('Failed to load image:', error);
        }
    }

    addReactionsToMessage(content, reactions) {
        const reactionsDiv = document.createElement('div');
        reactionsDiv.className = 'message-reactions';

        reactions.forEach(reaction => {
            const reactionSpan = document.createElement('span');
            reactionSpan.className = 'reaction';
            reactionSpan.textContent = reaction.emoji;
            reactionSpan.title = `Reacted by ${reaction.user}`;
            reactionsDiv.appendChild(reactionSpan);
        });

        content.appendChild(reactionsDiv);
    }

    showEmptyState() {
        const romanticQuotes = [
            "Every love story is beautiful, but ours is my favorite. 💕",
            "In all the world, there is no heart for me like yours. 💖",
            "You are my today and all of my tomorrows. 💝",
            "I love you not only for what you are, but for what I am when I am with you. 💕",
            "You make my heart smile. 💖",
            "Every moment with you is a memory I treasure. 💝",
            "You are the reason I believe in love. 💕",
            "My heart is and always will be yours. 💖",
            "You are my sunshine on a cloudy day. 💝",
            "I love you more than words can express. 💕",
            "You are my greatest adventure. 💖",
            "Every day with you is a gift. 💝",
            "You are my home. 💕",
            "I love you to the moon and back. 💖",
            "You are my favorite hello and my hardest goodbye. 💝",
            "I love you more than yesterday, less than tomorrow. 💕",
            "You are my person. 💖",
            "I love you because you are you. 💝",
            "You are my heart's desire. 💕",
            "I love you with all my heart and soul. 💖",
            "You are my everything. 💝",
            "I love you more than life itself. 💕",
            "You are my dream come true. 💖",
            "I love you beyond measure. 💝",
            "You are my forever and always. 💕",
            "I love you more than words can say. 💖",
            "You are my heart's home. 💝",
            "I love you with every beat of my heart. 💕",
            "You are my greatest love story. 💖",
            "I love you more than the stars in the sky. 💝"
        ];

        const randomQuote = romanticQuotes[Math.floor(Math.random() * romanticQuotes.length)];

        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-icon">💕</div>
            <h3>No messages yet</h3>
            <p>${randomQuote}</p>
            <p class="empty-subtitle">Say something sweet — your words will live here forever.</p>
        `;
        this.messagesContainer.appendChild(emptyState);
    }

    async sendMessage() {
        if (this.isLoading) return;

        const text = this.messageInput.value.trim();
        if (!text) return;

        this.isLoading = true;

        try {
            const couple = window.app.getCurrentCouple();
            const currentUser = window.app.getCurrentUser();

            if (!couple || !currentUser) {
                throw new Error('No couple or user found');
            }

            // Create message
            const messageData = {
                coupleId: couple.id,
                senderDisplayName: currentUser,
                text: text
            };

            // Save message to database
            const message = await window.db.saveMessage(messageData);

            // Add to local messages array
            this.messages.push(message);

            // Clear input
            this.messageInput.value = '';
            this.autoResizeTextarea();

            // Render messages
            this.renderMessages();

            // Show confetti effect
            window.app.showConfetti();

            // Play notification sound
            if (window.notifications) {
                window.notifications.playNotificationSound();
            }

            // Show success toast
            window.app.showToast('Message sent!', 'success');

        } catch (error) {
            console.error('Failed to send message:', error);
            this.showError('Failed to send message');
        } finally {
            this.isLoading = false;
        }
    }

    async handleImageUpload(file) {
        if (!file) return;

        if (this.isLoading) return;

        this.isLoading = true;

        try {
            // Validate file
            window.imageUtils.validateImageFile(file);

            // Process image
            const processedImage = await window.imageUtils.processImageForStorage(file);

            // Save image to database
            const image = await window.db.saveImage({
                blob: processedImage.original.blob,
                thumbBlob: processedImage.thumbnail.blob,
                filename: processedImage.info.filename,
                width: processedImage.original.width,
                height: processedImage.original.height,
                altText: `Image shared by ${window.app.getCurrentUser()}`
            });

            // Create message with image
            const couple = window.app.getCurrentCouple();
            const currentUser = window.app.getCurrentUser();

            const messageData = {
                coupleId: couple.id,
                senderDisplayName: currentUser,
                imageId: image.id
            };

            // Save message to database
            const message = await window.db.saveMessage(messageData);

            // Add to local messages array
            this.messages.push(message);

            // Render messages
            this.renderMessages();

            // Show confetti effect
            window.app.showConfetti();

            // Play notification sound
            if (window.notifications) {
                window.notifications.playNotificationSound();
            }

            // Show success toast
            window.app.showToast('Image sent!', 'success');

        } catch (error) {
            console.error('Failed to send image:', error);
            this.showError('Failed to send image: ' + error.message);
        } finally {
            this.isLoading = false;
            // Clear file input
            this.imageInput.value = '';
        }
    }

    async showMessageReaction(messageId) {
        try {
            const message = this.messages.find(m => m.id === messageId);
            if (!message) return;

            // Add heart reaction
            const reaction = {
                emoji: '❤️',
                user: window.app.getCurrentUser(),
                timestamp: new Date().toISOString()
            };

            // Update message with reaction
            if (!message.reactions) {
                message.reactions = [];
            }
            message.reactions.push(reaction);

            // Save to database
            await window.db.updateMessage(messageId, { reactions: message.reactions });

            // Re-render messages
            this.renderMessages();

            // Show heart burst effect
            window.app.showMessageReaction(document.querySelector(`[data-message-id="${messageId}"]`));

        } catch (error) {
            console.error('Failed to add reaction:', error);
        }
    }

    autoResizeTextarea() {
        if (this.messageInput) {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
        }
    }

    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    showError(message) {
        if (window.app) {
            window.app.showToast(message, 'error');
        }
    }

    // Method to refresh messages (called when switching screens)
    refresh() {
        this.loadMessages();
    }

    // Method to search messages
    async searchMessages(query) {
        try {
            const couple = window.app.getCurrentCouple();
            if (!couple) return [];

            const results = await window.db.searchMessages(couple.id, query);
            return results;
        } catch (error) {
            console.error('Search failed:', error);
            return [];
        }
    }

    // Method to clear chat (for future implementation)
    async clearChat() {
        if (confirm('Are you sure you want to clear all messages? This cannot be undone.')) {
            try {
                const couple = window.app.getCurrentCouple();
                if (!couple) return;

                // This would require a new method in the database layer
                // await window.db.clearMessages(couple.id);
                
                this.messages = [];
                this.renderMessages();
                
                window.app.showToast('Chat cleared', 'success');
            } catch (error) {
                console.error('Failed to clear chat:', error);
                this.showError('Failed to clear chat');
            }
        }
    }
}

// Create global instance
window.chatUI = new ChatUI();
