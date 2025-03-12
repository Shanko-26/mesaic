import React from 'react';

interface ResultsProps {
  query?: string;
  answer?: string;
  error?: string;
  isLoading?: boolean;
}

const Results: React.FC<ResultsProps> = ({
  query,
  answer,
  error,
  isLoading = false
}) => {
  if (!query && !answer && !error && !isLoading) {
    return null;
  }

  return (
    <div className="border-t border-slate-200 overflow-y-auto max-h-[200px]">
      {isLoading && (
        <div className="flex items-center justify-center p-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-slate-600 text-sm">Processing your query...</span>
        </div>
      )}
      
      {query && !isLoading && (
        <div className="p-2">
          <h4 className="text-xs font-medium mb-1 text-slate-500">Your Query</h4>
          <div className="p-2 bg-slate-100 rounded text-sm">
            <p className="text-slate-800">{query}</p>
          </div>
        </div>
      )}
      
      {answer && !isLoading && (
        <div className="p-2">
          <h4 className="text-xs font-medium mb-1 text-slate-500">Answer</h4>
          <div className="p-2 bg-blue-50 border border-blue-100 rounded text-sm">
            <p className="text-slate-800 whitespace-pre-line">{answer}</p>
          </div>
        </div>
      )}
      
      {error && !isLoading && (
        <div className="p-2">
          <h4 className="text-xs font-medium mb-1 text-slate-500">Error</h4>
          <div className="p-2 bg-red-50 border border-red-100 rounded text-sm">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results; 