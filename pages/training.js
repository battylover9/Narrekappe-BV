// app/training/page.js
import Link from 'next/link';

export default function TrainingPage() {
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
            <Link href="/stud-dash">User Portal</Link>
            <Link href="/admin-login">Admin Login</Link>
          </nav>
          <button className="nav-toggle" aria-label="Toggle navigation">
            ☰
          </button>
        </div>
      </header>

      <main className="container">
        <h1>Training Environment</h1>
        <p className="muted">Student-facing guide to labs, connection instructions, and difficulty levels.</p>

        <section className="card">
          <h2>How it works</h2>
          <ol>
            <li>Admin assigns a VM template (easy/medium/hard) to the student.</li>
            <li>
              The platform deploys the VM in an isolated network and generates temporary credentials.
            </li>
            <li>The student connects via HTTPS web-console or SSH (instructions shown in dashboard).</li>
            <li>After the session ends, the lab resets to a clean snapshot.</li>
          </ol>
        </section>

        <section className="grid-3">
          <div className="card">
            <h3>Difficulty: Easy</h3>
            <p>
              Introductory labs for beginners. Focus on reconnaissance, basic exploitation, and safe practice.
            </p>
          </div>
          <div className="card">
            <h3>Difficulty: Medium</h3>
            <p>
              Intermediate scenarios requiring chained exploits and basic pivoting inside the isolated lab.
            </p>
          </div>
          <div className="card">
            <h3>Difficulty: Hard</h3>
            <p>
              Advanced challenges with realistic post-exploitation tasks and deeper forensics.
            </p>
          </div>
        </section>

        <section className="card">
          <h2>Student safety &amp; rules</h2>
          <ul>
            <li>Do not attempt to reach company internal networks.</li>
            <li>Use only assigned machines and follow exercise instructions.</li>
            <li>All work is logged for safety and grading.</li>
          </ul>
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
