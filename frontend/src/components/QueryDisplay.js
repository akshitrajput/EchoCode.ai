import React from 'react';

function QueryDisplay({ query }) {
  if (!query) return null;
  return (
    <div className="mt-4 p-2 bg-white rounded shadow w-full max-w-xl">
      <span className="font-semibold">Recognized Query:</span>
      <div className="text-gray-700 mt-1">{query}</div>
    </div>
  );
}

export default QueryDisplay;
