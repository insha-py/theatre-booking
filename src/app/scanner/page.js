'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ScannerPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);

      function onScanSuccess(decodedText) {
        // Success callback: decodedText is the bookingId
        const cleanedId = decodedText?.trim();
        console.log("Scanned QR Content:", cleanedId);
        handleCheckIn(cleanedId);
        scanner.clear();
        setScanning(false);
      }

      function onScanFailure(err) {
        // We don't necessarily want to alert every frame failure
        // console.warn(`Code scan error = ${err}`);
      }

      return () => {
        scanner.clear().catch(e => console.error("Scanner cleanup error", e));
      };
    }
  }, [scanning]);

  const handleCheckIn = async (bookingId) => {
    setResult({ loading: true });
    setError(null);

    try {
      const response = await fetch('/api/bookings/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, ...data.booking });
      } else {
        setError(data.error || 'Check-in failed');
        // If it was already checked in, we still have the booking details in data.booking
        if (data.booking) {
          setResult({ success: false, ...data.booking, alreadyAttended: data.error === 'Already Checked In' });
        } else {
          setResult(null);
        }
      }
    } catch (err) {
      setError('Connection error occurred');
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
      <div className="three-line-title">
        <span className="three-line-1">Attendance</span>
        <span className="three-line-2">Entry</span>
        <span className="three-line-3">Scanner</span>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--card-bg)', borderTop: '4px solid var(--accent-pink)' }}>
        {scanning ? (
          <div id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}></div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            {error ? (
              <div style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>ERROR</h3>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#b91c1c' }}>{error}</p>
              </div>
            ) : result?.loading ? (
              <p>Verifying booking...</p>
            ) : (
              <div style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: 'rgba(34, 197, 94, 0.05)', border: '1px solid #22c55e', marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#16a34a', marginBottom: '0.5rem' }}>SUCCESSFUL CHECK-IN</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-blue)', wordBreak: 'break-all', overflowWrap: 'break-word' }}>{result?.userEmail}</p>
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', marginTop: '1rem', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{result?.showDate}</p>
                  <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <p style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Assigned Seats</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{result?.seats}</p>
                  </div>
                </div>
              </div>
            )}

            {result && !result.loading && (
               <div style={{ textAlign: 'left', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.5rem', wordBreak: 'break-all' }}>
                 <p>User: {result.userEmail}</p>
                 <p>Show: {result.showDate}</p>
               </div>
            )}

            <button className="button" onClick={() => { setScanning(true); setResult(null); setError(null); }}>
              SCAN NEXT TICKET
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center', color: '#64748b' }}>
        <p style={{ fontSize: '0.8rem' }}>Scan the QR code from the user's booking confirmation.</p>
        <button onClick={() => window.location.href = '/'} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', marginTop: '1rem', cursor: 'pointer', textDecoration: 'underline' }}>
          Back to Home
        </button>
      </div>
    </div>
  );
}
