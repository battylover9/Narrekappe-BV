import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminMonitoringPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin-stats');
      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    if (autoRefresh) {
      const interval = setInterval(fetchStats, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getStatusColor = (status) => {
    return status === 'running' ? 'status-running' : 'status-stopped';
  };

  const getResourceColor = (percent) => {
    if (percent > 90) return 'text-red-500';
    if (percent > 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <>
        <header className="site-header">
          <div className="header-inner">
            <Link href="/" className="brand">
              Narrekappe<span className="accent">.</span>
            </Link>
            <nav className="main-nav">
              <Link href="/">Home</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </div>
        </header>
        <main className="container py-8">
          <div className="card text-center py-12">
            <p className="text-xl muted">Loading monitoring data...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand">
            Narrekappe<span className="accent">.</span>
          </Link>
          <nav className="main-nav">
            <Link href="/">Home</Link>
            <Link href="/admin">Admin</Link>
            <Link href="/stud-dash">Student Portal</Link>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">VM Monitoring Dashboard</h1>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Auto-refresh</span>
            </label>
            
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="form-input w-32"
              >
                <option value="5">5s</option>
                <option value="10">10s</option>
                <option value="30">30s</option>
                <option value="60">60s</option>
              </select>
            )}
            
            <button onClick={fetchStats} className="btn btn-sm">
              Refresh Now
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <h3 className="text-sm muted mb-2">Total VMs</h3>
            <p className="text-4xl font-bold">{stats?.summary.totalVMs || 0}</p>
          </div>
          
          <div className="card">
            <h3 className="text-sm muted mb-2">Running / Stopped</h3>
            <div className="flex gap-4 items-center">
              <div>
                <p className="text-3xl font-bold text-green-400">
                  {stats?.summary.runningVMs || 0}
                </p>
                <p className="text-xs muted">Running</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-400">
                  {stats?.summary.stoppedVMs || 0}
                </p>
                <p className="text-xs muted">Stopped</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-sm muted mb-2">CPU Usage</h3>
            <p className={`text-4xl font-bold ${getResourceColor(parseFloat(stats?.summary.cpuUsage || 0))}`}>
              {stats?.summary.cpuUsage || '0'}%
            </p>
          </div>
          
          <div className="card">
            <h3 className="text-sm muted mb-2">Memory Usage</h3>
            <p className={`text-4xl font-bold ${getResourceColor(parseFloat(stats?.summary.memPercent || 0))}`}>
              {stats?.summary.memPercent || '0'}%
            </p>
            <p className="text-sm muted mt-1">
              {stats?.summary.memUsed || '0'} GB / {stats?.summary.memMax || '0'} GB
            </p>
          </div>
        </div>

        {/* Recent Deployments */}
        {stats?.recentDeployments && stats.recentDeployments.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4">Recent Deployments</h2>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>VM Name</th>
                    <th>VM ID</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentDeployments.map((deployment, index) => (
                    <tr key={index}>
                      <td className="font-mono text-sm">
                        {new Date(deployment.timestamp).toLocaleString()}
                      </td>
                      <td>{deployment.userName}</td>
                      <td>{deployment.vmName}</td>
                      <td className="font-mono">{deployment.vmId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VM Details Table */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">All Virtual Machines</h2>
          
          {stats?.vms && stats.vms.length === 0 ? (
            <div className="text-center py-8">
              <p className="muted">No VMs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>VM ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>CPU</th>
                    <th>Memory</th>
                    <th>Disk</th>
                    <th>Uptime</th>
                    <th>Node</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.vms.map(vm => (
                    <tr key={vm.vmid}>
                      <td className="font-mono">{vm.vmid}</td>
                      <td className="font-medium">{vm.name}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(vm.status)}`}>
                          {vm.status}
                        </span>
                      </td>
                      <td className={getResourceColor(parseFloat(vm.cpuUsage))}>
                        {vm.cpuUsage}%
                      </td>
                      <td>
                        <div className={getResourceColor(parseFloat(vm.memPercent))}>
                          {vm.memUsage} MB
                        </div>
                        <div className="text-xs muted">
                          {vm.memPercent}% of {vm.memMax} MB
                        </div>
                      </td>
                      <td>
                        <div>{vm.diskUsage} GB</div>
                        <div className="text-xs muted">of {vm.diskMax} GB</div>
                      </td>
                      <td className="font-mono text-sm">{vm.uptime}</td>
                      <td className="text-sm muted">{vm.node}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resource Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Memory Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="muted">Total Allocated:</span>
                <span className="font-bold">{stats?.summary.memMax || '0'} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="muted">Currently Used:</span>
                <span className="font-bold">{stats?.summary.memUsed || '0'} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="muted">Usage:</span>
                <span className={`font-bold ${getResourceColor(parseFloat(stats?.summary.memPercent || 0))}`}>
                  {stats?.summary.memPercent || '0'}%
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-xl font-bold mb-4">Disk Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="muted">Total Allocated:</span>
                <span className="font-bold">{stats?.summary.diskMax || '0'} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="muted">Currently Used:</span>
                <span className="font-bold">{stats?.summary.diskUsed || '0'} GB</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <p>© 2025 Narrekappe B.V. – Admin Monitoring Dashboard</p>
        </div>
      </footer>
    </>
  );
}
