import Link from 'next/link';
import { useAdminAuth } from '../lib/AdminAuthCheck';

export default function AdminPage() {
  const { isAuthenticated, loading, adminUser, logout } = useAdminAuth();

  if (loading) {
    return <div className="container pt-12">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href="/">
            Narrekappe<span className="accent">.</span>
          </Link>
          <nav className="main-nav">
            <Link href="/">Home</Link>
            <Link href="/admin-dashboard">Dashboard</Link>
            <Link href="/admin-monitoring">Monitoring</Link>
            <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
          </nav>
        </div>
      </header>

      <main className="container">
        <h1>Admin Dashboard</h1>
        <p className="muted">Welcome, {adminUser}!</p>

        <section className="card">
          <h2>User &amp; Lab Management</h2>
          <ul>
            <li>Create / remove student accounts</li>
            <li>Assign templates and start/stop/reset VMs</li>
            <li>Set lab schedules and revoke access automatically</li>
          </ul>
        </section>

        <section className="card">
          <h2>Automation</h2>
          <p>
            One-click import from a URL or repository. The system verifies checksums, converts images as needed, and
            registers templates for deployment.
          </p>
        </section>

        <section className="card">
          <h2>Monitoring &amp; Logs</h2>
          <p>Overview of resource usage, alerts for failures, and logs for audit and grading.</p>
          <Link href="/admin-monitoring" className="btn">View Monitoring →</Link>
        </section>

        <section className="card">
          <h2>Maintenance</h2>
          <p>
            Weekly backups of templates and configs, rollback via snapshots, and version-controlled scripts for
            reproducibility.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>© Narrekappe B.V.</p>
        </div>
      </footer>
    </>
  );
}