import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/', label: 'Queue', icon: '🩺' },
  { to: '/referrals', label: 'Referrals', icon: '↗️' },
  { to: '/inventory', label: 'Inventory', icon: '💊' },
  { to: '/high-risk', label: 'High-Risk Patients', icon: '⚠️' },
  { to: '/analytics', label: 'Analytics', icon: '📊' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>Sanjeevani</div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })}
            >
              <span style={{ marginRight: 10 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={styles.userBox}>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>{user?.role}</div>
          <button onClick={logout} style={styles.logoutBtn}>Log out</button>
        </div>
      </aside>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  sidebar: { width: 220, background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', padding: '20px 0' },
  brand: { fontSize: 20, fontWeight: 700, padding: '0 20px 24px' },
  navLink: { display: 'flex', alignItems: 'center', padding: '12px 20px', color: '#cbd5e1', textDecoration: 'none', fontSize: 14 },
  navLinkActive: { background: '#1e293b', color: 'white', borderLeft: '3px solid #0d9488' },
  userBox: { marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid #1e293b' },
  logoutBtn: { marginTop: 8, background: 'none', border: '1px solid #475569', color: '#cbd5e1', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  main: { flex: 1, padding: 32, background: '#f8fafc' },
};