// Timeline UI Component
class TimelineUI {
    constructor() {
        this.timelineContent = null;
        this.currentFilter = 'all';
        this.timelineItems = [];
    }

    init() {
        this.timelineContent = document.getElementById('timeline-content');
        
        if (!this.timelineContent) {
            console.error('Timeline content element not found');
            return;
        }

        this.setupEventListeners();
        this.loadTimeline();
    }

    setupEventListeners() {
        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            });
        });
    }

    async loadTimeline() {
        try {
            const couple = window.app.getCurrentCouple();
            if (!couple) {
                console.error('No couple found');
                return;
            }

            this.timelineItems = await window.db.getTimeline(couple.id, this.currentFilter);
            this.renderTimeline();
        } catch (error) {
            console.error('Failed to load timeline:', error);
            this.showError('Failed to load timeline');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
        
        // Reload timeline with new filter
        this.loadTimeline();
    }

    renderTimeline() {
        if (!this.timelineContent) return;

        // Clear existing content
        this.timelineContent.innerHTML = '';

        if (this.timelineItems.length === 0) {
            this.showEmptyState();
            return;
        }

        // Render timeline items
        this.timelineItems.forEach(item => {
            const itemElement = this.createTimelineItemElement(item);
            this.timelineContent.appendChild(itemElement);
        });
    }

    createTimelineItemElement(item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'timeline-item';
        itemDiv.dataset.type = item.type;
        itemDiv.dataset.itemId = item.id;

        // Create item header
        const header = document.createElement('div');
        header.className = 'timeline-item-header';
        
        const typeSpan = document.createElement('span');
        typeSpan.className = 'timeline-item-type';
        typeSpan.textContent = this.getTypeLabel(item.type);
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'timeline-item-date';
        dateSpan.textContent = window.app.formatDateTime(item.timestamp);
        
        header.appendChild(typeSpan);
        header.appendChild(dateSpan);

        // Create item content
        const content = document.createElement('div');
        content.className = 'timeline-item-content';
        
        switch (item.type) {
            case 'message':
                content.appendChild(this.createMessageContent(item.data));
                break;
            case 'image':
                content.appendChild(this.createImageContent(item.data));
                break;
            case 'memory':
                content.appendChild(this.createMemoryContent(item.data));
                break;
        }

        // Add click handler
        itemDiv.addEventListener('click', () => {
            this.handleItemClick(item);
        });

        itemDiv.appendChild(header);
        itemDiv.appendChild(content);

        return itemDiv;
    }

    createMessageContent(message) {
        const contentDiv = document.createElement('div');
        
        if (message.text) {
            const textDiv = document.createElement('div');
            textDiv.className = 'message-preview';
            textDiv.textContent = message.text;
            contentDiv.appendChild(textDiv);
        }
        
        if (message.imageId) {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'image-preview';
            imageDiv.textContent = '📷 Image';
            contentDiv.appendChild(imageDiv);
        }
        
        return contentDiv;
    }

    createImageContent(message) {
        const contentDiv = document.createElement('div');
        const imageDiv = document.createElement('div');
        imageDiv.className = 'image-preview';
        imageDiv.textContent = '📷 Shared Image';
        contentDiv.appendChild(imageDiv);
        return contentDiv;
    }

    createMemoryContent(memory) {
        const contentDiv = document.createElement('div');
        
        const titleDiv = document.createElement('h4');
        titleDiv.className = 'memory-preview-title';
        titleDiv.textContent = memory.title;
        contentDiv.appendChild(titleDiv);
        
        const bodyDiv = document.createElement('p');
        bodyDiv.className = 'memory-preview-body';
        bodyDiv.textContent = memory.body;
        contentDiv.appendChild(bodyDiv);
        
        if (memory.imageIds && memory.imageIds.length > 0) {
            const imageCountDiv = document.createElement('div');
            imageCountDiv.className = 'memory-image-count';
            imageCountDiv.textContent = `📷 ${memory.imageIds.length} image${memory.imageIds.length > 1 ? 's' : ''}`;
            contentDiv.appendChild(imageCountDiv);
        }
        
        return contentDiv;
    }

    getTypeLabel(type) {
        switch (type) {
            case 'message':
                return 'Message';
            case 'image':
                return 'Image';
            case 'memory':
                return 'Memory';
            default:
                return 'Unknown';
        }
    }

    handleItemClick(item) {
        switch (item.type) {
            case 'message':
                this.openMessage(item);
                break;
            case 'image':
                this.openImage(item);
                break;
            case 'memory':
                this.openMemory(item);
                break;
        }
    }

    openMessage(item) {
        // Switch to chat screen and highlight the message
        window.app.switchScreen('chat');
        
        // Scroll to the specific message
        setTimeout(() => {
            const messageElement = document.querySelector(`[data-message-id="${item.id}"]`);
            if (messageElement) {
                messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Add highlight effect
                messageElement.style.animation = 'highlight 2s ease-out';
                setTimeout(() => {
                    messageElement.style.animation = '';
                }, 2000);
            }
        }, 100);
    }

    async openImage(item) {
        try {
            const image = await window.db.getImage(item.data.imageId);
            if (image && image.blob) {
                window.imageUtils.showImageLightbox(image.blob, 'Timeline image');
            }
        } catch (error) {
            console.error('Failed to load image:', error);
            this.showError('Failed to load image');
        }
    }

    openMemory(item) {
        // Switch to memory book screen
        window.app.switchScreen('memory-book');
        
        // Find the page containing this memory
        setTimeout(() => {
            if (window.memoryBookUI) {
                const memoryIndex = window.memoryBookUI.memories.findIndex(m => m.id === item.id);
                if (memoryIndex !== -1) {
                    // Calculate which page this memory is on
                    let currentPage = 1; // Start from page 1 (after first page)
                    let currentImageCount = 0;
                    
                    for (let i = 0; i < memoryIndex; i++) {
                        const memory = window.memoryBookUI.memories[i];
                        const imageCount = memory.imageIds ? memory.imageIds.length : 0;
                        
                        if (currentImageCount + imageCount > window.memoryBookUI.imagesPerPage) {
                            currentPage++;
                            currentImageCount = imageCount;
                        } else {
                            currentImageCount += imageCount;
                        }
                    }
                    
                    // Navigate to the page
                    window.memoryBookUI.currentPage = currentPage;
                    window.memoryBookUI.renderPages();
                    window.memoryBookUI.loadMemoryImages();
                }
            }
        }, 100);
    }

    showEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        let message = '';
        switch (this.currentFilter) {
            case 'messages':
                message = 'No messages yet. Start chatting to see them here!';
                break;
            case 'images':
                message = 'No images shared yet. Share your first photo!';
                break;
            case 'memories':
                message = 'No memories yet. Create your first memory!';
                break;
            default:
                message = 'Your timeline is empty. Start creating memories together!';
        }
        
        emptyState.innerHTML = `
            <div class="empty-icon">📅</div>
            <h3>No ${this.currentFilter} yet</h3>
            <p>${message}</p>
        `;
        
        this.timelineContent.appendChild(emptyState);
    }

    showError(message) {
        if (window.app) {
            window.app.showToast(message, 'error');
        }
    }

    // Method to refresh timeline (called when switching screens)
    refresh() {
        this.loadTimeline();
    }

    // Method to search timeline
    async searchTimeline(query) {
        try {
            const couple = window.app.getCurrentCouple();
            if (!couple) return [];

            // Search messages
            const messageResults = await window.db.searchMessages(couple.id, query);
            
            // Search memories (this would require a new method in the database layer)
            // const memoryResults = await window.db.searchMemories(couple.id, query);
            
            // Combine and sort results
            const results = messageResults.map(msg => ({
                type: msg.imageId ? 'image' : 'message',
                id: msg.id,
                data: msg,
                timestamp: new Date(msg.createdAt)
            }));
            
            return results.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Timeline search failed:', error);
            return [];
        }
    }

    // Method to export timeline (for future implementation)
    async exportTimeline() {
        try {
            const couple = window.app.getCurrentCouple();
            if (!couple) return;

            const timeline = await window.db.getTimeline(couple.id, 'all');
            
            // Create export data
            const exportData = {
                timeline: timeline,
                exportDate: new Date().toISOString(),
                couple: couple
            };
            
            // Download as JSON
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `timeline-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            window.app.showToast('Timeline exported successfully!', 'success');
        } catch (error) {
            console.error('Failed to export timeline:', error);
            this.showError('Failed to export timeline');
        }
    }
}

// Create global instance
window.timelineUI = new TimelineUI();
