// Image Compression Component
class ImageCompression {
    constructor() {
        this.defaultOptions = {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.8,
            format: 'image/jpeg'
        };
    }

    // Main compression method
    async compressImage(file, options = {}) {
        const opts = { ...this.defaultOptions, ...options };
        
        try {
            // Validate input
            this.validateFile(file);
            
            // Get image dimensions
            const dimensions = await this.getImageDimensions(file);
            
            // Calculate new dimensions
            const newDimensions = this.calculateNewDimensions(
                dimensions.width,
                dimensions.height,
                opts.maxWidth,
                opts.maxHeight
            );
            
            // Compress the image
            const compressedBlob = await this.resizeAndCompress(
                file,
                newDimensions.width,
                newDimensions.height,
                opts.quality,
                opts.format
            );
            
            return {
                blob: compressedBlob,
                originalSize: file.size,
                compressedSize: compressedBlob.size,
                compressionRatio: (1 - compressedBlob.size / file.size) * 100,
                dimensions: newDimensions,
                originalDimensions: dimensions
            };
        } catch (error) {
            console.error('Image compression failed:', error);
            throw error;
        }
    }

    // Get image dimensions without loading full image
    async getImageDimensions(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height
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

    // Calculate new dimensions maintaining aspect ratio
    calculateNewDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
        let newWidth = originalWidth;
        let newHeight = originalHeight;
        
        // Calculate scaling factors
        const widthScale = maxWidth / originalWidth;
        const heightScale = maxHeight / originalHeight;
        
        // Use the smaller scaling factor to ensure image fits within bounds
        const scale = Math.min(widthScale, heightScale, 1); // Don't upscale
        
        newWidth = Math.round(originalWidth * scale);
        newHeight = Math.round(originalHeight * scale);
        
        return {
            width: newWidth,
            height: newHeight,
            scale: scale
        };
    }

    // Resize and compress image using canvas
    async resizeAndCompress(file, width, height, quality, format) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;
            
            img.onload = () => {
                try {
                    // Clear canvas
                    ctx.clearRect(0, 0, width, height);
                    
                    // Set image smoothing
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // Draw resized image
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to blob
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to create compressed image'));
                        }
                    }, format, quality);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => {
                reject(new Error('Failed to load image for compression'));
            };
            
            // Load image
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

    // Create thumbnail
    async createThumbnail(file, size = 300, quality = 0.7) {
        return this.compressImage(file, {
            maxWidth: size,
            maxHeight: size,
            quality: quality,
            format: 'image/jpeg'
        });
    }

    // Batch compress multiple images
    async compressImages(files, options = {}) {
        const results = [];
        const errors = [];
        
        for (let i = 0; i < files.length; i++) {
            try {
                const result = await this.compressImage(files[i], options);
                results.push({
                    index: i,
                    file: files[i],
                    result: result
                });
            } catch (error) {
                errors.push({
                    index: i,
                    file: files[i],
                    error: error.message
                });
            }
        }
        
        return {
            results: results,
            errors: errors,
            successCount: results.length,
            errorCount: errors.length
        };
    }

    // Validate file before compression
    validateFile(file) {
        if (!file) {
            throw new Error('No file provided');
        }
        
        if (!file.type.startsWith('image/')) {
            throw new Error('File is not an image');
        }
        
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            throw new Error('File is too large (max 50MB)');
        }
        
        const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!supportedTypes.includes(file.type)) {
            throw new Error('Unsupported image format');
        }
    }

    // Get compression statistics
    getCompressionStats(originalSize, compressedSize) {
        const savedBytes = originalSize - compressedSize;
        const savedPercentage = (savedBytes / originalSize) * 100;
        
        return {
            originalSize: originalSize,
            compressedSize: compressedSize,
            savedBytes: savedBytes,
            savedPercentage: Math.round(savedPercentage * 100) / 100,
            compressionRatio: Math.round((compressedSize / originalSize) * 100) / 100
        };
    }

    // Format file size for display
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Check if compression is beneficial
    shouldCompress(originalSize, targetSize) {
        const compressionRatio = targetSize / originalSize;
        return compressionRatio < 0.9; // Only compress if we can save at least 10%
    }

    // Progressive compression (try different quality levels)
    async progressiveCompress(file, targetSize, options = {}) {
        const qualities = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3];
        
        for (const quality of qualities) {
            try {
                const result = await this.compressImage(file, { ...options, quality });
                
                if (result.compressedSize <= targetSize) {
                    return result;
                }
            } catch (error) {
                console.warn(`Compression failed at quality ${quality}:`, error);
            }
        }
        
        // If we can't reach target size, return the smallest we could achieve
        return this.compressImage(file, { ...options, quality: 0.3 });
    }

    // Create compression preview
    createCompressionPreview(originalBlob, compressedBlob, originalSize, compressedSize) {
        const container = document.createElement('div');
        container.className = 'compression-preview';
        container.innerHTML = `
            <div class="compression-stats">
                <div class="stat">
                    <span class="label">Original:</span>
                    <span class="value">${this.formatFileSize(originalSize)}</span>
                </div>
                <div class="stat">
                    <span class="label">Compressed:</span>
                    <span class="value">${this.formatFileSize(compressedSize)}</span>
                </div>
                <div class="stat">
                    <span class="label">Saved:</span>
                    <span class="value">${this.formatFileSize(originalSize - compressedSize)}</span>
                </div>
            </div>
            <div class="compression-images">
                <div class="image-comparison">
                    <div class="original">
                        <img src="${URL.createObjectURL(originalBlob)}" alt="Original">
                        <span class="label">Original</span>
                    </div>
                    <div class="compressed">
                        <img src="${URL.createObjectURL(compressedBlob)}" alt="Compressed">
                        <span class="label">Compressed</span>
                    </div>
                </div>
            </div>
        `;
        
        return container;
    }

    // Clean up blob URLs
    cleanupBlobURLs(urls) {
        urls.forEach(url => {
            if (url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });
    }
}

// Create global instance
window.imageCompression = new ImageCompression();
