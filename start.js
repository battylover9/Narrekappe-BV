import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { vmId } = req.body;

  if (!vmId) {
    return res.status(400).json({ error: 'vmId is required' });
  }

  try {
    await execPromise(`qm start ${vmId}`);
    res.status(200).json({ success: true, message: `VM ${vmId} started` });
  } catch (error) {
    console.error('Error starting VM:', error);
    res.status(500).json({ error: 'Failed to start VM', details: error.message });
  }
}