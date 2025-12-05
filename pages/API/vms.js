import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Mock data for local development
const MOCK_VMS = [
  {
    name: 'Chronos',
    displayName: 'Chronos',
    size: '1.7G',
    fileName: 'Chronos.ova',
    path: '/mnt/s3-bucket/vulnerable-machines/Chronos.ova'
  },
  {
    name: 'jangow-01-1.0.1',
    displayName: 'Jangow 01',
    size: '828M',
    fileName: 'jangow-01-1.0.1.ova',
    path: '/mnt/s3-bucket/vulnerable-machines/jangow-01-1.0.1.ova'
  },
  {
    name: 'matrix-breakout-2-morpheus',
    displayName: 'Matrix Breakout 2 Morpheus',
    size: '805M',
    fileName: 'matrix-breakout-2-morpheus.ova',
    path: '/mnt/s3-bucket/vulnerable-machines/matrix-breakout-2-morpheus.ova'
  }
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const S3_PATH = '/mnt/s3-bucket/vulnerable-machines';
    
    // Check if we're in a development environment without S3 mount
    let vms = [];
    
    try {
      // Try to list OVA files in S3
      const { stdout } = await execPromise(`ls -1 ${S3_PATH}/*.ova 2>/dev/null || echo ""`);
      
      if (!stdout.trim()) {
        // No S3 mount found, use mock data
        console.log('S3 mount not found, using mock data');
        return res.status(200).json({ vms: MOCK_VMS });
      }

      vms = stdout
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
    } catch (error) {
      // If any error occurs, fall back to mock data
      console.log('Error accessing S3, using mock data:', error.message);
      return res.status(200).json({ vms: MOCK_VMS });
    }

    res.status(200).json({ vms });
  } catch (error) {
    console.error('Error listing VMs:', error);
    // Return mock data even on error
    res.status(200).json({ vms: MOCK_VMS });
  }
}