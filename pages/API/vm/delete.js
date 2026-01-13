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
    console.log(`[DELETE] Deleting VM ${vmId}...`);

    try {
      await execSSH(`qm stop ${vmId}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (stopError) {
      console.log(`[DELETE] VM ${vmId} stop error:`, stopError.message);
    }

    await execSSH(`qm destroy ${vmId} --purge`);

    console.log(`[DELETE] VM ${vmId} deleted`);

    res.status(200).json({
      success: true,
      message: `VM ${vmId} deleted`
    });
  } catch (error) {
    console.error('[DELETE ERROR]', error);
    res.status(500).json({
      error: 'Failed to delete VM',
      details: error.message
    });
  }
}