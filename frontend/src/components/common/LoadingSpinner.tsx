export default function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'var(--muted)' }}>
      <div style={{
        width: 32, height: 32, border: '3px solid var(--border)',
        borderTop: '3px solid var(--accent)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite', marginRight: 12,
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      Loading…
    </div>
  )
}
