import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/login', { phone });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/api/auth/verify-otp', { phone, otp });
      login(data.accessToken);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Sanjeevani Health OS</h1>
        <p style={styles.subtitle}>Doctor / CHO / Admin Dashboard</p>

        {step === 'phone' ? (
          <>
            <input
              style={styles.input}
              placeholder="Phone number (+91...)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button style={styles.button} onClick={sendOtp} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <input
              style={styles.input}
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
            <button style={styles.button} onClick={verifyOtp} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </>
        )}
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif' },
  card: { background: 'white', padding: 40, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: 360 },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 4, color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  input: { width: '100%', padding: 12, fontSize: 15, border: '1px solid #cbd5e1', borderRadius: 8, marginBottom: 16, boxSizing: 'border-box' },
  button: { width: '100%', padding: 12, fontSize: 15, fontWeight: 600, color: 'white', background: '#0d9488', border: 'none', borderRadius: 8, cursor: 'pointer' },
  error: { color: '#dc2626', fontSize: 13, marginTop: 12 },
};