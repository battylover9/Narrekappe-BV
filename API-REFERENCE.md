# API Endpoints Quick Reference

## Fixed API Paths

All API routes have been corrected to match Next.js structure.

### ✅ Correct API Endpoints

```
Frontend Pages → API Routes
=================================================

Student Dashboard (stud-dash.js):
  /api/vm/vms          → List available VM templates
  /api/vm/deployment   → List deployed VMs
  /api/vm/deploy       → Deploy a new VM (POST)
  /api/vm/start        → Start a VM (POST)
  /api/vm/stop         → Stop a VM (POST)  
  /api/vm/delete       → Delete a VM (POST)

Admin Dashboard:
  /api/admin-stats     → Get admin statistics
  /api/proxmox/users   → List Proxmox users
  
Authentication:
  /api/auth/login      → User login (POST)

Maintenance:
  /api/vm/cleanup      → Cleanup expired VMs (POST, requires token)
```

### ❌ Old/Wrong Paths (Don't use these!)

```
/api/vms          → Should be /api/vm/vms
/api/deployment   → Should be /api/vm/deployment
/api/deploy       → Should be /api/vm/deploy
/api/start        → Should be /api/vm/start
/api/stop         → Should be /api/vm/stop
/api/delete       → Should be /api/vm/delete
```

---

## Testing Your Setup

### 1. Quick Browser Test
Open your browser to:
```
http://192.168.205.30:3000/stud-dash
```

Log in with any name, and you should see available VMs load.

### 2. API Tests from Terminal

```bash
# Test VMs list
curl http://localhost:3000/api/vm/vms

# Expected response:
{
  "vms": [
    {
      "name": "chronos",
      "displayName": "Chronos",
      "difficulty": "Intermediate",
      ...
    }
  ]
}

# Test deployments list
curl http://localhost:3000/api/vm/deployment

# Expected response:
{
  "deployments": [],
  "total": 0
}
```

### 3. Check Browser Console
Open browser console (F12) and look for errors:
- ✅ Should see: Successful API calls with 200 status
- ❌ Should NOT see: 404 errors

---

## Files That Were Fixed

1. **pages/stud-dash.js**
   - Changed all `/api/` paths to `/api/vm/`
   - Now correctly calls: `/api/vm/vms`, `/api/vm/deploy`, etc.

2. **pages/app.js**
   - Fixed placeholder function to use `/api/vm/vms`

3. **Directory Structure**
   - Renamed: `pages/API/` → `pages/api/` (lowercase)

---

## Common Issues & Solutions

### Issue: Still seeing "Loading available VMs..." forever

**Possible Causes:**
1. API not responding
2. JavaScript errors in console
3. CORS issues
4. Application not running

**Debug Steps:**
```bash
# 1. Check if app is running
systemctl status narrekappe-vm-deployer

# 2. Check logs for errors
journalctl -u narrekappe-vm-deployer -f

# 3. Test API directly
curl http://localhost:3000/api/vm/vms

# 4. Check browser console (F12) for errors
```

---

### Issue: API returns empty arrays `{"vms": []}`

**Possible Causes:**
1. No VM templates in `/var/lib/vz/template/qemu/`
2. SSH connection to Proxmox failing
3. File permissions issues

**Debug Steps:**
```bash
# Check if templates exist on Proxmox
ssh root@192.168.205.30 'ls -lh /var/lib/vz/template/qemu/'

# Should see files like:
# chronos-disk0.qcow2
# jangow-01-1.0.1-disk0.qcow2

# If empty, you need to add VM templates first
```

---

### Issue: API returns 500 errors

**Check logs:**
```bash
journalctl -u narrekappe-vm-deployer -n 50

# Look for:
# - SSH connection errors
# - Missing environment variables
# - Proxmox command failures
```

**Common fixes:**
```bash
# 1. Verify environment variables
cat /root/Narrekappe-BV-main/.env.local

# 2. Test SSH connection
ssh root@192.168.205.30 'qm list'

# 3. Check SSH key permissions
ls -la /root/.ssh/proxmox_key
# Should be: -rw------- (600)
```

---

## Verification Checklist

After applying fixes:

- [ ] Directory is `pages/api/` (lowercase)
- [ ] Application restarted: `systemctl restart narrekappe-vm-deployer`
- [ ] API test works: `curl http://localhost:3000/api/vm/vms`
- [ ] Browser loads stud-dash page
- [ ] VMs list appears (or shows empty if no templates)
- [ ] No 404 errors in browser console
- [ ] No errors in application logs

---

## If You Need to Add VM Templates

VMs won't show if you don't have templates. To add them:

```bash
# On Proxmox server
cd /var/lib/vz/template/qemu/

# You need .qcow2 files like:
# - chronos-disk0.qcow2
# - jangow-01-1.0.1-disk0.qcow2
# - matrix-breakout-2-morpheus-disk0.qcow2

# These are converted from OVA files
# The API will list any file matching *-disk0.qcow2
```

---

## Next Steps

1. **Verify the fix worked**:
   ```bash
   curl http://localhost:3000/api/vm/vms
   ```

2. **Test in browser**:
   - Go to: http://192.168.205.30:3000/stud-dash
   - Log in with any name
   - Check if VMs load

3. **Check logs if issues persist**:
   ```bash
   journalctl -u narrekappe-vm-deployer -f
   ```

4. **Add VM templates if needed** (on Proxmox server)

---

## Support

If still having issues:

1. Verify all files updated: `ls -la pages/api/`
2. Restart application: `systemctl restart narrekappe-vm-deployer`
3. Check logs: `journalctl -u narrekappe-vm-deployer -f`
4. Test API: `curl http://localhost:3000/api/vm/vms`
5. Check browser console (F12) for client-side errors
