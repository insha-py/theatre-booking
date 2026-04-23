'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ScannerPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);
  const scannerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);

      function onScanSuccess(decodedText) {
        const cleanedId = decodedText?.trim();
        console.log("Scanned QR Content:", cleanedId);
        handleCheckIn(cleanedId);
        scanner.clear();
        setScanning(false);
      }

      function onScanFailure(_err) {}

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
        if (data.booking) {
          setResult({ success: false, ...data.booking, alreadyAttended: data.error === 'Already Checked In' });
        } else {
          setResult(null);
        }
      }
    } catch {
      setError('Connection error occurred');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      setSearchResults(data.bookings || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
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

      {/* Booking Search */}
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', marginTop: '2rem', backgroundColor: 'var(--card-bg)', borderTop: '4px solid var(--accent-blue)' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search Bookings</h3>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Name or email..."
            style={{
              flex: 1,
              padding: '0.6rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: 'inherit',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
          <button type="submit" className="button" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
            {searching ? '...' : 'Search'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {searchResults.map(b => (
              <div key={b.id} style={{
                padding: '0.9rem',
                borderRadius: '10px',
                border: `1px solid ${b.checkedIn ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                backgroundColor: b.checkedIn ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{b.userEmail}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    background: b.checkedIn ? '#22c55e' : '#64748b',
                    color: 'white',
                  }}>
                    {b.checkedIn ? 'CHECKED IN' : 'NOT YET'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  <p>{b.showDate} &mdash; {b.seats || 'No seat info'}</p>
                  {b.attendedAt && <p>Arrived: {new Date(b.attendedAt).toLocaleTimeString()}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {!searching && searchQuery && searchResults.length === 0 && (
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>No bookings found.</p>
        )}
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center', color: '#64748b' }}>
        <p style={{ fontSize: '0.8rem' }}>Scan the QR code from the user's booking confirmation.</p>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button onClick={() => window.location.href = '/'} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}>
            Back to Home
          </button>
          <a href="/api/admin/backup" download style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold' }}>
            ⬇ Backup Database
          </a>
        </div>
      </div>
    </div>
  );
}
