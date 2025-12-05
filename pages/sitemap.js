import Link from 'next/link';

export default function SiteMapPage() {
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

      <main className="container py-8">
        <h1 className="text-4xl font-bold mb-8">Site Navigation</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Section */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4 text-narrek-accent">For Students</h2>
            <ul className="space-y-3">
              <li>
                <Link href="/stud-dash" className="text-lg hover:text-narrek-accent transition-colors">
                  📚 Student Portal
                </Link>
                <p className="text-sm muted ml-6">Deploy and manage your training VMs</p>
              </li>
              <li>
                <Link href="/training" className="text-lg hover:text-narrek-accent transition-colors">
                  📖 Training Guide
                </Link>
                <p className="text-sm muted ml-6">Learn how to use the platform</p>
              </li>
              <li>
                <Link href="/features" className="text-lg hover:text-narrek-accent transition-colors">
                  ⚡ Features
                </Link>
                <p className="text-sm muted ml-6">See what the platform offers</p>
              </li>
            </ul>
          </div>

          {/* Admin Section */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4 text-narrek-accent-2">For Administrators</h2>
            <ul className="space-y-3">
              <li>
                <Link href="/admin-monitoring" className="text-lg hover:text-narrek-accent-2 transition-colors">
                  📊 Monitoring Dashboard
                </Link>
                <p className="text-sm muted ml-6">Real-time VM monitoring and statistics</p>
              </li>
              <li>
                <Link href="/admin" className="text-lg hover:text-narrek-accent-2 transition-colors">
                  ⚙️ Admin Dashboard
                </Link>
                <p className="text-sm muted ml-6">Administrative tools and settings</p>
              </li>
            </ul>
          </div>

          {/* Information Section */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Information</h2>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-lg hover:text-narrek-accent transition-colors">
                  🏠 Home
                </Link>
                <p className="text-sm muted ml-6">Platform overview</p>
              </li>
              <li>
                <Link href="/security" className="text-lg hover:text-narrek-accent transition-colors">
                  🔒 Security
                </Link>
                <p className="text-sm muted ml-6">Security features and policies</p>
              </li>
            </ul>
          </div>

          {/* API Endpoints */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">API Endpoints</h2>
            <ul className="space-y-2 text-sm font-mono">
              <li className="muted">GET /api/vms</li>
              <li className="muted">GET /api/deployment</li>
              <li className="muted">GET /api/admin-stats</li>
              <li className="muted">POST /api/deploy</li>
              <li className="muted">POST /api/start</li>
              <li className="muted">POST /api/stop</li>
              <li className="muted">POST /api/delete</li>
            </ul>
          </div>
        </div>

        <div className="card mt-8">
          <h2 className="text-2xl font-bold mb-4">Quick Start Guide</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold mb-2">For Students:</h3>
              <ol className="list-decimal list-inside space-y-1 muted">
                <li>Go to <Link href="/stud-dash" className="text-narrek-accent">/stud-dash</Link></li>
                <li>Enter your name to login</li>
                <li>Click "Deploy Lab" on any VM</li>
                <li>Wait 2-5 minutes for deployment</li>
                <li>Click "Start" to boot the VM</li>
                <li>Click "Console" to access the VM</li>
              </ol>
            </div>
            <div>
              <h3 className="font-bold mb-2">For Administrators:</h3>
              <ol className="list-decimal list-inside space-y-1 muted">
                <li>Go to <Link href="/admin-monitoring" className="text-narrek-accent-2">/admin-monitoring</Link></li>
                <li>View real-time VM statistics</li>
                <li>Monitor resource usage</li>
                <li>See recent deployments</li>
                <li>Check individual VM details</li>
              </ol>
            </div>
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <p>© 2025 Narrekappe B.V. – Cybersecurity Training Platform</p>
        </div>
      </footer>
    </>
  );
}
