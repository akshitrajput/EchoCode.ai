import React, { useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// We removed the GradualText component as it conflicts with 
// the speech synthesis, which reads the whole text at once.

function ResultDisplay({ explanation, code, language }) {
  
  // This hook handles all the speech synthesis logic
  useEffect(() => {
    // Make sure we have an explanation and the browser supports speech
    if (explanation && 'speechSynthesis' in window) {
      
      // 1. Create the speech "utterance"
      const utterance = new SpeechSynthesisUtterance(explanation);
      
      // 2. Configure it (optional, but good for quality)
      utterance.lang = 'en-US'; // Force English voice
      utterance.rate = 1.0; // Normal speed
      
      // 3. Stop any speech that is currently playing (IMPORTANT)
      window.speechSynthesis.cancel();
      
      // 4. Speak the new explanation
      window.speechSynthesis.speak(utterance);
    }

    // This is a cleanup function
    // It runs when the component is unmounted (e.g., user starts a new chat)
    return () => {
      // Stop speaking if the component is removed
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [explanation]); // This hook re-runs ONLY when the 'explanation' prop changes

  return (
    <div className="mt-6 w-full max-w-4xl bg-gray-800 rounded-lg shadow-xl p-6 text-left animate-fade-in">
      
      {/* This is the new Explanation section. 
        It's no longer wrapped in <GradualText>.
      */}
      {explanation && (
        <div className="mb-4">
          <span className="font-semibold text-white text-lg">Explanation:</span>
          <div className="text-gray-200 mt-2 whitespace-pre-wrap">
            {explanation}
          </div>
        </div>
      )}

      {/* This Code section remains the same */}
      {code && (
        <div>
          <span className="font-semibold text-white text-lg">Code:</span>
          <SyntaxHighlighter 
            language={language || 'python'} 
            style={oneDark} 
            className="rounded-md mt-2"
            showLineNumbers={true}
            wrapLines={true}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}

export default ResultDisplay;