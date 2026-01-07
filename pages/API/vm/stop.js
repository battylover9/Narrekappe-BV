// pages/api/vm/stop.js
// UPDATED: Uses SSH instead of local exec

import { execSSH } from '../../../lib/proxmoxApi';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { vmId } = req.body;

  if (!vmId) {
    return res.status(400).json({ error: 'vmId is required' });
  }

  try {
    console.log(`[STOP] Stopping VM ${vmId}...`);

    // Stop VM first (ignore errors if already stopped)
    try {
      await execSSH(`qm stop ${vmId}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (stopError) {
      console.log(`[STOP] VM ${vmId} already stopped or error:`, stopError.message);
    }

    // Destroy VM completely
    await execSSH(`qm destroy ${vmId} --purge`);
    
    console.log(`[STOP] VM ${vmId} destroyed`);
    
    res.status(200).json({ 
      success: true, 
      message: `VM ${vmId} stopped and removed` 
    });
  } catch (error) {
    console.error('[STOP ERROR]', error);
    res.status(500).json({ 
      error: 'Failed to stop VM', 
      details: error.message 
    });
  }
}