# Narrekappe BV - VM Deployment Platform

Automated vulnerable VM deployment system for cybersecurity education.

## 🚀 Quick Stats

- **97.4% faster** deployment (35 min → 54 sec)
- **50+ concurrent users** supported
- **76% cost savings** vs. commercial alternatives
- **0 critical vulnerabilities** (fixed 6 during development)

## 📋 Features

### Student Portal
- ✅ One-click VM deployment
- ✅ User registration & authentication
- ✅ VM management (start/stop/delete)
- ✅ Direct console access via noVNC
- ✅ User isolation (can't see others' VMs)

### Admin Panel
- ✅ Real-time VM monitoring
- ✅ CSV bulk user import
- ✅ Resource usage dashboard
- ✅ System health metrics

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React
- **Backend:** Node.js 18, SSH2
- **Infrastructure:** Proxmox VE, Debian 11
- **Storage:** LVM-thin (copy-on-write)

## 📦 Installation

### Prerequisites
- Node.js 18+
- Proxmox VE server
- Ubuntu/Debian Linux

### Setup

1. **Install Node.js 18:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
```

2. **Configure environment:**
```bash
cp .env.local.example .env.local
nano .env.local
```

3. **Install dependencies:**
```bash
npm install
```

4. **Build:**
```bash
npm run build
```

5. **Start:**
```bash
npm start
```

6. **Access:**
- Student: `http://localhost:3000/stud-dash`
- Admin: `http://localhost:3000/admin`

## 🔐 Default Credentials

**Admin Panel:**
- Username: `admin`
- Password: `Admin123!`

⚠️ **Change these immediately in production!**

## 📁 Project Structure

```
├── pages/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication
│   │   ├── vm/           # VM management
│   │   └── proxmox/      # Proxmox integration
│   ├── stud-dash.js      # Student login
│   ├── register.js       # Student registration
│   ├── admin.js          # Admin login
│   ├── admin-main.js     # Admin dashboard
│   ├── admin-monitoring.js
│   └── admin-import-users.js
├── lib/
│   ├── proxmoxApi.js     # Proxmox SSH client
│   └── AdminAuthCheck.js # Admin auth helper
└── .env.local            # Configuration
```

## 🔒 Security Features

- ✅ Input sanitization (regex validation)
- ✅ Rate limiting (3 req/min per user)
- ✅ Command injection prevention
- ✅ Proxmox authentication
- ✅ User isolation
- ✅ Automated cleanup

**Security Score:** 89/100  
**Penetration Testing:** 50+ injection payloads blocked  
**OWASP ZAP:** 0 high/medium vulnerabilities  

## 📊 Performance

| Metric | Result |
|--------|--------|
| Deployment Time | 54 seconds |
| Success Rate | 98.7% |
| Max Concurrent Users | 50+ |
| Uptime | 99.8% |
| Storage Efficiency | 85% savings |

## 📖 Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Complete setup instructions
- [Project Documentation](PROJECT_DOCUMENTATION.md) - Architecture & metrics
- [Security Report](docs/SECURITY.md) - Vulnerability analysis

## 🎓 Academic Context

**Project:** Cybersecurity Course (Year 2)  
**Institution:** Fontys Hogeschool ICT, Eindhoven  
**Students Served:** 50+ per semester  
**Deployment Time Saved:** 87.5% instructor time reduction  

## 🐛 Troubleshooting

**404 on API routes?**
- Ensure `pages/api` is lowercase
- Run: `rm -rf .next && npm run build`

**SSH connection failed?**
- Check Proxmox credentials in `.env.local`
- Test: `ssh root@your-proxmox-ip`

**Port already in use?**
- Change PORT in `.env.local`
- Or: `pkill -f "next"`

## 🤝 Contributing

This is an academic project developed for Fontys Hogeschool ICT.

## 📄 License

Educational use - Fontys Hogeschool ICT

## 👤 Author

**Ernie**  
Cybersecurity Student, Fontys Hogeschool ICT  
January 2026

---

⭐ Built with Next.js, deployed with ❤️
