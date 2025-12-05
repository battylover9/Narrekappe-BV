
import Link from 'next/link';

export default function AdminPage() {
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href="/">
            Narrekappe<span className="accent">.</span>
          </Link>
          <nav className="main-nav">
            <Link href="/">Home</Link>
            <Link href="/features">Features</Link>
            <Link href="/training">Training</Link>
            <Link href="/admin">Admin</Link>
            <Link href="/security">Security</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/stud-dash">User Portal</Link>
            <Link href="/admin-dashboard">Dashboard</Link>
            <Link href="/admin">Logout</Link>
          </nav>
          <button className="nav-toggle" aria-label="Toggle navigation">
            ☰
          </button>
        </div>
      </header>

      <main className="container">
        <h1>Admin Dashboard Concept</h1>
        <p className="muted">
          This page outlines the capabilities of the admin console — it is a conceptual mockup for the platform.
        </p>

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
          <div className="dashboard-sample">
            <div className="dash-card">CPU: 45%</div>
            <div className="dash-card">RAM: 63%</div>
            <div className="dash-card">Storage: 72%</div>
          </div>
        </section>

        <section className="card">
          <h2>Maintenance</h2>
          <p>
            Weekly backups of templates and configs, rollback via snapshots, and version-controlled scripts for
            reproducibility.
          </p>
        </section>

        <h3>Create New User</h3>
        <input type="text" id="newUser" placeholder="Username" />
        <input type="password" id="newPass" placeholder="Password" />
        <select id="newRole">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button type="button">Add User</button>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>© Narrekappe B.V.</p>
        </div>
      </footer>
    </>
  );
}
