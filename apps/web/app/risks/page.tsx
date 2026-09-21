'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Открыт' },
  { value: 'occurred', label: 'Случился' },
  { value: 'mitigated', label: 'Снижен' },
  { value: 'closed', label: 'Закрыт' },
];

const PROBABILITY_OPTIONS = [
  { value: 'low', label: 'Низкая' },
  { value: 'medium', label: 'Средняя' },
  { value: 'high', label: 'Высокая' },
];

const IMPACT_OPTIONS = [
  { value: 'low', label: 'Низкое' },
  { value: 'medium', label: 'Среднее' },
  { value: 'high', label: 'Высокое' },
  { value: 'critical', label: 'Критическое' },
];

const RATING_OPTIONS = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'critical', label: 'Критический' },
];

const RESPONSE_STRATEGY_OPTIONS = [
  { value: 'avoid', label: 'Устранять' },
  { value: 'mitigate', label: 'Снижать' },
  { value: 'transfer', label: 'Переносить' },
  { value: 'accept', label: 'Принять' },
];

const CHANGE_FIELD_OPTIONS = [
  { value: 'status', label: 'Статус' },
  { value: 'rating', label: 'Оценка' },
  { value: 'probability', label: 'Вероятность' },
  { value: 'impact_level', label: 'Влияние' },
];

const EMPTY_RISK = {
  title: '',
  description: '',
  category: '',
  probability: 'medium',
  impact_level: 'medium',
  rating: 'medium',
  status: 'open',
  response_strategy: '',
  mitigation: '',
};

const EMPTY_CHANGE = {
  field_name: 'status',
  old_value: '',
  new_value: 'open',
  comment: '',
};

export default function RisksPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [changes, setChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<any | null>(null);
  const [riskDraft, setRiskDraft] = useState<any>({ ...EMPTY_RISK });
  const [changeDraft, setChangeDraft] = useState<any>({ ...EMPTY_CHANGE });

  const loadRisks = async () => {
    try {
      const data = await api.getRisks(1);
      setRows(data);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить риски');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadRisks();
  }, [router]);

  const totalRiskCount = useMemo(() => rows.length, [rows]);

  const openRiskModal = () => {
    setRiskDraft({ ...EMPTY_RISK });
    setRiskModalOpen(true);
  };

  const openChangeModal = async (risk: any) => {
    setSelectedRisk(risk);
    setChangeDraft({
      ...EMPTY_CHANGE,
      old_value: risk.status ?? '',
      new_value: risk.status ?? 'open',
    });
    try {
      const list = await api.getRiskChanges(1, risk.id);
      setChanges(list);
    } catch (err) {
      setChanges([]);
    }
    setChangeModalOpen(true);
  };

  const saveRisk = async () => {
    if (!riskDraft.title?.trim()) {
      setError('Название риска обязательно');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const created = await api.createRisk(1, {
        title: riskDraft.title,
        description: riskDraft.description || null,
        category: riskDraft.category || null,
        probability: riskDraft.probability,
        impact_level: riskDraft.impact_level,
        rating: riskDraft.rating,
        status: riskDraft.status,
        response_strategy: riskDraft.response_strategy || null,
        mitigation: riskDraft.mitigation || null,
      });
      setRows((current) => [created, ...current]);
      setRiskModalOpen(false);
      setRiskDraft({ ...EMPTY_RISK });
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить риск');
    } finally {
      setSaving(false);
    }
  };

  const saveChange = async () => {
    if (!selectedRisk || !changeDraft.field_name?.trim()) {
      setError('Поле изменения обязательно');
      return;
    }

    const currentValue = selectedRisk[changeDraft.field_name];
    if (String(currentValue ?? '') === String(changeDraft.new_value ?? '')) {
      setChangeModalOpen(false);
      setSelectedRisk(null);
      router.push('/risks');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const created = await api.createRiskChange(1, selectedRisk.id, {
        field_name: changeDraft.field_name,
        old_value: changeDraft.old_value || null,
        new_value: changeDraft.new_value || null,
        comment: changeDraft.comment || null,
      });
      setChanges((current) => [created, ...current]);
      await api.updateRisk(1, selectedRisk.id, {
        [changeDraft.field_name]: changeDraft.new_value || null,
      });
      setRows((current) => current.map((risk) => risk.id === selectedRisk.id ? { ...risk, [changeDraft.field_name]: changeDraft.new_value } : risk));
      setChangeModalOpen(false);
      setSelectedRisk(null);
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить изменение риска');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main style={{ padding: 32 }}>Загрузка рисков...</main>;
  if (error) return <main style={{ padding: 32, color: '#b42318' }}>Ошибка: {error}</main>;

  return (
    <main style={{ padding: 32, background: '#f3f5f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 12 }}>Риски</h1>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          {['/dashboard','/projects','/risks','/issues','/decisions','/changes','/milestones','/weekly-reports','/audit-trail'].map((href) => (
            <Link key={href} href={href} style={{ textDecoration: 'none', color: '#111827', background: '#fff', border: '1px solid #d0d5dd', borderRadius: 999, padding: '8px 14px', fontSize: 12, fontWeight: 700 }}>
              {href.replace('/', '').replace('-', ' ') || 'home'}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: '#475467' }}>Всего рисков: <strong>{totalRiskCount}</strong></div>
          <button
            type="button"
            onClick={openRiskModal}
            style={{ border: 'none', background: '#111827', color: '#fff', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}
          >
            + Добавить риск
          </button>
        </div>

        <table style={{ width: '100%', background: '#fff', borderRadius: 16, borderCollapse: 'collapse', overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,24,40,0.04)' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#667085', textTransform: 'uppercase', fontSize: 12 }}>
              <th style={{ padding: 16, textAlign: 'left' }}>Код</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Название</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Оценка</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Статус</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((risk) => (
              <tr key={risk.id} style={{ borderTop: '1px solid #eef2f6' }}>
                <td style={{ padding: 16, fontWeight: 700 }}>{risk.code}</td>
                <td style={{ padding: 16 }}>{risk.title}</td>
                <td style={{ padding: 16 }}>{risk.rating}</td>
                <td style={{ padding: 16 }}>{risk.status}</td>
                <td style={{ padding: 16 }}>
                  <button type="button" onClick={() => openChangeModal(risk)} style={{ border: '1px solid #d0d5dd', borderRadius: 10, background: '#fff', padding: '8px 10px', cursor: 'pointer', fontWeight: 700 }}>
                    Изменения
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {riskModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.52)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setRiskModalOpen(false)}>
          <div style={{ width: '100%', maxWidth: 620, background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 24px 64px rgba(15, 23, 42, 0.24)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 28 }}>Добавить риск</h3>
              <button type="button" onClick={() => setRiskModalOpen(false)} style={{ border: 'none', background: '#f2f4f7', width: 36, height: 36, borderRadius: 10, fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Название</label>
                <input value={riskDraft.title} onChange={(event) => setRiskDraft({ ...riskDraft, title: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Описание</label>
                <textarea value={riskDraft.description} onChange={(event) => setRiskDraft({ ...riskDraft, description: event.target.value })} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Категория</label>
                  <input value={riskDraft.category} onChange={(event) => setRiskDraft({ ...riskDraft, category: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Статус</label>
                  <select value={riskDraft.status} onChange={(event) => setRiskDraft({ ...riskDraft, status: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }}>
                    {STATUS_OPTIONS.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Вероятность</label>
                  <select value={riskDraft.probability} onChange={(event) => setRiskDraft({ ...riskDraft, probability: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }}>
                    {PROBABILITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Влияние</label>
                  <select value={riskDraft.impact_level} onChange={(event) => setRiskDraft({ ...riskDraft, impact_level: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }}>
                    {IMPACT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Оценка</label>
                <select value={riskDraft.rating} onChange={(event) => setRiskDraft({ ...riskDraft, rating: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }}>
                  {RATING_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Стратегия ответа</label>
                <select value={riskDraft.response_strategy} onChange={(event) => setRiskDraft({ ...riskDraft, response_strategy: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }}>
                  <option value="">Не выбрано</option>
                  {RESPONSE_STRATEGY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" onClick={() => setRiskModalOpen(false)} style={{ border: '1px solid #d0d5dd', background: '#fff', borderRadius: 12, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>Отмена</button>
              <button type="button" onClick={saveRisk} disabled={saving} style={{ border: 'none', background: 'linear-gradient(135deg, #111827, #374151)', color: '#fff', borderRadius: 12, padding: '10px 18px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {changeModalOpen && selectedRisk && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.52)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setChangeModalOpen(false)}>
          <div style={{ width: '100%', maxWidth: 640, background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 24px 64px rgba(15, 23, 42, 0.24)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: '#667085', fontWeight: 700 }}>Изменения</div>
                <h3 style={{ margin: '6px 0 0', fontSize: 28 }}>{selectedRisk.title}</h3>
              </div>
              <button type="button" onClick={() => setChangeModalOpen(false)} style={{ border: 'none', background: '#f2f4f7', width: 36, height: 36, borderRadius: 10, fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Поле</label>
                  <select
                    value={changeDraft.field_name}
                    onChange={(event) => {
                      const nextField = event.target.value;
                      const nextStatus = nextField === 'status' ? 'open' : changeDraft.new_value;
                      setChangeDraft({
                        ...changeDraft,
                        field_name: nextField,
                        new_value: nextField === 'status' ? nextStatus : changeDraft.new_value,
                        old_value: nextField === 'status' ? selectedRisk.status ?? '' : changeDraft.old_value,
                      });
                    }}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }}
                  >
                    {CHANGE_FIELD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Новое значение</label>
                  {(() => {
                    const options =
                      changeDraft.field_name === 'status'
                        ? STATUS_OPTIONS
                        : changeDraft.field_name === 'probability'
                          ? PROBABILITY_OPTIONS
                          : changeDraft.field_name === 'impact_level'
                            ? IMPACT_OPTIONS
                            : RATING_OPTIONS;

                    return (
                      <select
                        value={changeDraft.new_value}
                        onChange={(event) => setChangeDraft({ ...changeDraft, new_value: event.target.value })}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }}
                      >
                        {options.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Комментарий</label>
                <textarea value={changeDraft.comment} onChange={(event) => setChangeDraft({ ...changeDraft, comment: event.target.value })} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12, resize: 'vertical' }} />
              </div>
              <button type="button" onClick={saveChange} disabled={saving} style={{ border: 'none', background: '#111827', color: '#fff', borderRadius: 12, padding: '10px 18px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Сохранение...' : 'Добавить изменение'}
              </button>
            </div>

            <div style={{ borderTop: '1px solid #eef2f6', paddingTop: 16 }}>
              <h4 style={{ margin: '0 0 12px' }}>История</h4>
              {changes.length === 0 ? (
                <div style={{ color: '#667085' }}>Изменений пока нет.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {changes.map((item) => (
                    <div key={item.id} style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 12, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ fontWeight: 700 }}>{item.field_name}</div>
                        <div style={{ fontSize: 12, color: '#667085' }}>
                          {new Date(item.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#475467' }}>
                        → {item.new_value ?? '—'}
                      </div>
                      {item.comment && <div style={{ fontSize: 12, color: '#667085', marginTop: 8 }}>{item.comment}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
