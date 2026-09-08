import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useSocketEvent } from '../hooks/useSocket';

interface InventoryItem {
  inventory_id: string;
  item_name: string;
  item_type: string;
  quantity_available: number;
  expiry_date: string | null;
}

export default function InventoryDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alert, setAlert] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user?.facilityId) return;
    const { data } = await api.get(`/api/inventory/facility/${user.facilityId}`);
    setItems(data.items ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.facilityId]);

  useSocketEvent('inventory_low_alert', (payload: any) => {
    setAlert(`Low stock: ${payload.itemName} (${payload.quantityAvailable} left)`);
    load();
  });

  const restock = async (inventoryId: string) => {
    const amount = prompt('How many units to add?');
    if (!amount || isNaN(Number(amount))) return;
    await api.post(`/api/inventory/${inventoryId}/adjust`, { delta: Number(amount) });
    load();
  };

  if (loading) return <p>Loading inventory…</p>;

  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>Facility Inventory</h1>
      {alert && <div style={styles.alertBanner}>{alert}</div>}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Item</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Stock</th>
            <th style={styles.th}>Expiry</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.inventory_id}>
              <td style={styles.td}>{item.item_name}</td>
              <td style={styles.td}>{item.item_type}</td>
              <td style={{ ...styles.td, color: item.quantity_available <= 10 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                {item.quantity_available}
              </td>
              <td style={styles.td}>{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '—'}</td>
              <td style={styles.td}>
                <button style={styles.actionBtn} onClick={() => restock(item.inventory_id)}>Restock</button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8' }}>No inventory items</td></tr>
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
  alertBanner: { background: '#fef2f2', color: '#dc2626', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14, fontWeight: 600 },
};