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
      <div className="movie-title small">
        <div className="title-white-stack">
          <span className="title-serif all-my">ATTENDANCE</span>
          <span className="title-serif friends-are">ENTRY</span>
        </div>
        <div className="title-yellow-cheats">SCANNER</div>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--card-bg)', borderTop: '4px solid var(--accent-pink)' }}>
        {scanning ? (
          <div id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}></div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            {error ? (
              <div style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>ERROR</h3>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{error}</p>
              </div>
            ) : result?.loading ? (
              <p>Verifying booking...</p>
            ) : (
              <div style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#22c55e', marginBottom: '0.5rem' }}>SUCCESSFUL CHECK-IN</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>{result?.userEmail}</p>
                <p style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '1rem', paddingTop: '0.5rem' }}>
                  Date: {result?.showDate}<br />
                  Seats: {result?.seats}
                </p>
              </div>
            )}

            {result && !result.loading && (
               <div style={{ textAlign: 'left', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
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
