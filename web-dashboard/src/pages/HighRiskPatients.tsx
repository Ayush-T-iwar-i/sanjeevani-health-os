import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useSocketEvent } from '../hooks/useSocket';

interface HighRiskPatient {
  patient_id: string;
  name: string;
  phone: string;
  missed_followups: number;
}

export default function HighRiskPatients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<HighRiskPatient[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user?.facilityId) return;
    const { data } = await api.get(`/api/followups/high-risk`, { params: { facility_id: user.facilityId } });
    setPatients(data.patients ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.facilityId]);

  useSocketEvent('high_risk_patient_alert', () => {
    load();
  });

  if (loading) return <p>Loading high-risk patients…</p>;

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>High-Risk Patients</h1>
      <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>
        Patients flagged after 2+ missed follow-ups, or an escalated triage event.
      </p>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Phone</th>
            <th style={styles.th}>Missed Follow-ups</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.patient_id}>
              <td style={styles.td}>{p.name}</td>
              <td style={styles.td}>{p.phone}</td>
              <td style={{ ...styles.td, color: '#dc2626', fontWeight: 700 }}>{p.missed_followups}</td>
              <td style={styles.td}>
                <button style={styles.actionBtn} onClick={() => navigate(`/patients/${p.patient_id}`)}>
                  View History
                </button>
              </td>
            </tr>
          ))}
          {patients.length === 0 && (
            <tr><td colSpan={4} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8' }}>No high-risk patients right now</td></tr>
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