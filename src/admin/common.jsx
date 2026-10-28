// Thành phần nhỏ dùng chung cho các màn admin.

export function Loading({ children = 'Đang tải…' }) {
  return <div className="adm-note">{children}</div>;
}

export function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="adm-error" role="alert">
      {error}
      {onRetry && (
        <button type="button" className="adm-btn adm-btn-sm" onClick={onRetry} style={{ marginLeft: 10 }}>
          Thử lại
        </button>
      )}
    </div>
  );
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`adm-badge adm-badge-${tone}`}>{children}</span>;
}

export function Field({ label, children, hint }) {
  return (
    <label className="adm-field">
      <span className="adm-field-label">{label}</span>
      {children}
      {hint && <span className="adm-hint">{hint}</span>}
    </label>
  );
}
