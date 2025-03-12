import React from 'react';
import { getSuggestedQueries } from '../../services/ai';
import { FileData } from '../../services/file';
import { QueryContext } from '../../services/ai';

interface SuggestedQueriesProps {
  fileData?: FileData;
  context?: QueryContext;
  onSelectQuery: (query: string) => void;
}

const SuggestedQueries: React.FC<SuggestedQueriesProps> = ({
  fileData,
  context,
  onSelectQuery
}) => {
  // Get suggested queries based on the current file and visualization state
  const suggestions = getSuggestedQueries(fileData, context);
  
  if (!fileData || suggestions.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-4">
      <h5 className="text-xs font-medium text-slate-500 mb-2">Suggested questions</h5>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((query, index) => (
          <button
            key={index}
            onClick={() => onSelectQuery(query)}
            className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQueries; 