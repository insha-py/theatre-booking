'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import { signIn, signOut, useSession } from 'next-auth/react';
import html2canvas from 'html2canvas';

export default function Home() {
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1); // 1: Login, 2: Date Selection, 3: Seats, 4: View Booking, 5: Success
  const [loading, setLoading] = useState(false);
  
  // Date state
  const [selectedDate, setSelectedDate] = useState(null); // '2026-04-25' or '2026-04-26'

  // Seat state
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  // Booking state
  const [bookingDetails, setBookingDetails] = useState(null);
  
  // User bookings state
  const [userBookings, setUserBookings] = useState([]);
  const [viewingBooking, setViewingBooking] = useState(null);

  // Auto login/redirect logic
  useEffect(() => {
    if (status === 'authenticated') {
      if (step === 1) setStep(2);
    } else if (status === 'unauthenticated') {
      setStep(1);
    }
  }, [status, step]);

  // Fetch user bookings when reaching step 2
  useEffect(() => {
    if (step === 2 && status === 'authenticated') {
      fetchUserBookings();
    }
  }, [step, status]);

  // Initial fetch for seats when we reach step 3
  useEffect(() => {
    if (step === 3 && status === 'authenticated' && selectedDate) {
      fetchSeats();
      const interval = setInterval(fetchSeats, 5000); // Poll every 5s for updates
      return () => clearInterval(interval);
    }
  }, [step, status, selectedDate]);

  const fetchSeats = async () => {
    if (!selectedDate) return;
    try {
      const res = await fetch(`/api/seats?date=${selectedDate}`);
      const data = await res.json();
      if (data.seats) setSeats(data.seats);
    } catch(err) {
      console.error('Fetch error:', err);
    }
  };

  const fetchUserBookings = async () => {
    try {
      const res = await fetch('/api/bookings/user');
      const data = await res.json();
      if (data.bookings) {
        setUserBookings(data.bookings);
      }
    } catch(err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const getBookingForDate = (date) => {
    return userBookings.find(b => b.showDate === date);
  };

  const toggleSeat = (id, seatStatus) => {
    if (seatStatus !== 'AVAILABLE') return;
    if (selectedSeats.includes(id)) {
      setSelectedSeats(prev => prev.filter(s => s !== id));
    } else {
      setSelectedSeats([id]); // Only allow 1 seat, replace any existing
    }
  };

  const handleBookSeats = async () => {
    if (selectedSeats.length === 0 || !selectedDate) return;
    setLoading(true);
    try {
      const res = await fetch('/api/seats/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatIds: selectedSeats, showDate: selectedDate })
      });
      const data = await res.json();
      if (res.ok) {
        setBookingDetails(data);
        setStep(5);
      } else {
        alert(data.error || 'Failed to book seats');
        fetchSeats();
        setSelectedSeats([]);
      }
    } catch(err) {
      alert('Network issue booking seats');
    }
    setLoading(false);
  };

  const handleDownloadTicket = async () => {
    const ticketElement = document.getElementById('ticket-card-id');
    if (!ticketElement) return;
    try {
      const canvas = await html2canvas(ticketElement, { 
        backgroundColor: '#ffffff', 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Theatre-Ticket-${bookingDetails?.userEmail || 'booked'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download ticket', err);
    }
  };

  // Rendering Sections
  const renderLeft = () => {
    const leftSeats = seats.filter(s => s.section === 'LEFT');
    const rows = [];
    for(let r=1; r<=3; r++) {
      rows.push(leftSeats.filter(s => s.row === r).sort((a,b) => a.number - b.number));
    }
    return (
      <div className="section section-left">
        {rows.map((row, i) => (
          <div key={`left-r${i}`} className="row bench-row">
            <span className="row-label lead">{String.fromCharCode(65 + i)}</span>
            {row.map(s => (
              <div 
                key={s.id} 
                className={`seat ${s.status === 'AVAILABLE' ? '' : s.status.toLowerCase()} ${selectedSeats.includes(s.id) ? 'selected' : ''}`}
                onClick={() => toggleSeat(s.id, s.status)}
                title={`Left Row ${s.row} Seat ${s.number}`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderMiddle = () => {
    const middleSeats = seats.filter(s => s.section === 'MIDDLE');
    const rows = [];
    for(let r=1; r<=5; r++) {
      rows.push(middleSeats.filter(s => s.row === r).sort((a,b) => a.number - b.number));
    }
    return (
      <div className="section section-middle">
        {rows.map((row, i) => (
          <div key={`mid-r${i}`} className="row bench-row">
            <span className="row-label">{String.fromCharCode(65 + i)}</span>
            {row.map(s => (
              <div 
                key={s.id} 
                className={`seat ${s.status === 'AVAILABLE' ? '' : s.status.toLowerCase()} ${selectedSeats.includes(s.id) ? 'selected' : ''}`}
                onClick={() => toggleSeat(s.id, s.status)}
                title={`Middle Row ${s.row} Seat ${s.number}`}
              ></div>
            ))}
            <span className="row-label">{String.fromCharCode(65 + i)}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderRight = () => {
    const rightSeats = seats.filter(s => s.section === 'RIGHT');
    const rows = [];
    for(let r=1; r<=3; r++) {
      rows.push(rightSeats.filter(s => s.row === r).sort((a,b) => a.number - b.number));
    }
    return (
      <div className="section section-right">
        {rows.map((row, i) => (
          <div key={`right-r${i}`} className="row bench-row">
            {row.map(s => (
              <div 
                key={s.id} 
                className={`seat ${s.status === 'AVAILABLE' ? '' : s.status.toLowerCase()} ${selectedSeats.includes(s.id) ? 'selected' : ''}`}
                onClick={() => toggleSeat(s.id, s.status)}
                title={`Right Row ${s.row} Seat ${s.number}`}
              ></div>
            ))}
            <span className="row-label end">{String.fromCharCode(65 + i)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}>
      {step === 1 && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '800px', flex: 1 }}>
          <div className="three-line-title">
            <span className="three-line-1">All My</span>
            <span className="three-line-2">Friends Are</span>
            <span className="three-line-3">Cheats</span>
          </div>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', zIndex: 10, borderTop: '3px solid var(--primary)', backgroundColor: 'var(--card-bg)' }}>
            {status === 'loading' ? (
              <p style={{ textAlign: 'center', color: 'var(--accent-blue)' }}>Loading secure session...</p>
            ) : (
              <>
                <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase' }}>
                  ASHOKA UNIVERSITY ACCESS
                </p>
                <button onClick={() => signIn('google')} className="button">
                  PROCEED WITH ASHOKA EMAIL
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px' }}>
          <div className="three-line-title">
            <span className="three-line-1">Select</span>
            <span className="three-line-2">Your</span>
            <span className="three-line-3">Date</span>
          </div>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', zIndex: 10 }}>
            <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#94a3b8', fontSize: '1rem', fontWeight: 'bold', letterSpacing: '1px' }}>
              SATURDAY OR SUNDAY?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button 
                  onClick={() => { setSelectedDate('2026-04-25'); setStep(3); }} 
                  className="button"
                  style={{ background: 'rgba(0,0,0,0.03)', color: 'var(--accent-blue)', border: '1px solid var(--primary)', textAlign: 'left', padding: '1.5rem' }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.2rem' }}>25th April</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>SATURDAY</div>
              </button>
                <button 
                  onClick={() => { setSelectedDate('2026-04-26'); setStep(3); }} 
                  className="button"
                  style={{ background: 'rgba(0,0,0,0.03)', color: 'var(--accent-blue)', border: '1px solid var(--primary)', textAlign: 'left', padding: '1.5rem' }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.2rem' }}>26th April</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>SUNDAY</div>
              </button>
              <button 
                onClick={() => signOut()} 
                style={{ marginTop: '1rem', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-fade-in" style={{width: '100%', maxWidth: '1200px'}}>
          <div className="three-line-title">
            <span className="three-line-1">Select</span>
            <span className="three-line-2">Your</span>
            <span className="three-line-3">Seat</span>
          </div>
          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem'}}>
             <button onClick={() => setStep(2)} style={{background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
               ← Change Date
             </button>
             <p style={{textAlign: 'center', color: '#94a3b8'}}>Selected: {selectedSeats.length}/1</p>
             {getBookingForDate(selectedDate) && (
               <button 
                 onClick={() => { setViewingBooking(getBookingForDate(selectedDate)); setStep(4); }} 
                 className="button"
                 style={{ background: 'rgba(156, 25, 88, 0.1)', color: 'var(--primary)', border: '1px solid var(--primary)', fontSize: '0.85rem', padding: '0.6rem 1rem' }}
               >
                 📋 View My Ticket
               </button>
             )}
          </div>

          <div className="theatre-container-boxless" style={{padding: '1.2rem'}}>
            <div className="screen"></div>
            
            {seats.length > 0 ? (
              <div className="theatre-wrapper">
                <div className="theatre-floor">
                  <div className="theatre-layout">
                    {renderLeft()}
                    <div className="aisle">
                      <div className="exit-gate" title="Exit">EXIT</div>
                    </div>
                    {renderMiddle()}
                    <div className="aisle">
                      <div className="exit-gate" title="Exit">EXIT</div>
                    </div>
                    {renderRight()}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{textAlign: 'center', padding: '2rem'}}>Loading map for {selectedDate}...</div>
            )}

            <div className="legend">
              <div className="legend-item"><div className="legend-box" style={{backgroundColor: 'var(--seat-available)'}}></div> Available</div>
              <div className="legend-item"><div className="legend-box" style={{backgroundColor: 'var(--seat-selected)'}}></div> Selected</div>
              <div className="legend-item"><div className="legend-box" style={{backgroundColor: 'var(--seat-booked)'}}></div> Booked</div>
            </div>

            <div style={{marginTop: '2.5rem', display: 'flex', justifyContent: 'center'}}>
              <div className="glass-panel" style={{padding: '1.5rem', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <button 
                  className="button" 
                  disabled={selectedSeats.length === 0 || loading}
                  onClick={handleBookSeats}
                >
                  {loading ? 'Processing...' : 'Confirm Booking'}
                </button>
                <p style={{fontSize: '0.7rem', color: '#64748b', marginTop: '0.8rem', textAlign: 'center'}}>
                  Max 1 seat per show. You are booking for {selectedDate === '2026-04-25' ? 'Saturday' : 'Sunday'}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="animate-fade-in" style={{width: '100%', maxWidth: '500px', margin: '0 auto'}}>
          <div 
            style={{
              textAlign: 'center', 
              padding: '2.5rem', 
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="three-line-title" style={{marginBottom: '0'}}>
              <h2 className="three-line-3">YOUR TICKET</h2>
            </div>
            
            <div className="ticket-card" style={{marginBottom: '2rem', textAlign: 'left', padding: '1.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid rgba(156, 25, 88, 0.1)'}}>
              <p style={{color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1.2rem', letterSpacing: '1px', borderBottom: '1px solid rgba(156, 25, 88, 0.1)', paddingBottom: '0.5rem'}}>Booking Details</p>
              
              <div style={{marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap'}}>
                <div>
                  <p style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.2rem'}}>Show Date:</p>
                  <p style={{fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-blue)'}}>{viewingBooking?.showDate === '2026-04-25' ? '25th April (Saturday)' : '26th April (Sunday)'}</p>
                </div>
                <div>
                  <p style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.2rem'}}>Email:</p>
                  <p style={{fontSize: '0.9rem', color: 'var(--accent-blue)', wordBreak: 'break-all'}}>{viewingBooking?.userEmail}</p>
                </div>
              </div>

              <div style={{marginTop: '1rem'}}>
                <p style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.8rem'}}>Your Seats:</p>
                {viewingBooking?.seats && Array.isArray(viewingBooking.seats) && viewingBooking.seats.length > 0 ? (
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.8rem'}}>
                    {viewingBooking.seats.map((s, i) => (
                      <div key={i} style={{background: 'rgba(156, 25, 88, 0.05)', border: '1px solid var(--primary)', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
                        <span style={{fontWeight: 'bold', color: 'var(--primary)'}}>{s.section}</span> • <span style={{color: 'var(--accent-blue)'}}>Row {s.row}</span> • <span style={{color: 'var(--accent-blue)'}}>Seat {s.number}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>{viewingBooking?.seats}</p>
                )}
              </div>

              <div style={{marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(156, 25, 88, 0.1)'}}>
                <p style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem'}}>Booked on:</p>
                <p style={{fontSize: '0.9rem', color: 'var(--accent-blue)'}}>{new Date(viewingBooking?.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {viewingBooking?.qrCode && (
              <div style={{background: 'white', padding: '1rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1rem', boxShadow: '0 0 20px rgba(0,0,0,0.1)'}}>
                <img 
                  src={viewingBooking.qrCode} 
                  alt="Your Ticket QR" 
                  width={220} 
                  height={220} 
                  style={{display: 'block'}} 
                  crossOrigin="anonymous" 
                />
              </div>
            )}

            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem'}}>
              <button 
                className="button" 
                style={{background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)'}}
                onClick={() => { setStep(2); setViewingBooking(null); }}
              >
                ← Back to Dates
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="animate-fade-in" style={{width: '100%', maxWidth: '500px', margin: '0 auto'}}>
          <div 
            id="ticket-card-id" 
            style={{
              textAlign: 'center', 
              padding: '2.5rem', 
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="three-line-title" style={{marginBottom: '0'}}>
              <h2 className="three-line-3">BOOKED!</h2>
            </div>
            
            <div className="ticket-card" style={{marginBottom: '2rem', textAlign: 'left', padding: '1.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid rgba(156, 25, 88, 0.1)'}}>
              <p style={{color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1.2rem', letterSpacing: '1px', borderBottom: '1px solid rgba(156, 25, 88, 0.1)', paddingBottom: '0.5rem'}}>Booking Details</p>
              
              <div style={{marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap'}}>
                <div>
                  <p style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.2rem'}}>Show Date:</p>
                  <p style={{fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-blue)'}}>{selectedDate === '2026-04-25' ? '25th April (Saturday)' : '26th April (Sunday)'}</p>
                </div>
                <div style={{minWidth: '150px'}}>
                  <p style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.2rem'}}>Booked By:</p>
                  <p style={{fontSize: '0.9rem', color: 'var(--accent-blue)', wordBreak: 'break-all'}}>{bookingDetails?.userEmail}</p>
                </div>
              </div>

              <div style={{marginTop: '1rem'}}>
                <p style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.8rem'}}>Selected Seats:</p>
                {bookingDetails?.seats && Array.isArray(bookingDetails.seats) ? (
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.8rem'}}>
                    {bookingDetails.seats.map((s, i) => (
                      <div key={i} style={{background: 'rgba(156, 25, 88, 0.05)', border: '1px solid var(--primary)', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
                        <span style={{fontWeight: 'bold', color: 'var(--primary)'}}>{s.section}</span> • <span style={{color: 'var(--accent-blue)'}}>Row {s.row}</span> • <span style={{color: 'var(--accent-blue)'}}>Seat {s.number}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>{bookingDetails?.seats}</p>
                )}
              </div>
            </div>

            <div style={{background: 'white', padding: '1rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1rem', boxShadow: '0 0 20px rgba(0,0,0,0.1)'}}>
              {bookingDetails?.qrCode && (
                <img 
                  src={bookingDetails.qrCode} 
                  alt="Your Ticket QR" 
                  width={220} 
                  height={220} 
                  style={{display: 'block'}} 
                  crossOrigin="anonymous" 
                />
              )}
            </div>
            
            <p style={{color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem'}}>Present this QR code at the entrance.</p>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem'}}>
            <button 
              className="button"
              style={{ padding: '1rem', fontSize: '1.2rem', boxShadow: '0 4px 15px rgba(156, 25, 88, 0.3)' }}
              onClick={handleDownloadTicket}
            >
              ⬇ DOWNLOAD TICKET
            </button>
            <div style={{display: 'flex', gap: '1rem'}}>
              <button 
                className="button" 
                style={{flex: 1, background: 'rgba(0,0,0,0.05)', color: 'var(--accent-blue)'}}
                onClick={() => { setStep(3); setSelectedSeats([]); setBookingDetails(null); }}
              >
                More for {selectedDate === '2026-04-25' ? 'Sat' : 'Sun'}
              </button>
              <button 
                className="button" 
                style={{flex: 1, background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)'}}
                onClick={() => { setStep(2); setSelectedSeats([]); setBookingDetails(null); }}
              >
                Other Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
