import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const adminAuth = localStorage.getItem('adminAuth');
      const user = localStorage.getItem('adminUser');
      
      if (adminAuth === 'true' && user) {
        setIsAuthenticated(true);
        setAdminUser(user);
      } else {
        router.push('/admin');
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const logout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminUser');
    router.push('/admin');
  };

  return { isAuthenticated, loading, adminUser, logout };
}
