// Our Memories - IndexedDB Database Layer
class OurMemoriesDB {
    constructor() {
        this.dbName = 'our_memories_v1';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => {
                console.error('Database failed to open');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                this.createObjectStores();
                console.log('Database upgraded');
            };
        });
    }

    createObjectStores() {
        // Couples store
        if (!this.db.objectStoreNames.contains('couples')) {
            const couplesStore = this.db.createObjectStore('couples', { keyPath: 'id' });
            couplesStore.createIndex('partnerAName', 'partnerAName', { unique: false });
            couplesStore.createIndex('partnerBName', 'partnerBName', { unique: false });
        }

        // Devices store
        if (!this.db.objectStoreNames.contains('devices')) {
            const devicesStore = this.db.createObjectStore('devices', { keyPath: 'id' });
            devicesStore.createIndex('coupleId', 'coupleId', { unique: false });
        }

        // Messages store
        if (!this.db.objectStoreNames.contains('messages')) {
            const messagesStore = this.db.createObjectStore('messages', { keyPath: 'id' });
            messagesStore.createIndex('coupleId', 'coupleId', { unique: false });
            messagesStore.createIndex('createdAt', 'createdAt', { unique: false });
            messagesStore.createIndex('senderDisplayName', 'senderDisplayName', { unique: false });
        }

        // Images store
        if (!this.db.objectStoreNames.contains('images')) {
            const imagesStore = this.db.createObjectStore('images', { keyPath: 'id' });
            imagesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Memories store
        if (!this.db.objectStoreNames.contains('memories')) {
            const memoriesStore = this.db.createObjectStore('memories', { keyPath: 'id' });
            memoriesStore.createIndex('coupleId', 'coupleId', { unique: false });
            memoriesStore.createIndex('date', 'date', { unique: false });
            memoriesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Settings store
        if (!this.db.objectStoreNames.contains('settings')) {
            const settingsStore = this.db.createObjectStore('settings', { keyPath: 'id' });
        }
    }

    // Couples CRUD
    async createCouple(coupleData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['couples'], 'readwrite');
            const store = transaction.objectStore('couples');
            
            const couple = {
                id: this.generateId(),
                partnerAName: coupleData.partnerAName,
                partnerBName: coupleData.partnerBName,
                coverTitle: coupleData.coverTitle || 'Our Memories',
                loveDate: coupleData.loveDate,
                storyStart: coupleData.storyStart,
                pairingTokenHash: coupleData.pairingTokenHash,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const request = store.add(couple);
            
            request.onsuccess = () => {
                console.log('Couple created:', couple.id);
                resolve(couple);
            };
            
            request.onerror = () => {
                console.error('Failed to create couple');
                reject(request.error);
            };
        });
    }

    async getCouple(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['couples'], 'readonly');
            const store = transaction.objectStore('couples');
            const request = store.get(id);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async findCouple() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['couples'], 'readonly');
            const store = transaction.objectStore('couples');
            const request = store.getAll();
            
            request.onsuccess = () => {
                // Return the first (and should be only) couple
                resolve(request.result[0] || null);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async updateCouple(id, updates) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['couples'], 'readwrite');
            const store = transaction.objectStore('couples');
            
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const couple = getRequest.result;
                if (couple) {
                    Object.assign(couple, updates);
                    couple.updatedAt = new Date().toISOString();
                    
                    const putRequest = store.put(couple);
                    
                    putRequest.onsuccess = () => {
                        resolve(couple);
                    };
                    
                    putRequest.onerror = () => {
                        reject(putRequest.error);
                    };
                } else {
                    reject(new Error('Couple not found'));
                }
            };
            
            getRequest.onerror = () => {
                reject(getRequest.error);
            };
        });
    }

    // Devices CRUD
    async addDevice(deviceData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['devices'], 'readwrite');
            const store = transaction.objectStore('devices');
            
            const device = {
                id: this.generateId(),
                coupleId: deviceData.coupleId,
                displayName: deviceData.displayName,
                pairedAt: new Date().toISOString(),
                deviceInfo: deviceData.deviceInfo || {}
            };
            
            const request = store.add(device);
            
            request.onsuccess = () => {
                console.log('Device added:', device.id);
                resolve(device);
            };
            
            request.onerror = () => {
                console.error('Failed to add device');
                reject(request.error);
            };
        });
    }

    async getDevices(coupleId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['devices'], 'readonly');
            const store = transaction.objectStore('devices');
            const index = store.index('coupleId');
            const request = index.getAll(coupleId);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Messages CRUD
    async saveMessage(messageData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readwrite');
            const store = transaction.objectStore('messages');
            
            const message = {
                id: this.generateId(),
                coupleId: messageData.coupleId,
                senderDisplayName: messageData.senderDisplayName,
                text: messageData.text || null,
                imageId: messageData.imageId || null,
                createdAt: new Date().toISOString(),
                delivered: messageData.delivered || false,
                seen: messageData.seen || false,
                reactions: messageData.reactions || []
            };
            
            const request = store.add(message);
            
            request.onsuccess = () => {
                console.log('Message saved:', message.id);
                resolve(message);
            };
            
            request.onerror = () => {
                console.error('Failed to save message');
                reject(request.error);
            };
        });
    }

    async getMessages(coupleId, limit = 100) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readonly');
            const store = transaction.objectStore('messages');
            const index = store.index('coupleId');
            const request = index.getAll(coupleId);
            
            request.onsuccess = () => {
                // Sort by creation date (newest first) and limit
                const messages = request.result
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, limit);
                resolve(messages);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async updateMessage(id, updates) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readwrite');
            const store = transaction.objectStore('messages');
            
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const message = getRequest.result;
                if (message) {
                    Object.assign(message, updates);
                    
                    const putRequest = store.put(message);
                    
                    putRequest.onsuccess = () => {
                        resolve(message);
                    };
                    
                    putRequest.onerror = () => {
                        reject(putRequest.error);
                    };
                } else {
                    reject(new Error('Message not found'));
                }
            };
            
            getRequest.onerror = () => {
                reject(getRequest.error);
            };
        });
    }

    // Images CRUD
    async saveImage(imageData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            
            const image = {
                id: this.generateId(),
                blob: imageData.blob,
                thumbBlob: imageData.thumbBlob || null,
                filename: imageData.filename || 'image.jpg',
                width: imageData.width || 0,
                height: imageData.height || 0,
                createdAt: new Date().toISOString(),
                altText: imageData.altText || null
            };
            
            const request = store.add(image);
            
            request.onsuccess = () => {
                console.log('Image saved:', image.id);
                resolve(image);
            };
            
            request.onerror = () => {
                console.error('Failed to save image');
                reject(request.error);
            };
        });
    }

    async getImage(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readonly');
            const store = transaction.objectStore('images');
            const request = store.get(id);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async getAllImages() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readonly');
            const store = transaction.objectStore('images');
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Memories CRUD
    async saveMemory(memoryData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['memories'], 'readwrite');
            const store = transaction.objectStore('memories');
            
            const memory = {
                id: this.generateId(),
                coupleId: memoryData.coupleId,
                title: memoryData.title,
                date: memoryData.date,
                body: memoryData.body,
                imageIds: memoryData.imageIds || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lockedWithPin: memoryData.lockedWithPin || null
            };
            
            const request = store.add(memory);
            
            request.onsuccess = () => {
                console.log('Memory saved:', memory.id);
                resolve(memory);
            };
            
            request.onerror = () => {
                console.error('Failed to save memory');
                reject(request.error);
            };
        });
    }

    async getMemories(coupleId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['memories'], 'readonly');
            const store = transaction.objectStore('memories');
            const index = store.index('coupleId');
            const request = index.getAll(coupleId);
            
            request.onsuccess = () => {
                // Sort by date (oldest first for memory book)
                const memories = request.result
                    .sort((a, b) => new Date(a.date) - new Date(b.date));
                resolve(memories);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async updateMemory(id, updates) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['memories'], 'readwrite');
            const store = transaction.objectStore('memories');
            
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const memory = getRequest.result;
                if (memory) {
                    Object.assign(memory, updates);
                    memory.updatedAt = new Date().toISOString();
                    
                    const putRequest = store.put(memory);
                    
                    putRequest.onsuccess = () => {
                        resolve(memory);
                    };
                    
                    putRequest.onerror = () => {
                        reject(putRequest.error);
                    };
                } else {
                    reject(new Error('Memory not found'));
                }
            };
            
            getRequest.onerror = () => {
                reject(getRequest.error);
            };
        });
    }

    async deleteMemory(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['memories'], 'readwrite');
            const store = transaction.objectStore('memories');
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log('Memory deleted:', id);
                resolve();
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Settings CRUD
    async getSettings() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get('app_settings');
            
            request.onsuccess = () => {
                resolve(request.result || {
                    id: 'app_settings',
                    notificationEnabled: true,
                    floatingHearts: true,
                    theme: 'default',
                    appPinHash: null,
                    exportLastAt: null
                });
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async updateSettings(settings) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            
            const settingsData = {
                id: 'app_settings',
                notificationEnabled: settings.notificationEnabled !== undefined ? settings.notificationEnabled : true,
                floatingHearts: settings.floatingHearts !== undefined ? settings.floatingHearts : true,
                theme: settings.theme || 'default',
                appPinHash: settings.appPinHash || null,
                exportLastAt: settings.exportLastAt || null
            };
            
            const request = store.put(settingsData);
            
            request.onsuccess = () => {
                console.log('Settings updated');
                resolve(settingsData);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Timeline and search
    async getTimeline(coupleId, filter = 'all') {
        return new Promise(async (resolve, reject) => {
            try {
                const [messages, memories] = await Promise.all([
                    this.getMessages(coupleId),
                    this.getMemories(coupleId)
                ]);
                
                const timeline = [];
                
                // Add messages
                if (filter === 'all' || filter === 'messages') {
                    messages.forEach(message => {
                        timeline.push({
                            type: message.imageId ? 'image' : 'message',
                            id: message.id,
                            data: message,
                            timestamp: new Date(message.createdAt)
                        });
                    });
                }
                
                // Add memories
                if (filter === 'all' || filter === 'memories') {
                    memories.forEach(memory => {
                        timeline.push({
                            type: 'memory',
                            id: memory.id,
                            data: memory,
                            timestamp: new Date(memory.date)
                        });
                    });
                }
                
                // Sort by timestamp (newest first)
                timeline.sort((a, b) => b.timestamp - a.timestamp);
                
                resolve(timeline);
            } catch (error) {
                reject(error);
            }
        });
    }

    async searchMessages(coupleId, query) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readonly');
            const store = transaction.objectStore('messages');
            const index = store.index('coupleId');
            const request = index.getAll(coupleId);
            
            request.onsuccess = () => {
                const messages = request.result.filter(message => 
                    message.text && message.text.toLowerCase().includes(query.toLowerCase())
                );
                resolve(messages);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Login helper
    async loginByName(name) {
        const couple = await this.findCouple();
        if (!couple) {
            return null;
        }
        
        const normalizedName = name.trim().toLowerCase();
        const partnerA = couple.partnerAName.toLowerCase();
        const partnerB = couple.partnerBName.toLowerCase();
        
        if (normalizedName === partnerA) {
            return { user: couple.partnerAName, couple };
        } else if (normalizedName === partnerB) {
            return { user: couple.partnerBName, couple };
        }
        
        return null;
    }

    // Export/Import helpers
    async exportData() {
        try {
            const couple = await this.findCouple();
            if (!couple) {
                throw new Error('No couple data found');
            }
            
            const [devices, messages, images, memories, settings] = await Promise.all([
                this.getDevices(couple.id),
                this.getMessages(couple.id),
                this.getAllImages(),
                this.getMemories(couple.id),
                this.getSettings()
            ]);
            
            return {
                couple,
                devices,
                messages,
                images,
                memories,
                settings,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    }

    async importData(data) {
        try {
            // Validate data structure
            if (!data.couple || !data.version) {
                throw new Error('Invalid data format');
            }
            
            // Clear existing data
            await this.clearAllData();
            
            // Import new data
            await this.createCouple(data.couple);
            
            if (data.devices) {
                for (const device of data.devices) {
                    await this.addDevice(device);
                }
            }
            
            if (data.messages) {
                for (const message of data.messages) {
                    await this.saveMessage(message);
                }
            }
            
            if (data.images) {
                for (const image of data.images) {
                    await this.saveImage(image);
                }
            }
            
            if (data.memories) {
                for (const memory of data.memories) {
                    await this.saveMemory(memory);
                }
            }
            
            if (data.settings) {
                await this.updateSettings(data.settings);
            }
            
            console.log('Data imported successfully');
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }

    async clearAllData() {
        const stores = ['couples', 'devices', 'messages', 'images', 'memories', 'settings'];
        
        for (const storeName of stores) {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            await new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }

    // Utility methods
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    async hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async generatePairingToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
}

// Create global instance
window.db = new OurMemoriesDB();
