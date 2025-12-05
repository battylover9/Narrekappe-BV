
import Link from 'next/link';

export default function SecurityPage() {
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
            <Link href="/security">Security</Link>
            <Link href="/stud-dash">User Portal</Link>
            <Link href="/admin-login">Admin Login</Link>
          </nav>
          <button className="nav-toggle" aria-label="Toggle navigation">
            ☰
          </button>
        </div>
      </header>

      <main className="container">
        <h1>Security Design</h1>
        <p className="muted">
          Security measures and mitigations used to protect the company network and students during exercises.
        </p>

        <section className="card">
          <h2>Network Isolation</h2>
          <p>
            Each lab runs in isolated VLANs with strict firewall rules preventing access to internal networks. Only
            admin machines have controlled access to management interfaces.
          </p>
        </section>

        <section className="card">
          <h2>Access Control &amp; Authentication</h2>
          <p>
            Role-based accounts for admins and students, strong password policies, encrypted credentials in transit
            (HTTPS) and at rest. Temporary credentials for student sessions that expire.
          </p>
        </section>

        <section className="card">
          <h2>Automation Safety</h2>
          <p>
            Downloaded VM images are validated via checksums, scanned in a quarantine environment, and only then
            imported as templates.
          </p>
        </section>

        <section className="card">
          <h2>Backups &amp; Recovery</h2>
          <p>
            Weekly encrypted backups of templates and configurations, and snapshot-based rollback for corrupted VMs.
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
