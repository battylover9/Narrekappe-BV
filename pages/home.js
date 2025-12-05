
import Link from 'next/link';

export default function HomePage() {
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
          <button className="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">
            ☰
          </button>
        </div>
      </header>

      <main className="container hero">
        <div className="hero-content">
          <h1>Narrekappe Training Platform</h1>
          <p className="lead">
            A secure, scalable virtual lab environment for training security officers — automated imports,
            isolated labs, and a central admin console.
          </p>
          <div className="hero-cta">
            <Link className="btn" href="/features">
              Explore Features
            </Link>
            <Link className="btn ghost" href="/training">
              Student Guide
            </Link>
          </div>
        </div>

        <aside className="stats">
          <div className="stat">
            <div className="num">30</div>
            <div className="label">Max Students</div>
          </div>
          <div className="stat">
            <div className="num">5</div>
            <div className="label">Concurrent VMs</div>
          </div>
          <div className="stat">
            <div className="num">2–3m</div>
            <div className="label">VM Boot Time</div>
          </div>
        </aside>
      </main>

      <section className="container cards">
        <article className="card">
          <h2>What problem we solve</h2>
          <p>
            Narrekappe noticed that many security officers lack practical IT and cybersecurity experience.
            This platform provides a safe, isolated environment where students can practice on intentionally
            vulnerable machines, with admin oversight and automation to simplify lab setup.
          </p>
        </article>

        <article className="card">
          <h2>Who it's for</h2>
          <ul>
            <li>Security trainees and students</li>
            <li>Instructors and lab administrators</li>
            <li>IT staff responsible for maintenance</li>
          </ul>
        </article>

        <article className="card">
          <h2>Quick links</h2>
          <ul className="quick-links">
            <li>
              <Link href="/admin">Admin Dashboard Concept</Link>
            </li>
            <li>
              <Link href="/training">Student Guide &amp; Labs</Link>
            </li>
            <li>
              <Link href="/contact">Contact / Request Access</Link>
            </li>
          </ul>
        </article>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>© Narrekappe B.V. — Training Platform concept — October 2025</p>
          <nav className="footer-nav">
            <Link href="/security">Security</Link>
            <Link href="/features">Features</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
