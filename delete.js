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
    // Stop VM first (ignore errors if already stopped)
    try {
      await execPromise(`qm stop ${vmId}`);
      // Wait a bit for VM to stop
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (stopError) {
      // VM might already be stopped, continue
    }

    // Destroy VM
    await execPromise(`qm destroy ${vmId}`);
    
    res.status(200).json({ success: true, message: `VM ${vmId} deleted` });
  } catch (error) {
    console.error('Error deleting VM:', error);
    res.status(500).json({ error: 'Failed to delete VM', details: error.message });
  }
}