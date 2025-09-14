// Memory Book UI Component
class MemoryBookUI {
    constructor() {
        this.bookCover = null;
        this.bookPages = null;
        this.bookContent = null;
        this.currentPage = 0;
        this.pages = [];
        this.memories = [];
        this.isBookOpen = false;
        this.imagesPerPage = 3;
    }

    init() {
        this.bookCover = document.getElementById('book-cover');
        this.bookPages = document.getElementById('book-pages');
        this.bookContent = document.getElementById('book-content');
        this.prevPageBtn = document.getElementById('prev-page');
        this.nextPageBtn = document.getElementById('next-page');
        this.pageIndicator = document.getElementById('page-indicator');
        this.addMemoryBtn = document.getElementById('add-memory-btn');

        if (!this.bookCover || !this.bookPages || !this.bookContent) {
            console.error('Memory book elements not found');
            return;
        }

        this.setupEventListeners();
        this.loadMemories();
    }

    setupEventListeners() {
        // Book cover click
        this.bookCover.addEventListener('click', () => {
            this.openBook();
        });

        // Page navigation
        if (this.prevPageBtn) {
            this.prevPageBtn.addEventListener('click', () => {
                this.previousPage();
            });
        }

        if (this.nextPageBtn) {
            this.nextPageBtn.addEventListener('click', () => {
                this.nextPage();
            });
        }

        // Add memory button
        if (this.addMemoryBtn) {
            this.addMemoryBtn.addEventListener('click', () => {
                this.showAddMemoryModal();
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.isBookOpen) {
                if (e.key === 'ArrowLeft') {
                    this.previousPage();
                } else if (e.key === 'ArrowRight') {
                    this.nextPage();
                }
            }
        });

        // Touch/swipe gestures
        this.setupSwipeGestures();
    }

    setupSwipeGestures() {
        let startX = 0;
        let startY = 0;

        this.bookContent.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        this.bookContent.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;

            const diffX = startX - endX;
            const diffY = startY - endY;

            // Check if horizontal swipe is more significant than vertical
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Swipe left - next page
                    this.nextPage();
                } else {
                    // Swipe right - previous page
                    this.previousPage();
                }
            }

            startX = 0;
            startY = 0;
        });
    }

    async loadMemories() {
        try {
            const couple = window.app.getCurrentCouple();
            if (!couple) {
                console.error('No couple found');
                return;
            }

            this.memories = await window.db.getMemories(couple.id);
            this.generatePages();
            this.renderBook();
        } catch (error) {
            console.error('Failed to load memories:', error);
            this.showError('Failed to load memories');
        }
    }

    generatePages() {
        this.pages = [];

        // First page is special - love date and story start
        const couple = window.app.getCurrentCouple();
        if (couple) {
            this.pages.push({
                type: 'first',
                title: 'The Day We Said "I Love You"',
                date: couple.loveDate,
                content: couple.storyStart,
                images: []
            });
        }

        // Group memories into pages
        let currentPageMemories = [];
        let currentPageImages = 0;

        this.memories.forEach(memory => {
            const memoryImages = memory.imageIds ? memory.imageIds.length : 0;
            
            // Check if adding this memory would exceed the image limit
            if (currentPageImages + memoryImages > this.imagesPerPage && currentPageMemories.length > 0) {
                // Create a page with current memories
                this.pages.push({
                    type: 'memory',
                    memories: [...currentPageMemories],
                    images: currentPageImages
                });
                
                // Start new page
                currentPageMemories = [memory];
                currentPageImages = memoryImages;
            } else {
                // Add memory to current page
                currentPageMemories.push(memory);
                currentPageImages += memoryImages;
            }
        });

        // Add remaining memories to final page
        if (currentPageMemories.length > 0) {
            this.pages.push({
                type: 'memory',
                memories: currentPageMemories,
                images: currentPageImages
            });
        }

        // If no memories, add empty page
        if (this.pages.length === 1 && this.pages[0].type === 'first') {
            this.pages.push({
                type: 'empty',
                title: 'Your First Memory',
                content: 'Add your first memory to start building your love story!'
            });
        }
    }

    renderBook() {
        if (!this.isBookOpen) {
            this.renderCover();
        } else {
            this.renderPages();
        }
    }

    renderCover() {
        const couple = window.app.getCurrentCouple();
        const coverTitle = document.getElementById('cover-title');
        
        if (coverTitle && couple) {
            coverTitle.textContent = couple.coverTitle || 'Our Memories';
        }
    }

    renderPages() {
        if (this.pages.length === 0) {
            this.bookContent.innerHTML = '<div class="empty-state"><p>No memories yet</p></div>';
            return;
        }

        // Clear existing content
        this.bookContent.innerHTML = '';

        // Render current page
        const currentPageData = this.pages[this.currentPage];
        if (currentPageData) {
            const pageElement = this.createPageElement(currentPageData);
            this.bookContent.appendChild(pageElement);
        }

        // Update navigation
        this.updateNavigation();
    }

    createPageElement(pageData) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'book-page active';

        switch (pageData.type) {
            case 'first':
                pageDiv.innerHTML = this.createFirstPageHTML(pageData);
                break;
            case 'memory':
                pageDiv.innerHTML = this.createMemoryPageHTML(pageData);
                break;
            case 'empty':
                pageDiv.innerHTML = this.createEmptyPageHTML(pageData);
                break;
        }

        return pageDiv;
    }

    createFirstPageHTML(pageData) {
        const formattedDate = window.app.formatDate(pageData.date);
        
        return `
            <div class="page-header">
                <h2 class="page-title">${pageData.title}</h2>
                <div class="page-date">${formattedDate}</div>
            </div>
            <div class="page-content">
                <div class="first-page-content">
                    <div class="story-text" contenteditable="true" data-field="storyStart">
                        ${pageData.content}
                    </div>
                    <div class="first-page-heart">💕</div>
                </div>
            </div>
        `;
    }

    createMemoryPageHTML(pageData) {
        let html = '<div class="page-content">';
        
        pageData.memories.forEach(memory => {
            html += this.createMemoryHTML(memory);
        });
        
        html += '</div>';
        return html;
    }

    createMemoryHTML(memory) {
        const formattedDate = window.app.formatDate(memory.date);
        
        let html = `
            <div class="memory-item">
                <div class="memory-header">
                    <h3 class="memory-title">${memory.title}</h3>
                    <div class="memory-date">${formattedDate}</div>
                </div>
                <div class="memory-content">
                    <div class="memory-text">${memory.body}</div>
        `;

        // Add images if present
        if (memory.imageIds && memory.imageIds.length > 0) {
            html += '<div class="memory-images">';
            memory.imageIds.forEach(imageId => {
                html += `<div class="memory-image-placeholder" data-image-id="${imageId}">Loading image...</div>`;
            });
            html += '</div>';
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }

    createEmptyPageHTML(pageData) {
        return `
            <div class="page-content">
                <div class="empty-memory-state">
                    <div class="empty-icon">📖</div>
                    <h3>${pageData.title}</h3>
                    <p>${pageData.content}</p>
                    <button class="btn btn-primary" onclick="window.memoryBookUI.showAddMemoryModal()">
                        Add Your First Memory
                    </button>
                </div>
            </div>
        `;
    }

    async loadMemoryImages() {
        const imagePlaceholders = this.bookContent.querySelectorAll('.memory-image-placeholder');
        
        for (const placeholder of imagePlaceholders) {
            const imageId = placeholder.dataset.imageId;
            try {
                const image = await window.db.getImage(imageId);
                if (image && image.blob) {
                    const img = document.createElement('img');
                    img.src = window.imageUtils.createBlobURL(image.blob);
                    img.alt = image.altText || 'Memory image';
                    img.className = 'memory-image';
                    
                    img.addEventListener('click', () => {
                        window.imageUtils.showImageLightbox(image.blob, img.alt);
                    });
                    
                    placeholder.replaceWith(img);
                }
            } catch (error) {
                console.error('Failed to load memory image:', error);
                placeholder.textContent = 'Image not found';
            }
        }
    }

    openBook() {
        this.isBookOpen = true;
        this.bookCover.classList.add('hidden');
        this.bookPages.classList.remove('hidden');
        
        // Animate book opening
        this.animateBookOpening();
        
        // Render pages
        this.renderPages();
        
        // Load images after a short delay
        setTimeout(() => {
            this.loadMemoryImages();
        }, 300);
    }

    closeBook() {
        this.isBookOpen = false;
        this.bookPages.classList.add('hidden');
        this.bookCover.classList.remove('hidden');
        
        // Animate book closing
        this.animateBookClosing();
    }

    animateBookOpening() {
        // Add opening animation class
        this.bookPages.style.animation = 'bookOpen 0.5s ease-out';
        
        setTimeout(() => {
            this.bookPages.style.animation = '';
        }, 500);
    }

    animateBookClosing() {
        // Add closing animation class
        this.bookCover.style.animation = 'bookClose 0.5s ease-out';
        
        setTimeout(() => {
            this.bookCover.style.animation = '';
        }, 500);
    }

    previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.renderPages();
            this.loadMemoryImages();
        }
    }

    nextPage() {
        if (this.currentPage < this.pages.length - 1) {
            this.currentPage++;
            this.renderPages();
            this.loadMemoryImages();
        }
    }

    updateNavigation() {
        if (this.pageIndicator) {
            this.pageIndicator.textContent = `${this.currentPage + 1} / ${this.pages.length}`;
        }

        if (this.prevPageBtn) {
            this.prevPageBtn.disabled = this.currentPage === 0;
        }

        if (this.nextPageBtn) {
            this.nextPageBtn.disabled = this.currentPage === this.pages.length - 1;
        }
    }

    showAddMemoryModal() {
        const modal = document.getElementById('add-memory-modal');
        if (modal) {
            modal.classList.remove('hidden');
            
            // Set default date to today
            const dateInput = document.getElementById('memory-date');
            if (dateInput && !dateInput.value) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
            
            // Focus on title input
            const titleInput = document.getElementById('memory-title');
            if (titleInput) {
                setTimeout(() => titleInput.focus(), 100);
            }
        }
    }

    hideAddMemoryModal() {
        const modal = document.getElementById('add-memory-modal');
        if (modal) {
            modal.classList.add('hidden');
            
            // Clear form
            const form = document.getElementById('memory-form');
            if (form) {
                form.reset();
            }
            
            // Clear image preview
            const preview = document.getElementById('memory-image-preview');
            if (preview) {
                preview.innerHTML = '';
            }
        }
    }

    async saveMemory() {
        try {
            const title = document.getElementById('memory-title').value.trim();
            const date = document.getElementById('memory-date').value;
            const body = document.getElementById('memory-body').value.trim();
            const imageFiles = document.getElementById('memory-images').files;
            const isLocked = document.getElementById('memory-lock').checked;

            if (!title || !body) {
                this.showError('Please fill in both title and description');
                return;
            }

            const couple = window.app.getCurrentCouple();
            if (!couple) {
                throw new Error('No couple found');
            }

            // Process images
            const imageIds = [];
            if (imageFiles.length > 0) {
                for (const file of imageFiles) {
                    try {
                        const processedImage = await window.imageUtils.processImageForStorage(file);
                        const image = await window.db.saveImage({
                            blob: processedImage.original.blob,
                            thumbBlob: processedImage.thumbnail.blob,
                            filename: processedImage.info.filename,
                            width: processedImage.original.width,
                            height: processedImage.original.height,
                            altText: `Memory image: ${title}`
                        });
                        imageIds.push(image.id);
                    } catch (error) {
                        console.error('Failed to process image:', error);
                        this.showError('Failed to process image: ' + error.message);
                        return;
                    }
                }
            }

            // Save memory
            const memoryData = {
                coupleId: couple.id,
                title: title,
                date: date,
                body: body,
                imageIds: imageIds,
                lockedWithPin: isLocked ? 'hashed_pin_here' : null
            };

            const memory = await window.db.saveMemory(memoryData);

            // Add to local memories array
            this.memories.push(memory);

            // Regenerate pages
            this.generatePages();

            // Render book
            this.renderBook();

            // Hide modal
            this.hideAddMemoryModal();

            // Show success message
            window.app.showToast('Saved to your Memory Book 💝', 'success');

            // Show confetti effect
            window.app.showConfetti();

        } catch (error) {
            console.error('Failed to save memory:', error);
            this.showError('Failed to save memory: ' + error.message);
        }
    }

    showError(message) {
        if (window.app) {
            window.app.showToast(message, 'error');
        }
    }

    // Method to refresh memories (called when switching screens)
    refresh() {
        this.loadMemories();
    }

    // Method to edit memory (for future implementation)
    async editMemory(memoryId) {
        // Implementation for editing existing memories
        console.log('Edit memory:', memoryId);
    }

    // Method to delete memory (for future implementation)
    async deleteMemory(memoryId) {
        if (confirm('Are you sure you want to delete this memory? This cannot be undone.')) {
            try {
                await window.db.deleteMemory(memoryId);
                this.memories = this.memories.filter(m => m.id !== memoryId);
                this.generatePages();
                this.renderBook();
                window.app.showToast('Memory deleted', 'success');
            } catch (error) {
                console.error('Failed to delete memory:', error);
                this.showError('Failed to delete memory');
            }
        }
    }
}

// Create global instance
window.memoryBookUI = new MemoryBookUI();

// Set up memory modal event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Close modal buttons
    document.getElementById('close-memory-modal')?.addEventListener('click', () => {
        window.memoryBookUI.hideAddMemoryModal();
    });

    document.getElementById('cancel-memory')?.addEventListener('click', () => {
        window.memoryBookUI.hideAddMemoryModal();
    });

    // Save memory button
    document.getElementById('save-memory')?.addEventListener('click', () => {
        window.memoryBookUI.saveMemory();
    });

    // Image preview
    document.getElementById('memory-images')?.addEventListener('change', (e) => {
        const files = e.target.files;
        const preview = document.getElementById('memory-image-preview');
        
        if (preview) {
            preview.innerHTML = '';
            
            for (const file of files) {
                const previewItem = window.imageUtils.createImagePreview(file, {
                    removable: true,
                    onClick: () => window.imageUtils.showImageLightbox(file)
                });
                preview.appendChild(previewItem);
            }
        }
    });
});
