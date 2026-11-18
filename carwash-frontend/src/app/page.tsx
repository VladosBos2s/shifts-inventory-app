'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      router.replace('/login');
      return;
    }

    if (role === 'ADMIN') {
      router.replace('/admin');
    } else {
      router.replace('/operator');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
      Redirecting...
    </div>
  );
}