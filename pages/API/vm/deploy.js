import { execSSH } from '../../../lib/proxmoxApi';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { vmName, userName } = req.body;

  console.log('[DEPLOY] Request:', { vmName, userName });

  try {
    // Simple sanitization
    const cleanVmName = vmName.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanUserName = userName.replace(/[^a-zA-Z0-9_-]/g, '');

    const diskPath = `/var/lib/vz/template/qemu/${cleanVmName}-disk0.qcow2`;

    console.log('[DEPLOY] Checking template:', diskPath);
    await execSSH(`test -f "${diskPath}"`);

    console.log('[DEPLOY] Getting VM ID...');
    const vmList = await execSSH('qm list | tail -n +2 | awk \'{print $1}\' | sort -n | tail -1');
    const nextId = (parseInt(vmList.trim()) || 100) + 1;

    console.log('[DEPLOY] Creating VM', nextId);
    const vmName2 = `${cleanVmName}-${cleanUserName}`;

    await execSSH(`qm create ${nextId} --name "${vmName2}" --memory 2048 --cores 2 --net0 virtio,bridge=vmbr1`);

    console.log('[DEPLOY] Importing disk...');
    await execSSH(`qm importdisk ${nextId} "${diskPath}" local-lvm`, { timeout: 120000 });

    console.log('[DEPLOY] Configuring...');
    await execSSH(`qm set ${nextId} --scsi0 local-lvm:vm-${nextId}-disk-0`);
    await execSSH(`qm set ${nextId} --boot order=scsi0`);

    console.log('[DEPLOY] Starting...');
    await execSSH(`qm start ${nextId}`);

    console.log('[DEPLOY] Complete!');

    return res.status(200).json({
      success: true,
      vmId: nextId,
      vmName: vmName2,
      message: 'VM deployed!'
    });

  } catch (error) {
    console.error('[DEPLOY ERROR]', error.message);
    return res.status(500).json({
      error: error.message
    });
  }
}