import { execSSH, sanitizeInput } from '../../../lib/proxmoxApi';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { vmName, userName } = req.body;

  if (!vmName || !userName) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      details: 'vmName and userName are required' 
    });
  }

  try {
    const sanitizedVmName = sanitizeInput(vmName, 'alphanumeric');
    const sanitizedUserName = sanitizeInput(userName, 'username');

    if (!sanitizedVmName || !sanitizedUserName) {
      return res.status(400).json({ 
        error: 'Invalid input',
        details: 'vmName or userName contains invalid characters' 
      });
    }

    const TEMPLATE_DIR = '/var/lib/vz/template/qemu';
    const STORAGE = 'local-lvm';
    const MEMORY = '2048';
    const CORES = '2';
    const NETWORK = 'virtio,bridge=vmbr1';

    console.log(`[DEPLOY] User ${sanitizedUserName} requesting ${sanitizedVmName}`);

    // Check if template exists
    const diskPath = `${TEMPLATE_DIR}/${sanitizedVmName}-disk0.qcow2`;
    try {
      await execSSH(`test -f "${diskPath}"`);
    } catch {
      return res.status(404).json({ 
        error: `VM template '${sanitizedVmName}' not found. Has it been converted from OVA?` 
      });
    }

    // Check if user already has an active VM
    try {
      const activeVMs = await execSSH(`qm list | grep "${sanitizedUserName}" || true`);
      if (activeVMs.trim()) {
        const vmid = activeVMs.trim().split(/\s+/)[0];
        return res.status(400).json({
          error: 'You already have an active VM. Please stop it before starting a new one.',
          activeVMID: parseInt(vmid)
        });
      }
    } catch (err) {
      console.log('[DEPLOY] Could not check active VMs:', err.message);
    }

    // FIXED: Simple and reliable VM ID generation
    const vmListOutput = await execSSH('qm list 2>/dev/null | awk \'NR>1 {print $1}\' | sort -n | tail -1 || echo "100"');
    const lastVmId = parseInt(vmListOutput.trim()) || 100;
    const newVmId = lastVmId + 1;

    console.log(`[DEPLOY] Using VM ID: ${newVmId}`);

    const vmDisplayName = `${sanitizedVmName}-${sanitizedUserName}`;
    const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

    console.log(`[DEPLOY] Creating VM ${newVmId}...`);

    // Create VM
    await execSSH(`qm create ${newVmId} \
      --name "${vmDisplayName}" \
      --memory ${MEMORY} \
      --cores ${CORES} \
      --net0 ${NETWORK} \
      --scsihw virtio-scsi-pci \
      --description "Deployed for: ${sanitizedUserName} at $(date +%Y-%m-%d_%H:%M:%S)"`);

    // Import disk from template
    console.log(`[DEPLOY] Importing disk...`);
    await execSSH(`qm importdisk ${newVmId} "${diskPath}" ${STORAGE}`, { timeout: 120000 });

    // Attach disk and configure boot
    console.log(`[DEPLOY] Configuring boot...`);
    await execSSH(`qm set ${newVmId} --scsi0 ${STORAGE}:vm-${newVmId}-disk-0`);
    await execSSH(`qm set ${newVmId} --boot order=scsi0`);
    await execSSH(`qm set ${newVmId} --vga std`);

    // Start VM
    console.log(`[DEPLOY] Starting VM ${newVmId}...`);
    await execSSH(`qm start ${newVmId}`);

    // Wait for IP address (try for 60 seconds)
    let ipAddress = null;
    console.log(`[DEPLOY] Waiting for IP address...`);
    for (let i = 0; i < 12; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      try {
        const configOutput = await execSSH(`qm config ${newVmId}`);
        const macMatch = configOutput.match(/virtio=([0-9A-Fa-f:]+)/);
        
        if (macMatch) {
          const mac = macMatch[1];
          const arpOutput = await execSSH(`arp -n | grep -i "${mac}" || true`);
          const ipMatch = arpOutput.match(/(\d+\.\d+\.\d+\.\d+)/);
          
          if (ipMatch) {
            ipAddress = ipMatch[1];
            console.log(`[DEPLOY] Found IP: ${ipAddress}`);
            break;
          }
        }
      } catch (err) {
        // Continue trying
      }
    }

    console.log(`[DEPLOY] VM ${newVmId} deployed successfully`);

    return res.status(200).json({
      success: true,
      vmId: newVmId,
      vmName: vmDisplayName,
      ipAddress: ipAddress || 'Waiting for network... Check Proxmox console',
      message: 'VM deployed successfully! Wait 1-2 minutes for full boot.',
      expiresAt: new Date(Date.now() + SESSION_TIMEOUT).toISOString(),
      startTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('[DEPLOY ERROR]', error.message);
    
    const statusCode = error.message.includes('already have') ? 400 :
                      error.message.includes('not found') ? 404 :
                      error.message.includes('Insufficient') ? 507 : 500;
    
    return res.status(statusCode).json({
      success: false,
      error: 'Failed to deploy VM',
      details: error.message
    });
  }
}

export default handler;