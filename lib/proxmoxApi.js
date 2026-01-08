// lib/proxmoxApi.js
// SSH connection to Proxmox host for VM management

import { Client } from 'ssh2';
import fs from 'fs';

const PROXMOX_HOST = process.env.PROXMOX_HOST || '192.168.205.30';
const PROXMOX_USER = process.env.PROXMOX_USER || 'root';
const PROXMOX_PASSWORD = process.env.PROXMOX_PASSWORD;
const PROXMOX_SSH_KEY = process.env.PROXMOX_SSH_KEY; // Path to private key file
const PROXMOX_REALM = process.env.PROXMOX_REALM || 'pve';

// Logging utility
function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  };
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, meta);
  // In production, send to proper logging service (e.g., Winston, Pino)
}

// Input sanitization to prevent command injection
export function sanitizeInput(input, type = 'alphanumeric') {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  switch (type) {
    case 'alphanumeric':
      // Allow letters, numbers, hyphens, underscores
      return input.replace(/[^a-zA-Z0-9_-]/g, '');
    case 'username':
      // Username: letters, numbers, dots, hyphens, underscores
      return input.replace(/[^a-zA-Z0-9._-]/g, '');
    case 'numeric':
      // Only numbers
      return input.replace(/[^0-9]/g, '');
    case 'path':
      // Safe path: alphanumeric, slash, dash, underscore, dot
      return input.replace(/[^a-zA-Z0-9/_.-]/g, '');
    default:
      throw new Error('Unknown sanitization type');
  }
}

// Escape shell arguments properly
export function escapeShellArg(arg) {
  // Use single quotes and escape any existing single quotes
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

// Execute command on Proxmox via SSH
export async function execSSH(command, options = {}) {
  const { timeout = 30000, logCommand = true } = options;
  
  return new Promise((resolve, reject) => {
    if (logCommand) {
      log('debug', 'Executing SSH command', { command: command.substring(0, 100) });
    }
    
    const conn = new Client();
    let output = '';
    let errorOutput = '';
    let timeoutId;

    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          log('error', 'SSH exec error', { error: err.message });
          return reject(err);
        }

        // Set command timeout
        timeoutId = setTimeout(() => {
          stream.close();
          conn.end();
          reject(new Error(`Command timeout after ${timeout}ms`));
        }, timeout);

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        stream.on('close', (code) => {
          clearTimeout(timeoutId);
          conn.end();
          
          if (code !== 0 && errorOutput) {
            log('error', 'Command failed', { code, stderr: errorOutput });
            reject(new Error(`Command failed (${code}): ${errorOutput}`));
          } else {
            if (logCommand) {
              log('debug', 'Command succeeded', { outputLength: output.length });
            }
            resolve(output.trim());
          }
        });
      });
    });

    conn.on('error', (err) => {
      log('error', 'SSH connection error', { error: err.message });
      reject(err);
    });

    // Support both password and SSH key authentication
    const connectionConfig = {
      host: PROXMOX_HOST,
      port: 22,
      username: PROXMOX_USER,
      readyTimeout: timeout,
    };

    if (PROXMOX_SSH_KEY) {
      try {
        connectionConfig.privateKey = fs.readFileSync(PROXMOX_SSH_KEY);
        log('info', 'Using SSH key authentication');
      } catch (err) {
        log('warn', 'Failed to read SSH key, falling back to password', { error: err.message });
        connectionConfig.password = PROXMOX_PASSWORD;
      }
    } else if (PROXMOX_PASSWORD) {
      connectionConfig.password = PROXMOX_PASSWORD;
    } else {
      reject(new Error('No authentication method configured (password or SSH key)'));
      return;
    }

    conn.connect(connectionConfig);
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
  try {
    log('info', 'Listing Proxmox users');
    const output = await execSSH('pveum user list --output-format json');
    return JSON.parse(output);
  } catch (error) {
    log('error', 'Failed to list users', { error: error.message });
    throw new Error(`Failed to list users: ${error.message}`);
  }
}

// Create Proxmox user with proper input validation
export async function proxmoxCreateUser({ userid, fullName, password }) {
  // Validate inputs
  if (!userid || !fullName || !password) {
    throw new Error('Missing required fields: userid, fullName, password');
  }
  
  // Sanitize username portion
  const usernamePart = sanitizeInput(userid.split('@')[0], 'username');
  const realm = getRealm();
  const sanitizedUserid = `${usernamePart}@${realm}`;
  
  // Validate password strength (basic check)
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  try {
    log('info', 'Creating Proxmox user', { userid: sanitizedUserid });
    
    const comment = JSON.stringify({ 
      fullName: fullName.substring(0, 100), // Limit length
      email: usernamePart,
      createdAt: new Date().toISOString()
    });
    
    // Use proper shell escaping
    await execSSH(
      `pveum user add ${escapeShellArg(sanitizedUserid)} --password ${escapeShellArg(password)} --comment ${escapeShellArg(comment)}`
    );
    
    log('info', 'User created successfully', { userid: sanitizedUserid });
    return { userid: sanitizedUserid, fullName };
  } catch (error) {
    log('error', 'Failed to create user', { userid: sanitizedUserid, error: error.message });
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

// Delete Proxmox user
export async function proxmoxDeleteUser({ userid }) {
  const sanitizedUserid = sanitizeInput(userid, 'username');
  
  try {
    log('info', 'Deleting Proxmox user', { userid: sanitizedUserid });
    await execSSH(`pveum user delete ${escapeShellArg(sanitizedUserid)}`);
    log('info', 'User deleted successfully', { userid: sanitizedUserid });
    return { userid: sanitizedUserid };
  } catch (error) {
    log('error', 'Failed to delete user', { userid: sanitizedUserid, error: error.message });
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

// Decode comment field
export function decodeComment(comment) {
  try {
    const parsed = JSON.parse(comment || '{}');
    return {
      email: parsed.email || '',
      fullName: parsed.fullName || '',
      createdAt: parsed.createdAt || null
    };
  } catch (error) {
    log('warn', 'Failed to parse user comment', { error: error.message });
    return { email: '', fullName: '', createdAt: null };
  }
}

// FIXED: Proper authentication without changing passwords
export async function authenticateUser(username, password) {
  const realm = getRealm();
  const sanitizedUsername = sanitizeInput(username, 'username');
  const userid = `${sanitizedUsername}@${realm}`;
  
  try {
    log('info', 'Attempting authentication', { username: sanitizedUsername });
    
    // Verify user exists
    const users = await proxmoxListUsers();
    const user = users.find(u => u.userid === userid);
    
    if (!user) {
      log('warn', 'Authentication failed: user not found', { username: sanitizedUsername });
      return { success: false, error: 'Invalid username or password' };
    }

    // SECURE: Test authentication by attempting a read-only operation
    // We'll try to create a temporary SSH connection with the user's credentials
    // This is more secure than trying to change passwords
    try {
      const testConn = new Client();
      
      const authResult = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          testConn.end();
          reject(new Error('Authentication timeout'));
        }, 10000);
        
        testConn.on('ready', () => {
          clearTimeout(timeout);
          testConn.end();
          resolve(true);
        });
        
        testConn.on('error', (err) => {
          clearTimeout(timeout);
          resolve(false);
        });
        
        testConn.connect({
          host: PROXMOX_HOST,
          port: 22,
          username: userid,
          password: password,
          readyTimeout: 10000,
        });
      });
      
      if (authResult) {
        log('info', 'Authentication successful', { username: sanitizedUsername });
        return { success: true, userid, username: sanitizedUsername };
      } else {
        log('warn', 'Authentication failed: invalid password', { username: sanitizedUsername });
        return { success: false, error: 'Invalid username or password' };
      }
    } catch (error) {
      log('error', 'Authentication error', { username: sanitizedUsername, error: error.message });
      return { success: false, error: 'Authentication failed' };
    }
  } catch (error) {
    log('error', 'Authentication system error', { error: error.message });
    return { success: false, error: 'System error during authentication' };
  }
}

// ==========================================
// VM MANAGEMENT FUNCTIONS
// ==========================================

// Check storage availability
export async function checkStorageSpace(storage = 'local-lvm') {
  try {
    const output = await execSSH(`pvesm status -storage ${storage}`);
    const lines = output.split('\n');
    if (lines.length < 2) return { available: 0, total: 0 };
    
    const dataLine = lines[1].trim().split(/\s+/);
    const total = parseInt(dataLine[3]) || 0;
    const used = parseInt(dataLine[4]) || 0;
    const available = total - used;
    
    log('debug', 'Storage check', { storage, available, total, used });
    return { available, total, used };
  } catch (error) {
    log('warn', 'Failed to check storage', { error: error.message });
    return { available: 0, total: 0, used: 0 };
  }
}

// List available templates (converted from OVAs)
export async function listAvailableTemplates() {
  try {
    log('info', 'Listing available VM templates');
    const output = await execSSH('ls -1 /var/lib/vz/template/qemu/*-metadata.json 2>/dev/null || echo ""');
    
    if (!output.trim()) {
      log('info', 'No templates found');
      return [];
    }
    
    const files = output.split('\n').filter(f => f.trim());
    const templates = [];
    
    for (const file of files) {
      try {
        const metadata = await execSSH(`cat ${escapeShellArg(file)}`);
        const data = JSON.parse(metadata);
        const vmName = file.match(/\/([^/]+)-metadata\.json$/)[1];
        templates.push({ id: vmName, name: vmName, ...data });
      } catch (e) {
        log('warn', `Failed to read template metadata: ${file}`, { error: e.message });
      }
    }
    
    log('info', 'Templates listed', { count: templates.length });
    return templates;
  } catch (e) {
    log('error', 'Error listing templates', { error: e.message });
    return [];
  }
}

// Check if user has active VMs
export async function checkUserActiveVMs(username) {
  const sanitizedUsername = sanitizeInput(username, 'username');
  
  try {
    log('debug', 'Checking active VMs for user', { username: sanitizedUsername });
    const output = await execSSH(`qm list | grep ${escapeShellArg(sanitizedUsername)} || true`);
    
    if (!output.trim()) {
      log('debug', 'No active VMs found', { username: sanitizedUsername });
      return [];
    }
    
    const vms = output.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const match = line.match(/^\s*(\d+)/);
        return match ? parseInt(match[1]) : null;
      })
      .filter(id => id !== null);
    
    log('debug', 'Active VMs found', { username: sanitizedUsername, count: vms.length });
    return vms;
  } catch (error) {
    log('warn', 'Failed to check user VMs', { username: sanitizedUsername, error: error.message });
    return [];
  }
}

// Find next available VM ID
export async function findAvailableVMID(startId = 2000) {
  const maxAttempts = 100;
  let vmid = startId + Math.floor(Math.random() * 8000);
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      await execSSH(`qm status ${vmid} 2>/dev/null`, { logCommand: false });
      // If command succeeds, VM exists, try next ID
      vmid++;
      attempts++;
    } catch {
      // VM doesn't exist, this ID is available
      log('debug', 'Found available VMID', { vmid });
      return vmid;
    }
  }
  
  throw new Error('Could not find available VM ID after 100 attempts');
}

// Deploy VM for user with comprehensive error handling
export async function deployVM({ vmName, username, memory = 2048, cores = 2 }) {
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
  const sanitizedVmName = sanitizeInput(vmName, 'alphanumeric');
  const sanitizedUsername = sanitizeInput(username, 'username');
  
  log('info', 'Starting VM deployment', { 
    vmName: sanitizedVmName, 
    username: sanitizedUsername,
    memory,
    cores
  });
  
  // Validate inputs
  if (!sanitizedVmName || !sanitizedUsername) {
    throw new Error('Invalid VM name or username');
  }
  
  if (memory < 512 || memory > 16384) {
    throw new Error('Memory must be between 512MB and 16GB');
  }
  
  if (cores < 1 || cores > 8) {
    throw new Error('Cores must be between 1 and 8');
  }
  
  // Check storage space
  const storage = await checkStorageSpace('local-lvm');
  const requiredSpace = 10 * 1024 * 1024; // 10GB in KB
  if (storage.available < requiredSpace) {
    throw new Error('Insufficient storage space');
  }
  
  // Check if template exists
  const diskPath = `/var/lib/vz/template/qemu/${sanitizedVmName}-disk0.qcow2`;
  try {
    await execSSH(`test -f ${escapeShellArg(diskPath)}`);
  } catch {
    log('error', 'Template not found', { vmName: sanitizedVmName });
    throw new Error(`Template ${sanitizedVmName} not found. Has it been converted?`);
  }
  
  // Check if user already has active VMs
  const activeVMs = await checkUserActiveVMs(sanitizedUsername);
  if (activeVMs.length > 0) {
    log('warn', 'User already has active VMs', { 
      username: sanitizedUsername, 
      activeVMs 
    });
    throw new Error(`You already have ${activeVMs.length} active VM(s). Please stop them before deploying new ones.`);
  }
  
  // Find available VM ID
  const vmid = await findAvailableVMID();
  const vmDisplayName = `${sanitizedVmName}-${sanitizedUsername}`;
  
  let deploymentStarted = false;
  
  try {
    log('info', 'Creating VM', { vmid, name: vmDisplayName });
    
    // Create VM
    await execSSH(`qm create ${vmid} \
      --name ${escapeShellArg(vmDisplayName)} \
      --memory ${memory} \
      --cores ${cores} \
      --net0 virtio,bridge=vmbr1`);
    
    deploymentStarted = true;
    
    // Import disk
    log('info', 'Importing disk', { vmid });
    await execSSH(`qm importdisk ${vmid} ${escapeShellArg(diskPath)} local-lvm`, { timeout: 120000 });
    
    // Configure boot
    log('info', 'Configuring VM boot', { vmid });
    await execSSH(`qm set ${vmid} --scsihw virtio-scsi-pci --scsi0 local-lvm:vm-${vmid}-disk-0`);
    await execSSH(`qm set ${vmid} --boot order=scsi0`);
    await execSSH(`qm set ${vmid} --vga std`);
    
    // Add metadata with proper escaping
    const metadata = {
      username: sanitizedUsername,
      vmName: sanitizedVmName,
      deployedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_TIMEOUT).toISOString(),
    };
    await execSSH(`qm set ${vmid} --description ${escapeShellArg(JSON.stringify(metadata))}`);
    
    // Start VM
    log('info', 'Starting VM', { vmid });
    await execSSH(`qm start ${vmid}`);
    
    // Wait for IP address
    log('info', 'Waiting for VM network', { vmid });
    let ipAddress = null;
    
    for (let i = 0; i < 12; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      try {
        const configOutput = await execSSH(`qm config ${vmid}`, { logCommand: false });
        const macMatch = configOutput.match(/virtio=([0-9A-Fa-f:]+)/);
        
        if (macMatch) {
          const mac = macMatch[1];
          const arpOutput = await execSSH(`arp -n | grep -i ${escapeShellArg(mac)} || true`, { logCommand: false });
          const ipMatch = arpOutput.match(/(\d+\.\d+\.\d+\.\d+)/);
          
          if (ipMatch) {
            ipAddress = ipMatch[1];
            log('info', 'VM network ready', { vmid, ipAddress });
            break;
          }
        }
      } catch (e) {
        log('debug', 'Still waiting for IP', { vmid, attempt: i + 1 });
      }
    }
    
    log('info', 'VM deployed successfully', { 
      vmid, 
      name: vmDisplayName, 
      ipAddress: ipAddress || 'pending'
    });
    
    return {
      vmid,
      name: vmDisplayName,
      ipAddress: ipAddress || 'Waiting for network... Check Proxmox console',
      startTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_TIMEOUT).toISOString(),
    };
    
  } catch (error) {
    log('error', 'VM deployment failed', { 
      vmid, 
      error: error.message,
      deploymentStarted
    });
    
    // Cleanup on failure
    if (deploymentStarted) {
      try {
        log('info', 'Cleaning up failed deployment', { vmid });
        await execSSH(`qm stop ${vmid} 2>/dev/null || true`, { logCommand: false });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await execSSH(`qm destroy ${vmid} --purge 2>/dev/null || true`, { logCommand: false });
        log('info', 'Cleanup completed', { vmid });
      } catch (cleanupError) {
        log('error', 'Cleanup failed', { vmid, error: cleanupError.message });
      }
    }
    
    throw error;
  }
}

// Stop and destroy VM with verification
export async function stopVM(vmid, username) {
  const sanitizedVmid = parseInt(sanitizeInput(String(vmid), 'numeric'));
  const sanitizedUsername = sanitizeInput(username, 'username');
  
  log('info', 'Stopping VM', { vmid: sanitizedVmid, username: sanitizedUsername });
  
  // Verify VM belongs to user
  try {
    const config = await execSSH(`qm config ${sanitizedVmid}`);
    if (!config.includes(sanitizedUsername)) {
      log('warn', 'Unauthorized VM stop attempt', { 
        vmid: sanitizedVmid, 
        username: sanitizedUsername 
      });
      throw new Error('VM does not belong to you');
    }
  } catch (e) {
    if (e.message.includes('does not exist')) {
      log('info', 'VM already deleted', { vmid: sanitizedVmid });
      return { vmid: sanitizedVmid, message: 'VM already deleted' };
    }
    throw e;
  }
  
  // Stop VM gracefully first
  try {
    log('info', 'Attempting graceful shutdown', { vmid: sanitizedVmid });
    await execSSH(`qm shutdown ${sanitizedVmid} --timeout 30`, { timeout: 35000 });
  } catch {
    // If graceful shutdown fails, force stop
    log('info', 'Graceful shutdown failed, forcing stop', { vmid: sanitizedVmid });
    try {
      await execSSH(`qm stop ${sanitizedVmid}`);
    } catch (stopError) {
      log('warn', 'Force stop failed', { vmid: sanitizedVmid, error: stopError.message });
    }
  }
  
  // Wait for shutdown
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Destroy VM
  try {
    await execSSH(`qm destroy ${sanitizedVmid} --purge`);
    log('info', 'VM destroyed successfully', { vmid: sanitizedVmid });
  } catch (error) {
    log('error', 'Failed to destroy VM', { vmid: sanitizedVmid, error: error.message });
    throw new Error(`Failed to destroy VM: ${error.message}`);
  }
  
  return { vmid: sanitizedVmid, message: 'VM stopped and removed' };
}

// Get VM status with metadata
export async function getVMStatus(vmid) {
  const sanitizedVmid = parseInt(sanitizeInput(String(vmid), 'numeric'));
  
  try {
    const statusOutput = await execSSH(`qm status ${sanitizedVmid}`);
    const configOutput = await execSSH(`qm config ${sanitizedVmid}`);
    
    // Parse description for metadata
    const descMatch = configOutput.match(/description: (.+)/);
    let metadata = {};
    if (descMatch) {
      try {
        metadata = JSON.parse(descMatch[1]);
      } catch (parseError) {
        log('warn', 'Failed to parse VM metadata', { vmid: sanitizedVmid });
      }
    }
    
    // Get IP if possible
    let ipAddress = null;
    try {
      const macMatch = configOutput.match(/virtio=([0-9A-Fa-f:]+)/);
      if (macMatch) {
        const arpOutput = await execSSH(`arp -n | grep -i ${escapeShellArg(macMatch[1])} || true`, { logCommand: false });
        const ipMatch = arpOutput.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (ipMatch) ipAddress = ipMatch[1];
      }
    } catch (ipError) {
      log('debug', 'Could not determine IP', { vmid: sanitizedVmid });
    }
    
    return {
      vmid: sanitizedVmid,
      status: statusOutput.includes('running') ? 'running' : 'stopped',
      ipAddress: ipAddress || 'Unknown',
      ...metadata,
    };
  } catch (e) {
    log('warn', 'VM not found', { vmid: sanitizedVmid });
    throw new Error(`VM ${sanitizedVmid} not found`);
  }
}

// NEW: Cleanup expired VMs
export async function cleanupExpiredVMs() {
  log('info', 'Starting cleanup of expired VMs');
  
  try {
    const vmList = await execSSH('qm list | tail -n +2 | awk \'{print $1}\'');
    const vmids = vmList.split('\n').filter(id => id.trim()).map(id => parseInt(id));
    
    let cleanedCount = 0;
    
    for (const vmid of vmids) {
      try {
        const status = await getVMStatus(vmid);
        
        if (status.expiresAt) {
          const expiryDate = new Date(status.expiresAt);
          const now = new Date();
          
          if (now > expiryDate) {
            log('info', 'Cleaning up expired VM', { 
              vmid, 
              expiredAt: status.expiresAt,
              username: status.username 
            });
            
            await stopVM(vmid, status.username);
            cleanedCount++;
          }
        }
      } catch (error) {
        log('warn', 'Failed to process VM during cleanup', { vmid, error: error.message });
      }
    }
    
    log('info', 'Cleanup completed', { cleanedCount });
    return { cleanedCount };
  } catch (error) {
    log('error', 'Cleanup failed', { error: error.message });
    throw error;
  }
}