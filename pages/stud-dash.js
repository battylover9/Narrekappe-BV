import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StudentDashboardPage() {
  const [vms, setVms] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
    if (storedUser) {
      setUserName(storedUser);
      setIsLoggedIn(true);
      fetchVMs();
      fetchDeployments();
    }
  }, []);

  const fetchVMs = async () => {
    try {
      const response = await fetch('/api/vms');
      const data = await response.json();
      setVms(data.vms || []);
    } catch (error) {
      console.error('Error fetching VMs:', error);
    }
  };

  const fetchDeployments = async () => {
    try {
      const response = await fetch('/api/deployment');
      const data = await response.json();
      setDeployments(data.deployments || []);
    } catch (error) {
      console.error('Error fetching deployments:', error);
    }
  };

  const deployVM = async (vmName) => {
    setLoading(true);
    setMessage(`Deploying ${vmName}... This may take a few minutes.`);

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vmName, userName }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`✓ ${vmName} deployed successfully! VM ID: ${data.vmId}`);
        fetchDeployments();
      } else {
        setMessage(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startVM = async (vmId) => {
    try {
      await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vmId }),
      });
      setMessage(`✓ VM ${vmId} started successfully`);
      fetchDeployments();
    } catch (error) {
      setMessage(`✗ Error: ${error.message}`);
    }
  };

  const stopVM = async (vmId) => {
    try {
      await fetch('/api/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vmId }),
      });
      setMessage(`✓ VM ${vmId} stopped successfully`);
      fetchDeployments();
    } catch (error) {
      setMessage(`✗ Error: ${error.message}`);
    }
  };

  const deleteVM = async (vmId) => {
    if (!confirm(`Delete VM ${vmId}?`)) return;
    try {
      await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vmId }),
      });
      setMessage(`✓ VM ${vmId} deleted successfully`);
      fetchDeployments();
    } catch (error) {
      setMessage(`✗ Error: ${error.message}`);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const name = e.target.elements.userName.value.trim();
    if (name) {
      setUserName(name);
      setIsLoggedIn(true);
      if (typeof window !== 'undefined') localStorage.setItem('userName', name);
      fetchVMs();
      fetchDeployments();
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    if (typeof window !== 'undefined') localStorage.removeItem('userName');
    setVms([]);
    setDeployments([]);
  };

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
              <Link href="/features">Features</Link>
              <Link href="/training">Training</Link>
            </nav>
          </div>
        </header>

        <main className="container pt-12">
          <div className="card max-w-lg mx-auto">
            <h1 className="text-3xl font-bold mb-2">Student Login</h1>
            <p className="muted mb-6">Enter your name to access training labs</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Your Name</label>
                <input
                  type="text"
                  name="userName"
                  placeholder="Enter your full name"
                  required
                  className="form-input"
                />
              </div>
              <button type="submit" className="btn w-full">
                Access Labs
              </button>
            </form>
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
            <span className="muted">Welcome, {userName}</span>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        {message && (
          <div className={`message-box ${message.includes('✓') ? 'message-success' : 'message-error'}`}>
            {message}
          </div>
        )}

        <section className="mt-8">
          <h1 className="text-4xl font-bold mb-2">Available Training Labs</h1>
          <p className="muted mb-6">Select a vulnerable machine to deploy and practice your cybersecurity skills</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vms.length === 0 ? (
              <div className="card col-span-full text-center py-8">
                <p className="muted">Loading available VMs...</p>
              </div>
            ) : (
              vms.map(vm => (
                <div key={vm.name} className="card hover:shadow-2xl transition-shadow">
                  <h3 className="text-xl font-bold mb-2">{vm.displayName}</h3>
                  <p className="muted small mb-4">Size: {vm.size}</p>
                  <button
                    onClick={() => deployVM(vm.name)}
                    disabled={loading}
                    className="btn w-full"
                  >
                    {loading ? 'Deploying...' : 'Deploy Lab'}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold mb-2">Your Active Labs</h2>
          <p className="muted mb-6">Manage your deployed virtual machines</p>

          {deployments.length === 0 ? (
            <div className="card text-center py-8">
              <p className="muted">No VMs deployed yet. Deploy a lab above to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>VM ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deployments.map(d => (
                    <tr key={d.vmid}>
                      <td className="font-mono">{d.vmid}</td>
                      <td>{d.name}</td>
                      <td>
                        <span className={`status-badge ${d.status === 'running' ? 'status-running' : 'status-stopped'}`}>
                          {d.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          {d.status === 'stopped' && (
                            <button onClick={() => startVM(d.vmid)} className="btn btn-sm">
                              Start
                            </button>
                          )}
                          {d.status === 'running' && (
                            <button onClick={() => stopVM(d.vmid)} className="btn btn-sm">
                              Stop
                            </button>
                          )}
                          <a
                            href={`https://192.168.205.30:8006/?console=${d.vmid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-success"
                          >
                            Console
                          </a>
                          <button onClick={() => deleteVM(d.vmid)} className="btn btn-sm btn-danger">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <p>© 2025 Narrekappe B.V. – Cybersecurity Training Platform</p>
        </div>
      </footer>
    </>
  );
}
