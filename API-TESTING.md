# API Testing Guide

## Quick Fix Applied

**Issue**: Next.js requires API routes to be in lowercase `api/` not `API/`
**Fixed**: Renamed `pages/API/` → `pages/api/`

After this change, all API endpoints should work correctly.

---

## API Endpoints Reference

### Correct URLs (after fix)

All API endpoints are now accessible at:
```
http://your-server:3000/api/...
```

**NOT** `http://your-server:3000/API/...` (this will 404)

---

## Test Each Endpoint

### 1. Health Check
```bash
curl -I http://localhost:3000/
# Should return: 200 OK
```

### 2. List Available VMs
```bash
curl http://localhost:3000/api/vm/vms
```
**Expected**: List of available VM templates

### 3. List Deployed VMs
```bash
curl http://localhost:3000/api/vm/deployment
```
**Expected**: List of currently deployed VMs

### 4. Deploy a VM (Rate Limited)
```bash
curl -X POST http://localhost:3000/api/vm/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "vmName": "test-vm",
    "userName": "testuser"
  }'
```
**Expected**: 
- Success: VM deployed with vmId, IP address
- Error: Proper error message (template not found, user has VM, etc.)
- Rate Limited: 429 status after 3 requests per minute

### 5. Test Rate Limiting
```bash
# Should succeed 3 times, then fail with 429
for i in {1..5}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/vm/deploy \
    -H "Content-Type: application/json" \
    -d '{"vmName":"test","userName":"user1"}' \
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 1
done
```

### 6. Stop/Delete a VM
```bash
# Replace 1001 with actual VM ID
curl -X POST http://localhost:3000/api/vm/stop \
  -H "Content-Type: application/json" \
  -d '{
    "vmId": 1001,
    "userName": "testuser"
  }'
```

### 7. Cleanup Endpoint (requires token)
```bash
# Get token from .env.local
TOKEN=$(grep CLEANUP_TOKEN /root/Narrekappe-BV-main/.env.local | cut -d= -f2)

curl -X POST http://localhost:3000/api/vm/cleanup \
  -H "x-cleanup-token: $TOKEN"
```
**Expected**: `{"success": true, "cleanedCount": 0}`

### 8. Authentication
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass"
  }'
```

---

## Common Issues & Solutions

### Issue: 404 Not Found

**Cause**: Using uppercase `/API/` instead of lowercase `/api/`

**Solution**: 
```bash
# Wrong ❌
curl http://localhost:3000/API/vm/vms

# Correct ✅
curl http://localhost:3000/api/vm/vms
```

---

### Issue: Application Not Running

**Check service status**:
```bash
# If using systemd
systemctl status narrekappe-vm-deployer

# If using PM2
pm2 status

# Check if port is listening
netstat -tlnp | grep 3000
# or
lsof -i :3000
```

**View logs**:
```bash
# Systemd
journalctl -u narrekappe-vm-deployer -f

# PM2
pm2 logs narrekappe-vm-deployer

# Development
cd /root/Narrekappe-BV-main
npm run dev
```

---

### Issue: 500 Internal Server Error

**Check logs for errors**:
```bash
journalctl -u narrekappe-vm-deployer -n 100
```

**Common causes**:
1. Missing environment variables (.env.local)
2. Proxmox connection issues
3. SSH authentication failure
4. Missing dependencies

**Debug**:
```bash
# Test Proxmox SSH connection
ssh root@192.168.205.30 'qm list'

# Check environment
cat /root/Narrekappe-BV-main/.env.local

# Reinstall dependencies
cd /root/Narrekappe-BV-main
npm install
npm run build
```

---

### Issue: Rate Limit Errors (429)

**This is normal!** Rate limiting is working.

**Response**:
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "retryAfter": 45
}
```

**Headers**:
```
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704067200000
Retry-After: 45
```

**Solution**: Wait for the retry-after period

---

### Issue: Authentication Fails

**Check**:
```bash
# 1. Environment variables set?
grep PROXMOX /root/Narrekappe-BV-main/.env.local

# 2. SSH key exists and has correct permissions?
ls -la /root/.ssh/proxmox_key
# Should be: -rw------- (600)

# 3. Test SSH connection manually
ssh -i /root/.ssh/proxmox_key root@192.168.205.30
```

---

## API Response Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Missing/invalid parameters |
| 401 | Unauthorized | Invalid credentials/token |
| 404 | Not Found | Wrong URL (check /api/ not /API/) |
| 405 | Method Not Allowed | Using GET instead of POST, etc. |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side issue, check logs |
| 507 | Insufficient Storage | Not enough disk space |

---

## Restart Application

After making changes:

```bash
# Systemd
systemctl restart narrekappe-vm-deployer
systemctl status narrekappe-vm-deployer

# PM2
pm2 restart narrekappe-vm-deployer
pm2 logs narrekappe-vm-deployer

# Development mode
cd /root/Narrekappe-BV-main
npm run dev
```

---

## Complete Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash
# API Testing Script

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Testing Narrekappe VM Deployer API"
echo "===================================="

# Test 1: Server running
echo -n "1. Server running... "
if curl -s -f "$BASE_URL" > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   Server not responding. Start with: systemctl start narrekappe-vm-deployer"
    exit 1
fi

# Test 2: List VMs endpoint
echo -n "2. List VMs endpoint... "
RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/api/vm/vms")
HTTP_CODE="${RESPONSE: -3}"
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ (HTTP $HTTP_CODE)${NC}"
fi

# Test 3: Deployment endpoint
echo -n "3. Deployment endpoint... "
RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/api/vm/deployment")
HTTP_CODE="${RESPONSE: -3}"
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ (HTTP $HTTP_CODE)${NC}"
fi

# Test 4: Rate limiting
echo -n "4. Rate limiting... "
COUNT=0
for i in {1..5}; do
    RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/vm/deploy" \
        -H "Content-Type: application/json" \
        -d '{"vmName":"test","userName":"user1"}' -o /dev/null)
    if [ "$RESPONSE" = "429" ]; then
        COUNT=$((COUNT + 1))
    fi
done
if [ $COUNT -ge 1 ]; then
    echo -e "${GREEN}✓ (Rate limit working)${NC}"
else
    echo -e "${RED}✗ (No rate limit detected)${NC}"
fi

# Test 5: Invalid endpoint (should 404)
echo -n "5. 404 handling... "
RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/api/invalid" -o /dev/null)
if [ "$RESPONSE" = "404" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ (Expected 404, got $RESPONSE)${NC}"
fi

echo ""
echo "===================================="
echo "API tests completed!"
```

Run with:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Need More Help?

1. **Check logs**: `journalctl -u narrekappe-vm-deployer -f`
2. **Review README.md**: Complete documentation
3. **Review SECURITY.md**: Security configurations
4. **Test in dev mode**: `npm run dev` for detailed output
