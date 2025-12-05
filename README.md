# Narrekappe BV - VM Deployer

A Next.js web application for deploying virtual machines from AWS S3 to Proxmox.

## Features

- Browse available VMs from S3 bucket
- One-click VM deployment
- Start/Stop/Delete VMs
- Direct console access
- User management

## Prerequisites

- Proxmox server at 192.168.205.30
- S3 bucket mounted at `/mnt/s3-bucket/vulnerable-machines`
- Node.js 18+

## Installation

### On Proxmox Server:

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

### Using PM2 (Recommended)

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

### Using systemd

Create `/etc/systemd/system/narrekappe-vm-deployer.service`:

```ini
[Unit]
Description=Narrekappe VM Deployer
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/Narrekappe-BV-main
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:
```bash
systemctl daemon-reload
systemctl enable narrekappe-vm-deployer
systemctl start narrekappe-vm-deployer
```

## API Endpoints

- `GET /api/vms` - List available VMs
- `GET /api/deployment` - List deployed VMs
- `POST /api/deploy` - Deploy a VM
- `POST /api/start` - Start a VM
- `POST /api/stop` - Stop a VM
- `POST /api/delete` - Delete a VM

## Configuration

Default settings in API files:
- **S3_PATH**: `/mnt/s3-bucket/vulnerable-machines`
- **STORAGE**: `local-lvm`
- **MEMORY**: `2048` MB
- **NETWORK**: `virtio,bridge=vmbr0`

## Project Structure

```
Narrekappe-BV-main/
├── pages/
│   ├── API/           # Backend API endpoints
│   │   ├── deploy.js
│   │   ├── vms.js
│   │   ├── deployment.js
│   │   ├── start.js
│   │   ├── stop.js
│   │   └── delete.js
│   ├── styles/        # CSS styles
│   ├── admin.js       # Admin pages
│   ├── portal.js      # Student portal
│   └── _app.js        # Next.js app wrapper
├── html/              # Static HTML files
├── package.json       # Dependencies
└── next.config.js     # Next.js configuration
```

## Troubleshooting

### S3 mount not accessible
```bash
df -h | grep s3
ls -lh /mnt/s3-bucket/vulnerable-machines/
```

### Proxmox commands not working
```bash
pvesm status
qm list
```

### Check logs
```bash
pm2 logs narrekappe-vm-deployer
# or
journalctl -u narrekappe-vm-deployer -f
```

## License

Narrekappe BV © 2024
