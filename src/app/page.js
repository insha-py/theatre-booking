'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1); // 1: Login, 3: Seats, 4: Payment, 5: Success
  const [loading, setLoading] = useState(false);
  
  // Seat state
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  // Booking state
  const [bookingDetails, setBookingDetails] = useState(null);

  // Auto login if session exists
  useEffect(() => {
    if (status === 'authenticated') {
      setStep(3);
    } else if (status === 'unauthenticated') {
      setStep(1);
    }
  }, [status]);

  // Initial fetch for seats when we reach step 3
  useEffect(() => {
    if (step === 3 && status === 'authenticated') {
      fetchSeats();
      const interval = setInterval(fetchSeats, 5000); // Poll every 5s for updates
      return () => clearInterval(interval);
    }
  }, [step, status]);

  const fetchSeats = async () => {
    try {
      const res = await fetch('/api/seats');
      const data = await res.json();
      if (data.seats) setSeats(data.seats);
    } catch(err) {}
  };



  const toggleSeat = (id, status) => {
    if (status !== 'AVAILABLE') return;
    if (selectedSeats.includes(id)) {
      setSelectedSeats(prev => prev.filter(s => s !== id));
    } else {
      if (selectedSeats.length >= 2) {
        alert("You can only select up to 2 seats.");
        return;
      }
      setSelectedSeats(prev => [...prev, id]);
    }
  };

  const handleBookSeats = async () => {
    if (selectedSeats.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/seats/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatIds: selectedSeats })
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
            {row.map(s => (
              <div 
                key={s.id} 
                className={`seat ${s.status === 'AVAILABLE' ? '' : s.status.toLowerCase()} ${selectedSeats.includes(s.id) ? 'selected' : ''}`}
                onClick={() => toggleSeat(s.id, s.status)}
                title={`Middle Row ${s.row} Seat ${s.number}`}
              ></div>
            ))}
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
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}>
      {step === 1 && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px' }}>
          
          {/* Main Title Outside the Box */}
          <div className="movie-title">
            <div className="title-white-stack">
              <span className="title-serif all-my">ALL MY</span>
              <span className="title-serif friends-are">FRIENDS ARE</span>
            </div>
            <div className="title-yellow-cheats">CHEATS</div>
          </div>

          {/* Login Box */}
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', zIndex: 10 }}>
            {status === 'loading' ? (
              <p style={{ textAlign: 'center', color: '#94a3b8' }}>Loading secure session...</p>
            ) : (
              <>
                <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#94a3b8', fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                  SIGN UP
                </p>
                <button onClick={() => signIn('google')} className="button" style={{ fontWeight: 'bold' }}>
                  SIGN UP
                </button>
              </>
            )}
          </div>

          {/* Character Posters Row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '3rem', width: '100%' }}>
            {['maya', 'bedi', 'noor', 'rv', 'zara'].map((name) => (
              <img 
                key={name}
                src={`/${name}.png`} 
                alt={name} 
                style={{ 
                  width: 'calc(20% - 0.5rem)', 
                  minWidth: '60px',
                  maxWidth: '120px',
                  borderRadius: '6px', 
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)', 
                  objectFit: 'cover',
                  aspectRatio: '2/3',
                  filter: 'grayscale(30%) sepia(20%)',
                  transition: 'transform 0.3s'
                }} 
                onMouseOver={e=>e.currentTarget.style.transform='scale(1.05)'}
                onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}
              />
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-fade-in" style={{width: '100%', maxWidth: '1200px'}}>
          <div className="movie-title small">
            <div className="title-white-stack">
              <span className="title-serif all-my">SELECT YOUR</span>
              <span className="title-serif friends-are">THEATRE</span>
            </div>
            <div className="title-yellow-cheats">SEATS</div>
          </div>
          <p style={{textAlign: 'center', color: '#94a3b8', marginBottom: '1rem'}}>Selected: {selectedSeats.length}/2</p>

          <div className="glass-panel" style={{padding: '1.2rem'}}>
            <div className="screen"></div>
            
            {seats.length > 0 ? (
              <div className="theatre-wrapper">
                <div className="theatre-layout">
                  {renderLeft()}
                  <div className="gap-divider">
                    <div className="exit-gate" title="Exit">EXIT</div>
                  </div>
                  {renderMiddle()}
                  <div className="gap-divider">
                    <div className="exit-gate" title="Exit">EXIT</div>
                  </div>
                  {renderRight()}
                </div>
              </div>
            ) : (
              <div style={{textAlign: 'center', padding: '2rem'}}>Loading map...</div>
            )}

            <div className="legend">
              <div className="legend-item"><div className="legend-box" style={{backgroundColor: 'var(--seat-available)'}}></div> Available</div>
              <div className="legend-item"><div className="legend-box" style={{backgroundColor: 'var(--seat-selected)'}}></div> Selected</div>
              <div className="legend-item"><div className="legend-box" style={{backgroundColor: 'var(--seat-booked)'}}></div> Booked</div>
            </div>

            <div style={{marginTop: '1.5rem', display: 'flex', justifyContent: 'center'}}>
              <button 
                className="button" 
                style={{maxWidth: '300px'}} 
                disabled={selectedSeats.length === 0 || loading}
                onClick={handleBookSeats}
              >
                {loading ? 'Processing...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}



      {step === 5 && (
        <div className="glass-panel animate-fade-in" style={{width: '100%', maxWidth: '400px', textAlign: 'center'}}>
          <h2 style={{marginBottom: '1.5rem', color: '#10b981'}}>Booking Confirmed!</h2>
          <p style={{marginBottom: '2rem', color: '#94a3b8'}}>Present this QR code at the entrance.</p>
          
          <div style={{background: 'white', padding: '1rem', borderRadius: '12px', display: 'inline-block', marginBottom: '2rem'}}>
            {bookingDetails?.qrCode && (
              <img src={bookingDetails.qrCode} alt="Your Ticket QR" width={200} height={200} />
            )}
          </div>
          
          <button 
            className="button" 
            onClick={() => { setStep(3); setSelectedSeats([]); setBookingDetails(null); }}
          >
            Book More
          </button>
        </div>
      )}

    </div>
  );
}
