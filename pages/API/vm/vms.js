import { execSSH } from '../../../lib/proxmoxApi';

const VM_INFO = {
  'chronos': {
    displayName: 'Chronos',
    difficulty: 'Intermediate',
    description: 'Vulnerable machine with various attack vectors.',
    categories: ['Web', 'Linux', 'PrivEsc'],
    estimatedTime: '3-5 hours',
  },
  'jangow-01-1.0.1': {
    displayName: 'Jangow 01',
    difficulty: 'Intermediate',
    description: 'CTF-style vulnerable machine.',
    categories: ['CTF', 'Web', 'Linux'],
    estimatedTime: '3-5 hours',
  },
  'matrix-breakout-2-morpheus': {
    displayName: 'Matrix Breakout 2 Morpheus',
    difficulty: 'Advanced',
    description: 'Advanced CTF requiring deep understanding of Linux and cryptography.',
    categories: ['CTF', 'Crypto', 'Linux'],
    estimatedTime: '4-8 hours',
  },
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const TEMPLATE_DIR = '/var/lib/vz/template/qemu';

    console.log('[VMS] Listing available templates...');

    let output;
    try {
      output = await execSSH(`ls -lh ${TEMPLATE_DIR}/*-disk0.qcow2 2>/dev/null || echo ""`);
    } catch (error) {
      console.error('[VMS] Error listing templates:', error.message);
      return res.status(200).json({ vms: [] });
    }

    if (!output.trim()) {
      console.log('[VMS] No templates found');
      return res.status(200).json({ vms: [] });
    }

    const lines = output.trim().split('\n');
    const vms = [];

    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length < 9) continue;

      const size = parts[4];
      const filePath = parts.slice(8).join(' ');
      const fileName = filePath.split('/').pop();

      const vmName = fileName.replace('-disk0.qcow2', '');

      const info = VM_INFO[vmName] || {
        displayName: vmName.charAt(0).toUpperCase() + vmName.slice(1).replace(/-/g, ' '),
        difficulty: 'Unknown',
        description: 'Vulnerable machine for penetration testing practice',
        categories: ['General'],
        estimatedTime: '2-4 hours',
      };

      vms.push({
        name: vmName,
        displayName: info.displayName,
        difficulty: info.difficulty,
        description: info.description,
        categories: info.categories,
        estimatedTime: info.estimatedTime,
        size: size,
        fileName: fileName,
        available: true,
      });
    }

    console.log(`[VMS] Found ${vms.length} templates`);

    res.status(200).json({ vms });
  } catch (error) {
    console.error('[VMS ERROR]', error);
    res.status(500).json({
      error: 'Failed to list VMs',
      details: error.message
    });
  }
}