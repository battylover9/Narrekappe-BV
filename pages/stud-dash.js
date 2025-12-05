
import Link from 'next/link';

export default function StudentDashboardPage() {
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href="/">
            Narrekappe<span className="accent">.</span>
          </Link>
          <nav className="main-nav">
            <Link href="/">Home</Link>
            <Link href="/user-portal">Logout</Link>
          </nav>
        </div>
      </header>

      <main className="container">
        <h1>Your Labs</h1>
        <p className="muted">Access your assigned training machines.</p>

        <section className="cards">
          <div className="card">
            <h3>Easy Lab</h3>
            <p>Basic recon &amp; exploitation.</p>
            <button className="btn">Start VM</button>
          </div>

          <div className="card">
            <h3>Medium Lab</h3>
            <p>Multi-step attack chain.</p>
            <button className="btn">Start VM</button>
          </div>

          <div className="card">
            <h3>Hard Lab</h3>
            <p>Advanced exploitation &amp; forensics.</p>
            <button className="btn">Start VM</button>
          </div>
        </section>
      </main>
    </>
  );
}
