import React, { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiCopy } from 'react-icons/fi'; // --- NEW: Import copy icon ---
import { HiCheck } from 'react-icons/hi'; // --- NEW: Import check icon for "Copied!" ---

// This function cleans Markdown AND LaTeX for both display and speech
const cleanText = (text) => {
  if (!text) return '';
  let cleanText = text;
  cleanText = cleanText.replace(/\$([^\$]*)\$/g, '$1');
  cleanText = cleanText.replace(/\\times/g, '×');
  cleanText = cleanText.replace(/\\[a-zA-Z]+/g, ' ');
  cleanText = cleanText.replace(/```[\s\S]*?```/g, ' (code block) ');
  cleanText = cleanText.replace(/`/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, '').replace(/\[.*?\]\(.*?\)/g, ' (link) ').replace(/#/g, '');
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  return cleanText;
};

// This helper finds the best installed voice
const findBestVoice = (allVoices, targetLang) => {
  if (!targetLang || allVoices.length === 0) return null;
  const exactLang = `${targetLang}-${targetLang.toUpperCase()}`;
  let bestVoice = allVoices.find(v => v.lang === exactLang);
  if (bestVoice) return bestVoice;
  bestVoice = allVoices.find(v => v.lang.startsWith(targetLang));
  if (bestVoice) return bestVoice;
  return null;
};

function ResultDisplay({ explanation, code, language, originalLang }) {
  
  const [voices, setVoices] = useState([]);
  const [isCopied, setIsCopied] = useState(false); // --- NEW: State for copy button ---
  const cleanedExplanation = cleanText(explanation);

  // Load system voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) setVoices(availableVoices);
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, []);

  
  // Handle speech synthesis
  useEffect(() => {
    if (cleanedExplanation && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(cleanedExplanation);
      const targetLang = originalLang || 'en';
      if (voices.length > 0) {
        const bestVoice = findBestVoice(voices, targetLang);
        if (bestVoice) {
          utterance.voice = bestVoice;
          utterance.lang = bestVoice.lang;
        } else {
          utterance.lang = targetLang === 'en' ? 'en-US' : `${targetLang}-IN`;
        }
      } else {
        utterance.lang = targetLang === 'en' ? 'en-US' : `${targetLang}-IN`;
      }
      utterance.rate = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [cleanedExplanation, originalLang, voices]);

  // --- NEW: Function to handle copying to clipboard ---
  const handleCopy = () => {
    if (!code) return; // Don't run if there is no code
    
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      // Reset the "Copied!" text after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy code: ', err);
    });
  };

  return (
    <div className="mt-6 w-full max-w-4xl bg-gray-800 rounded-lg shadow-xl p-6 text-left animate-fade-in">
      
      {cleanedExplanation && (
        <div className="mb-4">
          <span className="font-semibold text-white text-lg">Explanation:</span>
          <div className="text-gray-200 mt-2 whitespace-pre-wrap">
            {cleanedExplanation}
          </div>
        </div>
      )}

      {code && (
        <div>
          <span className="font-semibold text-white text-lg">Code:</span>
          
          {/* --- MODIFIED: Wrapper div to position the copy button --- */}
          <div className="relative mt-2">
            
            {/* --- NEW: The Copy Button --- */}
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 z-10 p-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition-all"
              aria-label="Copy code"
            >
              {isCopied ? (
                <HiCheck className="text-green-400" size={18} /> // Show checkmark when copied
              ) : (
                <FiCopy size={18} /> // Show copy icon
              )}
            </button>

            <SyntaxHighlighter 
              language={language || 'python'} 
              style={oneDark} 
              className="rounded-md" // Note: className applies to the outer wrapper
              showLineNumbers={true}
              wrapLines={true}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultDisplay;