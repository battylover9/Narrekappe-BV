import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export function useAdminAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState('');

  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    const user = localStorage.getItem('adminUser');

    if (adminAuth === 'true' && user) {
      setIsAuthenticated(true);
      setAdminUser(user);
    } else {
      router.push('/admin-login');
    }
    setLoading(false);
  }, [router]);

  const logout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminUser');
    router.push('/admin-login');
  };

  return { isAuthenticated, loading, adminUser, logout };
}