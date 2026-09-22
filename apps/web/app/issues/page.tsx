'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Открыта' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'monitoring', label: 'Наблюдение' },
  { value: 'resolved', label: 'Решена' },
  { value: 'closed', label: 'Закрыта' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'critical', label: 'Критический' },
];

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Низкая' },
  { value: 'medium', label: 'Средняя' },
  { value: 'high', label: 'Высокая' },
  { value: 'critical', label: 'Критическая' },
];

const EMPTY_ISSUE = {
  title: '',
  description: '',
  category: '',
  priority: 'medium',
  severity: 'medium',
  status: 'open',
  action_required: '',
  schedule_impact_days: '',
  cost_impact: '',
  due_date: '',
};

const ISSUE_CHANGE_FIELD_OPTIONS = [
  { value: 'status', label: 'Статус' },
  { value: 'priority', label: 'Приоритет' },
  { value: 'severity', label: 'Серьёзность' },
];

const EMPTY_ISSUE_CHANGE = {
  field_name: 'status',
  new_value: 'open',
  comment: '',
};

export default function IssuesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [changes, setChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [issueDraft, setIssueDraft] = useState<any>({ ...EMPTY_ISSUE });
  const [changeDraft, setChangeDraft] = useState<any>({ ...EMPTY_ISSUE_CHANGE });

  const loadIssues = async () => {
    try {
      const data = await api.getIssues(1);
      setRows(data);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить проблемы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadIssues();
  }, [router]);

  const openIssueModal = (issue?: any) => {
    if (issue) {
      setSelectedIssue(issue);
      setIssueDraft({
        title: issue.title ?? '',
        description: issue.description ?? '',
        category: issue.category ?? '',
        priority: issue.priority ?? 'medium',
        severity: issue.severity ?? 'medium',
        status: issue.status ?? 'open',
        action_required: issue.action_required ?? '',
        schedule_impact_days: issue.schedule_impact_days ?? '',
        cost_impact: issue.cost_impact ?? '',
        due_date: issue.due_date ?? '',
      });
    } else {
      setSelectedIssue(null);
      setIssueDraft({ ...EMPTY_ISSUE });
    }
    setIssueModalOpen(true);
  };

  const openIssueChangeModal = async (issue: any) => {
    setSelectedIssue(issue);
    setChangeDraft({
      ...EMPTY_ISSUE_CHANGE,
      new_value: issue.status ?? 'open',
    });
    try {
      const list = await api.getIssueChanges(1, issue.id);
      setChanges(list);
    } catch (err) {
      setChanges([]);
    }
    setChangeModalOpen(true);
  };

  const saveIssue = async () => {
    if (!issueDraft.title?.trim()) {
      setError('Название проблемы обязательно');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        title: issueDraft.title,
        description: issueDraft.description || null,
        category: issueDraft.category || null,
        priority: issueDraft.priority,
        severity: issueDraft.severity,
        status: issueDraft.status,
        action_required: issueDraft.action_required || null,
        schedule_impact_days: issueDraft.schedule_impact_days ? Number(issueDraft.schedule_impact_days) : null,
        cost_impact: issueDraft.cost_impact ? Number(issueDraft.cost_impact) : null,
        due_date: issueDraft.due_date || null,
      };

      if (selectedIssue) {
        const updated = await api.updateIssue(1, selectedIssue.id, payload);
        setRows((current) => current.map((item) => item.id === selectedIssue.id ? updated : item));
      } else {
        const created = await api.createIssue(1, payload);
        setRows((current) => [created, ...current]);
      }

      setIssueModalOpen(false);
      setSelectedIssue(null);
      setIssueDraft({ ...EMPTY_ISSUE });
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить проблему');
    } finally {
      setSaving(false);
    }
  };

  const saveIssueChange = async () => {
    if (!selectedIssue || !changeDraft.field_name?.trim()) {
      setError('Поле изменения обязательно');
      return;
    }

    const currentValue = selectedIssue[changeDraft.field_name];
    if (String(currentValue ?? '') === String(changeDraft.new_value ?? '')) {
      setChangeModalOpen(false);
      setSelectedIssue(null);
      router.push('/issues');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const created = await api.createIssueChange(1, selectedIssue.id, {
        field_name: changeDraft.field_name,
        old_value: currentValue ?? null,
        new_value: changeDraft.new_value ?? null,
        comment: changeDraft.comment || null,
      });
      setChanges((current) => [created, ...current]);
      const updated = await api.updateIssue(1, selectedIssue.id, {
        [changeDraft.field_name]: changeDraft.new_value || null,
      });
      setRows((current) => current.map((issue) => issue.id === selectedIssue.id ? updated : issue));
      setChangeModalOpen(false);
      setSelectedIssue(null);
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить изменение проблемы');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main style={{ padding: 32 }}>Загрузка проблем...</main>;
  if (error) return <main style={{ padding: 32, color: '#b42318' }}>Ошибка: {error}</main>;

  return (
    <main style={{ padding: 32, background: '#f3f5f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 12 }}>Проблемы</h1>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          {['/dashboard','/projects','/risks','/issues','/decisions','/changes','/milestones','/weekly-reports','/audit-trail'].map((href) => (
            <Link key={href} href={href} style={{ textDecoration: 'none', color: '#111827', background: '#fff', border: '1px solid #d0d5dd', borderRadius: 999, padding: '8px 14px', fontSize: 12, fontWeight: 700 }}>
              {href.replace('/', '').replace('-', ' ') || 'home'}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: '#475467' }}>Всего проблем: <strong>{rows.length}</strong></div>
          <button
            type="button"
            onClick={() => openIssueModal()}
            style={{ border: 'none', background: '#111827', color: '#fff', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}
          >
            + Добавить проблему
          </button>
        </div>

        <table style={{ width: '100%', background: '#fff', borderRadius: 16, borderCollapse: 'collapse', overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,24,40,0.04)' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#667085', textTransform: 'uppercase', fontSize: 12 }}>
              <th style={{ padding: 16, textAlign: 'left' }}>Код</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Название</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Приоритет</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Статус</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((issue) => (
              <tr key={issue.id} style={{ borderTop: '1px solid #eef2f6' }}>
                <td style={{ padding: 16, fontWeight: 700 }}>{issue.code}</td>
                <td style={{ padding: 16 }}>{issue.title}</td>
                <td style={{ padding: 16 }}>{issue.priority}</td>
                <td style={{ padding: 16 }}>{issue.status}</td>
                <td style={{ padding: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => openIssueModal(issue)} style={{ border: '1px solid #d0d5dd', borderRadius: 10, background: '#fff', padding: '8px 10px', cursor: 'pointer', fontWeight: 700 }}>
                    Изменить
                  </button>
                  <button type="button" onClick={() => openIssueChangeModal(issue)} style={{ border: '1px solid #d0d5dd', borderRadius: 10, background: '#fff', padding: '8px 10px', cursor: 'pointer', fontWeight: 700 }}>
                    Изменения
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {issueModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.52)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setIssueModalOpen(false)}>
          <div style={{ width: '100%', maxWidth: 640, background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 24px 64px rgba(15, 23, 42, 0.24)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 28 }}>{selectedIssue ? 'Изменить проблему' : 'Добавить проблему'}</h3>
              <button type="button" onClick={() => setIssueModalOpen(false)} style={{ border: 'none', background: '#f2f4f7', width: 36, height: 36, borderRadius: 10, fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Название</label>
                <input value={issueDraft.title} onChange={(event) => setIssueDraft({ ...issueDraft, title: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Описание</label>
                <textarea value={issueDraft.description} onChange={(event) => setIssueDraft({ ...issueDraft, description: event.target.value })} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12, resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Категория</label>
                  <input value={issueDraft.category} onChange={(event) => setIssueDraft({ ...issueDraft, category: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Статус</label>
                  <select value={issueDraft.status} onChange={(event) => setIssueDraft({ ...issueDraft, status: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }}>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Приоритет</label>
                  <select value={issueDraft.priority} onChange={(event) => setIssueDraft({ ...issueDraft, priority: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }}>
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Серьёзность</label>
                  <select value={issueDraft.severity} onChange={(event) => setIssueDraft({ ...issueDraft, severity: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }}>
                    {SEVERITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Дни по графику</label>
                  <input type="number" value={issueDraft.schedule_impact_days} onChange={(event) => setIssueDraft({ ...issueDraft, schedule_impact_days: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Стоимость</label>
                  <input type="number" value={issueDraft.cost_impact} onChange={(event) => setIssueDraft({ ...issueDraft, cost_impact: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Действие</label>
                <textarea value={issueDraft.action_required} onChange={(event) => setIssueDraft({ ...issueDraft, action_required: event.target.value })} rows={2} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12, resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Срок</label>
                <input type="date" value={issueDraft.due_date} onChange={(event) => setIssueDraft({ ...issueDraft, due_date: event.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" onClick={() => setIssueModalOpen(false)} style={{ border: '1px solid #d0d5dd', background: '#fff', borderRadius: 12, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>Отмена</button>
              <button type="button" onClick={saveIssue} disabled={saving} style={{ border: 'none', background: 'linear-gradient(135deg, #111827, #374151)', color: '#fff', borderRadius: 12, padding: '10px 18px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {changeModalOpen && selectedIssue && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.52)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setChangeModalOpen(false)}>
          <div style={{ width: '100%', maxWidth: 640, background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 24px 64px rgba(15, 23, 42, 0.24)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: '#667085', fontWeight: 700 }}>Изменения</div>
                <h3 style={{ margin: '6px 0 0', fontSize: 28 }}>{selectedIssue.title}</h3>
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
                      const nextValue =
                        nextField === 'status'
                          ? 'open'
                          : nextField === 'priority'
                            ? 'medium'
                            : nextField === 'severity'
                              ? 'medium'
                              : 'medium';
                      setChangeDraft({
                        ...changeDraft,
                        field_name: nextField,
                        new_value: nextValue,
                      });
                    }}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5dd', borderRadius: 12 }}
                  >
                    {ISSUE_CHANGE_FIELD_OPTIONS.map((option) => (
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
                        : changeDraft.field_name === 'priority'
                          ? PRIORITY_OPTIONS
                          : SEVERITY_OPTIONS;

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
              <button type="button" onClick={saveIssueChange} disabled={saving} style={{ border: 'none', background: '#111827', color: '#fff', borderRadius: 12, padding: '10px 18px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
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
