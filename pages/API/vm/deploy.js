import { execSSH } from '../../../lib/proxmoxApi';

// Input sanitization
function sanitizeInput(input, type = 'alphanumeric') {
  const patterns = {
    alphanumeric: /^[a-zA-Z0-9_-]+$/,
    username: /^[a-z][a-z0-9_-]{2,31}$/,
  };

  if (!patterns[type] || !patterns[type].test(input)) {
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { vmName, userName } = req.body;

    // Validate inputs
    if (!vmName || !userName) {
      return res.status(400).json({ error: 'VM name and username required' });
    }

    if (!sanitizeInput(vmName, 'alphanumeric') || !sanitizeInput(userName, 'username')) {
      return res.status(400).json({ error: 'Invalid input format' });
    }

    console.log(`[DEPLOY] User ${userName} deploying ${vmName}`);

    // Check if user already has this VM type
    const existingVMs = await execSSH('qm list');
    const newVMName = `${vmName}-${userName}`;
    
    if (existingVMs.includes(newVMName)) {
      return res.status(409).json({ 
        success: false,
        error: `You already have a ${vmName} VM deployed` 
      });
    }

    // Find the template VMID
    const templateMap = {
      'chronos': '9000',
      'jangow': '9001'
    };

    const templateId = templateMap[vmName];
    if (!templateId) {
      return res.status(400).json({ error: 'Invalid VM template' });
    }

    // Find next available VM ID (start from 2000 for student VMs)
    const vmids = existingVMs.match(/\d+/g) || [];
    let nextId = 2000;
    while (vmids.includes(String(nextId))) {
      nextId++;
    }

    console.log(`[DEPLOY] Cloning template ${templateId} to VM ${nextId} with name ${newVMName}`);

    // Clone the template with user-specific name
    const cloneCmd = `qm clone ${templateId} ${nextId} --name "${newVMName}" --full`;
    await execSSH(cloneCmd);

    console.log(`[DEPLOY] Starting VM ${nextId}`);

    // Start the VM
    await execSSH(`qm start ${nextId}`);

    console.log(`[DEPLOY] Successfully deployed ${newVMName} (${nextId})`);

    return res.status(200).json({
      success: true,
      vmid: nextId,
      vmName: newVMName,
      status: 'running',
      message: 'VM deployed successfully'
    });

  } catch (error) {
    console.error('[DEPLOY] Error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Deployment failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}