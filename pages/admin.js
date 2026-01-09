import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminUser', username);
        router.push('/admin-main');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
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
            <Link href="/stud-dash">Student Portal</Link>
          </nav>
        </div>
      </header>

      <main className="container pt-12">
        <div className="card max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-2">Admin Login</h1>
          <p className="muted mb-6">Access administrator dashboard</p>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-100 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin username"
                required
                className="form-input"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                required
                className="form-input"
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="btn w-full"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-4 p-4 bg-blue-50 rounded">
            <p className="text-xs text-gray-600">
              Default credentials: <code className="bg-gray-200 px-1 rounded">admin</code> / <code className="bg-gray-200 px-1 rounded">Admin123!</code>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}