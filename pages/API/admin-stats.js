import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execPromise = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all VMs with detailed stats
    const { stdout: resourceStats } = await execPromise(
      'pvesh get /cluster/resources --type vm --output-format json'
    ).catch(() => ({ stdout: '[]' }));
    
    const vms = JSON.parse(resourceStats || '[]');

    // Calculate totals
    const totalVMs = vms.length;
    const runningVMs = vms.filter(vm => vm.status === 'running').length;
    const stoppedVMs = vms.filter(vm => vm.status === 'stopped').length;
    
    // Calculate resource usage
    const totalCPUUsage = vms.reduce((sum, vm) => sum + (vm.cpu || 0), 0);
    const totalMemUsed = vms.reduce((sum, vm) => sum + (vm.mem || 0), 0);
    const totalMemMax = vms.reduce((sum, vm) => sum + (vm.maxmem || 0), 0);
    const totalDiskUsed = vms.reduce((sum, vm) => sum + (vm.disk || 0), 0);
    const totalDiskMax = vms.reduce((sum, vm) => sum + (vm.maxdisk || 0), 0);

    // Get deployment log if exists
    let recentDeployments = [];
    try {
      if (fs.existsSync('/var/log/vm-deployments.log')) {
        const logContent = fs.readFileSync('/var/log/vm-deployments.log', 'utf-8');
        const lines = logContent.trim().split('\n').slice(-10); // Last 10 entries
        recentDeployments = lines.filter(Boolean).map(line => {
          const match = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*?) - (.*?) deployed (.*?) \(VM (\d+)\)/);
          if (match) {
            return {
              timestamp: match[1],
              userName: match[2],
              vmName: match[3],
              vmId: match[4]
            };
          }
          return null;
        }).filter(Boolean);
      }
    } catch (err) {
      console.log('Could not read deployment log:', err.message);
    }

    // Format VM details
    const vmDetails = vms.map(vm => ({
      vmid: vm.vmid,
      name: vm.name || 'Unknown',
      status: vm.status,
      cpuUsage: ((vm.cpu || 0) * 100).toFixed(1),
      memUsage: vm.mem ? (vm.mem / 1024 / 1024).toFixed(0) : '0',
      memMax: vm.maxmem ? (vm.maxmem / 1024 / 1024).toFixed(0) : '0',
      memPercent: vm.maxmem ? ((vm.mem / vm.maxmem) * 100).toFixed(1) : '0',
      diskUsage: vm.disk ? (vm.disk / 1024 / 1024 / 1024).toFixed(1) : '0',
      diskMax: vm.maxdisk ? (vm.maxdisk / 1024 / 1024 / 1024).toFixed(1) : '0',
      uptime: vm.uptime ? formatUptime(vm.uptime) : '-',
      node: vm.node || 'pve'
    }));

    res.status(200).json({
      summary: {
        totalVMs,
        runningVMs,
        stoppedVMs,
        cpuUsage: (totalCPUUsage * 100).toFixed(1),
        memUsed: (totalMemUsed / 1024 / 1024 / 1024).toFixed(2),
        memMax: (totalMemMax / 1024 / 1024 / 1024).toFixed(2),
        memPercent: totalMemMax > 0 ? ((totalMemUsed / totalMemMax) * 100).toFixed(1) : '0',
        diskUsed: (totalDiskUsed / 1024 / 1024 / 1024).toFixed(2),
        diskMax: (totalDiskMax / 1024 / 1024 / 1024).toFixed(2)
      },
      vms: vmDetails,
      recentDeployments
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats', 
      details: error.message,
      // Return mock data in case of error
      summary: {
        totalVMs: 0,
        runningVMs: 0,
        stoppedVMs: 0,
        cpuUsage: '0',
        memUsed: '0',
        memMax: '0',
        memPercent: '0',
        diskUsed: '0',
        diskMax: '0'
      },
      vms: [],
      recentDeployments: []
    });
  }
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
