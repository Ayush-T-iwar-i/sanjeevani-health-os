import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

interface Summary {
  triageBreakdown: Record<string, number>;
  referralBreakdown: Record<string, number>;
  avgWaitMinutes: number;
  lowStockItemCount: number;
  sosAlertsLast30Days: number;
  followupBreakdown: Record<string, number>;
}

export default function FacilityAnalytics() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user?.facilityId) return;
      const { data } = await api.get('/api/analytics/summary', { params: { facility_id: user.facilityId } });
      setSummary(data);
      setLoading(false);
    })();
  }, [user?.facilityId]);

  if (loading || !summary) return <p>Loading analytics…</p>;

  const triageData = Object.entries(summary.triageBreakdown).map(([name, value]) => ({ name, value }));
  const referralData = Object.entries(summary.referralBreakdown).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Facility Analytics (Last 30 Days)</h1>

      <div style={styles.statGrid}>
        <StatCard label="Avg Wait Time" value={`${summary.avgWaitMinutes} min`} />
        <StatCard label="Low Stock Items" value={summary.lowStockItemCount} color={summary.lowStockItemCount > 0 ? '#dc2626' : '#16a34a'} />
        <StatCard label="SOS Alerts" value={summary.sosAlertsLast30Days} color={summary.sosAlertsLast30Days > 0 ? '#dc2626' : '#16a34a'} />
      </div>

      <div style={styles.chartRow}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Triage Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={triageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Referral Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={referralData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = '#0f172a' }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={styles.statCard}>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 },
  statCard: { background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  chartRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  chartCard: { background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  chartTitle: { fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#334155' },
};