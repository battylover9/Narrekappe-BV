import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    const username = e.target.elements.username.value.trim();
    const password = e.target.elements.password.value;
    const confirmPassword = e.target.elements.confirmPassword.value;
    const fullName = e.target.elements.fullName.value.trim();
    const email = e.target.elements.email.value.trim();

    // Client-side validation
    if (password !== confirmPassword) {
      setMessage('✗ Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setMessage('✗ Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setMessage('Creating account...');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, fullName, email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('✓ ' + data.message);
        setTimeout(() => {
          router.push('/stud-dash');
        }, 2000);
      } else {
        setMessage('✗ ' + (data.error || 'Registration failed'));
      }
    } catch (error) {
      setMessage('✗ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand">
            Narrekappe<span className="accent">.</span>
          </Link>
          <nav className="main-nav">
            <Link href="/">Home</Link>
            <Link href="/features">Features</Link>
            <Link href="/training">Training</Link>
          </nav>
        </div>
      </header>

      <main className="container pt-12">
        <div className="card max-w-lg mx-auto">
          <h1 className="text-3xl font-bold mb-2">Student Registration</h1>
          <p className="muted mb-6">Create your account to access training labs</p>

          {message && (
            <div className={`mb-4 p-3 rounded ${message.includes('✗') ? 'bg-red-100 text-red-700' : message.includes('✓') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Full Name *</label>
              <input
                type="text"
                name="fullName"
                placeholder="John Doe"
                required
                className="form-input"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">Username *</label>
              <input
                type="text"
                name="username"
                placeholder="johndoe"
                required
                className="form-input"
                disabled={loading}
                pattern="[a-zA-Z0-9]+"
                title="Only letters and numbers allowed"
              />
              <p className="text-sm text-gray-600 mt-1">Only letters and numbers, minimum 3 characters</p>
            </div>

            <div>
              <label className="block mb-2 font-medium">Email (Optional)</label>
              <input
                type="email"
                name="email"
                placeholder="john@example.com"
                className="form-input"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">Password *</label>
              <input
                type="password"
                name="password"
                placeholder="Minimum 8 characters"
                required
                minLength="8"
                className="form-input"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Re-enter password"
                required
                minLength="8"
                className="form-input"
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/stud-dash" className="text-blue-600 hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="site-footer" style={{ marginTop: '4rem' }}>
        <div className="footer-inner">
          <p>© 2025 Narrekappe B.V. – Cybersecurity Training Platform</p>
        </div>
      </footer>
    </>
  );
}
