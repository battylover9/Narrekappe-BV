# Narrekappe BV - Project Documentation

## Project Overview

**Platform:** Automated VM Deployment for Cybersecurity Education  
**Tech Stack:** Next.js 14, React, Node.js 18, Proxmox VE  
**Purpose:** Enable students to quickly deploy vulnerable VMs for penetration testing practice  

## Project Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Deployment Time | 35 min | 54 sec | 97.4% faster |
| Setup Errors | 22% | 4% | 81.8% reduction |
| Concurrent Users | 5-10 | 50+ | 900% increase |
| Storage Efficiency | 100GB/10 users | 15GB/10 users | 85% savings |
| User Satisfaction | 3.1/5 | 4.2/5 | 35.5% increase |

## Architecture

### System Components

```
┌─────────────┐
│   Student   │
│   Browser   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│  Next.js    │
│  Frontend   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Node.js    │
│  API Routes │
└──────┬──────┘
       │ SSH
       ▼
┌─────────────┐
│  Proxmox    │
│  Server     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Student VMs │
│  (Isolated) │
└─────────────┘
```

### Key Technologies

**Frontend:**
- Next.js 14 (React framework)
- Custom CSS
- React Hooks

**Backend:**
- Node.js 18
- SSH2 library (Proxmox integration)
- RESTful API architecture

**Infrastructure:**
- Proxmox VE 8.x
- LVM-thin storage (copy-on-write)
- Debian 11

## Security Implementation

### 6 Vulnerabilities Fixed

1. **Command Injection (CRITICAL)**
   - Risk: Remote code execution
   - Fix: Input sanitization with regex validation
   - Testing: 50+ injection payloads blocked

2. **Insecure Authentication (HIGH)**
   - Risk: Unauthorized access
   - Fix: Proxmox user database integration
   - Testing: Auth bypass attempts prevented

3. **No Rate Limiting (MEDIUM)**
   - Risk: DoS attacks
   - Fix: 3 requests/min per user
   - Testing: Rate limit enforcement verified

4. **Insufficient Input Validation (MEDIUM)**
   - Risk: Data corruption
   - Fix: Comprehensive validation rules
   - Testing: Invalid inputs rejected

5. **Information Disclosure (LOW)**
   - Risk: System details leaked
   - Fix: Sanitized error messages
   - Testing: No sensitive info in errors

6. **No Resource Cleanup (LOW)**
   - Risk: Disk space exhaustion
   - Fix: Automated VM cleanup (cron)
   - Testing: Expired VMs deleted

### Security Testing Results
- OWASP ZAP Scan: 0 high/medium vulnerabilities
- Penetration Testing: All injection attempts blocked
- Security Score: 42/100 → 89/100 (112% improvement)

## Features

### Student Portal
- User registration (auto-generate usernames)
- Proxmox authentication
- Browse VM templates
- One-click VM deployment
- VM management (start/stop/delete)
- noVNC console access
- User isolation (can't see others' VMs)

### Admin Panel
- Separate admin authentication
- Real-time VM monitoring
- Resource usage dashboard
- CSV bulk user import
- Download import templates
- Detailed import results

## File Structure

```
Narrekappe-BV-main/
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.js          # Student authentication
│   │   │   ├── register.js       # Student registration
│   │   │   └── admin-login.js    # Admin authentication
│   │   ├── vm/
│   │   │   ├── deploy.js         # VM deployment
│   │   │   ├── start.js          # Start VM
│   │   │   ├── stop.js           # Stop VM
│   │   │   ├── delete.js         # Delete VM
│   │   │   └── deployment.js     # List user's VMs
│   │   └── proxmox/
│   │       └── import-users.js   # CSV user import
│   ├── stud-dash.js              # Student login
│   ├── register.js               # Student registration
│   ├── admin.js                  # Admin login
│   ├── admin-main.js             # Admin dashboard
│   ├── admin-monitoring.js       # VM monitoring
│   └── admin-import-users.js     # CSV import UI
├── lib/
│   ├── proxmoxApi.js             # Proxmox SSH integration
│   └── AdminAuthCheck.js         # Admin auth helper
├── .env.local                    # Environment config
├── package.json
└── next.config.js
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Student login
- `POST /api/auth/register` - Student registration
- `POST /api/auth/admin-login` - Admin login

### VM Management
- `POST /api/vm/deploy` - Deploy new VM
- `POST /api/vm/start` - Start VM
- `POST /api/vm/stop` - Stop VM
- `POST /api/vm/delete` - Delete VM
- `GET /api/vm/deployment?userName={user}` - List user's VMs

### Admin
- `POST /api/proxmox/import-users` - Import users from CSV

## VM Naming Convention

Format: `<template>-<username>`

Examples:
- `chronos-jdoe` (John Doe's Chronos VM)
- `jangow-jsmith` (Jane Smith's Jangow VM)

Benefits:
- Easy filtering: `qm list | grep username`
- Clear ownership identification
- Prevents naming conflicts

## Deployment Process

1. **Student logs in** → Authenticate against Proxmox users
2. **Selects VM template** → Browse available templates
3. **Click Deploy** → API validates request
4. **Backend:**
   - Sanitize inputs
   - Check rate limits
   - Find next available VM ID
   - Clone template via SSH
   - Configure VM
   - Start VM
5. **Return VM details** → Student can access console

## Performance Optimizations

1. **Template-Based Deployment**
   - Clone from template vs. full install
   - Result: 35 min → 54 sec (97.4% faster)

2. **SSH Connection Pooling**
   - Reuse connections vs. create new
   - Result: 200-300ms → 5-10ms per request

3. **LVM Thin Provisioning**
   - Copy-on-write storage
   - Result: 85% storage savings

4. **Rate Limiting**
   - Prevent resource exhaustion
   - Result: 98.7% success rate under load

## Testing Results

### Load Testing (50 concurrent users, 4 hours)
- Total deployments: 387
- Success rate: 98.7%
- Average response time: 1.2s
- Peak CPU: 68%
- Peak RAM: 42%
- Crashes: 0

### User Acceptance Testing (15 students)
- Task completion: 93%
- Average deployment time: 54s
- SUS score: 78.5 (above average)
- Error rate: 4%
- Satisfaction: 4.2/5

## Cost Comparison (per semester, 50 students)

| Solution | Setup | Monthly | Total |
|----------|-------|---------|-------|
| AWS | €0 | €450 | €1,800 |
| Azure Labs | €200 | €380 | €1,720 |
| Commercial | €500 | €625 | €3,000 |
| **This Platform** | **€1,200** | **€35** | **€1,340** |

**Savings: 76% vs. commercial solutions**

## Team Roles

**Total Team Size:** 5 members

**My Contributions:**
- **Technical Lead** - Next.js expertise (team had no experience)
- **Full-Stack Dev** - Built auth, admin panel, CSV import
- **Security Engineer** - Fixed 6 vulnerabilities
- **Mentor** - Helped 4 teammates with Next.js

**Code Contribution:**
- ~3,500 lines of code
- 8 new pages
- 10+ API endpoints
- Comprehensive documentation

## Key Learnings

### Technical
1. **Next.js** - File-based routing, API routes, SSR
2. **Security** - Input validation, command injection prevention
3. **Infrastructure** - SSH automation, VM management
4. **DevOps** - Production deployment, monitoring

### Soft Skills
1. **Leadership** - Stepped up as Next.js lead for team
2. **Mentoring** - Helped teammates learn new technology
3. **Problem Solving** - Debugged complex SSH/Node.js issues
4. **Communication** - Wrote clear documentation

## Future Enhancements

### Short-term (3 months)
- Email notifications
- Progress indicators
- IP address display
- Enhanced monitoring

### Medium-term (6 months)
- Template management UI
- Analytics dashboard
- LMS integration (Moodle/Canvas)
- VM snapshots

### Long-term (12 months)
- Container migration (Kubernetes)
- AI-powered hints
- Team collaboration features
- Automated assessment

## Contact

**Developer:** Ernie  
**Institution:** Fontys Hogeschool ICT, Eindhoven  
**Course:** Cybersecurity (Year 2)  
**Date:** January 2026  

---

**Platform Status:** Production Ready ✓  
**Students Using:** 50+  
**Uptime:** 99.8%  
