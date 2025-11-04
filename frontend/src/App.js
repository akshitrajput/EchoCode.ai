import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import VoiceRecorderButton from './components/VoiceRecorderButton';
import ResultDisplay from './components/ResultDisplay'; // Make sure this is imported
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
  const [textInput, setTextInput] = useState('');
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
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');

      // 1. STT Call
      const sttRes = await fetch('/api/stt', {
        method: 'POST',
        body: formData,
      });

      const sttData = await sttRes.json();
      if (!sttRes.ok) {
        throw new Error(sttData.detail || 'Speech-to-text conversion failed.');
      }
      if (sttData.error) throw new Error(sttData.error);
      setChat((prev) => [...prev, { type: 'user', text: sttData.text }]);

      // 2. Translation (if needed)
      let queryText = sttData.text;
      if (sttData.language && sttData.language !== 'en') {
        // This assumes you have a /api/translate endpoint
        const transRes = await fetch('/api/translate', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sttData.text, target: 'en' })
        });
        if (!transRes.ok) throw new Error('Translation failed');
        
        const transData = await transRes.json();
        queryText = transData.translatedText; 
      }

      // 3. Generation Call
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      });
      const genData = await genRes.json();
      if (genData.error) throw new Error(genData.error);

      // 4. Add full response object to chat
      if (genData.explanation || genData.code) {
        setChat((prev) => [
          ...prev,
          {
            type: 'ai',
            explanation: genData.explanation,
            code: genData.code,
            language: genData.language || 'python'
          }
        ]);
      }

      // --- OLD LOGIC REMOVED ---
      // The word-by-word streaming loop that was here has been
      // removed, as it was conflicting with the logic above.
      // The GradualText component inside ResultDisplay handles streaming now.

    } catch (err) {
      setError(err.message || 'Error fetching result');
      // THIS IS THE NEW LINE:
      setChat((prev) => [
        ...prev,
        {
          type: 'ai',
          explanation: `Error: ${err.message}`, // Show the error
          code: null,
          language: 'bash'
        }
      ]);
    }
    setLoading(false);
  };

  const handleTextInput = async () => {
    if (!textInput.trim()) return;
    setLoading(true);
    setError('');
    const userQuery = textInput; // Store text input before clearing
    setTextInput(''); // Clear input immediately
    try {
      setChat((prev) => [...prev, { type: 'user', text: userQuery }]);
      
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery })
      });
      const genData = await genRes.json();
      if (genData.error) throw new Error(genData.error);

      // Add full response object to chat
      if (genData.explanation || genData.code) {
        setChat((prev) => [
          ...prev,
          {
            type: 'ai',
            explanation: genData.explanation,
            code: genData.code,
            language: genData.language || 'python'
          }
        ]);
      }
      
      // --- OLD LOGIC REMOVED ---
      // The word-by-word streaming loop that was here has been
      // removed, as it was conflicting with the logic above.

    } catch (err) {
      setError(err.message || 'Error fetching result');
      // THIS IS THE NEW LINE:
      setChat((prev) => [
        ...prev,
        {
          type: 'ai',
          explanation: `Error: ${err.message}`, // Show the error
          code: null,
          language: 'bash'
        }
      ]);
    }
    setLoading(false);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setChat((prev) => [...prev, { type: 'user', text: `Uploaded file: ${file.name}` }]);
    setError('File upload functionality is not implemented yet');
  };

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
      {/* Sidebar (with app_icon as close button) */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-500 overflow-hidden bg-gray-900 h-screen fixed top-0 left-0 z-40`}>
        {sidebarOpen && (
          <>
            <Sidebar
              open={sidebarOpen}
              onToggle={() => setSidebarOpen(o => !o)}
              sections={SIDEBAR_SECTIONS}
              onSectionClick={handleSectionClick}
              activeSection={section}
              className="h-full"
            />
          </>
        )}
      </div>

      {/* Main content and chat area */}
      <main
        className="flex-1 flex flex-col relative bg-transparent"
        style={{
          marginLeft: sidebarOpen ? 256 : 0,
          transition: 'margin-left 0.5s'
        }}
      >
        <div className="relative flex-1 flex">
          {/* Open sidebar button when closed */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="fixed top-4 left-4 z-50 w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-700 hover:bg-gray-700 transition"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <img
              src="/assets/app_icon.png"
              alt="Toggle Sidebar"
              className={`w-8 h-8 transform transition-transform duration-300 ${sidebarOpen ? 'rotate-0' : 'rotate-180'}`}
            />
          </button>

          <div className="flex-1 flex flex-col max-w-4xl mx-auto px-4 pt-4 pb-0 h-full" style={{ minHeight: 0 }}>
            {/* Header with logo and tagline */}
            <div className={`flex flex-col items-center text-center transition-all duration-700 ${headerAtTop ? 'pt-8' : 'pt-24'}`}>
              <img src="/assets/app_icon.png" alt="App Icon" className="w-16 h-16 md:w-20 md:h-20 mb-4 drop-shadow-lg" />
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight drop-shadow-lg">EchoCode.ai</h1>
              <p className="text-lg md:text-2xl text-gray-300 font-semibold mb-8 drop-shadow">
                Your voice-powered programming assistant. Ask for code, explanations, and more!
              </p>
            </div>
            
            {/* Scrollable chat area */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-2" style={{ marginBottom: 96 }}>
              {(section === 'home' || section === 'new') && (
                <div className="flex flex-col gap-2">
                  
                  {/* --- THIS IS THE CORRECTED RENDER LOGIC --- */}
                  {chat.map((msg, idx) => {
                    if (msg.type === 'user') {
                      return <ChatBubble key={idx} text={msg.text} type="user" />;
                    } else if (msg.type === 'ai') {
                      return (
                        <ResultDisplay
                          key={idx}
                          explanation={msg.explanation}
                          code={msg.code}
                          language={msg.language}
                        />
                      );
                    }
                    return null; // Fallback
                  })}
                  
                  <div ref={chatEndRef} />
                </div>
              )}
              {section === 'history' && (
                <div className="flex flex-col gap-2 bg-gray-900 bg-opacity-80 rounded-xl shadow-2xl p-8">
                  <h2 className="text-xl font-bold text-white mb-4">Chat History</h2>
                  
                  {/* --- THIS ALSO NEEDS TO BE UPDATED --- */}
                  {chat.length === 0 ? (
                    <div className="text-gray-400">No history yet.</div>
                  ) : (
                    chat.map((msg, idx) => {
                      if (msg.type === 'user') {
                        return <ChatBubble key={idx} text={msg.text} type="user" />;
                      } else if (msg.type === 'ai') {
                        return (
                          <ResultDisplay
                            key={idx}
                            explanation={msg.explanation}
                            code={msg.code}
                            language={msg.language}
                          />
                        );
                      }
                      return null;
                    })
                  )}
                  
                </div>
              )}
              {section === 'about' && (
                <div className="flex flex-col gap-2 bg-gray-900 bg-opacity-80 rounded-xl shadow-2xl p-8">
                  <h2 className="text-xl font-bold text-white mb-4">About EchoCode.ai</h2>
                  <p className="text-gray-300">
                    EchoCode.ai is your voice-powered programming assistant. Ask for code, explanations, and more using natural speech!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input Bar (fixed bottom, left adjusts with sidebar) */}
        {(section === 'home' || section === 'new') && (
          <div
            className="fixed bottom-4 right-4 flex items-center gap-2 bg-gray-800 bg-opacity-90 p-3 rounded-full shadow-xl z-50 max-w-4xl backdrop-blur-sm border border-gray-600 mx-auto"
            style={{
              left: sidebarOpen ? 256 : 0,
              transition: 'left 0.5s',
              height: 56,
            }}
          >
            <label
              htmlFor="file-upload"
              className="cursor-pointer p-2 rounded-full hover:bg-gray-700 transition-colors duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              <input id="file-upload" type="file" className="hidden" onChange={handleFileInput} />
            </label>
            <div className="flex-1 flex items-center bg-gray-700 rounded-full px-4 py-2 border border-gray-600">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
                placeholder="Type your message here..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400"
                disabled={loading}
              />
              <button
                onClick={handleTextInput}
                disabled={loading || !textInput.trim()}
                className="ml-2 p-1 rounded-full hover:bg-gray-600 transition-colors duration-300 disabled:opacity-50"
              >
                {/* Send Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="ml-2">
              <VoiceRecorderButton onVoiceInput={handleVoiceInput} loading={loading} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;