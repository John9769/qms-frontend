'use client';
import { useState, useEffect, useCallback } from 'react';
import { staffLogin, markEMRReady, verifyPatient } from '../../lib/api';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function CounterDashboard() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [tenantId, setTenantId] = useState('');

  const fetchTickets = useCallback(async (tk, tid) => {
    try {
      const res = await axios.get(`${API_BASE}/queue/counter/${tid}`, {
        headers: { Authorization: `Bearer ${tk}` }
      });
      setTickets(res.data.tickets);
    } catch {
      setError('Failed to load patients');
    }
  }, []);

  useEffect(() => {
    if (!token || !tenantId) return;
    const interval = setInterval(() => {
      fetchTickets(token, tenantId);
    }, 15000);
    return () => clearInterval(interval);
  }, [token, tenantId, fetchTickets]);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, loginForm);
      setToken(res.data.token);
      setUser(res.data.user);
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async () => {
    if (!tenantId) { setError('Enter hospital ID'); return; }
    setLoading(true);
    setError('');
    try {
      await fetchTickets(token, tenantId);
    } catch {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEMR = async (ticketId, patientId) => {
    try {
      await verifyPatient(patientId, tenantId, token);
      await markEMRReady(ticketId, token);
      await fetchTickets(token, tenantId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify patient');
    }
  };

  const handleEMRReady = async (ticketId) => {
    try {
      await markEMRReady(ticketId, token);
      await fetchTickets(token, tenantId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark EMR ready');
    }
  };

  const cardStyle = (color) => ({
    background: '#1e3a5f',
    border: `1px solid ${color}`,
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '10px'
  });

  if (!token) return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px', minHeight: '100vh', background: '#0f172a' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ color: '#38bdf8', fontSize: '24px', fontWeight: '800', margin: 0 }}>QMS</h1>
        <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>Counter Dashboard</p>
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

  if (!tickets.length && !tenantId) return (
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
        {loading ? 'Loading...' : 'Load Counter View'}
      </button>
    </div>
  );

  const newPatients = tickets.filter(t => t.is_first_visit && t.verification_status === 'PENDING' && t.status === 'ARRIVED');
  const existingPatients = tickets.filter(t => !t.is_first_visit && t.verification_status !== 'EMR_READY' && t.status === 'ARRIVED');
  const emrReady = tickets.filter(t => t.verification_status === 'EMR_READY' && t.status === 'ARRIVED');
  const pending = tickets.filter(t => t.status === 'PENDING');

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px', minHeight: '100vh', background: '#0f172a' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ color: '#38bdf8', fontSize: '18px', fontWeight: '800', margin: 0 }}>Counter</h1>
          <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0' }}>
            {user?.full_name} · {new Date().toLocaleDateString('en-MY')}
          </p>
        </div>
        <button onClick={() => fetchTickets(token, tenantId)} style={{ background: '#1e293b', border: 'none', color: '#38bdf8', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      {error && <div style={{ background: '#450a0a', color: '#fca5a5', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '20px' }}>
        {[
          { label: 'New', value: newPatients.length, color: '#ef4444' },
          { label: 'Existing', value: existingPatients.length, color: '#fbbf24' },
          { label: 'EMR Ready', value: emrReady.length, color: '#22c55e' },
          { label: 'Pending', value: pending.length, color: '#64748b' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#1e293b', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
            <div style={{ color: stat.color, fontSize: '20px', fontWeight: '800' }}>{stat.value}</div>
            <div style={{ color: '#64748b', fontSize: '10px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* NEW PATIENTS — Priority */}
      {newPatients.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ borderLeft: '3px solid #ef4444', paddingLeft: '12px', marginBottom: '10px' }}>
            <h3 style={{ color: '#ef4444', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>
              🔴 New Patients — Create EMR Now
            </h3>
          </div>
          {newPatients.map(ticket => (
            <div key={ticket.id} style={cardStyle('#ef4444')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#ef4444', fontSize: '18px', fontWeight: '800' }}>{ticket.ticket_code}</div>
                  <div style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '600' }}>{ticket.patient_name}</div>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>{ticket.department_name}</div>
                  <div style={{ color: '#fbbf24', fontSize: '11px', marginTop: '2px' }}>⚠️ First visit — No EMR</div>
                </div>
                <button
                  onClick={() => handleVerifyAndEMR(ticket.id, ticket.patient_id)}
                  style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textAlign: 'center' }}
                >
                  Verify +<br />EMR Ready
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EXISTING PATIENTS — Pull EMR */}
      {existingPatients.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ borderLeft: '3px solid #fbbf24', paddingLeft: '12px', marginBottom: '10px' }}>
            <h3 style={{ color: '#fbbf24', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>
              🟡 Existing Patients — Pull EMR
            </h3>
          </div>
          {existingPatients.map(ticket => (
            <div key={ticket.id} style={cardStyle('#fbbf24')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#fbbf24', fontSize: '18px', fontWeight: '800' }}>{ticket.ticket_code}</div>
                  <div style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '600' }}>{ticket.patient_name}</div>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>{ticket.department_name}</div>
                  <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>Pull EMR → pass to clinic</div>
                </div>
                <button
                  onClick={() => handleEMRReady(ticket.id)}
                  style={{ background: '#fbbf24', color: '#0f172a', border: 'none', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  EMR<br />Ready ✓
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EMR READY — Done */}
      {emrReady.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ borderLeft: '3px solid #22c55e', paddingLeft: '12px', marginBottom: '10px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>
              🟢 EMR Ready — Passed to Clinic
            </h3>
          </div>
          {emrReady.map(ticket => (
            <div key={ticket.id} style={cardStyle('#22c55e')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#22c55e', fontSize: '18px', fontWeight: '800' }}>{ticket.ticket_code}</div>
                  <div style={{ color: '#f8fafc', fontSize: '14px' }}>{ticket.patient_name}</div>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>{ticket.department_name}</div>
                </div>
                <div style={{ color: '#22c55e', fontSize: '11px', fontWeight: '700' }}>✅ DONE</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PENDING — Not yet arrived */}
      {pending.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ borderLeft: '3px solid #475569', paddingLeft: '12px', marginBottom: '10px' }}>
            <h3 style={{ color: '#475569', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>
              ⏳ Booked — Not Yet Arrived
            </h3>
          </div>
          {pending.map(ticket => (
            <div key={ticket.id} style={cardStyle('#334155')}>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '18px', fontWeight: '800' }}>{ticket.ticket_code}</div>
                <div style={{ color: '#f8fafc', fontSize: '14px' }}>{ticket.patient_name}</div>
                <div style={{ color: '#64748b', fontSize: '11px' }}>{ticket.department_name}</div>
                {ticket.eta && (
                  <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                    ETA: {new Date(ticket.eta).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tickets.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏥</div>
          <div>No patients today</div>
        </div>
      )}
    </div>
  );
}