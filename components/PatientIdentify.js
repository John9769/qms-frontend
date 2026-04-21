'use client';
import { useState } from 'react';
import { identifyPatient } from '../lib/api';

export default function PatientIdentify({ onNext }) {
  const [form, setForm] = useState({ full_name: '', ic_last4: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.full_name || !form.ic_last4 || !form.phone) {
      setError('All fields required');
      return;
    }
    if (form.ic_last4.length !== 4 || !/^\d+$/.test(form.ic_last4)) {
      setError('IC last 4 must be exactly 4 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await identifyPatient(form);
      onNext(res.data.patient);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ color: '#f8fafc', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
        Welcome to QMS
      </h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
        Enter your details to continue
      </p>

      {error && (
        <div style={{
          background: '#450a0a', color: '#fca5a5',
          padding: '12px 16px', borderRadius: '10px',
          fontSize: '13px', marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {['full_name', 'ic_last4', 'phone'].map((field) => (
        <div key={field} style={{ marginBottom: '16px' }}>
          <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
            {field === 'full_name' ? 'Full Name' : field === 'ic_last4' ? 'IC Last 4 Digits' : 'Phone Number'}
          </label>
          <input
            type={field === 'ic_last4' || field === 'phone' ? 'tel' : 'text'}
            placeholder={field === 'full_name' ? 'Ahmad bin Abdullah' : field === 'ic_last4' ? '1234' : '0123456789'}
            maxLength={field === 'ic_last4' ? 4 : undefined}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            style={{
              width: '100%',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '14px 16px',
              color: '#f8fafc',
              fontSize: '16px',
              marginTop: '6px',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%',
          background: loading ? '#1e293b' : '#38bdf8',
          color: loading ? '#64748b' : '#0f172a',
          border: 'none',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '16px',
          fontWeight: '700',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: '8px'
        }}
      >
        {loading ? 'Checking...' : 'Continue →'}
      </button>
    </div>
  );
}