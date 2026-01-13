import { execSSH } from '../../../lib/proxmoxApi';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[LIST-TEMPLATES] Fetching VM templates...');

    const vmList = await execSSH('qm list');

    const lines = vmList.split('\n').filter(line => line.trim());
    const templates = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(/\s+/);
      const vmid = parts[0];
      const name = parts[1];

      try {
        const config = await execSSH(`qm config ${vmid}`);

        if (config.includes('template:') || name.includes('template') || name.includes('chronos') || name.includes('jangow')) {
          let size = 'Unknown';
          const sizeMatch = config.match(/size=(\d+[GMK])/);
          if (sizeMatch) {
            size = sizeMatch[1];
          }

          templates.push({
            vmid: vmid,
            name: name,
            displayName: name.replace('-template', '').replace('template-', ''),
            difficulty: name.includes('jangow') ? 'Beginner' : 'Intermediate',
            size: size
          });
        }
      } catch (err) {
        console.error(`[LIST-TEMPLATES] Error checking VM ${vmid}:`, err.message);
      }
    }

    if (templates.length === 0) {
      templates.push(
        {
          vmid: '9000',
          name: 'chronos',
          displayName: 'Chronos',
          difficulty: 'Intermediate',
          size: '3.8G'
        },
        {
          vmid: '9001',
          name: 'jangow',
          displayName: 'Jangow',
          difficulty: 'Beginner',
          size: '2.1G'
        }
      );
    }

    console.log(`[LIST-TEMPLATES] Found ${templates.length} templates`);
    return res.status(200).json({
      success: true,
      templates: templates
    });

  } catch (error) {
    console.error('[LIST-TEMPLATES] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
      templates: [
        {
          vmid: '9000',
          name: 'chronos',
          displayName: 'Chronos',
          difficulty: 'Intermediate',
          size: '3.8G'
        },
        {
          vmid: '9001',
          name: 'jangow',
          displayName: 'Jangow',
          difficulty: 'Beginner',
          size: '2.1G'
        }
      ]
    });
  }
}