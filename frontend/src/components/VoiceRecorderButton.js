import React, { useRef, useState } from 'react';
import { FiMic, FiLoader } from 'react-icons/fi';

function VoiceRecorderButton({ onVoiceInput, loading, floating }) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const silenceTimeoutRef = useRef(null);
  const maxTimeoutRef = useRef(null);

  const startRecording = async () => {
    setRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new window.MediaRecorder(stream);
    audioChunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = (e) => {
      audioChunksRef.current.push(e.data);
    };
    mediaRecorderRef.current.onstop = () => {
      clearTimeout(silenceTimeoutRef.current);
      clearTimeout(maxTimeoutRef.current);
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      onVoiceInput(audioBlob);
    };
    mediaRecorderRef.current.start();
    // Stop after 30s max
    maxTimeoutRef.current = setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        stopRecording();
      }
    }, 30000);
    // Simulate silence detection: stop after 5s (real silence detection needs more logic)
    silenceTimeoutRef.current = setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        stopRecording();
      }
    }, 5000);
  };

  const stopRecording = () => {
    setRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    clearTimeout(silenceTimeoutRef.current);
    clearTimeout(maxTimeoutRef.current);
  };

  // Animated waves (simple SVG)
  const waves = (
    <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0" width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r="30" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.3">
        <animate attributeName="r" values="30;38;30" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="40" cy="40" r="38" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.15">
        <animate attributeName="r" values="38;46;38" dur="1.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );

  if (floating) {
    return (
      <div className="relative flex items-center justify-center">
        {recording && waves}
        <button
          className={`bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center w-20 h-20 text-4xl border-4 border-blue-400 transition-all duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${recording ? 'animate-pulse shadow-blue-400' : ''}`}
          onClick={recording ? stopRecording : startRecording}
          disabled={loading}
          aria-label={recording ? 'Stop Recording' : 'Start Recording'}
          style={{ boxShadow: recording ? '0 0 32px 8px #3b82f6' : '0 8px 32px rgba(0,0,0,0.3)' }}
        >
          {loading ? <FiLoader className="animate-spin" /> : <FiMic />}
        </button>
      </div>
    );
  }

  return (
    <button
      className={`bg-blue-500 text-white px-4 py-2 rounded shadow flex items-center ${loading ? 'opacity-50' : ''}`}
      onClick={recording ? stopRecording : startRecording}
      disabled={loading}
    >
      {recording ? '🛑 Stop' : '🎤 Record'}
    </button>
  );
}

export default VoiceRecorderButton;
