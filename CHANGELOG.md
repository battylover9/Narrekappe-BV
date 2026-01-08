# Changelog

All notable changes to the Narrekappe VM Deployer project.

## [2.0.0] - 2025-01-07 - Security Enhanced Release

### 🔒 Security Fixes

#### Critical
- **Fixed Insecure Authentication** ([CVE-INTERNAL-001])
  - Replaced password-changing authentication with SSH connection testing
  - Previous method could actually modify user passwords
  - New method tests credentials without system modifications
  
- **Command Injection Prevention** ([CVE-INTERNAL-002])
  - Implemented input sanitization for all user inputs
  - Added proper shell argument escaping using single quotes
  - Removed dangerous characters from inputs
  - Prevents execution of arbitrary commands

#### High
- **Rate Limiting** ([SEC-001])
  - Added rate limiting middleware to prevent abuse
  - Deploy endpoint: 3 requests per minute per user
  - Other endpoints: 10 requests per minute per IP
  - Returns proper 429 status codes with retry-after headers

- **Resource Validation** ([SEC-002])
  - Added storage space checking before deployment
  - Validates VM resource limits (memory, cores)
  - Prevents deployment if user has existing active VMs
  - Checks for template availability

#### Medium
- **SSH Key Authentication** ([SEC-003])
  - Added support for SSH key authentication
  - Recommended over password authentication
  - Configurable via environment variables
  - Falls back to password if key not available

### ✨ New Features

- **Automated Cleanup System**
  - Cron job runs every 30 minutes
  - Cleans up VMs past their 2-hour expiration
  - Secure token-based cleanup API endpoint
  - Comprehensive logging of cleanup operations

- **Comprehensive Logging**
  - Structured logging with levels (debug, info, warn, error)
  - Context-aware log messages
  - Separate logs for cleanup operations
  - Integration with systemd journal

- **Production Setup Script**
  - Automated installation script (setup-production.sh)
  - One-command deployment
  - Generates secure tokens
  - Configures systemd service and cron jobs

- **Enhanced Error Handling**
  - Proper error propagation
  - User-friendly error messages
  - Cleanup on deployment failure
  - Graceful degradation

### 📚 Documentation

- **SECURITY.md** - Comprehensive security guide
  - Vulnerability details and fixes
  - Best practices for deployment
  - Network isolation configuration
  - Incident response procedures

- **MIGRATION.md** - Migration guide from v1.0 to v2.0
  - Step-by-step upgrade instructions
  - Rollback procedures
  - Testing guidelines
  - Common issues and solutions

- **README.md** - Enhanced documentation
  - Security features overview
  - Detailed installation instructions
  - API endpoint documentation
  - Troubleshooting guide

- **.env.example** - Environment variable template
  - All configuration options
  - Security best practices
  - Authentication method examples

### 🔧 Improvements

#### Code Quality
- Removed silent error catching (empty catch blocks)
- Added comprehensive error messages
- Improved code organization
- Better function naming and documentation

#### Performance
- Optimized VM ID generation
- Reduced redundant SSH connections
- Better timeout handling
- Efficient IP address detection

#### Maintainability
- Separated concerns (rate limiting, logging)
- Reusable utility functions
- Configuration via environment variables
- Modular architecture

### 🐛 Bug Fixes

- Fixed: VM ID conflicts causing deployment failures
- Fixed: Missing error handling in cleanup operations
- Fixed: Inconsistent timeout values
- Fixed: IP detection retry logic
- Fixed: Race conditions in VM creation

### ⚠️ Breaking Changes

1. **Environment Variables**
   - Now uses .env.local instead of hardcoded values
   - PROXMOX_SSH_KEY or PROXMOX_PASSWORD required
   - CLEANUP_TOKEN required for cleanup endpoint

2. **Authentication Method**
   - Changed from password modification to SSH connection test
   - May require SSH key setup
   - Different error messages

3. **API Rate Limiting**
   - Deploy endpoint limited to 3 requests per minute
   - May affect bulk deployment scripts
   - Returns 429 status when limit exceeded

4. **Dependencies**
   - Updated ssh2 library
   - New dependencies for rate limiting
   - Requires Node.js 18+

### 📦 Dependencies

#### Added
- None (uses built-in features)

#### Updated
- ssh2: ^1.17.0 (improved security)
- next: ^14.0.0 (latest stable)

#### Removed
- None

### 🔐 Security Advisories

**Users of v1.0 should upgrade immediately**

Critical vulnerabilities fixed:
1. Command injection in VM deployment
2. Insecure authentication mechanism
3. No rate limiting (DoS vulnerable)
4. Resource exhaustion attacks possible

### 📊 Statistics

- Files changed: 15
- Lines added: ~3,500
- Lines removed: ~400
- Security issues fixed: 6
- New features: 4
- Documentation pages: 4

### 🎯 Future Improvements

Planned for v2.1:
- [ ] Web-based admin dashboard
- [ ] User quotas and limits
- [ ] VM templates management UI
- [ ] Metrics and monitoring integration
- [ ] Multi-node Proxmox support
- [ ] Backup and snapshot management

### 👥 Contributors

- Security audit and fixes
- Documentation improvements
- Testing and validation

### 📄 License

Narrekappe BV © 2024

---

## [1.0.0] - 2024-11-01 - Initial Release

### Features
- Basic VM deployment from S3 templates
- User authentication via Proxmox
- VM lifecycle management (start, stop, delete)
- Simple web interface
- Manual VM cleanup

### Known Issues
- Command injection vulnerabilities
- Insecure authentication method
- No rate limiting
- Limited error handling
- No automated cleanup

---

## Version Numbering

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality
- **PATCH**: Backwards-compatible bug fixes

## Security Updates

For security issues, please contact administrators immediately.
Do not post security vulnerabilities publicly.
