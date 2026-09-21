'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AuditTrailPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<any | null>(null);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login');
      return;
    }

    api.me()
      .then(setMe)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <main style={{ padding: 32 }}>Загрузка журнала аудита...</main>;
  if (error) return <main style={{ padding: 32, color: '#b42318' }}>Ошибка: {error}</main>;

  return (
    <main style={{ padding: 32, background: '#f3f5f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 12 }}>Журнал аудита</h1>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          {['/dashboard','/projects','/risks','/issues','/decisions','/changes','/milestones','/weekly-reports','/audit-trail'].map((href) => (
            <Link key={href} href={href} style={{ textDecoration: 'none', color: '#111827', background: '#fff', border: '1px solid #d0d5dd', borderRadius: 999, padding: '8px 14px', fontSize: 12, fontWeight: 700 }}>
              {href.replace('/', '').replace('-', ' ') || 'home'}
            </Link>
          ))}
        </nav>

        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 2px rgba(16,24,40,0.04)' }}>
          <p><strong>Пользователь:</strong> {me?.full_name ?? '—'}</p>
          <p><strong>Email:</strong> {me?.email ?? '—'}</p>
          <p><strong>Роль:</strong> {me?.role ?? '—'}</p>
          <p><strong>Организация:</strong> {me?.organization_id ?? '—'}</p>
          <p style={{ margin: 0 }}>Это слой прослеживаемости для проектного управления: Risk → Issue → Decision → Change → Schedule/Cost impact.</p>
        </div>
      </div>
    </main>
  );
}
