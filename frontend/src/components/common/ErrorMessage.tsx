interface ErrorMessageProps { message: string }

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div style={{
      padding: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 8, color: '#ef4444', fontSize: 13,
    }}>
      ⚠ {message}
    </div>
  )
}
