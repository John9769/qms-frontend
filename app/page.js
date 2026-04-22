'use client';
import { useState, useEffect, useRef } from 'react';
import PatientIdentify from '../components/PatientIdentify';
import HospitalSelect from '../components/HospitalSelect';
import BookingConfirm from '../components/BookingConfirm';
import { triggerGeofence } from '../lib/api';

const GEOFENCE_RADIUS = 50;
const DEV_MODE = true; // Set to false before production

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

function formatTime(dt) {
  return new Date(dt).toLocaleTimeString('en-MY', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Kuala_Lumpur'
  });
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-MY', {
    weekday: 'long', day: 'numeric',
    month: 'long', year: 'numeric'
  });
}

export default function Home() {
  const [step, setStep] = useState(1);
  const [patient, setPatient] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [booking, setBooking] = useState(null);
  const [distance, setDistance] = useState(null);
  const [geofenced, setGeofenced] = useState(false);
  const [geofenceError, setGeofenceError] = useState('');
  const [simulating, setSimulating] = useState(false);
  const watchRef = useRef(null);
  const bookingRef = useRef(null);
  const geofencedRef = useRef(false);

  useEffect(() => { bookingRef.current = booking; }, [booking]);
  useEffect(() => { geofencedRef.current = geofenced; }, [geofenced]);

  useEffect(() => {
    if (step !== 4) return;

    if (!navigator.geolocation) {
      setGeofenceError('GPS not supported on this device');
      return;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const currentBooking = bookingRef.current;
        if (!currentBooking || geofencedRef.current) return;

        const { latitude, longitude } = pos.coords;
        const hospitalLat = parseFloat(currentBooking.hospital_lat);
        const hospitalLng = parseFloat(currentBooking.hospital_lng);

        if (!hospitalLat || !hospitalLng) return;

        const dist = Math.round(getDistanceMeters(latitude, longitude, hospitalLat, hospitalLng));
        setDistance(dist);

        if (dist <= GEOFENCE_RADIUS) {
          try {
            await triggerGeofence({
              ticket_id: currentBooking.id,
              lat: latitude,
              lng: longitude,
              distance_meters: dist
            });
            geofencedRef.current = true;
            setGeofenced(true);
            navigator.geolocation.clearWatch(watchRef.current);
          } catch {
            setGeofenceError('Auto check-in failed. Please try again.');
          }
        }
      },
      (err) => setGeofenceError('GPS unavailable: ' + err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchRef.current) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, [step]);

  // DEV MODE — simulate geofence trigger
  const simulateArrival = async () => {
    if (!booking || geofencedRef.current) return;
    setSimulating(true);
    try {
      await triggerGeofence({
        ticket_id: booking.id,
        lat: parseFloat(booking.hospital_lat),
        lng: parseFloat(booking.hospital_lng),
        distance_meters: 10
      });
      geofencedRef.current = true;
      setGeofenced(true);
      setDistance(10);
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    } catch (err) {
      setGeofenceError(err.response?.data?.error || 'Simulate failed');
    } finally {
      setSimulating(false);
    }
  };

  const resetAll = () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    setStep(1);
    setPatient(null);
    setBooking(null);
    setSelectedDept(null);
    setGeofenced(false);
    setDistance(null);
    setGeofenceError('');
    geofencedRef.current = false;
    bookingRef.current = null;
  };

  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#0f172a',
      padding: '24px 16px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ color: '#38bdf8', fontSize: '24px', fontWeight: '800', margin: 0 }}>QMS</h1>
        <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>Queue Management System</p>
        {DEV_MODE && (
          <div style={{ background: '#451a03', color: '#fbbf24', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', display: 'inline-block', marginTop: '4px' }}>
            DEV MODE
          </div>
        )}
      </div>

      {step < 4 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              width: '32px', height: '4px', borderRadius: '2px',
              background: step >= s ? '#38bdf8' : '#1e293b'
            }} />
          ))}
        </div>
      )}

      {step === 1 && (
        <PatientIdentify onNext={(p) => { setPatient(p); setStep(2); }} />
      )}

      {step === 2 && (
        <HospitalSelect
          patient={patient}
          onNext={(dept) => { setSelectedDept(dept); setStep(3); }}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <BookingConfirm
          patient={patient}
          department={selectedDept}
          onSuccess={(b) => {
            bookingRef.current = b;
            setBooking(b);
            setGeofenced(false);
            setDistance(null);
            setGeofenceError('');
            geofencedRef.current = false;
            setStep(4);
          }}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && booking && (
        <div>
          {geofenced ? (
            <div style={{
              background: '#052e16',
              border: '2px solid #22c55e',
              borderRadius: '20px',
              padding: '32px 24px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '56px', marginBottom: '12px' }}>✅</div>
              <h2 style={{ color: '#22c55e', fontSize: '22px', fontWeight: '800', margin: '0 0 4px' }}>
                You Have Arrived
              </h2>
              <div style={{ color: '#86efac', fontSize: '13px', marginBottom: '20px' }}>
                {booking.tenant_name} — {booking.department_name}
              </div>
              <div style={{
                fontSize: '52px', fontWeight: '900',
                color: '#22c55e', letterSpacing: '6px', marginBottom: '20px'
              }}>
                {booking.ticket_code}
              </div>
              {booking.is_first_visit ? (
                <div style={{
                  background: '#0c4a6e', border: '1px solid #38bdf8',
                  borderRadius: '14px', padding: '20px'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>🪪</div>
                  <div style={{ color: '#38bdf8', fontWeight: '700', fontSize: '16px' }}>
                    Please go to Registration Counter
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '6px' }}>
                    Counter staff will verify your details and create your medical record before you proceed to the clinic.
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#052e16', border: '1px solid #22c55e',
                  borderRadius: '14px', padding: '20px'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>🏥</div>
                  <div style={{ color: '#22c55e', fontWeight: '700', fontSize: '16px' }}>
                    Proceed directly to {booking.department_name}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '6px' }}>
                    The clinic nurse has been notified. Please wait to be called.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* 1. LIVE DISTANCE */}
              <div style={{
                background: '#1e293b', borderRadius: '16px',
                padding: '20px', marginBottom: '12px', textAlign: 'center'
              }}>
                <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  📡 Distance to {booking.tenant_name}
                </div>
                {geofenceError ? (
                  <div style={{ color: '#ef4444', fontSize: '13px' }}>{geofenceError}</div>
                ) : distance === null ? (
                  <div style={{ color: '#64748b', fontSize: '14px' }}>Detecting your location...</div>
                ) : (
                  <>
                    <div style={{
                      fontSize: '42px', fontWeight: '900',
                      color: distance <= 200 ? '#22c55e' : distance <= 1000 ? '#fbbf24' : '#38bdf8'
                    }}>
                      {distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}
                    </div>
                    <div style={{ color: '#475569', fontSize: '12px', marginTop: '4px' }}>
                      {distance <= GEOFENCE_RADIUS ? '✅ Checking you in...' : `Auto check-in within ${GEOFENCE_RADIUS}m`}
                    </div>
                  </>
                )}

                {/* DEV MODE — Simulate Arrival */}
                {DEV_MODE && (
                  <button
                    onClick={simulateArrival}
                    disabled={simulating}
                    style={{
                      marginTop: '16px',
                      background: '#7c3aed',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    {simulating ? 'Simulating...' : '🧪 DEV — Simulate Arrival'}
                  </button>
                )}
              </div>

              {/* 2. TICKET */}
              <div style={{
                background: '#1e293b', borderRadius: '16px',
                padding: '24px', marginBottom: '12px', textAlign: 'center'
              }}>
                <div style={{ color: '#64748b', fontSize: '12px' }}>{booking.tenant_name}</div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '16px' }}>{booking.department_name}</div>
                <div style={{
                  fontSize: '52px', fontWeight: '900',
                  color: '#38bdf8', letterSpacing: '6px'
                }}>
                  {booking.ticket_code}
                </div>
                <div style={{ color: '#475569', fontSize: '12px', marginTop: '6px' }}>
                  {formatDate(booking.booking_date)}
                </div>
              </div>

              {/* 3. PATIENTS AHEAD */}
              <div style={{
                background: '#1e293b', borderRadius: '16px',
                padding: '16px 20px', marginBottom: '12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ color: '#94a3b8', fontSize: '13px' }}>Patients ahead of you</div>
                <div style={{
                  color: booking.patients_ahead === 0 ? '#22c55e' : '#fbbf24',
                  fontSize: '20px', fontWeight: '800'
                }}>
                  {booking.patients_ahead === 0 ? 'None 🎉' : booking.patients_ahead}
                </div>
              </div>

              {/* 4. APPOINTMENT SCHEDULE */}
              <div style={{
                background: '#0c4a6e', border: '1px solid #38bdf8',
                borderRadius: '16px', padding: '20px', marginBottom: '12px'
              }}>
                <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Your Appointment Schedule
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>Your slot time</div>
                    <div style={{ color: '#38bdf8', fontSize: '24px', fontWeight: '800', marginTop: '2px' }}>
                      {formatTime(booking.appointment_time)}
                    </div>
                  </div>
                  <div style={{ color: '#334155', fontSize: '20px' }}>→</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>Must arrive before</div>
                    <div style={{ color: '#f8fafc', fontSize: '24px', fontWeight: '800', marginTop: '2px' }}>
                      {formatTime(booking.latest_arrival)}
                    </div>
                  </div>
                </div>
                <div style={{
                  marginTop: '16px', padding: '10px',
                  background: '#0f172a', borderRadius: '10px',
                  color: '#64748b', fontSize: '12px'
                }}>
                  Each patient takes approximately {booking.avg_minutes_per_patient} minutes per consultation
                </div>
              </div>

              {/* 5. WARNING */}
              <div style={{
                background: '#451a03', border: '1px solid #fbbf24',
                borderRadius: '12px', padding: '12px 16px',
                textAlign: 'center', marginBottom: '16px'
              }}>
                <div style={{ color: '#fbbf24', fontSize: '13px', fontWeight: '600' }}>
                  ⚠️ Miss your must arrive time = ticket automatically forfeited
                </div>
              </div>
            </div>
          )}

          <button onClick={resetAll} style={{
            width: '100%', background: '#1e293b', color: '#64748b',
            border: 'none', borderRadius: '12px', padding: '14px',
            fontSize: '14px', cursor: 'pointer', marginTop: '8px'
          }}>
            New Booking
          </button>
        </div>
      )}
    </div>
  );
}