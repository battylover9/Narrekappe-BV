import { useState } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '../lib/AdminAuthCheck';

export default function AdminImportUsersPage() {
  const { isAuthenticated, loading: authLoading, logout } = useAdminAuth();
  const [csvText, setCsvText] = useState('');
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  if (authLoading) {
    return <div className="container pt-12">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      setCsvText(event.target.result);
    };
    
    reader.readAsText(uploadedFile);
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      setError('Please provide CSV data');
      return;
    }

    setImporting(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/proxmox/import-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
        setCsvText('');
        setFile(null);
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'first_name,last_name,password\nJohn,Doe,password123\nJane,Smith,securepass456';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
            <Link href="/admin-main">Admin</Link>
            <Link href="/admin-monitoring">Monitoring</Link>
            <Link href="/admin-import-users">Import Users</Link>
            <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <h1 className="text-4xl font-bold mb-2">Import Users</h1>
        <p className="muted mb-6">Bulk import students from CSV file</p>

        <div className="card mb-6">
          <h2 className="text-2xl font-bold mb-4">Instructions</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold mb-2">CSV Format Required:</h3>
              <div className="bg-gray-100 p-4 rounded font-mono text-sm">
                first_name,last_name,password<br/>
                John,Doe,password123<br/>
                Jane,Smith,securepass456
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">Requirements:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>First row must be header: first_name,last_name,password</li>
                <li>Passwords must be at least 8 characters</li>
                <li>Usernames will be auto-generated: first letter + last name</li>
                <li>Example: John Doe → username: jdoe</li>
              </ul>
            </div>

            <div>
              <button onClick={downloadTemplate} className="btn btn-sm">
                Download Template CSV
              </button>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-2xl font-bold mb-4">Upload CSV</h2>

          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Upload CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="form-input"
                disabled={importing}
              />
              {file && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ File loaded: {file.name}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2 font-medium">Or Paste CSV Data</label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="first_name,last_name,password&#10;John,Doe,password123"
                rows="10"
                className="form-input font-mono text-sm"
                disabled={importing}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={importing || !csvText.trim()}
              className="btn w-full"
            >
              {importing ? 'Importing...' : 'Import Users'}
            </button>
          </div>
        </div>

        {results && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Import Results</h2>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-100 p-4 rounded text-center">
                <div className="text-3xl font-bold text-blue-700">{results.total}</div>
                <div className="text-sm text-blue-600">Total</div>
              </div>
              <div className="bg-green-100 p-4 rounded text-center">
                <div className="text-3xl font-bold text-green-700">{results.success}</div>
                <div className="text-sm text-green-600">Success</div>
              </div>
              <div className="bg-red-100 p-4 rounded text-center">
                <div className="text-3xl font-bold text-red-700">{results.failed}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            </div>

            {results.results && results.results.length > 0 && (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>User ID</th>
                      <th>Full Name</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.results.map((result, index) => (
                      <tr key={index}>
                        <td>
                          {result.ok ? (
                            <span className="status-badge status-running">✓ Success</span>
                          ) : (
                            <span className="status-badge status-stopped">✗ Failed</span>
                          )}
                        </td>
                        <td className="font-mono">{result.userid || '-'}</td>
                        <td>{result.fullName || '-'}</td>
                        <td className="text-sm">{result.error || 'User created successfully'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <p>© 2025 Narrekappe B.V. – Admin Dashboard</p>
        </div>
      </footer>
    </>
  );
}
