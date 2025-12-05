import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execPromise = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { vmName, userName } = req.body;

  if (!vmName || !userName) {
    return res.status(400).json({ error: 'vmName and userName are required' });
  }

  try {
    const S3_PATH = '/mnt/s3-bucket/vulnerable-machines';
    const TEMP_DIR = `/tmp/vm-deploy-${Date.now()}`;
    const STORAGE = 'local-lvm';
    const MEMORY = '2048';
    const NETWORK = 'virtio,bridge=vmbr0';

    // Find available VM ID
    const { stdout: vmListOutput } = await execPromise('qm list | awk \'NR>1 {print $1}\' | sort -n | tail -1');
    const lastVmId = parseInt(vmListOutput.trim()) || 100;
    const newVmId = lastVmId + 1;

    // Find OVA file
    const { stdout: findOutput } = await execPromise(`find ${S3_PATH} -name "*${vmName}*.ova" | head -1`);
    const ovaFile = findOutput.trim();

    if (!ovaFile) {
      return res.status(404).json({ error: `VM '${vmName}' not found in S3` });
    }

    console.log(`Deploying VM: ${vmName} for user: ${userName} with ID: ${newVmId}`);

    // Create temp directory
    await execPromise(`mkdir -p ${TEMP_DIR}`);

    // Extract OVA
    console.log('Extracting OVA...');
    await execPromise(`cd ${TEMP_DIR} && tar -xf "${ovaFile}"`);

    // Find VMDK file
    const { stdout: vmdkOutput } = await execPromise(`ls ${TEMP_DIR}/*.vmdk | head -1`);
    const vmdkFile = vmdkOutput.trim();

    if (!vmdkFile) {
      throw new Error('No VMDK file found in OVA');
    }

    // Create VM
    console.log('Creating VM...');
    await execPromise(`qm create ${newVmId} \
      --name "${vmName}-${userName}" \
      --memory ${MEMORY} \
      --net0 ${NETWORK} \
      --scsihw virtio-scsi-pci \
      --description "Deployed for user: ${userName} on $(date)"`);

    // Import disk
    console.log('Importing disk...');
    await execPromise(`qm importdisk ${newVmId} "${vmdkFile}" ${STORAGE}`);

    // Attach disk and configure boot
    console.log('Configuring VM...');
    await execPromise(`qm set ${newVmId} --scsi0 ${STORAGE}:vm-${newVmId}-disk-0`);
    await execPromise(`qm set ${newVmId} --boot order=scsi0`);

    // Cleanup
    console.log('Cleaning up...');
    await execPromise(`rm -rf ${TEMP_DIR}`);

    // Log deployment
    try {
      const logEntry = `${new Date().toISOString()} - ${userName} deployed ${vmName} (VM ${newVmId})\n`;
      fs.appendFileSync('/var/log/vm-deployments.log', logEntry);
    } catch (logError) {
      console.error('Failed to log deployment:', logError);
    }

    console.log(`VM ${newVmId} deployed successfully`);

    res.status(200).json({
      success: true,
      vmId: newVmId,
      vmName: `${vmName}-${userName}`,
      message: 'VM deployed successfully'
    });

  } catch (error) {
    console.error('Error deploying VM:', error);
    res.status(500).json({
      error: 'Failed to deploy VM',
      details: error.message
    });
  }
}