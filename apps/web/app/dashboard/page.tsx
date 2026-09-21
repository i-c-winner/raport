'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Запланировано' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'completed', label: 'Завершено' },
  { value: 'cancelled', label: 'Отменено' },
];

const MILSTONE_EMPTY = {
  code: '',
  title: '',
  baseline_date: '',
  forecast_date: '',
  status: 'planned',
};

const attention = [
  { title: 'Риск по электропотреблению', type: 'Критический риск', severity: 'Высокий' },
  { title: 'Подтвержден недостаток электрической мощности', type: 'Критическая проблема', severity: 'Высокий' },
  { title: 'Выбор решения по электроснабжению', type: 'Просроченное решение', severity: 'Средний' },
  { title: 'Дополнительная трансформаторная подстанция', type: 'Ожидаемое изменение', severity: 'Средний' },
];

function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getVarianceDays(baselineDate?: string | null, forecastDate?: string | null): number {
  if (!baselineDate || !forecastDate) return 0;
  const baseline = new Date(baselineDate); 
  const forecast = new Date(forecastDate);
  if (Number.isNaN(baseline.getTime()) || Number.isNaN(forecast.getTime())) return 0;
  return Math.round((forecast.getTime() - baseline.getTime()) / 86400000);
}

function statusLabel(status: string): string {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<any>({ ...MILSTONE_EMPTY });

  const statusMeta = (status: string) => {
    const meta = {
      planned: { label: 'Запланировано', bg: '#f2f4f7', color: '#344054', border: '#d0d5dd' },
      in_progress: { label: 'В работе', bg: '#ebf3ff', color: '#175cd3', border: '#bfd4ff' },
      completed: { label: 'Завершено', bg: '#ecfdf3', color: '#027a48', border: '#abefc6' },
      cancelled: { label: 'Отменено', bg: '#fef3f2', color: '#b42318', border: '#fecdca' },
    } as const;
    return meta[status as keyof typeof meta] ?? { label: statusLabel(status), bg: '#f2f4f7', color: '#344054', border: '#d0d5dd' };
  };

  const loadData = async () => {
    try {
      const [dashboard, milestoneRows] = await Promise.all([
        api.getDashboard(1),
        api.getMilestones(1),
      ]);
      setData(dashboard);
      setMilestones(milestoneRows);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadData();
  }, [router]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setDraft({ ...MILSTONE_EMPTY });
    setModalOpen(true);
  };

  const openEditModal = (milestone: any) => {
    setModalMode('edit');
    setEditingId(milestone.id);
    setDraft({
      code: milestone.code ?? '',
      title: milestone.title ?? '',
      description: milestone.description ?? '',
      baseline_date: milestone.baseline_date ?? '',
      forecast_date: milestone.forecast_date ?? '',
      status: milestone.status ?? 'planned',
    });
    setModalOpen(true);
  };

  const saveDraft = async () => {
    if (!draft.title?.trim()) {
      setError('Название этапа обязательно');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (modalMode === 'create') {
        const created = await api.createMilestone(1, {
          code: draft.code || undefined,
          title: draft.title,
          description: draft.description || '',
          baseline_date: draft.baseline_date || undefined,
          forecast_date: draft.forecast_date || undefined,
          status: draft.status,
        });
        setMilestones((current) => [...current, created]);
      } else if (editingId !== null) {
        const updated = await api.updateMilestone(1, editingId, {
          title: draft.title,
          description: draft.description || null,
          forecast_date: draft.forecast_date || null,
          status: draft.status,
        });
        setMilestones((current) => current.map((item) => (item.id === editingId ? updated : item)));
      }

      setModalOpen(false);
      setDraft({ ...MILSTONE_EMPTY });
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить этап');
    } finally {
      setSaving(false);
    }
  };

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Ключевые этапы</h2>
              <button
                type="button"
                onClick={openCreateModal}
                disabled={saving}
                style={{
                  border: 'none',
                  background: '#111827',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '10px 16px',
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                + Добавить этап
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.1fr 1.1fr 0.9fr 1.3fr 0.9fr', gap: 8, fontSize: 11, textTransform: 'uppercase', color: '#667085', fontWeight: 700, padding: '0 8px 8px' }}>
              <div>Этап</div>
              <div>База</div>
              <div>Прогноз</div>
              <div>Отклонение</div>
              <div>Статус</div>
              <div>Действия</div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {milestones.map((milestone) => {
                const variance = getVarianceDays(milestone.baseline_date, milestone.forecast_date);
                const varianceText = `${variance > 0 ? '+' : ''}${variance}д`;
                const meta = statusMeta(milestone.status);

                return (
                  <div key={milestone.id} style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.1fr 1.1fr 0.9fr 1.3fr 0.9fr', gap: 8, alignItems: 'center', background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 12, padding: '10px 8px' }}>
                    <div style={{ fontWeight: 700, color: '#101828' }}>{milestone.title}</div>
                    <div style={{ color: '#475467' }}>{formatDate(milestone.baseline_date)}</div>
                    <div style={{ color: '#475467' }}>{formatDate(milestone.forecast_date)}</div>
                    <div style={{ color: variance > 0 ? '#c0392b' : '#1f8a4c', fontWeight: 700 }}>{varianceText}</div>
                    <div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 999,
                          background: meta.bg,
                          border: `1px solid ${meta.border}`,
                          color: meta.color,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '6px 10px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditModal(milestone)}
                      style={{
                        border: '1px solid #d0d5dd',
                        background: '#fff',
                        borderRadius: 10,
                        color: '#111827',
                        fontWeight: 700,
                        padding: '8px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      Изменить
                    </button>
                  </div>
                );
              })}
            </div>
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

      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.52)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 560,
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: 20,
              padding: 24,
              boxShadow: '0 24px 64px rgba(15, 23, 42, 0.24)',
              border: '1px solid rgba(148, 163, 184, 0.35)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: '#667085', marginBottom: 6 }}>
                  {modalMode === 'create' ? 'Новый этап' : 'Редактирование'}
                </div>
                <h3 style={{ margin: 0, fontSize: 28, color: '#111827' }}>{modalMode === 'create' ? 'Добавить ключевой этап' : 'Редактировать этап'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  border: 'none',
                  background: '#f2f4f7',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#475467',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#344054', marginBottom: 8 }}>Код</label>
                  <input
                    value={draft.code}
                    readOnly={modalMode === 'edit'}
                    onChange={(event) => setDraft((current: any) => ({ ...current, code: event.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d0d5dd',
                      borderRadius: 12,
                      background: modalMode === 'edit' ? '#f8fafc' : '#fff',
                      color: modalMode === 'edit' ? '#475467' : '#111827',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#344054', marginBottom: 8 }}>Статус</label>
                  <select
                    value={draft.status}
                    onChange={(event) => setDraft((current: any) => ({ ...current, status: event.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12, background: '#fff' }}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#344054', marginBottom: 8 }}>Название этапа</label>
                <input
                  value={draft.title}
                  onChange={(event) => setDraft((current: any) => ({ ...current, title: event.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12, background: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#344054', marginBottom: 8 }}>Описание</label>
                <textarea
                  value={draft.description}
                  onChange={(event) => setDraft((current: any) => ({ ...current, description: event.target.value }))}
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12, resize: 'vertical', background: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#344054', marginBottom: 8 }}>Дата базы</label>
                  <input
                    type="date"
                    value={draft.baseline_date ?? ''}
                    readOnly={modalMode === 'edit'}
                    onChange={(event) => setDraft((current: any) => ({ ...current, baseline_date: event.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d0d5dd',
                      borderRadius: 12,
                      background: modalMode === 'edit' ? '#f8fafc' : '#fff',
                      color: modalMode === 'edit' ? '#475467' : '#111827',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#344054', marginBottom: 8 }}>Прогноз</label>
                  <input
                    type="date"
                    value={draft.forecast_date ?? ''}
                    onChange={(event) => setDraft((current: any) => ({ ...current, forecast_date: event.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12, background: '#fff' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  border: '1px solid #d0d5dd',
                  background: '#fff',
                  borderRadius: 12,
                  padding: '10px 16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#344054',
                }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                style={{
                  border: 'none',
                  background: 'linear-gradient(135deg, #111827, #374151)',
                  color: '#fff',
                  borderRadius: 12,
                  padding: '10px 18px',
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  boxShadow: '0 8px 18px rgba(17, 24, 39, 0.22)',
                }}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
