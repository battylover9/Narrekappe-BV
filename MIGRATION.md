# Migration Guide: v1.0 → v2.0 (Security Enhanced)

This guide helps you upgrade from the original Narrekappe VM Deployer to the security-enhanced version.

## Overview of Changes

### Major Security Improvements
1. ✅ Fixed insecure authentication method
2. ✅ Added input sanitization and shell escaping
3. ✅ Implemented rate limiting
4. ✅ Added comprehensive logging
5. ✅ SSH key authentication support
6. ✅ Automated cleanup system
7. ✅ Resource validation before deployment

### Breaking Changes
- **Authentication**: The password-testing authentication method has been replaced with SSH connection testing
- **Environment Variables**: New variables required (.env.local format)
- **API Responses**: Enhanced error messages and status codes
- **Dependencies**: Updated ssh2 library and added new dependencies

## Pre-Migration Checklist

- [ ] Backup current installation
- [ ] Note all active VMs
- [ ] Document current configuration
- [ ] Test in development environment first
- [ ] Schedule maintenance window
- [ ] Notify users of downtime

## Step-by-Step Migration

### 1. Backup Current System

```bash
# Stop current service
systemctl stop narrekappe-vm-deployer  # or: pm2 stop narrekappe-vm-deployer

# Backup application directory
cp -r /root/Narrekappe-BV-main /root/Narrekappe-BV-main.backup

# Export list of active VMs
qm list > /root/active-vms-backup.txt

# Backup configuration
cp /root/Narrekappe-BV-main/.env* /root/env-backup/ 2>/dev/null || true
```

### 2. Pull Latest Code

```bash
cd /root/Narrekappe-BV-main

# If using git
git fetch origin
git checkout main
git pull origin main

# Or download new version
wget https://your-repo/archive/v2.0.zip
unzip v2.0.zip
cp -r Narrekappe-BV-main-v2.0/* /root/Narrekappe-BV-main/
```

### 3. Install New Dependencies

```bash
cd /root/Narrekappe-BV-main

# Remove old node_modules
rm -rf node_modules package-lock.json

# Install fresh dependencies
npm install

# Verify installation
npm list ssh2
```

### 4. Configure Environment Variables

```bash
# Create new environment file from example
cp .env.example .env.local

# Edit configuration
nano .env.local
```

**Minimum required configuration**:
```bash
PROXMOX_HOST=192.168.205.30
PROXMOX_USER=root
PROXMOX_REALM=pve

# Choose ONE authentication method:
# Option 1: SSH Key (recommended)
PROXMOX_SSH_KEY=/root/.ssh/proxmox_key

# Option 2: Password (if keys not available)
# PROXMOX_PASSWORD=your_password

# Generate cleanup token
CLEANUP_TOKEN=$(openssl rand -hex 32)

NODE_ENV=production
```

**Set proper permissions**:
```bash
chmod 600 .env.local
chown root:root .env.local
```

### 5. Set Up SSH Key Authentication (Recommended)

```bash
# Generate new ED25519 key
ssh-keygen -t ed25519 -f /root/.ssh/proxmox_key -N ""

# Set permissions
chmod 600 /root/.ssh/proxmox_key
chmod 644 /root/.ssh/proxmox_key.pub

# Copy to Proxmox
ssh-copy-id -i /root/.ssh/proxmox_key.pub root@192.168.205.30

# Test connection
ssh -i /root/.ssh/proxmox_key root@192.168.205.30 'qm list'

# Update .env.local
echo "PROXMOX_SSH_KEY=/root/.ssh/proxmox_key" >> .env.local
```

### 6. Build Application

```bash
cd /root/Narrekappe-BV-main

# Build production version
npm run build

# Verify build
ls -la .next/
```

### 7. Update Service Configuration

#### If using systemd:

```bash
# Stop old service
systemctl stop narrekappe-vm-deployer

# Update service file with new configuration
cat > /etc/systemd/system/narrekappe-vm-deployer.service << 'EOF'
[Unit]
Description=Narrekappe VM Deployer (Security Enhanced)
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

# Reload and restart
systemctl daemon-reload
systemctl start narrekappe-vm-deployer
systemctl enable narrekappe-vm-deployer
```

#### If using PM2:

```bash
# Stop old process
pm2 stop narrekappe-vm-deployer
pm2 delete narrekappe-vm-deployer

# Start with new configuration
cd /root/Narrekappe-BV-main
pm2 start npm --name "narrekappe-vm-deployer" -- start
pm2 save
```

### 8. Set Up Automated Cleanup

```bash
# Create cleanup script
cat > /usr/local/bin/narrekappe-cleanup.sh << 'EOF'
#!/bin/bash
# Automated VM cleanup

CLEANUP_TOKEN="your_token_from_env_file"
CLEANUP_URL="http://localhost:3000/api/vm/cleanup"

curl -s -X POST "$CLEANUP_URL" \
  -H "x-cleanup-token: $CLEANUP_TOKEN" \
  >> /var/log/narrekappe-cleanup.log 2>&1

echo "Cleanup completed at $(date)" >> /var/log/narrekappe-cleanup.log
EOF

# Make executable
chmod +x /usr/local/bin/narrekappe-cleanup.sh

# Update with actual token
CLEANUP_TOKEN=$(grep CLEANUP_TOKEN /root/Narrekappe-BV-main/.env.local | cut -d= -f2)
sed -i "s/your_token_from_env_file/$CLEANUP_TOKEN/g" /usr/local/bin/narrekappe-cleanup.sh

# Add to crontab (every 30 minutes)
(crontab -l 2>/dev/null; echo "*/30 * * * * /usr/local/bin/narrekappe-cleanup.sh") | crontab -

# Create log file
touch /var/log/narrekappe-cleanup.log
chmod 644 /var/log/narrekappe-cleanup.log

# Set up log rotation
cat > /etc/logrotate.d/narrekappe << 'EOF'
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
```

### 9. Verify Migration

```bash
# Check service status
systemctl status narrekappe-vm-deployer
# or
pm2 status

# View logs
journalctl -u narrekappe-vm-deployer -f
# or
pm2 logs narrekappe-vm-deployer

# Test API endpoint
curl -I http://localhost:3000/

# Test deployment (replace with actual values)
curl -X POST http://localhost:3000/api/vm/deploy \
  -H "Content-Type: application/json" \
  -d '{"vmName":"test-vm","userName":"testuser"}'

# Check rate limiting headers
curl -I http://localhost:3000/api/vm/deploy

# Test cleanup endpoint
curl -X POST http://localhost:3000/api/vm/cleanup \
  -H "x-cleanup-token: YOUR_TOKEN"
```

### 10. Post-Migration Tasks

```bash
# Update firewall if needed
ufw allow 3000/tcp

# Verify cron job
crontab -l

# Check cleanup log
cat /var/log/narrekappe-cleanup.log

# Monitor for 24 hours
watch -n 60 'journalctl -u narrekappe-vm-deployer --since "1 hour ago" | tail -20'
```

## Rollback Procedure

If issues occur, rollback to previous version:

```bash
# Stop new version
systemctl stop narrekappe-vm-deployer

# Restore backup
rm -rf /root/Narrekappe-BV-main
mv /root/Narrekappe-BV-main.backup /root/Narrekappe-BV-main

# Restore old environment
cp /root/env-backup/.env* /root/Narrekappe-BV-main/

# Restart old version
cd /root/Narrekappe-BV-main
npm install
systemctl start narrekappe-vm-deployer

# Remove cleanup cron
crontab -l | grep -v narrekappe-cleanup | crontab -
```

## Testing Migration in Development

Before production migration, test in development:

```bash
# Clone to test environment
cp -r /root/Narrekappe-BV-main /root/Narrekappe-BV-test
cd /root/Narrekappe-BV-test

# Apply changes
# ... follow migration steps ...

# Run on different port
npm run dev

# Test all functionality
# Then apply to production
```

## Common Migration Issues

### Issue: SSH Key Authentication Fails

**Solution**:
```bash
# Check key permissions
ls -la /root/.ssh/proxmox_key

# Should be 600
chmod 600 /root/.ssh/proxmox_key

# Test SSH connection
ssh -i /root/.ssh/proxmox_key -v root@192.168.205.30
```

### Issue: Service Won't Start

**Solution**:
```bash
# Check logs
journalctl -u narrekappe-vm-deployer -n 50

# Verify environment
cat /root/Narrekappe-BV-main/.env.local

# Test build manually
cd /root/Narrekappe-BV-main
npm run build
npm start
```

### Issue: Cleanup Not Running

**Solution**:
```bash
# Test cleanup manually
/usr/local/bin/narrekappe-cleanup.sh

# Check cron
crontab -l

# View cron log
grep CRON /var/log/syslog
```

### Issue: Rate Limiting Too Strict

**Solution**:
```bash
# Temporarily increase limits
# Edit lib/rateLimit.js or add to .env.local
echo "RATE_LIMIT_MAX_DEPLOYS=10" >> .env.local

# Restart service
systemctl restart narrekappe-vm-deployer
```

## Migration Validation

After migration, verify:

- [ ] Application starts successfully
- [ ] Users can authenticate
- [ ] VMs can be deployed
- [ ] VMs can be stopped/deleted
- [ ] Rate limiting is working
- [ ] Cleanup cron is running
- [ ] Logs are being generated
- [ ] No security warnings in logs
- [ ] SSH key authentication works
- [ ] Old VMs are still accessible

## Support

If you encounter issues:
1. Check logs: `journalctl -u narrekappe-vm-deployer -f`
2. Review SECURITY.md for best practices
3. Consult README.md troubleshooting section
4. Rollback if critical issues occur

## Timeline

Recommended migration timeline:
- **Week 1**: Review changes, test in development
- **Week 2**: Schedule maintenance, prepare backups
- **Week 3**: Execute migration during low-usage period
- **Week 4**: Monitor, validate, and optimize

## Success Criteria

Migration is successful when:
- All VMs deploy without errors
- No authentication failures
- Cleanup runs automatically
- Logs show no security warnings
- Rate limiting prevents abuse
- System performance is maintained or improved
