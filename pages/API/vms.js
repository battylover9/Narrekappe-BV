import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const S3_PATH = '/mnt/s3-bucket/vulnerable-machines';
    
    // List OVA files in S3
    const { stdout } = await execPromise(`ls -1 ${S3_PATH}/*.ova 2>/dev/null || echo ""`);
    
    if (!stdout.trim()) {
      return res.status(200).json({ vms: [] });
    }

    const vms = stdout
      .trim()
      .split('\n')
      .filter(line => line.endsWith('.ova'))
      .map(filePath => {
        const fileName = filePath.split('/').pop();
        const vmName = fileName.replace('.ova', '');
        
        return {
          name: vmName,
          displayName: vmName
            .replace(/-/g, ' ')
            .replace(/\d+\.\d+\.\d+/g, '')
            .trim(),
          fileName: fileName,
          path: filePath
        };
      });

    // Get file sizes
    for (let vm of vms) {
      try {
        const { stdout: sizeOutput } = await execPromise(`du -h "${vm.path}" | cut -f1`);
        vm.size = sizeOutput.trim();
      } catch (error) {
        vm.size = 'Unknown';
      }
    }

    res.status(200).json({ vms });
  } catch (error) {
    console.error('Error listing VMs:', error);
    res.status(500).json({ error: 'Failed to list VMs', details: error.message });
  }
}