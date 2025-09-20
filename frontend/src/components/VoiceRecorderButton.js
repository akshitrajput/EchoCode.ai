import React, { useRef, useState, useCallback } from 'react';
import { FiMic, FiLoader } from 'react-icons/fi';

// Helper function to encode PCM data to a WAV file
// This is the core of the fix
function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 1, true); // Mono
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}


function VoiceRecorderButton({ onVoiceInput, loading, floating }) {
  const [recording, setRecording] = useState(false);
  
  // Refs for Web Audio API
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const pcmDataRef = useRef([]);
  const sampleRateRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      setRecording(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const context = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = context;
      sampleRateRef.current = context.sampleRate;
      
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1); // bufferSize, inputChannels, outputChannels
      processorRef.current = processor;

      pcmDataRef.current = [];

      processor.onaudioprocess = (e) => {
        // Get the raw PCM data
        const inputData = e.inputBuffer.getChannelData(0);
        const dataArray = new Float32Array(inputData);
        pcmDataRef.current.push(...dataArray);
      };

      source.connect(processor);
      processor.connect(context.destination);

    } catch (err) {
      console.error("Error starting recording:", err);
      setRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    setRecording(false);

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close().then(() => {
            audioContextRef.current = null;
            if (pcmDataRef.current.length > 0 && sampleRateRef.current) {
                const audioBlob = encodeWAV(pcmDataRef.current, sampleRateRef.current);
                onVoiceInput(audioBlob);
                pcmDataRef.current = [];
            }
        });
    }
  }, [onVoiceInput]);

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