# Security Guide - Narrekappe VM Deployer

## Overview

This document outlines the security improvements made to the Narrekappe VM Deployer and provides best practices for secure deployment and operation.

## Security Vulnerabilities Fixed

### 1. Command Injection Prevention

**Previous Issue**: User inputs were directly interpolated into shell commands without sanitization.

**Fix Implemented**:
```javascript
// Before (VULNERABLE)
await execSSH(`qm create ${vmid} --name "${vmDisplayName}"`);

// After (SECURE)
await execSSH(`qm create ${vmid} --name ${escapeShellArg(vmDisplayName)}`);
```

**Implementation**:
- All user inputs are sanitized using `sanitizeInput()` function
- Different sanitization types for different input types (alphanumeric, username, path, numeric)
- Shell arguments are properly escaped using `escapeShellArg()` function
- Removes or escapes dangerous characters: `;`, `|`, `&`, `$`, backticks, etc.

### 2. Insecure Authentication Method

**Previous Issue**: Authentication tested by attempting to change user passwords, which:
- Could actually change passwords if successful
- Exposed system to password manipulation
- Was unreliable and dangerous

**Fix Implemented**:
```javascript
// Before (INSECURE - changes passwords!)
const result = await execSSH(`pveum passwd ${userid} --password "${password}"`);

// After (SECURE - tests with SSH connection)
const testConn = new Client();
testConn.connect({
  host: PROXMOX_HOST,
  username: userid,
  password: password
});
// Test succeeds without modifying system
```

**Implementation**:
- Creates temporary SSH connection to test credentials
- No system modifications during authentication
- Proper timeout handling
- Generic error messages to prevent user enumeration

### 3. No Rate Limiting

**Previous Issue**: API endpoints had no rate limiting, allowing:
- Resource exhaustion attacks
- Excessive VM deployments
- Denial of service

**Fix Implemented**:
- Rate limiting middleware for all API endpoints
- Configurable limits per endpoint
- Response headers indicate limit status
- 429 status code with retry-after header

**Configuration**:
```javascript
// Deploy endpoint: max 3 deploys per minute per user
export default withRateLimit(handler, {
  windowMs: 60 * 1000,
  maxRequests: 3,
  keyGenerator: (req) => req.body.userName
});
```

### 4. Insufficient Error Handling

**Previous Issue**: Silent failures with empty catch blocks:
```javascript
try {
  await execSSH('command');
} catch {} // Silent failure - no logging, no handling
```

**Fix Implemented**:
- Comprehensive error handling
- Structured logging with context
- Proper error propagation
- Cleanup on failure

**Example**:
```javascript
try {
  await execSSH('command');
} catch (error) {
  log('error', 'Operation failed', { context, error: error.message });
  // Cleanup code
  throw new Error('User-friendly message');
}
```

### 5. No Resource Validation

**Previous Issue**: No checks for:
- Available storage space
- Existing VM conflicts
- Resource limits

**Fix Implemented**:
```javascript
// Check storage before deployment
const storage = await checkStorageSpace('local-lvm');
if (storage.available < requiredSpace) {
  throw new Error('Insufficient storage space');
}

// Check for existing VMs
const activeVMs = await checkUserActiveVMs(username);
if (activeVMs.length > 0) {
  throw new Error('User already has active VMs');
}
```

### 6. No Automated Cleanup

**Previous Issue**: VMs expired but remained running, wasting resources

**Fix Implemented**:
- Automated cleanup cron job (every 30 minutes)
- Secure token-based cleanup endpoint
- Metadata tracking for expiration
- Comprehensive logging

## Authentication & Authorization

### SSH Key Authentication (Recommended)

**Setup**:
```bash
# Generate ED25519 key (more secure than RSA)
ssh-keygen -t ed25519 -f /root/.ssh/proxmox_key -N ""

# Copy to Proxmox
ssh-copy-id -i /root/.ssh/proxmox_key.pub root@192.168.205.30

# Configure application
echo "PROXMOX_SSH_KEY=/root/.ssh/proxmox_key" >> .env.local
```

**Benefits**:
- No password in environment variables
- More secure than password auth
- Key rotation is easier
- Can be revoked without password change

### Password Authentication (Fallback)

If SSH keys cannot be used:
```bash
# Use strong password (minimum 16 characters)
openssl rand -base64 24

# Store securely in environment
echo "PROXMOX_PASSWORD='your_strong_password'" >> .env.local

# Protect file
chmod 600 .env.local
chown root:root .env.local
```

### User Authentication

Users authenticate via:
1. Username/password submitted to `/api/auth/login`
2. Credentials validated against Proxmox user database
3. SSH connection test (no password changes)
4. Session token returned on success

## Input Validation

### Sanitization Functions

```javascript
// Alphanumeric: letters, numbers, hyphens, underscores
sanitizeInput(input, 'alphanumeric')

// Username: includes dots for email format
sanitizeInput(input, 'username')

// Numeric: only numbers
sanitizeInput(input, 'numeric')

// Path: safe path characters
sanitizeInput(input, 'path')
```

### Validation Rules

**VM Names**:
- Alphanumeric characters only
- Hyphens and underscores allowed
- No spaces or special characters
- Maximum length enforced

**Usernames**:
- Letters, numbers, dots, hyphens, underscores
- Email format supported
- Realm automatically appended

**Resource Limits**:
- Memory: 512 MB - 16 GB
- CPU Cores: 1 - 8
- Storage: Checked before deployment

## Rate Limiting

### Configured Limits

| Endpoint | Window | Max Requests | Key |
|----------|--------|--------------|-----|
| /api/vm/deploy | 60 sec | 3 | username |
| Other APIs | 60 sec | 10 | IP address |

### Response Headers

```
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 2
X-RateLimit-Reset: 1640000000000
Retry-After: 45
```

### Bypass for Admin

For administrative tasks, consider:
- Separate admin endpoints
- Higher rate limits
- Token-based authentication

## Logging and Auditing

### Log Levels

- **debug**: Detailed operation information
- **info**: Normal operations, successful actions
- **warn**: Warnings, non-critical issues
- **error**: Errors, failed operations

### What Gets Logged

```javascript
log('info', 'VM deployment started', {
  vmName: sanitizedVmName,
  username: sanitizedUsername,
  memory: 2048,
  cores: 2
});
```

**Logged Information**:
- User actions (deploy, stop, delete)
- Authentication attempts (success/failure)
- Resource operations
- Errors and exceptions
- Cleanup operations

**NOT Logged**:
- Passwords or credentials
- Sensitive user data
- Full shell commands (truncated)

### Log Access

```bash
# Application logs (systemd)
journalctl -u narrekappe-vm-deployer -f

# Cleanup logs
tail -f /var/log/narrekappe-cleanup.log

# Filter by level
journalctl -u narrekappe-vm-deployer -p err

# Time range
journalctl -u narrekappe-vm-deployer --since "1 hour ago"
```

## Network Security

### Network Isolation

VMs are deployed on isolated bridge:
```
NETWORK=virtio,bridge=vmbr1
```

**Proxmox Network Configuration**:
```bash
# /etc/network/interfaces
auto vmbr1
iface vmbr1 inet static
    address 172.16.0.1
    netmask 255.255.0.0
    bridge_ports none
    bridge_stp off
    bridge_fd 0
    # No forwarding to main network
```

### Firewall Rules

**On Proxmox**:
```bash
# Allow only necessary traffic
iptables -A INPUT -p tcp --dport 3000 -s 192.168.205.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -j DROP

# Isolate VM network
iptables -A FORWARD -i vmbr1 -o vmbr0 -j DROP
iptables -A FORWARD -i vmbr0 -o vmbr1 -j DROP
```

**On Application Server**:
```bash
# UFW configuration
ufw default deny incoming
ufw default allow outgoing
ufw allow from 192.168.205.0/24 to any port 3000
ufw enable
```

## Deployment Security

### Environment Variables

**DO**:
- Use .env.local for sensitive data
- Set proper file permissions (600)
- Use SSH keys over passwords
- Generate strong cleanup tokens

**DON'T**:
- Commit .env files to version control
- Share credentials in plain text
- Use default/weak passwords
- Expose tokens in logs

### File Permissions

```bash
# Application directory
chmod 755 /root/Narrekappe-BV-main
chown -R root:root /root/Narrekappe-BV-main

# Environment file
chmod 600 /root/Narrekappe-BV-main/.env.local

# SSH keys
chmod 600 /root/.ssh/proxmox_key
chmod 644 /root/.ssh/proxmox_key.pub

# Scripts
chmod 755 /usr/local/bin/narrekappe-cleanup.sh
```

## Incident Response

### Security Event Detection

Monitor for:
- Multiple failed authentication attempts
- Excessive rate limit hits
- Unusual VM deployment patterns
- Storage space exhaustion
- Unexpected VM ownership changes

### Response Procedures

1. **Suspected Compromise**:
   ```bash
   # Stop service
   systemctl stop narrekappe-vm-deployer
   
   # Check logs
   journalctl -u narrekappe-vm-deployer -n 1000
   
   # List all VMs
   qm list
   
   # Rotate credentials
   ssh-keygen -t ed25519 -f /root/.ssh/proxmox_key_new
   ```

2. **Resource Exhaustion**:
   ```bash
   # Force cleanup
   curl -X POST http://localhost:3000/api/vm/cleanup \
     -H "x-cleanup-token: $TOKEN"
   
   # Check storage
   pvesm status
   df -h
   ```

3. **Rate Limit Attacks**:
   ```bash
   # Restart to clear rate limit cache
   systemctl restart narrekappe-vm-deployer
   
   # Review access logs
   journalctl -u narrekappe-vm-deployer | grep "Rate limit"
   ```

## Compliance Checklist

- [ ] SSH key authentication configured
- [ ] Strong cleanup token generated
- [ ] File permissions set correctly (600 for .env)
- [ ] Rate limiting configured
- [ ] Logging enabled and monitored
- [ ] Automated cleanup running
- [ ] Network isolation configured
- [ ] Firewall rules applied
- [ ] Regular security updates scheduled
- [ ] Backup procedures documented
- [ ] Incident response plan ready

## Regular Maintenance

### Weekly
- [ ] Review logs for suspicious activity
- [ ] Check cleanup job execution
- [ ] Verify storage space availability

### Monthly
- [ ] Update Node.js dependencies
- [ ] Review and rotate credentials
- [ ] Test backup restoration
- [ ] Verify rate limiting effectiveness

### Quarterly
- [ ] Security audit
- [ ] Penetration testing
- [ ] Review and update documentation
- [ ] Train administrators on new features

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Proxmox Security Documentation](https://pve.proxmox.com/wiki/Security)
- [SSH Key Management](https://www.ssh.com/academy/ssh/keygen)

## Contact

For security concerns or questions:
- Review logs first
- Check troubleshooting guide in README
- Contact system administrator
- Report vulnerabilities responsibly
