# Narrekappe BV - VM Deployer (Security Enhanced)

A Next.js web application for deploying virtual machines from AWS S3 to Proxmox with comprehensive security features, automated cleanup, and rate limiting.

## 🔒 Security Features

- **Input Sanitization**: All user inputs are sanitized to prevent command injection
- **Proper Shell Escaping**: Command arguments are properly escaped
- **SSH Key Authentication**: Support for SSH key authentication (recommended over passwords)
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse
- **Secure User Authentication**: Fixed authentication method (no longer changes passwords)
- **Resource Validation**: Checks storage space and VM limits before deployment
- **Comprehensive Logging**: All operations are logged for audit trails

## Features

- Browse available VMs from S3 bucket
- One-click VM deployment with security checks
- Automated cleanup of expired VMs
- Rate-limited API endpoints
- Start/Stop/Delete VMs with ownership verification
- Direct console access
- User management with proper validation
- Comprehensive error handling and logging

## Prerequisites

- Proxmox server at 192.168.205.30
- S3 bucket mounted at `/mnt/s3-bucket/vulnerable-machines`
- Node.js 18+
- SSH access to Proxmox server

## Quick Installation

### Automated Setup (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd Narrekappe-BV-main

# Run automated setup script
chmod +x setup-production.sh
sudo ./setup-production.sh
```

The script will:
- Install dependencies
- Build the application
- Create systemd service
- Set up automated cleanup (runs every 30 minutes)
- Configure log rotation
- Generate secure cleanup token

### Manual Installation

#### On Proxmox Server:

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Clone the repository
git clone <your-repo-url>
cd Narrekappe-BV-main

# Install dependencies
npm install

# Build the application
npm run build

# Create environment file
cat > .env.local << EOF
PROXMOX_HOST=192.168.205.30
PROXMOX_USER=root
PROXMOX_REALM=pve
# Use SSH key (recommended)
PROXMOX_SSH_KEY=/root/.ssh/id_rsa
# Or use password (less secure)
# PROXMOX_PASSWORD=your_password
CLEANUP_TOKEN=$(openssl rand -hex 32)
NODE_ENV=production
EOF

# Start the server
npm start
```

Access at: http://192.168.205.30:3000

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Production Deployment

### Using Systemd (Automated by setup script)

The setup script creates a systemd service that:
- Starts automatically on boot
- Restarts on failure
- Logs to systemd journal

```bash
# View service status
systemctl status narrekappe-vm-deployer

# View logs
journalctl -u narrekappe-vm-deployer -f

# Restart service
systemctl restart narrekappe-vm-deployer
```

### Using PM2 (Alternative)

```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start npm --name "narrekappe-vm-deployer" -- start

# Enable startup on boot
pm2 startup
pm2 save

# View status
pm2 status

# View logs
pm2 logs narrekappe-vm-deployer
```

## Automated Cleanup

The system includes automated cleanup of expired VMs:

- **Cron Job**: Runs every 30 minutes
- **Expiration**: VMs expire after 2 hours
- **Logs**: `/var/log/narrekappe-cleanup.log`

Manual cleanup:
```bash
curl -X POST http://localhost:3000/api/vm/cleanup \
  -H "x-cleanup-token: YOUR_CLEANUP_TOKEN"
```

## API Endpoints

### VM Management
- `GET /api/vm/vms` - List available VM templates
- `GET /api/vm/deployment` - List deployed VMs for user
- `POST /api/vm/deploy` - Deploy a VM (rate limited: 3 per minute)
- `POST /api/vm/start` - Start a VM
- `POST /api/vm/stop` - Stop a VM
- `POST /api/vm/delete` - Delete a VM
- `POST /api/vm/cleanup` - Cleanup expired VMs (requires token)

### User Management
- `POST /api/auth/login` - User authentication
- `GET /api/proxmox/users` - List users (admin)
- `POST /api/proxmox/import-users` - Import users (admin)

### Rate Limiting
API endpoints have rate limiting to prevent abuse:
- **Deploy**: 3 requests per minute per user
- **Other endpoints**: 10 requests per minute per IP

Headers returned:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets
- `Retry-After`: Seconds to wait (when rate limited)

## Configuration

### Environment Variables (.env.local)

```bash
# Required
PROXMOX_HOST=192.168.205.30
PROXMOX_USER=root
PROXMOX_REALM=pve

# Authentication (choose one - SSH key recommended)
PROXMOX_SSH_KEY=/root/.ssh/id_rsa
# PROXMOX_PASSWORD=your_password

# Cleanup token for automated cleanup
CLEANUP_TOKEN=your_secure_random_token

# Node environment
NODE_ENV=production
```

### Default VM Settings
Settings in API files (can be customized):
- **S3_PATH**: `/mnt/s3-bucket/vulnerable-machines`
- **STORAGE**: `local-lvm`
- **MEMORY**: `2048` MB (configurable, 512-16384 MB)
- **CORES**: `2` (configurable, 1-8 cores)
- **NETWORK**: `virtio,bridge=vmbr1` (isolated network)
- **TIMEOUT**: `2 hours` per VM session

## Project Structure

```
Narrekappe-BV-main/
├── pages/
│   ├── API/              # Backend API endpoints
│   │   ├── vm/
│   │   │   ├── deploy.js        # Deploy VMs (rate limited)
│   │   │   ├── cleanup.js       # Automated cleanup (NEW)
│   │   │   ├── vms.js           # List templates
│   │   │   ├── deployment.js    # List deployments
│   │   │   ├── start.js         # Start VM
│   │   │   ├── stop.js          # Stop VM
│   │   │   └── delete.js        # Delete VM
│   │   ├── auth/
│   │   │   └── login.js         # User authentication
│   │   └── proxmox/
│   │       ├── users.js         # User management
│   │       └── import-users.js  # Bulk user import
│   ├── styles/           # CSS styles
│   ├── admin.js          # Admin pages
│   ├── portal.js         # Student portal
│   └── _app.js           # Next.js app wrapper
├── lib/
│   ├── proxmoxApi.js     # Proxmox API with security (ENHANCED)
│   └── rateLimit.js      # Rate limiting middleware (NEW)
├── html/                 # Static HTML files
├── setup-production.sh   # Automated setup script (NEW)
├── package.json          # Dependencies
└── next.config.js        # Next.js configuration
```

## Security Best Practices

### 1. SSH Key Authentication (Recommended)
```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -f /root/.ssh/proxmox_key

# Copy public key to Proxmox authorized_keys
ssh-copy-id -i /root/.ssh/proxmox_key.pub root@192.168.205.30

# Update .env.local
echo "PROXMOX_SSH_KEY=/root/.ssh/proxmox_key" >> .env.local
```

### 2. Secure the Cleanup Token
```bash
# Generate strong token
openssl rand -hex 32

# Store securely in .env.local
echo "CLEANUP_TOKEN=your_generated_token" >> .env.local

# Protect the file
chmod 600 /root/Narrekappe-BV-main/.env.local
```

### 3. Network Isolation
- VMs are deployed on `vmbr1` (isolated network)
- Prevents vulnerable VMs from accessing main network
- Configure firewall rules on Proxmox accordingly

### 4. Regular Updates
```bash
# Update dependencies
npm audit
npm update

# Rebuild application
npm run build
systemctl restart narrekappe-vm-deployer
```

## Monitoring and Logs

### Application Logs
```bash
# Systemd logs
journalctl -u narrekappe-vm-deployer -f

# PM2 logs (if using PM2)
pm2 logs narrekappe-vm-deployer
```

### Cleanup Logs
```bash
# View cleanup log
tail -f /var/log/narrekappe-cleanup.log

# Check cleanup cron job
crontab -l
```

### VM Statistics
```bash
# List all VMs
qm list

# Check storage usage
pvesm status

# Monitor system resources
htop
```

## Troubleshooting

### S3 mount not accessible
```bash
df -h | grep s3
ls -lh /mnt/s3-bucket/vulnerable-machines/

# Remount if needed
mount -a
```

### Proxmox commands not working
```bash
# Check Proxmox services
systemctl status pve-cluster
systemctl status pvedaemon

# Verify storage
pvesm status

# List VMs
qm list
```

### SSH Connection Issues
```bash
# Test SSH connection
ssh -i /root/.ssh/proxmox_key root@192.168.205.30 'qm list'

# Check SSH key permissions
ls -la /root/.ssh/
chmod 600 /root/.ssh/proxmox_key
```

### Application Not Starting
```bash
# Check service status
systemctl status narrekappe-vm-deployer

# View errors
journalctl -u narrekappe-vm-deployer -n 50

# Verify environment
cat /root/Narrekappe-BV-main/.env.local

# Test build
cd /root/Narrekappe-BV-main
npm run build
```

### Rate Limiting Issues
```bash
# Check rate limit headers in response
curl -I http://localhost:3000/api/vm/deploy

# Clear rate limit (restart application)
systemctl restart narrekappe-vm-deployer
```

### Cleanup Not Running
```bash
# Check cron job
crontab -l

# Test manual cleanup
curl -X POST http://localhost:3000/api/vm/cleanup \
  -H "x-cleanup-token: YOUR_TOKEN"

# Check cleanup log
cat /var/log/narrekappe-cleanup.log
```

## Performance Optimization

### Resource Limits
- Maximum concurrent deployments: Limited by rate limiting (3/min per user)
- VM timeout: 2 hours (configurable)
- Storage check: Validates before deployment
- Memory allocation: 512MB - 16GB per VM

### Cleanup Schedule
```bash
# Adjust cleanup frequency (default: every 30 minutes)
crontab -e

# More frequent (every 15 minutes)
*/15 * * * * /usr/local/bin/narrekappe-cleanup.sh

# Less frequent (every hour)
0 * * * * /usr/local/bin/narrekappe-cleanup.sh
```

## Contributing

When contributing, please ensure:
1. All inputs are properly sanitized
2. Shell commands use proper escaping
3. Error handling is comprehensive
4. Logging is added for important operations
5. Rate limits are appropriate for the endpoint
6. Tests are updated

## Security Improvements (Changelog)

### Version 2.0 (Current)
- ✅ Fixed authentication (no longer changes passwords)
- ✅ Added input sanitization for all user inputs
- ✅ Implemented proper shell argument escaping
- ✅ Added SSH key authentication support
- ✅ Implemented rate limiting on API endpoints
- ✅ Added comprehensive logging system
- ✅ Automated cleanup of expired VMs
- ✅ Storage space validation before deployment
- ✅ Improved error handling and reporting
- ✅ Added resource limit checks
- ✅ Created automated setup script

### Version 1.0 (Original)
- Basic VM deployment
- Simple user authentication
- Manual VM management

## License

Narrekappe BV © 2024

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs: `journalctl -u narrekappe-vm-deployer -f`
3. Check cleanup logs: `/var/log/narrekappe-cleanup.log`
4. Contact system administrator
