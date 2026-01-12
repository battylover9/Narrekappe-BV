# Narrekappe BV - VM Deployment Platform
## Deployment Guide

### Prerequisites
- Ubuntu/Debian server
- Node.js 18+ installed
- Proxmox VE server accessible
- Root or sudo access

### Quick Start

#### 1. Install Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
```

#### 2. Configure Environment
```bash
# Copy and edit .env.local with your Proxmox credentials
cp .env.local.example .env.local
nano .env.local
```

Required environment variables:
- `PROXMOX_HOST` - Your Proxmox server IP
- `PROXMOX_USER` - Proxmox username (usually root)
- `PROXMOX_PASSWORD` - Proxmox password
- `ADMIN_USERNAME` - Admin panel username
- `ADMIN_PASSWORD` - Admin panel password

#### 3. Install Dependencies
```bash
npm install
```

#### 4. Build the Application
```bash
npm run build
```

#### 5. Start the Server
```bash
# Production mode
npm start

# Or development mode
npm run dev
```

#### 6. Access the Application
- Student Portal: `http://your-server-ip:3000/stud-dash`
- Admin Panel: `http://your-server-ip:3000/admin`
- Home Page: `http://your-server-ip:3000`

### Systemd Service (Optional)

Create `/etc/systemd/system/narrekappe.service`:

```ini
[Unit]
Description=Narrekappe VM Deployment Platform
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/Narrekappe-BV-main
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
systemctl daemon-reload
systemctl enable narrekappe
systemctl start narrekappe
systemctl status narrekappe
```

### Default Credentials

**Admin Panel:**
- Username: `admin`
- Password: `Admin123!`

**Students:**
- Create accounts via registration page or CSV import
- Username format: first letter + last name (e.g., jdoe)

### Features

#### Student Portal
- Register new accounts
- Login with Proxmox credentials
- Deploy VMs from templates
- Manage active VMs (start/stop/delete)
- Access VM console via noVNC

#### Admin Panel
- Monitor all VMs
- CSV bulk user import
- Real-time resource usage
- System health dashboard

### VM Templates Setup

Place your VM templates in Proxmox:
```bash
# Example: chronos template
qm create 9000 --name chronos-template --memory 2048 --net0 virtio,bridge=vmbr0
qm importdisk 9000 chronos.qcow2 local-lvm
qm set 9000 --scsihw virtio-scsi-pci --scsi0 local-lvm:vm-9000-disk-0
qm template 9000
```

### Troubleshooting

**404 Errors on API routes:**
- Check that `pages/api` is lowercase (not `pages/API`)
- Run `rm -rf .next && npm run build`

**SSH Connection Failed:**
- Verify Proxmox credentials in `.env.local`
- Test SSH access: `ssh root@your-proxmox-ip`

**VM Deployment Fails:**
- Check Proxmox storage has space
- Verify template exists
- Check Proxmox logs: `/var/log/pve/tasks/`

**Port Already in Use:**
- Change PORT in `.env.local`
- Or stop other services on port 3000

### Security Notes

- **Change default passwords** immediately
- Use strong passwords for admin panel
- Run behind reverse proxy (nginx/Apache) for HTTPS
- Enable firewall rules
- Regular backups of Proxmox and application

### Support

For issues or questions:
- Check logs: `journalctl -u narrekappe -f`
- Review Proxmox logs
- Check network connectivity
