'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Script from 'next/script';

export default function Home() {
  const [step, setStep] = useState(1); // 1: Login, 3: Seats, 4: Payment, 5: Success
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Seat state
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  // Booking state
  const [bookingDetails, setBookingDetails] = useState(null);

  // Initial fetch for seats when we reach step 3
  useEffect(() => {
    if (step === 3) {
      fetchSeats();
      const interval = setInterval(fetchSeats, 5000); // Poll every 5s for updates
      return () => clearInterval(interval);
    }
  }, [step]);

  const fetchSeats = async () => {
    try {
      const res = await fetch('/api/seats');
      const data = await res.json();
      if (data.seats) setSeats(data.seats);
    } catch(err) {}
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setStep(3); // Direct transition to seats map
      } else {
        const { error } = await res.json();
        alert(error || 'Error logging in');
      }
    } catch(err) {
      alert('Internal error');
    }
    setLoading(false);
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
    let rows = [];
    for(let r=1; r<=4; r++) {
      rows.push(leftSeats.filter(s => s.row === r).sort((a,b) => a.number - b.number));
    }
    return (
      <div className="section">
        {rows.map((row, i) => (
          <div key={`left-r${i}`} className="row">
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
    let rows = [];
    for(let r=1; r<=6; r++) {
      rows.push(middleSeats.filter(s => s.row === r).sort((a,b) => a.number - b.number));
    }
    return (
      <div className="section">
        {rows.map((row, i) => (
          <div key={`mid-r${i}`} className="row">
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
    let rows = [];
    for(let r=1; r<=4; r++) {
      rows.push(rightSeats.filter(s => s.row === r).sort((a,b) => a.number - b.number));
    }
    return (
      <div className="section">
        {rows.map((row, i) => (
          <div key={`right-r${i}`} className="row">
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
          
          {/* Poster Image */}
          <img 
            src="/poster.png" 
            alt="All My Friends Are Cheaters" 
            style={{ width: '100%', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', objectFit: 'cover' }} 
          />

          {/* Main Title Outside the Box */}
          <h2 className="glitch-title" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
            ALL MY FRIENDS ARE CHEATERS
          </h2>

          {/* Login Box */}
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
            <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#94a3b8' }}>
              Enter your Ashoka email to enter.
            </p>
            <form onSubmit={handleLogin}>
              <input 
                type="email" 
                className="input-field" 
                placeholder="user@ashoka.edu.in" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="button" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-fade-in" style={{width: '100%', maxWidth: '1000px'}}>
          <h2 className="glitch-title">Select Your Seats</h2>
          <p style={{textAlign: 'center', color: '#94a3b8', marginBottom: '2rem'}}>Selected: {selectedSeats.length}/2</p>

          <div className="glass-panel">
            <div className="screen"></div>
            
            {seats.length > 0 ? (
              <div className="theatre-wrapper">
                <div className="theatre-layout">
                  {renderLeft()}
                  {renderMiddle()}
                  {renderRight()}
                </div>
              </div>
            ) : (
              <div style={{textAlign: 'center', padding: '2rem'}}>Loading map...</div>
            )}

            <div className="legend">
              <div className="legend-item"><div className="legend-box" style={{backgroundColor: 'var(--seat-available)'}}></div> Available</div>
              <div className="legend-item"><div className="legend-box" style={{backgroundColor: 'var(--seat-selected)'}}></div> Selected</div>
              <div className="legend-item"><div className="legend-box" style={{backgroundColor: 'var(--seat-locked)'}}></div> In Cart (Locked)</div>
              <div className="legend-item"><div className="legend-box" style={{backgroundColor: 'var(--seat-booked)'}}></div> Booked</div>
            </div>

            <div style={{marginTop: '3rem', display: 'flex', justifyContent: 'center'}}>
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
