#!/bin/bash
# setup-production.sh
# Production setup script for Narrekappe VM Deployer

set -e

echo "========================================"
echo "Narrekappe VM Deployer - Production Setup"
echo "========================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root"
  exit 1
fi

# Configuration
APP_DIR="/root/Narrekappe-BV-main"
SERVICE_NAME="narrekappe-vm-deployer"
CLEANUP_TOKEN=$(openssl rand -hex 32)

echo ""
echo "1. Installing dependencies..."
cd "$APP_DIR"
npm install --production

echo ""
echo "2. Building application..."
npm run build

echo ""
echo "3. Setting up environment variables..."
cat > "$APP_DIR/.env.local" << EOF
# Proxmox Connection
PROXMOX_HOST=192.168.205.30
PROXMOX_USER=root
PROXMOX_REALM=pve

# Authentication (choose one)
# PROXMOX_PASSWORD=your_password_here
# PROXMOX_SSH_KEY=/root/.ssh/id_rsa

# Cleanup Token (for automated cleanup endpoint)
CLEANUP_TOKEN=$CLEANUP_TOKEN

# Node Environment
NODE_ENV=production
EOF

echo ""
echo "4. Setting up systemd service..."
cat > "/etc/systemd/system/${SERVICE_NAME}.service" << 'EOF'
[Unit]
Description=Narrekappe VM Deployer
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/Narrekappe-BV-main
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=narrekappe-vm

# Security hardening
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

echo ""
echo "5. Setting up automated VM cleanup cron job..."
# Create cleanup script
cat > "/usr/local/bin/narrekappe-cleanup.sh" << EOF
#!/bin/bash
# Automated cleanup of expired VMs

CLEANUP_TOKEN="$CLEANUP_TOKEN"
CLEANUP_URL="http://localhost:3000/api/vm/cleanup"

curl -s -X POST "\$CLEANUP_URL" \\
  -H "x-cleanup-token: \$CLEANUP_TOKEN" \\
  >> /var/log/narrekappe-cleanup.log 2>&1

echo "Cleanup completed at \$(date)" >> /var/log/narrekappe-cleanup.log
EOF

chmod +x /usr/local/bin/narrekappe-cleanup.sh

# Add cron job (runs every 30 minutes)
echo "*/30 * * * * /usr/local/bin/narrekappe-cleanup.sh" | crontab -

echo ""
echo "6. Setting up log rotation..."
cat > "/etc/logrotate.d/narrekappe" << 'EOF'
/var/log/narrekappe-cleanup.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
}
EOF

echo ""
echo "7. Starting and enabling service..."
systemctl daemon-reload
systemctl enable "${SERVICE_NAME}"
systemctl start "${SERVICE_NAME}"

echo ""
echo "8. Setting up firewall (if ufw is installed)..."
if command -v ufw &> /dev/null; then
    ufw allow 3000/tcp comment 'Narrekappe VM Deployer'
    echo "Firewall rule added"
else
    echo "UFW not installed, skipping firewall setup"
fi

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Important Information:"
echo "----------------------"
echo "Application URL: http://192.168.205.30:3000"
echo "Cleanup Token: $CLEANUP_TOKEN"
echo ""
echo "Service Commands:"
echo "  systemctl status $SERVICE_NAME"
echo "  systemctl restart $SERVICE_NAME"
echo "  journalctl -u $SERVICE_NAME -f"
echo ""
echo "Manual Cleanup:"
echo "  curl -X POST http://localhost:3000/api/vm/cleanup -H \"x-cleanup-token: $CLEANUP_TOKEN\""
echo ""
echo "Next Steps:"
echo "1. Edit /root/Narrekappe-BV-main/.env.local and set your Proxmox password or SSH key"
echo "2. Restart the service: systemctl restart $SERVICE_NAME"
echo "3. Check status: systemctl status $SERVICE_NAME"
echo ""
echo "Automated cleanup runs every 30 minutes via cron"
echo "Cleanup logs: /var/log/narrekappe-cleanup.log"
echo "========================================"
