'use client';
import { useState, useEffect, useCallback } from 'react';
import { staffLogin, getDirectorView } from '../../lib/api';

export default function DirectorDashboard() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [tenantId, setTenantId] = useState('');

  const fetchView = useCallback(async (tk, tid) => {
    try {
      const res = await getDirectorView(tid, tk);
      setData(res.data);
    } catch {
      setError('Failed to load director view');
    }
  }, []);

  useEffect(() => {
    if (!token || !tenantId) return;
    const interval = setInterval(() => {
      fetchView(token, tenantId);
    }, 15000);
    return () => clearInterval(interval);
  }, [token, tenantId, fetchView]);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await staffLogin(loginForm.email, loginForm.password);
      setToken(res.data.token);
      setUser(res.data.user);
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async () => {
    if (!tenantId) { setError('Enter tenant ID'); return; }
    setLoading(true);
    setError('');
    try {
      await fetchView(token, tenantId);
    } catch {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px', minHeight: '100vh', background: '#0f172a' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ color: '#38bdf8', fontSize: '24px', fontWeight: '800', margin: 0 }}>QMS</h1>
        <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>Director Dashboard</p>
      </div>
      {error && <div style={{ background: '#450a0a', color: '#fca5a5', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}
      {['email', 'password'].map(field => (
        <div key={field} style={{ marginBottom: '16px' }}>
          <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>{field}</label>
          <input
            type={field === 'password' ? 'password' : 'email'}
            value={loginForm[field]}
            onChange={e => setLoginForm({ ...loginForm, [field]: e.target.value })}
            style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '14px 16px', color: '#f8fafc', fontSize: '16px', marginTop: '6px', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
      ))}
      <button onClick={handleLogin} disabled={loading} style={{ width: '100%', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  );

  if (!data) return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px', minHeight: '100vh', background: '#0f172a' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ color: '#38bdf8', fontSize: '24px', fontWeight: '800', margin: 0 }}>QMS</h1>
        <p style={{ color: '#64748b', fontSize: '13px' }}>Welcome, {user?.full_name}</p>
      </div>
      {error && <div style={{ background: '#450a0a', color: '#fca5a5', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}
      <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Hospital ID</label>
      <input
        value={tenantId}
        onChange={e => setTenantId(e.target.value)}
        placeholder="Paste hospital UUID"
        style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '14px 16px', color: '#f8fafc', fontSize: '14px', marginTop: '6px', marginBottom: '16px', boxSizing: 'border-box', outline: 'none' }}
      />
      <button onClick={handleLoad} disabled={loading} style={{ width: '100%', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
        {loading ? 'Loading...' : 'Load Bird Eye View'}
      </button>
    </div>
  );

  const totalBooked = data.departments.reduce((a, d) => a + (parseInt(d.s_total_booked) || 0), 0);
  const totalServed = data.departments.reduce((a, d) => a + (parseInt(d.s_total_served) || 0), 0);
  const totalPending = data.departments.reduce((a, d) => a + (parseInt(d.pending_count) || 0), 0);
  const totalArrived = data.departments.reduce((a, d) => a + (parseInt(d.arrived_count) || 0), 0);

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px', minHeight: '100vh', background: '#0f172a' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#38bdf8', fontSize: '18px', fontWeight: '800', margin: 0 }}>Bird Eye View</h1>
          <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0' }}>
            {user?.full_name} · {data.date}
          </p>
        </div>
        <button onClick={() => fetchView(token, tenantId)} style={{ background: '#1e293b', border: 'none', color: '#38bdf8', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      {/* Hospital Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '20px' }}>
        {[
          { label: 'Booked', value: totalBooked, color: '#38bdf8' },
          { label: 'Served', value: totalServed, color: '#22c55e' },
          { label: 'Arrived', value: totalArrived, color: '#a78bfa' },
          { label: 'Pending', value: totalPending, color: '#fbbf24' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#1e293b', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
            <div style={{ color: stat.color, fontSize: '20px', fontWeight: '800' }}>{stat.value}</div>
            <div style={{ color: '#64748b', fontSize: '10px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Department Cards */}
      <h3 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '12px' }}>
        Departments — Live
      </h3>

      {data.departments.map(dept => {
        const arrived = parseInt(dept.arrived_count) || 0;
        const pending = parseInt(dept.pending_count) || 0;
        const called = parseInt(dept.called_count) || 0;
        const served = parseInt(dept.s_total_served) || 0;
        const forfeited = parseInt(dept.s_total_forfeited) || 0;
        const booked = parseInt(dept.s_total_booked) || 0;
        const isActive = arrived > 0 || called > 0 || pending > 0;

        return (
          <div key={dept.department_id} style={{
            background: '#1e293b',
            border: `1px solid ${isActive ? '#38bdf8' : '#334155'}`,
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '12px'
          }}>
            {/* Dept name + status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: '#f8fafc', fontWeight: '700', fontSize: '15px' }}>
                {dept.department_name}
              </div>
              <div style={{
                background: isActive ? '#0c4a6e' : '#1e293b',
                color: isActive ? '#38bdf8' : '#475569',
                fontSize: '11px',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '20px',
                border: `1px solid ${isActive ? '#38bdf8' : '#334155'}`
              }}>
                {isActive ? 'ACTIVE' : 'QUIET'}
              </div>
            </div>

            {/* Live stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
              {[
                { label: 'Arrived', value: arrived, color: '#22c55e' },
                { label: 'Pending', value: pending, color: '#fbbf24' },
                { label: 'In Room', value: called, color: '#38bdf8' },
              ].map(s => (
                <div key={s.label} style={{ background: '#0f172a', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ color: s.color, fontSize: '18px', fontWeight: '800' }}>{s.value}</div>
                  <div style={{ color: '#64748b', fontSize: '10px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Day totals */}
            <div style={{ borderTop: '1px solid #334155', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
              {[
                { label: 'Booked', value: booked },
                { label: 'Served', value: served },
                { label: 'Forfeited', value: forfeited },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '700' }}>{s.value}</div>
                  <div style={{ color: '#475569', fontSize: '10px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {data.departments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏥</div>
          <div>No departments found</div>
        </div>
      )}
    </div>
  );
}