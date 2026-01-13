
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
    console.log(`[START] Starting VM ${vmId}...`);

    await execSSH(`qm start ${vmId}`);

    console.log(`[START] VM ${vmId} started`);

    res.status(200).json({
      success: true,
      message: `VM ${vmId} started`
    });
  } catch (error) {
    console.error('[START ERROR]', error);
    res.status(500).json({
      error: 'Failed to start VM',
      details: error.message
    });
  }
}