'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('pm@projectcontrol.local');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const data = await api.login(email, password);
      setToken(data.access_token);
      localStorage.setItem('project-control-token', data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#edf2f7' }}>
      <div style={{ width: 420, background: '#fff', borderRadius: 16, padding: 32, border: '1px solid #e4e7ec', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
        <h1 style={{ marginTop: 0 }}>Project Control</h1>
        <p style={{ color: '#475467', marginBottom: 24 }}>Войдите, чтобы продолжить</p>

        <div style={{ display: 'grid', gap: 16 }}>
          <label>
            <div style={{ marginBottom: 8, fontSize: 12, color: '#475467' }}>Email</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #d0d5dd' }} />
          </label>

          <label>
            <div style={{ marginBottom: 8, fontSize: 12, color: '#475467' }}>Пароль</div>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #d0d5dd' }} />
          </label>

          <button onClick={handleSubmit} disabled={loading} style={{ padding: '12px 16px', border: 0, borderRadius: 10, background: '#1d4ed8', color: '#fff', fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Выполняется вход...' : 'Войти'}
          </button>

          {error && <div style={{ color: '#b42318', fontSize: 12 }}>{error}</div>}
          {token && <div style={{ color: '#1f8a4c', fontSize: 12 }}>Токен получен. Сессия обновлена.</div>}
        </div>
      </div>
    </main>
  );
}
