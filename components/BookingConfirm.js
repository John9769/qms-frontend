'use client';
import { useState, useEffect } from 'react';
import { createBooking } from '../lib/api';

export default function BookingConfirm({ patient, department, onSuccess, onBack }) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(true);
  const [error, setError] = useState('');
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('GPS not supported on this device');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setLocating(false);
      },
      () => {
        setError('Please enable GPS to continue');
        setLocating(false);
      }
    );
  }, []);

  const handleBook = async () => {
    if (!location) {
      setError('GPS location required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await createBooking({
        patient_id: patient.id,
        department_id: department.id,
        origin_lat: location.lat,
        origin_lng: location.lng,
        booking_date: today,
        is_first_visit: isFirstVisit
      });
      onSuccess(res.data.ticket);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
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
        Confirm Booking
      </h2>

      {error && (
        <div style={{
          background: '#450a0a', color: '#fca5a5',
          padding: '12px 16px', borderRadius: '10px',
          fontSize: '13px', marginBottom: '16px'
        }}>{error}</div>
      )}

      {/* Summary */}
      <div style={{
        background: '#1e293b', borderRadius: '16px',
        padding: '20px', marginBottom: '20px'
      }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Patient</div>
          <div style={{ color: '#f8fafc', fontWeight: '600', marginTop: '2px' }}>{patient?.full_name}</div>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Hospital</div>
          <div style={{ color: '#f8fafc', fontWeight: '600', marginTop: '2px' }}>{department?.tenant?.name}</div>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Department</div>
          <div style={{ color: '#f8fafc', fontWeight: '600', marginTop: '2px' }}>{department?.name}</div>
        </div>
        <div>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Fee</div>
          <div style={{ color: '#38bdf8', fontWeight: '700', fontSize: '18px', marginTop: '2px' }}>
            RM{department?.tenant?.s_series_fee || '6.00'}
          </div>
        </div>
      </div>

      {/* GPS Status */}
      <div style={{
        background: '#1e293b', borderRadius: '12px',
        padding: '14px 16px', marginBottom: '16px',
        display: 'flex', alignItems: 'center', gap: '10px'
      }}>
        <span style={{ fontSize: '20px' }}>{locating ? '📡' : location ? '✅' : '❌'}</span>
        <div>
          <div style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '600' }}>
            {locating ? 'Getting your location...' : location ? 'GPS location detected' : 'GPS unavailable'}
          </div>
          {location && (
            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </div>
          )}
        </div>
      </div>

      {/* First Visit Toggle */}
      <div
        onClick={() => setIsFirstVisit(!isFirstVisit)}
        style={{
          background: isFirstVisit ? '#0c4a6e' : '#1e293b',
          border: `1px solid ${isFirstVisit ? '#38bdf8' : '#334155'}`,
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <span style={{ fontSize: '20px' }}>{isFirstVisit ? '✅' : '⬜'}</span>
        <div>
          <div style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '600' }}>
            First visit to this hospital
          </div>
          <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
            You will need to register at the counter first
          </div>
        </div>
      </div>

      {/* Book Button */}
      <button
        onClick={handleBook}
        disabled={loading || locating || !location}
        style={{
          width: '100%',
          background: loading || locating || !location ? '#1e293b' : '#38bdf8',
          color: loading || locating || !location ? '#64748b' : '#0f172a',
          border: 'none',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '16px',
          fontWeight: '700',
          cursor: loading || locating || !location ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Booking...' : locating ? 'Getting GPS...' : `Confirm & Pay RM${department?.tenant?.s_series_fee || '6.00'}`}
      </button>

      <p style={{
        color: '#475569', fontSize: '11px',
        textAlign: 'center', marginTop: '12px'
      }}>
        Late by 15 mins = ticket forfeited automatically
      </p>
    </div>
  );
}