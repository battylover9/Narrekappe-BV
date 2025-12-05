import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get list of VMs
    const { stdout } = await execPromise('qm list');
    
    const lines = stdout.trim().split('\n');
    
    if (lines.length <= 1) {
      return res.status(200).json({ deployments: [] });
    }

    const deployments = [];

    // Parse each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].trim().split(/\s+/);
      
      if (parts.length >= 3) {
        deployments.push({
          vmid: parts[0],
          name: parts[1],
          status: parts[2]
        });
      }
    }

    res.status(200).json({ deployments });
  } catch (error) {
    console.error('Error listing deployments:', error);
    res.status(500).json({ error: 'Failed to list deployments', details: error.message });
  }
}