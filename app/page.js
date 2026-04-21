'use client';
import { useState } from 'react';
import PatientIdentify from '../components/PatientIdentify';
import HospitalSelect from '../components/HospitalSelect';
import BookingConfirm from '../components/BookingConfirm';

export default function Home() {
  const [step, setStep] = useState(1);
  const [patient, setPatient] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [booking, setBooking] = useState(null);

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
        <h1 style={{
          color: '#38bdf8',
          fontSize: '24px',
          fontWeight: '800',
          margin: 0
        }}>QMS</h1>
        <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>
          Queue Management System
        </p>
      </div>

      {/* Steps */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '32px'
      }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            width: '32px',
            height: '4px',
            borderRadius: '2px',
            background: step >= s ? '#38bdf8' : '#1e293b'
          }} />
        ))}
      </div>

      {/* Step 1 — Patient Identify */}
      {step === 1 && (
        <PatientIdentify
          onNext={(p) => { setPatient(p); setStep(2); }}
        />
      )}

      {/* Step 2 — Hospital + Department Select */}
      {step === 2 && (
        <HospitalSelect
          patient={patient}
          onNext={(dept) => { setSelectedDept(dept); setStep(3); }}
          onBack={() => setStep(1)}
        />
      )}

      {/* Step 3 — Booking Confirm */}
      {step === 3 && (
        <BookingConfirm
          patient={patient}
          department={selectedDept}
          onSuccess={(b) => { setBooking(b); setStep(4); }}
          onBack={() => setStep(2)}
        />
      )}

      {/* Step 4 — Booking Success */}
      {step === 4 && booking && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: '#38bdf8', fontSize: '20px' }}>Booking Confirmed</h2>
          <div style={{
            background: '#1e293b',
            borderRadius: '16px',
            padding: '24px',
            margin: '24px 0'
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
              marginTop: '24px',
              padding: '16px',
              background: '#0f172a',
              borderRadius: '12px'
            }}>
              <div style={{ color: '#64748b', fontSize: '12px' }}>ARRIVE BY</div>
              <div style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '700', marginTop: '4px' }}>
                {new Date(booking.eta_deadline).toLocaleTimeString('en-MY', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Kuala_Lumpur'
                })}
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', marginTop: '8px' }}>ETA</div>
              <div style={{ color: '#38bdf8', fontSize: '16px', fontWeight: '600', marginTop: '4px' }}>
                {new Date(booking.eta).toLocaleTimeString('en-MY', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Kuala_Lumpur'
                })}
              </div>
            </div>
            <div style={{
              marginTop: '16px',
              color: '#fbbf24',
              fontSize: '13px'
            }}>
              ⚠️ Late by 15 mins = ticket forfeited
            </div>
          </div>
          <button
            onClick={() => { setStep(1); setPatient(null); setBooking(null); }}
            style={{
              background: '#1e293b',
              color: '#94a3b8',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 32px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            New Booking
          </button>
        </div>
      )}
    </div>
  );
}