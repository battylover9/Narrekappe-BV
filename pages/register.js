import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState('');

  const generateUsername = (first, last) => {
    if (!first || !last) return '';
    return (first[0] + last).toLowerCase();
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const username = generateUsername(firstName, lastName);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`Account created! Your username is: ${username}`);
        setGeneratedUsername(username);
        setTimeout(() => {
          window.location.href = '/stud-dash';
        }, 3000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const previewUsername = generateUsername(firstName, lastName);

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand">
            Narrekappe<span className="accent">.</span>
          </Link>
          <nav className="main-nav">
            <Link href="/">Home</Link>
            <Link href="/stud-dash">Login</Link>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-md mx-auto">
          <div className="card">
            <h1 className="text-3xl font-bold mb-2">Register</h1>
            <p className="muted mb-6">Create your student account</p>

            {error && (
              <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-100 text-green-700 rounded mb-4">
                {success}
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label className="block mb-2 font-medium">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="form-input"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="form-input"
                  required
                  disabled={loading}
                />
              </div>

              {previewUsername && (
                <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">
                  <p className="text-sm">
                    <strong>Your username will be:</strong> {previewUsername}
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label className="block mb-2 font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="At least 8 characters"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-medium">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn w-full"
              >
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm muted">
                Already have an account?{' '}
                <Link href="/stud-dash" className="text-blue-500">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
