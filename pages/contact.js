
import Link from 'next/link';

export default function ContactPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert(
      'This is a placeholder form. Integrate a server endpoint to process requests.'
    );
  };

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
            <Link href="/admin">Admin Login</Link>
          </nav>
          <button className="nav-toggle" aria-label="Toggle navigation">
            ☰
          </button>
        </div>
      </header>

      <main className="container">
        <h1>Contact &amp; Request Access</h1>
        <p className="muted">
          Want access to the training environment or have questions? Use the form below to reach out.
        </p>

        <section className="card contact-card">
          <form className="contact-form" onSubmit={handleSubmit}>
            <label htmlFor="name">Full name</label>
            <input id="name" type="text" required />

            <label htmlFor="email">Email</label>
            <input id="email" type="email" required />

            <label htmlFor="role">Role</label>
            <select id="role">
              <option>Student</option>
              <option>Instructor</option>
              <option>Admin</option>
            </select>

            <label htmlFor="message">Message</label>
            <textarea id="message" rows="5" placeholder="Describe your request" />

            <div className="form-actions">
              <button className="btn" type="submit">
                Send request
              </button>
              <Link className="btn ghost" href="/">
                Cancel
              </Link>
            </div>
          </form>
        </section>

        <section className="card">
          <h2>Office</h2>
          <p>Narrekappe B.V. — Netherlands</p>
          <p className="muted small">
            For security and privacy reasons contact details are placeholder text for the concept site.
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
