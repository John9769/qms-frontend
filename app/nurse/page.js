'use client';
import { useState, useEffect, useCallback } from 'react';
import { staffLogin, getNurseDashboard, getTodaySession, callPatient, servePatient, markEMRReady } from '../../lib/api';

export default function NurseDashboard() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [deptId, setDeptId] = useState('');

  const fetchDashboard = useCallback(async (sessionId, tk) => {
    try {
      const res = await getNurseDashboard(sessionId, tk);
      setDashboard(res.data);
    } catch (err) {
      setError('Failed to refresh dashboard');
    }
  }, []);

  useEffect(() => {
    if (!session || !token) return;
    const interval = setInterval(() => {
      fetchDashboard(session.id, token);
    }, 15000);
    return () => clearInterval(interval);
  }, [session, token, fetchDashboard]);

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

  const handleLoadSession = async () => {
    if (!deptId) { setError('Enter department ID'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await getTodaySession(deptId, token);
      setSession(res.data.session);
      await fetchDashboard(res.data.session.id, token);
    } catch {
      setError('No session today for this department');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async (ticketId) => {
    try {
      await callPatient(ticketId, token);
      await fetchDashboard(session.id, token);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to call patient');
    }
  };

  const handleServe = async (ticketId) => {
    try {
      await servePatient(ticketId, token);
      await fetchDashboard(session.id, token);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to serve patient');
    }
  };

  const handleEMRReady = async (ticketId) => {
    try {
      await markEMRReady(ticketId, token);
      await fetchDashboard(session.id, token);
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

  const renderTicketCard = (ticket, color) => (
    <div key={ticket.id} style={cardStyle(color)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ color, fontSize: '18px', fontWeight: '800' }}>{ticket.ticket_code}</div>
            {ticket.series === 'A' && (
              <div style={{ background: '#7c3aed', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>
                APPOINTMENT
              </div>
            )}
          </div>
          <div style={{ color: '#f8fafc', fontSize: '14px' }}>{ticket.patient_name}</div>
          {ticket.is_first_visit && (
            <div style={{ color: '#fbbf24', fontSize: '11px', marginTop: '2px' }}>
              {ticket.verification_status === 'EMR_READY' ? '✅ EMR Ready' : '⏳ Awaiting EMR'}
            </div>
          )}
          {ticket.status === 'PENDING' && ticket.eta && (
            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
              ETA: {new Date(ticket.eta).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' })}
            </div>
          )}
          {ticket.series === 'A' && ticket.appointment_date && (
            <div style={{ color: '#a78bfa', fontSize: '11px', marginTop: '2px' }}>
              📅 Doctor appointment
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
          {ticket.status === 'CALLED' && (
            <button onClick={() => handleServe(ticket.id)} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              Done ✓
            </button>
          )}
          {ticket.is_first_visit && ticket.verification_status !== 'EMR_READY' && ticket.status === 'ARRIVED' && (
            <button onClick={() => handleEMRReady(ticket.id)} style={{ background: '#fbbf24', color: '#0f172a', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              EMR Ready
            </button>
          )}
          {ticket.status === 'PENDING' && (
            <div style={{ color: '#fbbf24', fontSize: '11px', fontWeight: '600' }}>PENDING</div>
          )}
        </div>
      </div>
    </div>
  );

  if (!token) return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px', minHeight: '100vh', background: '#0f172a' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ color: '#38bdf8', fontSize: '24px', fontWeight: '800', margin: 0 }}>QMS</h1>
        <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>Nurse Dashboard</p>
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

  if (!session) return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px', minHeight: '100vh', background: '#0f172a' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ color: '#38bdf8', fontSize: '24px', fontWeight: '800', margin: 0 }}>QMS</h1>
        <p style={{ color: '#64748b', fontSize: '13px' }}>Welcome, {user?.full_name}</p>
      </div>
      {error && <div style={{ background: '#450a0a', color: '#fca5a5', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}
      <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Department ID</label>
      <input
        value={deptId}
        onChange={e => setDeptId(e.target.value)}
        placeholder="Paste department UUID"
        style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '14px 16px', color: '#f8fafc', fontSize: '14px', marginTop: '6px', marginBottom: '16px', boxSizing: 'border-box', outline: 'none' }}
      />
      <button onClick={handleLoadSession} disabled={loading} style={{ width: '100%', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
        {loading ? 'Loading...' : 'Load My Queue'}
      </button>
    </div>
  );

  // Split S and A series
  const allTickets = [
    ...(dashboard?.arrived || []),
    ...(dashboard?.pending || []),
    ...(dashboard?.called || [])
  ];

  const sArrived = (dashboard?.arrived || []).filter(t => t.series === 'S');
  const sPending = (dashboard?.pending || []).filter(t => t.series === 'S');
  const sCalled = (dashboard?.called || []).filter(t => t.series === 'S');

  const aArrived = (dashboard?.arrived || []).filter(t => t.series === 'A');
  const aPending = (dashboard?.pending || []).filter(t => t.series === 'A');
  const aCalled = (dashboard?.called || []).filter(t => t.series === 'A');

  const hasAny = allTickets.length > 0;

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px', minHeight: '100vh', background: '#0f172a' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ color: '#38bdf8', fontSize: '18px', fontWeight: '800', margin: 0 }}>
            {dashboard?.session?.department_name}
          </h1>
          <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0' }}>
            {user?.full_name} · {new Date().toLocaleDateString('en-MY')}
          </p>
        </div>
        <button onClick={() => fetchDashboard(session.id, token)} style={{ background: '#1e293b', border: 'none', color: '#38bdf8', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      {error && <div style={{ background: '#450a0a', color: '#fca5a5', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
        {[
          { label: 'Arrived', value: dashboard?.stats?.total_arrived || 0, color: '#22c55e' },
          { label: 'Pending', value: dashboard?.stats?.total_pending || 0, color: '#fbbf24' },
          { label: 'Called', value: dashboard?.stats?.total_called || 0, color: '#38bdf8' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#1e293b', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ color: stat.color, fontSize: '24px', fontWeight: '800' }}>{stat.value}</div>
            <div style={{ color: '#64748b', fontSize: '11px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Auto-selected next to call */}
      {dashboard?.next_to_call && (
        <div style={{ background: '#052e16', border: '2px solid #22c55e', borderRadius: '16px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ color: '#86efac', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>
            ⚡ Auto-Selected — Next to Call
          </div>
          <div style={{ color: '#22c55e', fontSize: '36px', fontWeight: '900', letterSpacing: '4px' }}>
            {dashboard.next_to_call.ticket_code}
          </div>
          <div style={{ color: '#f8fafc', fontSize: '16px', fontWeight: '600', marginTop: '4px' }}>
            {dashboard.next_to_call.patient_name}
          </div>
          {dashboard.next_to_call.series === 'A' && (
            <div style={{ color: '#a78bfa', fontSize: '12px', marginTop: '4px' }}>
              📅 Doctor Appointment
            </div>
          )}
          {dashboard.next_to_call.is_first_visit && (
            <div style={{ color: '#fbbf24', fontSize: '12px', marginTop: '4px' }}>
              ⚠️ First Visit — EMR Ready confirmed
            </div>
          )}
          <button
            onClick={() => handleCall(dashboard.next_to_call.id)}
            style={{ marginTop: '16px', background: '#22c55e', color: '#052e16', border: 'none', borderRadius: '12px', padding: '14px 32px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', width: '100%' }}
          >
            CALL NOW
          </button>
        </div>
      )}

      {/* ===== S SERIES SECTION ===== */}
      <div style={{ borderLeft: '3px solid #38bdf8', paddingLeft: '12px', marginBottom: '8px' }}>
        <h3 style={{ color: '#38bdf8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>
          S Series — Walk-in Bookings
        </h3>
      </div>

      {sCalled.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#38bdf8', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>In Consultation</p>
          {sCalled.map(t => renderTicketCard(t, '#38bdf8'))}
        </div>
      )}

      {sArrived.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#22c55e', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>Arrived — Waiting</p>
          {sArrived.map(t => renderTicketCard(t, '#22c55e'))}
        </div>
      )}

      {sPending.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#fbbf24', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>Pending — Not Yet Arrived</p>
          {sPending.map(t => renderTicketCard(t, '#fbbf24'))}
        </div>
      )}

      {sCalled.length === 0 && sArrived.length === 0 && sPending.length === 0 && (
        <div style={{ color: '#475569', fontSize: '13px', padding: '12px 0', marginBottom: '16px' }}>No S series patients today.</div>
      )}

      {/* ===== A SERIES SECTION ===== */}
      <div style={{ borderLeft: '3px solid #a78bfa', paddingLeft: '12px', marginBottom: '8px', marginTop: '8px' }}>
        <h3 style={{ color: '#a78bfa', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>
          A Series — Doctor Appointments
        </h3>
      </div>

      {aCalled.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#38bdf8', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>In Consultation</p>
          {aCalled.map(t => renderTicketCard(t, '#38bdf8'))}
        </div>
      )}

      {aArrived.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#22c55e', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>Arrived — Waiting</p>
          {aArrived.map(t => renderTicketCard(t, '#22c55e'))}
        </div>
      )}

      {aPending.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#a78bfa', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>Appointments — Pending Arrival</p>
          {aPending.map(t => renderTicketCard(t, '#a78bfa'))}
        </div>
      )}

      {aCalled.length === 0 && aArrived.length === 0 && aPending.length === 0 && (
        <div style={{ color: '#475569', fontSize: '13px', padding: '12px 0', marginBottom: '16px' }}>No appointments today.</div>
      )}

      {!hasAny && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏥</div>
          <div>No patients in queue</div>
        </div>
      )}
    </div>
  );
}