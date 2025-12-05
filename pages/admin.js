
import Link from 'next/link';

export default function AdminLoginPage() {
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
            <Link href="/user-portal">User Portal</Link>
          </nav>
          <button className="nav-toggle" aria-label="Toggle navigation">
            ☰
          </button>
        </div>
      </header>

      <section>
        <h2>Admin Login</h2>
        <p>Login to manage students, virtual machines, and system settings.</p>

        <div className="card" style={{ maxWidth: '400px', margin: 'auto' }}>
          <form id="loginForm">
            <label>Username</label>
            <br />
            <input
              type="text"
              id="username"
              placeholder="Enter admin username"
              className="input"
            />
            <br />
            <br />

            <label>Password</label>
            <br />
            <input
              type="password"
              id="password"
              placeholder="Enter password"
              className="input"
            />
            <br />
            <br />

            <button className="button" type="submit">
              Login
            </button>
          </form>
        </div>
      </section>

      <footer>
        <p>© 2025 Narrekappe B.V. – Training Platform</p>
      </footer>
    </>
  );
}
