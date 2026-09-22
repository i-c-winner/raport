'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const ENTITY_LABELS: Record<string, string> = {
  risk: 'Риск',
  issue: 'Issue',
  decision: 'Решение',
  change: 'Изменение',
  milestone: 'Этап',
  weekly_report: 'Еженедельный отчёт',
};

export default function AuditTrailPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login');
      return;
    }

    api.getAuditLogs(1)
      .then(setEntries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  const visibleEntries = [...entries]
    .filter((entry) => filter === 'all' || entry.entity_type === filter)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const formatSummary = (entry: any) => {
    const label = ENTITY_LABELS[entry.entity_type] ?? entry.entity_type;
    const entityName = entry.entity_name || 'без имени';
    if (entry.field_name && entry.old_value !== null && entry.old_value !== undefined && entry.new_value !== null && entry.new_value !== undefined) {
      return `${label}: ${entry.field_name} ${entry.old_value} → ${entry.new_value}`;
    }
    if (entry.field_name && entry.new_value !== null && entry.new_value !== undefined) {
      return `${label}: ${entry.field_name} → ${entry.new_value}`;
    }
    return `${label}: ${entityName}`;
  };

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
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 14, color: '#475467' }}>Всего записей: <strong>{visibleEntries.length}</strong></div>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              style={{ padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12, background: '#fff' }}
            >
              <option value="all">Все сущности</option>
              {Object.entries(ENTITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {visibleEntries.length === 0 ? (
            <p>Изменений пока нет.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {visibleEntries.map((entry) => (
                <div key={entry.id} style={{ border: '1px solid #edf2f7', background: '#f8fafc', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                    <strong>{ENTITY_LABELS[entry.entity_type] ?? entry.entity_type}</strong>
                    <span style={{ color: '#667085', fontSize: 12 }}>
                      {new Date(entry.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ color: '#475467', fontSize: 14, display: 'grid', gap: 4 }}>
                    <div style={{ fontWeight: 700, color: '#111827' }}>{formatSummary(entry)}</div>
                    <div><strong>Объект:</strong> {entry.entity_name ?? 'без имени'}</div>
                    <div><strong>Действие:</strong> {entry.action}</div>
                    {entry.field_name && <div><strong>Поле:</strong> {entry.field_name}</div>}
                    {entry.old_value !== null && entry.old_value !== undefined && <div><strong>Было:</strong> {entry.old_value}</div>}
                    {entry.new_value !== null && entry.new_value !== undefined && <div><strong>Стало:</strong> {entry.new_value}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
