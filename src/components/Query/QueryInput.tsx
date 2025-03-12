import React, { useState } from 'react';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
}

const QueryInput: React.FC<QueryInputProps> = ({ onSubmit, isLoading = false }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query);
    }
  };

  return (
    <div className="p-3">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="mb-2">
          <label htmlFor="query" className="block text-sm font-medium mb-1 text-slate-700">
            Ask a question about your data
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., What is the maximum RPM recorded?"
                className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all text-sm"
                disabled={isLoading}
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className={`px-3 py-2 rounded-md text-white font-medium transition-colors text-sm ${
                !query.trim() || isLoading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-sm'
              }`}
            >
              {isLoading ? 'Processing...' : 'Submit'}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Try asking about max/min values, correlations, or specific time points (e.g., "What's the engine temp at 5310ms?")
          </p>
        </div>
      </form>
    </div>
  );
};

export default QueryInput; 