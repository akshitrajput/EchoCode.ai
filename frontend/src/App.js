import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import VoiceRecorderButton from './components/VoiceRecorderButton';
import './App.css';

function ChatBubble({ text, type }) {
  return (
    <div className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-lg px-5 py-3 rounded-2xl shadow-lg text-base font-medium break-words ${type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-100'} animate-fade-in`} style={{ fontFamily: 'Poppins, sans-serif' }}>
        {text}
      </div>
    </div>
  );
}

const SIDEBAR_SECTIONS = [
  { key: 'home', label: 'Home' },
  { key: 'new', label: 'New Chat' },
  { key: 'history', label: 'History' },
  { key: 'about', label: 'About' },
];

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chat, setChat] = useState(() => JSON.parse(localStorage.getItem('echocode_chat')) || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [section, setSection] = useState('home');
  const chatEndRef = useRef(null);
  const [headerAtTop, setHeaderAtTop] = useState(false);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    localStorage.setItem('echocode_chat', JSON.stringify(chat));
    if (chat.length > 0) setHeaderAtTop(true);
  }, [chat]);

  const handleVoiceInput = async (audioBlob) => {
    setLoading(true);
    setError('');
    try {
      // Send audio to backend /stt
      const sttRes = await fetch('/api/stt', {
        method: 'POST',
        body: audioBlob
      });
      const sttData = await sttRes.json();
      if (sttData.error) throw new Error(sttData.error);
      setChat((prev) => [...prev, { type: 'user', text: sttData.text }]);
      // Send text to backend /generate
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sttData.text })
      });
      const genData = await genRes.json();
      if (genData.error) throw new Error(genData.error);
      // Gradually reveal AI response
      let aiText = '';
      const words = genData.explanation.split(' ');
      for (let i = 0; i < words.length; i++) {
        aiText += (i === 0 ? '' : ' ') + words[i];
        setChat((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.type === 'ai') {
            return [...prev.slice(0, -1), { type: 'ai', text: aiText }];
          } else {
            return [...prev, { type: 'ai', text: aiText }];
          }
        });
        await new Promise((r) => setTimeout(r, 40));
      }
      // Add code as a separate bubble
      setChat((prev) => [...prev, { type: 'ai', text: genData.code }]);
    } catch (err) {
      setError(err.message || 'Error fetching result');
    }
    setLoading(false);
  };

  // Sidebar navigation handler
  const handleSectionClick = (key) => {
    setSection(key);
    if (key === 'new') {
      setChat([]);
      setHeaderAtTop(false);
      localStorage.setItem('echocode_chat', JSON.stringify([]));
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} sections={SIDEBAR_SECTIONS} onSectionClick={handleSectionClick} activeSection={section} />
      <main className="flex-1 flex flex-col items-center justify-start p-0 relative">
        <div className={`w-full flex flex-col items-center transition-all duration-700 ${headerAtTop ? 'pt-8 pb-2' : 'justify-center pt-24 pb-8'} md:pt-16 md:pb-4`} style={{ position: headerAtTop ? 'relative' : 'absolute', top: headerAtTop ? 0 : '25%', left: headerAtTop ? 0 : '50%', transform: headerAtTop ? 'none' : 'translate(-50%, -25%)', width: '100%' }}>
          <img src="/assets/app_icon.png" alt="App Icon" className="w-16 h-16 md:w-20 md:h-20 mb-4 drop-shadow-lg" />
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight drop-shadow-lg text-center">EchoCode.ai</h1>
          <p className="text-lg md:text-2xl text-gray-300 font-semibold mb-8 drop-shadow text-center">Your voice-powered programming assistant. Ask for code, explanations, and more!</p>
        </div>
        {(section === 'home' || section === 'new') && (
          <div className="w-full max-w-2xl flex flex-col gap-2 bg-transparent rounded-xl shadow-none p-0 mt-2 overflow-y-auto flex-1" style={{ minHeight: '300px', maxHeight: '60vh' }}>
            {chat.length === 0 ? null : chat.map((msg, idx) => (
              <ChatBubble key={idx} text={msg.text} type={msg.type} />
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
        {section === 'history' ? (
          <div className="w-full max-w-2xl flex flex-col gap-2 bg-gray-900 bg-opacity-80 rounded-xl shadow-2xl p-8 mt-2 overflow-y-auto flex-1" style={{ minHeight: '300px', maxHeight: '60vh' }}>
            <h2 className="text-xl font-bold text-white mb-4">Chat History</h2>
            {chat.length === 0 ? <div className="text-gray-400">No history yet.</div> : chat.map((msg, idx) => (
              <ChatBubble key={idx} text={msg.text} type={msg.type} />
            ))}
          </div>
        ) : null}
        {section === 'about' ? (
          <div className="w-full max-w-2xl flex flex-col gap-2 bg-gray-900 bg-opacity-80 rounded-xl shadow-2xl p-8 mt-2">
            <h2 className="text-xl font-bold text-white mb-4">About EchoCode.ai</h2>
            <p className="text-gray-300">EchoCode.ai is your voice-powered programming assistant. Ask for code, explanations, and more using natural speech!</p>
          </div>
        ) : null}
        {error && <div className="text-red-500 mt-2 font-bold">{error}</div>}
        {/* Absolutely centered mic button at bottom of main content area */}
        {(section === 'home' || section === 'new') && (
          <div className="absolute left-1/2 bottom-20 md:bottom-10 transform -translate-x-1/2 z-50">
            <VoiceRecorderButton onVoiceInput={handleVoiceInput} loading={loading} floating />
          </div>
        )}
        {/* Footer removed as requested */}
      </main>
    </div>
  );
}

export default App;
