import React, { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

function GradualText({ text, speed = 30 }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    if (!text) return;
    let i = 0;
    const words = text.split(' ');
    const interval = setInterval(() => {
      if (i < words.length) {
        setDisplayed((prev) => prev + (prev ? ' ' : '') + words[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return <div>{displayed}</div>;
}

function ResultDisplay({ explanation, code, language }) {
  return (
    <div className="mt-6 w-full max-w-xl bg-gray-800 rounded shadow p-4">
      <div className="mb-2">
        <span className="font-semibold text-white text-lg">Explanation:</span>
        <div className="text-gray-200 mt-1">
          <GradualText text={explanation} speed={40} />
        </div>
      </div>
      <div>
        <span className="font-semibold text-white text-lg">Code:</span>
        <SyntaxHighlighter language={language || 'python'} style={oneDark} className="rounded mt-2">
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default ResultDisplay;
