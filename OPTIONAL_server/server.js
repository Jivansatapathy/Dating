// Our Memories - Optional Server
// Provides WebRTC signaling and encrypted backup storage
// This server is OPTIONAL - the app works fully without it

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const AWS = require('aws-sdk');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || "*",
        methods: ["GET", "POST"]
    }
});

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || "*",
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/our-memories';
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// AWS S3 configuration (optional)
let s3 = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
    });
}

// Database schemas
const pairingSchema = new mongoose.Schema({
    coupleId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) } // 24 hours
});

const signalSchema = new mongoose.Schema({
    coupleId: { type: String, required: true, index: true },
    fromDeviceId: { type: String, required: true },
    toDeviceId: { type: String, required: true },
    signalPayload: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 5 * 60 * 1000) } // 5 minutes
});

const backupSchema = new mongoose.Schema({
    coupleId: { type: String, required: true, index: true },
    objectUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    meta: { type: Object }
});

// Models
const Pairing = mongoose.model('Pairing', pairingSchema);
const Signal = mongoose.model('Signal', signalSchema);
const Backup = mongoose.model('Backup', backupSchema);

// TTL indexes for automatic cleanup
pairingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
signalSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Utility functions
function generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function verifySignature(data, signature, secret) {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(data))
        .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Pairing endpoints
app.post('/api/pair/initiate', async (req, res) => {
    try {
        const { coupleId, pairingTokenHash, deviceInfo } = req.body;
        
        if (!coupleId || !pairingTokenHash) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Store pairing request
        const pairing = new Pairing({
            coupleId,
            tokenHash: pairingTokenHash,
            deviceInfo: deviceInfo || {}
        });

        await pairing.save();

        res.json({ 
            success: true, 
            message: 'Pairing request initiated',
            expiresAt: pairing.expiresAt
        });
    } catch (error) {
        console.error('Pairing initiation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/pair/confirm', async (req, res) => {
    try {
        const { coupleId, pairingTokenHash } = req.body;
        
        if (!coupleId || !pairingTokenHash) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Find and validate pairing request
        const pairing = await Pairing.findOne({
            coupleId,
            tokenHash: pairingTokenHash,
            expiresAt: { $gt: new Date() }
        });

        if (!pairing) {
            return res.status(404).json({ error: 'Invalid or expired pairing token' });
        }

        // Remove the pairing request (one-time use)
        await Pairing.deleteOne({ _id: pairing._id });

        res.json({ 
            success: true, 
            message: 'Pairing confirmed'
        });
    } catch (error) {
        console.error('Pairing confirmation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// WebRTC signaling endpoints
app.post('/api/signal', async (req, res) => {
    try {
        const { coupleId, fromDeviceId, toDeviceId, signalPayload } = req.body;
        
        if (!coupleId || !fromDeviceId || !toDeviceId || !signalPayload) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Store signal for retrieval
        const signal = new Signal({
            coupleId,
            fromDeviceId,
            toDeviceId,
            signalPayload
        });

        await signal.save();

        // Emit to connected devices
        io.to(`couple:${coupleId}`).emit('webrtc-signal', {
            fromDeviceId,
            toDeviceId,
            signalPayload
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Signal storage error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/signals/:coupleId/:deviceId', async (req, res) => {
    try {
        const { coupleId, deviceId } = req.params;
        
        // Get signals for this device
        const signals = await Signal.find({
            coupleId,
            toDeviceId: deviceId,
            expiresAt: { $gt: new Date() }
        });

        // Remove retrieved signals
        await Signal.deleteMany({
            coupleId,
            toDeviceId: deviceId
        });

        res.json({ signals });
    } catch (error) {
        console.error('Signal retrieval error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Backup endpoints
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

app.post('/api/backup', upload.single('backup'), async (req, res) => {
    try {
        const { coupleId, encryptedData } = req.body;
        const file = req.file;
        
        if (!coupleId || (!file && !encryptedData)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let objectUrl;
        
        if (s3 && file) {
            // Upload to S3
            const key = `backups/${coupleId}/${Date.now()}-backup.zip`;
            const params = {
                Bucket: process.env.S3_BUCKET,
                Key: key,
                Body: file.buffer,
                ContentType: 'application/zip',
                ServerSideEncryption: 'AES256'
            };
            
            const result = await s3.upload(params).promise();
            objectUrl = result.Location;
        } else {
            // Store in database (for small backups)
            const backupData = encryptedData || file.buffer.toString('base64');
            const backup = new Backup({
                coupleId,
                objectUrl: `data:application/zip;base64,${backupData}`,
                meta: {
                    size: file ? file.size : encryptedData.length,
                    uploadedAt: new Date()
                }
            });
            await backup.save();
            objectUrl = backup.objectUrl;
        }

        res.json({ 
            success: true, 
            objectUrl,
            message: 'Backup uploaded successfully'
        });
    } catch (error) {
        console.error('Backup upload error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/backup/:coupleId', async (req, res) => {
    try {
        const { coupleId } = req.params;
        
        // Get latest backup for couple
        const backup = await Backup.findOne({ coupleId })
            .sort({ createdAt: -1 });
        
        if (!backup) {
            return res.status(404).json({ error: 'No backup found' });
        }

        if (backup.objectUrl.startsWith('data:')) {
            // Return base64 data
            const base64Data = backup.objectUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename="backup.zip"');
            res.send(buffer);
        } else {
            // Redirect to S3 URL
            res.redirect(backup.objectUrl);
        }
    } catch (error) {
        console.error('Backup retrieval error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-couple', (coupleId) => {
        socket.join(`couple:${coupleId}`);
        console.log(`Client ${socket.id} joined couple ${coupleId}`);
    });

    socket.on('leave-couple', (coupleId) => {
        socket.leave(`couple:${coupleId}`);
        console.log(`Client ${socket.id} left couple ${coupleId}`);
    });

    socket.on('webrtc-signal', async (data) => {
        try {
            const { coupleId, fromDeviceId, toDeviceId, signalPayload } = data;
            
            // Store signal
            const signal = new Signal({
                coupleId,
                fromDeviceId,
                toDeviceId,
                signalPayload
            });
            await signal.save();

            // Forward to target device
            socket.to(`couple:${coupleId}`).emit('webrtc-signal', {
                fromDeviceId,
                toDeviceId,
                signalPayload
            });
        } catch (error) {
            console.error('WebRTC signal error:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Our Memories Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`MongoDB: ${MONGODB_URI}`);
    console.log(`S3: ${s3 ? 'configured' : 'not configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        mongoose.connection.close();
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        mongoose.connection.close();
        process.exit(0);
    });
});
