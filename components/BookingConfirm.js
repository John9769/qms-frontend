'use client';
import { useState, useEffect } from 'react';
import { createBooking } from '../lib/api';

function getMYDateOptions() {
  const options = [];
  const labels = ['Today', 'Tomorrow', 'Day After Tomorrow'];
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
    const displayStr = d.toLocaleDateString('en-MY', {
      weekday: 'short', day: 'numeric', month: 'short',
      timeZone: 'Asia/Kuala_Lumpur'
    });
    options.push({ label: labels[i], dateStr, displayStr });
  }
  return options;
}

export default function BookingConfirm({ patient, department, onSuccess, onBack }) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(true);
  const [error, setError] = useState('');
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const dateOptions = getMYDateOptions();

  useEffect(() => {
    setSelectedDate(dateOptions[0].dateStr);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('GPS not supported on this device');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError('Please enable GPS to continue');
        setLocating(false);
      }
    );
  }, []);

  const handleBook = async () => {
    if (!location) { setError('GPS location required'); return; }
    if (!selectedDate) { setError('Please select a date'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await createBooking({
        patient_id: patient.id,
        department_id: department.id,
        origin_lat: location.lat,
        origin_lng: location.lng,
        booking_date: selectedDate,
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
      <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Patient</div>
          <div style={{ color: '#f8fafc', fontWeight: '600', marginTop: '2px' }}>{patient?.full_name}</div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Hospital</div>
          <div style={{ color: '#f8fafc', fontWeight: '600', marginTop: '2px' }}>{department?.tenant?.name}</div>
        </div>
        <div style={{ marginBottom: '10px' }}>
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

      {/* Date Selector */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '10px' }}>
          Select Date
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {dateOptions.map(opt => (
            <div
              key={opt.dateStr}
              onClick={() => setSelectedDate(opt.dateStr)}
              style={{
                background: selectedDate === opt.dateStr ? '#0c4a6e' : '#1e293b',
                border: `1px solid ${selectedDate === opt.dateStr ? '#38bdf8' : '#334155'}`,
                borderRadius: '12px',
                padding: '12px 8px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ color: selectedDate === opt.dateStr ? '#38bdf8' : '#94a3b8', fontSize: '12px', fontWeight: '700' }}>
                {opt.label}
              </div>
              <div style={{ color: '#64748b', fontSize: '10px', marginTop: '4px' }}>
                {opt.displayStr}
              </div>
            </div>
          ))}
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

      <p style={{ color: '#475569', fontSize: '11px', textAlign: 'center', marginTop: '12px' }}>
        Late by 15 mins = ticket forfeited automatically
      </p>
    </div>
  );
}