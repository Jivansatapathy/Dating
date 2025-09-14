# Our Memories Server (Optional)

This is an **optional** server component for the Our Memories app. The main app works completely without this server - it only provides additional features like WebRTC signaling and encrypted backup storage.

## Features

- **WebRTC Signaling**: Helps devices establish P2P connections for real-time sync
- **Encrypted Backup Storage**: Stores encrypted backups in MongoDB or AWS S3
- **Device Pairing**: Facilitates remote device pairing with secure tokens
- **Automatic Cleanup**: TTL indexes automatically clean up expired data

## Important Notes

- **This server is OPTIONAL** - the app works fully offline without it
- **No plaintext data storage** - only encrypted payloads and ephemeral tokens
- **Privacy-first design** - server never sees your actual messages or images
- **Automatic data expiration** - all stored data has TTL and is automatically deleted

## Quick Start

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB** (if running locally):
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or install MongoDB locally
   ```

4. **Start the server**:
   ```bash
   npm run dev
   ```

### Production Deployment

#### Option 1: Render.com

1. **Connect your repository** to Render
2. **Set environment variables**:
   - `NODE_ENV=production`
   - `MONGODB_URI=your_mongodb_connection_string`
   - `ALLOWED_ORIGINS=your_app_domain`
   - (Optional) AWS S3 credentials for backup storage

3. **Deploy** - Render will automatically build and deploy

#### Option 2: Vercel Serverless

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set environment variables** in Vercel dashboard

#### Option 3: Docker

1. **Build image**:
   ```bash
   docker build -t our-memories-server .
   ```

2. **Run container**:
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e MONGODB_URI=your_mongodb_uri \
     -e ALLOWED_ORIGINS=your_app_domain \
     our-memories-server
   ```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | Environment (development/production) |
| `PORT` | No | Server port (default: 3000) |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of allowed origins |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `AWS_ACCESS_KEY_ID` | No | AWS access key for S3 backup storage |
| `AWS_SECRET_ACCESS_KEY` | No | AWS secret key for S3 backup storage |
| `AWS_REGION` | No | AWS region (default: us-east-1) |
| `S3_BUCKET` | No | S3 bucket name for backups |
| `SIGNALING_SECRET` | No | Secret for request signing |

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Pairing
- `POST /api/pair/initiate` - Initiate device pairing
- `POST /api/pair/confirm` - Confirm device pairing

### WebRTC Signaling
- `POST /api/signal` - Store and forward WebRTC signals
- `GET /api/signals/:coupleId/:deviceId` - Retrieve signals for device

### Backup Storage
- `POST /api/backup` - Upload encrypted backup
- `GET /api/backup/:coupleId` - Download latest backup

## WebSocket Events

### Client → Server
- `join-couple` - Join a couple's room
- `leave-couple` - Leave a couple's room
- `webrtc-signal` - Send WebRTC signaling data

### Server → Client
- `webrtc-signal` - Receive WebRTC signaling data

## Database Schema

### Pairings Collection
```javascript
{
  coupleId: String,
  tokenHash: String, // SHA-256 hash of pairing token
  createdAt: Date,
  expiresAt: Date // TTL: 24 hours
}
```

### Signals Collection
```javascript
{
  coupleId: String,
  fromDeviceId: String,
  toDeviceId: String,
  signalPayload: Object, // WebRTC signaling data
  createdAt: Date,
  expiresAt: Date // TTL: 5 minutes
}
```

### Backups Collection
```javascript
{
  coupleId: String,
  objectUrl: String, // S3 URL or base64 data
  createdAt: Date,
  meta: Object // Backup metadata
}
```

## Security Features

- **Rate limiting**: 100 requests per 15 minutes per IP
- **CORS protection**: Configurable allowed origins
- **Helmet.js**: Security headers
- **TTL indexes**: Automatic data expiration
- **No plaintext storage**: Only encrypted payloads
- **Request validation**: Input sanitization

## Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### Logs
The server logs all important events to console. In production, consider using a logging service.

### Metrics
Consider adding monitoring tools like:
- New Relic
- DataDog
- Prometheus + Grafana

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check `MONGODB_URI` is correct
   - Ensure MongoDB is running
   - Check network connectivity

2. **CORS Errors**
   - Verify `ALLOWED_ORIGINS` includes your app domain
   - Check browser console for specific CORS errors

3. **WebRTC Signaling Not Working**
   - Ensure both devices are connected to the server
   - Check that devices are in the same couple room
   - Verify network connectivity

4. **Backup Upload Fails**
   - Check file size limits (100MB max)
   - Verify S3 credentials if using S3 storage
   - Check MongoDB connection for database storage

### Debug Mode

Set `NODE_ENV=development` for detailed logging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see main project license.

## Support

For issues with the server:
1. Check the troubleshooting section
2. Review server logs
3. Verify environment variables
4. Test with a minimal configuration

Remember: This server is optional. If you're having issues, the app will work perfectly without it!
