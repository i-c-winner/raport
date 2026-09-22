'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'В ожидании' },
  { value: 'approved', label: 'Утверждено' },
  { value: 'rejected', label: 'Отклонено' },
  { value: 'closed', label: 'Закрыто' },
];

const EMPTY_DECISION = {
  title: '',
  description: '',
  decision_text: '',
  comments: '',
  status: 'pending',
  required_date: '',
  decision_date: '',
  schedule_impact_days: '',
  cost_impact: '',
};

export default function DecisionsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<any | null>(null);
  const [draft, setDraft] = useState<any>({ ...EMPTY_DECISION });

  const loadDecisions = async () => {
    try {
      const data = await api.getDecisions(1);
      setRows(data);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить решения');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadDecisions();
  }, [router]);

  const openModal = (decision?: any) => {
    if (decision) {
      setSelectedDecision(decision);
      setDraft({
        title: decision.title ?? '',
        description: decision.description ?? '',
        decision_text: decision.decision_text ?? '',
        comments: decision.comments ?? '',
        status: decision.status ?? 'pending',
        required_date: decision.required_date ?? '',
        decision_date: decision.decision_date ?? '',
        schedule_impact_days: decision.schedule_impact_days ?? '',
        cost_impact: decision.cost_impact ?? '',
      });
    } else {
      setSelectedDecision(null);
      setDraft({ ...EMPTY_DECISION });
    }
    setModalOpen(true);
  };

  const saveDecision = async () => {
    if (!draft.title?.trim()) {
      setError('Название решения обязательно');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        title: draft.title,
        description: draft.description || null,
        decision_text: draft.decision_text || null,
        comments: draft.comments || null,
        status: draft.status,
        required_date: draft.required_date || null,
        decision_date: draft.decision_date || null,
        schedule_impact_days: draft.schedule_impact_days ? Number(draft.schedule_impact_days) : null,
        cost_impact: draft.cost_impact ? Number(draft.cost_impact) : null,
      };

      if (selectedDecision) {
        const updated = await api.updateDecision(1, selectedDecision.id, payload);
        setRows((current) => current.map((item) => item.id === selectedDecision.id ? updated : item));
      } else {
        const created = await api.createDecision(1, payload);
        setRows((current) => [created, ...current]);
      }

      setModalOpen(false);
      setSelectedDecision(null);
      setDraft({ ...EMPTY_DECISION });
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить решение');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main style={{ padding: 32 }}>Загрузка решений...</main>;
  if (error) return <main style={{ padding: 32, color: '#b42318' }}>Ошибка: {error}</main>;

  return (
    <main style={{ padding: 32, background: '#f3f5f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 12 }}>Решения</h1>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          {['/dashboard','/projects','/risks','/issues','/decisions','/changes','/milestones','/weekly-reports','/audit-trail'].map((href) => (
            <Link key={href} href={href} style={{ textDecoration: 'none', color: '#111827', background: '#fff', border: '1px solid #d0d5dd', borderRadius: 999, padding: '8px 14px', fontSize: 12, fontWeight: 700 }}>
              {href.replace('/', '').replace('-', ' ') || 'home'}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: '#475467' }}>Всего решений: <strong>{rows.length}</strong></div>
          <button type="button" onClick={() => openModal()} style={{ border: 'none', background: '#111827', color: '#fff', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>
            + Добавить решение
          </button>
        </div>

        <table style={{ width: '100%', background: '#fff', borderRadius: 16, borderCollapse: 'collapse', overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,24,40,0.04)' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#667085', textTransform: 'uppercase', fontSize: 12 }}>
              <th style={{ padding: 16, textAlign: 'left' }}>Код</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Название</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Статус</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Срок решения</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((decision) => (
              <tr key={decision.id} style={{ borderTop: '1px solid #eef2f6' }}>
                <td style={{ padding: 16, fontWeight: 700 }}>{decision.code}</td>
                <td style={{ padding: 16 }}>{decision.title}</td>
                <td style={{ padding: 16 }}>{decision.status}</td>
                <td style={{ padding: 16 }}>{decision.required_date ?? '—'}</td>
                <td style={{ padding: 16 }}>
                  <button type="button" onClick={() => openModal(decision)} style={{ border: '1px solid #d0d5dd', borderRadius: 10, background: '#fff', padding: '8px 10px', cursor: 'pointer', fontWeight: 700 }}>
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
              <h3 style={{ margin: 0, fontSize: 28 }}>{selectedDecision ? 'Изменить решение' : 'Добавить решение'}</h3>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Статус</label>
                  <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }}>
                    {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Срок решения</label>
                  <input type="date" value={draft.required_date} onChange={(event) => setDraft({ ...draft, required_date: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Дата принятия решения</label>
                <input type="date" value={draft.decision_date} onChange={(event) => setDraft({ ...draft, decision_date: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Текст решения</label>
                <textarea value={draft.decision_text} onChange={(event) => setDraft({ ...draft, decision_text: event.target.value })} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12, resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Комментарии</label>
                <textarea value={draft.comments} onChange={(event) => setDraft({ ...draft, comments: event.target.value })} rows={2} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12, resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Дни по графику</label>
                  <input type="number" value={draft.schedule_impact_days} onChange={(event) => setDraft({ ...draft, schedule_impact_days: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Стоимость</label>
                  <input type="number" value={draft.cost_impact} onChange={(event) => setDraft({ ...draft, cost_impact: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" onClick={() => setModalOpen(false)} style={{ border: '1px solid #d0d5dd', background: '#fff', borderRadius: 12, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>Отмена</button>
              <button type="button" onClick={saveDecision} disabled={saving} style={{ border: 'none', background: 'linear-gradient(135deg, #111827, #374151)', color: '#fff', borderRadius: 12, padding: '10px 18px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
