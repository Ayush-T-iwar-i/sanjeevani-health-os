import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useSocketEvent } from '../hooks/useSocket';
import StatusBadge from '../components/StatusBadge';

interface QueueItem {
  appointment_id: string;
  patient_id: string;
  queue_position: number;
  estimated_wait_time_minutes: number;
  triage_priority: 'RED' | 'AMBER' | 'GREEN';
  status: string;
}

export default function DoctorQueue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user?.facilityId) return;
      try {
        const { data } = await api.get(`/api/appointments/facility/${user.facilityId}/queue`);
        setItems(data.queue ?? []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.facilityId]);

  useSocketEvent('appointment_updated', (payload: any) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.appointment_id === payload.appointmentId || i.appointment_id === payload.appointment_id);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], ...payload };
      return updated.sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0));
    });
  });

  const startConsult = async (appointmentId: string) => {
    await api.patch(`/api/appointments/${appointmentId}/status`, { status: 'in_progress' });
    navigate(`/consultation/${appointmentId}`);
  };

  if (loading) return <p>Loading queue…</p>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Today's Queue</h1>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Priority</th>
            <th style={styles.th}>Est. Wait</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.appointment_id}>
              <td style={styles.td}>{item.queue_position}</td>
              <td style={styles.td}><StatusBadge status={item.triage_priority} /></td>
              <td style={styles.td}>{item.estimated_wait_time_minutes} min</td>
              <td style={styles.td}><StatusBadge status={item.status} /></td>
              <td style={styles.td}>
                <button style={styles.actionBtn} onClick={() => startConsult(item.appointment_id)}>
                  Start Consultation
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8' }}>No patients in queue</td></tr>
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
  actionBtn: { background: '#0d9488', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
};