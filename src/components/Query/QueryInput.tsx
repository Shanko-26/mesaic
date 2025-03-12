import React, { useState } from 'react';

export interface QueryInputProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
  isDisabled?: boolean;
}

const QueryInput: React.FC<QueryInputProps> = ({ 
  onSubmit, 
  isLoading = false,
  isDisabled = false
}) => {
  const [query, setQuery] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading && !isDisabled) {
      onSubmit(query.trim());
    }
  };
  
  return (
    <div>
      <h4 className="text-sm font-medium mb-2 text-slate-700">Ask AI about your data</h4>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about your data (e.g., 'What is the maximum RPM?')"
          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 bg-white"
          rows={3}
          disabled={isLoading || isDisabled}
        />
        <button
          type="submit"
          disabled={!query.trim() || isLoading || isDisabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Ask AI'}
        </button>
        {isDisabled && (
          <p className="text-xs text-slate-500">
            Load a file to enable AI queries
          </p>
        )}
      </form>
    </div>
  );
};

export default QueryInput; 