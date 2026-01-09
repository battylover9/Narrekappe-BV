import Link from 'next/link';
import { useAdminAuth } from '../lib/AdminAuthCheck';

export default function AdminDashboardPage() {
  const { isAuthenticated, loading, logout } = useAdminAuth();

  if (loading) {
    return <div className="container pt-12">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href="/">
            Narrekappe<span className="accent">.</span>
          </Link>
          <nav className="main-nav">
            <Link href="/">Home</Link>
            <Link href="/admin-main">Admin</Link>
            <Link href="/admin-monitoring">Monitoring</Link>
            <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
          </nav>
        </div>
      </header>

      <main className="container">
        <h1>Admin Dashboard</h1>
        <p className="muted">Realistic mock dashboard showing admin controls.</p>

        <section className="cards">
          <div className="card">
            <h3>Manage Students</h3>
            <ul>
              <li>Add / remove students</li>
              <li>Reset passwords</li>
              <li>Assign labs</li>
            </ul>
          </div>

          <div className="card">
            <h3>VM Control</h3>
            <ul>
              <li>Start / stop student VMs</li>
              <li>Reset snapshots</li>
              <li>View connection details</li>
            </ul>
          </div>

          <div className="card">
            <h3>Monitoring</h3>
            <p>Live usage:</p>
            <div className="dashboard-sample">
              <div className="dash-card">CPU: 42%</div>
              <div className="dash-card">RAM: 58%</div>
              <div className="dash-card">Storage: 70%</div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}