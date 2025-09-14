// Image Utilities Component
class ImageUtils {
    constructor() {
        this.maxImageSize = 1600; // Max dimension for full images
        this.thumbnailSize = 300; // Max dimension for thumbnails
        this.quality = 0.8; // JPEG quality
    }

    // Compress and resize image
    async compressImage(file, maxSize = this.maxImageSize, quality = this.quality) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                try {
                    // Calculate new dimensions
                    const { width, height } = this.calculateDimensions(
                        img.width, 
                        img.height, 
                        maxSize
                    );

                    // Set canvas dimensions
                    canvas.width = width;
                    canvas.height = height;

                    // Draw and compress
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve({
                                blob: blob,
                                width: width,
                                height: height,
                                originalSize: file.size,
                                compressedSize: blob.size
                            });
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    }, 'image/jpeg', quality);
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            // Load image from file
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            reader.readAsDataURL(file);
        });
    }

    // Generate thumbnail
    async generateThumbnail(file, maxSize = this.thumbnailSize) {
        return this.compressImage(file, maxSize, 0.7);
    }

    // Calculate dimensions maintaining aspect ratio
    calculateDimensions(originalWidth, originalHeight, maxSize) {
        let width = originalWidth;
        let height = originalHeight;

        if (width > height) {
            if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
            }
        }

        return {
            width: Math.round(width),
            height: Math.round(height)
        };
    }

    // Get image info
    async getImageInfo(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height,
                    size: file.size,
                    type: file.type,
                    name: file.name
                });
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            reader.readAsDataURL(file);
        });
    }

    // Create blob URL for display
    createBlobURL(blob) {
        return URL.createObjectURL(blob);
    }

    // Revoke blob URL to free memory
    revokeBlobURL(url) {
        URL.revokeObjectURL(url);
    }

    // Convert blob to base64
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result);
            };
            reader.onerror = () => {
                reject(new Error('Failed to convert blob to base64'));
            };
            reader.readAsDataURL(blob);
        });
    }

    // Convert base64 to blob
    async base64ToBlob(base64, mimeType = 'image/jpeg') {
        const response = await fetch(base64);
        return response.blob();
    }

    // Validate image file
    validateImageFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            throw new Error('Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.');
        }

        if (file.size > maxSize) {
            throw new Error('File too large. Please select an image smaller than 10MB.');
        }

        return true;
    }

    // Process image for storage
    async processImageForStorage(file) {
        try {
            // Validate file
            this.validateImageFile(file);

            // Get image info
            const info = await this.getImageInfo(file);

            // Compress main image
            const compressed = await this.compressImage(file);

            // Generate thumbnail
            const thumbnail = await this.generateThumbnail(file);

            return {
                original: {
                    blob: compressed.blob,
                    width: compressed.width,
                    height: compressed.height,
                    size: compressed.compressedSize
                },
                thumbnail: {
                    blob: thumbnail.blob,
                    width: thumbnail.width,
                    height: thumbnail.height,
                    size: thumbnail.compressedSize
                },
                info: {
                    filename: file.name,
                    originalSize: info.size,
                    type: info.type
                }
            };
        } catch (error) {
            console.error('Image processing failed:', error);
            throw error;
        }
    }

    // Create image preview element
    createImagePreview(blob, options = {}) {
        const container = document.createElement('div');
        container.className = 'image-preview-item';
        
        const img = document.createElement('img');
        img.src = this.createBlobURL(blob);
        img.alt = options.alt || 'Image preview';
        
        if (options.className) {
            img.className = options.className;
        }
        
        if (options.onClick) {
            img.addEventListener('click', options.onClick);
        }

        container.appendChild(img);

        // Add remove button if specified
        if (options.removable) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                container.remove();
                if (options.onRemove) {
                    options.onRemove();
                }
            });
            container.appendChild(removeBtn);
        }

        return container;
    }

    // Create image lightbox
    showImageLightbox(blob, alt = '') {
        const lightbox = document.getElementById('image-lightbox');
        const lightboxImage = document.getElementById('lightbox-image');
        
        if (lightbox && lightboxImage) {
            lightboxImage.src = this.createBlobURL(blob);
            lightboxImage.alt = alt;
            lightbox.classList.remove('hidden');
            
            // Close on escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    this.hideImageLightbox();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        }
    }

    // Hide image lightbox
    hideImageLightbox() {
        const lightbox = document.getElementById('image-lightbox');
        if (lightbox) {
            lightbox.classList.add('hidden');
            
            // Revoke blob URL to free memory
            const lightboxImage = document.getElementById('lightbox-image');
            if (lightboxImage && lightboxImage.src.startsWith('blob:')) {
                this.revokeBlobURL(lightboxImage.src);
            }
        }
    }

    // Get file extension
    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    // Generate filename with timestamp
    generateFilename(originalName, prefix = '') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = this.getFileExtension(originalName);
        return `${prefix}${timestamp}.${extension}`;
    }

    // Check if browser supports required image features
    checkImageSupport() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        return {
            canvas: !!ctx,
            toBlob: !!canvas.toBlob,
            fileReader: !!window.FileReader,
            url: !!window.URL
        };
    }
}

// Create global instance
window.imageUtils = new ImageUtils();
