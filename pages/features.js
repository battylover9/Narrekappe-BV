
import Link from 'next/link';

export default function FeaturesPage() {
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
            <Link href="/contact">Contact</Link>
            <Link href="/user-portal">User Portal</Link>
            <Link href="/admin-login">Admin Login</Link>
          </nav>
          <button className="nav-toggle" aria-label="Toggle navigation">
            ☰
          </button>
        </div>
      </header>

      <main className="container">
        <h1>Platform Features</h1>
        <p className="muted">
          The platform is designed to simplify the delivery of labs, automate imports, and secure student environments.
        </p>

        <section className="grid-3">
          <div className="feature card">
            <h3>Automated VM Import</h3>
            <p>
              Download vulnerable machines from VulnHub automatically, verify artifacts, convert to templates, and
              import to the hypervisor with minimal admin effort.
            </p>
            <ul>
              <li>Checksum validation</li>
              <li>Quarantine &amp; verification</li>
              <li>Template registration</li>
            </ul>
          </div>

          <div className="feature card">
            <h3>Central Admin Console</h3>
            <p>A single dashboard to create, start, stop, snapshot, and assign VMs to students.</p>
            <ul>
              <li>Student onboarding/offboarding</li>
              <li>Role-based access</li>
              <li>Activity logs &amp; alerts</li>
            </ul>
          </div>

          <div className="feature card">
            <h3>Student Workspaces</h3>
            <p>
              Each student gets an isolated workspace with difficulty tagging (easy / medium / hard) and automatic
              environment reset after exercises.
            </p>
            <ul>
              <li>Ephemeral storage for student sessions</li>
              <li>Per-student VLANs / network segmentation</li>
              <li>Pre-built challenges and hints</li>
            </ul>
          </div>
        </section>

        <section className="card">
          <h2>Scalability &amp; Performance</h2>
          <p>
            Design supports up to 30 students and 5 concurrent vulnerable VMs. Templates and automation scripts help
            keep import time under 10 minutes and VM boot times within 2–3 minutes.
          </p>
        </section>

        <section className="card">
          <h2>Monitoring &amp; Maintenance</h2>
          <p>
            Basic resource monitoring (CPU, RAM, disk), weekly backups of templates/configuration, and a recovery plan
            with snapshots and logs.
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
