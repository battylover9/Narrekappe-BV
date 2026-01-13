import { execSSH } from '../../../lib/proxmoxApi';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userName } = req.query;

    if (!userName) {
      return res.status(400).json({ error: 'Username required' });
    }

    console.log(`[DEPLOYMENT] Fetching VMs for user: ${userName}`);

    // Get all VMs
    const vmListOutput = await execSSH('qm list');
    const lines = vmListOutput.split('\n').filter(line => line.trim());
    
    const userDeployments = [];

    // Parse VM list (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(/\s+/);
      const vmid = parts[0];
      const name = parts[1];
      const status = parts[2];
      
      // CRITICAL: Only include VMs that belong to this user
      // VM naming convention: <template>-<username>
      // Example: chronos-jdoe, jangow-jsmith
      if (name.endsWith(`-${userName}`)) {
        try {
          // Get VM details
          const config = await execSSH(`qm config ${vmid}`);
          
          // Extract memory
          let memory = '2048';
          const memMatch = config.match(/memory:\s*(\d+)/);
          if (memMatch) {
            memory = memMatch[1];
          }

          // Extract bootdisk
          let bootdisk = 'scsi0';
          const bootMatch = config.match(/boot:.*order=([\w\d]+)/);
          if (bootMatch) {
            bootdisk = bootMatch[1];
          }

          userDeployments.push({
            vmid: vmid,
            name: name,
            status: status.toLowerCase(),
            memory: memory,
            bootdisk: bootdisk
          });

          console.log(`[DEPLOYMENT] Found user VM: ${name} (${vmid})`);
        } catch (err) {
          console.error(`[DEPLOYMENT] Error getting config for VM ${vmid}:`, err.message);
        }
      } else {
        console.log(`[DEPLOYMENT] Skipping VM ${name} - doesn't belong to ${userName}`);
      }
    }

    console.log(`[DEPLOYMENT] User ${userName} has ${userDeployments.length} VMs`);

    return res.status(200).json({
      success: true,
      deployments: userDeployments,
      userName: userName
    });

  } catch (error) {
    console.error('[DEPLOYMENT] Error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch deployments',
      deployments: []
    });
  }
}