import React, { useEffect, useRef, useState } from 'react';
import { socket } from './socket';
import './App.css';

// Generate a unique color for each username
function getUserColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 70%, 55%)`;
  return color;
}

function App() {
  const [username, setUsername] = useState('');
  const [inputName, setInputName] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState('');
  const [notification, setNotification] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showActiveDropdown, setShowActiveDropdown] = useState(false); // For mobile/tablet active users dropdown
  const notificationTimeout = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (username) {
      socket.connect();
      socket.emit('join', username);
    }
    return () => socket.disconnect();
  }, [username]);

  useEffect(() => {
    socket.on('message', (data) => {
      setMessages((prev) => [...prev, data]);
      setTypingUser(''); // Clear typing indicator on new message
    });
    socket.on('online-users', setOnlineUsers);
    socket.on('typing', (user) => {
      setTypingUser(user);
      // Remove typing indicator after 2s if no new typing event
      setTimeout(() => setTypingUser(''), 2000);
    });
    socket.on('notification', (msg) => {
      setNotification(msg);
      if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
      notificationTimeout.current = setTimeout(() => setNotification(''), 3000);
    });
    return () => {
      socket.off('message');
      socket.off('online-users');
      socket.off('typing');
      socket.off('notification');
      if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit('message', { user: username, text: message, time: new Date().toLocaleTimeString() });
      setMessage('');
      setTypingUser('');
    }
  };

  const handleTyping = () => {
    socket.emit('typing', username);
  };

  const handleLogout = () => {
    setUsername('');
    setInputName('');
    setShowDropdown(false);
    setMessages([]);
    setOnlineUsers([]);
  };

  if (!username) {
    return (
      <div className="login-container">
        <h2>Enter your username</h2>
        <form onSubmit={e => { e.preventDefault(); setUsername(inputName); }}>
          <input value={inputName} onChange={e => setInputName(e.target.value)} placeholder="Username" required />
          <button type="submit">Join Chat</button>
        </form>
      </div>
    );
  }

  return (
    <div className="chat-app">
      <aside className="sidebar">
        {/* Removed unused sidebar dropdown placeholder for mobile */}
        <ul className="user-list">
          {onlineUsers.map((user, i) => (
            <li key={i} className="user-list-item">
              <span className="user-avatar" style={{ background: getUserColor(user) }}>
                {user[0]?.toUpperCase() || '?'}
              </span>
              <span className="user-list-name" style={{ color: getUserColor(user), fontWeight: user === username ? 700 : 500 }}>
                {user}
              </span>
              <span className="user-status-dot" style={{ background: user === username ? '#00e676' : '#bdbdbd' }}></span>
            </li>
          ))}
        </ul>
      </aside>
      <main className="chat-main">
        <header className="chat-header" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.7rem 0.5rem 0.7rem', margin: 0, borderBottom: '1px solid #e0e7ff', background: '#fff', position: 'relative', top: 0, left: 0, right: 0 }}>
          <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700, lineHeight: 1.2, letterSpacing: '0.2px', flex: 1 }}>Global Chat Room</h2>
          {/* Active users dropdown for <=800px screens, now inside header */}
          <div
            className={`active-users-dropdown-container${showActiveDropdown ? ' open' : ''}`}
            data-open={showActiveDropdown}
            style={{ display: 'block', margin: 0, padding: 0 }}
          >
            <button
              className="active-users-dropdown-label"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={showActiveDropdown}
              onClick={() => setShowActiveDropdown(v => !v)}
              style={{
                background: '#6366f1',
                color: '#fff',
                borderRadius: 12,
                minWidth: 70,
                minHeight: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 15,
                border: 'none',
                boxShadow: '0 2px 8px #6366f133',
                marginLeft: 10,
                marginRight: 0,
                zIndex: 10001,
                position: 'relative',
              }}
            >
              Active
            </button>
            {showActiveDropdown && (
              <ul
                className="active-users-list"
                style={{
                  background: '#6366f1',
                  position: 'absolute',
                  top: 44,
                  right: 0,
                  minWidth: 160,
                  width: 200,
                  maxWidth: '90vw',
                  borderRadius: 14,
                  boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18), 0 4px 24px #6366f133',
                  zIndex: 99999,
                  padding: '0.5rem 0.2rem',
                  display: 'block',
                  maxHeight: 220,
                  overflowY: 'auto',
                  border: '2px solid #6366f1',
                  outline: 'none',
                  textAlign: 'left',
                  margin: '8px 0 0 0',
                  boxSizing: 'border-box',
                }}
              >
                {onlineUsers.length === 0 && (
                  <li className="user-list-item" style={{ color: '#fff', textAlign: 'center', padding: '0.5rem' }}>No users online</li>
                )}
                {onlineUsers.map((user, i) => (
                  <li key={i} className="user-list-item" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.3rem 0.7rem', borderRadius: 10, color: '#fff', border: 'none', marginBottom: 2, background: 'transparent' }}>
                    <span className="user-avatar" style={{ background: getUserColor(user), border: '2px solid #fff', width: 24, height: 24, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginRight: 8 }}>
                      {user[0]?.toUpperCase() || '?'}
                    </span>
                    <span className="user-list-name" style={{ color: '#fff', fontWeight: 600, textShadow: '0 1px 2px #6366f188', fontSize: 13, textTransform: 'capitalize' }}>{user}</span>
                    <span className="user-status-dot" style={{ background: user === username ? '#00e676' : '#bdbdbd', width: 8, height: 8, borderRadius: '50%', marginLeft: 'auto', border: '1.5px solid #fff' }}></span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: 0, marginTop: 0 }}>
            <span
              className="user"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowDropdown((v) => !v)}
            >
              {username}
              <svg style={{ marginLeft: 8, verticalAlign: 'middle', width: 16, height: 16 }} width={16} height={16} fill="none" stroke="#6366f1" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
            </span>
            {showDropdown && (
              <div style={{ position: 'absolute', right: 0, top: '2.5rem', background: '#fff', border: '1px solid #e0e7ff', borderRadius: 8, boxShadow: '0 2px 8px #6366f133', zIndex: 10 }}>
                <button style={{ padding: '0.7rem 1.5rem', background: 'none', border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer', width: '100%', fontSize: '1.1rem' }} onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </header>
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`msg${msg.user === username ? ' own' : ''}`}>
              <span className="sender" style={{ color: msg.user === username ? '#e0e7ff' : getUserColor(msg.user) }}>{msg.user}</span>
              <span className="text">{msg.text}</span>
              <span className="time">{msg.time}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {notification && <div className="notification">{notification}</div>}
        {typingUser && typingUser !== username && (
          <div className="typing">{typingUser} is typing...</div>
        )}
        <form className="input-form" onSubmit={handleSend}>
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onInput={handleTyping}
            placeholder="Type a message..."
            required
          />
          <button type="submit">Send</button>
        </form>
      </main>
    </div>
  );
}

export default App;
