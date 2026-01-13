import { execSSH } from '../../../lib/proxmoxApi';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userName } = req.query;

  console.log('[DEPLOYMENT] Request from user:', userName);

  try {
    const output = await execSSH('qm list');
    const lines = output.trim().split('\n');

    if (lines.length <= 1) {
      return res.status(200).json({ deployments: [] });
    }

    const deployments = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].trim().split(/\s+/);

      if (parts.length >= 3) {
        const vmid = parts[0];
        const name = parts[1];
        const status = parts[2];

        if (userName && !name.toLowerCase().includes(userName.toLowerCase())) {
          console.log('[DEPLOYMENT] Skipping VM:', name, '(not for user', userName + ')');
          continue;
        }

        console.log('[DEPLOYMENT] Including VM:', name);

        deployments.push({
          vmid: vmid,
          name: name,
          status: status,
          memory: parts[3] || 'N/A'
        });
      }
    }

    console.log(`[DEPLOYMENT] Returning ${deployments.length} VMs for user ${userName}`);

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