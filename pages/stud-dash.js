import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StudentDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [vms, setVms] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const storedUser = localStorage.getItem('userName');
    const storedAuth = localStorage.getItem('isLoggedIn');
    
    if (storedUser && storedAuth === 'true') {
      setUserName(storedUser);
      setIsLoggedIn(true);
      fetchVMs();
      fetchDeployments(storedUser);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userName, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsLoggedIn(true);
        localStorage.setItem('userName', userName);
        localStorage.setItem('isLoggedIn', 'true');
        fetchVMs();
        fetchDeployments(userName);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    setPassword('');
    localStorage.removeItem('userName');
    localStorage.removeItem('isLoggedIn');
    setVms([]);
    setDeployments([]);
  };

  const fetchVMs = async () => {
    try {
      const response = await fetch('/api/vm/list-templates');
      const data = await response.json();
      setVms(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch VMs:', error);
    }
  };

  const fetchDeployments = async (user) => {
    const username = user || userName;
    try {
      const response = await fetch(`/api/vm/deployment?userName=${username}`);
      const data = await response.json();
      setDeployments(data.deployments || []);
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    }
  };

  const handleDeploy = async (vmName) => {
    setDeploying(true);
    setError('');

    try {
      const response = await fetch('/api/vm/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vmName, userName }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('VM deployed successfully!');
        fetchDeployments(userName);
      } else {
        setError(data.error || 'Deployment failed');
      }
    } catch (err) {
      setError('Deployment failed. Please try again.');
    } finally {
      setDeploying(false);
    }
  };

  const handleVMAction = async (vmId, action) => {
    try {
      const response = await fetch(`/api/vm/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vmId }),
      });

      if (response.ok) {
        fetchDeployments(userName);
      }
    } catch (error) {
      console.error(`${action} failed:`, error);
    }
  };

  // Login screen
  if (!isLoggedIn) {
    return (
      <>
        <header className="site-header">
          <div className="header-inner">
            <Link href="/" className="brand">
              Narrekappe<span className="accent">.</span>
            </Link>
            <nav className="main-nav">
              <Link href="/">Home</Link>
              <Link href="/register">Register</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </div>
        </header>

        <main className="container py-8">
          <div className="max-w-md mx-auto">
            <div className="card">
              <h1 className="text-3xl font-bold mb-2">Student Login</h1>
              <p className="muted mb-6">Access your VM dashboard</p>

              {error && (
                <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="block mb-2 font-medium">Username</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your username"
                    className="form-input"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="mb-6">
                  <label className="block mb-2 font-medium">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="form-input"
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn w-full"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-sm muted">
                  Don't have an account?{' '}
                  <Link href="/register" className="text-blue-500">
                    Register here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Logged in dashboard
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand">
            Narrekappe<span className="accent">.</span>
          </Link>
          <nav className="main-nav">
            <span className="muted">Welcome, {userName}</span>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
            {error}
          </div>
        )}

        {/* Available VMs */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Available VMs</h2>
          <p className="muted mb-6">Deploy vulnerable VMs for practice</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vms.length === 0 ? (
              <div className="col-span-full">
                <div className="card text-center">
                  <p className="muted">Loading templates...</p>
                </div>
              </div>
            ) : (
              vms.map((vm) => (
                <div key={vm.name} className="card">
                  <h3 className="text-xl font-bold mb-2">{vm.displayName || vm.name}</h3>
                  <div className="flex gap-2 mb-4">
                    <span className="badge">{vm.difficulty || 'Intermediate'}</span>
                    <span className="badge">{vm.size || 'Unknown'}</span>
                  </div>
                  <button
                    onClick={() => handleDeploy(vm.name)}
                    disabled={deploying}
                    className="btn w-full"
                  >
                    {deploying ? 'Deploying...' : 'Deploy VM'}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* My Deployments */}
        <section>
          <h2 className="text-3xl font-bold mb-2">My Deployments</h2>
          <p className="muted mb-6">Manage your active VMs</p>

          {deployments.length === 0 ? (
            <div className="card text-center">
              <p className="muted">No VMs deployed yet. Deploy one above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deployments.map((vm) => (
                <div key={vm.vmid} className="card">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold">{vm.name}</h3>
                      <div className="flex gap-4 text-sm muted mt-1">
                        <span>ID: {vm.vmid}</span>
                        <span>Memory: {vm.memory} MB</span>
                        <span className={`badge ${vm.status === 'running' ? 'badge-success' : 'badge-danger'}`}>
                          {vm.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {vm.status === 'running' ? (
                        <>
                          <button
                            onClick={() => window.open(`https://192.168.205.30:8006/?console=kvm&novnc=1&vmid=${vm.vmid}&node=pve`, '_blank')}
                            className="btn btn-sm btn-success"
                          >
                            Console
                          </button>
                          <button
                            onClick={() => handleVMAction(vm.vmid, 'stop')}
                            className="btn btn-sm btn-warning"
                          >
                            Stop
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleVMAction(vm.vmid, 'start')}
                          className="btn btn-sm btn-success"
                        >
                          Start
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('Delete this VM?')) {
                            handleVMAction(vm.vmid, 'delete');
                          }
                        }}
                        className="btn btn-sm btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <p>© 2025 Narrekappe B.V.</p>
        </div>
      </footer>
    </>
  );
}
