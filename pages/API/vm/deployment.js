// pages/api/vm/deployment.js
// UPDATED: Uses SSH instead of local exec

import { execSSH } from '../../../lib/proxmoxApi';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[DEPLOYMENT] Listing all VMs...');

    const output = await execSSH('qm list');
    
    const lines = output.trim().split('\n');
    
    if (lines.length <= 1) {
      return res.status(200).json({ deployments: [] });
    }

    const deployments = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].trim().split(/\s+/);
      
      if (parts.length >= 3) {
        deployments.push({
          vmid: parts[0],
          name: parts[1],
          status: parts[2],
          memory: parts[3] || 'N/A',
          bootdisk: parts[4] || 'N/A',
          pid: parts[5] || 'N/A'
        });
      }
    }

    console.log(`[DEPLOYMENT] Found ${deployments.length} VMs`);

    res.status(200).json({ 
      deployments,
      total: deployments.length 
    });
  } catch (error) {
    console.error('[DEPLOYMENT ERROR]', error);
    res.status(500).json({ 
      error: 'Failed to list deployments', 
      details: error.message 
    });
  }
}