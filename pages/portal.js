
import Link from 'next/link';

export default function UserPortalPage() {
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
            <Link href="/admin-login">Admin Login</Link>
          </nav>
          <button className="nav-toggle" aria-label="Toggle navigation">
            ☰
          </button>
        </div>
      </header>

      <section>
        <h2>User Login</h2>
        <p>Students can log in to access their assigned virtual machines and training labs.</p>

        <div className="card" style={{ maxWidth: '400px', margin: 'auto' }}>
          <form>
            <label>Student ID</label>
            <br />
            <input type="text" placeholder="Enter your student ID" className="input" />
            <br />
            <br />

            <label>Password</label>
            <br />
            <input type="password" placeholder="Enter your password" className="input" />
            <br />
            <br />

            <button className="button" type="submit">
              Login
            </button>
          </form>
        </div>
      </section>

      <footer>
        <p>© 2025 Narrekappe B.V. – Student Training Portal</p>
      </footer>
    </>
  );
}
