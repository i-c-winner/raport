'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Планируется' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'completed', label: 'Завершён' },
  { value: 'cancelled', label: 'Отменён' },
];

const EMPTY_MILESTONE = {
  title: '',
  description: '',
  status: 'planned',
  baseline_date: '',
  current_date: '',
  forecast_date: '',
  actual_date: '',
};

export default function MilestonesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<any | null>(null);
  const [draft, setDraft] = useState<any>({ ...EMPTY_MILESTONE });

  const loadMilestones = async () => {
    try {
      const data = await api.getMilestones(1);
      setRows(data);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить этапы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadMilestones();
  }, [router]);

  const openModal = (milestone?: any) => {
    if (milestone) {
      setSelectedMilestone(milestone);
      setDraft({
        title: milestone.title ?? '',
        description: milestone.description ?? '',
        status: milestone.status ?? 'planned',
        baseline_date: milestone.baseline_date ?? '',
        current_date: milestone.current_date ?? '',
        forecast_date: milestone.forecast_date ?? '',
        actual_date: milestone.actual_date ?? '',
      });
    } else {
      setSelectedMilestone(null);
      setDraft({ ...EMPTY_MILESTONE });
    }
    setModalOpen(true);
  };

  const saveMilestone = async () => {
    if (!draft.title?.trim()) {
      setError('Название этапа обязательно');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        title: draft.title,
        description: draft.description || null,
        status: draft.status,
        baseline_date: draft.baseline_date || null,
        current_date: draft.current_date || null,
        forecast_date: draft.forecast_date || null,
        actual_date: draft.actual_date || null,
      };

      if (selectedMilestone) {
        const updated = await api.updateMilestone(1, selectedMilestone.id, payload);
        setRows((current) => current.map((item) => item.id === selectedMilestone.id ? updated : item));
      } else {
        const created = await api.createMilestone(1, payload);
        setRows((current) => [created, ...current]);
      }

      setModalOpen(false);
      setSelectedMilestone(null);
      setDraft({ ...EMPTY_MILESTONE });
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить этап');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main style={{ padding: 32 }}>Загрузка этапов...</main>;
  if (error) return <main style={{ padding: 32, color: '#b42318' }}>Ошибка: {error}</main>;

  return (
    <main style={{ padding: 32, background: '#f3f5f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 12 }}>Этапы</h1>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          {['/dashboard','/projects','/risks','/issues','/decisions','/changes','/milestones','/weekly-reports','/audit-trail'].map((href) => (
            <Link key={href} href={href} style={{ textDecoration: 'none', color: '#111827', background: '#fff', border: '1px solid #d0d5dd', borderRadius: 999, padding: '8px 14px', fontSize: 12, fontWeight: 700 }}>
              {href.replace('/', '').replace('-', ' ') || 'home'}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: '#475467' }}>Всего этапов: <strong>{rows.length}</strong></div>
          <button type="button" onClick={() => openModal()} style={{ border: 'none', background: '#111827', color: '#fff', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>
            + Добавить этап
          </button>
        </div>

        <table style={{ width: '100%', background: '#fff', borderRadius: 16, borderCollapse: 'collapse', overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,24,40,0.04)' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#667085', textTransform: 'uppercase', fontSize: 12 }}>
              <th style={{ padding: 16, textAlign: 'left' }}>Код</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Название</th>
              <th style={{ padding: 16, textAlign: 'left' }}>База</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Статус</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((milestone) => (
              <tr key={milestone.id} style={{ borderTop: '1px solid #eef2f6' }}>
                <td style={{ padding: 16, fontWeight: 700 }}>{milestone.code}</td>
                <td style={{ padding: 16 }}>{milestone.title}</td>
                <td style={{ padding: 16 }}>{milestone.baseline_date ?? '—'}</td>
                <td style={{ padding: 16 }}>{milestone.status}</td>
                <td style={{ padding: 16 }}>
                  <button type="button" onClick={() => openModal(milestone)} style={{ border: '1px solid #d0d5dd', borderRadius: 10, background: '#fff', padding: '8px 10px', cursor: 'pointer', fontWeight: 700 }}>
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
              <h3 style={{ margin: 0, fontSize: 28 }}>{selectedMilestone ? 'Изменить этап' : 'Добавить этап'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} style={{ border: 'none', background: '#f2f4f7', width: 36, height: 36, borderRadius: 10, fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Название</label>
                <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Описание</label>
                <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12, resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Статус</label>
                <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }}>
                  {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Базовая дата</label>
                  <input type="date" value={draft.baseline_date} onChange={(event) => setDraft({ ...draft, baseline_date: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Текущая дата</label>
                  <input type="date" value={draft.current_date} onChange={(event) => setDraft({ ...draft, current_date: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Прогноз</label>
                  <input type="date" value={draft.forecast_date} onChange={(event) => setDraft({ ...draft, forecast_date: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Фактическая дата</label>
                  <input type="date" value={draft.actual_date} onChange={(event) => setDraft({ ...draft, actual_date: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" onClick={() => setModalOpen(false)} style={{ border: '1px solid #d0d5dd', background: '#fff', borderRadius: 12, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>Отмена</button>
              <button type="button" onClick={saveMilestone} disabled={saving} style={{ border: 'none', background: 'linear-gradient(135deg, #111827, #374151)', color: '#fff', borderRadius: 12, padding: '10px 18px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
