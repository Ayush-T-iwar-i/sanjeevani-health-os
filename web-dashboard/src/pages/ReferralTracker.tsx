import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useSocketEvent } from '../hooks/useSocket';
import StatusBadge from '../components/StatusBadge';

interface Referral {
  referral_id: string;
  patient_id: string;
  reason: string;
  priority: string;
  status: string;
  due_date: string | null;
  created_at: string;
}

export default function ReferralTracker() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user?.facilityId) return;
      try {
        const { data } = await api.get(`/api/referrals/facility/${user.facilityId}`);
        setReferrals(data.referrals ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.facilityId]);

  useSocketEvent('referral_status_changed', (payload: any) => {
    setReferrals((prev) =>
      prev.map((r) => (r.referral_id === payload.referralId ? { ...r, status: payload.status } : r))
    );
  });

  const accept = async (id: string) => {
    await api.patch(`/api/referrals/${id}/status`, { status: 'ACCEPTED' });
  };
  const complete = async (id: string) => {
    await api.patch(`/api/referrals/${id}/status`, { status: 'COMPLETED' });
  };

  if (loading) return <p>Loading referrals…</p>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Incoming Referrals</h1>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Reason</th>
            <th style={styles.th}>Priority</th>
            <th style={styles.th}>Due By</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((r) => (
            <tr key={r.referral_id}>
              <td style={styles.td}>{r.reason}</td>
              <td style={styles.td}><StatusBadge status={r.priority} /></td>
              <td style={styles.td}>{r.due_date ? new Date(r.due_date).toLocaleString() : '—'}</td>
              <td style={styles.td}><StatusBadge status={r.status} /></td>
              <td style={styles.td}>
                {r.status === 'INITIATED' && (
                  <button style={styles.actionBtn} onClick={() => accept(r.referral_id)}>Accept</button>
                )}
                {r.status === 'ACCEPTED' && (
                  <button style={styles.actionBtn} onClick={() => complete(r.referral_id)}>Mark Completed</button>
                )}
              </td>
            </tr>
          ))}
          {referrals.length === 0 && (
            <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8' }}>No referrals</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  th: { textAlign: 'left', padding: '12px 16px', background: '#f1f5f9', fontSize: 13, color: '#475569', fontWeight: 600 },
  td: { padding: '14px 16px', borderTop: '1px solid #f1f5f9', fontSize: 14 },
  actionBtn: { background: '#0d9488', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
};