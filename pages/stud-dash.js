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
          <div className="container header-inner">
            <Link className="brand" href="/">Narrekappe<span className="accent">.</span></Link>
            <nav className="main-nav">
              <Link href="/">Home</Link>
              <Link href="/features">Features</Link>
              <Link href="/training">Training</Link>
            </nav>
          </div>
        </header>
        <main className="container">
          <div className="card login-card">
            <h1>Student Login</h1>
            <p className="muted">Enter your name to access training labs</p>
            <form onSubmit={handleLogin}>
              <label>Your Name</label>
              <input type="text" name="userName" placeholder="Enter your full name" required />
              <button className="btn" type="submit" style={{ width: '100%', marginTop: '1rem' }}>Access Labs</button>
            </form>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href="/">Narrekappe<span className="accent">.</span></Link>
          <nav className="main-nav">
            <Link href="/">Home</Link>
            <span className="muted">Welcome, {userName}</span>
            <button onClick={handleLogout} className="btn ghost btn-sm">Logout</button>
          </nav>
        </div>
      </header>
      
      <main className="container">
        {message && (
          <div className={`card message-box ${message.includes('✓') ? 'message-success' : 'message-error'}`}>
            {message}
          </div>
        )}

        <section style={{ marginTop: '2rem' }}>
          <h1>Available Training Labs</h1>
          <p className="muted">Select a vulnerable machine to deploy and practice your cybersecurity skills</p>
          
          <div className="cards" style={{ marginTop: '1.5rem' }}>
            {vms.length === 0 ? (
              <div className="card empty-state">
                <p>Loading available VMs...</p>
              </div>
            ) : (
              vms.map(vm => (
                <div key={vm.name} className="card">
                  <h3>{vm.displayName}</h3>
                  <p className="muted small">Size: {vm.size}</p>
                  <button 
                    onClick={() => deployVM(vm.name)} 
                    disabled={loading} 
                    className={`btn ${loading ? 'loading' : ''}`}
                    style={{ width: '100%', marginTop: '1rem' }}
                  >
                    {loading ? 'Deploying...' : 'Deploy Lab'}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section style={{ marginTop: '3rem' }}>
          <h2>Your Active Labs</h2>
          <p className="muted">Manage your deployed virtual machines</p>
          
          {deployments.length === 0 ? (
            <div className="card empty-state">
              <p>No VMs deployed yet. Deploy a lab above to get started!</p>
            </div>
          ) : (
            <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
              <table>
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
                      <td>{d.vmid}</td>
                      <td>{d.name}</td>
                      <td>
                        <span className={`status-badge ${d.status === 'running' ? 'status-running' : 'status-stopped'}`}>
                          {d.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
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
        <div className="container footer-inner">
          <p>© 2025 Narrekappe B.V. – Cybersecurity Training Platform</p>
        </div>
      </footer>
    </>
  );
}