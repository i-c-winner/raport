'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const milestones = [
  { name: 'Завершение проектирования', baseline: '15 нояб.', forecast: '28 нояб.', variance: '+13д', status: 'Задержка' },
  { name: 'Начало строительства', baseline: '01 февр.', forecast: '01 февр.', variance: '0д', status: 'В графике' },
  { name: 'Пусконаладка', baseline: '01 дек.', forecast: '19 дек.', variance: '+18д', status: 'Задержка' },
];

const attention = [
  { title: 'Риск по электропотреблению', type: 'Критический риск', severity: 'Высокий' },
  { title: 'Подтвержден недостаток электрической мощности', type: 'Критическая проблема', severity: 'Высокий' },
  { title: 'Выбор решения по электроснабжению', type: 'Просроченное решение', severity: 'Средний' },
  { title: 'Дополнительная трансформаторная подстанция', type: 'Ожидаемое изменение', severity: 'Средний' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login');
      return;
    }

    api.getDashboard(1)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <main style={{ padding: 32 }}>Загрузка дашборда...</main>;
  if (error) return <main style={{ padding: 32, color: '#b42318' }}>Ошибка: {error}</main>;

  return (
    <main style={{ padding: 32, background: '#f3f5f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <header style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: '#667085' }}>Проект</div>
          <h1 style={{ margin: '8px 0 0', fontSize: 36 }}>{data?.project_name ?? 'Project Control'}</h1>
        </header>

        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          {['/dashboard', '/projects', '/risks', '/issues', '/decisions', '/changes', '/milestones', '/weekly-reports', '/audit-trail'].map((href) => (
            <Link key={href} href={href} style={{ textDecoration: 'none', color: '#111827', background: '#fff', border: '1px solid #d0d5dd', borderRadius: 999, padding: '8px 14px', fontSize: 12, fontWeight: 700 }}>
              {href.replace('/', '').replace('-', ' ') || 'home'}
            </Link>
          ))}
        </nav>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            ['Общий статус', data?.status ?? 'active', 'Статус проекта'],
            ['Прогресс', `${data?.progress ?? 0}%`, 'Текущий прогресс'],
            ['График', data?.schedule_status ?? 'on_track', `${data?.schedule_variance_days ?? 0} дней`],
            ['Открытые риски', String(data?.open_risks ?? 0), 'Текущая корзина рисков'],
            ['Критические проблемы', String(data?.critical_issues ?? 0), 'Проблемы высокой важности'],
          ].map(([label, value, meta]) => (
            <div key={label} style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e4e7ec', boxShadow: '0 1px 2px rgba(16,24,40,0.04)' }}>
              <div style={{ fontSize: 12, color: '#667085', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, margin: '12px 0 4px' }}>{value}</div>
              <div style={{ fontSize: 12, color: '#475467' }}>{meta}</div>
            </div>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e4e7ec' }}>
            <h2 style={{ marginTop: 0 }}>Ключевые этапы</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#667085', fontSize: 12, textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 8px' }}>Этап</th>
                  <th>База</th>
                  <th>Прогноз</th>
                  <th>Отклонение</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m) => (
                  <tr key={m.name} style={{ borderTop: '1px solid #eef2f6' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{m.name}</td>
                    <td>{m.baseline}</td>
                    <td>{m.forecast}</td>
                    <td style={{ color: m.variance.startsWith('+') ? '#c0392b' : '#1f8a4c', fontWeight: 600 }}>{m.variance}</td>
                    <td>{m.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e4e7ec' }}>
            <h2 style={{ marginTop: 0 }}>Требует внимания</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {attention.map((item) => (
                <div key={item.title} style={{ padding: 12, background: '#f9fafb', borderRadius: 12, border: '1px solid #eef2f6' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#667085' }}>{item.type}</div>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#b42318', fontWeight: 700 }}>{item.severity}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
