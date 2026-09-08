const COLORS: Record<string, string> = {
  RED: '#dc2626', AMBER: '#d97706', GREEN: '#16a34a',
  INITIATED: '#2563eb', ACCEPTED: '#d97706', COMPLETED: '#16a34a', EXPIRED: '#6b7280', NO_SHOW: '#dc2626',
  active: '#dc2626', resolved: '#16a34a', pending: '#2563eb', missed: '#dc2626',
};

export default function StatusBadge({ status }: { status: string }) {
  const color = COLORS[status] ?? '#64748b';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 700,
        color: 'white',
        background: color,
      }}
    >
      {status}
    </span>
  );
}