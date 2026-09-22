'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Черновик' },
  { value: 'published', label: 'Опубликован' },
];

const EMPTY_REPORT = {
  reporting_date: '',
  executive_summary: '',
  key_achievements: '',
  next_week_activities: '',
  management_comments: '',
  status: 'draft',
};

export default function WeeklyReportsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [draft, setDraft] = useState<any>({ ...EMPTY_REPORT });

  const loadReports = async () => {
    try {
      const data = await api.getWeeklyReports(1);
      setRows(data);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить еженедельные отчёты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadReports();
  }, [router]);

  const openModal = (report?: any) => {
    if (report) {
      setSelectedReport(report);
      setDraft({
        reporting_date: report.reporting_date ?? '',
        executive_summary: report.executive_summary ?? '',
        key_achievements: report.key_achievements ?? '',
        next_week_activities: report.next_week_activities ?? '',
        management_comments: report.management_comments ?? '',
        status: report.status ?? 'draft',
      });
    } else {
      setSelectedReport(null);
      setDraft({ ...EMPTY_REPORT });
    }
    setModalOpen(true);
  };

  const saveReport = async () => {
    if (!draft.reporting_date) {
      setError('Дата отчёта обязательна');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        reporting_date: draft.reporting_date,
        executive_summary: draft.executive_summary || null,
        key_achievements: draft.key_achievements || null,
        next_week_activities: draft.next_week_activities || null,
        management_comments: draft.management_comments || null,
        status: draft.status,
      };

      if (selectedReport) {
        const updated = await api.updateWeeklyReport(1, selectedReport.id, payload);
        setRows((current) => current.map((item) => item.id === selectedReport.id ? updated : item));
      } else {
        const created = await api.createWeeklyReport(1, payload);
        setRows((current) => [created, ...current]);
      }

      setModalOpen(false);
      setSelectedReport(null);
      setDraft({ ...EMPTY_REPORT });
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить отчёт');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main style={{ padding: 32 }}>Загрузка еженедельных отчётов...</main>;
  if (error) return <main style={{ padding: 32, color: '#b42318' }}>Ошибка: {error}</main>;

  return (
    <main style={{ padding: 32, background: '#f3f5f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 12 }}>Еженедельные отчёты</h1>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          {['/dashboard','/projects','/risks','/issues','/decisions','/changes','/milestones','/weekly-reports','/audit-trail'].map((href) => (
            <Link key={href} href={href} style={{ textDecoration: 'none', color: '#111827', background: '#fff', border: '1px solid #d0d5dd', borderRadius: 999, padding: '8px 14px', fontSize: 12, fontWeight: 700 }}>
              {href.replace('/', '').replace('-', ' ') || 'home'}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: '#475467' }}>Всего отчётов: <strong>{rows.length}</strong></div>
          <button type="button" onClick={() => openModal()} style={{ border: 'none', background: '#111827', color: '#fff', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>
            + Добавить отчёт
          </button>
        </div>

        <table style={{ width: '100%', background: '#fff', borderRadius: 16, borderCollapse: 'collapse', overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,24,40,0.04)' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#667085', textTransform: 'uppercase', fontSize: 12 }}>
              <th style={{ padding: 16, textAlign: 'left' }}>Дата</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Статус</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Краткое содержание</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((report) => (
              <tr key={report.id} style={{ borderTop: '1px solid #eef2f6' }}>
                <td style={{ padding: 16, fontWeight: 700 }}>{report.reporting_date ?? '—'}</td>
                <td style={{ padding: 16 }}>{report.status}</td>
                <td style={{ padding: 16 }}>{report.executive_summary ?? '—'}</td>
                <td style={{ padding: 16 }}>
                  <button type="button" onClick={() => openModal(report)} style={{ border: '1px solid #d0d5dd', borderRadius: 10, background: '#fff', padding: '8px 10px', cursor: 'pointer', fontWeight: 700 }}>
                    Изменить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.52)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setModalOpen(false)}>
          <div style={{ width: '100%', maxWidth: 640, background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 24px 64px rgba(15, 23, 42, 0.24)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 28 }}>{selectedReport ? 'Изменить отчёт' : 'Добавить отчёт'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} style={{ border: 'none', background: '#f2f4f7', width: 36, height: 36, borderRadius: 10, fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Дата отчёта</label>
                <input type="date" value={draft.reporting_date} onChange={(event) => setDraft({ ...draft, reporting_date: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Статус</label>
                <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }}>
                  {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Краткое содержание</label>
                <textarea value={draft.executive_summary} onChange={(event) => setDraft({ ...draft, executive_summary: event.target.value })} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12, resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Ключевые достижения</label>
                <textarea value={draft.key_achievements} onChange={(event) => setDraft({ ...draft, key_achievements: event.target.value })} rows={2} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12, resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Следующие действия</label>
                <textarea value={draft.next_week_activities} onChange={(event) => setDraft({ ...draft, next_week_activities: event.target.value })} rows={2} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12, resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Комментарии руководства</label>
                <textarea value={draft.management_comments} onChange={(event) => setDraft({ ...draft, management_comments: event.target.value })} rows={2} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12, resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" onClick={() => setModalOpen(false)} style={{ border: '1px solid #d0d5dd', background: '#fff', borderRadius: 12, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>Отмена</button>
              <button type="button" onClick={saveReport} disabled={saving} style={{ border: 'none', background: 'linear-gradient(135deg, #111827, #374151)', color: '#fff', borderRadius: 12, padding: '10px 18px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
