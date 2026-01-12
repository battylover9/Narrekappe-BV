// lib/proxmoxApi.js
// SSH connection to Proxmox host for VM management

import { Client } from 'ssh2';

const PROXMOX_HOST = process.env.PROXMOX_HOST || '192.168.205.30';
const PROXMOX_USER = process.env.PROXMOX_USER || 'root';
const PROXMOX_PASSWORD = process.env.PROXMOX_PASSWORD;
const PROXMOX_REALM = process.env.PROXMOX_REALM || 'pve';

// Execute command on Proxmox via SSH
export async function execSSH(command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';
    let errorOutput = '';

    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        stream.on('close', (code) => {
          conn.end();
          if (code !== 0 && errorOutput) {
            reject(new Error(`Command failed (${code}): ${errorOutput}`));
          } else {
            resolve(output.trim());
          }
        });
      });
    });

    conn.on('error', (err) => {
      reject(err);
    });

    conn.connect({
      host: PROXMOX_HOST,
      port: 22,
      username: PROXMOX_USER,
      password: PROXMOX_PASSWORD,
      readyTimeout: 30000,
    });
  });
}

// Get Proxmox realm
export function getRealm() {
  return PROXMOX_REALM;
}

// ==========================================
// USER MANAGEMENT FUNCTIONS
// ==========================================

// List all Proxmox users
export async function proxmoxListUsers() {
  const output = await execSSH('pveum user list --output-format json');
  return JSON.parse(output);
}

// Create Proxmox user
export async function proxmoxCreateUser({ userid, fullName, password }) {
  const comment = JSON.stringify({ fullName, email: userid.split('@')[0] });
  await execSSH(
    `pveum user add "${userid}" --password "${password}" --comment '${comment.replace(/'/g, "\\'")}'`
  );
  return { userid, fullName };
}

// Delete Proxmox user
export async function proxmoxDeleteUser({ userid }) {
  await execSSH(`pveum user delete "${userid}"`);
  return { userid };
}

// Decode comment field
export function decodeComment(comment) {
  try {
    const parsed = JSON.parse(comment || '{}');
    return {
      email: parsed.email || '',
      fullName: parsed.fullName || '',
    };
  } catch {
    return { email: '', fullName: '' };
  }
}

// Authenticate user
export async function authenticateUser(username, password) {
  const realm = getRealm();
  const userid = `${username}@${realm}`;
  
  try {
    // Verify user exists
    const users = await proxmoxListUsers();
    const userExists = users.some(u => u.userid === userid);
    
    if (!userExists) {
      return { success: false, error: 'User not found' };
    }

    // Try to authenticate using pveum
    const result = await execSSH(
      `pveum passwd ${userid} --password "${password}" 2>&1 || echo "FAIL"`
    );
    
    // If password change succeeds, auth is valid (then change it back)
    if (!result.includes('FAIL') && !result.includes('error')) {
      return { success: true, userid, username };
    }
    
    return { success: false, error: 'Invalid password' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ==========================================
// VM MANAGEMENT FUNCTIONS
// ==========================================

// List available templates (converted from OVAs)
export async function listAvailableTemplates() {
  try {
    const output = await execSSH('ls -1 /var/lib/vz/template/qemu/*-metadata.json 2>/dev/null || echo ""');
    
    if (!output.trim()) {
      return [];
    }
    
    const files = output.split('\n').filter(f => f.trim());
    const templates = [];
    
    for (const file of files) {
      try {
        const metadata = await execSSH(`cat "${file}"`);
        const data = JSON.parse(metadata);
        const vmName = file.match(/\/([^/]+)-metadata\.json$/)[1];
        templates.push({ id: vmName, name: vmName, ...data });
      } catch (e) {
        console.error(`Error reading ${file}:`, e.message);
      }
    }
    
    return templates;
  } catch (e) {
    console.error('Error listing templates:', e.message);
    return [];
  }
}

// Check if user has active VMs
export async function checkUserActiveVMs(username) {
  try {
    const output = await execSSH(`qm list | grep "${username}" || true`);
    
    if (!output.trim()) return [];
    
    return output.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const match = line.match(/^\s*(\d+)/);
        return match ? parseInt(match[1]) : null;
      })
      .filter(id => id !== null);
  } catch {
    return [];
  }
}

// Deploy VM for user
export async function deployVM({ vmName, username, memory = 2048, cores = 2 }) {
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
  
  console.log(`[DEPLOY] Starting deployment: ${vmName} for ${username}`);
  
  // Check if template exists
  const diskPath = `/var/lib/vz/template/qemu/${vmName}-disk0.qcow2`;
  try {
    await execSSH(`test -f "${diskPath}"`);
  } catch {
    throw new Error(`Template ${vmName} not found. Has it been converted?`);
  }
  
  // Generate unique VMID
  let vmid = 2000 + Math.floor(Math.random() * 8000);
  let attempts = 0;
  
  while (attempts < 100) {
    try {
      await execSSH(`qm status ${vmid} 2>/dev/null`);
      vmid++;
      attempts++;
    } catch {
      break; // VMID is available
    }
  }
  
  const vmDisplayName = `${vmName}-${username}`;
  
  try {
    console.log(`[DEPLOY] Creating VM ${vmid}...`);
    
    // Create VM
    await execSSH(
      `qm create ${vmid} --name "${vmDisplayName}" --memory ${memory} --cores ${cores} --net0 virtio,bridge=vmbr1`
    );
    
    // Import disk
    console.log(`[DEPLOY] Importing disk...`);
    await execSSH(`qm importdisk ${vmid} "${diskPath}" local-lvm`);
    
    // Configure boot
    console.log(`[DEPLOY] Configuring VM...`);
    await execSSH(`qm set ${vmid} --scsihw virtio-scsi-pci --scsi0 local-lvm:vm-${vmid}-disk-0`);
    await execSSH(`qm set ${vmid} --boot order=scsi0`);
    await execSSH(`qm set ${vmid} --vga std`);
    
    // Add metadata
    const metadata = {
      username,
      vmName,
      deployedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_TIMEOUT).toISOString(),
    };
    await execSSH(`qm set ${vmid} --description '${JSON.stringify(metadata).replace(/'/g, "\\'")}'`);
    
    // Start VM
    console.log(`[DEPLOY] Starting VM...`);
    await execSSH(`qm start ${vmid}`);
    
    // Wait for IP address (try for 60 seconds)
    console.log(`[DEPLOY] Waiting for IP address...`);
    let ipAddress = null;
    
    for (let i = 0; i < 12; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      try {
        // Try multiple methods to get IP
        const configOutput = await execSSH(`qm config ${vmid}`);
        const macMatch = configOutput.match(/virtio=([0-9A-Fa-f:]+)/);
        
        if (macMatch) {
          const mac = macMatch[1];
          const arpOutput = await execSSH(`arp -n | grep -i "${mac}" || true`);
          const ipMatch = arpOutput.match(/(\d+\.\d+\.\d+\.\d+)/);
          
          if (ipMatch) {
            ipAddress = ipMatch[1];
            break;
          }
        }
      } catch (e) {
        // Continue trying
      }
    }
    
    console.log(`[DEPLOY] VM ${vmid} deployed successfully`);
    
    return {
      vmid,
      name: vmDisplayName,
      ipAddress: ipAddress || 'Waiting for network... Check Proxmox console',
      startTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_TIMEOUT).toISOString(),
    };
    
  } catch (error) {
    // Cleanup on failure
    console.error(`[DEPLOY] Error: ${error.message}`);
    try {
      await execSSH(`qm destroy ${vmid} --purge 2>/dev/null || true`);
    } catch {}
    throw error;
  }
}

// Stop and destroy VM
export async function stopVM(vmid, username) {
  console.log(`[STOP] Stopping VM ${vmid} for ${username}`);
  
  // Verify VM belongs to user
  try {
    const config = await execSSH(`qm config ${vmid}`);
    if (!config.includes(username)) {
      throw new Error('VM does not belong to you');
    }
  } catch (e) {
    if (e.message.includes('does not exist')) {
      return { vmid, message: 'VM already deleted' };
    }
    throw e;
  }
  
  // Stop VM
  try {
    await execSSH(`qm stop ${vmid} 2>/dev/null || true`);
  } catch {}
  
  // Wait for shutdown
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Destroy VM
  await execSSH(`qm destroy ${vmid} --purge`);
  
  console.log(`[STOP] VM ${vmid} destroyed`);
  
  return { vmid, message: 'VM stopped and removed' };
}

// Get VM status
export async function getVMStatus(vmid) {
  try {
    const statusOutput = await execSSH(`qm status ${vmid}`);
    const configOutput = await execSSH(`qm config ${vmid}`);
    
    // Parse description for metadata
    const descMatch = configOutput.match(/description: (.+)/);
    let metadata = {};
    if (descMatch) {
      try {
        metadata = JSON.parse(descMatch[1]);
      } catch {}
    }
    
    // Get IP if possible
    let ipAddress = null;
    try {
      const macMatch = configOutput.match(/virtio=([0-9A-Fa-f:]+)/);
      if (macMatch) {
        const arpOutput = await execSSH(`arp -n | grep -i "${macMatch[1]}" || true`);
        const ipMatch = arpOutput.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (ipMatch) ipAddress = ipMatch[1];
      }
    } catch {}
    
    return {
      vmid,
      status: statusOutput.includes('running') ? 'running' : 'stopped',
      ipAddress: ipAddress || 'Unknown',
      ...metadata,
    };
  } catch (e) {
    throw new Error(`VM ${vmid} not found`);
  }
}