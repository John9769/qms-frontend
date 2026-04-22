'use client';
import { useState, useEffect, useRef } from 'react';
import PatientIdentify from '../components/PatientIdentify';
import HospitalSelect from '../components/HospitalSelect';
import BookingConfirm from '../components/BookingConfirm';
import { triggerGeofence } from '../lib/api';

const GEOFENCE_RADIUS = 50; // meters

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Home() {
  const [step, setStep] = useState(1);
  const [patient, setPatient] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [booking, setBooking] = useState(null);
  const [distance, setDistance] = useState(null);
  const [geofenced, setGeofenced] = useState(false);
  const [geofenceError, setGeofenceError] = useState('');
  const watchRef = useRef(null);

  // Start GPS watching after booking confirmed
  useEffect(() => {
    if (step !== 4 || !booking || geofenced) return;

    if (!navigator.geolocation) {
      setGeofenceError('GPS not supported');
      return;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const hospitalLat = parseFloat(booking.hospital_lat || selectedDept?.tenant?.lat);
        const hospitalLng = parseFloat(booking.hospital_lng || selectedDept?.tenant?.lng);

        if (!hospitalLat || !hospitalLng) return;

        const dist = Math.round(getDistanceMeters(latitude, longitude, hospitalLat, hospitalLng));
        setDistance(dist);

        if (dist <= GEOFENCE_RADIUS && !geofenced) {
          try {
            await triggerGeofence({
              ticket_id: booking.id,
              lat: latitude,
              lng: longitude,
              distance_meters: dist
            });
            setGeofenced(true);
            if (watchRef.current) {
              navigator.geolocation.clearWatch(watchRef.current);
            }
          } catch (err) {
            setGeofenceError('Geofence trigger failed');
          }
        }
      },
      (err) => setGeofenceError('GPS error: ' + err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchRef.current) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, [step, booking, geofenced, selectedDept]);

  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#0f172a',
      padding: '24px 16px'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ color: '#38bdf8', fontSize: '24px', fontWeight: '800', margin: 0 }}>QMS</h1>
        <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>
          Queue Management System
        </p>
      </div>

      {/* Steps indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            width: '32px', height: '4px', borderRadius: '2px',
            background: step >= s ? '#38bdf8' : '#1e293b'
          }} />
        ))}
      </div>

      {/* Step 1 — Identify */}
      {step === 1 && (
        <PatientIdentify onNext={(p) => { setPatient(p); setStep(2); }} />
      )}

      {/* Step 2 — Select Hospital + Department */}
      {step === 2 && (
        <HospitalSelect
          patient={patient}
          onNext={(dept) => { setSelectedDept(dept); setStep(3); }}
          onBack={() => setStep(1)}
        />
      )}

      {/* Step 3 — Confirm Booking */}
      {step === 3 && (
        <BookingConfirm
          patient={patient}
          department={selectedDept}
          onSuccess={(b) => { setBooking(b); setGeofenced(false); setDistance(null); setStep(4); }}
          onBack={() => setStep(2)}
        />
      )}

      {/* Step 4 — Booking Success + Live Distance + Geofence */}
      {step === 4 && booking && (
        <div style={{ textAlign: 'center' }}>

          {/* Geofenced — arrived */}
          {geofenced ? (
            <div style={{
              background: '#052e16',
              border: '2px solid #22c55e',
              borderRadius: '20px',
              padding: '32px 24px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <h2 style={{ color: '#22c55e', fontSize: '22px', fontWeight: '800', margin: '0 0 8px' }}>
                You Have Arrived
              </h2>
              <div style={{
                fontSize: '48px',
                fontWeight: '900',
                color: '#22c55e',
                letterSpacing: '4px',
                margin: '16px 0'
              }}>
                {booking.ticket_code}
              </div>

              {/* New vs Existing instruction */}
              {booking.is_first_visit ? (
                <div style={{
                  background: '#0c4a6e',
                  border: '1px solid #38bdf8',
                  borderRadius: '12px',
                  padding: '16px',
                  marginTop: '16px'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🪪</div>
                  <div style={{ color: '#38bdf8', fontWeight: '700', fontSize: '15px' }}>
                    Please proceed to Registration Counter
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                    Cik Ida will verify your EMR before you proceed to the clinic
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#052e16',
                  border: '1px solid #22c55e',
                  borderRadius: '12px',
                  padding: '16px',
                  marginTop: '16px'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏥</div>
                  <div style={{ color: '#22c55e', fontWeight: '700', fontSize: '15px' }}>
                    Proceed directly to clinic
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                    Nurse has been notified. Please wait to be called.
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Not yet arrived — show ticket + live distance */
            <div>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎟️</div>
              <h2 style={{ color: '#38bdf8', fontSize: '20px', margin: '0 0 24px' }}>
                Booking Confirmed
              </h2>

              {/* Ticket info */}
              <div style={{
                background: '#1e293b',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: '900',
                  color: '#38bdf8',
                  letterSpacing: '4px'
                }}>
                  {booking.ticket_code}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px' }}>
                  Your ticket number
                </div>
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: '#0f172a',
                  borderRadius: '12px'
                }}>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>ARRIVE BY</div>
                  <div style={{ color: '#f8fafc', fontSize: '20px', fontWeight: '700', marginTop: '4px' }}>
                    {new Date(booking.eta_deadline).toLocaleTimeString('en-MY', {
                      hour: '2-digit', minute: '2-digit',
                      timeZone: 'Asia/Kuala_Lumpur'
                    })}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '12px', marginTop: '12px' }}>ETA</div>
                  <div style={{ color: '#38bdf8', fontSize: '16px', fontWeight: '600', marginTop: '4px' }}>
                    {new Date(booking.eta).toLocaleTimeString('en-MY', {
                      hour: '2-digit', minute: '2-digit',
                      timeZone: 'Asia/Kuala_Lumpur'
                    })}
                  </div>
                </div>
                <div style={{ color: '#fbbf24', fontSize: '13px', marginTop: '12px' }}>
                  ⚠️ Late by 15 mins = ticket forfeited
                </div>
              </div>

              {/* Live distance */}
              <div style={{
                background: '#1e293b',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '16px'
              }}>
                <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  📡 Distance to Hospital
                </div>
                {geofenceError ? (
                  <div style={{ color: '#ef4444', fontSize: '14px' }}>{geofenceError}</div>
                ) : distance === null ? (
                  <div style={{ color: '#64748b', fontSize: '14px' }}>Detecting your location...</div>
                ) : (
                  <div>
                    <div style={{
                      fontSize: '36px',
                      fontWeight: '900',
                      color: distance <= 200 ? '#22c55e' : distance <= 1000 ? '#fbbf24' : '#38bdf8'
                    }}>
                      {distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                      {distance <= GEOFENCE_RADIUS
                        ? '✅ Triggering check-in...'
                        : `Auto check-in within ${GEOFENCE_RADIUS}m`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setStep(1);
              setPatient(null);
              setBooking(null);
              setGeofenced(false);
              setDistance(null);
            }}
            style={{
              background: '#1e293b',
              color: '#94a3b8',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 32px',
              fontSize: '14px',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            New Booking
          </button>
        </div>
      )}
    </div>
  );
}