import React from 'react';

interface ResultsProps {
  query?: string;
  answer?: string;
  error?: string;
  isLoading?: boolean;
  metadata?: {
    visualizationBase64?: string;
    calculations?: any;
    confidence?: number;
    [key: string]: any;
  };
}

const Results: React.FC<ResultsProps> = ({
  query,
  answer,
  error,
  isLoading = false,
  metadata
}) => {
  if (!query && !answer && !error && !isLoading) {
    return null;
  }

  // Format calculations for display
  const formatCalculations = (calculations: any) => {
    if (!calculations) return null;
    
    return (
      <div className="mt-3 border-t border-slate-200 pt-2">
        <h4 className="text-xs font-medium mb-1 text-slate-500">Calculations</h4>
        <div className="text-xs text-slate-700">
          {Object.entries(calculations).map(([signal, data]: [string, any]) => (
            <div key={signal} className="mb-2">
              <div className="font-medium">{signal}</div>
              {data.description && <div>{data.description}</div>}
              {data.error && <div className="text-red-500">{data.error}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="border-t border-slate-200 overflow-y-auto max-h-[400px]">
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
          <h4 className="text-xs font-medium mb-1 text-slate-500">
            Answer
            {metadata?.confidence !== undefined && (
              <span className="ml-2 text-xs text-slate-400">
                (Confidence: {(metadata.confidence * 100).toFixed(0)}%)
              </span>
            )}
          </h4>
          <div className="p-2 bg-blue-50 border border-blue-100 rounded text-sm">
            <p className="text-slate-800 whitespace-pre-line">{answer}</p>
            
            {/* Display visualization if available */}
            {metadata?.visualizationBase64 && (
              <div className="mt-3 border-t border-blue-100 pt-2">
                <h4 className="text-xs font-medium mb-1 text-slate-500">Visualization</h4>
                <img 
                  src={`data:image/png;base64,${metadata.visualizationBase64}`} 
                  alt="Data visualization" 
                  className="w-full rounded border border-slate-200 bg-white"
                />
              </div>
            )}
            
            {/* Display calculations if available */}
            {metadata?.calculations && formatCalculations(metadata.calculations)}
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