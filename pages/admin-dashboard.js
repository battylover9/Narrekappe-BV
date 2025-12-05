// app/admin-dashboard/page.js
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const router = useRouter();

  // Mimic the old localStorage auth check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('loggedIn') !== 'yes') {
        router.push('/admin');
      }
    }
  }, [router]);

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href="/">
            Narrekappe<span className="accent">.</span>
          </Link>
          <nav className="main-nav">
            <Link href="/">Home</Link>
            <Link href="/admin">Admin Info</Link>
            <Link href="/admin">Logout</Link>
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
