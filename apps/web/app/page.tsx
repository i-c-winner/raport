export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#eef2f7' }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <h1 style={{ fontSize: 48, marginBottom: 12 }}>Project Control</h1>
        <p style={{ fontSize: 18, color: '#475467', marginBottom: 24 }}>MVP системы управления проектами</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/login" style={{ background: '#1d4ed8', color: '#fff', padding: '12px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>Войти</a>
          <a href="/dashboard" style={{ background: '#fff', color: '#111827', padding: '12px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, border: '1px solid #d0d5dd' }}>Дашборд</a>
          <a href="/projects" style={{ background: '#fff', color: '#111827', padding: '12px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, border: '1px solid #d0d5dd' }}>Проекты</a>
        </div>
      </div>
    </main>
  );
}
