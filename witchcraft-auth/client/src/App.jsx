import { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

const magicalIngredients = [
  { id: 'salt', emoji: '🧂', name: 'Sea Salt' },
  { id: 'sage', emoji: '🌿', name: 'Dried Sage' },
  { id: 'amethyst', emoji: '🔮', name: 'Amethyst' },
  { id: 'candle', emoji: '🕯️', name: 'Black Candle' },
  { id: 'moon', emoji: '💧', name: 'Moon Water' },
  { id: 'bone', emoji: '🦴', name: 'Animal Bone' }
];

export default function App() {
  const [view, setView] = useState('login'); 
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  const cauldronRef = useRef(null);
  const [flyingItems, setFlyingItems] = useState([]);

  const [email, setEmail] = useState('');
  const [magicalName, setMagicalName] = useState('');
  const [ritualSequence, setRitualSequence] = useState([]);
  const [confirmRitualSequence, setConfirmRitualSequence] = useState([]);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleIngredientClick = (item, e) => {
    const btnRect = e.currentTarget.getBoundingClientRect();
    
    const cauldronRect = cauldronRef.current?.getBoundingClientRect();

    if (cauldronRect) {
      const startX = btnRect.left + btnRect.width / 2 - 20; 
      const startY = btnRect.top + btnRect.height / 2 - 20;
      const endX = cauldronRect.left + cauldronRect.width / 2 - 20;
      const endY = cauldronRect.top + cauldronRect.height / 2 + 20; // Aim for the belly of the pot


      const flyingId = Date.now() + Math.random();
      setFlyingItems(prev => [...prev, { id: flyingId, emoji: item.emoji, startX, startY, endX, endY }]);

      setTimeout(() => {
        setFlyingItems(prev => prev.filter(f => f.id !== flyingId));
        addToCauldron(item.id);
      }, 1500);
    } else {
      addToCauldron(item.id);
    }
  };

 const addToCauldron = (id) => {
    if (isConfirming) {
      if (confirmRitualSequence.length >= 6) return;
      setConfirmRitualSequence(prev => [...prev, id]);
    } else {
      if (ritualSequence.length >= 6) return; 
      setRitualSequence(prev => [...prev, id]);
    }
  };

  const clearCauldron = () => {
    if (isConfirming) setConfirmRitualSequence([]);
    else setRitualSequence([]);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/initiate', {
        email, magicalName, ritualSequence, confirmRitualSequence
      });
      setMessage(res.data.message);
      setIsError(false);
      setView('login');
      setRitualSequence([]);
      setConfirmRitualSequence([]);
      setIsConfirming(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Spell failed.");
      setIsError(true); 
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/cast', { email, ritualSequence });
      setMessage(`Welcome back, ${res.data.magicalName}!`);
      setIsError(false);
      setView('dashboard');
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed.");
      setIsError(true);
      setRitualSequence([]);
    }
  };

  const renderCauldron = (sequence, label) => (
    <div className="cauldron-container">
      <h3>🧪 {label}</h3>
      <div className="cauldron-pot" ref={cauldronRef}>
        {sequence.length === 0 ? <p className="empty-text">Empty...</p> : 
          sequence.map((id, i) => {
            const item = magicalIngredients.find(ing => ing.id === id);
            return <span key={i} className="cauldron-item">{item.emoji}</span>;
          })
        }
      </div>
      {sequence.length > 0 && <button type="button" onClick={clearCauldron} className="clear-btn">Clear Cauldron</button>}
    </div>
  );

  if (view === 'dashboard') {
    return (
      <div className="app-container dashboard">
        <h2>📖 The Ancient Grimoire</h2>
        <p className="success-msg">{message}</p>
        <div className="secret-content">
          <p>✨ Secret Spell: Turn water into coffee by debugging CSS at 3 AM.</p>
        </div>
        <button onClick={() => { setView('login'); setRitualSequence([]); setMessage(''); }} className="action-btn">Close Grimoire</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <h2>☾ Witchcraft Auth ☾</h2>
      {message && <div className={`message-box ${isError ? 'error-msg' : 'success-msg'}`}>{message}</div>}

      <div className="tabs">
        <button type="button" className={view === 'login' ? 'active' : ''} onClick={() => {setView('login'); setMessage(''); setRitualSequence([]);}}>Cast Spell (Login)</button>
        <button type="button" className={view === 'register' ? 'active' : ''} onClick={() => {setView('register'); setMessage(''); setRitualSequence([]); setIsConfirming(false);}}>Initiate (Register)</button>
      </div>

      <form onSubmit={view === 'login' ? handleLogin : handleRegister}>
        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
        
        {view === 'register' && (
          <input type="text" placeholder="Magical Name" value={magicalName} onChange={e => setMagicalName(e.target.value)} required />
        )}

        <div className="ingredients-grid">
          {magicalIngredients.map(item => (
            <button type="button" key={item.id} className="ingredient-btn" onClick={(e) => handleIngredientClick(item, e)}>
              <span className="emoji">{item.emoji}</span>
              <span className="name">{item.name}</span>
            </button>
          ))}
        </div>

        {view === 'register' ? (
          <>
            <div className="toggle-cauldron">
              <button type="button" className={!isConfirming ? 'active-step' : ''} onClick={() => setIsConfirming(false)}>1. Create Ritual</button>
              <button type="button" className={isConfirming ? 'active-step' : ''} onClick={() => setIsConfirming(true)}>2. Confirm Ritual</button>
            </div>
            {!isConfirming ? renderCauldron(ritualSequence, "Create Your Ritual (Min 4)") : renderCauldron(confirmRitualSequence, "Confirm Your Ritual")}
            <button type="submit" className="action-btn">Bind to Grimoire</button>
          </>
        ) : (
          <>
            {renderCauldron(ritualSequence, "Recreate Your Ritual")}
            <button type="submit" className="action-btn">Cast Login Spell</button>
          </>
        )}
      </form>

      {flyingItems.map(item => (
        <div key={item.id} className="flying-item" style={{
          '--startX': `${item.startX}px`,
          '--startY': `${item.startY}px`,
          '--endX': `${item.endX}px`,
          '--endY': `${item.endY}px`
        }}>
          {item.emoji}
        </div>
      ))}
    </div>
  );
}