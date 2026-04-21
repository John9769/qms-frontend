'use client';
import { useState, useEffect } from 'react';
import { getTenants, getDepartmentsByTenant } from '../lib/api';

export default function HospitalSelect({ patient, onNext, onBack }) {
  const [tenants, setTenants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getTenants()
      .then(res => { setTenants(res.data.tenants); setLoading(false); })
      .catch(() => { setError('Failed to load hospitals'); setLoading(false); });
  }, []);

  const selectTenant = async (tenant) => {
    setSelectedTenant(tenant);
    setSelectedDept(null);
    try {
      const res = await getDepartmentsByTenant(tenant.id);
      setDepartments(res.data.departments);
    } catch {
      setError('Failed to load departments');
    }
  };

  return (
    <div>
      <button onClick={onBack} style={{
        background: 'none', border: 'none',
        color: '#64748b', fontSize: '14px',
        cursor: 'pointer', marginBottom: '16px', padding: 0
      }}>← Back</button>

      <h2 style={{ color: '#f8fafc', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
        Select Hospital
      </h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
        Hello {patient?.full_name?.split(' ')[0]}. Where are you going?
      </p>

      {error && (
        <div style={{
          background: '#450a0a', color: '#fca5a5',
          padding: '12px 16px', borderRadius: '10px',
          fontSize: '13px', marginBottom: '16px'
        }}>{error}</div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
          Loading hospitals...
        </div>
      ) : (
        <>
          {/* Hospital List */}
          <div style={{ marginBottom: '24px' }}>
            {tenants.map(tenant => (
              <div
                key={tenant.id}
                onClick={() => selectTenant(tenant)}
                style={{
                  background: selectedTenant?.id === tenant.id ? '#0c4a6e' : '#1e293b',
                  border: `1px solid ${selectedTenant?.id === tenant.id ? '#38bdf8' : '#334155'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '10px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '15px' }}>
                  {tenant.name}
                </div>
                <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                  {tenant.type} · {tenant.city}, {tenant.state}
                </div>
                <div style={{ color: '#38bdf8', fontSize: '12px', marginTop: '4px' }}>
                  S Series: RM{tenant.s_series_fee}
                </div>
              </div>
            ))}
          </div>

          {/* Department List */}
          {selectedTenant && departments.length > 0 && (
            <>
              <h3 style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600',
                textTransform: 'uppercase', marginBottom: '12px' }}>
                Select Department
              </h3>
              {departments.map(dept => (
                <div
                  key={dept.id}
                  onClick={() => setSelectedDept(dept)}
                  style={{
                    background: selectedDept?.id === dept.id ? '#052e16' : '#1e293b',
                    border: `1px solid ${selectedDept?.id === dept.id ? '#22c55e' : '#334155'}`,
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '10px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '15px' }}>
                    {dept.name}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                    Quota: {dept.s_quota_per_day} slots/day · ~{dept.avg_minutes_per_patient} mins/patient
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Continue Button */}
          {selectedTenant && selectedDept && (
            <button
              onClick={() => onNext({ ...selectedDept, tenant: selectedTenant })}
              style={{
                width: '100%',
                background: '#22c55e',
                color: '#052e16',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                marginTop: '16px'
              }}
            >
              Book {selectedDept.name} →
            </button>
          )}
        </>
      )}
    </div>
  );
}